from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.schemas import CamelModel
from app.utils.sanitize import sanitize_text


class CommentCreate(BaseModel):
    body: str = Field(..., min_length=1, max_length=5000)

    @field_validator("body")
    @classmethod
    def sanitize_body(cls, value: str) -> str:
        return sanitize_text(value)


class CommentResponse(CamelModel):
    id: uuid.UUID
    report_id: uuid.UUID
    author_id: uuid.UUID | None
    author_name: str
    body: str
    created_at: datetime
