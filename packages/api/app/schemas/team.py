from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.schemas import CamelModel

VALID_MEMBER_ROLES = {"viewer", "editor", "admin"}


class InviteMemberRequest(BaseModel):
    email: EmailStr
    role: str = Field(default="viewer", pattern="^(viewer|editor|admin)$")


class UpdateMemberRoleRequest(BaseModel):
    role: str = Field(pattern="^(viewer|editor|admin)$")


class AcceptInviteRequest(BaseModel):
    token: str


class ProjectMemberResponse(CamelModel):
    id: uuid.UUID
    project_id: uuid.UUID
    user_id: uuid.UUID | None
    email: str
    role: str
    invite_accepted_at: datetime | None
    created_at: datetime
    display_name: str | None = None
