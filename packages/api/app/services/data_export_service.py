from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.comment import Comment
from app.models.project import Project
from app.models.report import Report
from app.models.user import User


def _serialize_uuid(value: uuid.UUID | None) -> str | None:
    """Convert UUID to string for JSON serialization."""
    return str(value) if value is not None else None


def _serialize_datetime(value: object) -> str | None:
    """Convert datetime-like objects to ISO string."""
    if value is None:
        return None
    return str(value)


async def export_user_data(db: AsyncSession, user_id: uuid.UUID) -> dict:
    """Gather all user data into a JSON-serializable dict for GDPR export."""
    # Fetch user profile
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if user is None:
        return {}

    profile = {
        "id": str(user.id),
        "email": user.email,
        "name": user.name,
        "role": user.role.value if hasattr(user.role, "value") else str(user.role),
        "plan": user.plan.value if hasattr(user.plan, "value") else str(user.plan),
        "isActive": user.is_active,
        "isEmailVerified": user.is_email_verified,
        "betaStatus": (
            user.beta_status.value
            if hasattr(user.beta_status, "value")
            else str(user.beta_status)
        ),
        "createdAt": _serialize_datetime(user.created_at),
        "updatedAt": _serialize_datetime(user.updated_at),
    }

    # Fetch user projects
    projects_result = await db.execute(
        select(Project).where(Project.owner_id == user_id)
    )
    projects = [
        {
            "id": str(p.id),
            "name": p.name,
            "domain": p.domain,
            "isActive": p.is_active,
            "createdAt": _serialize_datetime(p.created_at),
            "settings": p.settings,
        }
        for p in projects_result.scalars().all()
    ]

    # Fetch reports across user's projects
    project_ids = [p["id"] for p in projects]
    reports: list[dict] = []
    if project_ids:
        reports_result = await db.execute(
            select(Report).where(
                Report.project_id.in_([uuid.UUID(pid) for pid in project_ids])
            )
        )
        reports = [
            {
                "id": str(r.id),
                "projectId": str(r.project_id),
                "trackingId": r.tracking_id,
                "title": r.title,
                "description": r.description,
                "severity": r.severity.value if hasattr(r.severity, "value") else str(r.severity),
                "category": r.category.value if hasattr(r.category, "value") else str(r.category),
                "status": r.status.value if hasattr(r.status, "value") else str(r.status),
                "createdAt": _serialize_datetime(r.created_at),
            }
            for r in reports_result.scalars().all()
        ]

    # Fetch user's comments
    comments_result = await db.execute(
        select(Comment).where(Comment.author_id == user_id)
    )
    comments = [
        {
            "id": str(c.id),
            "reportId": _serialize_uuid(c.report_id),
            "body": c.body,
            "createdAt": _serialize_datetime(c.created_at),
        }
        for c in comments_result.scalars().all()
    ]

    return {
        "profile": profile,
        "projects": projects,
        "reports": reports,
        "comments": comments,
        "exportedAt": _serialize_datetime(datetime.now(timezone.utc)),
    }
