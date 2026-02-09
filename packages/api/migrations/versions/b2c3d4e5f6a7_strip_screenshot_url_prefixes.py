"""strip screenshot URL prefixes to store object keys only

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-02-09 14:10:00.000000

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Strip any URL prefix, keeping only the path portion (e.g. "screenshots/uuid.ext")
    # Handles patterns like "http://host:port/bucket/screenshots/..." or "https://..."
    op.execute(
        """
        UPDATE reports
        SET screenshot_url = regexp_replace(screenshot_url, '^https?://[^/]+/[^/]+/', '')
        WHERE screenshot_url IS NOT NULL
          AND screenshot_url LIKE 'http%'
        """
    )
    op.execute(
        """
        UPDATE reports
        SET annotated_screenshot_url = regexp_replace(annotated_screenshot_url, '^https?://[^/]+/[^/]+/', '')
        WHERE annotated_screenshot_url IS NOT NULL
          AND annotated_screenshot_url LIKE 'http%'
        """
    )


def downgrade() -> None:
    # Cannot fully restore original URLs, but this is a best-effort reverse
    pass
