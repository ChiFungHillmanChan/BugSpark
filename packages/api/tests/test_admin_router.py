from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.models.project import Project
from app.models.user import User


@pytest.mark.asyncio
async def test_list_users_as_superadmin(
    client: AsyncClient,
    superadmin_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_user: User,
    test_superadmin: User,
) -> None:
    resp = await client.get(
        "/api/v1/admin/users",
        cookies=superadmin_cookies,
        headers=csrf_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 2
    emails = [u["email"] for u in data["items"]]
    assert "testuser@example.com" in emails
    assert "superadmin@example.com" in emails


@pytest.mark.asyncio
async def test_list_users_forbidden_for_regular_user(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    csrf_headers: dict[str, str],
) -> None:
    resp = await client.get(
        "/api/v1/admin/users",
        cookies=auth_cookies,
        headers=csrf_headers,
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_get_user_as_superadmin(
    client: AsyncClient,
    superadmin_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_user: User,
    test_superadmin: User,
) -> None:
    resp = await client.get(
        f"/api/v1/admin/users/{test_user.id}",
        cookies=superadmin_cookies,
        headers=csrf_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "testuser@example.com"
    assert data["role"] == "user"
    assert data["plan"] == "free"
    assert data["isActive"] is True


@pytest.mark.asyncio
async def test_update_user_role(
    client: AsyncClient,
    superadmin_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_user: User,
    test_superadmin: User,
) -> None:
    resp = await client.patch(
        f"/api/v1/admin/users/{test_user.id}",
        json={"role": "admin"},
        cookies=superadmin_cookies,
        headers=csrf_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["role"] == "admin"


@pytest.mark.asyncio
async def test_update_user_plan(
    client: AsyncClient,
    superadmin_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_user: User,
    test_superadmin: User,
) -> None:
    resp = await client.patch(
        f"/api/v1/admin/users/{test_user.id}",
        json={"plan": "starter"},
        cookies=superadmin_cookies,
        headers=csrf_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["plan"] == "starter"


@pytest.mark.asyncio
async def test_cannot_demote_self(
    client: AsyncClient,
    superadmin_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_superadmin: User,
) -> None:
    resp = await client.patch(
        f"/api/v1/admin/users/{test_superadmin.id}",
        json={"role": "user"},
        cookies=superadmin_cookies,
        headers=csrf_headers,
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_deactivate_user(
    client: AsyncClient,
    superadmin_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_user: User,
    test_superadmin: User,
) -> None:
    resp = await client.patch(
        f"/api/v1/admin/users/{test_user.id}",
        json={"is_active": False},
        cookies=superadmin_cookies,
        headers=csrf_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["isActive"] is False


@pytest.mark.asyncio
async def test_invalid_role(
    client: AsyncClient,
    superadmin_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_user: User,
    test_superadmin: User,
) -> None:
    resp = await client.patch(
        f"/api/v1/admin/users/{test_user.id}",
        json={"role": "king"},
        cookies=superadmin_cookies,
        headers=csrf_headers,
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_update_plan_expires_at(
    client: AsyncClient,
    superadmin_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_user: User,
    test_superadmin: User,
) -> None:
    # Set plan to starter with an expiry date
    resp = await client.patch(
        f"/api/v1/admin/users/{test_user.id}",
        json={"plan": "starter", "plan_expires_at": "2026-03-10T00:00:00Z"},
        cookies=superadmin_cookies,
        headers=csrf_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["plan"] == "starter"
    assert data["planExpiresAt"] is not None
    assert "2026-03-10" in data["planExpiresAt"]


@pytest.mark.asyncio
async def test_clear_plan_expires_at(
    client: AsyncClient,
    superadmin_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_user: User,
    test_superadmin: User,
) -> None:
    # First set an expiry
    await client.patch(
        f"/api/v1/admin/users/{test_user.id}",
        json={"plan_expires_at": "2026-03-10T00:00:00Z"},
        cookies=superadmin_cookies,
        headers=csrf_headers,
    )

    # Then clear it by sending null
    resp = await client.patch(
        f"/api/v1/admin/users/{test_user.id}",
        json={"plan_expires_at": None},
        cookies=superadmin_cookies,
        headers=csrf_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["planExpiresAt"] is None


@pytest.mark.asyncio
async def test_get_user_includes_plan_expires_at(
    client: AsyncClient,
    superadmin_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_user: User,
    test_superadmin: User,
) -> None:
    resp = await client.get(
        f"/api/v1/admin/users/{test_user.id}",
        cookies=superadmin_cookies,
        headers=csrf_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    # planExpiresAt should be present in the response (may be null)
    assert "planExpiresAt" in data


@pytest.mark.asyncio
async def test_platform_stats(
    client: AsyncClient,
    superadmin_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_user: User,
    test_superadmin: User,
) -> None:
    resp = await client.get(
        "/api/v1/admin/stats",
        cookies=superadmin_cookies,
        headers=csrf_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "totalUsers" in data
    assert "totalProjects" in data
    assert "totalReports" in data
    assert "usersByPlan" in data
    assert "usersByRole" in data
    assert data["totalUsers"] >= 2


@pytest.mark.asyncio
async def test_platform_stats_forbidden_for_regular_user(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    csrf_headers: dict[str, str],
) -> None:
    resp = await client.get(
        "/api/v1/admin/stats",
        cookies=auth_cookies,
        headers=csrf_headers,
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_list_all_projects_as_superadmin(
    client: AsyncClient,
    superadmin_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_project: tuple[Project, str],
    test_superadmin: User,
) -> None:
    project, _ = test_project
    resp = await client.get(
        "/api/v1/admin/projects",
        cookies=superadmin_cookies,
        headers=csrf_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_list_all_reports_as_superadmin(
    client: AsyncClient,
    superadmin_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_superadmin: User,
) -> None:
    resp = await client.get(
        "/api/v1/admin/reports",
        cookies=superadmin_cookies,
        headers=csrf_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
