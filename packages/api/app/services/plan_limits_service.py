from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

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
    max_team_members_per_project: int | float


PLAN_LIMITS: dict[Plan, PlanLimits] = {
    Plan.FREE: PlanLimits(
        max_projects=1,
        max_reports_per_project=100,
        max_reports_per_month=50,
        max_team_members_per_project=1,
    ),
    Plan.STARTER: PlanLimits(
        max_projects=3,
        max_reports_per_project=1000,
        max_reports_per_month=500,
        max_team_members_per_project=3,
    ),
    Plan.TEAM: PlanLimits(
        max_projects=10,
        max_reports_per_project=5000,
        max_reports_per_month=5000,
        max_team_members_per_project=10,
    ),
    Plan.ENTERPRISE: PlanLimits(
        max_projects=math.inf,
        max_reports_per_project=math.inf,
        max_reports_per_month=math.inf,
        max_team_members_per_project=math.inf,
    ),
}

PLAN_FEATURES: dict[Plan, frozenset[str]] = {
    Plan.FREE: frozenset({
        "screenshot",
        "console_logs",
    }),
    Plan.STARTER: frozenset({
        "screenshot",
        "console_logs",
        "session_replay",
        "github",
    }),
    Plan.TEAM: frozenset({
        "screenshot",
        "console_logs",
        "session_replay",
        "github",
        "ai_analysis",
        "linear",
        "custom_branding",
    }),
    Plan.ENTERPRISE: frozenset({
        "screenshot",
        "console_logs",
        "session_replay",
        "github",
        "ai_analysis",
        "linear",
        "custom_branding",
        "sso",
        "audit_logs",
        "priority_support",
    }),
}


PLAN_RANK: dict[Plan, int] = {
    Plan.FREE: 0,
    Plan.STARTER: 1,
    Plan.TEAM: 2,
    Plan.ENTERPRISE: 3,
}


def has_feature(user: User, feature: str) -> bool:
    """Check if the user's plan includes the given feature.

    During the grace period after a downgrade, the user retains access to
    features from their previous higher-tier plan for up to 30 days.
    """
    if user.role == Role.SUPERADMIN:
        return True

    effective_plan = user.plan

    if is_in_grace_period(user) and user.previous_plan:
        try:
            previous = Plan(user.previous_plan)
            if PLAN_RANK.get(previous, 0) > PLAN_RANK.get(effective_plan, 0):
                effective_plan = previous
        except ValueError:
            pass

    features = PLAN_FEATURES.get(effective_plan, PLAN_FEATURES[Plan.FREE])
    return feature in features


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
            "max_team_members_per_project": (
                int(limits.max_team_members_per_project) if math.isfinite(limits.max_team_members_per_project) else None
            ),
        }
    return result


def get_features_config() -> dict[str, list[str]]:
    """Return the features config as a JSON-serialisable dict."""
    return {plan.value: sorted(features) for plan, features in PLAN_FEATURES.items()}


# Grace period configuration for plan downgrades
GRACE_PERIOD_DAYS = 30


def is_in_grace_period(user: User) -> bool:
    """Check if a user is in the grace period after a plan downgrade.

    During the grace period, users can continue to use features from their
    previous higher-tier plan even though they've downgraded to a lower tier.
    """
    if user.plan_downgraded_at is None:
        return False

    elapsed = datetime.now(timezone.utc) - user.plan_downgraded_at
    return elapsed < timedelta(days=GRACE_PERIOD_DAYS)


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
    # Ensure owner is loaded — prefer eager-loaded relation, fall back to explicit query
    owner: User | None = getattr(project, "owner", None)
    if owner is None:
        owner_result = await db.execute(
            select(User).where(User.id == project.owner_id)
        )
        owner = owner_result.scalar_one_or_none()
    if owner is None:
        raise ForbiddenException("Project owner not found")
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


async def check_team_member_limit(db: AsyncSession, project: Project) -> None:
    """Raise ForbiddenException if the project has reached its team member limit."""
    # Ensure owner is loaded — prefer eager-loaded relation, fall back to explicit query
    owner: User | None = getattr(project, "owner", None)
    if owner is None:
        owner_result = await db.execute(
            select(User).where(User.id == project.owner_id)
        )
        owner = owner_result.scalar_one_or_none()
    if owner is None:
        raise ForbiddenException("Project owner not found")
    if owner.role == Role.SUPERADMIN:
        return

    limits = PLAN_LIMITS[owner.plan]
    if math.isinf(limits.max_team_members_per_project):
        return

    from app.models.project_member import ProjectMember

    count_result = await db.execute(
        select(func.count())
        .select_from(ProjectMember)
        .where(ProjectMember.project_id == project.id)
    )
    current_count = count_result.scalar() or 0
    # Would-be count if we invite one more member (owner + existing + new)
    would_be_count = current_count + 2  # +1 for owner, +1 for new invitee

    if would_be_count > limits.max_team_members_per_project:
        raise ForbiddenException(
            f"Plan limit reached: {owner.plan.value} plan allows up to "
            f"{int(limits.max_team_members_per_project)} team member(s) per project. "
            "Please upgrade your plan."
        )
