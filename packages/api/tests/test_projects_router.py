from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.models.project import Project
from app.models.user import User


BASE = "/api/v1/projects"


async def test_create_project(
    client: AsyncClient, auth_cookies: dict[str, str], csrf_headers: dict[str, str]
):
    response = await client.post(
        BASE,
        json={"name": "My App", "domain": "myapp.com"},
        cookies=auth_cookies,
        headers=csrf_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "My App"
    assert data["domain"] == "myapp.com"
    assert data["apiKey"].startswith("bsk_pub_")
    assert data["isActive"] is True


async def test_list_projects(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    test_project: Project,
):
    response = await client.get(BASE, cookies=auth_cookies)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    project_names = [p["name"] for p in data]
    assert test_project.name in project_names


async def test_get_project_detail(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    test_project: Project,
):
    response = await client.get(
        f"{BASE}/{test_project.id}", cookies=auth_cookies
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == test_project.name
    assert data["domain"] == test_project.domain


async def test_update_project(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_project: Project,
):
    response = await client.patch(
        f"{BASE}/{test_project.id}",
        json={"name": "Updated Name"},
        cookies=auth_cookies,
        headers=csrf_headers,
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Name"


async def test_delete_project(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_project: Project,
):
    response = await client.delete(
        f"{BASE}/{test_project.id}", cookies=auth_cookies, headers=csrf_headers
    )
    assert response.status_code == 204

    # Verify soft-delete: project should no longer appear in list
    list_response = await client.get(BASE, cookies=auth_cookies)
    project_ids = [p["id"] for p in list_response.json()]
    assert str(test_project.id) not in project_ids


async def test_rotate_api_key(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_project: Project,
):
    original_key = test_project.api_key
    response = await client.post(
        f"{BASE}/{test_project.id}/rotate-key", cookies=auth_cookies, headers=csrf_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["apiKey"].startswith("bsk_pub_")
    assert data["apiKey"] != original_key


async def test_project_requires_auth(client: AsyncClient):
    response = await client.get(BASE)
    assert response.status_code == 401
