"""add email verification expiry, background task updated_at and next_retry_at index

Revision ID: o6p7q8r9s0t1
Revises: m4n5o6p7q8r9
Create Date: 2026-02-11

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "o6p7q8r9s0t1"
down_revision: Union[str, None] = "m4n5o6p7q8r9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # M3: Email verification token expiry
    op.add_column(
        "users",
        sa.Column("email_verification_expires_at", sa.DateTime(timezone=True), nullable=True),
    )

    # L8: BackgroundTask.updated_at column (fixes stuck task recovery reference)
    op.add_column(
        "background_tasks",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # L8: Index on next_retry_at for efficient task polling
    op.create_index(
        "ix_background_tasks_next_retry_at",
        "background_tasks",
        ["next_retry_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_background_tasks_next_retry_at", "background_tasks")
    op.drop_column("background_tasks", "updated_at")
    op.drop_column("users", "email_verification_expires_at")
