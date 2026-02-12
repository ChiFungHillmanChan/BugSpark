from __future__ import annotations

import uuid
from datetime import datetime, timezone

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import Plan, Role
from app.models.project import Project
from app.models.report import Category, Report, Severity
from app.models.user import User
from app.services.auth_service import create_access_token, hash_password

BASE = "/api/v1/reports"
CSRF_TOKEN = "test-csrf-token"


async def _create_report(db_session: AsyncSession, project: Project) -> Report:
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


def _cookies_for(user: User) -> dict[str, str]:
    token = create_access_token(str(user.id), user.email)
    return {
        "bugspark_access_token": token,
        "bugspark_csrf_token": CSRF_TOKEN,
    }


async def _create_user_with_plan(
    db_session: AsyncSession, plan: Plan, email: str
) -> User:
    user = User(
        id=uuid.uuid4(),
        email=email,
        hashed_password=hash_password("TestPassword123!"),
        name=f"User {plan.value}",
        role=Role.USER,
        plan=plan,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.mark.asyncio
async def test_free_plan_blocked_from_analysis(
    client: AsyncClient, db_session: AsyncSession, test_project: tuple[Project, str]
):
    project, _ = test_project
    report = await _create_report(db_session, project)
    free_user = await _create_user_with_plan(db_session, Plan.FREE, "free@example.com")
    cookies = _cookies_for(free_user)
    headers = {"X-CSRF-Token": CSRF_TOKEN}

    resp = await client.post(
        f"{BASE}/{report.id}/analyze", cookies=cookies, headers=headers
    )
    assert resp.status_code == 403
    assert "Enterprise" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_pro_plan_blocked_from_analysis(
    client: AsyncClient, db_session: AsyncSession, test_project: tuple[Project, str]
):
    project, _ = test_project
    report = await _create_report(db_session, project)
    pro_user = await _create_user_with_plan(db_session, Plan.STARTER, "starter@example.com")
    cookies = _cookies_for(pro_user)
    headers = {"X-CSRF-Token": CSRF_TOKEN}

    resp = await client.post(
        f"{BASE}/{report.id}/analyze", cookies=cookies, headers=headers
    )
    assert resp.status_code == 403
    assert "Enterprise" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_free_plan_blocked_from_stream(
    client: AsyncClient, db_session: AsyncSession, test_project: tuple[Project, str]
):
    project, _ = test_project
    report = await _create_report(db_session, project)
    free_user = await _create_user_with_plan(db_session, Plan.FREE, "free2@example.com")
    cookies = _cookies_for(free_user)
    headers = {"X-CSRF-Token": CSRF_TOKEN}

    resp = await client.post(
        f"{BASE}/{report.id}/analyze/stream", cookies=cookies, headers=headers
    )
    assert resp.status_code == 403
    assert "Enterprise" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_superadmin_bypasses_plan_gate(
    client: AsyncClient,
    db_session: AsyncSession,
    test_project: tuple[Project, str],
    test_superadmin: User,
    superadmin_cookies: dict[str, str],
    csrf_headers: dict[str, str],
):
    """Superadmin can access analysis regardless of plan."""
    project, _ = test_project
    report = await _create_report(db_session, project)

    resp = await client.post(
        f"{BASE}/{report.id}/analyze",
        cookies=superadmin_cookies,
        headers=csrf_headers,
    )
    # Should not be 403 — it may fail for other reasons (no API key configured)
    # but the plan gate itself must not block superadmin.
    assert resp.status_code != 403
