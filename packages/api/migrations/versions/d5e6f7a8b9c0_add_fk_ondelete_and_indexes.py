"""add FK ondelete rules and missing indexes

Revision ID: d5e6f7a8b9c0
Revises: c4d5e6f7a8b9
Create Date: 2026-02-10 12:00:00.000000

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d5e6f7a8b9c0"
down_revision: Union[str, None] = "c4d5e6f7a8b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- projects.owner_id: add CASCADE and index ---
    op.drop_constraint("projects_owner_id_fkey", "projects", type_="foreignkey")
    op.create_foreign_key(
        "projects_owner_id_fkey",
        "projects",
        "users",
        ["owner_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index("ix_projects_owner_id", "projects", ["owner_id"])

    # --- reports.project_id: add CASCADE ---
    op.drop_constraint("reports_project_id_fkey", "reports", type_="foreignkey")
    op.create_foreign_key(
        "reports_project_id_fkey",
        "reports",
        "projects",
        ["project_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # --- reports.assignee_id: add SET NULL and index ---
    op.drop_constraint("reports_assignee_id_fkey", "reports", type_="foreignkey")
    op.create_foreign_key(
        "reports_assignee_id_fkey",
        "reports",
        "users",
        ["assignee_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_reports_assignee_id", "reports", ["assignee_id"])

    # --- comments.report_id: add CASCADE ---
    op.drop_constraint("comments_report_id_fkey", "comments", type_="foreignkey")
    op.create_foreign_key(
        "comments_report_id_fkey",
        "comments",
        "reports",
        ["report_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # --- comments.author_id: add CASCADE ---
    op.drop_constraint("comments_author_id_fkey", "comments", type_="foreignkey")
    op.create_foreign_key(
        "comments_author_id_fkey",
        "comments",
        "users",
        ["author_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # --- webhooks.project_id: add CASCADE and index ---
    op.drop_constraint("webhooks_project_id_fkey", "webhooks", type_="foreignkey")
    op.create_foreign_key(
        "webhooks_project_id_fkey",
        "webhooks",
        "projects",
        ["project_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index("ix_webhooks_project_id", "webhooks", ["project_id"])

    # --- integrations.project_id: add CASCADE ---
    op.drop_constraint("integrations_project_id_fkey", "integrations", type_="foreignkey")
    op.create_foreign_key(
        "integrations_project_id_fkey",
        "integrations",
        "projects",
        ["project_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    # --- integrations.project_id: remove CASCADE ---
    op.drop_constraint("integrations_project_id_fkey", "integrations", type_="foreignkey")
    op.create_foreign_key(
        "integrations_project_id_fkey",
        "integrations",
        "projects",
        ["project_id"],
        ["id"],
    )

    # --- webhooks.project_id: remove CASCADE and index ---
    op.drop_index("ix_webhooks_project_id", table_name="webhooks")
    op.drop_constraint("webhooks_project_id_fkey", "webhooks", type_="foreignkey")
    op.create_foreign_key(
        "webhooks_project_id_fkey",
        "webhooks",
        "projects",
        ["project_id"],
        ["id"],
    )

    # --- comments.author_id: remove CASCADE ---
    op.drop_constraint("comments_author_id_fkey", "comments", type_="foreignkey")
    op.create_foreign_key(
        "comments_author_id_fkey",
        "comments",
        "users",
        ["author_id"],
        ["id"],
    )

    # --- comments.report_id: remove CASCADE ---
    op.drop_constraint("comments_report_id_fkey", "comments", type_="foreignkey")
    op.create_foreign_key(
        "comments_report_id_fkey",
        "comments",
        "reports",
        ["report_id"],
        ["id"],
    )

    # --- reports.assignee_id: remove SET NULL and index ---
    op.drop_index("ix_reports_assignee_id", table_name="reports")
    op.drop_constraint("reports_assignee_id_fkey", "reports", type_="foreignkey")
    op.create_foreign_key(
        "reports_assignee_id_fkey",
        "reports",
        "users",
        ["assignee_id"],
        ["id"],
    )

    # --- reports.project_id: remove CASCADE ---
    op.drop_constraint("reports_project_id_fkey", "reports", type_="foreignkey")
    op.create_foreign_key(
        "reports_project_id_fkey",
        "reports",
        "projects",
        ["project_id"],
        ["id"],
    )

    # --- projects.owner_id: remove CASCADE and index ---
    op.drop_index("ix_projects_owner_id", table_name="projects")
    op.drop_constraint("projects_owner_id_fkey", "projects", type_="foreignkey")
    op.create_foreign_key(
        "projects_owner_id_fkey",
        "projects",
        "users",
        ["owner_id"],
        ["id"],
    )
