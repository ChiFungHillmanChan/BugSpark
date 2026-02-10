"""Tests for admin beta user management and app settings endpoints.

Covers:
- GET /admin/beta-users (list, filter, search)
- POST /admin/beta-users/{id}/approve
- POST /admin/beta-users/{id}/reject
- GET /admin/settings
- PATCH /admin/settings (toggle beta mode)
- GET /admin/stats includes pendingBetaCount
- Access control (regular users blocked)
"""
from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.models.app_settings import AppSettings
from app.models.user import User


BASE = "/api/v1/admin"


# ── GET /admin/settings ─────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_settings_as_superadmin(
    client: AsyncClient,
    superadmin_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_superadmin: User,
) -> None:
    """Superadmin can read app settings; creates default row if missing."""
    resp = await client.get(
        f"{BASE}/settings",
        cookies=superadmin_cookies,
        headers=csrf_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "betaModeEnabled" in data
    # Default is True
    assert data["betaModeEnabled"] is True


@pytest.mark.asyncio
async def test_get_settings_forbidden_for_regular_user(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    csrf_headers: dict[str, str],
) -> None:
    resp = await client.get(
        f"{BASE}/settings",
        cookies=auth_cookies,
        headers=csrf_headers,
    )
    assert resp.status_code == 403


# ── PATCH /admin/settings ────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_toggle_beta_mode_off(
    client: AsyncClient,
    superadmin_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_superadmin: User,
) -> None:
    """Superadmin can turn beta mode OFF."""
    resp = await client.patch(
        f"{BASE}/settings",
        json={"betaModeEnabled": False},
        cookies=superadmin_cookies,
        headers=csrf_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["betaModeEnabled"] is False


@pytest.mark.asyncio
async def test_toggle_beta_mode_on(
    client: AsyncClient,
    superadmin_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_superadmin: User,
) -> None:
    """Superadmin can turn beta mode ON."""
    # First turn it off
    await client.patch(
        f"{BASE}/settings",
        json={"betaModeEnabled": False},
        cookies=superadmin_cookies,
        headers=csrf_headers,
    )
    # Then turn it back on
    resp = await client.patch(
        f"{BASE}/settings",
        json={"betaModeEnabled": True},
        cookies=superadmin_cookies,
        headers=csrf_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["betaModeEnabled"] is True


@pytest.mark.asyncio
async def test_toggle_beta_mode_forbidden_for_regular_user(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    csrf_headers: dict[str, str],
) -> None:
    resp = await client.patch(
        f"{BASE}/settings",
        json={"betaModeEnabled": False},
        cookies=auth_cookies,
        headers=csrf_headers,
    )
    assert resp.status_code == 403


# ── GET /admin/beta-users ───────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_list_beta_users(
    client: AsyncClient,
    superadmin_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_superadmin: User,
    pending_beta_user: User,
) -> None:
    resp = await client.get(
        f"{BASE}/beta-users",
        cookies=superadmin_cookies,
        headers=csrf_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 1
    emails = [u["email"] for u in data["items"]]
    assert pending_beta_user.email in emails


@pytest.mark.asyncio
async def test_list_beta_users_filter_by_status(
    client: AsyncClient,
    superadmin_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_superadmin: User,
    pending_beta_user: User,
    rejected_beta_user: User,
) -> None:
    """Filter by status=pending should only return pending users."""
    resp = await client.get(
        f"{BASE}/beta-users?status=pending",
        cookies=superadmin_cookies,
        headers=csrf_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    statuses = [u["betaStatus"] for u in data["items"]]
    assert all(s == "pending" for s in statuses)
    assert pending_beta_user.email in [u["email"] for u in data["items"]]


@pytest.mark.asyncio
async def test_list_beta_users_forbidden_for_regular_user(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    csrf_headers: dict[str, str],
) -> None:
    resp = await client.get(
        f"{BASE}/beta-users",
        cookies=auth_cookies,
        headers=csrf_headers,
    )
    assert resp.status_code == 403


# ── POST /admin/beta-users/{id}/approve ──────────────────────────────────────


@pytest.mark.asyncio
async def test_approve_beta_user(
    client: AsyncClient,
    superadmin_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_superadmin: User,
    pending_beta_user: User,
) -> None:
    resp = await client.post(
        f"{BASE}/beta-users/{pending_beta_user.id}/approve",
        cookies=superadmin_cookies,
        headers=csrf_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["betaStatus"] == "approved"
    assert data["email"] == pending_beta_user.email


@pytest.mark.asyncio
async def test_approve_non_beta_user_fails(
    client: AsyncClient,
    superadmin_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_superadmin: User,
    test_user: User,
) -> None:
    """Approving a non-beta user (beta_status=none) should return 400."""
    resp = await client.post(
        f"{BASE}/beta-users/{test_user.id}/approve",
        cookies=superadmin_cookies,
        headers=csrf_headers,
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_approve_nonexistent_user(
    client: AsyncClient,
    superadmin_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_superadmin: User,
) -> None:
    resp = await client.post(
        f"{BASE}/beta-users/00000000-0000-0000-0000-000000000000/approve",
        cookies=superadmin_cookies,
        headers=csrf_headers,
    )
    assert resp.status_code == 404


# ── POST /admin/beta-users/{id}/reject ───────────────────────────────────────


@pytest.mark.asyncio
async def test_reject_beta_user(
    client: AsyncClient,
    superadmin_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_superadmin: User,
    pending_beta_user: User,
) -> None:
    resp = await client.post(
        f"{BASE}/beta-users/{pending_beta_user.id}/reject",
        cookies=superadmin_cookies,
        headers=csrf_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["betaStatus"] == "rejected"


@pytest.mark.asyncio
async def test_reject_non_beta_user_fails(
    client: AsyncClient,
    superadmin_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_superadmin: User,
    test_user: User,
) -> None:
    resp = await client.post(
        f"{BASE}/beta-users/{test_user.id}/reject",
        cookies=superadmin_cookies,
        headers=csrf_headers,
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_reject_nonexistent_user(
    client: AsyncClient,
    superadmin_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_superadmin: User,
) -> None:
    resp = await client.post(
        f"{BASE}/beta-users/00000000-0000-0000-0000-000000000000/reject",
        cookies=superadmin_cookies,
        headers=csrf_headers,
    )
    assert resp.status_code == 404


# ── Approve then login ──────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_approved_user_can_login(
    client: AsyncClient,
    superadmin_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_superadmin: User,
    pending_beta_user: User,
) -> None:
    """After admin approves a pending user, they should be able to login."""
    # Approve
    approve_resp = await client.post(
        f"{BASE}/beta-users/{pending_beta_user.id}/approve",
        cookies=superadmin_cookies,
        headers=csrf_headers,
    )
    assert approve_resp.status_code == 200

    # Now login
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": pending_beta_user.email, "password": "BetaPass123!"},
    )
    assert login_resp.status_code == 200
    assert login_resp.json()["email"] == pending_beta_user.email


# ── Stats include pending count ──────────────────────────────────────────────


@pytest.mark.asyncio
async def test_stats_include_pending_beta_count(
    client: AsyncClient,
    superadmin_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    test_superadmin: User,
    pending_beta_user: User,
) -> None:
    resp = await client.get(
        f"{BASE}/stats",
        cookies=superadmin_cookies,
        headers=csrf_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "pendingBetaCount" in data
    assert data["pendingBetaCount"] >= 1
