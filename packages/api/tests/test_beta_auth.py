"""Tests for beta mode authentication flows.

Covers:
- Registration when beta mode is ON vs OFF
- Login blocked for pending/rejected beta users
- Login allowed for approved beta users
- GET /auth/beta-mode public endpoint
- CLI register/login beta flows
"""
from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.models.app_settings import AppSettings
from app.models.user import User


BASE = "/api/v1/auth"


# ── GET /auth/beta-mode ─────────────────────────────────────────────────────


async def test_beta_mode_endpoint_returns_true_by_default(client: AsyncClient):
    """When no AppSettings row exists, beta mode defaults to True."""
    resp = await client.get(f"{BASE}/beta-mode")
    assert resp.status_code == 200
    assert resp.json()["betaModeEnabled"] is True


async def test_beta_mode_endpoint_returns_false_when_off(
    client: AsyncClient, beta_mode_off: AppSettings
):
    resp = await client.get(f"{BASE}/beta-mode")
    assert resp.status_code == 200
    assert resp.json()["betaModeEnabled"] is False


async def test_beta_mode_endpoint_returns_true_when_on(
    client: AsyncClient, beta_mode_on: AppSettings
):
    resp = await client.get(f"{BASE}/beta-mode")
    assert resp.status_code == 200
    assert resp.json()["betaModeEnabled"] is True


# ── Registration with beta mode ON ──────────────────────────────────────────


async def test_register_beta_mode_on_returns_pending(
    client: AsyncClient, beta_mode_on: AppSettings
):
    """When beta mode is ON, /register returns 201 with beta pending status."""
    resp = await client.post(
        f"{BASE}/register",
        json={
            "email": "betanew@example.com",
            "password": "StrongPass123!",
            "name": "Beta New",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["betaStatus"] == "pending"
    assert "message" in data
    # Should NOT set auth cookies (user is not yet approved)
    assert "bugspark_access_token" not in resp.cookies


async def test_register_beta_mode_off_returns_user(
    client: AsyncClient, beta_mode_off: AppSettings
):
    """When beta mode is OFF, /register returns 200 with user data + cookies."""
    resp = await client.post(
        f"{BASE}/register",
        json={
            "email": "normalnew@example.com",
            "password": "StrongPass123!",
            "name": "Normal New",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "normalnew@example.com"
    assert "bugspark_access_token" in resp.cookies


# ── Login with beta users ───────────────────────────────────────────────────


async def test_login_pending_beta_user_blocked(
    client: AsyncClient, pending_beta_user: User
):
    """Pending beta users cannot login – get 403 with code beta.waiting_list."""
    resp = await client.post(
        f"{BASE}/login",
        json={"email": pending_beta_user.email, "password": "BetaPass123!"},
    )
    assert resp.status_code == 403
    data = resp.json()
    assert data["code"] == "beta.waiting_list"


async def test_login_rejected_beta_user_blocked(
    client: AsyncClient, rejected_beta_user: User
):
    """Rejected beta users cannot login – get 403 with code beta.rejected."""
    resp = await client.post(
        f"{BASE}/login",
        json={"email": rejected_beta_user.email, "password": "BetaPass123!"},
    )
    assert resp.status_code == 403
    data = resp.json()
    assert data["code"] == "beta.rejected"


async def test_login_approved_beta_user_allowed(
    client: AsyncClient, approved_beta_user: User
):
    """Approved beta users can login normally."""
    resp = await client.post(
        f"{BASE}/login",
        json={"email": approved_beta_user.email, "password": "BetaPass123!"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == approved_beta_user.email
    assert "bugspark_access_token" in resp.cookies


async def test_login_normal_user_unaffected(
    client: AsyncClient, test_user: User
):
    """A normal user (beta_status=none) can login regardless of beta mode."""
    resp = await client.post(
        f"{BASE}/login",
        json={"email": test_user.email, "password": "TestPassword123!"},
    )
    assert resp.status_code == 200


# ── CLI register with beta mode ─────────────────────────────────────────────


async def test_cli_register_beta_mode_on(
    client: AsyncClient, beta_mode_on: AppSettings
):
    """CLI /cli/register with beta mode ON returns 201 with beta pending."""
    resp = await client.post(
        f"{BASE}/cli/register",
        json={
            "email": "clibeta@example.com",
            "password": "StrongPass123!",
            "name": "CLI Beta",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["betaStatus"] == "pending"


async def test_cli_register_beta_mode_off(
    client: AsyncClient, beta_mode_off: AppSettings
):
    """CLI /cli/register with beta mode OFF returns user + PAT."""
    resp = await client.post(
        f"{BASE}/cli/register",
        json={
            "email": "clinormal@example.com",
            "password": "StrongPass123!",
            "name": "CLI Normal",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "token" in data
    assert data["email"] == "clinormal@example.com"


# ── CLI login with beta users ───────────────────────────────────────────────


async def test_cli_login_pending_beta_blocked(
    client: AsyncClient, pending_beta_user: User
):
    """CLI login for pending beta user returns 403."""
    resp = await client.post(
        f"{BASE}/cli/login",
        json={"email": pending_beta_user.email, "password": "BetaPass123!"},
    )
    assert resp.status_code == 403
    assert resp.json()["code"] == "beta.waiting_list"


async def test_cli_login_rejected_beta_blocked(
    client: AsyncClient, rejected_beta_user: User
):
    """CLI login for rejected beta user returns 403."""
    resp = await client.post(
        f"{BASE}/cli/login",
        json={"email": rejected_beta_user.email, "password": "BetaPass123!"},
    )
    assert resp.status_code == 403
    assert resp.json()["code"] == "beta.rejected"


# ── Explicit beta registration endpoint ─────────────────────────────────────


async def test_register_beta_explicit_endpoint(client: AsyncClient):
    """/register/beta creates a pending beta user regardless of beta mode."""
    resp = await client.post(
        f"{BASE}/register/beta",
        json={
            "email": "explicitbeta@example.com",
            "password": "StrongPass123!",
            "name": "Explicit Beta",
            "reason": "I want to test new features",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["betaStatus"] == "pending"
    assert "message" in data


async def test_register_beta_duplicate_email(
    client: AsyncClient, test_user: User
):
    """/register/beta with existing email returns 400."""
    resp = await client.post(
        f"{BASE}/register/beta",
        json={
            "email": test_user.email,
            "password": "StrongPass123!",
            "name": "Duplicate",
        },
    )
    assert resp.status_code == 400
