from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Request, Response
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.dependencies import PAT_PREFIX_LEN, get_current_user, get_db
from app.exceptions import BadRequestException, UnauthorizedException
from app.i18n import get_locale, translate
from app.models.personal_access_token import PersonalAccessToken
from app.models.user import User
from app.schemas.auth import CLIAuthResponse, LoginRequest, RegisterRequest
from app.schemas.user import PasswordChange, UserResponse, UserUpdate
from app.services.auth_service import (
    create_access_token,
    create_refresh_token,
    generate_jti,
    hash_password,
    verify_password,
    verify_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])

# Stricter rate limit for auth endpoints to mitigate brute-force attacks
_auth_limiter = Limiter(key_func=get_remote_address)


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    settings = get_settings()
    csrf_token = secrets.token_hex(32)

    response.set_cookie(
        key="bugspark_access_token",
        value=access_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/",
        max_age=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    response.set_cookie(
        key="bugspark_refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/api/v1/auth/refresh",
        max_age=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 86400,
    )
    response.set_cookie(
        key="bugspark_csrf_token",
        value=csrf_token,
        httponly=False,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/",
        max_age=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 86400,
    )
    # Also send CSRF token as a response header so cross-origin clients
    # (dashboard on Vercel, API on Render) can read it — document.cookie
    # only exposes cookies from the *page's own domain*, not the API domain.
    response.headers["X-CSRF-Token"] = csrf_token


def _clear_auth_cookies(response: Response) -> None:
    settings = get_settings()
    response.delete_cookie(
        key="bugspark_access_token",
        path="/",
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
    )
    response.delete_cookie(
        key="bugspark_refresh_token",
        path="/api/v1/auth/refresh",
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
    )
    response.delete_cookie(
        key="bugspark_csrf_token",
        path="/",
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
    )


async def _issue_tokens(user: User, response: Response, db: AsyncSession) -> None:
    """Issue new access + refresh tokens and store the jti on the user record."""
    jti = generate_jti()
    access_token = create_access_token(str(user.id), user.email)
    refresh_token = create_refresh_token(str(user.id), jti)

    user.refresh_token_jti = jti
    await db.commit()

    _set_auth_cookies(response, access_token, refresh_token)


@router.post("/register", response_model=UserResponse)
@_auth_limiter.limit("5/minute")
async def register(
    body: RegisterRequest, response: Response, request: Request, db: AsyncSession = Depends(get_db)
) -> UserResponse:
    locale = get_locale(request)
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none() is not None:
        raise BadRequestException(translate("auth.email_registered", locale))

    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        name=body.name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    await _issue_tokens(user, response, db)

    return UserResponse.model_validate(user)


@router.post("/login", response_model=UserResponse)
@_auth_limiter.limit("5/minute")
async def login(
    body: LoginRequest, response: Response, request: Request, db: AsyncSession = Depends(get_db)
) -> UserResponse:
    locale = get_locale(request)
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(body.password, user.hashed_password):
        raise UnauthorizedException(translate("auth.invalid_credentials", locale))

    if not user.is_active:
        raise UnauthorizedException(translate("auth.account_deactivated", locale))

    await _issue_tokens(user, response, db)

    return UserResponse.model_validate(user)


@router.post("/refresh", response_model=UserResponse)
@_auth_limiter.limit("10/minute")
async def refresh(
    request: Request, response: Response, db: AsyncSession = Depends(get_db)
) -> UserResponse:
    locale = get_locale(request)
    token = request.cookies.get("bugspark_refresh_token")
    if not token:
        raise UnauthorizedException(translate("auth.missing_refresh", locale))

    try:
        payload = verify_token(token)
    except ValueError:
        raise UnauthorizedException(translate("auth.invalid_refresh", locale))

    if payload.get("type") != "refresh":
        raise UnauthorizedException(translate("auth.invalid_token_type", locale))

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise UnauthorizedException(translate("auth.user_not_found", locale))

    # Verify jti matches the stored one (prevents replay of old refresh tokens)
    token_jti = payload.get("jti")
    if token_jti is None or user.refresh_token_jti != token_jti:
        raise UnauthorizedException(translate("auth.invalid_refresh", locale))

    await _issue_tokens(user, response, db)

    return UserResponse.model_validate(user)


@router.post("/logout")
async def logout(
    request: Request, response: Response,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    locale = get_locale(request)

    # Invalidate the refresh token jti so it can't be replayed
    current_user.refresh_token_jti = None
    await db.commit()

    _clear_auth_cookies(response)
    return {"detail": translate("auth.logged_out", locale)}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.patch("/me", response_model=UserResponse)
async def update_me(
    body: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)

    await db.commit()
    await db.refresh(current_user)

    return UserResponse.model_validate(current_user)


@router.put("/me/password")
async def change_password(
    body: PasswordChange,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    locale = get_locale(request)

    if not verify_password(body.current_password, current_user.hashed_password):
        raise BadRequestException(translate("auth.wrong_current_password", locale))

    current_user.hashed_password = hash_password(body.new_password)
    await db.commit()

    return {"detail": translate("auth.password_changed", locale)}


# ── CLI-specific auth (returns PAT in body, no cookies) ────────────────────

_PAT_PREFIX = "bsk_pat_"


def _create_cli_pat(user: User, db: AsyncSession) -> tuple[str, PersonalAccessToken]:
    """Generate a PAT for CLI usage and return (raw_token, pat_model)."""
    raw_token = f"{_PAT_PREFIX}{secrets.token_urlsafe(48)}="
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    token_prefix = raw_token[:PAT_PREFIX_LEN]

    pat = PersonalAccessToken(
        user_id=user.id,
        name="BugSpark CLI",
        token_hash=token_hash,
        token_prefix=token_prefix,
        expires_at=datetime.now(timezone.utc) + timedelta(days=90),
    )
    return raw_token, pat


@router.post("/cli/register", response_model=CLIAuthResponse, status_code=201)
@_auth_limiter.limit("5/minute")
async def cli_register(
    body: RegisterRequest, request: Request, db: AsyncSession = Depends(get_db)
) -> CLIAuthResponse:
    """Register a new account from the CLI. Returns a PAT for subsequent requests."""
    locale = get_locale(request)
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none() is not None:
        raise BadRequestException(translate("auth.email_registered", locale))

    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        name=body.name,
    )
    db.add(user)
    await db.flush()

    raw_token, pat = _create_cli_pat(user, db)
    db.add(pat)
    await db.commit()
    await db.refresh(user)

    return CLIAuthResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role.value if hasattr(user.role, "value") else str(user.role),
        token=raw_token,
    )


@router.post("/cli/login", response_model=CLIAuthResponse)
@_auth_limiter.limit("5/minute")
async def cli_login(
    body: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)
) -> CLIAuthResponse:
    """Login from the CLI. Returns a PAT for subsequent requests."""
    locale = get_locale(request)
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(body.password, user.hashed_password):
        raise UnauthorizedException(translate("auth.invalid_credentials", locale))

    if not user.is_active:
        raise UnauthorizedException(translate("auth.account_deactivated", locale))

    # Clean up old CLI PATs for this user
    old_pats = await db.execute(
        select(PersonalAccessToken).where(
            PersonalAccessToken.user_id == user.id,
            PersonalAccessToken.name == "BugSpark CLI",
        )
    )
    for old_pat in old_pats.scalars().all():
        await db.delete(old_pat)
    await db.flush()

    raw_token, pat = _create_cli_pat(user, db)
    db.add(pat)
    await db.commit()

    return CLIAuthResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role.value if hasattr(user.role, "value") else str(user.role),
        token=raw_token,
    )
