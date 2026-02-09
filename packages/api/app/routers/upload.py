from __future__ import annotations

from fastapi import APIRouter, Depends, UploadFile

from app.dependencies import validate_api_key
from app.models.project import Project
from app.services.storage_service import upload_file

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("/screenshot")
async def upload_screenshot(
    file: UploadFile,
    _project: Project = Depends(validate_api_key),
) -> dict[str, str]:
    file_content = await file.read()
    object_key = upload_file(
        file_content=file_content,
        filename=file.filename or "screenshot.png",
        content_type=file.content_type or "image/png",
    )
    return {"key": object_key}
