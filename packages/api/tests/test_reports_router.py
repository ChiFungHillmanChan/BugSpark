from __future__ import annotations

import uuid
from datetime import datetime, timezone

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.models.report import Category, Report, Severity, Status
from app.models.user import User


BASE = "/api/v1/reports"


def _api_key_headers(project: Project) -> dict[str, str]:
    return {"X-API-Key": project.api_key}


async def _create_report_in_db(
    db_session: AsyncSession, project: Project
) -> Report:
    report = Report(
        id=uuid.uuid4(),
        project_id=project.id,
        tracking_id="BUG-0001",
        title="Test Bug",
        description="A test bug description",
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


async def test_create_report_with_api_key(
    client: AsyncClient, test_project: Project
):
    response = await client.post(
        BASE,
        json={
            "title": "Login button broken",
            "description": "Cannot click the login button",
            "severity": "high",
            "category": "bug",
            "metadata": {"browser": "chrome"},
        },
        headers=_api_key_headers(test_project),
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Login button broken"
    assert data["trackingId"] == "BUG-0001"
    assert data["severity"] == "high"
    assert data["status"] == "new"


async def test_create_report_without_api_key_fails(client: AsyncClient):
    response = await client.post(
        BASE,
        json={
            "title": "No key",
            "description": "Should fail",
            "severity": "low",
            "category": "bug",
        },
    )
    assert response.status_code == 422  # Missing required X-API-Key header


async def test_list_reports(
    client: AsyncClient,
    auth_headers: dict[str, str],
    db_session: AsyncSession,
    test_project: Project,
):
    await _create_report_in_db(db_session, test_project)
    response = await client.get(BASE, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert data["total"] >= 1
    assert data["page"] == 1


async def test_list_reports_with_filters(
    client: AsyncClient,
    auth_headers: dict[str, str],
    db_session: AsyncSession,
    test_project: Project,
):
    await _create_report_in_db(db_session, test_project)
    response = await client.get(
        BASE,
        params={"severity": "medium", "status": "new"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    for item in data["items"]:
        assert item["severity"] == "medium"
        assert item["status"] == "new"


async def test_get_report_detail(
    client: AsyncClient,
    auth_headers: dict[str, str],
    db_session: AsyncSession,
    test_project: Project,
):
    report = await _create_report_in_db(db_session, test_project)
    response = await client.get(
        f"{BASE}/{report.id}", headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == report.title
    assert data["trackingId"] == report.tracking_id


async def test_update_report_status(
    client: AsyncClient,
    auth_headers: dict[str, str],
    db_session: AsyncSession,
    test_project: Project,
):
    report = await _create_report_in_db(db_session, test_project)
    response = await client.patch(
        f"{BASE}/{report.id}",
        json={"status": "in_progress"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["status"] == "in_progress"


async def test_delete_report(
    client: AsyncClient,
    auth_headers: dict[str, str],
    db_session: AsyncSession,
    test_project: Project,
):
    report = await _create_report_in_db(db_session, test_project)
    response = await client.delete(
        f"{BASE}/{report.id}", headers=auth_headers
    )
    assert response.status_code == 204

    # Verify it is gone
    get_response = await client.get(
        f"{BASE}/{report.id}", headers=auth_headers
    )
    assert get_response.status_code == 404


async def test_report_gets_tracking_id(
    client: AsyncClient, test_project: Project
):
    response = await client.post(
        BASE,
        json={
            "title": "First bug",
            "description": "First",
            "severity": "low",
            "category": "ui",
            "metadata": {"source": "test"},
        },
        headers=_api_key_headers(test_project),
    )
    assert response.status_code == 201
    assert response.json()["trackingId"] == "BUG-0001"

    response2 = await client.post(
        BASE,
        json={
            "title": "Second bug",
            "description": "Second",
            "severity": "medium",
            "category": "bug",
            "metadata": {"source": "test"},
        },
        headers=_api_key_headers(test_project),
    )
    assert response2.status_code == 201
    assert response2.json()["trackingId"] == "BUG-0002"
