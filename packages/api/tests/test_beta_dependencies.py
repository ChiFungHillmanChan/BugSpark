"""Tests for get_active_user dependency blocking beta users.

Verifies that the dependency layer correctly blocks pending/rejected beta
users from accessing any protected endpoint, even if they have a valid token.
"""
from __future__ import annotations

from unittest.mock import MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_active_user
from app.exceptions import ForbiddenException
from app.models.user import User


def _mock_request(locale: str = "en") -> MagicMock:
    request = MagicMock()
    request.headers = {"Accept-Language": locale}
    return request


async def test_active_user_with_pending_beta_raises_forbidden(
    pending_beta_user: User,
):
    """get_active_user raises ForbiddenException for pending beta users."""
    request = _mock_request()
    with pytest.raises(ForbiddenException) as exc_info:
        await get_active_user(request=request, current_user=pending_beta_user)
    assert exc_info.value.code == "beta.waiting_list"


async def test_active_user_with_rejected_beta_raises_forbidden(
    rejected_beta_user: User,
):
    """get_active_user raises ForbiddenException for rejected beta users."""
    request = _mock_request()
    with pytest.raises(ForbiddenException) as exc_info:
        await get_active_user(request=request, current_user=rejected_beta_user)
    assert exc_info.value.code == "beta.rejected"


async def test_active_user_with_approved_beta_passes(
    approved_beta_user: User,
):
    """get_active_user allows approved beta users through."""
    request = _mock_request()
    user = await get_active_user(request=request, current_user=approved_beta_user)
    assert user.id == approved_beta_user.id


async def test_active_user_with_normal_user_passes(
    test_user: User,
):
    """get_active_user allows normal users (beta_status=none) through."""
    request = _mock_request()
    user = await get_active_user(request=request, current_user=test_user)
    assert user.id == test_user.id


async def test_inactive_user_still_raises_unauthorized(
    test_user: User,
    db_session: AsyncSession,
):
    """get_active_user raises UnauthorizedException for deactivated users."""
    from app.exceptions import UnauthorizedException

    test_user.is_active = False
    await db_session.commit()
    await db_session.refresh(test_user)

    request = _mock_request()
    with pytest.raises(UnauthorizedException):
        await get_active_user(request=request, current_user=test_user)
