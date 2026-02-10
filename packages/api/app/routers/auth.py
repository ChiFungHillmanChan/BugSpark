from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Request, Response
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.dependencies import get_current_user, get_db
from app.exceptions import BadRequestException, ForbiddenException, UnauthorizedException
from app.i18n import get_locale, translate
from app.models.app_settings import AppSettings
from app.models.enums import BetaStatus
from app.models.personal_access_token import PersonalAccessToken
from app.models.user import User
from app.schemas.auth import BetaRegisterRequest, BetaRegisterResponse, CLIAuthResponse, LoginRequest, RegisterRequest
from app.schemas.user import PasswordChange, UserResponse, UserUpdate
from app.services.auth_service import (
    create_access_token,
    create_cli_pat,
    create_refresh_token,
    generate_jti,
    hash_password,
    verify_password,
    verify_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])

# Stricter rate limit for auth endpoints to mitigate brute-force attacks
_auth_limiter = Limiter(key_func=get_remote_address)


async def _is_beta_mode(db: AsyncSession) -> bool:
    """Return True if the platform is in beta mode (all registrations require approval)."""
    result = await db.execute(select(AppSettings).where(AppSettings.id == 1))
    settings = result.scalar_one_or_none()
    if settings is None:
        return True  # Default to beta mode if no settings row exists
    return settings.beta_mode_enabled


@router.get("/beta-mode")
async def get_beta_mode(db: AsyncSession = Depends(get_db)) -> dict[str, bool]:
    """Public endpoint: returns whether the platform is in beta mode."""
    return {"betaModeEnabled": await _is_beta_mode(db)}


def _check_beta_status(user: User, locale: str) -> None:
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


@router.post("/register")
@_auth_limiter.limit("5/minute")
async def register(
    body: RegisterRequest, response: Response, request: Request, db: AsyncSession = Depends(get_db)
) -> UserResponse | BetaRegisterResponse:
    locale = get_locale(request)
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none() is not None:
        raise BadRequestException(translate("auth.email_registered", locale))

    beta_mode = await _is_beta_mode(db)

    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        name=body.name,
    )

    if beta_mode:
        user.beta_status = BetaStatus.PENDING
        user.beta_applied_at = datetime.now(timezone.utc)

    db.add(user)
    await db.commit()
    await db.refresh(user)

    if beta_mode:
        response.status_code = 201
        return BetaRegisterResponse(
            message=translate("beta.registered", locale),
            beta_status="pending",
        )

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

    _check_beta_status(user, locale)

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
async def get_me(
    request: Request, response: Response, current_user: User = Depends(get_current_user)
) -> UserResponse:
    # Echo the CSRF token back so cross-origin clients can repopulate
    # their in-memory store after a page refresh (document.cookie can't
    # read cookies from a different domain).
    csrf_token = request.cookies.get("bugspark_csrf_token")
    if csrf_token:
        response.headers["X-CSRF-Token"] = csrf_token
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


# ── Beta registration (dashboard) ──────────────────────────────────────────


@router.post("/register/beta", response_model=BetaRegisterResponse, status_code=201)
@_auth_limiter.limit("5/minute")
async def register_beta(
    body: BetaRegisterRequest, request: Request, db: AsyncSession = Depends(get_db)
) -> BetaRegisterResponse:
    """Register for beta testing. Account will be placed on the waiting list."""
    locale = get_locale(request)
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none() is not None:
        raise BadRequestException(translate("beta.already_applied", locale))

    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        name=body.name,
        beta_status=BetaStatus.PENDING,
        beta_applied_at=datetime.now(timezone.utc),
        beta_reason=body.reason or None,
    )
    db.add(user)
    await db.commit()

    return BetaRegisterResponse(
        message=translate("beta.registered", locale),
        beta_status="pending",
    )


# ── CLI-specific auth (returns PAT in body, no cookies) ────────────────────


@router.post("/cli/register/beta", response_model=BetaRegisterResponse, status_code=201)
@_auth_limiter.limit("5/minute")
async def cli_register_beta(
    body: BetaRegisterRequest, request: Request, db: AsyncSession = Depends(get_db)
) -> BetaRegisterResponse:
    """Register for beta testing from the CLI. Account will be placed on the waiting list."""
    locale = get_locale(request)
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none() is not None:
        raise BadRequestException(translate("beta.already_applied", locale))

    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        name=body.name,
        beta_status=BetaStatus.PENDING,
        beta_applied_at=datetime.now(timezone.utc),
        beta_reason=body.reason or None,
    )
    db.add(user)
    await db.commit()

    return BetaRegisterResponse(
        message=translate("beta.registered", locale),
        beta_status="pending",
    )


@router.post("/cli/register", status_code=201)
@_auth_limiter.limit("5/minute")
async def cli_register(
    body: RegisterRequest, request: Request, db: AsyncSession = Depends(get_db)
) -> CLIAuthResponse | BetaRegisterResponse:
    """Register a new account from the CLI. Returns a PAT for subsequent requests."""
    locale = get_locale(request)
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none() is not None:
        raise BadRequestException(translate("auth.email_registered", locale))

    beta_mode = await _is_beta_mode(db)

    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        name=body.name,
    )

    if beta_mode:
        user.beta_status = BetaStatus.PENDING
        user.beta_applied_at = datetime.now(timezone.utc)

    db.add(user)
    await db.flush()

    if beta_mode:
        await db.commit()
        return BetaRegisterResponse(
            message=translate("beta.registered", locale),
            beta_status="pending",
        )

    raw_token, pat = create_cli_pat(user.id)
    db.add(pat)
    await db.commit()
    await db.refresh(user)

    return CLIAuthResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role.value if hasattr(user.role, "value") else str(user.role),
        plan=user.plan.value if hasattr(user.plan, "value") else str(user.plan),
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

    _check_beta_status(user, locale)

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

    raw_token, pat = create_cli_pat(user.id)
    db.add(pat)
    await db.commit()

    return CLIAuthResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role.value if hasattr(user.role, "value") else str(user.role),
        plan=user.plan.value if hasattr(user.plan, "value") else str(user.plan),
        token=raw_token,
    )
