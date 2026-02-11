"""
Middleware that adds permissive CORS headers for widget-facing endpoints.

Widget endpoints are authenticated via X-API-Key (not cookies/sessions),
so restricting origins provides no additional security — the API key is
already public in the customer's <script> tag.  The standard
CORSMiddleware rejects unknown origins with 400 on preflight, which
breaks any customer site not listed in CORS_ORIGINS.

This middleware intercepts requests to widget paths *before* the
CORSMiddleware and handles CORS itself, allowing any origin.

IMPORTANT: The /api/v1/reports path is shared by both the widget (POST
with X-API-Key) and the dashboard (GET/PATCH/DELETE with cookies).
We must only intercept widget requests — not dashboard requests — or
the dashboard loses Access-Control-Allow-Credentials and breaks.
"""

from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

# Paths that ONLY the widget calls (never the dashboard).
_WIDGET_ONLY_PREFIXES = (
    "/api/v1/projects/widget-config",
    "/api/v1/projects/console-log-quota",
    "/api/v1/upload/screenshot",
)

# The /reports endpoint is shared: the widget POSTs new reports (X-API-Key),
# while the dashboard GETs/PATCHes/DELETEs reports (cookie auth).
_REPORTS_PATH = "/api/v1/reports"

_ALLOWED_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD"
_ALLOWED_HEADERS = "Authorization, Content-Type, X-API-Key, Accept-Language"


def _is_widget_request(request: Request) -> bool:
    """Return True if the request is a widget-facing call that needs permissive CORS."""
    path = request.url.path

    # Widget-only endpoints — always handle here
    if any(path.startswith(prefix) for prefix in _WIDGET_ONLY_PREFIXES):
        return True

    # For /reports, only intercept if:
    # 1. It's exactly POST /api/v1/reports (widget submitting a bug), OR
    # 2. The request carries an X-API-Key header (widget auth)
    # Dashboard requests use cookie auth with withCredentials and need the
    # regular CORSMiddleware (which sets Access-Control-Allow-Credentials).
    if path == _REPORTS_PATH:
        method = request.method.upper()
        has_api_key = "x-api-key" in request.headers
        # POST from widget, or preflight for a widget POST (check for X-API-Key in preflight headers)
        if method == "POST" and has_api_key:
            return True
        if method == "OPTIONS":
            # Check if the preflight is for a widget request by inspecting
            # Access-Control-Request-Headers for x-api-key
            acr_headers = request.headers.get("access-control-request-headers", "").lower()
            if "x-api-key" in acr_headers:
                return True

    return False


class WidgetCORSMiddleware(BaseHTTPMiddleware):
    """Allow any origin for widget-facing endpoints."""

    async def dispatch(self, request: Request, call_next) -> Response:  # type: ignore[override]
        if not _is_widget_request(request):
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
