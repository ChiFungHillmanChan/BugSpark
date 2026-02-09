from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.report import Report


async def generate_tracking_id(db: AsyncSession, project_id: str) -> str:
    result = await db.execute(
        select(func.count(Report.id)).where(Report.project_id == project_id)
    )
    current_count = result.scalar() or 0
    next_number = current_count + 1
    return f"BUG-{next_number:04d}"
