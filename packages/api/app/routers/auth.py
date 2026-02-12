"""Dashboard auth: register, login, refresh, logout, me, update_me, export, delete."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, Request, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.dependencies import get_active_user, get_current_user, get_db
from app.exceptions import BadRequestException, UnauthorizedException
from app.i18n import get_locale, translate
from app.models.enums import BetaStatus
from app.models.user import User
from app.rate_limiter import limiter
from app.routers.auth_helpers import (
    check_beta_status,
    clear_auth_cookies,
    is_beta_mode,
    issue_tokens,
)
from app.schemas.auth import (
    BetaRegisterResponse,
    LoginRequest,
    RegisterRequest,
)
from app.schemas.user import UserResponse, UserUpdate, build_user_response
from app.services.auth_service import (
    hash_password,
    verify_password,
    verify_token,
)
from app.models.personal_access_token import PersonalAccessToken
from app.services.data_export_service import export_user_data
from app.services.email_verification_service import send_verification_email

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
@limiter.limit("5/minute")
async def register(
    body: RegisterRequest,
    response: Response,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> UserResponse | BetaRegisterResponse:
    locale = get_locale(request)
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none() is not None:
        raise BadRequestException(translate("auth.email_registered", locale))

    beta_mode = await is_beta_mode(db)

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

    settings = get_settings()
    background_tasks.add_task(send_verification_email, db, user, settings.FRONTEND_URL)

    await issue_tokens(user, response, db)

    return build_user_response(user)


@router.post("/login", response_model=UserResponse)
@limiter.limit("5/minute")
async def login(
    body: LoginRequest, response: Response, request: Request, db: AsyncSession = Depends(get_db)
) -> UserResponse:
    locale = get_locale(request)
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if user is None or not user.hashed_password or not verify_password(body.password, user.hashed_password):
        raise UnauthorizedException(translate("auth.invalid_credentials", locale))

    if not user.is_active:
        raise UnauthorizedException(translate("auth.account_deactivated", locale))

    check_beta_status(user, locale)

    await issue_tokens(user, response, db)

    return build_user_response(user)


@router.post("/refresh", response_model=UserResponse)
@limiter.limit("10/minute")
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

    await issue_tokens(user, response, db)

    return build_user_response(user)


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

    clear_auth_cookies(response)
    return {"detail": translate("auth.logged_out", locale)}


@router.get("/me", response_model=UserResponse)
async def get_me(
    request: Request, response: Response, current_user: User = Depends(get_current_user)
) -> UserResponse:
    # Echo the CSRF token back so cross-origin clients can repopulate
    csrf_token = request.cookies.get("bugspark_csrf_token")
    if csrf_token:
        response.headers["X-CSRF-Token"] = csrf_token
    return build_user_response(current_user)


@router.patch("/me", response_model=UserResponse)
@limiter.limit("5/minute")
async def update_me(
    body: UserUpdate,
    request: Request,
    current_user: User = Depends(get_active_user),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    _USER_UPDATABLE_FIELDS = {"name", "notification_preferences"}
    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field in _USER_UPDATABLE_FIELDS:
            setattr(current_user, field, value)

    await db.commit()
    await db.refresh(current_user)

    return build_user_response(current_user)


@router.get("/me/export")
@limiter.limit("3/minute")
async def export_my_data(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Export all user data (GDPR data portability)."""
    return await export_user_data(db, current_user.id)


@router.delete("/me", status_code=200)
@limiter.limit("3/minute")
async def delete_my_account(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Anonymize and deactivate the current user account (GDPR right to erasure)."""
    from sqlalchemy import delete as sa_delete

    # Anonymize PII
    current_user.email = f"deleted_{current_user.id}@anonymized.invalid"
    current_user.name = "Deleted User"
    current_user.hashed_password = "ACCOUNT_DELETED"
    current_user.is_active = False
    current_user.refresh_token_jti = None
    current_user.email_verification_token = None
    current_user.password_reset_token = None
    current_user.google_id = None

    # Delete all personal access tokens
    await db.execute(
        sa_delete(PersonalAccessToken).where(
            PersonalAccessToken.user_id == current_user.id
        )
    )

    await db.commit()

    clear_auth_cookies(response)
    return {"detail": "Account has been deactivated."}
