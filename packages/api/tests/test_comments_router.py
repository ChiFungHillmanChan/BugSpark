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
    auth_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    db_session: AsyncSession,
    test_project: tuple[Project, str],
):
    project, _ = test_project
    report = await _create_report(db_session, project)
    response = await client.post(
        f"/api/v1/reports/{report.id}/comments",
        json={"body": "This is a comment"},
        cookies=auth_cookies,
        headers=csrf_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["body"] == "This is a comment"
    assert data["reportId"] == str(report.id)
    assert "authorName" in data


async def test_list_comments(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    db_session: AsyncSession,
    test_project: tuple[Project, str],
    test_user: User,
):
    project, _ = test_project
    report = await _create_report(db_session, project)
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
        cookies=auth_cookies,
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["body"] == "Existing comment"


async def test_delete_own_comment(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    db_session: AsyncSession,
    test_project: tuple[Project, str],
    test_user: User,
):
    project, _ = test_project
    report = await _create_report(db_session, project)
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
        cookies=auth_cookies,
        headers=csrf_headers,
    )
    assert response.status_code == 204


async def test_comment_requires_auth(
    client: AsyncClient,
    db_session: AsyncSession,
    test_project: tuple[Project, str],
):
    project, _ = test_project
    report = await _create_report(db_session, project)
    response = await client.post(
        f"/api/v1/reports/{report.id}/comments",
        json={"body": "No auth"},
    )
    assert response.status_code == 401


async def test_cross_project_comment_rejected(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    db_session: AsyncSession,
):
    """A user must not be able to comment on a report belonging to another user's project."""
    from app.routers.projects import _api_key_prefix, _generate_api_key, _hash_api_key
    from app.services.auth_service import hash_password

    # Create a second user who owns a different project
    other_user = User(
        id=uuid.uuid4(),
        email="other@example.com",
        hashed_password=hash_password("OtherPass123!"),
        name="Other User",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(other_user)
    await db_session.flush()

    raw_key = _generate_api_key()
    other_project = Project(
        id=uuid.uuid4(),
        owner_id=other_user.id,
        name="Other Project",
        domain="other.com",
        api_key_hash=_hash_api_key(raw_key),
        api_key_prefix=_api_key_prefix(raw_key),
        settings={},
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(other_project)
    await db_session.flush()

    report = Report(
        id=uuid.uuid4(),
        project_id=other_project.id,
        tracking_id="BUG-9999",
        title="Other project bug",
        description="Not my project",
        severity=Severity.LOW,
        category=Category.BUG,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(report)
    await db_session.commit()

    # auth_cookies belong to the test_user (not other_user) - should be rejected
    response = await client.post(
        f"/api/v1/reports/{report.id}/comments",
        json={"body": "Should not work"},
        cookies=auth_cookies,
        headers=csrf_headers,
    )
    assert response.status_code == 403


async def test_cross_project_list_comments_rejected(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    db_session: AsyncSession,
):
    """A user must not be able to list comments on a report belonging to another user's project."""
    from app.routers.projects import _api_key_prefix, _generate_api_key, _hash_api_key
    from app.services.auth_service import hash_password

    other_user = User(
        id=uuid.uuid4(),
        email="other2@example.com",
        hashed_password=hash_password("OtherPass123!"),
        name="Other User 2",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(other_user)
    await db_session.flush()

    raw_key = _generate_api_key()
    other_project = Project(
        id=uuid.uuid4(),
        owner_id=other_user.id,
        name="Other Project 2",
        domain="other2.com",
        api_key_hash=_hash_api_key(raw_key),
        api_key_prefix=_api_key_prefix(raw_key),
        settings={},
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(other_project)
    await db_session.flush()

    report = Report(
        id=uuid.uuid4(),
        project_id=other_project.id,
        tracking_id="BUG-9998",
        title="Other project bug 2",
        description="Not my project either",
        severity=Severity.LOW,
        category=Category.BUG,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(report)
    await db_session.commit()

    response = await client.get(
        f"/api/v1/reports/{report.id}/comments",
        cookies=auth_cookies,
    )
    assert response.status_code == 403
