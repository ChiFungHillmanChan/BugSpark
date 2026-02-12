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


def _api_key_headers(raw_key: str) -> dict[str, str]:
    return {"X-API-Key": raw_key}


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
    client: AsyncClient, test_project: tuple[Project, str]
):
    project, raw_key = test_project
    response = await client.post(
        BASE,
        json={
            "title": "Login button broken",
            "description": "Cannot click the login button",
            "severity": "high",
            "category": "bug",
            "metadata": {"browser": "chrome"},
        },
        headers=_api_key_headers(raw_key),
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
    auth_cookies: dict[str, str],
    db_session: AsyncSession,
    test_project: tuple[Project, str],
):
    project, raw_key = test_project
    await _create_report_in_db(db_session, project)
    response = await client.get(BASE, cookies=auth_cookies)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert data["total"] >= 1
    assert data["page"] == 1


async def test_list_reports_with_filters(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    db_session: AsyncSession,
    test_project: tuple[Project, str],
):
    project, raw_key = test_project
    await _create_report_in_db(db_session, project)
    response = await client.get(
        BASE,
        params={"severity": "medium", "status": "new"},
        cookies=auth_cookies,
    )
    assert response.status_code == 200
    data = response.json()
    for item in data["items"]:
        assert item["severity"] == "medium"
        assert item["status"] == "new"


async def test_get_report_detail(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    db_session: AsyncSession,
    test_project: tuple[Project, str],
):
    project, raw_key = test_project
    report = await _create_report_in_db(db_session, project)
    response = await client.get(
        f"{BASE}/{report.id}", cookies=auth_cookies
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == report.title
    assert data["trackingId"] == report.tracking_id


async def test_update_report_status(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    db_session: AsyncSession,
    test_project: tuple[Project, str],
):
    project, raw_key = test_project
    report = await _create_report_in_db(db_session, project)
    response = await client.patch(
        f"{BASE}/{report.id}",
        json={"status": "in_progress"},
        cookies=auth_cookies,
        headers=csrf_headers,
    )
    assert response.status_code == 200
    assert response.json()["status"] == "in_progress"


async def test_delete_report(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    db_session: AsyncSession,
    test_project: tuple[Project, str],
):
    project, raw_key = test_project
    report = await _create_report_in_db(db_session, project)
    response = await client.delete(
        f"{BASE}/{report.id}", cookies=auth_cookies, headers=csrf_headers
    )
    assert response.status_code == 204

    # Verify it is gone
    get_response = await client.get(
        f"{BASE}/{report.id}", cookies=auth_cookies
    )
    assert get_response.status_code == 404


async def test_list_reports_csv_multi_value_filter(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    db_session: AsyncSession,
    test_project: tuple[Project, str],
):
    """CSV multi-value filters (e.g. severity=low,medium) should work with .in_()."""
    project, raw_key = test_project
    # Create reports with different severities
    for sev, tid in [(Severity.LOW, "BUG-0010"), (Severity.HIGH, "BUG-0011"), (Severity.MEDIUM, "BUG-0012")]:
        report = Report(
            id=uuid.uuid4(),
            project_id=project.id,
            tracking_id=tid,
            title=f"Bug {sev.value}",
            description="test",
            severity=sev,
            category=Category.BUG,
            metadata_={},
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db_session.add(report)
    await db_session.commit()

    # Request with CSV severity filter
    response = await client.get(
        BASE,
        params={"severity": "low,medium"},
        cookies=auth_cookies,
    )
    assert response.status_code == 200
    data = response.json()
    severities = {item["severity"] for item in data["items"]}
    assert severities <= {"low", "medium"}
    assert len(data["items"]) >= 2


async def test_list_reports_csv_multi_status_filter(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    db_session: AsyncSession,
    test_project: tuple[Project, str],
):
    """CSV multi-value status filter (e.g. status=new,in_progress) should work."""
    project, raw_key = test_project
    report1 = Report(
        id=uuid.uuid4(),
        project_id=project.id,
        tracking_id="BUG-0020",
        title="New bug",
        description="test",
        severity=Severity.LOW,
        category=Category.BUG,
        status=Status.NEW,
        metadata_={},
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    report2 = Report(
        id=uuid.uuid4(),
        project_id=project.id,
        tracking_id="BUG-0021",
        title="In progress bug",
        description="test",
        severity=Severity.LOW,
        category=Category.BUG,
        status=Status.IN_PROGRESS,
        metadata_={},
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add_all([report1, report2])
    await db_session.commit()

    response = await client.get(
        BASE,
        params={"status": "new,in_progress"},
        cookies=auth_cookies,
    )
    assert response.status_code == 200
    data = response.json()
    statuses = {item["status"] for item in data["items"]}
    assert statuses <= {"new", "in_progress"}
    assert len(data["items"]) >= 2


async def test_report_gets_tracking_id(
    client: AsyncClient, test_project: tuple[Project, str]
):
    project, raw_key = test_project
    response = await client.post(
        BASE,
        json={
            "title": "First bug",
            "description": "First",
            "severity": "low",
            "category": "ui",
            "metadata": {"source": "test"},
        },
        headers=_api_key_headers(raw_key),
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
        headers=_api_key_headers(raw_key),
    )
    assert response2.status_code == 201
    assert response2.json()["trackingId"] == "BUG-0002"


async def test_create_report_with_annotated_screenshot(
    client: AsyncClient, test_project: tuple[Project, str], auth_cookies: dict[str, str]
):
    """Test that annotated_screenshot_url is properly stored and retrieved."""
    import uuid
    project, raw_key = test_project
    original_screenshot_key = f"screenshots/{uuid.uuid4()}.png"
    annotated_screenshot_key = f"screenshots/{uuid.uuid4()}.png"

    response = await client.post(
        BASE,
        json={
            "title": "Bug with annotation",
            "description": "Report with annotated screenshot",
            "severity": "high",
            "category": "bug",
            "screenshot_url": original_screenshot_key,
            "annotated_screenshot_url": annotated_screenshot_key,
            "metadata": {"browser": "chrome"},
        },
        headers=_api_key_headers(raw_key),
    )
    assert response.status_code == 201
    data = response.json()
    report_id = data["id"]

    # Verify annotated screenshot URL is in response
    assert data["annotatedScreenshotUrl"] is not None
    assert annotated_screenshot_key in data["annotatedScreenshotUrl"]
    assert data["screenshotUrl"] is not None
    assert original_screenshot_key in data["screenshotUrl"]

    # Verify we can retrieve it via GET (requires user authentication, not API key)
    get_response = await client.get(
        f"{BASE}/{report_id}",
        cookies=auth_cookies,
    )
    assert get_response.status_code == 200
    get_data = get_response.json()
    assert get_data["annotatedScreenshotUrl"] is not None
    assert annotated_screenshot_key in get_data["annotatedScreenshotUrl"]
