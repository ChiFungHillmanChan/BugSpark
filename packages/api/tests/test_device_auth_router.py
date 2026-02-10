"""End-to-end tests for the device auth flow (RFC 8628 device code grant)."""

from __future__ import annotations

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


BASE = "/api/v1/auth/device"


# ── Step 1: Request device code ────────────────────────────────────────


async def test_request_device_code(client: AsyncClient):
    response = await client.post(f"{BASE}/code", json={})
    assert response.status_code == 200

    data = response.json()
    assert "device_code" in data
    assert "user_code" in data
    assert "verification_url" in data
    assert data["expires_in"] > 0
    assert data["interval"] > 0

    # user_code should be in XXXX-XXXX format
    assert len(data["user_code"]) == 9
    assert data["user_code"][4] == "-"


# ── Step 2: Approve device ────────────────────────────────────────────


async def test_approve_device_unauthenticated(client: AsyncClient):
    """Unauthenticated users cannot approve a device code."""
    code_resp = await client.post(f"{BASE}/code", json={})
    user_code = code_resp.json()["user_code"]

    response = await client.post(f"{BASE}/approve", json={"user_code": user_code})
    assert response.status_code == 401


async def test_approve_device_invalid_code(
    client: AsyncClient, test_user: User, auth_cookies: dict, csrf_headers: dict,
):
    """Approving with a non-existent user code returns 400."""
    response = await client.post(
        f"{BASE}/approve",
        json={"user_code": "ZZZZ-ZZZZ"},
        cookies=auth_cookies,
        headers=csrf_headers,
    )
    assert response.status_code == 400


async def test_approve_device_success(
    client: AsyncClient, test_user: User, auth_cookies: dict, csrf_headers: dict,
):
    """Authenticated user approves a device code successfully."""
    code_resp = await client.post(f"{BASE}/code", json={})
    user_code = code_resp.json()["user_code"]

    response = await client.post(
        f"{BASE}/approve",
        json={"user_code": user_code},
        cookies=auth_cookies,
        headers=csrf_headers,
    )
    assert response.status_code == 200
    assert response.json()["approved"] is True


# ── Step 3: Poll for token ─────────────────────────────────────────────


async def test_poll_token_pending(client: AsyncClient):
    """Polling before approval returns 401 (authorization_pending)."""
    code_resp = await client.post(f"{BASE}/code", json={})
    device_code = code_resp.json()["device_code"]

    response = await client.post(f"{BASE}/token", json={"device_code": device_code})
    assert response.status_code == 401


async def test_poll_token_invalid_device_code(client: AsyncClient):
    """Polling with a non-existent device code returns 400."""
    response = await client.post(
        f"{BASE}/token",
        json={"device_code": "nonexistent-device-code"},
    )
    assert response.status_code == 400


# ── Full E2E flow ──────────────────────────────────────────────────────


async def test_full_device_auth_flow(
    client: AsyncClient, test_user: User, auth_cookies: dict, csrf_headers: dict,
):
    """
    Complete flow: CLI requests code -> user approves -> CLI polls and gets token.
    Simulates the full unauthenticated CLI -> login -> approve -> receive PAT flow.
    """
    # 1. CLI requests a device code (unauthenticated)
    code_resp = await client.post(f"{BASE}/code", json={})
    assert code_resp.status_code == 200
    code_data = code_resp.json()
    device_code = code_data["device_code"]
    user_code = code_data["user_code"]

    # 2. CLI polls — should be pending
    poll_resp = await client.post(f"{BASE}/token", json={"device_code": device_code})
    assert poll_resp.status_code == 401  # authorization_pending

    # 3. User logs in on the dashboard and approves
    approve_resp = await client.post(
        f"{BASE}/approve",
        json={"user_code": user_code},
        cookies=auth_cookies,
        headers=csrf_headers,
    )
    assert approve_resp.status_code == 200
    assert approve_resp.json()["approved"] is True

    # 4. CLI polls again — should get the token
    token_resp = await client.post(f"{BASE}/token", json={"device_code": device_code})
    assert token_resp.status_code == 200

    token_data = token_resp.json()
    assert "access_token" in token_data
    assert token_data["access_token"].startswith("bsk_pat_")
    assert token_data["token_type"] == "bearer"
    assert token_data["user"]["email"] == test_user.email
    assert token_data["user"]["name"] == test_user.name

    # 5. The PAT actually works — verify by calling /auth/me
    me_resp = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token_data['access_token']}"},
    )
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == test_user.email

    # 6. Token is consumed — second poll should fail
    second_poll = await client.post(f"{BASE}/token", json={"device_code": device_code})
    assert second_poll.status_code == 400  # consumed / invalid


async def test_device_code_double_approve_fails(
    client: AsyncClient, test_user: User, auth_cookies: dict, csrf_headers: dict,
):
    """Approving the same code twice should fail on the second attempt."""
    code_resp = await client.post(f"{BASE}/code", json={})
    user_code = code_resp.json()["user_code"]

    # First approve
    resp1 = await client.post(
        f"{BASE}/approve",
        json={"user_code": user_code},
        cookies=auth_cookies,
        headers=csrf_headers,
    )
    assert resp1.status_code == 200

    # Second approve — code is no longer pending
    resp2 = await client.post(
        f"{BASE}/approve",
        json={"user_code": user_code},
        cookies=auth_cookies,
        headers=csrf_headers,
    )
    assert resp2.status_code == 400
