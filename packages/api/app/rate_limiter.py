from __future__ import annotations

from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address


def _get_rate_limit_key(request: Request) -> str:
    api_key = request.headers.get("X-API-Key")
    if api_key and len(api_key) >= 8:
        return f"apikey:{api_key[:8]}"
    return get_remote_address(request)


limiter = Limiter(key_func=_get_rate_limit_key, default_limits=["100/minute"])
