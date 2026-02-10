"""add beta_status to users

Revision ID: g8h9i0j1k2l3
Revises: f7a8b9c0d1e2
Create Date: 2026-02-10 22:00:00.000000

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "g8h9i0j1k2l3"
down_revision: Union[str, None] = "f7a8b9c0d1e2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "beta_status",
            sa.String(length=20),
            server_default="none",
            nullable=False,
        ),
    )
    op.add_column(
        "users",
        sa.Column("beta_applied_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("beta_reason", sa.String(length=1000), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "beta_reason")
    op.drop_column("users", "beta_applied_at")
    op.drop_column("users", "beta_status")
