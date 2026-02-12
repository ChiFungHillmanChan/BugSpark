from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from pydantic import BaseModel, ConfigDict, Field

from app.schemas import CamelModel

if TYPE_CHECKING:
    from app.models.user import User


class UserResponse(CamelModel):
    id: uuid.UUID
    email: str
    name: str
    role: str
    plan: str
    is_active: bool
    is_email_verified: bool = False
    beta_status: str = "none"
    plan_expires_at: datetime | None = None
    notification_preferences: dict[str, bool] | None = None
    created_at: datetime
    has_google_linked: bool = False
    has_password: bool = True


def build_user_response(user: User) -> UserResponse:
    """Build UserResponse with computed Google/password fields from the User model."""
    response = UserResponse.model_validate(user)
    response.has_google_linked = bool(user.google_id)
    response.has_password = bool(user.hashed_password)
    return response


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    notification_preferences: dict[str, bool] | None = Field(default=None)


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=128)


# Use a sentinel to distinguish "not provided" from "explicitly set to null"
_UNSET = object()


class AdminUserUpdate(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [{"plan": "pro", "plan_expires_at": "2026-03-10T00:00:00Z"}]
        }
    )

    role: str | None = Field(default=None)
    plan: str | None = Field(default=None)
    is_active: bool | None = Field(default=None)
    plan_expires_at: datetime | None = Field(default=None)
