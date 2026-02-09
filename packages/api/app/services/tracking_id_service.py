from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def generate_tracking_id(db: AsyncSession, project_id: str) -> str:
    result = await db.execute(
        text(
            "UPDATE projects "
            "SET report_counter = report_counter + 1 "
            "WHERE id = :project_id "
            "RETURNING report_counter"
        ),
        {"project_id": project_id},
    )
    next_number = result.scalar_one()
    return f"BUG-{next_number:04d}"
