"""add password reset, email verification, and notification fields to users

Revision ID: n5o6p7q8r9s0
Revises: l3m4n5o6p7q8
Create Date: 2026-02-11 10:00:00.000000

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "n5o6p7q8r9s0"
down_revision: Union[str, None] = "l3m4n5o6p7q8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Password reset (3a)
    op.add_column(
        "users",
        sa.Column("password_reset_token", sa.String(255), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("password_reset_expires_at", sa.DateTime(timezone=True), nullable=True),
    )
    # Email verification (3b)
    op.add_column(
        "users",
        sa.Column(
            "is_email_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.add_column(
        "users",
        sa.Column("email_verification_token", sa.String(255), nullable=True),
    )
    # Notification preferences (3c)
    op.add_column(
        "users",
        sa.Column("notification_preferences", sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "notification_preferences")
    op.drop_column("users", "email_verification_token")
    op.drop_column("users", "is_email_verified")
    op.drop_column("users", "password_reset_expires_at")
    op.drop_column("users", "password_reset_token")
