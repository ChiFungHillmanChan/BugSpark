from __future__ import annotations

import hashlib
import hmac
from typing import AsyncGenerator

from fastapi import Depends, Header, Request
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import async_session
from app.exceptions import ForbiddenException, NotFoundException, UnauthorizedException
from app.i18n import get_locale, translate
from app.models.enums import Role
from app.models.project import Project
from app.models.user import User


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    locale = get_locale(request)
    token = request.cookies.get("bugspark_access_token")
    if not token:
        raise UnauthorizedException(translate("auth.missing_token", locale))

    settings = get_settings()

    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        raise UnauthorizedException(translate("auth.invalid_token", locale))

    if payload.get("type") != "access":
        raise UnauthorizedException(translate("auth.invalid_token_type", locale))

    user_id: str | None = payload.get("sub")
    if user_id is None:
        raise UnauthorizedException(translate("auth.token_missing_subject", locale))

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise UnauthorizedException(translate("auth.user_not_found", locale))

    return user


async def get_active_user(
    request: Request,
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        locale = get_locale(request)
        raise UnauthorizedException(translate("auth.account_deactivated", locale))
    return current_user


async def require_admin(
    request: Request,
    current_user: User = Depends(get_active_user),
) -> User:
    if current_user.role not in (Role.ADMIN, Role.SUPERADMIN):
        locale = get_locale(request)
        raise ForbiddenException(translate("admin.forbidden", locale))
    return current_user


async def require_superadmin(
    request: Request,
    current_user: User = Depends(get_active_user),
) -> User:
    if current_user.role != Role.SUPERADMIN:
        locale = get_locale(request)
        raise ForbiddenException(translate("admin.forbidden", locale))
    return current_user


async def validate_api_key(
    request: Request,
    x_api_key: str = Header(..., alias="X-API-Key"),
    db: AsyncSession = Depends(get_db),
) -> Project:
    locale = get_locale(request)
    prefix = x_api_key[:12] if len(x_api_key) >= 12 else x_api_key

    result = await db.execute(
        select(Project).where(
            Project.api_key_prefix == prefix,
            Project.is_active.is_(True),
        )
    )
    candidates = result.scalars().all()

    incoming_hash = hashlib.sha256(x_api_key.encode()).hexdigest()
    for project in candidates:
        if hmac.compare_digest(project.api_key_hash, incoming_hash):
            return project

    raise UnauthorizedException(translate("auth.invalid_api_key", locale))
