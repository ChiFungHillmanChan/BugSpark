from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.models.user import User
from app.services.email_service import send_email

logger = logging.getLogger(__name__)

DEFAULT_NOTIFICATION_PREFERENCES: dict[str, bool] = {
    "email_on_critical": True,
    "email_on_high": True,
}

NOTIFIABLE_SEVERITIES = {"critical", "high"}


def _should_notify(preferences: dict | None, severity: str) -> bool:
    """Check if the user should be notified for this severity level."""
    prefs = preferences or DEFAULT_NOTIFICATION_PREFERENCES
    if severity == "critical":
        return prefs.get("email_on_critical", True)
    if severity == "high":
        return prefs.get("email_on_high", True)
    return False


async def notify_new_report(
    db: AsyncSession, project_id: str, report_data: dict
) -> None:
    """Send email notification to the project owner for critical/high severity reports."""
    severity = report_data.get("severity", "")
    if severity not in NOTIFIABLE_SEVERITIES:
        return

    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    if project is None:
        return

    user_result = await db.execute(
        select(User).where(User.id == project.owner_id)
    )
    owner = user_result.scalar_one_or_none()
    if owner is None:
        return

    if not _should_notify(owner.notification_preferences, severity):
        return

    title = report_data.get("title", "Untitled")
    tracking_id = report_data.get("tracking_id", "")
    severity_label = severity.upper()

    html = (
        f"<h2>[{severity_label}] New bug report in {project.name}</h2>"
        f"<p><strong>{tracking_id}</strong>: {title}</p>"
        f"<p>Severity: {severity_label}</p>"
        f"<p>Check your BugSpark dashboard for details.</p>"
    )

    await send_email(
        owner.email,
        f"[{severity_label}] New bug report: {title}",
        html,
    )
