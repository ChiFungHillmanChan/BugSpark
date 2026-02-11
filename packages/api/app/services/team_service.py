from __future__ import annotations

import logging
import secrets
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.exceptions import BadRequestException, ForbiddenException, NotFoundException
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.user import User
from app.services.email_service import send_email

logger = logging.getLogger(__name__)

INVITE_TOKEN_LENGTH = 48


def _generate_invite_token() -> str:
    return secrets.token_urlsafe(INVITE_TOKEN_LENGTH)


async def get_project_members(
    db: AsyncSession,
    project_id: str,
) -> list[ProjectMember]:
    """Return all members of a project."""
    result = await db.execute(
        select(ProjectMember)
        .where(ProjectMember.project_id == project_id)
        .order_by(ProjectMember.created_at)
    )
    return list(result.scalars().all())


async def invite_member(
    db: AsyncSession,
    project: Project,
    inviter: User,
    email: str,
    role: str,
    locale: str,
) -> ProjectMember:
    """Invite a member to a project by email. Sends invitation email."""
    # Check if already a member
    existing = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project.id,
            ProjectMember.email == email.lower(),
        )
    )
    if existing.scalar_one_or_none() is not None:
        from app.i18n import translate
        raise BadRequestException(translate("team.already_member", locale))

    # Check if invited user already has an account
    user_result = await db.execute(
        select(User).where(User.email == email.lower())
    )
    existing_user = user_result.scalar_one_or_none()

    token = _generate_invite_token()
    member = ProjectMember(
        project_id=project.id,
        user_id=existing_user.id if existing_user else None,
        email=email.lower(),
        role=role,
        invite_token=token,
    )
    db.add(member)
    await db.commit()
    await db.refresh(member)

    # Send invitation email
    settings = get_settings()
    invite_url = f"{settings.FRONTEND_URL}/accept-invite?token={token}"
    await send_email(
        to=email,
        subject=f"{inviter.name} invited you to {project.name} on BugSpark",
        html=(
            f"<p>Hi,</p>"
            f"<p><strong>{inviter.name}</strong> has invited you to join "
            f"<strong>{project.name}</strong> as a <strong>{role}</strong> on BugSpark.</p>"
            f'<p><a href="{invite_url}">Accept Invitation</a></p>'
            f"<p>If you did not expect this invitation, you can ignore this email.</p>"
        ),
    )

    logger.info(
        "User %s invited %s to project %s as %s",
        inviter.id, email, project.id, role,
    )
    return member


async def accept_invite(
    db: AsyncSession,
    token: str,
    user: User,
    locale: str,
) -> ProjectMember:
    """Accept a project invitation using the invite token."""
    from app.i18n import translate

    result = await db.execute(
        select(ProjectMember).where(
            ProjectMember.invite_token == token,
        )
    )
    member = result.scalar_one_or_none()

    if member is None:
        raise BadRequestException(translate("team.invite_invalid", locale))

    member.user_id = user.id
    member.invite_token = None
    member.invite_accepted_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(member)

    logger.info("User %s accepted invite to project %s", user.id, member.project_id)
    return member


async def update_member_role(
    db: AsyncSession,
    project_id: str,
    member_id: str,
    new_role: str,
    locale: str,
) -> ProjectMember:
    """Update a team member's role."""
    from app.i18n import translate

    result = await db.execute(
        select(ProjectMember).where(
            ProjectMember.id == member_id,
            ProjectMember.project_id == project_id,
        )
    )
    member = result.scalar_one_or_none()
    if member is None:
        raise NotFoundException(translate("team.member_not_found", locale))

    member.role = new_role
    await db.commit()
    await db.refresh(member)
    return member


async def remove_member(
    db: AsyncSession,
    project_id: str,
    member_id: str,
    locale: str,
) -> None:
    """Remove a team member from a project."""
    from app.i18n import translate

    result = await db.execute(
        select(ProjectMember).where(
            ProjectMember.id == member_id,
            ProjectMember.project_id == project_id,
        )
    )
    member = result.scalar_one_or_none()
    if member is None:
        raise NotFoundException(translate("team.member_not_found", locale))

    await db.delete(member)
    await db.commit()


async def is_project_admin(
    db: AsyncSession,
    project: Project,
    user: User,
) -> bool:
    """Check if user is the project owner or an admin member."""
    if project.owner_id == user.id:
        return True

    result = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project.id,
            ProjectMember.user_id == user.id,
            ProjectMember.role == "admin",
            ProjectMember.invite_accepted_at.is_not(None),
        )
    )
    return result.scalar_one_or_none() is not None
