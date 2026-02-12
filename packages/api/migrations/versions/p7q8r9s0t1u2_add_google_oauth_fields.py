"""add google_id to users and make hashed_password nullable

Revision ID: p7q8r9s0t1u2
Revises: o6p7q8r9s0t1
Create Date: 2026-02-12

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "p7q8r9s0t1u2"
down_revision: Union[str, None] = "o6p7q8r9s0t1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("google_id", sa.String(255), nullable=True),
    )
    op.create_index("ix_users_google_id", "users", ["google_id"], unique=True)

    op.alter_column(
        "users",
        "hashed_password",
        existing_type=sa.String(255),
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "users",
        "hashed_password",
        existing_type=sa.String(255),
        nullable=False,
    )
    op.drop_index("ix_users_google_id", "users")
    op.drop_column("users", "google_id")
