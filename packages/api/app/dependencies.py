from __future__ import annotations

from typing import AsyncGenerator

from fastapi import Depends, Header, Request
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import async_session
from app.exceptions import NotFoundException, UnauthorizedException
from app.i18n import get_locale, translate
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


async def validate_api_key(
    request: Request,
    x_api_key: str = Header(..., alias="X-API-Key"),
    db: AsyncSession = Depends(get_db),
) -> Project:
    locale = get_locale(request)
    result = await db.execute(
        select(Project).where(
            Project.api_key == x_api_key,
            Project.is_active.is_(True),
        )
    )
    project = result.scalar_one_or_none()

    if project is None:
        raise UnauthorizedException(translate("auth.invalid_api_key", locale))

    return project
