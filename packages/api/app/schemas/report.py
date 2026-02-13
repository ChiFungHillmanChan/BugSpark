from __future__ import annotations

import json
import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.schemas import CamelModel
from app.utils.sanitize import sanitize_text

MAX_LOGS_JSON_SIZE = 512 * 1024  # 512 KB
MAX_METADATA_JSON_SIZE = 64 * 1024  # 64 KB


def _validate_json_size(value: dict | list | None, max_size: int, field_name: str) -> dict | list | None:
    """Validate serialized JSON size of a field."""
    if value is None:
        return value
    serialized = json.dumps(value, default=str)
    if len(serialized) > max_size:
        msg = f"{field_name} exceeds maximum size of {max_size // 1024}KB"
        raise ValueError(msg)
    return value


class ReportCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    description: str = Field(default="", max_length=10000)
    severity: Literal["low", "medium", "high", "critical"]
    category: Literal["bug", "ui", "performance", "crash", "other"]
    reporter_identifier: str | None = Field(default=None, max_length=255)
    screenshot_url: str | None = None
    annotated_screenshot_url: str | None = None
    console_logs: dict | list | None = None
    network_logs: dict | list | None = None
    user_actions: dict | list | None = None
    metadata: dict | None = None
    hp_field: str | None = Field(default=None, max_length=500, alias="hpField")

    @field_validator("title", "description")
    @classmethod
    def sanitize_fields(cls, value: str) -> str:
        return sanitize_text(value)

    @field_validator("reporter_identifier")
    @classmethod
    def sanitize_reporter_identifier(cls, value: str | None) -> str | None:
        if value is None:
            return value
        return sanitize_text(value)

    @field_validator("console_logs")
    @classmethod
    def validate_console_logs_size(cls, value: dict | list | None) -> dict | list | None:
        return _validate_json_size(value, MAX_LOGS_JSON_SIZE, "console_logs")

    @field_validator("network_logs")
    @classmethod
    def validate_network_logs_size(cls, value: dict | list | None) -> dict | list | None:
        return _validate_json_size(value, MAX_LOGS_JSON_SIZE, "network_logs")

    @field_validator("user_actions")
    @classmethod
    def validate_user_actions_size(cls, value: dict | list | None) -> dict | list | None:
        return _validate_json_size(value, MAX_LOGS_JSON_SIZE, "user_actions")

    @field_validator("metadata")
    @classmethod
    def validate_metadata_size(cls, value: dict | None) -> dict | None:
        return _validate_json_size(value, MAX_METADATA_JSON_SIZE, "metadata")


class ReportUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=500)
    description: str | None = Field(default=None, max_length=10000)
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
    console_logs_included: bool = False
    created_at: datetime
    updated_at: datetime


class ReportListItemResponse(CamelModel):
    id: uuid.UUID
    project_id: uuid.UUID
    tracking_id: str
    title: str
    description: str
    severity: str
    category: str
    status: str
    assignee_id: uuid.UUID | None
    reporter_identifier: str | None
    created_at: datetime
    updated_at: datetime


class ReportListResponse(CamelModel):
    items: list[ReportListItemResponse]
    total: int
    page: int
    page_size: int
