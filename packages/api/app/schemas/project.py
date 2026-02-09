from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas import CamelModel


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    domain: str | None = Field(default=None, max_length=255)


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    domain: str | None = Field(default=None, min_length=1, max_length=255)
    settings: dict | None = None
    is_active: bool | None = None


class ProjectResponse(CamelModel):
    id: uuid.UUID
    name: str
    domain: str
    api_key: str
    is_active: bool
    created_at: datetime
    settings: dict
