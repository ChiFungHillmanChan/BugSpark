"""add app_settings table

Revision ID: h9i0j1k2l3m4
Revises: g8h9i0j1k2l3
Create Date: 2026-02-10 23:00:00.000000

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "h9i0j1k2l3m4"
down_revision: Union[str, None] = "g8h9i0j1k2l3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "app_settings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "beta_mode_enabled",
            sa.Boolean(),
            server_default="true",
            nullable=False,
        ),
    )
    # Seed the singleton row
    op.execute("INSERT INTO app_settings (id, beta_mode_enabled) VALUES (1, true)")


def downgrade() -> None:
    op.drop_table("app_settings")
