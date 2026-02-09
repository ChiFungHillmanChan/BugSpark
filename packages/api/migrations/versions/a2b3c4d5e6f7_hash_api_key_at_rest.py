"""hash api_key at rest

Replace plaintext api_key column with api_key_hash + api_key_prefix
for secure at-rest storage.

Revision ID: a2b3c4d5e6f7
Revises: f6a7b8c9d0e1
Create Date: 2026-02-09 23:30:00.000000

"""
from __future__ import annotations

import hashlib
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column


# revision identifiers, used by Alembic.
revision: str = "a2b3c4d5e6f7"
down_revision: Union[str, None] = "f6a7b8c9d0e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add the new columns (nullable initially for data migration)
    op.add_column(
        "projects",
        sa.Column("api_key_hash", sa.String(128), nullable=True),
    )
    op.add_column(
        "projects",
        sa.Column("api_key_prefix", sa.String(16), nullable=True),
    )

    # 2. Migrate existing data: hash current plaintext api_key values
    projects = table(
        "projects",
        column("id", sa.UUID()),
        column("api_key", sa.String(255)),
        column("api_key_hash", sa.String(128)),
        column("api_key_prefix", sa.String(16)),
    )
    conn = op.get_bind()
    rows = conn.execute(sa.select(projects.c.id, projects.c.api_key)).fetchall()
    for row in rows:
        key_hash = hashlib.sha256(row.api_key.encode()).hexdigest()
        key_prefix = row.api_key[:12]
        conn.execute(
            projects.update()
            .where(projects.c.id == row.id)
            .values(api_key_hash=key_hash, api_key_prefix=key_prefix)
        )

    # 3. Make the new columns NOT NULL now that data is populated
    op.alter_column("projects", "api_key_hash", nullable=False)
    op.alter_column("projects", "api_key_prefix", nullable=False)

    # 4. Create index on api_key_prefix for fast lookups
    op.create_index("ix_projects_api_key_prefix", "projects", ["api_key_prefix"])

    # 5. Drop the old plaintext column and its unique constraint
    op.drop_constraint("projects_api_key_key", "projects", type_="unique")
    op.drop_column("projects", "api_key")

    # api_secret was already dropped by migration a1b2c3d4e5f6


def downgrade() -> None:
    # Re-add the plaintext column
    op.add_column(
        "projects",
        sa.Column("api_key", sa.String(255), nullable=True),
    )

    # Restore data — prefix is the best we can recover; full key is lost
    projects = table(
        "projects",
        column("id", sa.UUID()),
        column("api_key", sa.String(255)),
        column("api_key_prefix", sa.String(16)),
    )
    conn = op.get_bind()
    rows = conn.execute(sa.select(projects.c.id, projects.c.api_key_prefix)).fetchall()
    for row in rows:
        conn.execute(
            projects.update()
            .where(projects.c.id == row.id)
            .values(api_key=row.api_key_prefix + "_HASH_DOWNGRADE_PLACEHOLDER")
        )

    op.alter_column("projects", "api_key", nullable=False)
    op.create_unique_constraint("projects_api_key_key", "projects", ["api_key"])

    # Drop the hash columns
    op.drop_index("ix_projects_api_key_prefix", "projects")
    op.drop_column("projects", "api_key_prefix")
    op.drop_column("projects", "api_key_hash")
