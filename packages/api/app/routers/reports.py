from __future__ import annotations

import asyncio
import uuid
from datetime import date, datetime, time, timedelta, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, Query, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.dependencies import get_accessible_project_ids, get_active_user, get_db, validate_api_key
from app.exceptions import BadRequestException, ForbiddenException, NotFoundException
from app.rate_limiter import limiter
from app.i18n import get_locale, translate
from app.models.enums import Role
from app.models.project import Project
from app.models.report import Category, Report, Severity, Status
from app.models.user import User
from app.schemas.report import ReportCreate, ReportListItemResponse, ReportListResponse, ReportResponse, ReportUpdate
from app.schemas.similarity import SimilarReportItem, SimilarReportsResponse
from app.services.plan_limits_service import check_report_limit
from app.utils.sql_helpers import escape_like
from app.services.spam_protection_service import check_honeypot, is_duplicate_report, validate_origin
from app.services.similarity_service import find_similar_reports
from app.services.storage_service import delete_file, generate_presigned_url, validate_object_key
from app.services.tracking_id_service import generate_tracking_id
from app.services.notification_service import notify_new_report
from app.services.webhook_service import dispatch_webhooks

router = APIRouter(prefix="/reports", tags=["reports"])

DAILY_CONSOLE_LOG_LIMIT = 5


async def _resolve_screenshot_url(key_or_url: str | None) -> str | None:
    """Generate a presigned URL from an S3 object key. Handles legacy full URLs gracefully."""
    if not key_or_url:
        return None
    if key_or_url.startswith("http://") or key_or_url.startswith("https://"):
        return key_or_url
    # Defense-in-depth: only sign keys that match the upload-generated format
    if not validate_object_key(key_or_url):
        return None
    return await generate_presigned_url(key_or_url)


async def _report_to_response(report: Report) -> ReportResponse:
    """Build ReportResponse avoiding the metadata/metadata_ naming conflict."""
    screenshot_url, annotated_screenshot_url = await asyncio.gather(
        _resolve_screenshot_url(report.screenshot_url),
        _resolve_screenshot_url(report.annotated_screenshot_url),
    )
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
        screenshot_url=screenshot_url,
        annotated_screenshot_url=annotated_screenshot_url,
        console_logs=report.console_logs,
        network_logs=report.network_logs,
        user_actions=report.user_actions,
        metadata=report.metadata_,
        reporter_identifier=report.reporter_identifier,
        console_logs_included=report.console_logs_included,
        created_at=report.created_at,
        updated_at=report.updated_at,
    )


def _report_to_list_item(report: Report) -> ReportListItemResponse:
    """Build a lightweight list item — no presigned URL generation."""
    return ReportListItemResponse(
        id=report.id,
        project_id=report.project_id,
        tracking_id=report.tracking_id,
        title=report.title,
        description=report.description,
        severity=report.severity.value if isinstance(report.severity, Severity) else report.severity,
        category=report.category.value if isinstance(report.category, Category) else report.category,
        status=report.status.value if isinstance(report.status, Status) else report.status,
        assignee_id=report.assignee_id,
        reporter_identifier=report.reporter_identifier,
        created_at=report.created_at,
        updated_at=report.updated_at,
    )


@router.post("", response_model=ReportResponse, status_code=201)
@limiter.limit("10/minute")
async def create_report(
    request: Request,
    body: ReportCreate,
    background_tasks: BackgroundTasks,
    project: Project = Depends(validate_api_key),
    db: AsyncSession = Depends(get_db),
) -> ReportResponse:
    if check_honeypot(body.hp_field):
        raise BadRequestException("Invalid request")

    if not validate_origin(request, project):
        raise BadRequestException("Invalid origin")

    if await is_duplicate_report(db, str(project.id), body.title, body.description):
        raise BadRequestException("Duplicate report detected")

    await check_report_limit(db, project)

    # Validate screenshot keys match upload-generated format before persisting
    for key in (body.screenshot_url, body.annotated_screenshot_url):
        if key and not key.startswith(("http://", "https://")) and not validate_object_key(key):
            raise BadRequestException("Invalid screenshot key")

    tracking_id = await generate_tracking_id(db, str(project.id))

    # Determine whether console logs should be flagged as included
    has_console_logs = bool(body.console_logs)
    console_logs_included = False
    if has_console_logs:
        today_start = datetime.combine(datetime.now(timezone.utc).date(), time.min, tzinfo=timezone.utc)
        count_result = await db.execute(
            select(func.count())
            .select_from(Report)
            .where(
                Report.project_id == project.id,
                Report.console_logs_included.is_(True),
                Report.created_at >= today_start,
            )
        )
        used = count_result.scalar() or 0
        if used >= DAILY_CONSOLE_LOG_LIMIT:
            # Strip console logs — daily limit exceeded
            body.console_logs = None
        else:
            console_logs_included = True

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
        console_logs_included=console_logs_included,
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)

    response = await _report_to_response(report)
    await dispatch_webhooks(
        db, background_tasks, str(project.id), "report.created", response.model_dump(mode="json")
    )

    report_data = response.model_dump(mode="json")
    project_id_str = str(project.id)
    background_tasks.add_task(notify_new_report, project_id_str, report_data)

    return response


@router.get("", response_model=ReportListResponse)
async def list_reports(
    current_user: User = Depends(get_active_user),
    db: AsyncSession = Depends(get_db),
    project_id: uuid.UUID | None = Query(None),
    status: str | None = Query(None),
    severity: str | None = Query(None),
    search: str | None = Query(None),
    date_range: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> ReportListResponse:
    query = select(Report)
    if current_user.role != Role.SUPERADMIN:
        accessible_ids = await get_accessible_project_ids(current_user, db)
        query = query.where(Report.project_id.in_(accessible_ids))

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
        escaped_search = escape_like(search)
        search_filter = f"%{escaped_search}%"
        query = query.where(
            Report.title.ilike(search_filter) | Report.description.ilike(search_filter)
        )
    if date_range is not None and date_range != "all":
        now_utc = datetime.now(timezone.utc)
        if date_range == "today":
            cutoff = datetime.combine(now_utc.date(), time.min, tzinfo=timezone.utc)
        elif date_range == "7d":
            cutoff = now_utc - timedelta(days=7)
        elif date_range == "30d":
            cutoff = now_utc - timedelta(days=30)
        elif date_range == "90d":
            cutoff = now_utc - timedelta(days=90)
        else:
            cutoff = None
        if cutoff is not None:
            query = query.where(Report.created_at >= cutoff)

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Report.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    reports = result.scalars().all()

    items = [_report_to_list_item(report) for report in reports]

    return ReportListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_active_user),
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
        accessible_ids = await get_accessible_project_ids(current_user, db)
        if report.project_id not in accessible_ids:
            raise ForbiddenException(translate("report.not_authorized_view", locale))

    return await _report_to_response(report)


@router.patch("/{report_id}", response_model=ReportResponse)
async def update_report(
    report_id: uuid.UUID,
    body: ReportUpdate,
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_active_user),
    db: AsyncSession = Depends(get_db),
) -> ReportResponse:
    locale = get_locale(request)
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()

    if report is None:
        raise NotFoundException(translate("report.not_found", locale))

    if current_user.role != Role.SUPERADMIN:
        accessible_ids = await get_accessible_project_ids(current_user, db)
        if report.project_id not in accessible_ids:
            raise ForbiddenException(translate("report.not_authorized_update", locale))

    _REPORT_UPDATABLE_FIELDS = {"title", "description", "severity", "category", "status", "assignee_id"}
    update_data = body.model_dump(exclude_unset=True)
    if "severity" in update_data and update_data["severity"] is not None:
        update_data["severity"] = Severity(update_data["severity"])
    if "category" in update_data and update_data["category"] is not None:
        update_data["category"] = Category(update_data["category"])
    if "status" in update_data and update_data["status"] is not None:
        update_data["status"] = Status(update_data["status"])

    for field, value in update_data.items():
        if field in _REPORT_UPDATABLE_FIELDS:
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
    current_user: User = Depends(get_active_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    locale = get_locale(request)
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()

    if report is None:
        raise NotFoundException(translate("report.not_found", locale))

    if current_user.role != Role.SUPERADMIN:
        accessible_ids = await get_accessible_project_ids(current_user, db)
        if report.project_id not in accessible_ids:
            raise ForbiddenException(translate("report.not_authorized_delete", locale))

    # Clean up screenshots from R2/S3 before deleting the DB record
    if report.screenshot_url:
        await delete_file(report.screenshot_url)
    if report.annotated_screenshot_url:
        await delete_file(report.annotated_screenshot_url)

    await db.delete(report)
    await db.commit()


@router.get("/{report_id}/similar", response_model=SimilarReportsResponse)
@limiter.limit("10/minute")
async def get_similar_reports(
    report_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_active_user),
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
        accessible_ids = await get_accessible_project_ids(current_user, db)
        if report.project_id not in accessible_ids:
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
