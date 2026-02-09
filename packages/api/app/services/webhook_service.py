from __future__ import annotations

import hashlib
import hmac
import json
import logging

import httpx

from app.models.webhook import Webhook

logger = logging.getLogger(__name__)


def _generate_signature(secret: str, payload_bytes: bytes) -> str:
    return hmac.new(
        secret.encode("utf-8"),
        payload_bytes,
        hashlib.sha256,
    ).hexdigest()


async def deliver_webhook(webhook: Webhook, event: str, payload: dict) -> None:
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
