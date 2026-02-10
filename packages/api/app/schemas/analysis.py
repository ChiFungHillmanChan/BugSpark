from __future__ import annotations

from app.schemas import CamelModel


class AnalysisResponse(CamelModel):
    summary: str
    suggested_category: str
    suggested_severity: str
    reproduction_steps: list[str]
    root_cause: str = ""
    fix_suggestions: list[str] = []
    affected_area: str = ""
