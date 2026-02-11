from __future__ import annotations

import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.models.report import Category, Report, Severity, Status
from app.services.spam_protection_service import (
    check_honeypot,
    is_duplicate_report,
    validate_origin,
)


class TestCheckHoneypot:
    def test_returns_false_for_none(self) -> None:
        assert check_honeypot(None) is False

    def test_returns_false_for_empty_string(self) -> None:
        assert check_honeypot("") is False

    def test_returns_true_for_bot_value(self) -> None:
        assert check_honeypot("bot-value") is True

    def test_returns_true_for_whitespace(self) -> None:
        assert check_honeypot(" ") is True


class TestIsDuplicateReport:
    @pytest.mark.asyncio
    async def test_returns_true_for_duplicate_title(
        self, db_session: AsyncSession, test_project: tuple[Project, str]
    ) -> None:
        project, _ = test_project
        report = Report(
            id=uuid.uuid4(),
            project_id=project.id,
            tracking_id="TST-1",
            title="Crash on login",
            description="App crashes when clicking login",
            severity=Severity.HIGH,
            category=Category.BUG,
            status=Status.NEW,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db_session.add(report)
        await db_session.commit()

        result = await is_duplicate_report(
            db_session, str(project.id), "Crash on login"
        )
        assert result is True

    @pytest.mark.asyncio
    async def test_returns_false_for_different_title(
        self, db_session: AsyncSession, test_project: tuple[Project, str]
    ) -> None:
        project, _ = test_project
        report = Report(
            id=uuid.uuid4(),
            project_id=project.id,
            tracking_id="TST-2",
            title="Crash on login",
            description="App crashes when clicking login",
            severity=Severity.HIGH,
            category=Category.BUG,
            status=Status.NEW,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db_session.add(report)
        await db_session.commit()

        result = await is_duplicate_report(
            db_session, str(project.id), "Completely different bug"
        )
        assert result is False

    @pytest.mark.asyncio
    async def test_returns_false_for_different_project(
        self, db_session: AsyncSession, test_project: tuple[Project, str]
    ) -> None:
        project, _ = test_project
        other_project_id = uuid.uuid4()
        report = Report(
            id=uuid.uuid4(),
            project_id=project.id,
            tracking_id="TST-3",
            title="Crash on login",
            description="App crashes when clicking login",
            severity=Severity.HIGH,
            category=Category.BUG,
            status=Status.NEW,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db_session.add(report)
        await db_session.commit()

        result = await is_duplicate_report(
            db_session, str(other_project_id), "Crash on login"
        )
        assert result is False


def _make_request(headers: dict[str, str] | None = None) -> MagicMock:
    mock_request = MagicMock()
    mock_request.headers = headers or {}
    return mock_request


def _make_project(domain: str) -> MagicMock:
    mock_project = MagicMock()
    mock_project.domain = domain
    return mock_project


class TestValidateOrigin:
    def test_returns_true_when_no_domain_configured(self) -> None:
        project = MagicMock()
        project.domain = ""
        request = _make_request({"origin": "https://evil.com"})
        assert validate_origin(request, project) is True

    def test_returns_true_for_matching_domain(self) -> None:
        project = _make_project("example.com")
        request = _make_request({"origin": "https://example.com"})
        assert validate_origin(request, project) is True

    def test_returns_true_for_subdomain(self) -> None:
        project = _make_project("example.com")
        request = _make_request({"origin": "https://app.example.com"})
        assert validate_origin(request, project) is True

    def test_returns_false_for_mismatched_domain(self) -> None:
        project = _make_project("example.com")
        request = _make_request({"origin": "https://evil.com"})
        assert validate_origin(request, project) is False

    def test_returns_true_when_no_origin_header(self) -> None:
        project = _make_project("example.com")
        request = _make_request({})
        assert validate_origin(request, project) is True

    def test_falls_back_to_referer(self) -> None:
        project = _make_project("example.com")
        request = _make_request({"referer": "https://example.com/page"})
        assert validate_origin(request, project) is True

    def test_referer_mismatch(self) -> None:
        project = _make_project("example.com")
        request = _make_request({"referer": "https://evil.com/page"})
        assert validate_origin(request, project) is False

    def test_domain_stored_as_full_url(self) -> None:
        project = _make_project("https://example.com")
        request = _make_request({"origin": "https://example.com"})
        assert validate_origin(request, project) is True

    def test_domain_stored_as_url_with_path(self) -> None:
        project = _make_project("https://example.com/app")
        request = _make_request({"origin": "https://example.com"})
        assert validate_origin(request, project) is True

    def test_domain_stored_as_host_with_port(self) -> None:
        project = _make_project("localhost:3000")
        request = _make_request({"origin": "http://localhost:3000"})
        assert validate_origin(request, project) is True

    def test_domain_stored_as_host_port_subdomain(self) -> None:
        project = _make_project("example.com:8080")
        request = _make_request({"origin": "https://app.example.com"})
        assert validate_origin(request, project) is True

    def test_domain_stored_as_url_rejects_mismatch(self) -> None:
        project = _make_project("https://example.com")
        request = _make_request({"origin": "https://evil.com"})
        assert validate_origin(request, project) is False
