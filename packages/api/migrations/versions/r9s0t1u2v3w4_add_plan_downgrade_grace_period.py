"""add plan downgrade grace period tracking: previous_plan and plan_downgraded_at

Revision ID: r9s0t1u2v3w4
Revises: q8r9s0t1u2v3
Create Date: 2026-02-12

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "r9s0t1u2v3w4"
down_revision: Union[str, None] = "q8r9s0t1u2v3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add previous_plan column to track what plan the user had before downgrading
    op.add_column(
        "users",
        sa.Column("previous_plan", sa.String(20), nullable=True),
    )

    # Add plan_downgraded_at column to track when the user downgraded their plan
    op.add_column(
        "users",
        sa.Column("plan_downgraded_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    # Remove plan_downgraded_at column
    op.drop_column("users", "plan_downgraded_at")

    # Remove previous_plan column
    op.drop_column("users", "previous_plan")
