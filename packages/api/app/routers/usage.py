"""Router for usage and quota endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_active_user, get_db
from app.models.user import User
from app.rate_limiter import limiter
from app.schemas.usage import UsageResponse
from app.services.usage_service import get_user_usage

router = APIRouter(prefix="/usage", tags=["usage"])


@router.get("", response_model=UsageResponse)
@limiter.limit("30/minute")
async def get_usage(
    request: Request,
    user: User = Depends(get_active_user),
    db: AsyncSession = Depends(get_db),
) -> UsageResponse:
    """Get current usage and quota information for the authenticated user.

    Returns:
    - Current plan
    - Project count and limit
    - Monthly report count and limit
    - Reports per project count and limit
    - Team members per project breakdown
    """
    usage = await get_user_usage(db, user)
    return UsageResponse(
        current_plan=user.plan.value,
        usage=usage,
    )
