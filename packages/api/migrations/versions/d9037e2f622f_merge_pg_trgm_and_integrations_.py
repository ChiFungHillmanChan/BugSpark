"""merge pg_trgm and integrations migrations

Revision ID: d9037e2f622f
Revises: c3d4e5f6a7b8, d4e5f6a7b8c9
Create Date: 2026-02-09 20:47:25.011105

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd9037e2f622f'
down_revision: Union[str, None] = ('c3d4e5f6a7b8', 'd4e5f6a7b8c9')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
