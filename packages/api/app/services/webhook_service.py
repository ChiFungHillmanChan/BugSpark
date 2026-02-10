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


async def dispatch_webhooks(
    db: AsyncSession,
    background_tasks: BackgroundTasks,
    project_id: str,
    event: str,
    payload: dict,
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
            background_tasks.add_task(deliver_webhook, webhook, event, payload)
