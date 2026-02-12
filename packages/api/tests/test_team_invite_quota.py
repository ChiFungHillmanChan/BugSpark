"""Integration tests for team member invite quota enforcement."""
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
from app.services.auth_service import create_access_token, hash_password

# Import test helpers
from tests.conftest import _generate_api_key, _hash_api_key, _api_key_prefix, CSRF_TEST_TOKEN


@pytest.fixture()
async def free_user_with_project(client: AsyncClient, db_session: AsyncSession) -> tuple[User, Project, str, dict]:
    """Create a FREE plan user with a project and auth."""
    # Create user
    user = User(
        id=uuid.uuid4(),
        email="free_invite@example.com",
        hashed_password=hash_password("Pass123!"),
        name="Free User",
        role=Role.USER,
        plan=Plan.FREE,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # Create project
    raw_key = _generate_api_key()
    project = Project(
        id=uuid.uuid4(),
        owner_id=user.id,
        name="Free Project",
        domain="free.com",
        api_key_hash=_hash_api_key(raw_key),
        api_key_prefix=_api_key_prefix(raw_key),
        settings={},
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(project)
    await db_session.commit()
    await db_session.refresh(project)

    token = create_access_token(str(user.id), user.email)
    cookies = {"bugspark_access_token": token, "bugspark_csrf_token": CSRF_TEST_TOKEN}

    return user, project, token, cookies


@pytest.fixture()
async def starter_user_with_project(db_session: AsyncSession) -> tuple[User, Project, str, dict]:
    """Create a STARTER plan user with a project and auth."""
    # Create user
    user = User(
        id=uuid.uuid4(),
        email="starter_invite@example.com",
        hashed_password=hash_password("Pass123!"),
        name="Starter User",
        role=Role.USER,
        plan=Plan.STARTER,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # Create project
    raw_key = _generate_api_key()
    project = Project(
        id=uuid.uuid4(),
        owner_id=user.id,
        name="Starter Project",
        domain="starter.com",
        api_key_hash=_hash_api_key(raw_key),
        api_key_prefix=_api_key_prefix(raw_key),
        settings={},
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(project)
    await db_session.commit()
    await db_session.refresh(project)

    token = create_access_token(str(user.id), user.email)
    cookies = {"bugspark_access_token": token, "bugspark_csrf_token": CSRF_TEST_TOKEN}

    return user, project, token, cookies


@pytest.mark.asyncio
async def test_free_user_cannot_invite_members(
    client: AsyncClient, free_user_with_project: tuple[User, Project, str, dict]
):
    """Test that FREE plan users cannot invite anyone."""
    user, project, token, cookies = free_user_with_project

    response = await client.post(
        f"/api/v1/projects/{project.id}/members",
        json={"email": "newmember@example.com", "role": "viewer"},
        cookies=cookies,
        headers={"X-CSRF-Token": CSRF_TEST_TOKEN},
    )

    # Should get 403 Forbidden due to plan limit
    assert response.status_code == 403
    assert "Plan limit" in response.json().get("detail", "")


@pytest.mark.asyncio
async def test_starter_user_can_invite_up_to_limit(
    client: AsyncClient, starter_user_with_project: tuple[User, Project, str, dict], db_session: AsyncSession
):
    """Test that STARTER plan user can invite up to 2 more members (3 total)."""
    user, project, token, cookies = starter_user_with_project

    # Invite 1st member - should succeed
    response = await client.post(
        f"/api/v1/projects/{project.id}/members",
        json={"email": "member1@example.com", "role": "viewer"},
        cookies=cookies,
        headers={"X-CSRF-Token": CSRF_TEST_TOKEN},
    )
    assert response.status_code == 201

    # Invite 2nd member - should succeed (now at limit: owner + 2)
    response = await client.post(
        f"/api/v1/projects/{project.id}/members",
        json={"email": "member2@example.com", "role": "viewer"},
        cookies=cookies,
        headers={"X-CSRF-Token": CSRF_TEST_TOKEN},
    )
    assert response.status_code == 201

    # Invite 3rd member - should fail (would exceed limit)
    response = await client.post(
        f"/api/v1/projects/{project.id}/members",
        json={"email": "member3@example.com", "role": "viewer"},
        cookies=cookies,
        headers={"X-CSRF-Token": CSRF_TEST_TOKEN},
    )
    assert response.status_code == 403
    assert "Plan limit" in response.json().get("detail", "")


@pytest.mark.asyncio
async def test_invite_endpoint_requires_authentication(client: AsyncClient, test_project):
    """Test that POST invite endpoint requires authentication."""
    project, _ = test_project

    response = await client.post(
        f"/api/v1/projects/{project.id}/members",
        json={"email": "newmember@example.com", "role": "viewer"},
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_invite_endpoint_requires_project_admin(
    client: AsyncClient, db_session: AsyncSession, test_user: User
):
    """Test that only project admins can invite members."""
    # Create another user (non-owner)
    other_user = User(
        id=uuid.uuid4(),
        email="other@example.com",
        hashed_password=hash_password("Pass123!"),
        name="Other User",
        role=Role.USER,
        plan=Plan.FREE,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(other_user)
    await db_session.commit()
    await db_session.refresh(other_user)

    # Create a project owned by test_user (TEAM plan)
    test_user.plan = Plan.TEAM
    await db_session.commit()

    raw_key = _generate_api_key()
    project = Project(
        id=uuid.uuid4(),
        owner_id=test_user.id,
        name="Team Project",
        domain="team.com",
        api_key_hash=_hash_api_key(raw_key),
        api_key_prefix=_api_key_prefix(raw_key),
        settings={},
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(project)
    await db_session.commit()
    await db_session.refresh(project)

    # Try to invite as non-owner
    token = create_access_token(str(other_user.id), other_user.email)
    cookies = {"bugspark_access_token": token, "bugspark_csrf_token": CSRF_TEST_TOKEN}

    response = await client.post(
        f"/api/v1/projects/{project.id}/members",
        json={"email": "newmember@example.com", "role": "viewer"},
        cookies=cookies,
        headers={"X-CSRF-Token": CSRF_TEST_TOKEN},
    )

    # Should get 403 because user is not project admin
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_invite_returns_error_code_for_quota_exceeded(
    client: AsyncClient, free_user_with_project: tuple[User, Project, str, dict]
):
    """Test that error response includes appropriate error details."""
    user, project, token, cookies = free_user_with_project

    response = await client.post(
        f"/api/v1/projects/{project.id}/members",
        json={"email": "newmember@example.com", "role": "viewer"},
        cookies=cookies,
        headers={"X-CSRF-Token": CSRF_TEST_TOKEN},
    )

    assert response.status_code == 403
    data = response.json()
    assert "detail" in data
    assert "upgrade" in data.get("detail", "").lower() or "plan" in data.get("detail", "").lower()


@pytest.mark.asyncio
async def test_invite_duplicate_member(
    client: AsyncClient, starter_user_with_project: tuple[User, Project, str, dict], db_session: AsyncSession
):
    """Test that inviting duplicate members returns appropriate error."""
    user, project, token, cookies = starter_user_with_project

    # Invite member 1st time
    response = await client.post(
        f"/api/v1/projects/{project.id}/members",
        json={"email": "duplicate@example.com", "role": "viewer"},
        cookies=cookies,
        headers={"X-CSRF-Token": CSRF_TEST_TOKEN},
    )
    assert response.status_code == 201

    # Try to invite same member again
    response = await client.post(
        f"/api/v1/projects/{project.id}/members",
        json={"email": "duplicate@example.com", "role": "viewer"},
        cookies=cookies,
        headers={"X-CSRF-Token": CSRF_TEST_TOKEN},
    )

    # Should get 400 Bad Request for duplicate
    assert response.status_code == 400
    assert "member" in response.json().get("detail", "").lower()
