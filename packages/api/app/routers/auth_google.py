"""Google OAuth login, callback, link, and unlink endpoints."""
from __future__ import annotations

import secrets

from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.dependencies import get_active_user, get_db
from app.exceptions import BadRequestException
from app.i18n import get_locale, translate
from app.models.enums import BetaStatus
from app.models.user import User
from app.routers.auth_helpers import check_beta_status, is_beta_mode, issue_tokens, set_auth_cookies
from app.services.auth_service import create_access_token, verify_token
from app.services.google_auth_service import (
    build_google_auth_url,
    exchange_code_for_user_info,
    generate_oauth_state,
    parse_oauth_state,
)

router = APIRouter(prefix="/auth/google", tags=["auth"])

SESSION_COOKIE_MAX_AGE = 30 * 86400  # 30 days
STATE_COOKIE_MAX_AGE = 600  # 10 minutes
STATE_COOKIE_NAME = "bugspark_google_oauth_state"
STATE_COOKIE_PATH = "/api/v1/auth/google/callback"


def _get_frontend_url() -> str:
    return get_settings().FRONTEND_URL


def _error_redirect(error_code: str) -> RedirectResponse:
    return RedirectResponse(url=f"{_get_frontend_url()}/login?error={error_code}")


def _require_google_auth_enabled(locale: str) -> None:
    if not get_settings().ENABLE_GOOGLE_AUTH:
        raise BadRequestException(translate("auth.google_not_enabled", locale))


@router.get("/status")
async def google_auth_status() -> dict[str, bool]:
    """Return whether Google OAuth is enabled on this server."""
    return {"enabled": get_settings().ENABLE_GOOGLE_AUTH}


@router.get("/login")
async def google_login(
    request: Request,
    redirect: str = "/dashboard",
    mode: str = "login",
) -> RedirectResponse:
    """Initiate Google OAuth flow. Redirects the browser to Google consent screen."""
    locale = get_locale(request)
    _require_google_auth_enabled(locale)

    if not redirect.startswith("/") or redirect.startswith("//"):
        redirect = "/dashboard"

    state, csrf_token = generate_oauth_state(redirect, mode)
    nonce = secrets.token_hex(16)

    auth_url = build_google_auth_url(state, nonce)

    response = RedirectResponse(url=auth_url, status_code=302)

    settings = get_settings()
    domain = settings.COOKIE_DOMAIN or None
    response.set_cookie(
        key=STATE_COOKIE_NAME,
        value=csrf_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path=STATE_COOKIE_PATH,
        max_age=STATE_COOKIE_MAX_AGE,
        domain=domain,
    )
    return response


@router.get("/callback")
async def google_callback(
    request: Request,
    code: str = "",
    state: str = "",
    error: str = "",
    db: AsyncSession = Depends(get_db),
) -> RedirectResponse:
    """Handle Google OAuth callback after user consent."""
    settings = get_settings()

    if not settings.ENABLE_GOOGLE_AUTH:
        return _error_redirect("google_not_enabled")

    if error:
        return _error_redirect("google_denied")

    if not code or not state:
        return _error_redirect("missing_params")

    # Verify state cookie (CSRF protection)
    state_cookie = request.cookies.get(STATE_COOKIE_NAME)
    if not state_cookie:
        return _error_redirect("missing_state")

    try:
        state_data = parse_oauth_state(state)
    except Exception:
        return _error_redirect("invalid_state")

    if state_data.get("csrf") != state_cookie:
        return _error_redirect("csrf_mismatch")

    redirect_path = state_data.get("redirect", "/dashboard")
    mode = state_data.get("mode", "login")

    # Exchange code for user info
    try:
        google_user = await exchange_code_for_user_info(code)
    except Exception:
        return _error_redirect("google_exchange_failed")

    if mode == "link":
        return await _handle_link_mode(request, db, google_user, redirect_path)

    return await _handle_login_mode(db, google_user, redirect_path)


async def _handle_login_mode(
    db: AsyncSession,
    google_user: "GoogleUserInfo",
    redirect_path: str,
) -> RedirectResponse:
    """Handle login/register via Google OAuth."""
    from app.services.google_auth_service import GoogleUserInfo  # noqa: F811 — runtime import for type

    settings = get_settings()

    # 1. Find by google_id
    result = await db.execute(select(User).where(User.google_id == google_user.google_id))
    user = result.scalar_one_or_none()

    if user is None:
        # 2. Find by email (auto-link)
        result = await db.execute(select(User).where(User.email == google_user.email))
        user = result.scalar_one_or_none()

        if user is not None:
            user.google_id = google_user.google_id
            if google_user.is_email_verified and not user.is_email_verified:
                user.is_email_verified = True
        else:
            # 3. Create new user
            beta_mode = await is_beta_mode(db)
            user = User(
                email=google_user.email,
                hashed_password=None,
                google_id=google_user.google_id,
                name=google_user.name,
                is_email_verified=True,
            )
            if beta_mode:
                user.beta_status = BetaStatus.PENDING
                from datetime import datetime, timezone
                user.beta_applied_at = datetime.now(timezone.utc)

            db.add(user)
            await db.commit()
            await db.refresh(user)

            if beta_mode:
                return RedirectResponse(
                    url=f"{settings.FRONTEND_URL}/register/beta?status=pending&provider=google",
                    status_code=302,
                )

    if not user.is_active:
        return _error_redirect("account_deactivated")

    try:
        check_beta_status(user, "en")
    except Exception:
        return _error_redirect("beta_pending")

    # Issue tokens
    response = RedirectResponse(
        url=f"{settings.FRONTEND_URL}{redirect_path}",
        status_code=302,
    )
    await issue_tokens(user, response, db)

    # Set session indicator cookie (readable by JS, not httponly)
    domain = settings.COOKIE_DOMAIN or None
    response.set_cookie(
        key="bugspark_session",
        value="1",
        httponly=False,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/",
        max_age=SESSION_COOKIE_MAX_AGE,
        domain=domain,
    )

    # Clear the state cookie
    response.delete_cookie(
        key=STATE_COOKIE_NAME,
        path=STATE_COOKIE_PATH,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=domain,
    )

    return response


async def _handle_link_mode(
    request: Request,
    db: AsyncSession,
    google_user: "GoogleUserInfo",
    redirect_path: str,
) -> RedirectResponse:
    """Link Google account to an existing authenticated user."""
    settings = get_settings()

    # Verify the user is logged in via access token cookie
    access_token = request.cookies.get("bugspark_access_token")
    if not access_token:
        return _error_redirect("not_authenticated")

    try:
        payload = verify_token(access_token)
    except ValueError:
        return _error_redirect("invalid_token")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        return _error_redirect("user_not_found")

    # Check google_id not already linked to another account
    existing = await db.execute(
        select(User).where(User.google_id == google_user.google_id)
    )
    if existing.scalar_one_or_none() is not None:
        return _error_redirect("google_already_linked")

    user.google_id = google_user.google_id
    if google_user.is_email_verified and not user.is_email_verified:
        user.is_email_verified = True
    await db.commit()

    response = RedirectResponse(
        url=f"{settings.FRONTEND_URL}{redirect_path}",
        status_code=302,
    )

    domain = settings.COOKIE_DOMAIN or None
    response.delete_cookie(
        key=STATE_COOKIE_NAME,
        path=STATE_COOKIE_PATH,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=domain,
    )

    return response


@router.delete("/link")
async def unlink_google(
    request: Request,
    current_user: User = Depends(get_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Unlink Google account from the current user."""
    locale = get_locale(request)

    if not current_user.google_id:
        raise BadRequestException(translate("auth.google_not_linked", locale))

    if not current_user.hashed_password:
        raise BadRequestException(translate("auth.google_unlink_needs_password", locale))

    current_user.google_id = None
    await db.commit()

    return {"detail": translate("auth.google_unlinked", locale)}
