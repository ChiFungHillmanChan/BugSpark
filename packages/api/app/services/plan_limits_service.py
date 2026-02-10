from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import ForbiddenException
from app.models.enums import Plan, Role
from app.models.project import Project
from app.models.report import Report
from app.models.user import User


@dataclass(frozen=True)
class PlanLimits:
    max_projects: int | float  # math.inf for unlimited
    max_reports_per_project: int | float
    max_reports_per_month: int | float


PLAN_LIMITS: dict[Plan, PlanLimits] = {
    Plan.FREE: PlanLimits(
        max_projects=1,
        max_reports_per_project=100,
        max_reports_per_month=50,
    ),
    Plan.PRO: PlanLimits(
        max_projects=5,
        max_reports_per_project=1000,
        max_reports_per_month=500,
    ),
    Plan.ENTERPRISE: PlanLimits(
        max_projects=math.inf,
        max_reports_per_project=math.inf,
        max_reports_per_month=math.inf,
    ),
}


def get_limits_config() -> dict[str, dict[str, int | None]]:
    """Return the limits config as a JSON-serialisable dict.

    ``None`` represents unlimited.
    """
    result: dict[str, dict[str, int | None]] = {}
    for plan, limits in PLAN_LIMITS.items():
        result[plan.value] = {
            "max_projects": int(limits.max_projects) if math.isfinite(limits.max_projects) else None,
            "max_reports_per_project": (
                int(limits.max_reports_per_project) if math.isfinite(limits.max_reports_per_project) else None
            ),
            "max_reports_per_month": (
                int(limits.max_reports_per_month) if math.isfinite(limits.max_reports_per_month) else None
            ),
        }
    return result


async def check_project_limit(db: AsyncSession, user: User) -> None:
    """Raise ForbiddenException if the user has reached their project limit."""
    if user.role == Role.SUPERADMIN:
        return

    limits = PLAN_LIMITS[user.plan]
    if math.isinf(limits.max_projects):
        return

    count_result = await db.execute(
        select(func.count())
        .select_from(Project)
        .where(Project.owner_id == user.id, Project.is_active.is_(True))
    )
    current_count = count_result.scalar() or 0

    if current_count >= limits.max_projects:
        raise ForbiddenException(
            f"Plan limit reached: {user.plan.value} plan allows up to "
            f"{int(limits.max_projects)} project(s). Please upgrade your plan."
        )


async def check_report_limit(db: AsyncSession, project: Project) -> None:
    """Raise ForbiddenException if the project or its owner has hit a report limit."""
    owner: User = project.owner  # type: ignore[assignment]  -- loaded via selectin
    if owner.role == Role.SUPERADMIN:
        return

    limits = PLAN_LIMITS[owner.plan]

    # --- per-project cap ---
    if math.isfinite(limits.max_reports_per_project):
        count_result = await db.execute(
            select(func.count())
            .select_from(Report)
            .where(Report.project_id == project.id)
        )
        project_count = count_result.scalar() or 0
        if project_count >= limits.max_reports_per_project:
            raise ForbiddenException(
                f"Plan limit reached: {owner.plan.value} plan allows up to "
                f"{int(limits.max_reports_per_project)} report(s) per project. "
                "Please upgrade your plan."
            )

    # --- monthly cap across all owner's projects ---
    if math.isfinite(limits.max_reports_per_month):
        now = datetime.now(timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        owner_project_ids = select(Project.id).where(Project.owner_id == owner.id)
        monthly_result = await db.execute(
            select(func.count())
            .select_from(Report)
            .where(
                Report.project_id.in_(owner_project_ids),
                Report.created_at >= month_start,
            )
        )
        monthly_count = monthly_result.scalar() or 0
        if monthly_count >= limits.max_reports_per_month:
            raise ForbiddenException(
                f"Plan limit reached: {owner.plan.value} plan allows up to "
                f"{int(limits.max_reports_per_month)} report(s) per month. "
                "Please upgrade your plan."
            )
