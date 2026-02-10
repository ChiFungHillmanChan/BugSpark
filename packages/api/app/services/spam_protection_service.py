from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Protocol
from urllib.parse import urlparse

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.requests import Request

from app.models.report import Report


class _HasDomain(Protocol):
    domain: str | None


def check_honeypot(hp_value: str | None) -> bool:
    """Returns True if the request is spam (non-empty honeypot field)."""
    return bool(hp_value)


async def is_duplicate_report(
    db: AsyncSession,
    project_id: str,
    title: str,
) -> bool:
    """Returns True if a report with the same title exists for this project in the last 5 minutes."""
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=5)
    result = await db.execute(
        select(Report.id)
        .where(
            Report.project_id == project_id,
            Report.title == title,
            Report.created_at >= cutoff,
        )
        .limit(1)
    )
    return result.scalar_one_or_none() is not None


def validate_origin(request: Request, project: _HasDomain) -> bool:
    """Returns True if origin is valid. Skips check if no domain is configured."""
    project_domain = project.domain
    if not project_domain:
        return True

    origin = request.headers.get("origin") or request.headers.get("referer")
    if not origin:
        return True

    try:
        parsed = urlparse(origin)
        request_host = (parsed.hostname or "").lower()
    except ValueError:
        return False

    normalized_domain = _extract_hostname(project_domain)

    if request_host == normalized_domain:
        return True

    if request_host.endswith(f".{normalized_domain}"):
        return True

    return False


def _extract_hostname(domain: str) -> str:
    """Extract the hostname from a domain string that may be a bare host, host:port, or full URL."""
    domain = domain.strip().lower()
    if "://" in domain:
        parsed = urlparse(domain)
        return (parsed.hostname or "").lower()
    # Prepend scheme so urlparse treats the value as a network location
    parsed = urlparse(f"https://{domain}")
    return (parsed.hostname or "").lower()
