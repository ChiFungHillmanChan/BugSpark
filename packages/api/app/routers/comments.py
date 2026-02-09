from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.exceptions import ForbiddenException, NotFoundException
from app.models.comment import Comment
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


@router.get("/reports/{report_id}/comments", response_model=list[CommentResponse])
async def list_comments(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[CommentResponse]:
    result = await db.execute(
        select(Comment)
        .where(Comment.report_id == report_id)
        .order_by(Comment.created_at.asc())
    )
    comments = result.scalars().all()
    return [_build_comment_response(c) for c in comments]


@router.post("/reports/{report_id}/comments", response_model=CommentResponse, status_code=201)
async def create_comment(
    report_id: str,
    body: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CommentResponse:
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
    comment_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    comment = result.scalar_one_or_none()

    if comment is None:
        raise NotFoundException("Comment not found")
    if comment.author_id != current_user.id:
        raise ForbiddenException("Can only delete your own comments")

    await db.delete(comment)
    await db.commit()
