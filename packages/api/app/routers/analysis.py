from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_accessible_project_ids, get_active_user, get_db
from app.exceptions import BadRequestException, ForbiddenException, NotFoundException
from app.models.enums import Plan, Role
from app.models.report import Report
from app.models.report_analysis import ReportAnalysis
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
        accessible_ids = await get_accessible_project_ids(current_user, db)
        if report.project_id not in accessible_ids:
            raise ForbiddenException("Not authorized to analyze this report")

    return report


def _get_language(request: Request) -> str:
    """Extract language from Accept-Language header."""
    return request.headers.get("Accept-Language", "en").split(",")[0].strip()


def _get_annotations(report: Report) -> str | None:
    """Extract user annotation text from report metadata if available."""
    if report.metadata_ and isinstance(report.metadata_, dict):
        annotations = report.metadata_.get("annotations")
        if annotations and isinstance(annotations, str):
            return annotations
    return None


@router.get("/{report_id}/analyze", response_model=AnalysisResponse)
async def get_analysis(
    report_id: uuid.UUID,
    current_user: User = Depends(get_active_user),
    db: AsyncSession = Depends(get_db),
) -> AnalysisResponse:
    """Get existing AI analysis for a report if available."""
    report = await _get_authorized_report(report_id, current_user, db)
    
    result = await db.execute(
        select(ReportAnalysis).where(ReportAnalysis.report_id == report_id)
    )
    existing_analysis = result.scalar_one_or_none()
    
    if existing_analysis:
        return AnalysisResponse(
            summary=existing_analysis.summary,
            suggested_category=existing_analysis.suggested_category,
            suggested_severity=existing_analysis.suggested_severity,
            reproduction_steps=existing_analysis.reproduction_steps or [],
            root_cause=existing_analysis.root_cause or "",
            fix_suggestions=existing_analysis.fix_suggestions or [],
            affected_area=existing_analysis.affected_area or "",
        )
    
    raise NotFoundException("Analysis not found for this report")


@router.post("/{report_id}/analyze", response_model=AnalysisResponse)
@limiter.limit("5/minute")
async def analyze_report(
    report_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_active_user),
    db: AsyncSession = Depends(get_db),
) -> AnalysisResponse:
    """Generate and store AI analysis for a report."""
    report = await _get_authorized_report(report_id, current_user, db)
    language = _get_language(request)

    # Check if analysis already exists
    result = await db.execute(
        select(ReportAnalysis).where(ReportAnalysis.report_id == report_id)
    )
    existing_analysis = result.scalar_one_or_none()
    
    if existing_analysis:
        # Return existing analysis
        return AnalysisResponse(
            summary=existing_analysis.summary,
            suggested_category=existing_analysis.suggested_category,
            suggested_severity=existing_analysis.suggested_severity,
            reproduction_steps=existing_analysis.reproduction_steps or [],
            root_cause=existing_analysis.root_cause or "",
            fix_suggestions=existing_analysis.fix_suggestions or [],
            affected_area=existing_analysis.affected_area or "",
        )

    # Generate new analysis
    try:
        analysis_data = await analyze_bug_report(
            title=report.title,
            description=report.description,
            console_logs=report.console_logs,
            network_logs=report.network_logs,
            user_actions=report.user_actions,
            metadata=report.metadata_,
            language=language,
            annotations=_get_annotations(report),
        )
    except ValueError as exc:
        raise BadRequestException(str(exc))

    # Save analysis to database
    new_analysis = ReportAnalysis(
        report_id=report_id,
        summary=analysis_data["summary"],
        suggested_category=analysis_data["suggested_category"],
        suggested_severity=analysis_data["suggested_severity"],
        reproduction_steps=analysis_data["reproduction_steps"],
        root_cause=analysis_data.get("root_cause") or None,
        fix_suggestions=analysis_data.get("fix_suggestions") or None,
        affected_area=analysis_data.get("affected_area") or None,
        language=language,
    )
    db.add(new_analysis)
    await db.commit()
    await db.refresh(new_analysis)

    return AnalysisResponse(**analysis_data)


@router.post("/{report_id}/analyze/stream")
@limiter.limit("5/minute")
async def analyze_report_stream(
    report_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_active_user),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    """Stream AI analysis as Server-Sent Events for real-time display."""
    report = await _get_authorized_report(report_id, current_user, db)
    language = _get_language(request)

    async def event_generator():
        try:
            async for chunk in analyze_bug_report_stream(
                title=report.title,
                description=report.description,
                console_logs=report.console_logs,
                network_logs=report.network_logs,
                user_actions=report.user_actions,
                metadata=report.metadata_,
                language=language,
                annotations=_get_annotations(report),
            ):
                if await request.is_disconnected():
                    logger.info("SSE client disconnected, stopping analysis stream")
                    return
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
