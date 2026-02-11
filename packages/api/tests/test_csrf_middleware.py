"""Tests for CSRF double-submit cookie middleware."""
from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.models.user import User


CSRF_TOKEN = "test-csrf-token"


@pytest.mark.asyncio
async def test_safe_methods_bypass_csrf(client: AsyncClient):
    """GET requests should not require CSRF tokens."""
    response = await client.get("/health")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_api_key_requests_bypass_csrf(client: AsyncClient):
    """Requests with X-API-Key header bypass CSRF check."""
    response = await client.post(
        "/api/v1/reports",
        headers={"X-API-Key": "fake-key"},
        json={"title": "test"},
    )
    # Should fail on auth, not CSRF
    assert response.status_code != 403 or "CSRF" not in response.text


@pytest.mark.asyncio
async def test_bearer_token_bypasses_csrf(client: AsyncClient):
    """Requests with Bearer token bypass CSRF check."""
    response = await client.post(
        "/api/v1/auth/tokens",
        headers={"Authorization": "Bearer bsk_pat_fake_token"},
        json={"name": "test"},
    )
    # Should fail on auth, not CSRF
    assert response.status_code != 403 or "CSRF" not in response.text


@pytest.mark.asyncio
async def test_csrf_exempt_paths(client: AsyncClient):
    """Login and register paths should be CSRF-exempt."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "test@test.com", "password": "pass"},
    )
    # Should fail on auth, not CSRF
    assert response.status_code != 403 or "CSRF" not in response.text


@pytest.mark.asyncio
async def test_csrf_required_for_cookie_auth(
    client: AsyncClient, auth_cookies: dict[str, str], csrf_headers: dict[str, str]
):
    """Cookie-authenticated POST without CSRF token should return 403."""
    response = await client.patch(
        "/api/v1/auth/me",
        cookies=auth_cookies,
        # No CSRF header
        json={"name": "Updated"},
    )
    assert response.status_code == 403
    assert "CSRF" in response.json().get("detail", "")


@pytest.mark.asyncio
async def test_csrf_mismatch_rejected(
    client: AsyncClient, auth_cookies: dict[str, str]
):
    """Cookie-authenticated POST with mismatched CSRF token should return 403."""
    response = await client.patch(
        "/api/v1/auth/me",
        cookies=auth_cookies,
        headers={"X-CSRF-Token": "wrong-token"},
        json={"name": "Updated"},
    )
    assert response.status_code == 403
    assert "CSRF" in response.json().get("detail", "")


@pytest.mark.asyncio
async def test_csrf_valid_passes(
    client: AsyncClient, auth_cookies: dict[str, str], csrf_headers: dict[str, str]
):
    """Valid CSRF token should pass."""
    response = await client.patch(
        "/api/v1/auth/me",
        cookies=auth_cookies,
        headers=csrf_headers,
        json={"name": "Updated Name"},
    )
    assert response.status_code == 200
