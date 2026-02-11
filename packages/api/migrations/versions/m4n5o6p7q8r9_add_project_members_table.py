"""Add project_members table

Revision ID: m4n5o6p7q8r9
Revises: n5o6p7q8r9s0
Create Date: 2026-02-11

"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision = "m4n5o6p7q8r9"
down_revision = "n5o6p7q8r9s0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "project_members",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("project_id", UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("role", sa.String(20), nullable=False, server_default="viewer"),
        sa.Column("invite_token", sa.String(255), nullable=True),
        sa.Column("invite_accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_project_members_project_id", "project_members", ["project_id"])
    op.create_index("ix_project_members_user_id", "project_members", ["user_id"])
    op.create_index(
        "ix_project_members_project_email",
        "project_members",
        ["project_id", "email"],
        unique=True,
    )
    op.create_index(
        "ix_project_members_invite_token",
        "project_members",
        ["invite_token"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_project_members_invite_token", "project_members")
    op.drop_index("ix_project_members_project_email", "project_members")
    op.drop_index("ix_project_members_user_id", "project_members")
    op.drop_index("ix_project_members_project_id", "project_members")
    op.drop_table("project_members")
