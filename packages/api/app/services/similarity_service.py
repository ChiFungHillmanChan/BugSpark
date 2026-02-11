from __future__ import annotations

import uuid

from sqlalchemy import func, literal_column, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.report import Report
from app.utils.sql_helpers import escape_like


_pg_trgm_cache: bool | None = None


async def _has_pg_trgm(db: AsyncSession) -> bool:
    """Check whether the pg_trgm extension is available (cached after first check)."""
    global _pg_trgm_cache
    if _pg_trgm_cache is not None:
        return _pg_trgm_cache
    try:
        result = await db.execute(
            text("SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'")
        )
        _pg_trgm_cache = result.scalar() is not None
    except Exception:
        _pg_trgm_cache = False
    return _pg_trgm_cache


async def find_similar_reports(
    db: AsyncSession,
    report_id: uuid.UUID,
    project_id: uuid.UUID,
    threshold: float = 0.3,
    limit: int = 5,
) -> list[dict]:
    """Find reports similar to the given report within the same project.

    Uses pg_trgm similarity() on PostgreSQL for trigram-based matching.
    Falls back to LIKE-based search on databases without pg_trgm (e.g. SQLite in tests).

    Returns a list of dicts with keys: report, similarity_score.
    """
    source_result = await db.execute(select(Report).where(Report.id == report_id))
    source_report = source_result.scalar_one_or_none()
    if source_report is None:
        return []

    is_pg_trgm = await _has_pg_trgm(db)

    if is_pg_trgm:
        return await _find_similar_pg_trgm(
            db, source_report, project_id, threshold, limit
        )
    return await _find_similar_fallback(db, source_report, project_id, limit)


async def _find_similar_pg_trgm(
    db: AsyncSession,
    source: Report,
    project_id: uuid.UUID,
    threshold: float,
    limit: int,
) -> list[dict]:
    """Use pg_trgm similarity() to find similar reports."""
    title_sim = func.similarity(Report.title, source.title)
    desc_sim = func.similarity(Report.description, source.description)
    combined_score = (title_sim * literal_column("0.6") + desc_sim * literal_column("0.4")).label(
        "score"
    )

    query = (
        select(Report, combined_score)
        .where(
            Report.project_id == project_id,
            Report.id != source.id,
        )
        .having(combined_score >= threshold)
        .group_by(Report.id)
        .order_by(combined_score.desc())
        .limit(limit)
    )

    result = await db.execute(query)
    rows = result.all()

    return [
        {"report": row[0], "similarity_score": round(float(row[1]), 3)}
        for row in rows
    ]


async def _find_similar_fallback(
    db: AsyncSession,
    source: Report,
    project_id: uuid.UUID,
    limit: int,
) -> list[dict]:
    """Fallback: use LIKE-based keyword matching for non-PostgreSQL databases."""
    words = source.title.split()
    significant_words = [w for w in words if len(w) > 3][:5]

    if not significant_words:
        return []

    conditions = []
    for word in significant_words:
        escaped_word = escape_like(word)
        pattern = f"%{escaped_word}%"
        conditions.append(Report.title.ilike(pattern) | Report.description.ilike(pattern))

    from sqlalchemy import or_

    query = (
        select(Report)
        .where(
            Report.project_id == project_id,
            Report.id != source.id,
            or_(*conditions),
        )
        .order_by(Report.created_at.desc())
        .limit(limit)
    )

    result = await db.execute(query)
    reports = result.scalars().all()

    return [
        {"report": report, "similarity_score": 0.5}
        for report in reports
    ]
