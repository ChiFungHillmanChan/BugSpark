from __future__ import annotations

import uuid
from datetime import datetime, timezone

import pytest

from app.schemas.project import ProjectResponse
from app.schemas.report import ReportCreate, ReportResponse
from app.schemas.stats import OverviewStats
from app.schemas.user import UserResponse


def _make_user_response() -> UserResponse:
    return UserResponse(
        id=uuid.uuid4(),
        email="schema@test.com",
        name="Schema User",
        created_at=datetime.now(timezone.utc),
    )


def test_report_response_camel_case():
    report = ReportResponse(
        id=uuid.uuid4(),
        project_id=uuid.uuid4(),
        tracking_id="BUG-0001",
        title="Test",
        description="Desc",
        severity="high",
        category="bug",
        status="new",
        assignee_id=None,
        screenshot_url=None,
        annotated_screenshot_url=None,
        console_logs=None,
        network_logs=None,
        user_actions=None,
        reporter_identifier=None,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    data = report.model_dump(by_alias=True)
    assert "trackingId" in data
    assert "projectId" in data
    assert "screenshotUrl" in data
    assert "annotatedScreenshotUrl" in data
    assert "reporterIdentifier" in data
    assert "createdAt" in data
    assert "tracking_id" not in data


def test_project_response_camel_case():
    project = ProjectResponse(
        id=uuid.uuid4(),
        name="My Project",
        domain="proj.com",
        api_key="bsk_pub_1234",
        is_active=True,
        created_at=datetime.now(timezone.utc),
        settings={},
    )
    data = project.model_dump(by_alias=True)
    assert "apiKey" in data
    assert "isActive" in data
    assert "createdAt" in data
    assert "api_key" not in data


def test_overview_stats_camel_case():
    stats = OverviewStats(
        total_bugs=10,
        open_bugs=3,
        resolved_today=2,
        avg_resolution_hours=4.5,
    )
    data = stats.model_dump(by_alias=True)
    assert "totalBugs" in data
    assert "openBugs" in data
    assert "resolvedToday" in data
    assert "avgResolutionHours" in data
    assert "total_bugs" not in data


def test_report_create_accepts_snake_case_input():
    """ReportCreate uses BaseModel (not CamelModel), so it accepts snake_case."""
    report = ReportCreate(
        title="Bug title",
        description="Bug desc",
        severity="high",
        category="bug",
        reporter_identifier="user@test.com",
        screenshot_url="https://example.com/shot.png",
    )
    assert report.reporter_identifier == "user@test.com"
    assert report.screenshot_url == "https://example.com/shot.png"


def test_report_create_sanitizes_html():
    """ReportCreate should strip HTML tags from title and description."""
    report = ReportCreate(
        title="<script>alert('xss')</script>Bug",
        description="<b>Bold</b> description",
        severity="high",
        category="bug",
    )
    assert "<script>" not in report.title
    assert "<b>" not in report.description
