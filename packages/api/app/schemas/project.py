from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas import CamelModel


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    domain: str = Field(default="", max_length=255)


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    domain: str | None = Field(default=None, min_length=1, max_length=255)
    settings: dict | None = None
    is_active: bool | None = None


class WidgetConfigResponse(CamelModel):
    primary_color: str = "#e94560"
    show_watermark: bool = True
    modal_title: str | None = None
    button_text: str | None = None
    logo_url: str | None = None


class ProjectResponse(CamelModel):
    id: uuid.UUID
    name: str
    domain: str
    api_key: str
    is_active: bool
    created_at: datetime
    settings: dict
