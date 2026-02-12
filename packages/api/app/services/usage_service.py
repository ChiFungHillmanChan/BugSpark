"""Service for calculating user usage and quota information."""
from __future__ import annotations

import math
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import Plan
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.report import Report
from app.models.user import User
from app.schemas.usage import ProjectMemberUsage, UsageQuota
from app.services.plan_limits_service import PLAN_LIMITS


async def get_user_usage(db: AsyncSession, user: User) -> UsageQuota:
    """Calculate the current usage and quota for a user.

    Returns a UsageQuota object with counts and limits for:
    - Projects
    - Monthly reports
    - Reports per project
    - Team members per project
    """
    limits = PLAN_LIMITS[user.plan]

    # Count projects
    projects_result = await db.execute(
        select(func.count())
        .select_from(Project)
        .where(Project.owner_id == user.id, Project.is_active.is_(True))
    )
    projects_count = projects_result.scalar() or 0

    # Count monthly reports
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    user_project_ids = select(Project.id).where(Project.owner_id == user.id)

    monthly_reports_result = await db.execute(
        select(func.count())
        .select_from(Report)
        .where(
            Report.project_id.in_(user_project_ids),
            Report.created_at >= month_start,
        )
    )
    monthly_reports_count = monthly_reports_result.scalar() or 0

    # For reports per project, get the highest count using a subquery
    from sqlalchemy import func as sa_func
    subquery = (
        select(sa_func.count(Report.id).label("count"))
        .where(Report.project_id.in_(user_project_ids))
        .group_by(Report.project_id)
        .subquery()
    )
    reports_per_project_result = await db.execute(
        select(sa_func.max(subquery.c.count))
    )
    reports_per_project_count = reports_per_project_result.scalar() or 0

    # Get team members per project
    team_members_per_project: list[ProjectMemberUsage] = []

    projects_query = await db.execute(
        select(Project).where(
            Project.owner_id == user.id,
            Project.is_active.is_(True),
        ).order_by(Project.created_at)
    )
    projects = projects_query.scalars().all()

    for project in projects:
        members_result = await db.execute(
            select(func.count())
            .select_from(ProjectMember)
            .where(ProjectMember.project_id == project.id)
        )
        member_count = (members_result.scalar() or 0) + 1  # +1 for owner

        member_limit = (
            int(limits.max_team_members_per_project)
            if math.isfinite(limits.max_team_members_per_project)
            else None
        )

        team_members_per_project.append(
            ProjectMemberUsage(
                project_id=project.id,
                project_name=project.name,
                member_count=member_count,
                member_limit=member_limit,
            )
        )

    return UsageQuota(
        projects_count=projects_count,
        projects_limit=(
            int(limits.max_projects) if math.isfinite(limits.max_projects) else None
        ),
        monthly_reports_count=monthly_reports_count,
        monthly_reports_limit=(
            int(limits.max_reports_per_month)
            if math.isfinite(limits.max_reports_per_month)
            else None
        ),
        reports_per_project_count=reports_per_project_count,
        reports_per_project_limit=(
            int(limits.max_reports_per_project)
            if math.isfinite(limits.max_reports_per_project)
            else None
        ),
        team_members_per_project=team_members_per_project,
    )
