"""Shared auth helpers used across auth router sub-modules."""
from __future__ import annotations

import secrets

from fastapi import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.exceptions import ForbiddenException
from app.i18n import translate
from app.models.app_settings import AppSettings
from app.models.enums import BetaStatus
from app.models.user import User
from app.services.auth_service import (
    create_access_token,
    create_refresh_token,
    generate_jti,
)


async def is_beta_mode(db: AsyncSession) -> bool:
    """Return True if the platform is in beta mode (all registrations require approval)."""
    result = await db.execute(select(AppSettings).where(AppSettings.id == 1))
    settings = result.scalar_one_or_none()
    if settings is None:
        return True  # Default to beta mode if no settings row exists
    return settings.beta_mode_enabled


def check_beta_status(user: User, locale: str) -> None:
    """Raise ForbiddenException if user is on the beta waiting list or rejected."""
    if user.beta_status == BetaStatus.PENDING:
        raise ForbiddenException(
            translate("beta.waiting_list", locale),
            code="beta.waiting_list",
        )
    if user.beta_status == BetaStatus.REJECTED:
        raise ForbiddenException(
            translate("beta.rejected", locale),
            code="beta.rejected",
        )


def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    settings = get_settings()
    csrf_token = secrets.token_hex(32)
    domain = settings.COOKIE_DOMAIN or None

    response.set_cookie(
        key="bugspark_access_token",
        value=access_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/",
        max_age=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        domain=domain,
    )
    response.set_cookie(
        key="bugspark_refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/",
        max_age=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        domain=domain,
    )
    response.set_cookie(
        key="bugspark_csrf_token",
        value=csrf_token,
        httponly=False,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/",
        max_age=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        domain=domain,
    )
    response.headers["X-CSRF-Token"] = csrf_token


def clear_auth_cookies(response: Response) -> None:
    settings = get_settings()
    domain = settings.COOKIE_DOMAIN or None
    response.delete_cookie(
        key="bugspark_access_token",
        path="/",
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=domain,
    )
    response.delete_cookie(
        key="bugspark_refresh_token",
        path="/",
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=domain,
    )
    response.delete_cookie(
        key="bugspark_csrf_token",
        path="/",
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=domain,
    )


async def issue_tokens(user: User, response: Response, db: AsyncSession) -> None:
    """Issue new access + refresh tokens and store the jti on the user record."""
    jti = generate_jti()
    access_token = create_access_token(str(user.id), user.email)
    refresh_token = create_refresh_token(str(user.id), jti)

    user.refresh_token_jti = jti
    await db.commit()

    set_auth_cookies(response, access_token, refresh_token)
