"""
Middleware that adds permissive CORS headers for widget-facing endpoints.

Widget endpoints are authenticated via X-API-Key (not cookies/sessions),
so restricting origins provides no additional security — the API key is
already public in the customer's <script> tag.  The standard
CORSMiddleware rejects unknown origins with 400 on preflight, which
breaks any customer site not listed in CORS_ORIGINS.

This middleware intercepts requests to widget paths *before* the
CORSMiddleware and handles CORS itself, allowing any origin.
"""

from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

# Paths that the widget calls from customer websites.
# These all use X-API-Key authentication, not cookies.
_WIDGET_PATH_PREFIXES = (
    "/api/v1/projects/widget-config",
    "/api/v1/projects/console-log-quota",
    "/api/v1/upload/screenshot",
    "/api/v1/reports",
)

_ALLOWED_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD"
_ALLOWED_HEADERS = "Authorization, Content-Type, X-API-Key, Accept-Language"


def _is_widget_path(path: str) -> bool:
    """Return True if the request path is a widget-facing endpoint."""
    return any(path.startswith(prefix) for prefix in _WIDGET_PATH_PREFIXES)


class WidgetCORSMiddleware(BaseHTTPMiddleware):
    """Allow any origin for widget-facing endpoints."""

    async def dispatch(self, request: Request, call_next) -> Response:  # type: ignore[override]
        if not _is_widget_path(request.url.path):
            return await call_next(request)

        origin = request.headers.get("origin", "*")

        # Handle preflight OPTIONS requests directly
        if request.method == "OPTIONS":
            return Response(
                status_code=200,
                headers={
                    "Access-Control-Allow-Origin": origin,
                    "Access-Control-Allow-Methods": _ALLOWED_METHODS,
                    "Access-Control-Allow-Headers": _ALLOWED_HEADERS,
                    "Access-Control-Max-Age": "86400",
                },
            )

        # For actual requests, call the route handler then add CORS headers
        response = await call_next(request)
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Methods"] = _ALLOWED_METHODS
        response.headers["Access-Control-Allow-Headers"] = _ALLOWED_HEADERS
        return response
