from __future__ import annotations

import uuid
from datetime import datetime

from app.schemas import CamelModel


class AdminUserResponse(CamelModel):
    id: uuid.UUID
    email: str
    name: str
    role: str
    plan: str
    is_active: bool
    beta_status: str = "none"
    plan_expires_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    project_count: int = 0
    report_count_month: int = 0


class AdminUserListResponse(CamelModel):
    items: list[AdminUserResponse]
    total: int
    page: int
    page_size: int


class BetaUserResponse(CamelModel):
    id: uuid.UUID
    email: str
    name: str
    beta_status: str
    beta_reason: str | None = None
    beta_applied_at: datetime | None = None
    created_at: datetime


class BetaUserListResponse(CamelModel):
    items: list[BetaUserResponse]
    total: int
    page: int
    page_size: int


class PlatformStats(CamelModel):
    total_users: int
    total_projects: int
    total_reports: int
    users_by_plan: dict[str, int]
    users_by_role: dict[str, int]
    pending_beta_count: int = 0


class AppSettingsResponse(CamelModel):
    beta_mode_enabled: bool


class AppSettingsUpdate(CamelModel):
    beta_mode_enabled: bool | None = None
