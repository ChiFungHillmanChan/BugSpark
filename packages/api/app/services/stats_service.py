from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import case, cast, func, select, Date
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.models.report import Report, Status
from app.schemas.stats import BugTrend, OverviewStats, ProjectStats


async def get_overview_stats(
    db: AsyncSession,
    user_id: str | None,
    project_id: uuid.UUID | None = None,
) -> OverviewStats:
    if user_id is not None:
        project_filter = Report.project_id.in_(
            select(Project.id).where(Project.owner_id == user_id)
        )
    else:
        project_filter = True

    if project_id is not None:
        project_filter = project_filter & (Report.project_id == project_id)

    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    result = await db.execute(
        select(
            func.count(Report.id),
            func.count(Report.id).filter(
                Report.status.in_([Status.NEW, Status.TRIAGING, Status.IN_PROGRESS])
            ),
            func.count(Report.id).filter(
                Report.status == Status.RESOLVED,
                Report.updated_at >= today_start,
            ),
            func.avg(
                case(
                    (
                        Report.status.in_([Status.RESOLVED, Status.CLOSED]),
                        (func.extract("epoch", Report.updated_at) - func.extract("epoch", Report.created_at)) / 3600,
                    ),
                )
            ),
        ).where(project_filter)
    )
    row = result.one()

    return OverviewStats(
        total_bugs=row[0] or 0,
        open_bugs=row[1] or 0,
        resolved_today=row[2] or 0,
        avg_resolution_hours=round(row[3] or 0, 1),
    )


async def get_project_stats(db: AsyncSession, project_id: str) -> ProjectStats:
    severity_result = await db.execute(
        select(Report.severity, func.count(Report.id))
        .where(Report.project_id == project_id)
        .group_by(Report.severity)
    )
    bugs_by_severity = {row[0].value: row[1] for row in severity_result.all()}

    status_result = await db.execute(
        select(Report.status, func.count(Report.id))
        .where(Report.project_id == project_id)
        .group_by(Report.status)
    )
    bugs_by_status = {row[0].value: row[1] for row in status_result.all()}

    bugs_by_day = await get_bug_trends(db, project_id, days=30)

    return ProjectStats(
        bugs_by_severity=bugs_by_severity,
        bugs_by_status=bugs_by_status,
        bugs_by_day=bugs_by_day,
    )


async def get_aggregated_project_stats(
    db: AsyncSession, user_id: str | None
) -> ProjectStats:
    if user_id is not None:
        project_filter = Report.project_id.in_(
            select(Project.id).where(Project.owner_id == user_id)
        )
    else:
        project_filter = True  # type: ignore[assignment]

    severity_result = await db.execute(
        select(Report.severity, func.count(Report.id))
        .where(project_filter)
        .group_by(Report.severity)
    )
    bugs_by_severity = {row[0].value: row[1] for row in severity_result.all()}

    status_result = await db.execute(
        select(Report.status, func.count(Report.id))
        .where(project_filter)
        .group_by(Report.status)
    )
    bugs_by_status = {row[0].value: row[1] for row in status_result.all()}

    bugs_by_day = await get_bug_trends_all(db, user_id, days=30)

    return ProjectStats(
        bugs_by_severity=bugs_by_severity,
        bugs_by_status=bugs_by_status,
        bugs_by_day=bugs_by_day,
    )


async def get_bug_trends(
    db: AsyncSession, project_id: str, days: int = 30
) -> list[BugTrend]:
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    date_col = cast(Report.created_at, Date)

    result = await db.execute(
        select(date_col, func.count(Report.id))
        .where(Report.project_id == project_id, Report.created_at >= start_date)
        .group_by(date_col)
        .order_by(date_col)
    )

    return [BugTrend(date=str(row[0]), count=row[1]) for row in result.all()]


async def get_bug_trends_all(
    db: AsyncSession, user_id: str | None, days: int = 30
) -> list[BugTrend]:
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    date_col = cast(Report.created_at, Date)

    if user_id is not None:
        project_filter = Report.project_id.in_(
            select(Project.id).where(Project.owner_id == user_id)
        )
    else:
        project_filter = True  # type: ignore[assignment]

    result = await db.execute(
        select(date_col, func.count(Report.id))
        .where(project_filter, Report.created_at >= start_date)
        .group_by(date_col)
        .order_by(date_col)
    )

    return [BugTrend(date=str(row[0]), count=row[1]) for row in result.all()]
