"""drop api_secret, add report indexes and report_counter

Revision ID: a1b2c3d4e5f6
Revises: c8a6e9cd69a2
Create Date: 2026-02-09 14:00:00.000000

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'c8a6e9cd69a2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Drop dead api_secret column
    op.drop_column("projects", "api_secret")

    # 2. Add report_counter to projects
    op.add_column(
        "projects",
        sa.Column("report_counter", sa.Integer(), nullable=False, server_default="0"),
    )

    # 3. Backfill report_counter from existing report counts
    op.execute(
        """
        UPDATE projects
        SET report_counter = sub.cnt
        FROM (
            SELECT project_id, COUNT(*) AS cnt
            FROM reports
            GROUP BY project_id
        ) AS sub
        WHERE projects.id = sub.project_id
        """
    )

    # 4. Add individual indexes on reports
    op.create_index("ix_reports_project_id", "reports", ["project_id"])
    op.create_index("ix_reports_status", "reports", ["status"])
    op.create_index("ix_reports_severity", "reports", ["severity"])
    op.create_index("ix_reports_created_at", "reports", ["created_at"])

    # 5. Add composite index for common query pattern
    op.create_index(
        "ix_reports_project_status_created",
        "reports",
        ["project_id", "status", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_reports_project_status_created", table_name="reports")
    op.drop_index("ix_reports_created_at", table_name="reports")
    op.drop_index("ix_reports_severity", table_name="reports")
    op.drop_index("ix_reports_status", table_name="reports")
    op.drop_index("ix_reports_project_id", table_name="reports")

    op.drop_column("projects", "report_counter")

    op.add_column(
        "projects",
        sa.Column("api_secret", sa.String(length=255), nullable=False, server_default=""),
    )
