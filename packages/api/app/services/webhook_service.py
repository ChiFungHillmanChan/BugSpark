from __future__ import annotations

import hashlib
import hmac
import json
import logging
import ssl
from urllib.parse import urlparse

import httpx
from fastapi import BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.webhook import Webhook
from app.utils.encryption import decrypt_value, encrypt_value

logger = logging.getLogger(__name__)


def _generate_signature(secret: str, payload_bytes: bytes) -> str:
    return hmac.new(
        secret.encode("utf-8"),
        payload_bytes,
        hashlib.sha256,
    ).hexdigest()


async def _post_with_pinned_ip(
    url: str,
    pinned_ip: str,
    payload_bytes: bytes,
    headers: dict[str, str],
    timeout: float = 5.0,
) -> httpx.Response:
    """POST to *url* while pinning the TCP connection to *pinned_ip*.

    Prevents DNS-rebinding TOCTOU by connecting directly to the
    pre-validated IP address instead of letting httpx re-resolve DNS.

    For HTTPS the SSL context still verifies the certificate chain
    (``CERT_REQUIRED``) but skips hostname-to-certificate matching
    (``check_hostname = False``) because we connect via IP.
    """
    parsed = urlparse(url)
    hostname = parsed.hostname or ""
    scheme = parsed.scheme
    port = parsed.port
    path = parsed.path or "/"
    if parsed.query:
        path = f"{path}?{parsed.query}"

    # Build URL with pinned IP instead of hostname
    ip_authority = f"{pinned_ip}:{port}" if port else pinned_ip
    pinned_url = f"{scheme}://{ip_authority}{path}"

    # Preserve original hostname in Host header for server routing
    headers["Host"] = parsed.netloc

    verify: bool | ssl.SSLContext = True
    if scheme == "https":
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        verify = ctx

    async with httpx.AsyncClient(timeout=timeout, verify=verify) as client:
        return await client.post(
            pinned_url, content=payload_bytes, headers=headers,
        )


async def deliver_webhook(webhook: Webhook, event: str, payload: dict) -> None:
    from app.utils.url_validator import resolve_and_validate_url

    try:
        _url, resolved_ips = resolve_and_validate_url(webhook.url)
    except Exception:
        logger.warning("Blocked webhook delivery to unsafe URL: %s", webhook.url)
        return

    secret = decrypt_value(webhook.secret)
    body = json.dumps({"event": event, "data": payload}, default=str)
    payload_bytes = body.encode("utf-8")
    signature = _generate_signature(secret, payload_bytes)

    headers = {
        "Content-Type": "application/json",
        "X-BugSpark-Signature": signature,
        "X-BugSpark-Event": event,
    }

    try:
        response = await _post_with_pinned_ip(
            webhook.url, resolved_ips[0], payload_bytes, headers,
        )
        logger.info(
            "Webhook delivered to %s: status=%d",
            webhook.url, response.status_code,
        )
    except httpx.HTTPError as exc:
        logger.warning("Webhook delivery to %s failed: %s", webhook.url, exc)


async def deliver_webhook_from_payload(payload: dict) -> None:
    """Deliver a webhook from a serialized task queue payload.

    Looks up the webhook by ID to decrypt the secret at delivery time,
    rather than passing the raw secret through the task queue.
    """
    from app.database import async_session
    from app.utils.url_validator import resolve_and_validate_url

    webhook_id = payload["webhook_id"]
    event = payload["event"]
    data = payload["data"]

    async with async_session() as db:
        result = await db.execute(
            select(Webhook).where(Webhook.id == webhook_id)
        )
        webhook = result.scalar_one_or_none()
        if webhook is None:
            logger.warning("Webhook %s not found — skipping delivery", webhook_id)
            return

    url = webhook.url
    secret = decrypt_value(webhook.secret)

    try:
        _url, resolved_ips = resolve_and_validate_url(url)
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

    response = await _post_with_pinned_ip(
        url, resolved_ips[0], payload_bytes, headers,
    )
    logger.info("Webhook delivered to %s: status=%d", url, response.status_code)
    if response.status_code >= 500:
        raise httpx.HTTPStatusError(
            f"Webhook returned {response.status_code}",
            request=response.request,
            response=response,
        )
    if 400 <= response.status_code < 500:
        logger.warning(
            "Webhook %s returned client error %d — not retrying",
            url, response.status_code,
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
            "webhook_id": str(webhook.id),
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
