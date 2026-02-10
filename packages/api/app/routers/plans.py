from __future__ import annotations

from fastapi import APIRouter

from app.services.plan_limits_service import get_limits_config

router = APIRouter(prefix="/plans", tags=["plans"])


@router.get("/limits")
async def plan_limits() -> dict[str, dict[str, int | None]]:
    """Return the plan limits configuration (public, no auth)."""
    return get_limits_config()
