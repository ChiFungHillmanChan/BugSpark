from __future__ import annotations

import logging
from dataclasses import dataclass

import httpx

from app.exceptions import BadRequestException
from app.models.report import Report

logger = logging.getLogger(__name__)

LINEAR_API_URL = "https://api.linear.app/graphql"

SEVERITY_TO_PRIORITY: dict[str, int] = {
    "critical": 1,
    "high": 2,
    "medium": 3,
    "low": 4,
}

ISSUE_CREATE_MUTATION = """
mutation IssueCreate($input: IssueCreateInput!) {
  issueCreate(input: $input) {
    success
    issue {
      id
      identifier
      url
      title
    }
  }
}
"""


@dataclass
class LinearIssueData:
    title: str
    description: str
    priority: int
    labels: list[str]


def format_report_as_linear_issue(report: Report) -> LinearIssueData:
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

    priority = SEVERITY_TO_PRIORITY.get(report.severity.value, 3)

    return LinearIssueData(
        title=f"[{report.tracking_id}] {report.title}",
        description="\n".join(sections),
        priority=priority,
        labels=["bug", report.severity.value],
    )


async def create_linear_issue(
    api_key: str,
    team_id: str,
    title: str,
    description: str,
    labels: list[str] | None = None,
    priority: int = 3,
) -> dict[str, str]:
    variables: dict[str, dict[str, str | int | list[str]]] = {
        "input": {
            "teamId": team_id,
            "title": title,
            "description": description,
            "priority": priority,
        },
    }
    if labels:
        variables["input"]["labelIds"] = labels

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            LINEAR_API_URL,
            headers={
                "Authorization": api_key,
                "Content-Type": "application/json",
            },
            json={
                "query": ISSUE_CREATE_MUTATION,
                "variables": variables,
            },
        )

        if response.status_code != 200:
            logger.warning("Linear API HTTP error: %s %s", response.status_code, response.text)
            raise BadRequestException(f"Linear API error: {response.status_code}")

        data = response.json()

        if "errors" in data:
            error_message = data["errors"][0].get("message", "Unknown error")
            logger.warning("Linear GraphQL error: %s", error_message)
            raise BadRequestException(f"Linear API error: {error_message}")

        issue_create = data.get("data", {}).get("issueCreate", {})
        if not issue_create.get("success"):
            raise BadRequestException("Linear issue creation failed")

        issue = issue_create["issue"]
        return {
            "issue_url": issue["url"],
            "issue_identifier": issue["identifier"],
            "issue_id": issue["id"],
        }
