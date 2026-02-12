from __future__ import annotations

import logging
from datetime import datetime, timezone

import stripe
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
    settings = get_settings()
    stripe.api_key = settings.STRIPE_SECRET_KEY


async def _get_or_create_customer(user: User, db: AsyncSession) -> str:
    """Return existing Stripe customer ID or create a new one."""
    if user.stripe_customer_id:
        return user.stripe_customer_id

    _init_stripe()
    customer = stripe.Customer.create(
        email=user.email,
        name=user.name,
        metadata={"user_id": str(user.id)},
    )
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
    session = stripe.checkout.Session.create(
        customer=customer_id,
        mode="subscription",
        ui_mode="embedded",
        line_items=[{"price": price_id, "quantity": 1}],
        return_url=f"{settings.FRONTEND_URL}/dashboard/settings/billing?session_id={{CHECKOUT_SESSION_ID}}",
        metadata={"user_id": str(user.id), "plan": body.plan},
    )
    return CreateCheckoutSessionResponse(
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

    sub = stripe.Subscription.retrieve(user.stripe_subscription_id)
    subscription_item_id = sub["items"]["data"][0]["id"]

    if is_upgrade:
        updated_sub = stripe.Subscription.modify(
            user.stripe_subscription_id,
            items=[{"id": subscription_item_id, "price": new_price_id}],
            proration_behavior="always_invoice",
        )
        user.plan = Plan(body.new_plan)
        user.subscription_status = updated_sub.status
        await db.commit()
    else:
        updated_sub = stripe.Subscription.modify(
            user.stripe_subscription_id,
            items=[{"id": subscription_item_id, "price": new_price_id}],
            proration_behavior="none",
        )

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
    updated_sub = stripe.Subscription.modify(
        user.stripe_subscription_id,
        cancel_at_period_end=True,
    )
    user.cancel_at_period_end = True
    await db.commit()

    cancel_at = datetime.fromtimestamp(updated_sub.current_period_end, tz=timezone.utc)
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
    stripe.Subscription.modify(
        user.stripe_subscription_id,
        cancel_at_period_end=False,
    )
    user.cancel_at_period_end = False
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
            cancel_at_period_end=user.cancel_at_period_end,
        )

    return SubscriptionResponse(
        plan=subscription.plan.value,
        status=subscription.status,
        current_period_end=subscription.current_period_end,
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
    invoices = stripe.Invoice.list(customer=user.stripe_customer_id, limit=24)

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

    stripe.Subscription.modify(
        user.stripe_subscription_id,
        cancel_at_period_end=True,
    )
    user.cancel_at_period_end = True
    await db.commit()

    return SubscriptionResponse(
        plan=user.plan.value,
        status=user.subscription_status,
        cancel_at_period_end=True,
    )


def _build_subscription_response(
    user: User, stripe_sub: stripe.Subscription
) -> SubscriptionResponse:
    """Build a SubscriptionResponse from user and Stripe subscription data."""
    period_end = datetime.fromtimestamp(
        stripe_sub.current_period_end, tz=timezone.utc
    )
    return SubscriptionResponse(
        plan=user.plan.value,
        status=stripe_sub.status or "unknown",
        current_period_end=period_end,
        cancel_at_period_end=stripe_sub.cancel_at_period_end or False,
    )
