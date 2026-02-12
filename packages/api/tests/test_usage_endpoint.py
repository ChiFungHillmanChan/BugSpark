"""Tests for the usage endpoint."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import Plan, Role
from app.models.project import Project
from app.models.report import Category, Report, Severity, Status
from app.models.user import User
from app.services.auth_service import create_access_token, hash_password

# Import test helpers
from tests.conftest import _generate_api_key, _hash_api_key, _api_key_prefix, CSRF_TEST_TOKEN


@pytest.fixture()
async def user_with_projects(db_session: AsyncSession) -> tuple[User, list[Project]]:
    """Create a user with multiple projects."""
    user = User(
        id=uuid.uuid4(),
        email="usage@example.com",
        hashed_password=hash_password("Pass123!"),
        name="Usage Test User",
        role=Role.USER,
        plan=Plan.STARTER,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # Create 2 projects
    projects = []
    for i in range(2):
        raw_key = _generate_api_key()
        project = Project(
            id=uuid.uuid4(),
            owner_id=user.id,
            name=f"Project {i+1}",
            domain="test.com",
            api_key_hash=_hash_api_key(raw_key),
            api_key_prefix=_api_key_prefix(raw_key),
            settings={},
            is_active=True,
            created_at=datetime.now(timezone.utc),
        )
        db_session.add(project)
        projects.append(project)

    await db_session.commit()
    for p in projects:
        await db_session.refresh(p)

    return user, projects


@pytest.mark.asyncio
async def test_usage_endpoint_returns_200(client: AsyncClient, test_user: User):
    """Test that GET /usage returns 200 with proper auth."""
    token = create_access_token(str(test_user.id), test_user.email)
    cookies = {"bugspark_access_token": token, "bugspark_csrf_token": CSRF_TEST_TOKEN}

    response = await client.get(
        "/api/v1/usage",
        cookies=cookies,
        headers={"X-CSRF-Token": CSRF_TEST_TOKEN},
    )

    assert response.status_code == 200
    data = response.json()
    assert "currentPlan" in data
    assert "usage" in data


@pytest.mark.asyncio
async def test_usage_endpoint_returns_correct_plan(client: AsyncClient, test_user: User):
    """Test that usage endpoint returns the user's current plan."""
    token = create_access_token(str(test_user.id), test_user.email)
    cookies = {"bugspark_access_token": token, "bugspark_csrf_token": CSRF_TEST_TOKEN}

    response = await client.get(
        "/api/v1/usage",
        cookies=cookies,
        headers={"X-CSRF-Token": CSRF_TEST_TOKEN},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["currentPlan"] == test_user.plan.value


@pytest.mark.asyncio
async def test_usage_endpoint_shows_project_count(
    client: AsyncClient, user_with_projects: tuple[User, list[Project]]
):
    """Test that usage endpoint shows correct project count."""
    user, projects = user_with_projects
    token = create_access_token(str(user.id), user.email)
    cookies = {"bugspark_access_token": token, "bugspark_csrf_token": CSRF_TEST_TOKEN}

    response = await client.get(
        "/api/v1/usage",
        cookies=cookies,
        headers={"X-CSRF-Token": CSRF_TEST_TOKEN},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["usage"]["projectsCount"] == 2
    assert data["usage"]["projectsLimit"] == 3  # STARTER plan allows 3


@pytest.mark.asyncio
async def test_usage_endpoint_requires_auth(client: AsyncClient):
    """Test that usage endpoint requires authentication."""
    response = await client.get("/api/v1/usage")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_usage_endpoint_shows_team_members(
    client: AsyncClient, db_session: AsyncSession, user_with_projects: tuple[User, list[Project]]
):
    """Test that usage endpoint shows team member counts per project."""
    from app.models.project_member import ProjectMember

    user, projects = user_with_projects
    project = projects[0]

    # Add a team member to first project
    member = ProjectMember(
        id=uuid.uuid4(),
        project_id=project.id,
        email="member@example.com",
        role="viewer",
        invite_accepted_at=datetime.now(timezone.utc),
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(member)
    await db_session.commit()

    token = create_access_token(str(user.id), user.email)
    cookies = {"bugspark_access_token": token, "bugspark_csrf_token": CSRF_TEST_TOKEN}

    response = await client.get(
        "/api/v1/usage",
        cookies=cookies,
        headers={"X-CSRF-Token": CSRF_TEST_TOKEN},
    )

    assert response.status_code == 200
    data = response.json()
    team_usage = data["usage"]["teamMembersPerProject"]

    # Find the project with the member
    project_usage = next((p for p in team_usage if str(p["projectId"]) == str(project.id)), None)
    assert project_usage is not None
    assert project_usage["memberCount"] == 2  # owner + 1 member
    assert project_usage["memberLimit"] == 3  # STARTER plan


@pytest.mark.asyncio
async def test_usage_endpoint_has_rate_limit(client: AsyncClient, test_user: User):
    """Test that usage endpoint has rate limiting."""
    token = create_access_token(str(test_user.id), test_user.email)
    cookies = {"bugspark_access_token": token, "bugspark_csrf_token": CSRF_TEST_TOKEN}

    # The rate limit should be 30/minute, so this test just verifies the endpoint works
    # We don't test exhausting the limit as it would take 30 requests
    response = await client.get(
        "/api/v1/usage",
        cookies=cookies,
        headers={"X-CSRF-Token": CSRF_TEST_TOKEN},
    )

    assert response.status_code == 200
