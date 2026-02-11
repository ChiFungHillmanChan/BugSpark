from __future__ import annotations

import hashlib
import hmac
import json
import logging

import httpx
from fastapi import BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.webhook import Webhook

logger = logging.getLogger(__name__)


def _generate_signature(secret: str, payload_bytes: bytes) -> str:
    return hmac.new(
        secret.encode("utf-8"),
        payload_bytes,
        hashlib.sha256,
    ).hexdigest()


async def deliver_webhook(webhook: Webhook, event: str, payload: dict) -> None:
    from app.utils.url_validator import validate_webhook_url

    try:
        validate_webhook_url(webhook.url)
    except Exception:
        logger.warning("Blocked webhook delivery to unsafe URL: %s", webhook.url)
        return

    body = json.dumps({"event": event, "data": payload}, default=str)
    payload_bytes = body.encode("utf-8")
    signature = _generate_signature(webhook.secret, payload_bytes)

    headers = {
        "Content-Type": "application/json",
        "X-BugSpark-Signature": signature,
        "X-BugSpark-Event": event,
    }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(webhook.url, content=payload_bytes, headers=headers)
            logger.info(
                "Webhook delivered to %s: status=%d", webhook.url, response.status_code
            )
    except httpx.HTTPError as exc:
        logger.warning("Webhook delivery to %s failed: %s", webhook.url, exc)


async def deliver_webhook_from_payload(payload: dict) -> None:
    """Deliver a webhook from a serialized task queue payload."""
    from app.utils.url_validator import validate_webhook_url

    url = payload["url"]
    secret = payload["secret"]
    event = payload["event"]
    data = payload["data"]

    try:
        validate_webhook_url(url)
    except Exception:
        logger.warning("Blocked webhook delivery to unsafe URL: %s", url)
        return

    body = json.dumps({"event": event, "data": data}, default=str)
    payload_bytes = body.encode("utf-8")
    signature = _generate_signature(secret, payload_bytes)

    headers = {
        "Content-Type": "application/json",
        "X-BugSpark-Signature": signature,
        "X-BugSpark-Event": event,
    }

    async with httpx.AsyncClient(timeout=5.0) as client:
        response = await client.post(url, content=payload_bytes, headers=headers)
        logger.info("Webhook delivered to %s: status=%d", url, response.status_code)
        if response.status_code >= 400:
            raise httpx.HTTPStatusError(
                f"Webhook returned {response.status_code}",
                request=response.request,
                response=response,
            )


async def _enqueue_webhook(
    db: AsyncSession,
    webhook: Webhook,
    event: str,
    payload: dict,
) -> None:
    """Enqueue a webhook delivery via the background task queue."""
    from app.services.task_queue_service import enqueue

    await enqueue(
        db,
        task_type="webhook_delivery",
        payload={
            "url": webhook.url,
            "secret": webhook.secret,
            "event": event,
            "data": payload,
        },
    )


async def dispatch_webhooks(
    db: AsyncSession,
    background_tasks: BackgroundTasks,
    project_id: str,
    event: str,
    payload: dict,
    use_task_queue: bool = False,
) -> None:
    result = await db.execute(
        select(Webhook).where(
            Webhook.project_id == project_id,
            Webhook.is_active.is_(True),
        )
    )
    webhooks = result.scalars().all()

    for webhook in webhooks:
        if event in webhook.events:
            if use_task_queue:
                await _enqueue_webhook(db, webhook, event, payload)
            else:
                background_tasks.add_task(deliver_webhook, webhook, event, payload)
