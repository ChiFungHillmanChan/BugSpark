"""Tests for Linear integration service."""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.exceptions import BadRequestException
from app.services.linear_integration import create_linear_issue


@pytest.mark.asyncio
async def test_create_linear_issue_success():
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "data": {
            "issueCreate": {
                "success": True,
                "issue": {
                    "id": "issue-uuid-123",
                    "identifier": "ENG-42",
                    "url": "https://linear.app/team/issue/ENG-42",
                    "title": "Test Issue",
                },
            }
        }
    }

    mock_client = AsyncMock()
    mock_client.post.return_value = mock_response
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("app.services.linear_integration.httpx.AsyncClient", return_value=mock_client):
        result = await create_linear_issue(
            api_key="lin_api_test",
            team_id="team-123",
            title="[BUG-001] Test Bug",
            description="Description of the bug",
            priority=2,
        )

    assert result["issue_url"] == "https://linear.app/team/issue/ENG-42"
    assert result["issue_identifier"] == "ENG-42"
    assert result["issue_id"] == "issue-uuid-123"


@pytest.mark.asyncio
async def test_create_linear_issue_api_error():
    mock_response = MagicMock()
    mock_response.status_code = 401
    mock_response.text = "Unauthorized"

    mock_client = AsyncMock()
    mock_client.post.return_value = mock_response
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("app.services.linear_integration.httpx.AsyncClient", return_value=mock_client):
        with pytest.raises(BadRequestException, match="Linear API error"):
            await create_linear_issue(
                api_key="bad_key",
                team_id="team-123",
                title="Test",
                description="Desc",
            )


@pytest.mark.asyncio
async def test_create_linear_issue_graphql_error():
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "errors": [{"message": "Team not found"}]
    }

    mock_client = AsyncMock()
    mock_client.post.return_value = mock_response
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("app.services.linear_integration.httpx.AsyncClient", return_value=mock_client):
        with pytest.raises(BadRequestException, match="Team not found"):
            await create_linear_issue(
                api_key="lin_api_test",
                team_id="bad-team",
                title="Test",
                description="Desc",
            )


@pytest.mark.asyncio
async def test_create_linear_issue_no_labels_in_mutation():
    """Verify labelIds is NOT sent to Linear API (removed in fix)."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "data": {
            "issueCreate": {
                "success": True,
                "issue": {
                    "id": "id",
                    "identifier": "ENG-1",
                    "url": "https://linear.app/issue/ENG-1",
                    "title": "Test",
                },
            }
        }
    }

    mock_client = AsyncMock()
    mock_client.post.return_value = mock_response
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("app.services.linear_integration.httpx.AsyncClient", return_value=mock_client):
        await create_linear_issue(
            api_key="key",
            team_id="team",
            title="Title",
            description="Desc",
            priority=3,
        )

    # Inspect the POST call arguments
    call_args = mock_client.post.call_args
    sent_json = call_args.kwargs.get("json") or call_args[1].get("json")
    variables = sent_json["variables"]
    assert "labelIds" not in variables["input"]
