"""add report_analyses table

Revision ID: t1u2v3w4x5y6
Revises: s0t1u2v3w4x5
Create Date: 2026-02-13

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "t1u2v3w4x5y6"
down_revision: Union[str, None] = "s0t1u2v3w4x5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "report_analyses",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("report_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("suggested_category", sa.Text(), nullable=False),
        sa.Column("suggested_severity", sa.Text(), nullable=False),
        sa.Column("reproduction_steps", postgresql.JSONB(), nullable=False),
        sa.Column("root_cause", sa.Text(), nullable=True),
        sa.Column("fix_suggestions", postgresql.JSONB(), nullable=True),
        sa.Column("affected_area", sa.Text(), nullable=True),
        sa.Column("language", sa.Text(), nullable=False, server_default="en"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["report_id"], ["reports.id"], ondelete="CASCADE"),
    )
    op.create_index(op.f("ix_report_analyses_report_id"), "report_analyses", ["report_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_report_analyses_report_id"), table_name="report_analyses")
    op.drop_table("report_analyses")
