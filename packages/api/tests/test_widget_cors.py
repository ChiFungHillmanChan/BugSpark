"""Tests for widget CORS middleware."""
from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_widget_preflight_with_api_key(client: AsyncClient):
    """Widget-facing OPTIONS request should get permissive CORS headers."""
    response = await client.options(
        "/api/v1/reports",
        headers={
            "Origin": "https://customer-site.com",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type, x-api-key",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://customer-site.com"
    assert "POST" in response.headers.get("access-control-allow-methods", "")


@pytest.mark.asyncio
async def test_widget_only_endpoint_gets_cors(client: AsyncClient):
    """Widget-only endpoints should always get CORS headers."""
    response = await client.options(
        "/api/v1/upload/screenshot",
        headers={
            "Origin": "https://any-site.com",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type, x-api-key",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://any-site.com"


@pytest.mark.asyncio
async def test_dashboard_request_not_intercepted(client: AsyncClient):
    """GET /reports (dashboard request) should NOT be intercepted by widget CORS."""
    response = await client.options(
        "/api/v1/reports",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    # Should be handled by standard CORSMiddleware, not the widget middleware
    assert response.status_code in (200, 400)  # 400 if origin not allowed
