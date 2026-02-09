from __future__ import annotations

import json
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from app.services.webhook_service import _generate_signature, deliver_webhook


def _make_webhook(url: str = "https://hooks.example.com/callback", secret: str = "webhook-secret"):
    return SimpleNamespace(url=url, secret=secret)


async def test_deliver_webhook_sends_request():
    webhook = _make_webhook()
    mock_response = MagicMock(status_code=200)

    with patch("app.services.webhook_service.httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client_cls.return_value = mock_client

        await deliver_webhook(webhook, "report.created", {"id": "123"})

        mock_client.post.assert_called_once()
        call_args = mock_client.post.call_args
        assert call_args.kwargs["headers"]["Content-Type"] == "application/json"
        assert call_args.args[0] == webhook.url


async def test_deliver_webhook_includes_signature_header():
    webhook = _make_webhook(secret="test-secret")
    mock_response = MagicMock(status_code=200)

    with patch("app.services.webhook_service.httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client_cls.return_value = mock_client

        await deliver_webhook(webhook, "report.created", {"id": "abc"})

        call_kwargs = mock_client.post.call_args.kwargs
        headers = call_kwargs["headers"]
        assert "X-BugSpark-Signature" in headers
        assert "X-BugSpark-Event" in headers
        assert headers["X-BugSpark-Event"] == "report.created"


async def test_deliver_webhook_handles_timeout():
    webhook = _make_webhook()

    with patch("app.services.webhook_service.httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client.post.side_effect = httpx.TimeoutException("Connection timed out")
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client_cls.return_value = mock_client

        # Should not raise; the function catches HTTPError
        await deliver_webhook(webhook, "report.created", {"id": "456"})
