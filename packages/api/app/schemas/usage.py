from __future__ import annotations

import uuid
from typing import Optional

from app.schemas import CamelModel


class QuotaUsage(CamelModel):
    current: int
    limit: Optional[int] = None  # None means unlimited


class UserUsage(CamelModel):
    projects: QuotaUsage
    reports_this_month: QuotaUsage


class ProjectMemberUsage(CamelModel):
    """Usage info for team members in a project."""

    project_id: uuid.UUID
    project_name: str
    member_count: int
    member_limit: Optional[int] = None  # None means unlimited


class UsageQuota(CamelModel):
    """Current usage and quota for a user."""

    projects_count: int
    projects_limit: Optional[int] = None  # None means unlimited

    monthly_reports_count: int
    monthly_reports_limit: Optional[int] = None  # None means unlimited

    reports_per_project_count: int
    reports_per_project_limit: Optional[int] = None  # None means unlimited

    team_members_per_project: list[ProjectMemberUsage]


class UsageResponse(CamelModel):
    """Response model for the /usage endpoint."""

    current_plan: str
    usage: UsageQuota
