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
    description: str | None = None,
) -> bool:
    """Returns True if a report with the same title (and description, if provided) exists in the last 5 minutes."""
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=5)
    conditions = [
        Report.project_id == project_id,
        Report.title == title,
        Report.created_at >= cutoff,
    ]
    if description:
        conditions.append(Report.description == description)
    result = await db.execute(
        select(Report.id)
        .where(*conditions)
        .limit(1)
    )
    return result.scalar_one_or_none() is not None


def validate_origin(request: Request, project: _HasDomain) -> bool:
    """Returns True if origin is valid. Skips check if no domain is configured.

    Supports comma-separated domains (e.g. "https://myapp.com, http://localhost:3000").
    Each domain entry may include a port; when a port is specified the request must
    match that port exactly.
    """
    project_domain = project.domain
    if not project_domain:
        return True

    origin = request.headers.get("origin") or request.headers.get("referer")
    if not origin:
        return True

    try:
        parsed = urlparse(origin)
        request_host = (parsed.hostname or "").lower()
        request_port = parsed.port
    except ValueError:
        return False

    # Split comma-separated domains and check each
    domains = [d.strip() for d in project_domain.split(",") if d.strip()]
    for domain_entry in domains:
        domain_host, domain_port = _extract_host_and_port(domain_entry)
        if not domain_host:
            continue

        # Exact host match or subdomain match
        is_exact = request_host == domain_host
        is_subdomain = request_host.endswith(f".{domain_host}")

        if is_exact or is_subdomain:
            # Port constraint only applies to exact host matches;
            # subdomains are allowed regardless of port.
            if domain_port is not None and is_exact and request_port != domain_port:
                continue
            return True

    return False


def _extract_host_and_port(domain: str) -> tuple[str, int | None]:
    """Extract the hostname and optional port from a domain string.

    Handles bare hosts, host:port, and full URLs (http://host:port).
    Returns (host, None) if the port is non-numeric or otherwise invalid.
    """
    domain = domain.strip().lower()
    if "://" in domain:
        parsed = urlparse(domain)
    else:
        parsed = urlparse(f"https://{domain}")
    try:
        port = parsed.port
    except ValueError:
        port = None
    return (parsed.hostname or "").lower(), port
