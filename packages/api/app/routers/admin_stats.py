from __future__ import annotations

import asyncio
import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, require_superadmin
from app.models.enums import BetaStatus, Plan, Role
from app.models.project import Project
from app.models.report import Report
from app.models.user import User
from app.schemas.admin import PlatformStats
from app.schemas.project import ProjectResponse
from app.schemas.report import ReportListResponse
from app.utils.sql_helpers import escape_like

router = APIRouter()


@router.get("/stats", response_model=PlatformStats)
async def platform_stats(
    current_user: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
) -> PlatformStats:
    total_users_result = await db.execute(select(func.count(User.id)))
    total_users = total_users_result.scalar() or 0

    total_projects_result = await db.execute(
        select(func.count(Project.id)).where(Project.is_active.is_(True))
    )
    total_projects = total_projects_result.scalar() or 0

    total_reports_result = await db.execute(select(func.count(Report.id)))
    total_reports = total_reports_result.scalar() or 0

    plan_result = await db.execute(
        select(User.plan, func.count(User.id)).group_by(User.plan)
    )
    users_by_plan = {
        (row[0].value if isinstance(row[0], Plan) else row[0]): row[1]
        for row in plan_result.all()
    }

    role_result = await db.execute(
        select(User.role, func.count(User.id)).group_by(User.role)
    )
    users_by_role = {
        (row[0].value if isinstance(row[0], Role) else row[0]): row[1]
        for row in role_result.all()
    }

    pending_beta_result = await db.execute(
        select(func.count(User.id)).where(User.beta_status == BetaStatus.PENDING)
    )
    pending_beta_count = pending_beta_result.scalar() or 0

    return PlatformStats(
        total_users=total_users,
        total_projects=total_projects,
        total_reports=total_reports,
        users_by_plan=users_by_plan,
        users_by_role=users_by_role,
        pending_beta_count=pending_beta_count,
    )


@router.get("/projects", response_model=list[ProjectResponse])
async def list_all_projects(
    current_user: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> list[ProjectResponse]:
    query = (
        select(Project)
        .where(Project.is_active.is_(True))
        .order_by(Project.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(query)
    projects = result.scalars().all()

    return [
        ProjectResponse(
            id=p.id,
            name=p.name,
            domain=p.domain,
            api_key=p.api_key_prefix + "...",
            is_active=p.is_active,
            created_at=p.created_at,
            settings=p.settings,
        )
        for p in projects
    ]


@router.get("/reports", response_model=ReportListResponse)
async def list_all_reports(
    current_user: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
    search: str | None = Query(None),
    severity: str | None = Query(None),
    status: str | None = Query(None),
    project_id: uuid.UUID | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> ReportListResponse:
    from app.routers.reports import _report_to_response

    query = select(Report)

    if search:
        escaped = escape_like(search)
        search_filter = f"%{escaped}%"
        query = query.where(
            Report.title.ilike(search_filter) | Report.tracking_id.ilike(search_filter)
        )
    if severity:
        query = query.where(Report.severity.in_(severity.split(",")))
    if status:
        query = query.where(Report.status.in_(status.split(",")))
    if project_id:
        query = query.where(Report.project_id == project_id)

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Report.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    reports = result.scalars().all()

    items = await asyncio.gather(*[_report_to_response(r) for r in reports])

    return ReportListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )
