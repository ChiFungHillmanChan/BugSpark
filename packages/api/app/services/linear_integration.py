from __future__ import annotations

import logging
from dataclasses import dataclass

import httpx

from app.exceptions import BadRequestException
from app.models.report import Report
from app.services.report_formatter import format_report_body

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
    priority = SEVERITY_TO_PRIORITY.get(report.severity.value, 3)

    return LinearIssueData(
        title=f"[{report.tracking_id}] {report.title}",
        description=format_report_body(report),
        priority=priority,
        labels=["bug", report.severity.value],
    )


async def create_linear_issue(
    api_key: str,
    team_id: str,
    title: str,
    description: str,
    priority: int = 3,
) -> dict[str, str]:
    variables: dict[str, dict[str, str | int]] = {
        "input": {
            "teamId": team_id,
            "title": title,
            "description": description,
            "priority": priority,
        },
    }

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
