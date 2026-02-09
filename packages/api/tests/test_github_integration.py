from __future__ import annotations

from unittest.mock import MagicMock

from app.models.report import Category, Report, Severity, Status
from app.services.github_integration import format_report_as_github_issue


def _make_report(**overrides) -> Report:
    report = MagicMock(spec=Report)
    report.tracking_id = overrides.get("tracking_id", "BUG-001")
    report.title = overrides.get("title", "Login button broken")
    report.description = overrides.get("description", "The login button does not respond.")
    report.severity = overrides.get("severity", Severity.HIGH)
    report.category = overrides.get("category", Category.BUG)
    report.status = overrides.get("status", Status.NEW)
    report.screenshot_url = overrides.get("screenshot_url", None)
    report.annotated_screenshot_url = overrides.get("annotated_screenshot_url", None)
    report.console_logs = overrides.get("console_logs", None)
    report.network_logs = overrides.get("network_logs", None)
    report.user_actions = overrides.get("user_actions", None)
    report.metadata_ = overrides.get("metadata_", None)
    report.reporter_identifier = overrides.get("reporter_identifier", None)
    return report


def test_format_basic_report() -> None:
    report = _make_report()
    body = format_report_as_github_issue(report)

    assert "BUG-001" in body
    assert "The login button does not respond." in body
    assert "high" in body
    assert "bug" in body


def test_format_report_with_screenshot() -> None:
    report = _make_report(screenshot_url="https://s3.example.com/shot.png")
    body = format_report_as_github_issue(report)

    assert "![Screenshot]" in body
    assert "https://s3.example.com/shot.png" in body


def test_format_report_with_console_logs() -> None:
    report = _make_report(
        console_logs=[
            {"level": "error", "message": "TypeError: undefined is not a function"},
            {"level": "warn", "message": "Deprecation notice"},
        ]
    )
    body = format_report_as_github_issue(report)

    assert "Console Logs" in body
    assert "TypeError" in body
    assert "Deprecation notice" in body


def test_format_report_with_metadata() -> None:
    report = _make_report(
        metadata_={"userAgent": "Chrome/120", "platform": "macOS"}
    )
    body = format_report_as_github_issue(report)

    assert "Device / Environment" in body
    assert "Chrome/120" in body
    assert "macOS" in body


def test_format_report_with_reporter() -> None:
    report = _make_report(reporter_identifier="user@example.com")
    body = format_report_as_github_issue(report)

    assert "user@example.com" in body


def test_format_report_truncates_long_console_logs() -> None:
    logs = [{"level": "log", "message": f"Log entry {i}"} for i in range(15)]
    report = _make_report(console_logs=logs)
    body = format_report_as_github_issue(report)

    assert "and 5 more entries" in body
