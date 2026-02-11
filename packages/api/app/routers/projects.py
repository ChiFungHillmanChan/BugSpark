from __future__ import annotations

import hashlib
import logging
import secrets
import uuid

from datetime import date, datetime, time, timezone

from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_accessible_project, get_active_user, get_db, get_owned_project, validate_api_key
from app.rate_limiter import limiter
from app.exceptions import ForbiddenException, NotFoundException
from app.i18n import get_locale, translate
from app.models.enums import Role
from app.models.project import Project
from app.models.report import Report
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate, WidgetConfigResponse
from app.services.plan_limits_service import check_project_limit
from app.services.storage_service import delete_files

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/projects", tags=["projects"])


class ConsoleLogQuotaResponse(BaseModel):
    remaining: int
    limit: int
    allowed: bool


def _generate_api_key() -> str:
    return f"bsk_pub_{secrets.token_urlsafe(48)}="


def _hash_api_key(api_key: str) -> str:
    return hashlib.sha256(api_key.encode()).hexdigest()


def _api_key_prefix(api_key: str) -> str:
    """Extract the prefix used for fast DB lookup (first 12 chars)."""
    return api_key[:12]


def _mask_api_key(prefix: str) -> str:
    """Show prefix with masked suffix."""
    return prefix + "..."


def _project_response(
    project: Project,
    *,
    full_api_key: str | None = None,
    mask_key: bool = False,
) -> ProjectResponse:
    if full_api_key is not None:
        api_key_display = full_api_key
    elif mask_key:
        api_key_display = _mask_api_key(project.api_key_prefix)
    else:
        # Detail endpoint – we can no longer recover the full key, show masked
        api_key_display = _mask_api_key(project.api_key_prefix)
    return ProjectResponse(
        id=project.id,
        name=project.name,
        domain=project.domain,
        api_key=api_key_display,
        is_active=project.is_active,
        created_at=project.created_at,
        settings=project.settings,
    )


@router.get("/widget-config", response_model=WidgetConfigResponse)
async def get_widget_config(
    project: Project = Depends(validate_api_key),
) -> WidgetConfigResponse:
    settings = project.settings or {}
    owner_plan = project.owner.plan.value if project.owner else "free"
    return WidgetConfigResponse(
        primary_color=settings.get("widgetColor", "#e94560"),
        show_watermark=settings.get("showWatermark", True),
        enable_screenshot=settings.get("enableScreenshot", True),
        modal_title=settings.get("modalTitle"),
        button_text=settings.get("buttonText"),
        logo_url=settings.get("logoUrl"),
        owner_plan=owner_plan,
    )


CONSOLE_LOG_DAILY_LIMIT = 5


@router.get("/console-log-quota", response_model=ConsoleLogQuotaResponse)
async def get_console_log_quota(
    project: Project = Depends(validate_api_key),
    db: AsyncSession = Depends(get_db),
) -> ConsoleLogQuotaResponse:
    """Check how many console-log-included reports the project owner has left today."""
    today_start = datetime.combine(date.today(), time.min, tzinfo=timezone.utc)
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
    remaining = max(0, CONSOLE_LOG_DAILY_LIMIT - used)
    return ConsoleLogQuotaResponse(
        remaining=remaining,
        limit=CONSOLE_LOG_DAILY_LIMIT,
        allowed=remaining > 0,
    )


@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(
    body: ProjectCreate,
    current_user: User = Depends(get_active_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    await check_project_limit(db, current_user)
    raw_key = _generate_api_key()
    project = Project(
        owner_id=current_user.id,
        name=body.name,
        domain=body.domain,
        api_key_hash=_hash_api_key(raw_key),
        api_key_prefix=_api_key_prefix(raw_key),
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)

    return _project_response(project, full_api_key=raw_key)


@router.get("", response_model=list[ProjectResponse])
async def list_projects(
    current_user: User = Depends(get_active_user),
    db: AsyncSession = Depends(get_db),
    manageable: bool = Query(False, description="Include projects where user is an accepted admin member"),
) -> list[ProjectResponse]:
    query = select(Project).where(Project.is_active.is_(True))
    if current_user.role != Role.SUPERADMIN:
        if manageable:
            from app.models.project_member import ProjectMember

            admin_project_ids = (
                select(ProjectMember.project_id)
                .where(
                    ProjectMember.user_id == current_user.id,
                    ProjectMember.role == "admin",
                    ProjectMember.invite_accepted_at.is_not(None),
                )
            )
            query = query.where(
                (Project.owner_id == current_user.id) | Project.id.in_(admin_project_ids)
            )
        else:
            query = query.where(Project.owner_id == current_user.id)

    result = await db.execute(query)
    projects = result.scalars().all()
    return [_project_response(p, mask_key=True) for p in projects]


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_active_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    locale = get_locale(request)
    project = await get_accessible_project(project_id, current_user, db, locale)
    return _project_response(project)


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: uuid.UUID,
    body: ProjectUpdate,
    request: Request,
    current_user: User = Depends(get_active_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    locale = get_locale(request)
    project = await get_owned_project(project_id, current_user, db, locale)

    _PROJECT_UPDATABLE_FIELDS = {"name", "domain", "settings", "is_active"}
    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field in _PROJECT_UPDATABLE_FIELDS:
            setattr(project, field, value)

    await db.commit()
    await db.refresh(project)

    return _project_response(project)


@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_active_user),
    db: AsyncSession = Depends(get_db),
    permanent: bool = Query(False, description="Permanently delete project and all associated data including R2 files"),
) -> None:
    locale = get_locale(request)
    project = await get_owned_project(project_id, current_user, db, locale)

    # Collect all screenshot keys from reports for R2 cleanup
    result = await db.execute(
        select(Report.screenshot_url, Report.annotated_screenshot_url)
        .where(Report.project_id == project_id)
    )
    screenshot_rows = result.all()
    file_keys = []
    for row in screenshot_rows:
        if row.screenshot_url:
            file_keys.append(row.screenshot_url)
        if row.annotated_screenshot_url:
            file_keys.append(row.annotated_screenshot_url)

    # Delete files from R2/S3
    if file_keys:
        logger.info(f"Deleting {len(file_keys)} screenshot(s) from R2 for project {project_id}")
        await delete_files(file_keys)

    if permanent:
        # Hard delete: removes project and cascades to reports (via DB FK)
        await db.delete(project)
    else:
        # Soft delete: mark inactive, but still clean up R2 files
        project.is_active = False

    await db.commit()


@router.post("/{project_id}/rotate-key", response_model=ProjectResponse)
@limiter.limit("5/minute")
async def rotate_api_key(
    project_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_active_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    locale = get_locale(request)
    project = await get_owned_project(project_id, current_user, db, locale)
    raw_key = _generate_api_key()
    project.api_key_hash = _hash_api_key(raw_key)
    project.api_key_prefix = _api_key_prefix(raw_key)
    await db.commit()
    await db.refresh(project)

    return _project_response(project, full_api_key=raw_key)
