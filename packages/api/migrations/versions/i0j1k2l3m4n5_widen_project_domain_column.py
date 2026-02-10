"""widen project domain column to 1024

Revision ID: i0j1k2l3m4n5
Revises: h9i0j1k2l3m4
Create Date: 2026-02-10 23:30:00.000000

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "i0j1k2l3m4n5"
down_revision: Union[str, None] = "h9i0j1k2l3m4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "projects",
        "domain",
        existing_type=sa.String(255),
        type_=sa.String(1024),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "projects",
        "domain",
        existing_type=sa.String(1024),
        type_=sa.String(255),
        existing_nullable=False,
    )
