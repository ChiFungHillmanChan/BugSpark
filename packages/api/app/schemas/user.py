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
    plan_expires_at: datetime | None = None
    created_at: datetime


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=128)


# Use a sentinel to distinguish "not provided" from "explicitly set to null"
_UNSET = object()


class AdminUserUpdate(BaseModel):
    role: str | None = Field(default=None)
    plan: str | None = Field(default=None)
    is_active: bool | None = Field(default=None)
    plan_expires_at: datetime | None = Field(default=None)

    class Config:
        # Allow extra fields to be passed through for proper null handling
        json_schema_extra = {
            "examples": [{"plan": "pro", "plan_expires_at": "2026-03-10T00:00:00Z"}]
        }
