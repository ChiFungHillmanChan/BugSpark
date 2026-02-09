from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas import CamelModel


class ProjectCreate(BaseModel):
    name: str
    domain: str


class ProjectUpdate(BaseModel):
    name: str | None = None
    domain: str | None = None
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


class ProjectWithSecret(ProjectResponse):
    api_secret: str
