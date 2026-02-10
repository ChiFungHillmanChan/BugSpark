from __future__ import annotations

import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, Query, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.dependencies import get_current_user, get_db, validate_api_key
from app.exceptions import ForbiddenException, NotFoundException
from app.i18n import get_locale, translate
from app.models.enums import Role
from app.models.project import Project
from app.models.report import Category, Report, Severity, Status
from app.models.user import User
from app.schemas.report import ReportCreate, ReportListResponse, ReportResponse, ReportUpdate
from app.schemas.similarity import SimilarReportItem, SimilarReportsResponse
from app.services.similarity_service import find_similar_reports
from app.services.storage_service import generate_presigned_url
from app.services.tracking_id_service import generate_tracking_id
from app.services.webhook_service import dispatch_webhooks

router = APIRouter(prefix="/reports", tags=["reports"])


async def _resolve_screenshot_url(key_or_url: str | None) -> str | None:
    """Generate a presigned URL from an S3 object key. Handles legacy full URLs gracefully."""
    if not key_or_url:
        return None
    if key_or_url.startswith("http://") or key_or_url.startswith("https://"):
        return key_or_url
    return await generate_presigned_url(key_or_url)


async def _report_to_response(report: Report) -> ReportResponse:
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
        screenshot_url=await _resolve_screenshot_url(report.screenshot_url),
        annotated_screenshot_url=await _resolve_screenshot_url(report.annotated_screenshot_url),
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
    background_tasks: BackgroundTasks,
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

    response = await _report_to_response(report)
    await dispatch_webhooks(
        db, background_tasks, str(project.id), "report.created", response.model_dump(mode="json")
    )

    return response


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
    query = select(Report)
    if current_user.role != Role.SUPERADMIN:
        user_project_ids = select(Project.id).where(Project.owner_id == current_user.id)
        query = query.where(Report.project_id.in_(user_project_ids))

    if project_id is not None:
        query = query.where(Report.project_id == project_id)
    if status is not None:
        status_values = [Status(s.strip()) for s in status.split(",") if s.strip()]
        if len(status_values) == 1:
            query = query.where(Report.status == status_values[0])
        elif status_values:
            query = query.where(Report.status.in_(status_values))
    if severity is not None:
        severity_values = [Severity(s.strip()) for s in severity.split(",") if s.strip()]
        if len(severity_values) == 1:
            query = query.where(Report.severity == severity_values[0])
        elif severity_values:
            query = query.where(Report.severity.in_(severity_values))
    if search is not None:
        escaped_search = search.replace("%", "\\%").replace("_", "\\_")
        search_filter = f"%{escaped_search}%"
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

    items = [await _report_to_response(report) for report in reports]

    return ReportListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReportResponse:
    locale = get_locale(request)
    result = await db.execute(
        select(Report).where(Report.id == report_id).options(selectinload(Report.comments))
    )
    report = result.scalar_one_or_none()

    if report is None:
        raise NotFoundException(translate("report.not_found", locale))

    if current_user.role != Role.SUPERADMIN:
        user_project_ids = select(Project.id).where(Project.owner_id == current_user.id)
        project_check = await db.execute(
            select(Project.id).where(Project.id == report.project_id, Project.id.in_(user_project_ids))
        )
        if project_check.scalar_one_or_none() is None:
            raise ForbiddenException(translate("report.not_authorized_view", locale))

    return await _report_to_response(report)


@router.patch("/{report_id}", response_model=ReportResponse)
async def update_report(
    report_id: uuid.UUID,
    body: ReportUpdate,
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReportResponse:
    locale = get_locale(request)
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()

    if report is None:
        raise NotFoundException(translate("report.not_found", locale))

    if current_user.role != Role.SUPERADMIN:
        user_project_ids = select(Project.id).where(Project.owner_id == current_user.id)
        project_check = await db.execute(
            select(Project.id).where(Project.id == report.project_id, Project.id.in_(user_project_ids))
        )
        if project_check.scalar_one_or_none() is None:
            raise ForbiddenException(translate("report.not_authorized_update", locale))

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

    response = await _report_to_response(report)
    await dispatch_webhooks(
        db, background_tasks, str(report.project_id), "report.updated", response.model_dump(mode="json")
    )

    return response


@router.delete("/{report_id}", status_code=204)
async def delete_report(
    report_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    locale = get_locale(request)
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()

    if report is None:
        raise NotFoundException(translate("report.not_found", locale))

    if current_user.role != Role.SUPERADMIN:
        user_project_ids = select(Project.id).where(Project.owner_id == current_user.id)
        project_check = await db.execute(
            select(Project.id).where(Project.id == report.project_id, Project.id.in_(user_project_ids))
        )
        if project_check.scalar_one_or_none() is None:
            raise ForbiddenException(translate("report.not_authorized_delete", locale))

    await db.delete(report)
    await db.commit()


@router.get("/{report_id}/similar", response_model=SimilarReportsResponse)
async def get_similar_reports(
    report_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    threshold: float = Query(0.3, ge=0.0, le=1.0),
    limit: int = Query(5, ge=1, le=20),
) -> SimilarReportsResponse:
    locale = get_locale(request)
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()

    if report is None:
        raise NotFoundException(translate("report.not_found", locale))

    if current_user.role != Role.SUPERADMIN:
        user_project_ids = select(Project.id).where(Project.owner_id == current_user.id)
        project_check = await db.execute(
            select(Project.id).where(Project.id == report.project_id, Project.id.in_(user_project_ids))
        )
        if project_check.scalar_one_or_none() is None:
            raise ForbiddenException(translate("report.not_authorized_view", locale))

    similar = await find_similar_reports(
        db, report.id, report.project_id, threshold=threshold, limit=limit
    )

    items = [
        SimilarReportItem(
            id=entry["report"].id,
            tracking_id=entry["report"].tracking_id,
            title=entry["report"].title,
            severity=(
                entry["report"].severity.value
                if isinstance(entry["report"].severity, Severity)
                else entry["report"].severity
            ),
            status=(
                entry["report"].status.value
                if isinstance(entry["report"].status, Status)
                else entry["report"].status
            ),
            created_at=entry["report"].created_at,
            similarity_score=entry["similarity_score"],
        )
        for entry in similar
    ]

    return SimilarReportsResponse(items=items)
