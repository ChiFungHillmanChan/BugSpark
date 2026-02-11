from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, require_superadmin
from app.exceptions import BadRequestException, NotFoundException
from app.i18n import get_locale, translate
from app.models.enums import BetaStatus, Plan, Role
from app.models.project import Project
from app.models.report import Report
from app.models.user import User
from app.schemas.admin import AdminUserListResponse, AdminUserResponse
from app.schemas.user import AdminUserUpdate

router = APIRouter()


def _admin_user_response(
    user: User,
    project_count: int = 0,
    report_count_month: int = 0,
) -> AdminUserResponse:
    return AdminUserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role.value if isinstance(user.role, Role) else user.role,
        plan=user.plan.value if isinstance(user.plan, Plan) else user.plan,
        is_active=user.is_active,
        beta_status=user.beta_status.value if isinstance(user.beta_status, BetaStatus) else user.beta_status,
        plan_expires_at=user.plan_expires_at,
        created_at=user.created_at,
        updated_at=user.updated_at,
        project_count=project_count,
        report_count_month=report_count_month,
    )


@router.get("/users", response_model=AdminUserListResponse)
async def list_users(
    current_user: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
    search: str | None = Query(None),
    role: str | None = Query(None),
    plan: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> AdminUserListResponse:
    from app.utils.sql_helpers import escape_like

    query = select(User)

    if search is not None:
        escaped = escape_like(search)
        search_filter = f"%{escaped}%"
        query = query.where(
            User.email.ilike(search_filter) | User.name.ilike(search_filter)
        )
    if role is not None:
        query = query.where(User.role == Role(role))
    if plan is not None:
        query = query.where(User.plan == Plan(plan))

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(User.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    users = result.scalars().all()

    user_ids = [u.id for u in users]

    proj_counts: dict[uuid.UUID, int] = {}
    if user_ids:
        pc_result = await db.execute(
            select(Project.owner_id, func.count(Project.id))
            .where(Project.owner_id.in_(user_ids), Project.is_active.is_(True))
            .group_by(Project.owner_id)
        )
        proj_counts = {row[0]: row[1] for row in pc_result.all()}

    report_counts: dict[uuid.UUID, int] = {}
    if user_ids:
        now = datetime.now(timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        rc_result = await db.execute(
            select(Project.owner_id, func.count(Report.id))
            .join(Project, Report.project_id == Project.id)
            .where(Project.owner_id.in_(user_ids), Report.created_at >= month_start)
            .group_by(Project.owner_id)
        )
        report_counts = {row[0]: row[1] for row in rc_result.all()}

    return AdminUserListResponse(
        items=[
            _admin_user_response(
                u,
                project_count=proj_counts.get(u.id, 0),
                report_count_month=report_counts.get(u.id, 0),
            )
            for u in users
        ],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/users/{user_id}", response_model=AdminUserResponse)
async def get_user(
    user_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
) -> AdminUserResponse:
    locale = get_locale(request)
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise NotFoundException(translate("admin.user_not_found", locale))

    return _admin_user_response(user)


@router.patch("/users/{user_id}", response_model=AdminUserResponse)
async def update_user(
    user_id: uuid.UUID,
    body: AdminUserUpdate,
    request: Request,
    current_user: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
) -> AdminUserResponse:
    locale = get_locale(request)

    if user_id == current_user.id and body.role is not None:
        raise BadRequestException(translate("admin.cannot_demote_self", locale))

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise NotFoundException(translate("admin.user_not_found", locale))

    provided_fields = body.model_fields_set

    if body.role is not None:
        try:
            user.role = Role(body.role)
        except ValueError:
            raise BadRequestException(translate("admin.invalid_role", locale))

    if body.plan is not None:
        try:
            user.plan = Plan(body.plan)
        except ValueError:
            raise BadRequestException(translate("admin.invalid_plan", locale))

    if body.is_active is not None:
        user.is_active = body.is_active

    if "plan_expires_at" in provided_fields:
        user.plan_expires_at = body.plan_expires_at

    await db.commit()
    await db.refresh(user)

    return _admin_user_response(user)
