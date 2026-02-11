from __future__ import annotations

import hashlib
import logging
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.services.auth_service import hash_password
from app.services.email_service import send_email

logger = logging.getLogger(__name__)

PASSWORD_RESET_EXPIRY_HOURS = 1


def generate_reset_token() -> str:
    """Generate a cryptographically secure URL-safe reset token."""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """Hash a token with SHA-256 for storage."""
    return hashlib.sha256(token.encode()).hexdigest()


async def request_password_reset(
    db: AsyncSession, email: str, frontend_url: str
) -> None:
    """Initiate a password reset flow for the given email.

    Always completes without error to avoid leaking whether the email exists.
    """
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user is None:
        return

    raw_token = generate_reset_token()
    user.password_reset_token = hash_token(raw_token)
    user.password_reset_expires_at = datetime.now(timezone.utc) + timedelta(
        hours=PASSWORD_RESET_EXPIRY_HOURS
    )
    await db.commit()

    reset_link = f"{frontend_url}/reset-password?token={raw_token}"
    html = (
        f"<h2>Reset your password</h2>"
        f"<p>Click the link below to reset your BugSpark password. "
        f"This link expires in {PASSWORD_RESET_EXPIRY_HOURS} hour.</p>"
        f'<p><a href="{reset_link}">Reset Password</a></p>'
        f"<p>If you did not request this, you can safely ignore this email.</p>"
    )

    await send_email(user.email, "Reset your BugSpark password", html)


async def reset_password(
    db: AsyncSession, token: str, new_password: str
) -> bool:
    """Validate a reset token and update the user's password.

    Returns True on success, False if the token is invalid or expired.
    """
    hashed = hash_token(token)
    query = select(User).where(User.password_reset_token == hashed)
    # Use FOR UPDATE on PostgreSQL to prevent race conditions with concurrent resets
    dialect_name = db.bind.dialect.name if db.bind else ""
    if dialect_name == "postgresql":
        query = query.with_for_update()
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if user is None:
        return False

    if (
        user.password_reset_expires_at is None
        or user.password_reset_expires_at < datetime.now(timezone.utc)
    ):
        return False

    user.hashed_password = hash_password(new_password)
    user.password_reset_token = None
    user.password_reset_expires_at = None
    # Invalidate all existing sessions by clearing the refresh token JTI
    user.refresh_token_jti = None
    await db.commit()

    return True
