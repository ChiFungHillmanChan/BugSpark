"""Email verification and resend endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.dependencies import get_current_user, get_db
from app.exceptions import BadRequestException
from app.i18n import get_locale, translate
from app.models.user import User
from app.rate_limiter import limiter
from app.services.email_verification_service import (
    send_verification_email,
    verify_email as do_verify_email,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/verify-email")
@limiter.limit("5/minute")
async def verify_email_endpoint(
    request: Request,
    db: AsyncSession = Depends(get_db),
    token: str = "",
) -> dict[str, str]:
    """Verify user email using token from verification email."""
    locale = get_locale(request)
    if not token:
        raise BadRequestException(translate("auth.invalid_verification_token", locale))
    success = await do_verify_email(db, token)
    if not success:
        raise BadRequestException(translate("auth.invalid_verification_token", locale))
    return {"detail": "Email verified successfully."}


@router.post("/resend-verification")
@limiter.limit("3/minute")
async def resend_verification(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Resend verification email for the authenticated user."""
    if current_user.is_email_verified:
        return {"detail": "Email is already verified."}
    settings = get_settings()
    await send_verification_email(db, current_user, settings.FRONTEND_URL)
    return {"detail": "Verification email sent."}
