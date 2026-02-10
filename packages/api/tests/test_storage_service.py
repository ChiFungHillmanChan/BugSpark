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
    import app.services.storage_service as storage_mod

    get_settings.cache_clear()
    storage_mod._s3_client = None
    yield
    get_settings.cache_clear()
    storage_mod._s3_client = None


@patch("app.services.storage_service._get_s3_client")
@pytest.mark.asyncio
async def test_upload_file_valid_png(mock_get_client: MagicMock):
    mock_client = MagicMock()
    mock_get_client.return_value = mock_client

    file_content = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100
    owner_id = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
    project_id = "11111111-2222-3333-4444-555555555555"
    result = await upload_file(file_content, "image/png", owner_id, project_id)

    assert result.startswith(f"{owner_id}/{project_id}/")
    assert result.endswith(".png")
    mock_client.put_object.assert_called_once()
    call_kwargs = mock_client.put_object.call_args.kwargs
    assert call_kwargs["ContentType"] == "image/png"
    assert call_kwargs["Body"] == file_content


@pytest.mark.asyncio
async def test_upload_file_rejects_invalid_content_type():
    with pytest.raises(BadRequestException, match="Invalid file type"):
        await upload_file(b"data", "text/plain", "owner-id", "project-id")


@pytest.mark.asyncio
async def test_upload_file_rejects_oversized_file():
    # Create oversized content with valid PNG magic bytes so it passes magic byte validation
    # but fails size validation
    oversized_content = b"\x89PNG\r\n\x1a\n" + b"\x00" * (MAX_FILE_SIZE_BYTES + 1)
    with pytest.raises(BadRequestException, match="exceeds maximum size"):
        await upload_file(oversized_content, "image/png", "owner-id", "project-id")


@patch("app.services.storage_service._get_s3_client")
@pytest.mark.asyncio
async def test_generate_presigned_url(mock_get_client: MagicMock):
    mock_client = MagicMock()
    mock_client.generate_presigned_url.return_value = "https://s3.example.com/signed-url"
    mock_get_client.return_value = mock_client

    result = await generate_presigned_url("screenshots/abc.png")

    assert result == "https://s3.example.com/signed-url"
    mock_client.generate_presigned_url.assert_called_once_with(
        "get_object",
        Params={"Bucket": "bugspark-uploads", "Key": "screenshots/abc.png"},
        ExpiresIn=900,
    )
