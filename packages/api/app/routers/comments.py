from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.dependencies import get_accessible_project_ids, get_active_user, get_db
from app.rate_limiter import limiter
from app.exceptions import ForbiddenException, NotFoundException
from app.i18n import get_locale, translate
from app.models.comment import Comment
from app.models.enums import Role
from app.models.report import Report
from app.models.user import User
from app.schemas.comment import CommentCreate, CommentResponse

router = APIRouter(tags=["comments"])


def _build_comment_response(comment: Comment) -> CommentResponse:
    return CommentResponse(
        id=comment.id,
        report_id=comment.report_id,
        author_id=comment.author_id,
        author_name=comment.author.name if comment.author else "Unknown",
        body=comment.body,
        created_at=comment.created_at,
    )


async def _verify_report_access(
    report_id: uuid.UUID,
    user: User,
    db: AsyncSession,
    locale: str,
) -> Report:
    """Verify the report exists and belongs to a project owned by the current user."""
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()

    if report is None:
        raise NotFoundException(translate("report.not_found", locale))

    if user.role != Role.SUPERADMIN:
        accessible_ids = await get_accessible_project_ids(user, db)
        if report.project_id not in accessible_ids:
            raise ForbiddenException(translate("report.not_authorized_view", locale))

    return report


@router.get("/reports/{report_id}/comments", response_model=list[CommentResponse])
async def list_comments(
    report_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_active_user),
    db: AsyncSession = Depends(get_db),
) -> list[CommentResponse]:
    locale = get_locale(request)
    await _verify_report_access(report_id, current_user, db, locale)

    result = await db.execute(
        select(Comment)
        .where(Comment.report_id == report_id)
        .options(selectinload(Comment.author))
        .order_by(Comment.created_at.asc())
    )
    comments = result.scalars().all()
    return [_build_comment_response(c) for c in comments]


@router.post("/reports/{report_id}/comments", response_model=CommentResponse, status_code=201)
@limiter.limit("10/minute")
async def create_comment(
    report_id: uuid.UUID,
    body: CommentCreate,
    request: Request,
    current_user: User = Depends(get_active_user),
    db: AsyncSession = Depends(get_db),
) -> CommentResponse:
    locale = get_locale(request)
    await _verify_report_access(report_id, current_user, db, locale)

    comment = Comment(
        report_id=report_id,
        author_id=current_user.id,
        body=body.body,
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)

    return _build_comment_response(comment)


@router.delete("/comments/{comment_id}", status_code=204)
async def delete_comment(
    comment_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_active_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    locale = get_locale(request)
    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    comment = result.scalar_one_or_none()

    if comment is None:
        raise NotFoundException(translate("comment.not_found", locale))
    if comment.author_id != current_user.id and current_user.role != Role.SUPERADMIN:
        raise ForbiddenException(translate("comment.not_owner", locale))

    await db.delete(comment)
    await db.commit()
