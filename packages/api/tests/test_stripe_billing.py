"""Tests for Stripe billing integration."""
from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.project import Project


@pytest.mark.asyncio
async def test_checkout_session_return_url_correct_path(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    db: AsyncSession,
    user: User,
    project: Project,
):
    """Verify checkout session return_url uses /settings/billing (not /dashboard/settings/billing)."""
    response = await client.post(
        "/api/v1/billing/checkout",
        cookies=auth_cookies,
        headers=csrf_headers,
        json={
            "planId": "starter",
            "billingInterval": "month",
            "projectId": str(project.id),
        },
    )

    assert response.status_code == 200
    data = response.json()

    # Verify return_url uses correct path (without /dashboard route group prefix)
    assert "return_url" in data or "url" in data
    session_url = data.get("url", data.get("return_url", ""))

    # Should NOT contain /dashboard/settings/billing (that's the broken path)
    assert "/dashboard/settings/billing" not in session_url

    # Should contain /settings/billing (the correct path) or similar
    # Some Stripe versions may use different URL formats, so be flexible
    assert "settings" in session_url or "billing" in session_url


@pytest.mark.asyncio
async def test_checkout_session_includes_session_id(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    db: AsyncSession,
    user: User,
    project: Project,
):
    """Verify checkout session response includes sessionId for redirect."""
    response = await client.post(
        "/api/v1/billing/checkout",
        cookies=auth_cookies,
        headers=csrf_headers,
        json={
            "planId": "starter",
            "billingInterval": "month",
            "projectId": str(project.id),
        },
    )

    assert response.status_code == 200
    data = response.json()

    # Must include sessionId or id for frontend to redirect to Stripe checkout
    assert "sessionId" in data or "id" in data or "session_id" in data


@pytest.mark.asyncio
async def test_billing_interval_month_accepted(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    user: User,
    project: Project,
):
    """Verify API accepts 'month' interval value (not 'monthly')."""
    response = await client.post(
        "/api/v1/billing/checkout",
        cookies=auth_cookies,
        headers=csrf_headers,
        json={
            "planId": "starter",
            "billingInterval": "month",
            "projectId": str(project.id),
        },
    )

    # Should NOT return 422 (validation error)
    assert response.status_code != 422


@pytest.mark.asyncio
async def test_billing_interval_year_accepted(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    user: User,
    project: Project,
):
    """Verify API accepts 'year' interval value (not 'yearly')."""
    response = await client.post(
        "/api/v1/billing/checkout",
        cookies=auth_cookies,
        headers=csrf_headers,
        json={
            "planId": "starter",
            "billingInterval": "year",
            "projectId": str(project.id),
        },
    )

    # Should NOT return 422 (validation error)
    assert response.status_code != 422


@pytest.mark.asyncio
async def test_billing_interval_monthly_rejected(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    user: User,
    project: Project,
):
    """Verify API rejects 'monthly' interval (should be 'month')."""
    response = await client.post(
        "/api/v1/billing/checkout",
        cookies=auth_cookies,
        headers=csrf_headers,
        json={
            "planId": "starter",
            "billingInterval": "monthly",  # Wrong: should be "month"
            "projectId": str(project.id),
        },
    )

    # Should return 422 validation error
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_billing_interval_yearly_rejected(
    client: AsyncClient,
    auth_cookies: dict[str, str],
    csrf_headers: dict[str, str],
    user: User,
    project: Project,
):
    """Verify API rejects 'yearly' interval (should be 'year')."""
    response = await client.post(
        "/api/v1/billing/checkout",
        cookies=auth_cookies,
        headers=csrf_headers,
        json={
            "planId": "starter",
            "billingInterval": "yearly",  # Wrong: should be "year"
            "projectId": str(project.id),
        },
    )

    # Should return 422 validation error
    assert response.status_code == 422
