"""Tests for SSRF protection in URL validator."""
from __future__ import annotations

import pytest

from app.exceptions import BadRequestException
from app.utils.url_validator import validate_webhook_url


def test_valid_public_url():
    """A valid public HTTPS URL should pass validation."""
    url = "https://example.com/webhooks/bugspark"
    result = validate_webhook_url(url)
    assert result == url


def test_rejects_non_http_scheme():
    with pytest.raises(BadRequestException, match="http or https"):
        validate_webhook_url("ftp://example.com/hook")


def test_rejects_no_scheme():
    with pytest.raises(BadRequestException, match="http or https"):
        validate_webhook_url("example.com/hook")


def test_rejects_localhost():
    with pytest.raises(BadRequestException, match="internal"):
        validate_webhook_url("http://localhost/hook")


def test_rejects_127_ip():
    with pytest.raises(BadRequestException, match="internal|reserved"):
        validate_webhook_url("http://127.0.0.1/hook")


def test_rejects_private_10_range():
    with pytest.raises(BadRequestException, match="internal|reserved"):
        validate_webhook_url("http://10.0.0.1/hook")


def test_rejects_private_172_range():
    with pytest.raises(BadRequestException, match="internal|reserved"):
        validate_webhook_url("http://172.16.0.1/hook")


def test_rejects_private_192_range():
    with pytest.raises(BadRequestException, match="internal|reserved"):
        validate_webhook_url("http://192.168.1.1/hook")


def test_rejects_cloud_metadata_ip():
    """Block AWS/GCP/Azure metadata endpoint."""
    with pytest.raises(BadRequestException, match="internal|reserved"):
        validate_webhook_url("http://169.254.169.254/latest/meta-data")


def test_rejects_zero_ip():
    with pytest.raises(BadRequestException, match="internal"):
        validate_webhook_url("http://0.0.0.0/hook")


def test_rejects_empty_hostname():
    with pytest.raises(BadRequestException, match="hostname"):
        validate_webhook_url("http:///hook")
