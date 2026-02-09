from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas import CamelModel


class UserResponse(CamelModel):
    id: uuid.UUID
    email: str
    name: str
    created_at: datetime


class UserUpdate(BaseModel):
    name: str | None = None
