from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.exceptions import ForbiddenException, NotFoundException
from app.models.project import Project
from app.models.user import User
from app.schemas.stats import OverviewStats, ProjectStats
from app.services.stats_service import get_overview_stats, get_project_stats

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/overview", response_model=OverviewStats)
async def overview_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OverviewStats:
    return await get_overview_stats(db, str(current_user.id))


@router.get("/projects/{project_id}", response_model=ProjectStats)
async def project_stats(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectStats:
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()

    if project is None:
        raise NotFoundException("Project not found")
    if project.owner_id != current_user.id:
        raise ForbiddenException("Not the project owner")

    return await get_project_stats(db, str(project.id))
