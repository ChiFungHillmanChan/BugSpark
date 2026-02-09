from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.schemas import CamelModel


class WebhookCreate(BaseModel):
    url: str = Field(..., min_length=1, max_length=2048)
    events: list[str] = Field(..., min_length=1, max_length=50)

    @field_validator("url")
    @classmethod
    def validate_url(cls, value: str) -> str:
        if not value.startswith(("https://", "http://")):
            raise ValueError("URL must start with http:// or https://")
        return value

    @field_validator("events")
    @classmethod
    def validate_events(cls, value: list[str]) -> list[str]:
        for event in value:
            if not event or len(event) > 100:
                raise ValueError("Each event name must be 1-100 characters")
        return value


class WebhookUpdate(CamelModel):
    url: str | None = Field(None, min_length=1, max_length=2048)
    events: list[str] | None = Field(None, min_length=1, max_length=50)
    is_active: bool | None = None

    @field_validator("url")
    @classmethod
    def validate_url(cls, value: str | None) -> str | None:
        if value is not None and not value.startswith(("https://", "http://")):
            raise ValueError("URL must start with http:// or https://")
        return value


class WebhookResponse(CamelModel):
    id: uuid.UUID
    project_id: uuid.UUID
    url: str
    events: list[str]
    is_active: bool
    created_at: datetime
