"""add refresh_token_jti to users

Revision ID: e5f6a7b8c9d0
Revises: d9037e2f622f
Create Date: 2026-02-09 21:30:00.000000

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, None] = 'd9037e2f622f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('refresh_token_jti', sa.String(64), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'refresh_token_jti')
