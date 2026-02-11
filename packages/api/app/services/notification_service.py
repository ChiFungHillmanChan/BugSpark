from __future__ import annotations

import logging
from html import escape as html_escape

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.models.user import User

logger = logging.getLogger(__name__)

DEFAULT_NOTIFICATION_PREFERENCES: dict[str, bool] = {
    "email_on_critical": True,
    "email_on_high": True,
}

NOTIFIABLE_SEVERITIES = {"critical", "high"}


def _sanitize_subject(subject: str) -> str:
    """Strip CR/LF characters to prevent email header injection."""
    return subject.replace("\r", "").replace("\n", "")


def _should_notify(preferences: dict | None, severity: str) -> bool:
    """Check if the user should be notified for this severity level."""
    prefs = preferences or DEFAULT_NOTIFICATION_PREFERENCES
    if severity == "critical":
        return prefs.get("email_on_critical", True)
    if severity == "high":
        return prefs.get("email_on_high", True)
    return False


async def notify_new_report(project_id: str, report_data: dict) -> None:
    """Send email notification to the project owner for critical/high severity reports.

    Creates its own DB session so it can safely run in a background task
    after the originating request's session has been closed.
    """
    from app.database import async_session

    severity = report_data.get("severity", "")
    if severity not in NOTIFIABLE_SEVERITIES:
        return

    async with async_session() as db:
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

        # Read ORM attributes while session is still open
        owner_email = owner.email
        notification_prefs = owner.notification_preferences
        project_name = project.name

    if not _should_notify(notification_prefs, severity):
        return

    title = report_data.get("title", "Untitled")
    tracking_id = report_data.get("tracking_id", "")
    severity_label = severity.upper()

    safe_project = html_escape(project_name)
    safe_title = html_escape(title)
    safe_tracking = html_escape(tracking_id)
    html = (
        f"<h2>[{severity_label}] New bug report in {safe_project}</h2>"
        f"<p><strong>{safe_tracking}</strong>: {safe_title}</p>"
        f"<p>Severity: {severity_label}</p>"
        f"<p>Check your BugSpark dashboard for details.</p>"
    )

    from app.database import async_session as _async_session
    from app.services.task_queue_service import enqueue

    subject = _sanitize_subject(f"[{severity_label}] New bug report: {title}")
    async with _async_session() as queue_db:
        await enqueue(queue_db, "send_email", {
            "to": owner_email,
            "subject": subject,
            "html": html,
        })
