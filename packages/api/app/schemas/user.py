from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas import CamelModel


class UserResponse(CamelModel):
    id: uuid.UUID
    email: str
    name: str
    role: str
    plan: str
    is_active: bool
    created_at: datetime


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)


class AdminUserUpdate(BaseModel):
    role: str | None = Field(default=None)
    plan: str | None = Field(default=None)
    is_active: bool | None = Field(default=None)
