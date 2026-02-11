from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_accessible_project_ids, get_active_user, get_db
from app.exceptions import ForbiddenException, NotFoundException
from app.models.enums import Role
from app.models.project import Project
from app.models.user import User
from app.rate_limiter import limiter
from app.schemas.stats import OverviewStats, ProjectStats
from app.services.stats_service import get_aggregated_project_stats, get_overview_stats, get_project_stats

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/overview", response_model=OverviewStats)
@limiter.limit("30/minute")
async def overview_stats(
    request: Request,
    current_user: User = Depends(get_active_user),
    db: AsyncSession = Depends(get_db),
    project_id: uuid.UUID | None = Query(None, description="Filter stats by project"),
) -> OverviewStats:
    user_id = None if current_user.role == Role.SUPERADMIN else str(current_user.id)
    return await get_overview_stats(db, user_id, project_id)


@router.get("/aggregated", response_model=ProjectStats)
@limiter.limit("30/minute")
async def aggregated_stats(
    request: Request,
    current_user: User = Depends(get_active_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectStats:
    user_id = None if current_user.role == Role.SUPERADMIN else str(current_user.id)
    return await get_aggregated_project_stats(db, user_id)


@router.get("/projects/{project_id}", response_model=ProjectStats)
@limiter.limit("30/minute")
async def project_stats(
    project_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_active_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectStats:
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()

    if project is None:
        raise NotFoundException("Project not found")
    if current_user.role != Role.SUPERADMIN:
        accessible_ids = await get_accessible_project_ids(current_user, db)
        if project.id not in accessible_ids:
            raise ForbiddenException("Not the project owner")

    return await get_project_stats(db, str(project.id))
