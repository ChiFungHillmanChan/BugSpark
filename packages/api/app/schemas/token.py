from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import Field

from app.schemas import CamelModel


class TokenCreateRequest(CamelModel):
    name: str = Field(min_length=1, max_length=255)
    expires_in_days: int | None = Field(
        default=None,
        ge=1,
        le=365,
        description="Number of days until the token expires. null = never expires.",
    )


class TokenResponse(CamelModel):
    id: uuid.UUID
    name: str
    token_prefix: str
    last_used_at: datetime | None
    expires_at: datetime | None
    created_at: datetime


class TokenCreateResponse(CamelModel):
    """Returned only on creation — includes the full token (shown once)."""
    id: uuid.UUID
    name: str
    token: str
    expires_at: datetime | None
    created_at: datetime
