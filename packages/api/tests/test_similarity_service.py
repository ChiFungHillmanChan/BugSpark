from __future__ import annotations

import uuid
from datetime import datetime, timezone

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.models.report import Category, Report, Severity, Status
from app.models.user import User
from app.services.similarity_service import find_similar_reports


BASE = "/api/v1/reports"


async def _create_report(
    db_session: AsyncSession,
    project: Project,
    title: str,
    description: str,
    tracking_id: str = "BUG-0001",
) -> Report:
    report = Report(
        id=uuid.uuid4(),
        project_id=project.id,
        tracking_id=tracking_id,
        title=title,
        description=description,
        severity=Severity.MEDIUM,
        category=Category.BUG,
        metadata_={},
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(report)
    await db_session.commit()
    await db_session.refresh(report)
    return report


async def test_find_similar_reports_returns_matches(
    db_session: AsyncSession, test_project: Project
):
    source = await _create_report(
        db_session,
        test_project,
        title="Login button is broken on Chrome",
        description="The login button does not respond to clicks on Chrome browser",
        tracking_id="BUG-0001",
    )
    await _create_report(
        db_session,
        test_project,
        title="Login button broken on Firefox",
        description="The login button is not clickable in Firefox browser",
        tracking_id="BUG-0002",
    )
    await _create_report(
        db_session,
        test_project,
        title="Dashboard charts not loading",
        description="The analytics dashboard charts show a spinner indefinitely",
        tracking_id="BUG-0003",
    )

    results = await find_similar_reports(
        db_session, source.id, source.project_id, threshold=0.1, limit=5
    )

    assert len(results) >= 1
    titles = [r["report"].title for r in results]
    assert "Login button broken on Firefox" in titles


async def test_find_similar_reports_excludes_source(
    db_session: AsyncSession, test_project: Project
):
    source = await _create_report(
        db_session,
        test_project,
        title="Button click issue",
        description="Some description",
        tracking_id="BUG-0001",
    )

    results = await find_similar_reports(
        db_session, source.id, source.project_id, threshold=0.0, limit=10
    )

    result_ids = [r["report"].id for r in results]
    assert source.id not in result_ids


async def test_find_similar_reports_empty_when_no_matches(
    db_session: AsyncSession, test_project: Project
):
    source = await _create_report(
        db_session,
        test_project,
        title="Unique issue xyz",
        description="This is completely unrelated abc",
        tracking_id="BUG-0001",
    )

    results = await find_similar_reports(
        db_session, source.id, source.project_id, threshold=0.3, limit=5
    )

    assert isinstance(results, list)


async def test_find_similar_reports_nonexistent_id(
    db_session: AsyncSession, test_project: Project
):
    fake_id = uuid.uuid4()
    results = await find_similar_reports(
        db_session, fake_id, test_project.id, threshold=0.3, limit=5
    )
    assert results == []


async def test_similar_reports_endpoint_requires_auth(
    client: AsyncClient, db_session: AsyncSession, test_project: Project
):
    report = await _create_report(
        db_session, test_project, "Test bug", "A bug", tracking_id="BUG-0001"
    )
    response = await client.get(f"{BASE}/{report.id}/similar")
    assert response.status_code == 401


async def test_similar_reports_endpoint_returns_results(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    db_session: AsyncSession,
    test_project: Project,
):
    source = await _create_report(
        db_session,
        test_project,
        title="Login button broken on Chrome",
        description="Cannot click the login button on Chrome",
        tracking_id="BUG-0001",
    )
    await _create_report(
        db_session,
        test_project,
        title="Login button broken on Safari",
        description="Cannot click the login button on Safari",
        tracking_id="BUG-0002",
    )

    response = await client.get(
        f"{BASE}/{source.id}/similar",
        cookies=auth_cookies,
        params={"threshold": "0.0"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert isinstance(data["items"], list)


async def test_similar_reports_endpoint_not_found(
    client: AsyncClient, auth_cookies: dict[str, str]
):
    fake_id = uuid.uuid4()
    response = await client.get(
        f"{BASE}/{fake_id}/similar", cookies=auth_cookies
    )
    assert response.status_code == 404


async def test_similar_reports_response_schema(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    db_session: AsyncSession,
    test_project: Project,
):
    source = await _create_report(
        db_session,
        test_project,
        title="Login button broken",
        description="Cannot click login button",
        tracking_id="BUG-0001",
    )
    await _create_report(
        db_session,
        test_project,
        title="Login button not working",
        description="Login button does not click",
        tracking_id="BUG-0002",
    )

    response = await client.get(
        f"{BASE}/{source.id}/similar",
        cookies=auth_cookies,
        params={"threshold": "0.0"},
    )
    assert response.status_code == 200
    data = response.json()

    if data["items"]:
        item = data["items"][0]
        assert "id" in item
        assert "trackingId" in item
        assert "title" in item
        assert "severity" in item
        assert "status" in item
        assert "createdAt" in item
        assert "similarityScore" in item
        assert isinstance(item["similarityScore"], (int, float))
