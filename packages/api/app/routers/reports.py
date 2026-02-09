from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db, validate_api_key
from app.exceptions import ForbiddenException, NotFoundException
from app.models.project import Project
from app.models.report import Category, Report, Severity, Status
from app.models.user import User
from app.schemas.report import ReportCreate, ReportListResponse, ReportResponse, ReportUpdate
from app.services.tracking_id_service import generate_tracking_id

router = APIRouter(prefix="/reports", tags=["reports"])


def _report_to_response(report: Report) -> ReportResponse:
    """Build ReportResponse avoiding the metadata/metadata_ naming conflict."""
    return ReportResponse(
        id=report.id,
        project_id=report.project_id,
        tracking_id=report.tracking_id,
        title=report.title,
        description=report.description,
        severity=report.severity.value if isinstance(report.severity, Severity) else report.severity,
        category=report.category.value if isinstance(report.category, Category) else report.category,
        status=report.status.value if isinstance(report.status, Status) else report.status,
        assignee_id=report.assignee_id,
        screenshot_url=report.screenshot_url,
        annotated_screenshot_url=report.annotated_screenshot_url,
        console_logs=report.console_logs,
        network_logs=report.network_logs,
        user_actions=report.user_actions,
        metadata=report.metadata_,
        reporter_identifier=report.reporter_identifier,
        created_at=report.created_at,
        updated_at=report.updated_at,
    )


@router.post("", response_model=ReportResponse, status_code=201)
async def create_report(
    body: ReportCreate,
    project: Project = Depends(validate_api_key),
    db: AsyncSession = Depends(get_db),
) -> ReportResponse:
    tracking_id = await generate_tracking_id(db, str(project.id))

    report = Report(
        project_id=project.id,
        tracking_id=tracking_id,
        title=body.title,
        description=body.description,
        severity=Severity(body.severity),
        category=Category(body.category),
        reporter_identifier=body.reporter_identifier,
        screenshot_url=body.screenshot_url,
        annotated_screenshot_url=body.annotated_screenshot_url,
        console_logs=body.console_logs,
        network_logs=body.network_logs,
        user_actions=body.user_actions,
        metadata_=body.metadata,
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)

    return _report_to_response(report)


@router.get("", response_model=ReportListResponse)
async def list_reports(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    project_id: uuid.UUID | None = Query(None),
    status: str | None = Query(None),
    severity: str | None = Query(None),
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> ReportListResponse:
    user_project_ids = select(Project.id).where(Project.owner_id == current_user.id)
    query = select(Report).where(Report.project_id.in_(user_project_ids))

    if project_id is not None:
        query = query.where(Report.project_id == project_id)
    if status is not None:
        query = query.where(Report.status == Status(status))
    if severity is not None:
        query = query.where(Report.severity == Severity(severity))
    if search is not None:
        search_filter = f"%{search}%"
        query = query.where(
            Report.title.ilike(search_filter) | Report.description.ilike(search_filter)
        )

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Report.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    reports = result.scalars().all()

    items = [_report_to_response(report) for report in reports]

    return ReportListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReportResponse:
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()

    if report is None:
        raise NotFoundException("Report not found")

    user_project_ids = select(Project.id).where(Project.owner_id == current_user.id)
    project_check = await db.execute(
        select(Project.id).where(Project.id == report.project_id, Project.id.in_(user_project_ids))
    )
    if project_check.scalar_one_or_none() is None:
        raise ForbiddenException("Not authorized to view this report")

    return _report_to_response(report)


@router.patch("/{report_id}", response_model=ReportResponse)
async def update_report(
    report_id: str,
    body: ReportUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReportResponse:
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()

    if report is None:
        raise NotFoundException("Report not found")

    user_project_ids = select(Project.id).where(Project.owner_id == current_user.id)
    project_check = await db.execute(
        select(Project.id).where(Project.id == report.project_id, Project.id.in_(user_project_ids))
    )
    if project_check.scalar_one_or_none() is None:
        raise ForbiddenException("Not authorized to update this report")

    update_data = body.model_dump(exclude_unset=True)
    if "severity" in update_data and update_data["severity"] is not None:
        update_data["severity"] = Severity(update_data["severity"])
    if "category" in update_data and update_data["category"] is not None:
        update_data["category"] = Category(update_data["category"])
    if "status" in update_data and update_data["status"] is not None:
        update_data["status"] = Status(update_data["status"])

    for field, value in update_data.items():
        setattr(report, field, value)

    await db.commit()
    await db.refresh(report)

    return _report_to_response(report)


@router.delete("/{report_id}", status_code=204)
async def delete_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()

    if report is None:
        raise NotFoundException("Report not found")

    user_project_ids = select(Project.id).where(Project.owner_id == current_user.id)
    project_check = await db.execute(
        select(Project.id).where(Project.id == report.project_id, Project.id.in_(user_project_ids))
    )
    if project_check.scalar_one_or_none() is None:
        raise ForbiddenException("Not authorized to delete this report")

    await db.delete(report)
    await db.commit()
