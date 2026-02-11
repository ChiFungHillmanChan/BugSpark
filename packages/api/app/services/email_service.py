from __future__ import annotations

import asyncio
import logging

import resend

from app.config import get_settings

logger = logging.getLogger(__name__)


def _send_email_sync(from_address: str, to: str, subject: str, html: str) -> None:
    """Synchronous email send via Resend SDK."""
    resend.Emails.send(
        {
            "from": from_address,
            "to": [to],
            "subject": subject,
            "html": html,
        }
    )


async def send_email(to: str, subject: str, html: str) -> bool:
    """Send an email via Resend. Returns True on success, False on failure.

    Skips silently if RESEND_API_KEY is not configured (dev mode).
    Uses asyncio.to_thread to avoid blocking the event loop.
    """
    settings = get_settings()

    if not settings.RESEND_API_KEY:
        logger.info("RESEND_API_KEY not set — skipping email to %s", to)
        return False

    resend.api_key = settings.RESEND_API_KEY

    try:
        await asyncio.to_thread(
            _send_email_sync, settings.EMAIL_FROM_ADDRESS, to, subject, html
        )
        return True
    except resend.exceptions.ResendError as exc:
        logger.warning("Failed to send email to %s: %s", to, exc)
        return False
