"""Beta registration endpoints (dashboard + CLI)."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.exceptions import BadRequestException
from app.i18n import get_locale, translate
from app.models.enums import BetaStatus
from app.models.user import User
from app.rate_limiter import limiter
from app.routers.auth_helpers import is_beta_mode
from app.schemas.auth import BetaRegisterRequest, BetaRegisterResponse
from app.services.auth_service import hash_password

router = APIRouter(prefix="/auth", tags=["auth"])


async def _create_beta_user(
    body: BetaRegisterRequest, locale: str, db: AsyncSession
) -> BetaRegisterResponse:
    """Validate uniqueness, create a beta user, and return the response."""
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


@router.get("/beta-mode")
async def get_beta_mode(db: AsyncSession = Depends(get_db)) -> dict[str, bool]:
    """Public endpoint: returns whether the platform is in beta mode."""
    return {"betaModeEnabled": await is_beta_mode(db)}


@router.post("/register/beta", response_model=BetaRegisterResponse, status_code=201)
@limiter.limit("5/minute")
async def register_beta(
    body: BetaRegisterRequest, request: Request, db: AsyncSession = Depends(get_db)
) -> BetaRegisterResponse:
    """Register for beta testing. Account will be placed on the waiting list."""
    return await _create_beta_user(body, get_locale(request), db)


@router.post("/cli/register/beta", response_model=BetaRegisterResponse, status_code=201)
@limiter.limit("5/minute")
async def cli_register_beta(
    body: BetaRegisterRequest, request: Request, db: AsyncSession = Depends(get_db)
) -> BetaRegisterResponse:
    """Register for beta testing from the CLI. Account will be placed on the waiting list."""
    return await _create_beta_user(body, get_locale(request), db)
