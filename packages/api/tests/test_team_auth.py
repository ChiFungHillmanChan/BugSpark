"""Tests for team authorization: owner-only routes, invite acceptance bypass, manageable projects."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import Plan, Role
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.user import User
from app.routers.projects import _api_key_prefix, _generate_api_key, _hash_api_key
from app.services.auth_service import create_access_token, hash_password

CSRF_TEST_TOKEN = "test-csrf-token"
BASE = "/api/v1/projects"


@pytest.fixture()
async def other_user(db_session: AsyncSession) -> User:
    user = User(
        id=uuid.uuid4(),
        email="other@example.com",
        hashed_password=hash_password("OtherPass123!"),
        name="Other User",
        role=Role.USER,
        plan=Plan.FREE,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture()
def other_cookies(other_user: User) -> dict[str, str]:
    token = create_access_token(str(other_user.id), other_user.email)
    return {
        "bugspark_access_token": token,
        "bugspark_csrf_token": CSRF_TEST_TOKEN,
    }


@pytest.fixture()
def csrf_headers() -> dict[str, str]:
    return {"X-CSRF-Token": CSRF_TEST_TOKEN}


@pytest.fixture()
async def accepted_admin_member(
    db_session: AsyncSession, test_project: Project, other_user: User
) -> ProjectMember:
    """An accepted admin member (non-owner) of the test project."""
    member = ProjectMember(
        id=uuid.uuid4(),
        project_id=test_project.id,
        user_id=other_user.id,
        email=other_user.email,
        role="admin",
        invite_token=None,
        invite_accepted_at=datetime.now(timezone.utc),
    )
    db_session.add(member)
    await db_session.commit()
    await db_session.refresh(member)
    return member


@pytest.fixture()
async def unaccepted_member(
    db_session: AsyncSession, test_project: Project, other_user: User
) -> ProjectMember:
    """An invited but unaccepted member (user_id set but invite_accepted_at=None)."""
    member = ProjectMember(
        id=uuid.uuid4(),
        project_id=test_project.id,
        user_id=other_user.id,
        email=other_user.email,
        role="admin",
        invite_token="pending-token-123",
        invite_accepted_at=None,
    )
    db_session.add(member)
    await db_session.commit()
    await db_session.refresh(member)
    return member


# ---- Fix 1: Owner-only mutation routes ----


async def test_owner_can_update_project(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_project: Project,
):
    """Owner can update project."""
    response = await client.patch(
        f"{BASE}/{test_project.id}",
        json={"name": "Owner Updated"},
        cookies=auth_cookies,
        headers=csrf_headers,
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Owner Updated"


async def test_admin_member_cannot_update_project(
    client: AsyncClient,
    other_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_project: Project,
    accepted_admin_member: ProjectMember,
):
    """Admin member cannot update project (owner-only route)."""
    response = await client.patch(
        f"{BASE}/{test_project.id}",
        json={"name": "Hacked Name"},
        cookies=other_cookies,
        headers=csrf_headers,
    )
    assert response.status_code == 403


async def test_admin_member_cannot_delete_project(
    client: AsyncClient,
    other_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_project: Project,
    accepted_admin_member: ProjectMember,
):
    """Admin member cannot delete project (owner-only route)."""
    response = await client.delete(
        f"{BASE}/{test_project.id}",
        cookies=other_cookies,
        headers=csrf_headers,
    )
    assert response.status_code == 403


async def test_admin_member_cannot_rotate_key(
    client: AsyncClient,
    other_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_project: Project,
    accepted_admin_member: ProjectMember,
):
    """Admin member cannot rotate API key (owner-only route)."""
    response = await client.post(
        f"{BASE}/{test_project.id}/rotate-key",
        cookies=other_cookies,
        headers=csrf_headers,
    )
    assert response.status_code == 403


async def test_admin_member_can_view_project(
    client: AsyncClient,
    other_cookies: dict[str, str],
    test_project: Project,
    accepted_admin_member: ProjectMember,
):
    """Accepted admin member can view project detail (read-only route)."""
    response = await client.get(
        f"{BASE}/{test_project.id}",
        cookies=other_cookies,
    )
    assert response.status_code == 200
    assert response.json()["name"] == test_project.name


# ---- Fix 2: Invite acceptance bypass ----


async def test_unaccepted_member_cannot_view_project(
    client: AsyncClient,
    other_cookies: dict[str, str],
    test_project: Project,
    unaccepted_member: ProjectMember,
):
    """User invited but not accepted cannot access project."""
    response = await client.get(
        f"{BASE}/{test_project.id}",
        cookies=other_cookies,
    )
    assert response.status_code == 403


async def test_unaccepted_member_cannot_list_team(
    client: AsyncClient,
    other_cookies: dict[str, str],
    test_project: Project,
    unaccepted_member: ProjectMember,
):
    """User invited but not accepted cannot list team members."""
    response = await client.get(
        f"{BASE}/{test_project.id}/members",
        cookies=other_cookies,
    )
    assert response.status_code == 403


async def test_accepted_member_can_list_team(
    client: AsyncClient,
    other_cookies: dict[str, str],
    test_project: Project,
    accepted_admin_member: ProjectMember,
):
    """Accepted admin member can list team members."""
    response = await client.get(
        f"{BASE}/{test_project.id}/members",
        cookies=other_cookies,
    )
    assert response.status_code == 200


# ---- Fix 3: Manageable projects list ----


async def test_manageable_includes_admin_member_projects(
    client: AsyncClient,
    other_cookies: dict[str, str],
    test_project: Project,
    accepted_admin_member: ProjectMember,
):
    """manageable=true returns projects where user is an accepted admin member."""
    response = await client.get(
        f"{BASE}?manageable=true",
        cookies=other_cookies,
    )
    assert response.status_code == 200
    ids = [p["id"] for p in response.json()]
    assert str(test_project.id) in ids


async def test_manageable_excludes_unaccepted(
    client: AsyncClient,
    other_cookies: dict[str, str],
    test_project: Project,
    unaccepted_member: ProjectMember,
):
    """manageable=true does not return projects for unaccepted invites."""
    response = await client.get(
        f"{BASE}?manageable=true",
        cookies=other_cookies,
    )
    assert response.status_code == 200
    ids = [p["id"] for p in response.json()]
    assert str(test_project.id) not in ids


async def test_default_list_only_owned(
    client: AsyncClient,
    other_cookies: dict[str, str],
    test_project: Project,
    accepted_admin_member: ProjectMember,
):
    """Default list (no manageable flag) only returns owned projects."""
    response = await client.get(
        BASE,
        cookies=other_cookies,
    )
    assert response.status_code == 200
    ids = [p["id"] for p in response.json()]
    assert str(test_project.id) not in ids
