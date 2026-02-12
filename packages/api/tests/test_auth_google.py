"""Tests for Google OAuth authentication endpoints."""
from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.models.user import User


@pytest.mark.asyncio
class TestGoogleAuthStatus:
    async def test_status_returns_disabled_by_default(self, client: AsyncClient):
        response = await client.get("/api/v1/auth/google/status")
        assert response.status_code == 200
        assert response.json() == {"enabled": False}

    async def test_status_returns_enabled_when_configured(self, client: AsyncClient, monkeypatch):
        monkeypatch.setenv("ENABLE_GOOGLE_AUTH", "true")
        monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-client-id")
        monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "test-secret")
        monkeypatch.setenv("API_PUBLIC_URL", "http://test")
        from app.config import get_settings
        get_settings.cache_clear()
        response = await client.get("/api/v1/auth/google/status")
        assert response.status_code == 200
        assert response.json() == {"enabled": True}


@pytest.mark.asyncio
class TestGoogleAuthLogin:
    async def test_login_returns_400_when_disabled(self, client: AsyncClient):
        response = await client.get(
            "/api/v1/auth/google/login",
            follow_redirects=False,
        )
        assert response.status_code == 400

    async def test_login_redirects_to_google_when_enabled(self, client: AsyncClient, monkeypatch):
        monkeypatch.setenv("ENABLE_GOOGLE_AUTH", "true")
        monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-client-id")
        monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "test-secret")
        monkeypatch.setenv("API_PUBLIC_URL", "http://test")
        from app.config import get_settings
        get_settings.cache_clear()
        response = await client.get(
            "/api/v1/auth/google/login",
            follow_redirects=False,
        )
        assert response.status_code == 302
        assert "accounts.google.com" in response.headers["location"]


@pytest.mark.asyncio
class TestGoogleAuthUnlink:
    async def test_unlink_fails_when_not_linked(
        self, client: AsyncClient, auth_cookies: dict, csrf_headers: dict, test_user: User
    ):
        response = await client.delete(
            "/api/v1/auth/google/link",
            cookies=auth_cookies,
            headers=csrf_headers,
        )
        assert response.status_code == 400

    async def test_unlink_fails_when_no_password(
        self, client: AsyncClient, google_oauth_cookies: dict, csrf_headers: dict, google_oauth_user: User
    ):
        response = await client.delete(
            "/api/v1/auth/google/link",
            cookies=google_oauth_cookies,
            headers=csrf_headers,
        )
        assert response.status_code == 400

    async def test_unlink_succeeds_with_password_and_google_id(
        self, client: AsyncClient, auth_cookies: dict, csrf_headers: dict,
        test_user: User, db_session,
    ):
        # Give test_user a google_id
        test_user.google_id = "google_test_123"
        await db_session.commit()

        response = await client.delete(
            "/api/v1/auth/google/link",
            cookies=auth_cookies,
            headers=csrf_headers,
        )
        assert response.status_code == 200
        await db_session.refresh(test_user)
        assert test_user.google_id is None


@pytest.mark.asyncio
class TestSetPassword:
    async def test_set_password_for_oauth_user(
        self, client: AsyncClient, google_oauth_cookies: dict, csrf_headers: dict, google_oauth_user: User, db_session
    ):
        response = await client.post(
            "/api/v1/auth/me/password",
            json={"new_password": "MyNewPass123!"},
            cookies=google_oauth_cookies,
            headers=csrf_headers,
        )
        assert response.status_code == 200
        await db_session.refresh(google_oauth_user)
        assert google_oauth_user.hashed_password is not None

    async def test_set_password_fails_when_already_has_password(
        self, client: AsyncClient, auth_cookies: dict, csrf_headers: dict, test_user: User
    ):
        response = await client.post(
            "/api/v1/auth/me/password",
            json={"new_password": "AnotherPass123!"},
            cookies=auth_cookies,
            headers=csrf_headers,
        )
        assert response.status_code == 400
