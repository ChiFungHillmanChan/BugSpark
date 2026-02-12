"""Integration tests for usage tracking and billing endpoints."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import Plan, Role
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.report import Category, Report, Severity, Status
from app.models.user import User
from app.services.auth_service import create_access_token, hash_password

# Import test helpers
from tests.conftest import _generate_api_key, _hash_api_key, _api_key_prefix, CSRF_TEST_TOKEN


@pytest.fixture()
async def starter_user_with_project(db_session: AsyncSession) -> tuple[User, Project, str]:
    """Create a STARTER user with a project and multiple reports."""
    # Create user
    user = User(
        id=uuid.uuid4(),
        email="starter@example.com",
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
        name="Test Project",
        domain="test.com",
        api_key_hash=_hash_api_key(raw_key),
        api_key_prefix=_api_key_prefix(raw_key),
        settings={},
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(project)
    await db_session.commit()
    await db_session.refresh(project)

    # Create some reports
    for i in range(5):
        report = Report(
            id=uuid.uuid4(),
            project_id=project.id,
            tracking_id=f"BUG-{i+1:04d}",
            title=f"Bug {i+1}",
            description="Test description",
            severity=Severity.MEDIUM,
            category=Category.BUG,
            status=Status.NEW,
            created_at=datetime.now(timezone.utc),
        )
        db_session.add(report)
    await db_session.commit()

    # Create token
    token = create_access_token(str(user.id), user.email)

    return user, project, token


@pytest.fixture()
async def team_user_with_members(db_session: AsyncSession) -> tuple[User, Project, str]:
    """Create a TEAM user with a project and team members."""
    # Create user
    user = User(
        id=uuid.uuid4(),
        email="team@example.com",
        hashed_password=hash_password("Pass123!"),
        name="Team User",
        role=Role.USER,
        plan=Plan.TEAM,
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

    # Add team members
    for i in range(3):
        member = ProjectMember(
            id=uuid.uuid4(),
            project_id=project.id,
            email=f"member{i}@example.com",
            role="member",
            invite_accepted_at=datetime.now(timezone.utc),
            created_at=datetime.now(timezone.utc),
        )
        db_session.add(member)
    await db_session.commit()

    # Create token
    token = create_access_token(str(user.id), user.email)

    return user, project, token


@pytest.mark.asyncio
async def test_usage_endpoint_requires_auth(client: AsyncClient):
    """Test that GET /usage requires authentication."""
    response = await client.get("/api/v1/auth/usage")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_usage_endpoint_returns_200_when_authenticated(
    client: AsyncClient, starter_user_with_project: tuple[User, Project, str]
):
    """Test that GET /usage returns 200 when authenticated."""
    _user, _project, token = starter_user_with_project
    response = await client.get(
        "/api/v1/auth/usage",
        cookies={"bugspark_access_token": token},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_usage_endpoint_returns_correct_schema(
    client: AsyncClient, starter_user_with_project: tuple[User, Project, str]
):
    """Test that GET /usage returns correct schema."""
    _user, _project, token = starter_user_with_project
    response = await client.get(
        "/api/v1/auth/usage",
        cookies={"bugspark_access_token": token},
    )
    assert response.status_code == 200
    data = response.json()

    # Check that all expected fields are present
    assert "projects" in data
    assert "reportsThisMonth" in data
    # Each should have current and limit
    assert "current" in data["projects"]
    assert "limit" in data["projects"]
    assert "current" in data["reportsThisMonth"]
    assert "limit" in data["reportsThisMonth"]


@pytest.mark.asyncio
async def test_usage_calculation_starter_plan(
    client: AsyncClient, starter_user_with_project: tuple[User, Project, str]
):
    """Test that usage is calculated correctly for STARTER plan."""
    _user, _project, token = starter_user_with_project
    response = await client.get(
        "/api/v1/auth/usage",
        cookies={"bugspark_access_token": token},
    )
    assert response.status_code == 200
    data = response.json()

    # STARTER plan limits: 3 projects, 500 reports/month
    assert data["projects"]["current"] == 1
    assert data["projects"]["limit"] == 3
    assert data["reportsThisMonth"]["current"] == 5
    assert data["reportsThisMonth"]["limit"] == 500


@pytest.mark.asyncio
async def test_usage_calculation_team_plan_with_members(
    client: AsyncClient, team_user_with_members: tuple[User, Project, str]
):
    """Test that team member count is included in usage."""
    _user, _project, token = team_user_with_members
    response = await client.get(
        "/api/v1/auth/usage",
        cookies={"bugspark_access_token": token},
    )
    assert response.status_code == 200
    data = response.json()

    # TEAM plan limits
    assert data["projects"]["limit"] == 10


@pytest.mark.asyncio
async def test_usage_endpoint_free_plan(client: AsyncClient, test_user: User):
    """Test usage endpoint for FREE plan."""
    token = create_access_token(str(test_user.id), test_user.email)
    response = await client.get(
        "/api/v1/auth/usage",
        cookies={"bugspark_access_token": token},
    )
    assert response.status_code == 200
    data = response.json()

    # FREE plan limits
    assert data["projects"]["limit"] == 1
    assert data["reportsThisMonth"]["limit"] == 50


@pytest.mark.asyncio
async def test_usage_endpoint_enterprise_plan(
    client: AsyncClient, db_session: AsyncSession
):
    """Test usage endpoint for ENTERPRISE plan."""
    # Create enterprise user
    user = User(
        id=uuid.uuid4(),
        email="enterprise@example.com",
        hashed_password=hash_password("Pass123!"),
        name="Enterprise User",
        role=Role.USER,
        plan=Plan.ENTERPRISE,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    token = create_access_token(str(user.id), user.email)
    response = await client.get(
        "/api/v1/auth/usage",
        cookies={"bugspark_access_token": token},
    )
    assert response.status_code == 200
    data = response.json()

    # ENTERPRISE plan has unlimited everything
    assert data["projects"]["limit"] is None  # Unlimited
    assert data["reportsThisMonth"]["limit"] is None  # Unlimited


@pytest.mark.asyncio
async def test_usage_endpoint_rate_limiting(
    client: AsyncClient, test_user: User
):
    """Test that usage endpoint respects rate limiting (30/minute)."""
    token = create_access_token(str(test_user.id), test_user.email)

    # Make 31 requests quickly
    for i in range(31):
        response = await client.get(
            "/api/v1/auth/usage",
            cookies={"bugspark_access_token": token},
        )
        if i < 30:
            assert response.status_code == 200
        else:
            # 31st request should be rate limited
            assert response.status_code == 429


@pytest.mark.asyncio
async def test_usage_multiple_projects_counted(
    client: AsyncClient, db_session: AsyncSession
):
    """Test that usage endpoint counts multiple projects."""
    # Create user
    user = User(
        id=uuid.uuid4(),
        email="multiproject@example.com",
        hashed_password=hash_password("Pass123!"),
        name="Multi Project User",
        role=Role.USER,
        plan=Plan.TEAM,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # Create 5 projects
    for j in range(5):
        raw_key = _generate_api_key()
        project = Project(
            id=uuid.uuid4(),
            owner_id=user.id,
            name=f"Project {j}",
            domain=f"project{j}.com",
            api_key_hash=_hash_api_key(raw_key),
            api_key_prefix=_api_key_prefix(raw_key),
            settings={},
            is_active=True,
            created_at=datetime.now(timezone.utc),
        )
        db_session.add(project)
    await db_session.commit()

    token = create_access_token(str(user.id), user.email)
    response = await client.get(
        "/api/v1/auth/usage",
        cookies={"bugspark_access_token": token},
    )
    assert response.status_code == 200
    data = response.json()

    # Should count all 5 projects
    assert data["projects"]["current"] == 5
    assert data["projects"]["limit"] == 10


@pytest.mark.asyncio
async def test_usage_monthly_reports_counted(
    client: AsyncClient, db_session: AsyncSession
):
    """Test that usage endpoint counts monthly reports correctly."""
    # Create user
    user = User(
        id=uuid.uuid4(),
        email="monthlyreports@example.com",
        hashed_password=hash_password("Pass123!"),
        name="Monthly Reports User",
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
        name="Report Test Project",
        domain="reports.com",
        api_key_hash=_hash_api_key(raw_key),
        api_key_prefix=_api_key_prefix(raw_key),
        settings={},
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(project)
    await db_session.commit()
    await db_session.refresh(project)

    # Create 20 reports this month
    for i in range(20):
        report = Report(
            id=uuid.uuid4(),
            project_id=project.id,
            tracking_id=f"RPT-{i:04d}",
            title=f"Report {i}",
            description="Test",
            severity=Severity.LOW,
            category=Category.BUG,
            status=Status.NEW,
            created_at=datetime.now(timezone.utc),
        )
        db_session.add(report)
    await db_session.commit()

    token = create_access_token(str(user.id), user.email)
    response = await client.get(
        "/api/v1/auth/usage",
        cookies={"bugspark_access_token": token},
    )
    assert response.status_code == 200
    data = response.json()

    # Should count all 20 reports this month
    assert data["reportsThisMonth"]["current"] == 20
    assert data["reportsThisMonth"]["limit"] == 500
