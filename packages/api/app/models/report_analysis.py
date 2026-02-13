from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from typing import Optional


class ReportAnalysis(Base):
    __tablename__ = "report_analyses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    report_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True
    )
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    suggested_category: Mapped[str] = mapped_column(Text, nullable=False)
    suggested_severity: Mapped[str] = mapped_column(Text, nullable=False)
    reproduction_steps: Mapped[list[str]] = mapped_column(JSONB, nullable=False)
    root_cause: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    fix_suggestions: Mapped[Optional[list[str]]] = mapped_column(JSONB, nullable=True)
    affected_area: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    language: Mapped[str] = mapped_column(Text, nullable=False, server_default="en")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    report = relationship("Report", back_populates="analysis")
