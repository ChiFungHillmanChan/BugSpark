from __future__ import annotations

import uuid
from datetime import datetime, timezone

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.models.report import Category, Report, Severity
from app.models.user import User
from app.routers.projects import _generate_api_key, _generate_api_secret
from app.services.tracking_id_service import generate_tracking_id


async def test_first_tracking_id_is_bug_0001(
    db_session: AsyncSession, test_project: Project
):
    tracking_id = await generate_tracking_id(db_session, str(test_project.id))
    assert tracking_id == "BUG-0001"


async def test_increments_tracking_id(
    db_session: AsyncSession, test_project: Project
):
    report = Report(
        id=uuid.uuid4(),
        project_id=test_project.id,
        tracking_id="BUG-0001",
        title="First bug",
        description="Description",
        severity=Severity.MEDIUM,
        category=Category.BUG,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(report)
    await db_session.commit()

    tracking_id = await generate_tracking_id(db_session, str(test_project.id))
    assert tracking_id == "BUG-0002"


async def test_tracking_ids_are_per_project(
    db_session: AsyncSession, test_user: User, test_project: Project
):
    # Add a report to test_project
    report = Report(
        id=uuid.uuid4(),
        project_id=test_project.id,
        tracking_id="BUG-0001",
        title="Bug in project A",
        description="Desc",
        severity=Severity.LOW,
        category=Category.UI,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(report)
    await db_session.commit()

    # Create a second project
    other_project = Project(
        id=uuid.uuid4(),
        owner_id=test_user.id,
        name="Other Project",
        domain="other.com",
        api_key=_generate_api_key(),
        api_secret=_generate_api_secret(),
        settings={},
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(other_project)
    await db_session.commit()

    # First tracking ID for the second project should also be BUG-0001
    tracking_id = await generate_tracking_id(db_session, str(other_project.id))
    assert tracking_id == "BUG-0001"
