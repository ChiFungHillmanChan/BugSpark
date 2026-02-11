"""Tests for GDPR data export service."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.comment import Comment
from app.models.enums import Plan, Role
from app.models.project import Project
from app.models.report import Category, Report, Severity, Status
from app.models.user import User
from app.services.auth_service import hash_password
from app.services.data_export_service import export_user_data


@pytest.mark.asyncio
async def test_export_includes_profile(db_session: AsyncSession, test_user: User):
    result = await export_user_data(db_session, test_user.id)

    assert "profile" in result
    assert result["profile"]["email"] == test_user.email
    assert result["profile"]["name"] == test_user.name
    assert result["profile"]["id"] == str(test_user.id)


@pytest.mark.asyncio
async def test_export_includes_projects(db_session: AsyncSession, test_user: User, test_project: tuple[Project, str]):
    project, _ = test_project
    result = await export_user_data(db_session, test_user.id)

    assert "projects" in result
    assert len(result["projects"]) == 1
    assert result["projects"][0]["name"] == project.name


@pytest.mark.asyncio
async def test_export_includes_reports(db_session: AsyncSession, test_user: User, test_project: tuple[Project, str]):
    project, _ = test_project
    report = Report(
        project_id=project.id,
        tracking_id="TEST-001",
        title="Test Bug",
        description="A test bug",
        severity=Severity.HIGH,
        category=Category.BUG,
        status=Status.NEW,
    )
    db_session.add(report)
    await db_session.commit()

    result = await export_user_data(db_session, test_user.id)

    assert "reports" in result
    assert len(result["reports"]) == 1
    assert result["reports"][0]["title"] == "Test Bug"


@pytest.mark.asyncio
async def test_export_includes_comments(db_session: AsyncSession, test_user: User, test_project: tuple[Project, str]):
    project, _ = test_project
    report = Report(
        project_id=project.id,
        tracking_id="TEST-002",
        title="Bug with comment",
        description="Has a comment",
        severity=Severity.LOW,
        category=Category.BUG,
        status=Status.NEW,
    )
    db_session.add(report)
    await db_session.flush()

    comment = Comment(
        report_id=report.id,
        author_id=test_user.id,
        body="This is my comment",
    )
    db_session.add(comment)
    await db_session.commit()

    result = await export_user_data(db_session, test_user.id)

    assert "comments" in result
    assert len(result["comments"]) == 1
    assert result["comments"][0]["body"] == "This is my comment"


@pytest.mark.asyncio
async def test_export_includes_timestamp(db_session: AsyncSession, test_user: User):
    result = await export_user_data(db_session, test_user.id)
    assert "exportedAt" in result


@pytest.mark.asyncio
async def test_export_nonexistent_user(db_session: AsyncSession):
    result = await export_user_data(db_session, uuid.uuid4())
    assert result == {}
