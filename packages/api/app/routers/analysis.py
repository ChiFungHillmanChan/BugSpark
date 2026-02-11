from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.exceptions import BadRequestException, ForbiddenException, NotFoundException
from app.models.enums import Plan, Role
from app.models.project import Project
from app.models.report import Report
from app.models.user import User
from app.rate_limiter import limiter
from app.schemas.analysis import AnalysisResponse
from app.services.ai_analysis_service import analyze_bug_report, analyze_bug_report_stream

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reports", tags=["analysis"])


async def _get_authorized_report(
    report_id: uuid.UUID,
    current_user: User,
    db: AsyncSession,
) -> Report:
    if current_user.role != Role.SUPERADMIN and current_user.plan != Plan.ENTERPRISE:
        raise ForbiddenException("AI analysis is only available on the Enterprise plan")

    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()

    if report is None:
        raise NotFoundException("Report not found")

    if current_user.role != Role.SUPERADMIN:
        user_project_ids = select(Project.id).where(Project.owner_id == current_user.id)
        project_check = await db.execute(
            select(Project.id).where(
                Project.id == report.project_id,
                Project.id.in_(user_project_ids),
            )
        )
        if project_check.scalar_one_or_none() is None:
            raise ForbiddenException("Not authorized to analyze this report")

    return report


@router.post("/{report_id}/analyze", response_model=AnalysisResponse)
@limiter.limit("5/minute")
async def analyze_report(
    report_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AnalysisResponse:
    report = await _get_authorized_report(report_id, current_user, db)

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


@router.post("/{report_id}/analyze/stream")
@limiter.limit("5/minute")
async def analyze_report_stream(
    report_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    """Stream AI analysis as Server-Sent Events for real-time display."""
    report = await _get_authorized_report(report_id, current_user, db)

    async def event_generator():
        try:
            async for chunk in analyze_bug_report_stream(
                title=report.title,
                description=report.description,
                console_logs=report.console_logs,
                network_logs=report.network_logs,
                user_actions=report.user_actions,
                metadata=report.metadata_,
            ):
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"
        except ValueError as exc:
            yield f"data: [ERROR] {exc}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
