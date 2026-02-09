from __future__ import annotations

import uuid
from datetime import datetime, timezone

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.comment import Comment
from app.models.project import Project
from app.models.report import Category, Report, Severity
from app.models.user import User


async def _create_report(db_session: AsyncSession, project: Project) -> Report:
    report = Report(
        id=uuid.uuid4(),
        project_id=project.id,
        tracking_id="BUG-0001",
        title="Comment Test Bug",
        description="A bug for comment tests",
        severity=Severity.LOW,
        category=Category.BUG,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(report)
    await db_session.commit()
    await db_session.refresh(report)
    return report


async def test_create_comment(
    client: AsyncClient,
    auth_headers: dict[str, str],
    db_session: AsyncSession,
    test_project: Project,
):
    report = await _create_report(db_session, test_project)
    response = await client.post(
        f"/api/v1/reports/{report.id}/comments",
        json={"body": "This is a comment"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["body"] == "This is a comment"
    assert data["reportId"] == str(report.id)
    assert "authorName" in data


async def test_list_comments(
    client: AsyncClient,
    auth_headers: dict[str, str],
    db_session: AsyncSession,
    test_project: Project,
    test_user: User,
):
    report = await _create_report(db_session, test_project)
    comment = Comment(
        id=uuid.uuid4(),
        report_id=report.id,
        author_id=test_user.id,
        body="Existing comment",
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(comment)
    await db_session.commit()

    response = await client.get(
        f"/api/v1/reports/{report.id}/comments",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["body"] == "Existing comment"


async def test_delete_own_comment(
    client: AsyncClient,
    auth_headers: dict[str, str],
    db_session: AsyncSession,
    test_project: Project,
    test_user: User,
):
    report = await _create_report(db_session, test_project)
    comment = Comment(
        id=uuid.uuid4(),
        report_id=report.id,
        author_id=test_user.id,
        body="Delete me",
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(comment)
    await db_session.commit()

    response = await client.delete(
        f"/api/v1/comments/{comment.id}",
        headers=auth_headers,
    )
    assert response.status_code == 204


async def test_comment_requires_auth(
    client: AsyncClient,
    db_session: AsyncSession,
    test_project: Project,
):
    report = await _create_report(db_session, test_project)
    response = await client.post(
        f"/api/v1/reports/{report.id}/comments",
        json={"body": "No auth"},
    )
    assert response.status_code == 422  # Missing required header
