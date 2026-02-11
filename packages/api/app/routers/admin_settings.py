from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, require_superadmin
from app.models.app_settings import AppSettings
from app.models.user import User
from app.schemas.admin import AppSettingsResponse, AppSettingsUpdate

router = APIRouter()


async def get_or_create_settings(db: AsyncSession) -> AppSettings:
    """Return the singleton AppSettings row, creating it if missing."""
    result = await db.execute(select(AppSettings).where(AppSettings.id == 1))
    settings = result.scalar_one_or_none()
    if settings is None:
        settings = AppSettings(id=1)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return settings


@router.get("/settings", response_model=AppSettingsResponse)
async def get_settings(
    current_user: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
) -> AppSettingsResponse:
    settings = await get_or_create_settings(db)
    return AppSettingsResponse(beta_mode_enabled=settings.beta_mode_enabled)


@router.patch("/settings", response_model=AppSettingsResponse)
async def update_settings(
    body: AppSettingsUpdate,
    current_user: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
) -> AppSettingsResponse:
    settings = await get_or_create_settings(db)

    if body.beta_mode_enabled is not None:
        settings.beta_mode_enabled = body.beta_mode_enabled

    await db.commit()
    await db.refresh(settings)
    return AppSettingsResponse(beta_mode_enabled=settings.beta_mode_enabled)
