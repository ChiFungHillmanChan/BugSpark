"""Tests for security headers middleware."""
from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_x_content_type_options(client: AsyncClient):
    response = await client.get("/health")
    assert response.headers.get("x-content-type-options") == "nosniff"


@pytest.mark.asyncio
async def test_x_frame_options(client: AsyncClient):
    response = await client.get("/health")
    assert response.headers.get("x-frame-options") == "DENY"


@pytest.mark.asyncio
async def test_referrer_policy(client: AsyncClient):
    response = await client.get("/health")
    assert response.headers.get("referrer-policy") == "strict-origin-when-cross-origin"


@pytest.mark.asyncio
async def test_permissions_policy(client: AsyncClient):
    response = await client.get("/health")
    assert "camera=()" in response.headers.get("permissions-policy", "")


@pytest.mark.asyncio
async def test_content_security_policy_present(client: AsyncClient):
    response = await client.get("/health")
    csp = response.headers.get("content-security-policy", "")
    assert "default-src 'self'" in csp
    assert "script-src" in csp
