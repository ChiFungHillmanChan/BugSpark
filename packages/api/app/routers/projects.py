from __future__ import annotations

import secrets

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.exceptions import ForbiddenException, NotFoundException
from app.i18n import get_locale, translate
from app.models.project import Project
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate

router = APIRouter(prefix="/projects", tags=["projects"])


def _generate_api_key() -> str:
    return f"bsk_pub_{secrets.token_hex(16)}"


async def _get_owned_project(
    project_id: str, user: User, db: AsyncSession, locale: str = "en"
) -> Project:
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()

    if project is None:
        raise NotFoundException(translate("project.not_found", locale))
    if project.owner_id != user.id:
        raise ForbiddenException(translate("project.not_owner", locale))

    return project


@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(
    body: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    project = Project(
        owner_id=current_user.id,
        name=body.name,
        domain=body.domain,
        api_key=_generate_api_key(),
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)

    return ProjectResponse.model_validate(project)


@router.get("", response_model=list[ProjectResponse])
async def list_projects(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ProjectResponse]:
    result = await db.execute(
        select(Project).where(
            Project.owner_id == current_user.id,
            Project.is_active.is_(True),
        )
    )
    projects = result.scalars().all()
    return [ProjectResponse.model_validate(p) for p in projects]


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    locale = get_locale(request)
    project = await _get_owned_project(project_id, current_user, db, locale)
    return ProjectResponse.model_validate(project)


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
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

    return ProjectResponse.model_validate(project)


@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    locale = get_locale(request)
    project = await _get_owned_project(project_id, current_user, db, locale)
    project.is_active = False
    await db.commit()


@router.post("/{project_id}/rotate-key", response_model=ProjectResponse)
async def rotate_api_key(
    project_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    locale = get_locale(request)
    project = await _get_owned_project(project_id, current_user, db, locale)
    project.api_key = _generate_api_key()
    await db.commit()
    await db.refresh(project)

    return ProjectResponse.model_validate(project)
