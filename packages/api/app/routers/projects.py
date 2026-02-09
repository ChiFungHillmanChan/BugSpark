from __future__ import annotations

import secrets

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.exceptions import ForbiddenException, NotFoundException
from app.models.project import Project
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate, ProjectWithSecret

router = APIRouter(prefix="/projects", tags=["projects"])


def _generate_api_key() -> str:
    return f"bsk_pub_{secrets.token_hex(16)}"


def _generate_api_secret() -> str:
    return f"bsk_sec_{secrets.token_hex(16)}"


async def _get_owned_project(
    project_id: str, user: User, db: AsyncSession
) -> Project:
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()

    if project is None:
        raise NotFoundException("Project not found")
    if project.owner_id != user.id:
        raise ForbiddenException("Not the project owner")

    return project


@router.post("", response_model=ProjectWithSecret, status_code=201)
async def create_project(
    body: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectWithSecret:
    project = Project(
        owner_id=current_user.id,
        name=body.name,
        domain=body.domain,
        api_key=_generate_api_key(),
        api_secret=_generate_api_secret(),
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)

    return ProjectWithSecret.model_validate(project)


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
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    project = await _get_owned_project(project_id, current_user, db)
    return ProjectResponse.model_validate(project)


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    body: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    project = await _get_owned_project(project_id, current_user, db)

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)

    await db.commit()
    await db.refresh(project)

    return ProjectResponse.model_validate(project)


@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    project = await _get_owned_project(project_id, current_user, db)
    project.is_active = False
    await db.commit()


@router.post("/{project_id}/rotate-key", response_model=ProjectWithSecret)
async def rotate_api_key(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectWithSecret:
    project = await _get_owned_project(project_id, current_user, db)
    project.api_key = _generate_api_key()
    project.api_secret = _generate_api_secret()
    await db.commit()
    await db.refresh(project)

    return ProjectWithSecret.model_validate(project)
