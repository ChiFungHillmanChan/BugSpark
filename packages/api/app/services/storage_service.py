from __future__ import annotations

import asyncio
import logging
import re
import threading
import uuid

import boto3
from botocore.config import Config as BotoConfig
from botocore.exceptions import ClientError

from app.config import get_settings
from app.exceptions import BadRequestException

logger = logging.getLogger(__name__)

ALLOWED_CONTENT_TYPES = {"image/png", "image/jpeg", "image/webp"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

# Map content-type to a safe, deterministic extension used in object keys.
# This ensures upload_file always produces keys that validate_object_key accepts.
_CONTENT_TYPE_TO_EXT: dict[str, str] = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
}

# Magic-byte signatures for validating actual file content vs declared content-type
_MAGIC_SIGNATURES: list[tuple[bytes, str]] = [
    (b"\x89PNG", "image/png"),
    (b"\xff\xd8\xff", "image/jpeg"),
]
# WebP: starts with "RIFF" and bytes 8-12 are "WEBP"
_WEBP_RIFF = b"RIFF"
_WEBP_MARKER = b"WEBP"

_s3_client = None
_s3_client_lock = threading.Lock()


def _validate_magic_bytes(file_content: bytes, declared_content_type: str) -> None:
    """Verify file content matches the declared content-type via magic-byte checks."""
    if len(file_content) < 12:
        raise BadRequestException("File is too small to be a valid image")

    # Check WebP separately (RIFF....WEBP structure)
    if declared_content_type == "image/webp":
        if file_content[:4] == _WEBP_RIFF and file_content[8:12] == _WEBP_MARKER:
            return
        raise BadRequestException("File content does not match declared type image/webp")

    # Check PNG and JPEG magic bytes
    for magic, expected_type in _MAGIC_SIGNATURES:
        if declared_content_type == expected_type:
            if file_content[: len(magic)] == magic:
                return
            raise BadRequestException(
                f"File content does not match declared type {declared_content_type}"
            )


def _get_s3_client():
    global _s3_client
    if _s3_client is not None:
        return _s3_client
    with _s3_client_lock:
        if _s3_client is not None:
            return _s3_client
        settings = get_settings()
        # Cloudflare R2 is S3-compatible but doesn't use regions
        # Set region_name to 'auto' or 'us-east-1' for R2 compatibility
        region_name = "auto" if "r2.cloudflarestorage.com" in settings.S3_ENDPOINT_URL else None
        _s3_client = boto3.client(
            "s3",
            endpoint_url=settings.S3_ENDPOINT_URL,
            aws_access_key_id=settings.S3_ACCESS_KEY,
            aws_secret_access_key=settings.S3_SECRET_KEY,
            region_name=region_name,
            config=BotoConfig(signature_version="s3v4"),
        )
        logger.info("Initialized S3/R2 client")
    return _s3_client


async def upload_file(
    file_content: bytes,
    content_type: str,
    owner_id: str,
    project_id: str,
) -> str:
    """Upload a file to S3 and return the object key (not the full URL).

    Storage path follows: {owner_id}/{project_id}/{uuid}.{ext}
    """
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise BadRequestException(
            f"Invalid file type '{content_type}'. Allowed: {', '.join(ALLOWED_CONTENT_TYPES)}"
        )

    _validate_magic_bytes(file_content, content_type)

    if len(file_content) > MAX_FILE_SIZE_BYTES:
        raise BadRequestException(f"File exceeds maximum size of {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB")

    settings = get_settings()
    extension = _CONTENT_TYPE_TO_EXT.get(content_type, "png")
    object_key = f"{owner_id}/{project_id}/{uuid.uuid4()}.{extension}"

    client = _get_s3_client()
    try:
        await asyncio.to_thread(
            client.put_object,
            Bucket=settings.S3_BUCKET_NAME,
            Key=object_key,
            Body=file_content,
            ContentType=content_type,
        )
        logger.info("Successfully uploaded file: %s", object_key)
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "Unknown")
        error_message = e.response.get("Error", {}).get("Message", str(e))
        logger.error("Failed to upload file to S3/R2: %s - %s", error_code, error_message)
        raise BadRequestException("Failed to upload file to storage")
    except Exception as e:
        logger.exception("Unexpected error uploading file to S3/R2: %s", e)
        raise BadRequestException("Failed to upload file to storage")

    return object_key


# Matches both new ({owner}/{project}/{uuid}.ext) and legacy (screenshots/{uuid}.ext) paths
_VALID_KEY_PATTERN = re.compile(
    r"^(?:[0-9a-f-]{36}/[0-9a-f-]{36}/|screenshots/)[0-9a-f-]{36}\.\w{1,5}$"
)


def validate_object_key(key: str) -> bool:
    """Check an object key matches the upload-generated format (screenshots/<uuid>.<ext>)."""
    return bool(_VALID_KEY_PATTERN.match(key))


def _is_object_key(value: str) -> bool:
    """Check if a value is an S3 object key (not a full URL)."""
    return bool(value) and not value.startswith("http://") and not value.startswith("https://")


async def delete_file(key: str) -> None:
    """Delete a single file from S3/R2 by its object key."""
    if not _is_object_key(key):
        return

    settings = get_settings()
    client = _get_s3_client()
    try:
        await asyncio.to_thread(
            client.delete_object,
            Bucket=settings.S3_BUCKET_NAME,
            Key=key,
        )
        logger.info("Deleted file from R2: %s", key)
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "Unknown")
        error_message = e.response.get("Error", {}).get("Message", str(e))
        logger.error("Failed to delete file from R2: %s - %s. Key: %s", error_code, error_message, key)
    except Exception as e:
        logger.exception("Unexpected error deleting file from R2: %s", e)


async def delete_files(keys: list[str]) -> None:
    """Delete multiple files from S3/R2. Skips empty keys and full URLs."""
    valid_keys = [k for k in keys if _is_object_key(k)]
    if not valid_keys:
        return

    settings = get_settings()
    client = _get_s3_client()

    # R2 supports batch delete (up to 1000 objects per request)
    objects = [{"Key": k} for k in valid_keys]
    try:
        await asyncio.to_thread(
            client.delete_objects,
            Bucket=settings.S3_BUCKET_NAME,
            Delete={"Objects": objects, "Quiet": True},
        )
        logger.info("Batch deleted %d files from R2", len(valid_keys))
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "Unknown")
        error_message = e.response.get("Error", {}).get("Message", str(e))
        logger.error("Failed to batch delete from R2: %s - %s", error_code, error_message)
        # Fall back to individual deletes
        for key in valid_keys:
            await delete_file(key)
    except Exception as e:
        logger.exception("Unexpected error batch deleting from R2: %s", e)
        for key in valid_keys:
            await delete_file(key)


async def generate_presigned_url(key: str, expires_in: int = 900) -> str:
    """Generate a presigned URL for an S3 object key."""
    settings = get_settings()
    client = _get_s3_client()
    try:
        url = await asyncio.to_thread(
            client.generate_presigned_url,
            "get_object",
            Params={"Bucket": settings.S3_BUCKET_NAME, "Key": key},
            ExpiresIn=expires_in,
        )
        return url
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "Unknown")
        error_message = e.response.get("Error", {}).get("Message", str(e))
        logger.error("Failed to generate presigned URL: %s - %s", error_code, error_message)
        raise BadRequestException("Failed to generate file URL")
    except Exception as e:
        logger.exception("Unexpected error generating presigned URL: %s", e)
        raise BadRequestException("Failed to generate file URL")
