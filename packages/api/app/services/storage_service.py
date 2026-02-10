from __future__ import annotations

import uuid

import boto3
from botocore.config import Config as BotoConfig

from app.config import get_settings
from app.exceptions import BadRequestException

ALLOWED_CONTENT_TYPES = {"image/png", "image/jpeg", "image/webp"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

# Magic-byte signatures for validating actual file content vs declared content-type
_MAGIC_SIGNATURES: list[tuple[bytes, str]] = [
    (b"\x89PNG", "image/png"),
    (b"\xff\xd8\xff", "image/jpeg"),
]
# WebP: starts with "RIFF" and bytes 8-12 are "WEBP"
_WEBP_RIFF = b"RIFF"
_WEBP_MARKER = b"WEBP"


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
    settings = get_settings()
    return boto3.client(
        "s3",
        endpoint_url=settings.S3_ENDPOINT_URL,
        aws_access_key_id=settings.S3_ACCESS_KEY,
        aws_secret_access_key=settings.S3_SECRET_KEY,
        config=BotoConfig(signature_version="s3v4"),
    )


def upload_file(file_content: bytes, filename: str, content_type: str) -> str:
    """Upload a file to S3 and return the object key (not the full URL)."""
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise BadRequestException(
            f"Invalid file type '{content_type}'. Allowed: {', '.join(ALLOWED_CONTENT_TYPES)}"
        )

    _validate_magic_bytes(file_content, content_type)

    if len(file_content) > MAX_FILE_SIZE_BYTES:
        raise BadRequestException(f"File exceeds maximum size of {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB")

    settings = get_settings()
    extension = filename.rsplit(".", 1)[-1] if "." in filename else "png"
    object_key = f"screenshots/{uuid.uuid4()}.{extension}"

    client = _get_s3_client()
    client.put_object(
        Bucket=settings.S3_BUCKET_NAME,
        Key=object_key,
        Body=file_content,
        ContentType=content_type,
    )

    return object_key


def generate_presigned_url(key: str, expires_in: int = 900) -> str:
    """Generate a presigned URL for an S3 object key."""
    settings = get_settings()
    client = _get_s3_client()
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.S3_BUCKET_NAME, "Key": key},
        ExpiresIn=expires_in,
    )
