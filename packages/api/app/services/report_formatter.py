"""Shared report formatting for issue tracker exports (GitHub, Linear, etc.)."""
from __future__ import annotations

from app.models.report import Report


def format_report_body(report: Report) -> str:
    """Format a bug report as a markdown body for issue trackers."""
    sections: list[str] = []

    sections.append(f"## Bug Report: {report.tracking_id}")
    sections.append("")
    sections.append(f"**Severity:** {report.severity.value}")
    sections.append(f"**Category:** {report.category.value}")
    sections.append(f"**Status:** {report.status.value}")
    sections.append("")

    sections.append("### Description")
    sections.append("")
    sections.append(report.description)
    sections.append("")

    if report.screenshot_url:
        sections.append("### Screenshot")
        sections.append("")
        sections.append(f"![Screenshot]({report.screenshot_url})")
        sections.append("")

    if report.console_logs:
        sections.append("### Console Logs")
        sections.append("")
        logs = report.console_logs
        if isinstance(logs, list):
            entries = logs[:10]
            for entry in entries:
                level = entry.get("level", "log")
                message = entry.get("message", "")
                sections.append(f"- **[{level}]** {message}")
            if len(logs) > 10:
                sections.append(f"- ... and {len(logs) - 10} more entries")
        sections.append("")

    if report.metadata_:
        sections.append("### Device / Environment")
        sections.append("")
        meta = report.metadata_
        if isinstance(meta, dict):
            for key, value in meta.items():
                sections.append(f"- **{key}:** {value}")
        sections.append("")

    if report.reporter_identifier:
        sections.append(f"**Reporter:** {report.reporter_identifier}")
        sections.append("")

    sections.append("---")
    sections.append(f"*Exported from BugSpark ({report.tracking_id})*")

    return "\n".join(sections)
