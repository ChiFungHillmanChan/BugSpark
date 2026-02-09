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
    created_at: datetime
    updated_at: datetime


class AdminUserListResponse(CamelModel):
    items: list[AdminUserResponse]
    total: int
    page: int
    page_size: int


class PlatformStats(CamelModel):
    total_users: int
    total_projects: int
    total_reports: int
    users_by_plan: dict[str, int]
    users_by_role: dict[str, int]
