from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum as SAEnum, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.enums import BetaStatus, Plan, Role


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[Role] = mapped_column(
        SAEnum(Role, native_enum=False, length=20, values_callable=lambda x: [e.value for e in x]),
        default=Role.USER,
        server_default="user",
        nullable=False,
    )
    plan: Mapped[Plan] = mapped_column(
        SAEnum(Plan, native_enum=False, length=20, values_callable=lambda x: [e.value for e in x]),
        default=Plan.FREE,
        server_default="free",
        nullable=False,
    )
    plan_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, default=None
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default="true", nullable=False
    )
    beta_status: Mapped[BetaStatus] = mapped_column(
        SAEnum(BetaStatus, native_enum=False, length=20, values_callable=lambda x: [e.value for e in x]),
        default=BetaStatus.NONE,
        server_default="none",
        nullable=False,
    )
    beta_applied_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, default=None
    )
    beta_reason: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    refresh_token_jti: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
