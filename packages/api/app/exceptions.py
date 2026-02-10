from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


class NotFoundException(Exception):
    def __init__(self, detail: str = "Resource not found") -> None:
        self.detail = detail


class UnauthorizedException(Exception):
    def __init__(self, detail: str = "Not authenticated") -> None:
        self.detail = detail


class ForbiddenException(Exception):
    def __init__(self, detail: str = "Forbidden", code: str | None = None) -> None:
        self.detail = detail
        self.code = code


class BadRequestException(Exception):
    def __init__(self, detail: str = "Bad request") -> None:
        self.detail = detail


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(NotFoundException)
    async def not_found_handler(_request: Request, exc: NotFoundException) -> JSONResponse:
        return JSONResponse(status_code=404, content={"detail": exc.detail})

    @app.exception_handler(UnauthorizedException)
    async def unauthorized_handler(_request: Request, exc: UnauthorizedException) -> JSONResponse:
        return JSONResponse(status_code=401, content={"detail": exc.detail})

    @app.exception_handler(ForbiddenException)
    async def forbidden_handler(_request: Request, exc: ForbiddenException) -> JSONResponse:
        content: dict[str, str] = {"detail": exc.detail}
        if exc.code:
            content["code"] = exc.code
        return JSONResponse(status_code=403, content=content)

    @app.exception_handler(BadRequestException)
    async def bad_request_handler(_request: Request, exc: BadRequestException) -> JSONResponse:
        return JSONResponse(status_code=400, content={"detail": exc.detail})

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception(
            "Unhandled exception on %s %s", request.method, request.url.path
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "An unexpected error occurred"},
        )
