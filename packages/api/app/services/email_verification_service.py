from __future__ import annotations

import hashlib
import logging
import secrets

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.services.email_service import send_email

logger = logging.getLogger(__name__)


def generate_verification_token() -> str:
    """Generate a cryptographically secure URL-safe verification token."""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """Hash a token with SHA-256 for storage."""
    return hashlib.sha256(token.encode()).hexdigest()


async def send_verification_email(
    db: AsyncSession, user: User, frontend_url: str
) -> None:
    """Generate a verification token and send the verification email."""
    raw_token = generate_verification_token()
    user.email_verification_token = hash_token(raw_token)
    await db.commit()

    verify_link = f"{frontend_url}/verify-email?token={raw_token}"
    html = (
        f"<h2>Verify your email</h2>"
        f"<p>Welcome to BugSpark! Please verify your email address by clicking the link below.</p>"
        f'<p><a href="{verify_link}">Verify Email</a></p>'
        f"<p>If you did not create an account, you can safely ignore this email.</p>"
    )

    await send_email(user.email, "Verify your BugSpark email", html)


async def verify_email(db: AsyncSession, token: str) -> bool:
    """Validate a verification token and mark the user's email as verified.

    Returns True on success, False if the token is invalid.
    """
    hashed = hash_token(token)
    result = await db.execute(
        select(User).where(User.email_verification_token == hashed)
    )
    user = result.scalar_one_or_none()

    if user is None:
        return False

    user.is_email_verified = True
    user.email_verification_token = None
    await db.commit()

    return True
