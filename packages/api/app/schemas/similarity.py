from __future__ import annotations

import uuid
from datetime import datetime

from app.schemas import CamelModel


class SimilarReportItem(CamelModel):
    id: uuid.UUID
    tracking_id: str
    title: str
    severity: str
    status: str
    created_at: datetime
    similarity_score: float


class SimilarReportsResponse(CamelModel):
    items: list[SimilarReportItem]
