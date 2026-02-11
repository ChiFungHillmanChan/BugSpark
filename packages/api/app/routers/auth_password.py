"""Password change, forgot, and reset endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.dependencies import get_active_user, get_db
from app.exceptions import BadRequestException
from app.i18n import get_locale, translate
from app.models.user import User
from app.rate_limiter import limiter
from app.schemas.auth import ForgotPasswordRequest, ResetPasswordRequest
from app.schemas.user import PasswordChange
from app.services.auth_service import hash_password, verify_password
from app.services.password_reset_service import (
    request_password_reset,
    reset_password as do_reset_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.put("/me/password")
@limiter.limit("3/minute")
async def change_password(
    body: PasswordChange,
    request: Request,
    current_user: User = Depends(get_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    locale = get_locale(request)

    if not verify_password(body.current_password, current_user.hashed_password):
        raise BadRequestException(translate("auth.wrong_current_password", locale))

    current_user.hashed_password = hash_password(body.new_password)
    # Invalidate all existing sessions by clearing the refresh token JTI
    current_user.refresh_token_jti = None
    await db.commit()

    return {"detail": translate("auth.password_changed", locale)}


@router.post("/forgot-password")
@limiter.limit("3/minute")
async def forgot_password(
    body: ForgotPasswordRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Request a password reset email. Always returns 200 to avoid leaking email existence."""
    settings = get_settings()
    await request_password_reset(db, body.email, settings.FRONTEND_URL)
    return {"detail": "If that email exists, a reset link has been sent."}


@router.post("/reset-password")
@limiter.limit("3/minute")
async def reset_password_endpoint(
    body: ResetPasswordRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Reset password using a token from the reset email."""
    locale = get_locale(request)
    success = await do_reset_password(db, body.token, body.new_password)
    if not success:
        raise BadRequestException(translate("auth.invalid_reset_token", locale))
    return {"detail": "Password has been reset successfully."}
