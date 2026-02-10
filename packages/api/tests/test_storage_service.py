from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from app.exceptions import BadRequestException
from app.services.storage_service import (
    ALLOWED_CONTENT_TYPES,
    MAX_FILE_SIZE_BYTES,
    generate_presigned_url,
    upload_file,
)


@pytest.fixture(autouse=True)
def _clear_settings_cache():
    from app.config import get_settings
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@patch("app.services.storage_service._get_s3_client")
def test_upload_file_valid_png(mock_get_client: MagicMock):
    mock_client = MagicMock()
    mock_get_client.return_value = mock_client

    file_content = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100
    result = upload_file(file_content, "screenshot.png", "image/png")

    assert result.startswith("screenshots/")
    assert result.endswith(".png")
    mock_client.put_object.assert_called_once()
    call_kwargs = mock_client.put_object.call_args.kwargs
    assert call_kwargs["ContentType"] == "image/png"
    assert call_kwargs["Body"] == file_content


def test_upload_file_rejects_invalid_content_type():
    with pytest.raises(BadRequestException, match="Invalid file type"):
        upload_file(b"data", "file.txt", "text/plain")


def test_upload_file_rejects_oversized_file():
    # Create oversized content with valid PNG magic bytes so it passes magic byte validation
    # but fails size validation
    oversized_content = b"\x89PNG\r\n\x1a\n" + b"\x00" * (MAX_FILE_SIZE_BYTES + 1)
    with pytest.raises(BadRequestException, match="exceeds maximum size"):
        upload_file(oversized_content, "big.png", "image/png")


@patch("app.services.storage_service._get_s3_client")
def test_generate_presigned_url(mock_get_client: MagicMock):
    mock_client = MagicMock()
    mock_client.generate_presigned_url.return_value = "https://s3.example.com/signed-url"
    mock_get_client.return_value = mock_client

    result = generate_presigned_url("screenshots/abc.png")

    assert result == "https://s3.example.com/signed-url"
    mock_client.generate_presigned_url.assert_called_once_with(
        "get_object",
        Params={"Bucket": "bugspark-uploads", "Key": "screenshots/abc.png"},
        ExpiresIn=900,
    )
