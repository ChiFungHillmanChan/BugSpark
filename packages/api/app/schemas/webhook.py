from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas import CamelModel


class WebhookCreate(BaseModel):
    url: str
    events: list[str]


class WebhookUpdate(BaseModel):
    url: str | None = None
    events: list[str] | None = None
    is_active: bool | None = None


class WebhookResponse(CamelModel):
    id: uuid.UUID
    project_id: uuid.UUID
    url: str
    events: list[str]
    is_active: bool
    created_at: datetime
