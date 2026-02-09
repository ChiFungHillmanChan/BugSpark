from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas import CamelModel


class CommentCreate(BaseModel):
    body: str


class CommentResponse(CamelModel):
    id: uuid.UUID
    report_id: uuid.UUID
    author_id: uuid.UUID
    author_name: str
    body: str
    created_at: datetime
