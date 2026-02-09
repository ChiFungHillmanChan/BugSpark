from __future__ import annotations

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.services.auth_service import create_refresh_token, generate_jti


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
    assert data["email"] == "newuser@example.com"
    assert data["name"] == "New User"
    assert "bugspark_access_token" in response.cookies
    assert "bugspark_csrf_token" in response.cookies


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
    assert data["email"] == test_user.email
    assert "bugspark_access_token" in response.cookies
    assert "bugspark_csrf_token" in response.cookies


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
    client: AsyncClient, test_user: User, db_session: AsyncSession
):
    jti = generate_jti()
    test_user.refresh_token_jti = jti
    await db_session.commit()

    refresh_token = create_refresh_token(str(test_user.id), jti)
    response = await client.post(
        f"{BASE}/refresh",
        cookies={"bugspark_refresh_token": refresh_token},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user.email
    assert "bugspark_access_token" in response.cookies


async def test_refresh_token_invalid(client: AsyncClient):
    response = await client.post(
        f"{BASE}/refresh",
        cookies={"bugspark_refresh_token": "invalid-token-string"},
    )
    assert response.status_code == 401


async def test_get_me_authenticated(
    client: AsyncClient, test_user: User, auth_cookies: dict[str, str]
):
    response = await client.get(f"{BASE}/me", cookies=auth_cookies)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user.email
    assert data["name"] == test_user.name


async def test_get_me_unauthenticated(client: AsyncClient):
    response = await client.get(f"{BASE}/me")
    assert response.status_code == 401


async def test_logout(client: AsyncClient, auth_cookies: dict[str, str], csrf_headers: dict[str, str]):
    response = await client.post(f"{BASE}/logout", cookies=auth_cookies, headers=csrf_headers)
    assert response.status_code == 200
    assert response.json()["detail"] == "Logged out"
