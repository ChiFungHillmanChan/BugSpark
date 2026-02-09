from __future__ import annotations

from pydantic import BaseModel

from app.schemas import CamelModel


class BugTrend(BaseModel):
    date: str
    count: int


class OverviewStats(CamelModel):
    total_bugs: int
    open_bugs: int
    resolved_today: int
    avg_resolution_hours: float


class ProjectStats(CamelModel):
    bugs_by_severity: dict[str, int]
    bugs_by_status: dict[str, int]
    bugs_by_day: list[BugTrend]
