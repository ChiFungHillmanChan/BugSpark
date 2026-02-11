from __future__ import annotations

import uuid
from datetime import datetime

import json

from pydantic import BaseModel, Field, field_validator

from app.schemas import CamelModel

MAX_SETTINGS_JSON_SIZE = 10 * 1024  # 10 KB


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    domain: str = Field(default="", max_length=1024)


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    domain: str | None = Field(default=None, max_length=1024)
    settings: dict | None = None
    is_active: bool | None = None

    @field_validator("settings")
    @classmethod
    def validate_settings_size(cls, value: dict | None) -> dict | None:
        if value is None:
            return value
        serialized = json.dumps(value)
        if len(serialized) > MAX_SETTINGS_JSON_SIZE:
            msg = f"Settings JSON exceeds maximum size of {MAX_SETTINGS_JSON_SIZE // 1024}KB"
            raise ValueError(msg)
        return value


class WidgetConfigResponse(CamelModel):
    primary_color: str = "#e94560"
    show_watermark: bool = True
    enable_screenshot: bool = True
    modal_title: str | None = None
    button_text: str | None = None
    logo_url: str | None = None
    owner_plan: str = "free"


class ProjectResponse(CamelModel):
    id: uuid.UUID
    name: str
    domain: str
    api_key: str
    is_active: bool
    created_at: datetime
    settings: dict
