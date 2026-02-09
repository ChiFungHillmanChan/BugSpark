from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, field_validator

from app.schemas import CamelModel
from app.utils.sanitize import sanitize_text


class CommentCreate(BaseModel):
    body: str

    @field_validator("body")
    @classmethod
    def sanitize_body(cls, value: str) -> str:
        return sanitize_text(value)


class CommentResponse(CamelModel):
    id: uuid.UUID
    report_id: uuid.UUID
    author_id: uuid.UUID
    author_name: str
    body: str
    created_at: datetime
