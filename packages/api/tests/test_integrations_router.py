from __future__ import annotations

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.integration import Integration
from app.models.project import Project
from app.models.report import Category, Report, Severity, Status
from app.models.user import User


@pytest.fixture()
async def test_integration(
    db_session: AsyncSession, test_project: tuple[Project, str]
) -> Integration:
    project, _ = test_project
    integration = Integration(
        id=uuid.uuid4(),
        project_id=project.id,
        provider="github",
        config={"token": "ghp_test", "owner": "testowner", "repo": "testrepo"},
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(integration)
    await db_session.commit()
    await db_session.refresh(integration)
    return integration


@pytest.fixture()
async def test_report(
    db_session: AsyncSession, test_project: tuple[Project, str]
) -> Report:
    project, _ = test_project
    report = Report(
        id=uuid.uuid4(),
        project_id=project.id,
        tracking_id="BUG-001",
        title="Test Bug",
        description="Something broke",
        severity=Severity.HIGH,
        category=Category.BUG,
        status=Status.NEW,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(report)
    await db_session.commit()
    await db_session.refresh(report)
    return report


@pytest.mark.asyncio
async def test_create_integration(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_project: tuple[Project, str],
) -> None:
    project, _ = test_project
    response = await client.post(
        f"/api/v1/projects/{project.id}/integrations",
        json={
            "provider": "github",
            "config": {"token": "ghp_abc", "owner": "myorg", "repo": "myrepo"},
        },
        cookies=auth_cookies,
        headers=csrf_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["provider"] == "github"
    assert data["isActive"] is True
    assert data["hasToken"] is True


@pytest.mark.asyncio
async def test_create_integration_invalid_provider(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_project: tuple[Project, str],
) -> None:
    project, _ = test_project
    response = await client.post(
        f"/api/v1/projects/{project.id}/integrations",
        json={
            "provider": "jira",
            "config": {},
        },
        cookies=auth_cookies,
        headers=csrf_headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_integration_missing_config_keys(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_project: tuple[Project, str],
) -> None:
    project, _ = test_project
    response = await client.post(
        f"/api/v1/projects/{project.id}/integrations",
        json={
            "provider": "github",
            "config": {"token": "ghp_abc"},
        },
        cookies=auth_cookies,
        headers=csrf_headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_integrations(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    test_project: tuple[Project, str],
    test_integration: Integration,
) -> None:
    project, _ = test_project
    response = await client.get(
        f"/api/v1/projects/{project.id}/integrations",
        cookies=auth_cookies,
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["provider"] == "github"


@pytest.mark.asyncio
async def test_update_integration(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_integration: Integration,
) -> None:
    response = await client.patch(
        f"/api/v1/integrations/{test_integration.id}",
        json={"isActive": False},
        cookies=auth_cookies,
        headers=csrf_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["isActive"] is False


@pytest.mark.asyncio
async def test_delete_integration(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_integration: Integration,
) -> None:
    response = await client.delete(
        f"/api/v1/integrations/{test_integration.id}",
        cookies=auth_cookies,
        headers=csrf_headers,
    )
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_delete_nonexistent_integration(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    csrf_headers: dict[str, str],
) -> None:
    fake_id = uuid.uuid4()
    response = await client.delete(
        f"/api/v1/integrations/{fake_id}",
        cookies=auth_cookies,
        headers=csrf_headers,
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_export_report_to_github(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_report: Report,
    test_integration: Integration,
) -> None:
    mock_response = {
        "html_url": "https://github.com/testowner/testrepo/issues/42",
        "number": 42,
    }
    with patch(
        "app.routers.integrations.create_github_issue",
        new_callable=AsyncMock,
        return_value=mock_response,
    ):
        response = await client.post(
            f"/api/v1/reports/{test_report.id}/export/github",
            cookies=auth_cookies,
            headers=csrf_headers,
        )

    assert response.status_code == 200
    data = response.json()
    assert data["issueUrl"] == "https://github.com/testowner/testrepo/issues/42"
    assert data["issueNumber"] == 42


@pytest.mark.asyncio
async def test_export_report_no_integration(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_report: Report,
) -> None:
    response = await client.post(
        f"/api/v1/reports/{test_report.id}/export/github",
        cookies=auth_cookies,
        headers=csrf_headers,
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_export_report_unsupported_provider(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_report: Report,
    test_integration: Integration,
) -> None:
    response = await client.post(
        f"/api/v1/reports/{test_report.id}/export/jira",
        cookies=auth_cookies,
        headers=csrf_headers,
    )
    assert response.status_code == 404
