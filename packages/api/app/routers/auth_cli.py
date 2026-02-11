"""CLI-specific auth endpoints (returns PAT in body, no cookies)."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.exceptions import BadRequestException, UnauthorizedException
from app.i18n import get_locale, translate
from app.models.enums import BetaStatus
from app.models.personal_access_token import PersonalAccessToken
from app.models.user import User
from app.rate_limiter import limiter
from app.routers.auth_helpers import check_beta_status, is_beta_mode
from app.schemas.auth import (
    BetaRegisterResponse,
    CLIAuthResponse,
    LoginRequest,
    RegisterRequest,
)
from app.services.auth_service import (
    create_cli_pat,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/cli/register", status_code=201)
@limiter.limit("5/minute")
async def cli_register(
    body: RegisterRequest, request: Request, db: AsyncSession = Depends(get_db)
) -> CLIAuthResponse | BetaRegisterResponse:
    """Register a new account from the CLI. Returns a PAT for subsequent requests."""
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
@limiter.limit("5/minute")
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

    check_beta_status(user, locale)

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
