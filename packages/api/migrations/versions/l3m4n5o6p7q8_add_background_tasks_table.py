"""Add background_tasks table

Revision ID: l3m4n5o6p7q8
Revises: k2l3m4n5o6p7
Create Date: 2026-02-11

"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = "l3m4n5o6p7q8"
down_revision = "k2l3m4n5o6p7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "background_tasks",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("task_type", sa.String(50), nullable=False),
        sa.Column("payload", JSONB, nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("attempts", sa.Integer, nullable=False, server_default="0"),
        sa.Column("max_attempts", sa.Integer, nullable=False, server_default="3"),
        sa.Column("next_retry_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_background_tasks_task_type", "background_tasks", ["task_type"])
    op.create_index("ix_background_tasks_status", "background_tasks", ["status"])
    op.create_index(
        "ix_background_tasks_pending_retry",
        "background_tasks",
        ["status", "next_retry_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_background_tasks_pending_retry", "background_tasks")
    op.drop_index("ix_background_tasks_status", "background_tasks")
    op.drop_index("ix_background_tasks_task_type", "background_tasks")
    op.drop_table("background_tasks")
