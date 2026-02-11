from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, require_superadmin
from app.exceptions import BadRequestException, NotFoundException
from app.i18n import get_locale, translate
from app.models.enums import BetaStatus
from app.models.user import User
from app.schemas.admin import BetaUserListResponse, BetaUserResponse
from app.utils.sql_helpers import escape_like

router = APIRouter()


def _beta_user_response(user: User) -> BetaUserResponse:
    return BetaUserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        beta_status=user.beta_status.value if isinstance(user.beta_status, BetaStatus) else user.beta_status,
        beta_reason=user.beta_reason,
        beta_applied_at=user.beta_applied_at,
        created_at=user.created_at,
    )


@router.get("/beta-users", response_model=BetaUserListResponse)
async def list_beta_users(
    current_user: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
    status: str | None = Query(None, description="Filter by beta status: pending, approved, rejected"),
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> BetaUserListResponse:
    """List users who registered for beta testing."""
    query = select(User).where(User.beta_status != BetaStatus.NONE)

    if status is not None:
        try:
            beta_status = BetaStatus(status)
        except ValueError:
            raise BadRequestException(f"Invalid beta status: {status}")
        query = query.where(User.beta_status == beta_status)

    if search is not None:
        escaped = escape_like(search)
        search_filter = f"%{escaped}%"
        query = query.where(
            User.email.ilike(search_filter) | User.name.ilike(search_filter)
        )

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(User.beta_applied_at.desc().nulls_last(), User.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    users = result.scalars().all()

    return BetaUserListResponse(
        items=[_beta_user_response(u) for u in users],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/beta-users/{user_id}/approve")
async def approve_beta_user(
    user_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
) -> BetaUserResponse:
    locale = get_locale(request)
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise NotFoundException(translate("beta.not_found", locale))

    if user.beta_status == BetaStatus.NONE:
        raise BadRequestException(translate("beta.not_beta_user", locale))

    user.beta_status = BetaStatus.APPROVED
    await db.commit()
    await db.refresh(user)

    return _beta_user_response(user)


@router.post("/beta-users/{user_id}/reject")
async def reject_beta_user(
    user_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
) -> BetaUserResponse:
    locale = get_locale(request)
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise NotFoundException(translate("beta.not_found", locale))

    if user.beta_status == BetaStatus.NONE:
        raise BadRequestException(translate("beta.not_beta_user", locale))

    user.beta_status = BetaStatus.REJECTED
    await db.commit()
    await db.refresh(user)

    return _beta_user_response(user)
