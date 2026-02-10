from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Severity(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class Category(str, enum.Enum):
    BUG = "bug"
    UI = "ui"
    PERFORMANCE = "performance"
    CRASH = "crash"
    OTHER = "other"


class Status(str, enum.Enum):
    NEW = "new"
    TRIAGING = "triaging"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class Report(Base):
    __tablename__ = "reports"
    __table_args__ = (
        Index("ix_reports_project_status_created", "project_id", "status", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    tracking_id: Mapped[str] = mapped_column(String(20), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[Severity] = mapped_column(
        Enum(Severity, name="severity_enum", values_callable=lambda e: [x.value for x in e]),
        nullable=False,
        index=True,
    )
    category: Mapped[Category] = mapped_column(
        Enum(Category, name="category_enum", values_callable=lambda e: [x.value for x in e]),
        nullable=False,
    )
    status: Mapped[Status] = mapped_column(
        Enum(Status, name="status_enum", values_callable=lambda e: [x.value for x in e]),
        default=Status.NEW,
        server_default="new",
        nullable=False,
        index=True,
    )
    assignee_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    screenshot_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    annotated_screenshot_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    console_logs: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    network_logs: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    user_actions: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True)
    reporter_identifier: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    project = relationship("Project", lazy="selectin")
    assignee = relationship("User", lazy="selectin")
    comments = relationship("Comment", back_populates="report", lazy="raise")
