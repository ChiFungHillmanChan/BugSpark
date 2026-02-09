from __future__ import annotations

from typing import AsyncGenerator

from fastapi import Depends, Header
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import async_session
from app.exceptions import NotFoundException, UnauthorizedException
from app.models.project import Project
from app.models.user import User


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def get_current_user(
    authorization: str = Header(..., description="Bearer <token>"),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not authorization.startswith("Bearer "):
        raise UnauthorizedException("Invalid authorization header")

    token = authorization.removeprefix("Bearer ").strip()
    settings = get_settings()

    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        raise UnauthorizedException("Invalid or expired token")

    user_id: str | None = payload.get("sub")
    if user_id is None:
        raise UnauthorizedException("Token missing subject")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise UnauthorizedException("User not found")

    return user


async def validate_api_key(
    x_api_key: str = Header(..., alias="X-API-Key"),
    db: AsyncSession = Depends(get_db),
) -> Project:
    if len(x_api_key) < 8:
        raise UnauthorizedException("Invalid API key")

    prefix = x_api_key[:8]
    result = await db.execute(
        select(Project).where(
            Project.api_key.startswith(prefix),
            Project.is_active.is_(True),
        )
    )
    project = result.scalar_one_or_none()

    if project is None or project.api_key != x_api_key:
        raise UnauthorizedException("Invalid API key")

    return project
