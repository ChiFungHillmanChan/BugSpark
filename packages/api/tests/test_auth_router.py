from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.services.auth_service import create_refresh_token


BASE = "/api/v1/auth"


async def test_register_success(client: AsyncClient):
    response = await client.post(
        f"{BASE}/register",
        json={
            "email": "newuser@example.com",
            "password": "StrongPass123!",
            "name": "New User",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "accessToken" in data
    assert "refreshToken" in data
    assert data["user"]["email"] == "newuser@example.com"
    assert data["tokenType"] == "bearer"


async def test_register_duplicate_email(
    client: AsyncClient, test_user: User
):
    response = await client.post(
        f"{BASE}/register",
        json={
            "email": test_user.email,
            "password": "AnotherPass456!",
            "name": "Duplicate User",
        },
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()


async def test_login_success(client: AsyncClient, test_user: User):
    response = await client.post(
        f"{BASE}/login",
        json={"email": test_user.email, "password": "TestPassword123!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "accessToken" in data
    assert data["user"]["email"] == test_user.email


async def test_login_wrong_password(client: AsyncClient, test_user: User):
    response = await client.post(
        f"{BASE}/login",
        json={"email": test_user.email, "password": "WrongPassword"},
    )
    assert response.status_code == 401
    assert "invalid" in response.json()["detail"].lower()


async def test_login_nonexistent_user(client: AsyncClient):
    response = await client.post(
        f"{BASE}/login",
        json={"email": "nobody@example.com", "password": "Anything"},
    )
    assert response.status_code == 401


async def test_refresh_token_success(
    client: AsyncClient, test_user: User
):
    refresh_token = create_refresh_token(str(test_user.id))
    response = await client.post(
        f"{BASE}/refresh",
        json={"refresh_token": refresh_token},
    )
    assert response.status_code == 200
    data = response.json()
    assert "accessToken" in data
    assert "refreshToken" in data


async def test_refresh_token_invalid(client: AsyncClient):
    response = await client.post(
        f"{BASE}/refresh",
        json={"refresh_token": "invalid-token-string"},
    )
    assert response.status_code == 401


async def test_get_me_authenticated(
    client: AsyncClient, test_user: User, auth_headers: dict[str, str]
):
    response = await client.get(f"{BASE}/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user.email
    assert data["name"] == test_user.name


async def test_get_me_unauthenticated(client: AsyncClient):
    response = await client.get(f"{BASE}/me")
    assert response.status_code == 422  # Missing required header
