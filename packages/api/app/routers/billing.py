from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.dependencies import get_active_user, get_db
from app.exceptions import BadRequestException
from app.models.enums import Plan
from app.models.subscription import Subscription
from app.models.user import User
from app.rate_limiter import limiter
from app.schemas.billing import (
    CancelSubscriptionResponse,
    ChangePlanRequest,
    CreateCheckoutSessionRequest,
    CreateCheckoutSessionResponse,
    InvoiceResponse,
    ReactivateSubscriptionResponse,
    SubscriptionResponse,
)

# Optional stripe import - allows tests to run without stripe installed
try:
    import stripe
    from stripe import StripeError
except ImportError:
    stripe = None  # type: ignore[assignment]

    class StripeError(Exception):  # noqa: N818
        """Stub when stripe package is not installed."""

        user_message: str = ""

if TYPE_CHECKING:
    import stripe as stripe_module

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/billing", tags=["billing"])

PLAN_HIERARCHY: dict[str, int] = {
    "free": 0,
    "starter": 1,
    "team": 2,
    "enterprise": 3,
}

PRICE_MAP: dict[tuple[str, str], str] = {
    ("starter", "month"): "STRIPE_PRICE_STARTER_MONTHLY",
    ("starter", "year"): "STRIPE_PRICE_STARTER_YEARLY",
    ("team", "month"): "STRIPE_PRICE_TEAM_MONTHLY",
    ("team", "year"): "STRIPE_PRICE_TEAM_YEARLY",
}


def _resolve_price_id(plan: str, interval: str) -> str:
    """Look up the Stripe price ID from settings for the given plan+interval."""
    settings = get_settings()
    config_key = PRICE_MAP.get((plan, interval))
    if config_key is None:
        raise BadRequestException(f"No price configured for plan={plan}, interval={interval}")
    price_id: str = getattr(settings, config_key, "")
    if not price_id:
        raise BadRequestException(f"Stripe price ID not configured for {config_key}")
    return price_id


def _init_stripe() -> None:
    """Set the Stripe API key from settings."""
    if stripe is None:
        raise BadRequestException("Stripe is not installed. Please install the stripe package.")
    settings = get_settings()
    stripe.api_key = settings.STRIPE_SECRET_KEY


async def _get_or_create_customer(user: User, db: AsyncSession) -> str:
    """Return existing Stripe customer ID or create a new one."""
    if user.stripe_customer_id:
        return user.stripe_customer_id

    _init_stripe()
    try:
        customer = stripe.Customer.create(
            email=user.email,
            name=user.name,
            metadata={"user_id": str(user.id)},
        )
    except StripeError as e:
        logger.error("Stripe error creating customer for user %s: %s", user.id, e)
        raise BadRequestException(f"Failed to create billing customer: {e.user_message or str(e)}")
    user.stripe_customer_id = customer.id
    await db.commit()
    return customer.id


@router.post("/create-checkout-session", response_model=CreateCheckoutSessionResponse)
@limiter.limit("5/minute")
async def create_checkout_session(
    request: Request,
    body: CreateCheckoutSessionRequest,
    user: User = Depends(get_active_user),
    db: AsyncSession = Depends(get_db),
) -> CreateCheckoutSessionResponse:
    """Create a Stripe Checkout Session for subscribing to a paid plan."""
    if user.stripe_subscription_id and user.subscription_status == "active":
        raise BadRequestException("You already have an active subscription. Use change-plan instead.")

    customer_id = await _get_or_create_customer(user, db)
    price_id = _resolve_price_id(body.plan, body.billing_interval)

    _init_stripe()
    settings = get_settings()
    try:
        session = stripe.checkout.Session.create(
            customer=customer_id,
            mode="subscription",
            ui_mode="hosted",
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=f"{settings.FRONTEND_URL}/settings/billing?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.FRONTEND_URL}/settings/billing",
            metadata={"user_id": str(user.id), "plan": body.plan},
        )
    except StripeError as e:
        logger.error("Stripe error creating checkout session: %s", e)
        raise BadRequestException(f"Failed to create checkout: {e.user_message or str(e)}")
    checkout_url = getattr(session, "url", None)
    if not checkout_url:
        raise BadRequestException("Stripe checkout URL was not returned by Stripe.")
    return CreateCheckoutSessionResponse(
        checkout_url=checkout_url,
        client_secret=session.client_secret or "",
        session_id=session.id,
    )


@router.post("/change-plan", response_model=SubscriptionResponse)
@limiter.limit("5/minute")
async def change_plan(
    request: Request,
    body: ChangePlanRequest,
    user: User = Depends(get_active_user),
    db: AsyncSession = Depends(get_db),
) -> SubscriptionResponse:
    """Change subscription plan (upgrade or downgrade)."""
    current_level = PLAN_HIERARCHY.get(user.plan.value, 0)
    new_level = PLAN_HIERARCHY.get(body.new_plan, 0)

    if current_level == new_level:
        raise BadRequestException("You are already on this plan.")

    _init_stripe()

    is_upgrade = new_level > current_level

    if body.new_plan == "free":
        return await _downgrade_to_free(user, db)

    if not user.stripe_subscription_id:
        raise BadRequestException("No active subscription found. Create a checkout session first.")

    interval = body.billing_interval or "month"
    new_price_id = _resolve_price_id(body.new_plan, interval)

    try:
        sub = stripe.Subscription.retrieve(user.stripe_subscription_id)
        subscription_item_id = sub["items"]["data"][0]["id"]

        if is_upgrade:
            # Prorated upgrade: credit unused time on old plan, start new billing
            # cycle now. E.g. Starter→Team on day 15/30: credit ~50% of Starter,
            # charge full Team price for a new period starting today.
            updated_sub = stripe.Subscription.modify(
                user.stripe_subscription_id,
                items=[{"id": subscription_item_id, "price": new_price_id}],
                proration_behavior="always_invoice",
                billing_cycle_anchor="now",
            )
        else:
            # Downgrade between paid plans: takes effect immediately, no proration
            updated_sub = stripe.Subscription.modify(
                user.stripe_subscription_id,
                items=[{"id": subscription_item_id, "price": new_price_id}],
                proration_behavior="none",
            )
    except StripeError as e:
        logger.error("Stripe error during plan change: %s", e)
        raise BadRequestException(f"Failed to change plan: {e.user_message or str(e)}")

    # Update user plan for both upgrades and downgrades
    old_plan = user.plan
    user.plan = Plan(body.new_plan)
    user.subscription_status = updated_sub.status

    if is_upgrade:
        user.previous_plan = None
        user.plan_downgraded_at = None
    else:
        user.previous_plan = old_plan.value
        user.plan_downgraded_at = datetime.now(timezone.utc)

    period_end_ts = getattr(updated_sub, "current_period_end", None)
    if period_end_ts:
        user.plan_expires_at = datetime.fromtimestamp(period_end_ts, tz=timezone.utc)

    await db.commit()

    return _build_subscription_response(user, updated_sub)


@router.post("/cancel-subscription", response_model=CancelSubscriptionResponse)
@limiter.limit("5/minute")
async def cancel_subscription(
    request: Request,
    user: User = Depends(get_active_user),
    db: AsyncSession = Depends(get_db),
) -> CancelSubscriptionResponse:
    """Cancel subscription at the end of the current billing period."""
    if not user.stripe_subscription_id:
        raise BadRequestException("No active subscription to cancel.")

    _init_stripe()
    try:
        updated_sub = stripe.Subscription.modify(
            user.stripe_subscription_id,
            cancel_at_period_end=True,
        )
    except StripeError as e:
        logger.error("Stripe error during cancel for user %s: %s", user.id, e)
        raise BadRequestException(f"Failed to cancel subscription: {e.user_message or str(e)}")

    user.cancel_at_period_end = True

    # Also update the Subscription record so GET /subscription returns correct state
    sub_result = await db.execute(
        select(Subscription).where(
            Subscription.stripe_subscription_id == user.stripe_subscription_id
        )
    )
    sub_record = sub_result.scalar_one_or_none()
    if sub_record is not None:
        sub_record.cancel_at_period_end = True

    await db.commit()

    # Safely extract period end — prevents TypeError if Stripe returns None
    period_end_ts = getattr(updated_sub, "current_period_end", None)
    cancel_at = (
        datetime.fromtimestamp(period_end_ts, tz=timezone.utc)
        if period_end_ts
        else user.plan_expires_at
    )
    return CancelSubscriptionResponse(
        message="Subscription will be canceled at the end of the billing period.",
        cancel_at=cancel_at,
    )


@router.post("/reactivate-subscription", response_model=ReactivateSubscriptionResponse)
@limiter.limit("5/minute")
async def reactivate_subscription(
    request: Request,
    user: User = Depends(get_active_user),
    db: AsyncSession = Depends(get_db),
) -> ReactivateSubscriptionResponse:
    """Reactivate a subscription that was set to cancel at period end."""
    if not user.stripe_subscription_id:
        raise BadRequestException("No subscription to reactivate.")
    if not user.cancel_at_period_end:
        raise BadRequestException("Subscription is not set to cancel.")

    _init_stripe()
    try:
        stripe.Subscription.modify(
            user.stripe_subscription_id,
            cancel_at_period_end=False,
        )
    except StripeError as e:
        logger.error("Stripe error during reactivate for user %s: %s", user.id, e)
        raise BadRequestException(f"Failed to reactivate: {e.user_message or str(e)}")

    user.cancel_at_period_end = False

    # Also update the Subscription record
    sub_result = await db.execute(
        select(Subscription).where(
            Subscription.stripe_subscription_id == user.stripe_subscription_id
        )
    )
    sub_record = sub_result.scalar_one_or_none()
    if sub_record is not None:
        sub_record.cancel_at_period_end = False

    await db.commit()

    return ReactivateSubscriptionResponse(
        message="Subscription reactivated successfully.",
        plan=user.plan.value,
        status=user.subscription_status or "active",
    )


@router.get("/subscription", response_model=SubscriptionResponse)
async def get_subscription(
    user: User = Depends(get_active_user),
    db: AsyncSession = Depends(get_db),
) -> SubscriptionResponse:
    """Get current subscription information."""
    result = await db.execute(
        select(Subscription)
        .where(Subscription.user_id == user.id)
        .order_by(Subscription.created_at.desc())
        .limit(1)
    )
    subscription = result.scalar_one_or_none()

    if subscription is None:
        return SubscriptionResponse(
            plan=user.plan.value,
            status=user.subscription_status,
            current_period_end=user.plan_expires_at,
            plan_expires_at=user.plan_expires_at,
            cancel_at_period_end=user.cancel_at_period_end,
        )

    return SubscriptionResponse(
        plan=subscription.plan.value,
        status=subscription.status,
        current_period_end=subscription.current_period_end,
        plan_expires_at=user.plan_expires_at,
        cancel_at_period_end=subscription.cancel_at_period_end,
        billing_interval=subscription.billing_interval,
    )


@router.get("/invoices", response_model=list[InvoiceResponse])
async def get_invoices(
    user: User = Depends(get_active_user),
) -> list[InvoiceResponse]:
    """Fetch invoices from Stripe for the current user."""
    if not user.stripe_customer_id:
        return []

    _init_stripe()
    try:
        invoices = stripe.Invoice.list(customer=user.stripe_customer_id, limit=24)
    except StripeError as e:
        logger.error("Stripe error fetching invoices for user %s: %s", user.id, e)
        return []

    return [
        InvoiceResponse(
            id=inv.id or "",
            date=datetime.fromtimestamp(inv.created or 0, tz=timezone.utc),
            amount=inv.amount_paid or 0,
            status=inv.status or "unknown",
            invoice_pdf=inv.invoice_pdf,
        )
        for inv in invoices.data
    ]


async def _downgrade_to_free(user: User, db: AsyncSession) -> SubscriptionResponse:
    """Cancel the Stripe subscription at period end and mark user for downgrade."""
    if not user.stripe_subscription_id:
        raise BadRequestException("No active subscription to downgrade.")

    try:
        updated_sub = stripe.Subscription.modify(
            user.stripe_subscription_id,
            cancel_at_period_end=True,
        )
    except StripeError as e:
        logger.error("Stripe error during downgrade to free for user %s: %s", user.id, e)
        raise BadRequestException(f"Failed to downgrade: {e.user_message or str(e)}")

    user.cancel_at_period_end = True

    # Also update the Subscription record
    sub_result = await db.execute(
        select(Subscription).where(
            Subscription.stripe_subscription_id == user.stripe_subscription_id
        )
    )
    sub_record = sub_result.scalar_one_or_none()
    if sub_record is not None:
        sub_record.cancel_at_period_end = True

    await db.commit()

    return _build_subscription_response(user, updated_sub)


def _build_subscription_response(
    user: User, stripe_sub: stripe.Subscription
) -> SubscriptionResponse:
    """Build a SubscriptionResponse from user and Stripe subscription data."""
    period_end_ts = getattr(stripe_sub, "current_period_end", None)
    period_end = (
        datetime.fromtimestamp(period_end_ts, tz=timezone.utc)
        if period_end_ts
        else user.plan_expires_at
    )

    # Extract amount from subscription items
    amount = None
    items_data = getattr(stripe_sub, "items", None)
    if items_data and items_data.data:
        price = items_data.data[0].price
        amount = getattr(price, "unit_amount", None)

    return SubscriptionResponse(
        plan=user.plan.value,
        status=stripe_sub.status or "unknown",
        current_period_end=period_end,
        plan_expires_at=user.plan_expires_at,
        cancel_at_period_end=stripe_sub.cancel_at_period_end or False,
        amount=amount,
    )
