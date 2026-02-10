from __future__ import annotations

import hashlib
import logging
import secrets
import uuid

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.exceptions import ForbiddenException, NotFoundException
from app.i18n import get_locale, translate
from app.models.enums import Role
from app.models.project import Project
from app.models.report import Report
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate
from app.services.storage_service import delete_files

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/projects", tags=["projects"])


def _generate_api_key() -> str:
    return f"bsk_pub_{secrets.token_hex(16)}"


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


async def _get_owned_project(
    project_id: uuid.UUID, user: User, db: AsyncSession, locale: str = "en"
) -> Project:
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()

    if project is None:
        raise NotFoundException(translate("project.not_found", locale))
    if user.role != Role.SUPERADMIN and project.owner_id != user.id:
        raise ForbiddenException(translate("project.not_owner", locale))

    return project


@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(
    body: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectResponse:
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
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ProjectResponse]:
    query = select(Project).where(Project.is_active.is_(True))
    if current_user.role != Role.SUPERADMIN:
        query = query.where(Project.owner_id == current_user.id)

    result = await db.execute(query)
    projects = result.scalars().all()
    return [_project_response(p, mask_key=True) for p in projects]


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    locale = get_locale(request)
    project = await _get_owned_project(project_id, current_user, db, locale)
    return _project_response(project)


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: uuid.UUID,
    body: ProjectUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    locale = get_locale(request)
    project = await _get_owned_project(project_id, current_user, db, locale)

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)

    await db.commit()
    await db.refresh(project)

    return _project_response(project)


@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    permanent: bool = Query(False, description="Permanently delete project and all associated data including R2 files"),
) -> None:
    locale = get_locale(request)
    project = await _get_owned_project(project_id, current_user, db, locale)

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
async def rotate_api_key(
    project_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    locale = get_locale(request)
    project = await _get_owned_project(project_id, current_user, db, locale)
    raw_key = _generate_api_key()
    project.api_key_hash = _hash_api_key(raw_key)
    project.api_key_prefix = _api_key_prefix(raw_key)
    await db.commit()
    await db.refresh(project)

    return _project_response(project, full_api_key=raw_key)
