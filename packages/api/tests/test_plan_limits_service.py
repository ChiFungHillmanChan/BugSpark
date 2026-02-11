"""Tests for plan limits enforcement."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import ForbiddenException
from app.models.enums import Plan, Role
from app.models.project import Project
from app.models.report import Category, Report, Severity, Status
from app.models.user import User
from app.services.auth_service import hash_password
from app.services.plan_limits_service import check_project_limit, check_report_limit


@pytest.fixture()
async def free_user(db_session: AsyncSession) -> User:
    user = User(
        id=uuid.uuid4(),
        email="freeuser@example.com",
        hashed_password=hash_password("FreePass123!"),
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
async def enterprise_user(db_session: AsyncSession) -> User:
    user = User(
        id=uuid.uuid4(),
        email="enterprise@example.com",
        hashed_password=hash_password("EnterprisePass123!"),
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


@pytest.mark.asyncio
async def test_free_user_can_create_first_project(db_session: AsyncSession, free_user: User):
    # Should not raise
    await check_project_limit(db_session, free_user)


@pytest.mark.asyncio
async def test_free_user_blocked_after_limit(db_session: AsyncSession, free_user: User):
    from tests.conftest import _generate_api_key, _hash_api_key, _api_key_prefix

    raw_key = _generate_api_key()
    project = Project(
        id=uuid.uuid4(),
        owner_id=free_user.id,
        name="Existing Project",
        domain="test.com",
        api_key_hash=_hash_api_key(raw_key),
        api_key_prefix=_api_key_prefix(raw_key),
        settings={},
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(project)
    await db_session.commit()

    with pytest.raises(ForbiddenException, match="Plan limit"):
        await check_project_limit(db_session, free_user)


@pytest.mark.asyncio
async def test_enterprise_user_no_project_limit(db_session: AsyncSession, enterprise_user: User):
    # Enterprise users should never be blocked
    await check_project_limit(db_session, enterprise_user)


@pytest.mark.asyncio
async def test_superadmin_bypasses_limits(db_session: AsyncSession, test_superadmin: User):
    await check_project_limit(db_session, test_superadmin)


@pytest.mark.asyncio
async def test_check_report_limit_with_owner_loaded(db_session: AsyncSession, free_user: User):
    from tests.conftest import _generate_api_key, _hash_api_key, _api_key_prefix

    raw_key = _generate_api_key()
    project = Project(
        id=uuid.uuid4(),
        owner_id=free_user.id,
        name="Report Test Project",
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

    # Should not raise for first report
    await check_report_limit(db_session, project)
