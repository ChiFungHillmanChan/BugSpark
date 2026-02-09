from __future__ import annotations

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, validate_api_key
from app.exceptions import UnauthorizedException
from app.models.project import Project
from app.models.user import User
from app.services.auth_service import create_access_token


@pytest.fixture(autouse=True)
def _clear_settings_cache():
    from app.config import get_settings
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def _mock_request(
    cookies: dict[str, str] | None = None,
    headers: dict[str, str] | None = None,
) -> MagicMock:
    request = MagicMock()
    request.cookies = cookies or {}
    request.headers = headers or {"Accept-Language": "en"}
    return request


async def test_get_current_user_valid_token(
    db_session: AsyncSession, test_user: User
):
    token = create_access_token(str(test_user.id), test_user.email)
    request = _mock_request(cookies={"bugspark_access_token": token})

    user = await get_current_user(request=request, db=db_session)
    assert user.id == test_user.id
    assert user.email == test_user.email


async def test_get_current_user_invalid_token(db_session: AsyncSession):
    request = _mock_request(cookies={"bugspark_access_token": "invalid-token-here"})

    with pytest.raises(UnauthorizedException):
        await get_current_user(request=request, db=db_session)


async def test_get_current_user_missing_cookie(db_session: AsyncSession):
    request = _mock_request(cookies={})

    with pytest.raises(UnauthorizedException):
        await get_current_user(request=request, db=db_session)


async def test_validate_api_key_valid(
    db_session: AsyncSession, test_project: Project
):
    request = _mock_request()
    project = await validate_api_key(
        request=request,
        x_api_key=test_project.api_key,
        db=db_session,
    )
    assert project.id == test_project.id
    assert project.api_key == test_project.api_key


async def test_validate_api_key_invalid(db_session: AsyncSession):
    request = _mock_request()
    with pytest.raises(UnauthorizedException):
        await validate_api_key(
            request=request,
            x_api_key="bsk_pub_invalid_key_that_does_not_exist",
            db=db_session,
        )
