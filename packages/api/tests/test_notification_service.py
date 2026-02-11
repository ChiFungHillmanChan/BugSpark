"""Tests for notification_service: tracking_id reading from snake_case payload."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import Plan, Role
from app.models.project import Project
from app.models.user import User
from app.routers.projects import _api_key_prefix, _generate_api_key, _hash_api_key
from app.services.auth_service import hash_password
from app.services.notification_service import notify_new_report


@pytest.fixture()
async def owner_with_prefs(db_session: AsyncSession) -> User:
    user = User(
        id=uuid.uuid4(),
        email="owner-notify@example.com",
        hashed_password=hash_password("Pass123!"),
        name="Notify Owner",
        role=Role.USER,
        plan=Plan.FREE,
        is_active=True,
        notification_preferences={"email_on_critical": True, "email_on_high": True},
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture()
async def notify_project(db_session: AsyncSession, owner_with_prefs: User) -> Project:
    raw_key = _generate_api_key()
    project = Project(
        id=uuid.uuid4(),
        owner_id=owner_with_prefs.id,
        name="Notify Project",
        domain="notify.example.com",
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


async def test_tracking_id_included_in_email(
    db_session: AsyncSession,
    notify_project: Project,
    owner_with_prefs: User,
):
    """Email body includes tracking_id from snake_case payload."""
    report_data = {
        "severity": "critical",
        "title": "App crashes on login",
        "tracking_id": "BUG-0042",
    }

    with (
        patch("app.database.async_session") as mock_session_factory,
        patch("app.services.notification_service.send_email", new_callable=AsyncMock) as mock_send,
    ):
        mock_ctx = MagicMock()
        mock_ctx.__aenter__ = AsyncMock(return_value=db_session)
        mock_ctx.__aexit__ = AsyncMock(return_value=False)
        mock_session_factory.return_value = mock_ctx

        await notify_new_report(str(notify_project.id), report_data)
        mock_send.assert_called_once()
        html_body = mock_send.call_args[1].get("html") or mock_send.call_args[0][2]
        assert "BUG-0042" in html_body


async def test_tracking_id_camelcase_not_read(
    db_session: AsyncSession,
    notify_project: Project,
    owner_with_prefs: User,
):
    """Old camelCase key trackingId is no longer read (regression check)."""
    report_data = {
        "severity": "critical",
        "title": "Old format report",
        "trackingId": "BUG-OLD",
    }

    with (
        patch("app.database.async_session") as mock_session_factory,
        patch("app.services.notification_service.send_email", new_callable=AsyncMock) as mock_send,
    ):
        mock_ctx = MagicMock()
        mock_ctx.__aenter__ = AsyncMock(return_value=db_session)
        mock_ctx.__aexit__ = AsyncMock(return_value=False)
        mock_session_factory.return_value = mock_ctx

        await notify_new_report(str(notify_project.id), report_data)
        mock_send.assert_called_once()
        html_body = mock_send.call_args[1].get("html") or mock_send.call_args[0][2]
        assert "BUG-OLD" not in html_body
