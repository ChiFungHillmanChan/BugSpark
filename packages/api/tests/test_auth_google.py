"""Tests for Google OAuth authentication endpoints."""
from __future__ import annotations

import base64
import json
import secrets
from dataclasses import dataclass
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

from app.models.app_settings import AppSettings
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


@dataclass(frozen=True)
class _GoogleUserStub:
    """Lightweight stand-in for GoogleUserInfo (avoids google-auth dependency)."""

    google_id: str
    email: str
    name: str
    is_email_verified: bool


def _enable_google_auth(monkeypatch: pytest.MonkeyPatch) -> None:
    """Enable Google OAuth settings for callback tests."""
    monkeypatch.setenv("ENABLE_GOOGLE_AUTH", "true")
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-client-id")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "test-secret")
    monkeypatch.setenv("API_PUBLIC_URL", "http://test")
    monkeypatch.setenv("FRONTEND_URL", "http://localhost:3000")
    from app.config import get_settings
    get_settings.cache_clear()


def _build_callback_params() -> tuple[str, str]:
    """Build a valid state string and its CSRF token for callback tests."""
    csrf_token = secrets.token_hex(32)
    payload = json.dumps({"csrf": csrf_token, "redirect": "/dashboard", "mode": "login"})
    state = base64.urlsafe_b64encode(payload.encode()).decode()
    return state, csrf_token


MOCK_GOOGLE_USER = _GoogleUserStub(
    google_id="google_new_999",
    email="newgoogleuser@gmail.com",
    name="New Google User",
    is_email_verified=True,
)


@pytest.mark.asyncio
class TestGoogleOAuthBetaFlow:
    """Test Google OAuth callback behaviour under different beta mode states."""

    async def test_new_user_beta_on_redirects_to_waiting_list(
        self, client: AsyncClient, monkeypatch, beta_mode_on: AppSettings,
    ):
        """New Google user in beta mode should redirect to the waiting list page."""
        _enable_google_auth(monkeypatch)
        state, csrf_token = _build_callback_params()

        with patch(
            "app.routers.auth_google.exchange_code_for_user_info",
            new_callable=AsyncMock,
            return_value=MOCK_GOOGLE_USER,
        ):
            response = await client.get(
                "/api/v1/auth/google/callback",
                params={"code": "fake-code", "state": state},
                cookies={"bugspark_google_oauth_state": csrf_token},
                follow_redirects=False,
            )

        assert response.status_code == 302
        location = response.headers["location"]
        assert "/register/beta" in location
        assert "status=pending" in location
        assert "provider=google" in location

    async def test_existing_pending_user_redirects_to_login_error(
        self, client: AsyncClient, monkeypatch, beta_mode_on: AppSettings,
        pending_beta_user: User,
    ):
        """Existing user with PENDING beta status should get error on login page."""
        _enable_google_auth(monkeypatch)
        state, csrf_token = _build_callback_params()

        existing_user_info = _GoogleUserStub(
            google_id="google_pending_123",
            email=pending_beta_user.email,
            name=pending_beta_user.name,
            is_email_verified=True,
        )

        with patch(
            "app.routers.auth_google.exchange_code_for_user_info",
            new_callable=AsyncMock,
            return_value=existing_user_info,
        ):
            response = await client.get(
                "/api/v1/auth/google/callback",
                params={"code": "fake-code", "state": state},
                cookies={"bugspark_google_oauth_state": csrf_token},
                follow_redirects=False,
            )

        assert response.status_code == 302
        location = response.headers["location"]
        assert "/login" in location
        assert "error=beta_pending" in location

    async def test_new_user_beta_off_auto_registers_and_logs_in(
        self, client: AsyncClient, monkeypatch, beta_mode_off: AppSettings,
    ):
        """New user when beta is off should auto-register and redirect to dashboard."""
        _enable_google_auth(monkeypatch)
        state, csrf_token = _build_callback_params()

        with patch(
            "app.routers.auth_google.exchange_code_for_user_info",
            new_callable=AsyncMock,
            return_value=MOCK_GOOGLE_USER,
        ):
            response = await client.get(
                "/api/v1/auth/google/callback",
                params={"code": "fake-code", "state": state},
                cookies={"bugspark_google_oauth_state": csrf_token},
                follow_redirects=False,
            )

        assert response.status_code == 302
        location = response.headers["location"]
        assert "/dashboard" in location
        assert "error" not in location
