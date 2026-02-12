from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum as SAEnum, JSON, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.enums import BetaStatus, Plan, Role
from typing import Optional


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    google_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, unique=True, index=True)
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
        index=True,
    )
    plan_expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True, default=None
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default="true", nullable=False, index=True
    )
    beta_status: Mapped[BetaStatus] = mapped_column(
        SAEnum(BetaStatus, native_enum=False, length=20, values_callable=lambda x: [e.value for e in x]),
        default=BetaStatus.NONE,
        server_default="none",
        nullable=False,
    )
    beta_applied_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True, default=None
    )
    beta_reason: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    is_email_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false", nullable=False
    )
    email_verification_token: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    email_verification_expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    password_reset_token: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    password_reset_expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    notification_preferences: Mapped[Optional[dict]] = mapped_column(
        JSON, nullable=True, default=None
    )
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True, unique=True, index=True
    )
    stripe_subscription_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True, index=True
    )
    subscription_status: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )
    cancel_at_period_end: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false", nullable=False
    )
    refresh_token_jti: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    previous_plan: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    plan_downgraded_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
