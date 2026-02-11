from __future__ import annotations

from fastapi import APIRouter, Depends, Request, UploadFile

from app.dependencies import validate_api_key
from app.exceptions import BadRequestException
from app.models.project import Project
from app.rate_limiter import limiter
from app.services.storage_service import MAX_FILE_SIZE_BYTES, upload_file

router = APIRouter(prefix="/upload", tags=["upload"])

UPLOAD_CHUNK_SIZE = 64 * 1024  # 64 KB


async def _read_with_size_limit(file: UploadFile) -> bytes:
    """Read file in chunks, aborting early if size exceeds the limit."""
    chunks: list[bytes] = []
    total_size = 0

    while True:
        chunk = await file.read(UPLOAD_CHUNK_SIZE)
        if not chunk:
            break
        total_size += len(chunk)
        if total_size > MAX_FILE_SIZE_BYTES:
            raise BadRequestException(
                f"File exceeds maximum size of {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB"
            )
        chunks.append(chunk)

    return b"".join(chunks)


@router.post("/screenshot")
@limiter.limit("20/minute")
async def upload_screenshot(
    request: Request,
    file: UploadFile,
    project: Project = Depends(validate_api_key),
) -> dict[str, str]:
    file_content = await _read_with_size_limit(file)
    object_key = await upload_file(
        file_content=file_content,
        content_type=file.content_type or "image/png",
        owner_id=str(project.owner_id),
        project_id=str(project.id),
    )
    return {"key": object_key}
