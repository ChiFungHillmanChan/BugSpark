from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.exceptions import BadRequestException, ForbiddenException, NotFoundException
from app.models.project import Project
from app.models.report import Report
from app.models.user import User
from app.schemas.analysis import AnalysisResponse
from app.services.ai_analysis_service import analyze_bug_report

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reports", tags=["analysis"])


@router.post("/{report_id}/analyze", response_model=AnalysisResponse)
async def analyze_report(
    report_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AnalysisResponse:
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()

    if report is None:
        raise NotFoundException("Report not found")

    user_project_ids = select(Project.id).where(Project.owner_id == current_user.id)
    project_check = await db.execute(
        select(Project.id).where(
            Project.id == report.project_id,
            Project.id.in_(user_project_ids),
        )
    )
    if project_check.scalar_one_or_none() is None:
        raise ForbiddenException("Not authorized to analyze this report")

    try:
        analysis = await analyze_bug_report(
            title=report.title,
            description=report.description,
            console_logs=report.console_logs,
            network_logs=report.network_logs,
            user_actions=report.user_actions,
            metadata=report.metadata_,
        )
    except ValueError as exc:
        raise BadRequestException(str(exc))

    return AnalysisResponse(**analysis)
