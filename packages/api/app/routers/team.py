from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_accessible_project, get_active_user, get_db
from app.exceptions import ForbiddenException
from app.rate_limiter import limiter
from app.i18n import get_locale, translate
from app.models.project import Project
from app.models.user import User
from app.schemas.team import (
    AcceptInviteRequest,
    InviteMemberRequest,
    ProjectMemberResponse,
    UpdateMemberRoleRequest,
)
from app.services.team_service import (
    accept_invite,
    get_project_members,
    invite_member,
    is_project_admin,
    remove_member,
    update_member_role,
)

router = APIRouter(tags=["team"])


def _member_response(member) -> ProjectMemberResponse:  # noqa: ANN001
    display_name = member.user.name if member.user else None
    return ProjectMemberResponse(
        id=member.id,
        project_id=member.project_id,
        user_id=member.user_id,
        email=member.email,
        role=member.role,
        invite_accepted_at=member.invite_accepted_at,
        created_at=member.created_at,
        display_name=display_name,
    )


async def _require_project_admin(
    project: Project,
    user: User,
    db: AsyncSession,
    locale: str,
) -> None:
    """Raise ForbiddenException if user is not the project owner or admin member."""
    is_admin = await is_project_admin(db, project, user)
    if not is_admin:
        raise ForbiddenException(translate("team.not_admin", locale))


@router.get(
    "/projects/{project_id}/members",
    response_model=list[ProjectMemberResponse],
)
async def list_members(
    project_id: uuid.UUID,
    request: Request,
    user: User = Depends(get_active_user),
    db: AsyncSession = Depends(get_db),
) -> list[ProjectMemberResponse]:
    locale = get_locale(request)
    project = await get_accessible_project(project_id, user, db, locale)
    members = await get_project_members(db, str(project.id))
    return [_member_response(m) for m in members]


@router.post(
    "/projects/{project_id}/members",
    response_model=ProjectMemberResponse,
    status_code=201,
)
async def invite(
    project_id: uuid.UUID,
    body: InviteMemberRequest,
    request: Request,
    user: User = Depends(get_active_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectMemberResponse:
    locale = get_locale(request)
    project = await get_accessible_project(project_id, user, db, locale)
    await _require_project_admin(project, user, db, locale)
    member = await invite_member(db, project, user, body.email, body.role, locale)
    return _member_response(member)


@router.patch(
    "/projects/{project_id}/members/{member_id}",
    response_model=ProjectMemberResponse,
)
async def update_role(
    project_id: uuid.UUID,
    member_id: uuid.UUID,
    body: UpdateMemberRoleRequest,
    request: Request,
    user: User = Depends(get_active_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectMemberResponse:
    locale = get_locale(request)
    project = await get_accessible_project(project_id, user, db, locale)
    await _require_project_admin(project, user, db, locale)
    member = await update_member_role(
        db, str(project.id), str(member_id), body.role, locale,
    )
    return _member_response(member)


@router.delete(
    "/projects/{project_id}/members/{member_id}",
    status_code=204,
)
async def remove(
    project_id: uuid.UUID,
    member_id: uuid.UUID,
    request: Request,
    user: User = Depends(get_active_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    locale = get_locale(request)
    project = await get_accessible_project(project_id, user, db, locale)
    await _require_project_admin(project, user, db, locale)
    await remove_member(db, str(project.id), str(member_id), locale)


@router.post(
    "/auth/accept-invite",
    response_model=ProjectMemberResponse,
)
@limiter.limit("10/minute")
async def accept(
    body: AcceptInviteRequest,
    request: Request,
    user: User = Depends(get_active_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectMemberResponse:
    locale = get_locale(request)
    member = await accept_invite(db, body.token, user, locale)
    return _member_response(member)
