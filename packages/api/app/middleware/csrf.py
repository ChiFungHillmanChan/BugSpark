from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}

# Endpoints that don't require CSRF (no existing session)
CSRF_EXEMPT_PATHS = {
    "/api/v1/auth/login",
    "/api/v1/auth/register",
    "/api/v1/auth/refresh",
}


class CSRFMiddleware(BaseHTTPMiddleware):
    """Double-submit cookie CSRF protection.

    Validates that the `bugspark_csrf_token` cookie matches the `X-CSRF-Token`
    header on non-safe HTTP methods. Requests authenticated via `X-API-Key`
    (widget SDK) are exempt since they don't use cookie-based auth.
    """

    async def dispatch(self, request: Request, call_next):
        if request.method in SAFE_METHODS:
            return await call_next(request)

        if request.headers.get("X-API-Key"):
            return await call_next(request)

        if request.url.path in CSRF_EXEMPT_PATHS:
            return await call_next(request)

        # Only enforce CSRF when the request uses cookie-based auth
        if not request.cookies.get("bugspark_access_token"):
            return await call_next(request)

        cookie_token = request.cookies.get("bugspark_csrf_token")
        header_token = request.headers.get("X-CSRF-Token")

        if not cookie_token or not header_token:
            return JSONResponse(
                status_code=403,
                content={"detail": "Missing CSRF token"},
            )

        if cookie_token != header_token:
            return JSONResponse(
                status_code=403,
                content={"detail": "CSRF token mismatch"},
            )

        return await call_next(request)
