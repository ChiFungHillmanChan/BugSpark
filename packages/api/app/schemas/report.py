from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, field_validator

from app.schemas import CamelModel
from app.utils.sanitize import sanitize_text


class ReportCreate(BaseModel):
    title: str
    description: str
    severity: str
    category: str
    reporter_identifier: str | None = None
    screenshot_url: str | None = None
    annotated_screenshot_url: str | None = None
    console_logs: dict | list | None = None
    network_logs: dict | list | None = None
    user_actions: dict | list | None = None
    metadata: dict | None = None

    @field_validator("title", "description")
    @classmethod
    def sanitize_fields(cls, value: str) -> str:
        return sanitize_text(value)


class ReportUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    severity: str | None = None
    category: str | None = None
    status: str | None = None
    assignee_id: uuid.UUID | None = None

    @field_validator("title", "description")
    @classmethod
    def sanitize_fields(cls, value: str | None) -> str | None:
        if value is None:
            return value
        return sanitize_text(value)


class ReportResponse(CamelModel):
    id: uuid.UUID
    project_id: uuid.UUID
    tracking_id: str
    title: str
    description: str
    severity: str
    category: str
    status: str
    assignee_id: uuid.UUID | None
    screenshot_url: str | None
    annotated_screenshot_url: str | None
    console_logs: dict | list | None
    network_logs: dict | list | None
    user_actions: dict | list | None
    metadata: dict | None = None
    reporter_identifier: str | None
    created_at: datetime
    updated_at: datetime


class ReportListResponse(CamelModel):
    items: list[ReportResponse]
    total: int
    page: int
    page_size: int
