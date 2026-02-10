from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.schemas import CamelModel
from app.utils.sanitize import sanitize_text


class ReportCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    description: str = Field(min_length=1, max_length=10000)
    severity: Literal["low", "medium", "high", "critical"]
    category: Literal["bug", "ui", "performance", "crash", "other"]
    reporter_identifier: str | None = Field(default=None, max_length=255)
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
    severity: Literal["low", "medium", "high", "critical"] | None = None
    category: Literal["bug", "ui", "performance", "crash", "other"] | None = None
    status: Literal["new", "triaging", "in_progress", "resolved", "closed"] | None = None
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
