"""Tests for team member limit enforcement."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import ForbiddenException
from app.models.enums import Plan, Role
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.user import User
from app.services.auth_service import hash_password
from app.services.plan_limits_service import check_team_member_limit

# Import test helpers
from tests.conftest import _generate_api_key, _hash_api_key, _api_key_prefix


@pytest.fixture()
async def free_user(db_session: AsyncSession) -> User:
    """Create a FREE plan user."""
    user = User(
        id=uuid.uuid4(),
        email="free@example.com",
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
    return user


@pytest.fixture()
async def starter_user(db_session: AsyncSession) -> User:
    """Create a STARTER plan user."""
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
    return user


@pytest.fixture()
async def team_user(db_session: AsyncSession) -> User:
    """Create a TEAM plan user."""
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
    return user


@pytest.fixture()
async def enterprise_user(db_session: AsyncSession) -> User:
    """Create an ENTERPRISE plan user."""
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
    return user


@pytest.fixture()
async def free_user_project(db_session: AsyncSession, free_user: User) -> Project:
    """Create a test project owned by free_user."""
    raw_key = _generate_api_key()
    project = Project(
        id=uuid.uuid4(),
        owner_id=free_user.id,
        name="Free Project",
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
    return project


@pytest.fixture()
async def starter_user_project(db_session: AsyncSession, starter_user: User) -> Project:
    """Create a test project owned by starter_user."""
    raw_key = _generate_api_key()
    project = Project(
        id=uuid.uuid4(),
        owner_id=starter_user.id,
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
    return project


@pytest.fixture()
async def team_user_project(db_session: AsyncSession, team_user: User) -> Project:
    """Create a test project owned by team_user."""
    raw_key = _generate_api_key()
    project = Project(
        id=uuid.uuid4(),
        owner_id=team_user.id,
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
    return project


# Tests for check_team_member_limit function


@pytest.mark.asyncio
async def test_free_plan_cannot_invite_members(
    db_session: AsyncSession, free_user_project: Project
):
    """Test that FREE plan users cannot invite anyone (max=1 means owner only)."""
    with pytest.raises(ForbiddenException) as exc_info:
        await check_team_member_limit(db_session, free_user_project)
    assert "Plan limit" in str(exc_info.value)
    assert "upgrade" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_starter_plan_allows_up_to_2_invites(
    db_session: AsyncSession, starter_user_project: Project
):
    """Test that STARTER plan allows up to 3 members total (owner + 2 invites)."""
    # With only owner (1 member), should not raise
    await check_team_member_limit(db_session, starter_user_project)

    # Add one member (total = 2)
    member1 = ProjectMember(
        id=uuid.uuid4(),
        project_id=starter_user_project.id,
        email="member1@example.com",
        role="member",
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(member1)
    await db_session.commit()

    # With 2 members, should not raise
    await check_team_member_limit(db_session, starter_user_project)

    # Add another member (total = 3, at limit)
    member2 = ProjectMember(
        id=uuid.uuid4(),
        project_id=starter_user_project.id,
        email="member2@example.com",
        role="member",
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(member2)
    await db_session.commit()

    # With 3 members (at limit), should raise (limit check uses >=)
    with pytest.raises(ForbiddenException) as exc_info:
        await check_team_member_limit(db_session, starter_user_project)
    assert "Plan limit" in str(exc_info.value)


@pytest.mark.asyncio
async def test_team_plan_allows_up_to_9_members(
    db_session: AsyncSession, team_user_project: Project
):
    """Test that TEAM plan allows up to 10 members (owner + 9)."""
    # Add 8 members (total = 9 with owner, below limit)
    for i in range(8):
        member = ProjectMember(
            id=uuid.uuid4(),
            project_id=team_user_project.id,
            email=f"member{i}@example.com",
            role="member",
            created_at=datetime.now(timezone.utc),
        )
        db_session.add(member)
    await db_session.commit()

    # Should not raise with 9 total (below limit)
    await check_team_member_limit(db_session, team_user_project)

    # Add one more to reach limit
    member = ProjectMember(
        id=uuid.uuid4(),
        project_id=team_user_project.id,
        email="member9@example.com",
        role="member",
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(member)
    await db_session.commit()

    # With 10 members (at limit), should raise (limit check uses >=)
    with pytest.raises(ForbiddenException) as exc_info:
        await check_team_member_limit(db_session, team_user_project)
    assert "Plan limit" in str(exc_info.value)


@pytest.mark.asyncio
async def test_enterprise_plan_allows_unlimited_members(
    db_session: AsyncSession, enterprise_user: User
):
    """Test that ENTERPRISE plan allows unlimited members."""
    raw_key = _generate_api_key()
    project = Project(
        id=uuid.uuid4(),
        owner_id=enterprise_user.id,
        name="Enterprise Project",
        domain="enterprise.com",
        api_key_hash=_hash_api_key(raw_key),
        api_key_prefix=_api_key_prefix(raw_key),
        settings={},
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(project)
    await db_session.commit()
    await db_session.refresh(project)

    # Add 100 members
    for i in range(100):
        member = ProjectMember(
            id=uuid.uuid4(),
            project_id=project.id,
            email=f"member{i}@example.com",
            role="member",
            created_at=datetime.now(timezone.utc),
        )
        db_session.add(member)
    await db_session.commit()

    # With 101 members (owner + 100), should not raise
    await check_team_member_limit(db_session, project)


@pytest.mark.asyncio
async def test_superadmin_bypasses_team_member_limits(
    db_session: AsyncSession, test_superadmin: User
):
    """Test that SUPERADMIN role bypasses team member limits."""
    raw_key = _generate_api_key()
    project = Project(
        id=uuid.uuid4(),
        owner_id=test_superadmin.id,
        name="Superadmin Project",
        domain="superadmin.com",
        api_key_hash=_hash_api_key(raw_key),
        api_key_prefix=_api_key_prefix(raw_key),
        settings={},
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(project)
    await db_session.commit()
    await db_session.refresh(project)

    # Should not raise regardless of member count
    await check_team_member_limit(db_session, project)


@pytest.mark.asyncio
async def test_team_member_limit_error_message(
    db_session: AsyncSession, free_user_project: Project
):
    """Test that error message includes upgrade prompt."""
    with pytest.raises(ForbiddenException) as exc_info:
        await check_team_member_limit(db_session, free_user_project)
    error_msg = str(exc_info.value)
    assert "upgrade" in error_msg.lower() or "plan" in error_msg.lower()


@pytest.mark.asyncio
async def test_team_member_limit_error_code(
    db_session: AsyncSession, free_user_project: Project
):
    """Test that error is a ForbiddenException (correct error type)."""
    with pytest.raises(ForbiddenException):
        await check_team_member_limit(db_session, free_user_project)


@pytest.mark.asyncio
async def test_no_members_free_plan_blocks_invite(
    db_session: AsyncSession, free_user_project: Project
):
    """Test that FREE plan is blocked from inviting even with no members."""
    # FREE plan should be blocked immediately (max_members = 1 = owner only)
    with pytest.raises(ForbiddenException):
        await check_team_member_limit(db_session, free_user_project)
