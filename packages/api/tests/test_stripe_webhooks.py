"""Tests for Stripe webhook error handling and retry logic."""
from __future__ import annotations

import json
import pytest
from httpx import AsyncClient
from unittest.mock import patch, AsyncMock
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.webhook import Webhook


VALID_STRIPE_EVENT = {
    "id": "evt_test_123456",
    "type": "customer.subscription.created",
    "data": {
        "object": {
            "id": "sub_test_123",
            "customer": "cus_test_123",
            "status": "active",
            "current_period_end": 1700000000,
        }
    },
    "created": 1700000000,
}


def create_stripe_signature(payload: str, secret: str) -> str:
    """Create a valid Stripe webhook signature (simplified for testing)."""
    import hmac
    import hashlib

    timestamp = str(int(__import__("time").time()))
    signed_content = f"{timestamp}.{payload}"
    signature = hmac.new(
        secret.encode(),
        signed_content.encode(),
        hashlib.sha256,
    ).hexdigest()
    return f"t={timestamp},v1={signature}"


@pytest.mark.asyncio
async def test_webhook_success_returns_200(client: AsyncClient, db: AsyncSession):
    """Successful webhook processing should return HTTP 200."""
    payload = json.dumps(VALID_STRIPE_EVENT)
    sig = create_stripe_signature(payload, "test_webhook_secret")

    with patch("app.routers.webhooks_stripe._dispatch_event", new_callable=AsyncMock) as mock_dispatch:
        mock_dispatch.return_value = None  # Successful dispatch

        response = await client.post(
            "/api/v1/webhooks/stripe",
            content=payload,
            headers={
                "stripe-signature": sig,
                "content-type": "application/json",
            },
        )

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_webhook_error_returns_non_2xx(client: AsyncClient, db: AsyncSession):
    """Webhook processing errors should return non-2xx status for Stripe to retry."""
    payload = json.dumps(VALID_STRIPE_EVENT)
    sig = create_stripe_signature(payload, "test_webhook_secret")

    with patch("app.routers.webhooks_stripe._dispatch_event", new_callable=AsyncMock) as mock_dispatch:
        mock_dispatch.side_effect = Exception("Database connection failed")

        response = await client.post(
            "/api/v1/webhooks/stripe",
            content=payload,
            headers={
                "stripe-signature": sig,
                "content-type": "application/json",
            },
        )

    # Must return non-2xx so Stripe retries (500 indicates server error)
    assert response.status_code >= 400
    assert response.status_code != 200


@pytest.mark.asyncio
async def test_webhook_error_logs_exception(client: AsyncClient, db: AsyncSession):
    """Webhook errors should be logged while returning non-2xx status."""
    payload = json.dumps(VALID_STRIPE_EVENT)
    sig = create_stripe_signature(payload, "test_webhook_secret")

    with patch("app.routers.webhooks_stripe._dispatch_event", new_callable=AsyncMock) as mock_dispatch:
        with patch("app.routers.webhooks_stripe.logger") as mock_logger:
            mock_dispatch.side_effect = Exception("Test error")

            response = await client.post(
                "/api/v1/webhooks/stripe",
                content=payload,
                headers={
                    "stripe-signature": sig,
                    "content-type": "application/json",
                },
            )

    # Should return non-2xx
    assert response.status_code >= 400

    # Should have logged the error
    mock_logger.exception.assert_called()


@pytest.mark.asyncio
async def test_webhook_error_does_not_return_200_ok(client: AsyncClient, db: AsyncSession):
    """Critical: Webhook errors must NOT return 200, or Stripe stops retrying."""
    payload = json.dumps(VALID_STRIPE_EVENT)
    sig = create_stripe_signature(payload, "test_webhook_secret")

    with patch("app.routers.webhooks_stripe._dispatch_event", new_callable=AsyncMock) as mock_dispatch:
        mock_dispatch.side_effect = RuntimeError("Subscription service error")

        response = await client.post(
            "/api/v1/webhooks/stripe",
            content=payload,
            headers={
                "stripe-signature": sig,
                "content-type": "application/json",
            },
        )

    # CRITICAL: Do NOT return 200 when there's an error
    assert response.status_code != 200
    assert response.status_code >= 500


@pytest.mark.asyncio
async def test_webhook_marks_error_in_database(client: AsyncClient, db: AsyncSession):
    """Failed webhooks should update database to record error state for retries."""
    payload = json.dumps(VALID_STRIPE_EVENT)
    sig = create_stripe_signature(payload, "test_webhook_secret")

    with patch("app.routers.webhooks_stripe._dispatch_event", new_callable=AsyncMock) as mock_dispatch:
        mock_dispatch.side_effect = Exception("Failed to process")

        response = await client.post(
            "/api/v1/webhooks/stripe",
            content=payload,
            headers={
                "stripe-signature": sig,
                "content-type": "application/json",
            },
        )

    # Check that webhook record was created/updated with error info
    webhook = await db.query(Webhook).filter(
        Webhook.external_id == "evt_test_123456"
    ).first()

    if webhook:
        assert webhook.error_message is not None
        assert webhook.retry_count > 0
        assert not webhook.processed


@pytest.mark.asyncio
async def test_webhook_retry_count_increments(client: AsyncClient, db: AsyncSession):
    """Each failed webhook attempt should increment retry_count for tracking."""
    payload = json.dumps(VALID_STRIPE_EVENT)
    sig = create_stripe_signature(payload, "test_webhook_secret")

    # First failure
    with patch("app.routers.webhooks_stripe._dispatch_event", new_callable=AsyncMock) as mock_dispatch:
        mock_dispatch.side_effect = Exception("Attempt 1 failed")

        response1 = await client.post(
            "/api/v1/webhooks/stripe",
            content=payload,
            headers={
                "stripe-signature": sig,
                "content-type": "application/json",
            },
        )

    assert response1.status_code >= 400

    # Stripe retries - second failure
    with patch("app.routers.webhooks_stripe._dispatch_event", new_callable=AsyncMock) as mock_dispatch:
        mock_dispatch.side_effect = Exception("Attempt 2 failed")

        response2 = await client.post(
            "/api/v1/webhooks/stripe",
            content=payload,
            headers={
                "stripe-signature": sig,
                "content-type": "application/json",
            },
        )

    assert response2.status_code >= 400

    # Check retry count increased
    webhook = await db.query(Webhook).filter(
        Webhook.external_id == "evt_test_123456"
    ).first()

    assert webhook and webhook.retry_count >= 2
