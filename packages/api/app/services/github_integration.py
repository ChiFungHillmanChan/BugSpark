from __future__ import annotations

import logging

import httpx

from app.models.report import Report
from app.services.report_formatter import format_report_body

logger = logging.getLogger(__name__)

GITHUB_API_BASE = "https://api.github.com"


async def create_github_issue(
    token: str,
    owner: str,
    repo: str,
    title: str,
    body: str,
    labels: list[str] | None = None,
) -> dict:
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            f"{GITHUB_API_BASE}/repos/{owner}/{repo}/issues",
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github+json",
            },
            json={
                "title": title,
                "body": body,
                "labels": labels or ["bug"],
            },
        )
        response.raise_for_status()
        return response.json()


def format_report_as_github_issue(report: Report) -> str:
    return format_report_body(report)
