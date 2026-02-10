"""Add indexes on user plan/is_active, PAT composite index, fix comment FK

Revision ID: k2l3m4n5o6p7
Revises: j1k2l3m4n5o6
Create Date: 2026-02-10

"""
from alembic import op

revision = "k2l3m4n5o6p7"
down_revision = "j1k2l3m4n5o6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index("ix_users_plan", "users", ["plan"])
    op.create_index("ix_users_is_active", "users", ["is_active"])
    op.create_index("ix_pat_user_id_created_at", "personal_access_tokens", ["user_id", "created_at"])

    op.drop_constraint("comments_author_id_fkey", "comments", type_="foreignkey")
    op.create_foreign_key(
        "comments_author_id_fkey",
        "comments",
        "users",
        ["author_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.alter_column("comments", "author_id", nullable=True)


def downgrade() -> None:
    op.alter_column("comments", "author_id", nullable=False)
    op.drop_constraint("comments_author_id_fkey", "comments", type_="foreignkey")
    op.create_foreign_key(
        "comments_author_id_fkey",
        "comments",
        "users",
        ["author_id"],
        ["id"],
        ondelete="CASCADE",
    )

    op.drop_index("ix_pat_user_id_created_at", "personal_access_tokens")
    op.drop_index("ix_users_is_active", "users")
    op.drop_index("ix_users_plan", "users")
