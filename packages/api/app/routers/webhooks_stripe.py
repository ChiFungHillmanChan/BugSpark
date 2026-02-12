from __future__ import annotations

import logging
from datetime import datetime, timezone

import stripe
from fastapi import APIRouter, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import async_session
from app.models.enums import Plan
from app.models.stripe_webhook_event import StripeWebhookEvent
from app.models.subscription import Subscription
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

SUBSCRIPTION_EVENT_TYPES = frozenset({
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "invoice.payment_succeeded",
    "invoice.payment_failed",
})


def _price_id_to_plan(price_id: str) -> tuple[Plan, str]:
    """Map a Stripe price ID back to (Plan, interval)."""
    settings = get_settings()
    mapping: dict[str, tuple[Plan, str]] = {
        settings.STRIPE_PRICE_STARTER_MONTHLY: (Plan.STARTER, "month"),
        settings.STRIPE_PRICE_STARTER_YEARLY: (Plan.STARTER, "year"),
        settings.STRIPE_PRICE_TEAM_MONTHLY: (Plan.TEAM, "month"),
        settings.STRIPE_PRICE_TEAM_YEARLY: (Plan.TEAM, "year"),
    }
    return mapping.get(price_id, (Plan.FREE, "month"))


async def _find_user_by_customer_id(
    db: AsyncSession, customer_id: str
) -> User | None:
    """Look up a user by their Stripe customer ID."""
    result = await db.execute(
        select(User).where(User.stripe_customer_id == customer_id)
    )
    return result.scalar_one_or_none()


async def _is_duplicate_event(db: AsyncSession, event_id: str) -> bool:
    """Check if this webhook event was already processed (idempotency)."""
    result = await db.execute(
        select(StripeWebhookEvent.id).where(
            StripeWebhookEvent.stripe_event_id == event_id
        )
    )
    return result.scalar_one_or_none() is not None


async def _store_event(
    db: AsyncSession,
    event_id: str,
    event_type: str,
    payload: dict,
) -> StripeWebhookEvent:
    """Persist the webhook event for idempotency and audit."""
    record = StripeWebhookEvent(
        stripe_event_id=event_id,
        event_type=event_type,
        payload=payload,
    )
    db.add(record)
    await db.flush()
    return record


@router.post("/stripe")
async def handle_stripe_webhook(request: Request) -> dict[str, str]:
    """Process incoming Stripe webhook events with signature verification."""
    settings = get_settings()
    stripe.api_key = settings.STRIPE_SECRET_KEY

    payload_bytes = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = stripe.Webhook.construct_event(
            payload_bytes, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except stripe.SignatureVerificationError:
        logger.warning("Stripe webhook signature verification failed")
        return {"status": "invalid_signature"}
    except ValueError:
        logger.warning("Stripe webhook payload could not be parsed")
        return {"status": "invalid_payload"}

    event_id: str = event["id"]
    event_type: str = event["type"]

    async with async_session() as db:
        if await _is_duplicate_event(db, event_id):
            logger.info("Duplicate Stripe event %s — skipping", event_id)
            return {"status": "duplicate"}

        webhook_record = await _store_event(db, event_id, event_type, event.data)

        try:
            await _dispatch_event(db, event_type, event.data["object"])
            webhook_record.processed = True
            webhook_record.processed_at = datetime.now(timezone.utc)
        except Exception:
            logger.exception("Error processing Stripe event %s", event_id)
            webhook_record.error_message = "Processing failed"
            webhook_record.retry_count += 1

        await db.commit()

    return {"status": "ok"}


async def _dispatch_event(
    db: AsyncSession, event_type: str, data_object: dict
) -> None:
    """Route the event to the correct handler based on event type."""
    if event_type == "customer.subscription.created":
        await _handle_subscription_created(db, data_object)
    elif event_type == "customer.subscription.updated":
        await _handle_subscription_updated(db, data_object)
    elif event_type == "customer.subscription.deleted":
        await _handle_subscription_deleted(db, data_object)
    elif event_type == "invoice.payment_succeeded":
        await _handle_payment_succeeded(db, data_object)
    elif event_type == "invoice.payment_failed":
        await _handle_payment_failed(db, data_object)


async def _handle_subscription_created(
    db: AsyncSession, sub_data: dict
) -> None:
    """Handle customer.subscription.created: create Subscription + update User."""
    customer_id: str = sub_data["customer"]
    user = await _find_user_by_customer_id(db, customer_id)
    if user is None:
        logger.warning("No user found for Stripe customer %s", customer_id)
        return

    price_id = sub_data["items"]["data"][0]["price"]["id"]
    plan, interval = _price_id_to_plan(price_id)

    user.plan = plan
    user.stripe_subscription_id = sub_data["id"]
    user.subscription_status = sub_data["status"]
    user.cancel_at_period_end = sub_data.get("cancel_at_period_end", False)
    user.plan_expires_at = datetime.fromtimestamp(
        sub_data["current_period_end"], tz=timezone.utc
    )

    subscription = Subscription(
        user_id=user.id,
        stripe_subscription_id=sub_data["id"],
        stripe_customer_id=customer_id,
        stripe_price_id=price_id,
        plan=plan,
        billing_interval=interval,
        status=sub_data["status"],
        current_period_start=datetime.fromtimestamp(
            sub_data["current_period_start"], tz=timezone.utc
        ),
        current_period_end=datetime.fromtimestamp(
            sub_data["current_period_end"], tz=timezone.utc
        ),
        cancel_at_period_end=sub_data.get("cancel_at_period_end", False),
    )
    db.add(subscription)
    await db.flush()

    logger.info(
        "Subscription created for user %s: plan=%s interval=%s",
        user.id, plan.value, interval,
    )


async def _handle_subscription_updated(
    db: AsyncSession, sub_data: dict
) -> None:
    """Handle customer.subscription.updated: sync plan/cancel changes."""
    customer_id: str = sub_data["customer"]
    user = await _find_user_by_customer_id(db, customer_id)
    if user is None:
        logger.warning("No user found for Stripe customer %s", customer_id)
        return

    price_id = sub_data["items"]["data"][0]["price"]["id"]
    plan, interval = _price_id_to_plan(price_id)

    user.plan = plan
    user.subscription_status = sub_data["status"]
    user.cancel_at_period_end = sub_data.get("cancel_at_period_end", False)
    user.plan_expires_at = datetime.fromtimestamp(
        sub_data["current_period_end"], tz=timezone.utc
    )

    result = await db.execute(
        select(Subscription).where(
            Subscription.stripe_subscription_id == sub_data["id"]
        )
    )
    subscription = result.scalar_one_or_none()
    if subscription is not None:
        subscription.stripe_price_id = price_id
        subscription.plan = plan
        subscription.billing_interval = interval
        subscription.status = sub_data["status"]
        subscription.current_period_start = datetime.fromtimestamp(
            sub_data["current_period_start"], tz=timezone.utc
        )
        subscription.current_period_end = datetime.fromtimestamp(
            sub_data["current_period_end"], tz=timezone.utc
        )
        subscription.cancel_at_period_end = sub_data.get("cancel_at_period_end", False)
        if sub_data.get("canceled_at"):
            subscription.canceled_at = datetime.fromtimestamp(
                sub_data["canceled_at"], tz=timezone.utc
            )

    await db.flush()
    logger.info("Subscription updated for user %s: plan=%s", user.id, plan.value)


async def _handle_subscription_deleted(
    db: AsyncSession, sub_data: dict
) -> None:
    """Handle customer.subscription.deleted: downgrade to free."""
    customer_id: str = sub_data["customer"]
    user = await _find_user_by_customer_id(db, customer_id)
    if user is None:
        logger.warning("No user found for Stripe customer %s", customer_id)
        return

    user.plan = Plan.FREE
    user.subscription_status = "canceled"
    user.stripe_subscription_id = None
    user.cancel_at_period_end = False
    user.plan_expires_at = None

    result = await db.execute(
        select(Subscription).where(
            Subscription.stripe_subscription_id == sub_data["id"]
        )
    )
    subscription = result.scalar_one_or_none()
    if subscription is not None:
        subscription.status = "canceled"
        subscription.canceled_at = datetime.now(timezone.utc)

    await db.flush()
    logger.info("Subscription deleted for user %s — downgraded to free", user.id)


async def _handle_payment_succeeded(
    db: AsyncSession, invoice_data: dict
) -> None:
    """Handle invoice.payment_succeeded: extend plan expiry."""
    customer_id: str = invoice_data["customer"]
    user = await _find_user_by_customer_id(db, customer_id)
    if user is None:
        return

    subscription_id = invoice_data.get("subscription")
    if not subscription_id:
        return

    user.subscription_status = "active"

    lines = invoice_data.get("lines", {}).get("data", [])
    if lines:
        period_end = lines[0].get("period", {}).get("end")
        if period_end:
            user.plan_expires_at = datetime.fromtimestamp(period_end, tz=timezone.utc)

    await db.flush()
    logger.info("Payment succeeded for user %s", user.id)


async def _handle_payment_failed(
    db: AsyncSession, invoice_data: dict
) -> None:
    """Handle invoice.payment_failed: mark subscription as past_due."""
    customer_id: str = invoice_data["customer"]
    user = await _find_user_by_customer_id(db, customer_id)
    if user is None:
        return

    user.subscription_status = "past_due"
    await db.flush()
    logger.info("Payment failed for user %s — status set to past_due", user.id)
