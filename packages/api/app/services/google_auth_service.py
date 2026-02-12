"""Google OAuth authentication service."""
from __future__ import annotations

import asyncio
import base64
import json
import secrets
from dataclasses import dataclass
from urllib.parse import urlencode

import httpx
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

from app.config import get_settings

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"


@dataclass(frozen=True)
class GoogleUserInfo:
    google_id: str
    email: str
    name: str
    is_email_verified: bool


def generate_oauth_state(redirect: str, mode: str) -> tuple[str, str]:
    """Generate a base64-encoded state parameter containing CSRF token, redirect, and mode.

    Returns (state_string, csrf_token).
    """
    csrf_token = secrets.token_hex(32)
    payload = json.dumps({"csrf": csrf_token, "redirect": redirect, "mode": mode})
    state = base64.urlsafe_b64encode(payload.encode()).decode()
    return state, csrf_token


def parse_oauth_state(state: str) -> dict[str, str]:
    """Decode the state parameter and return {csrf, redirect, mode}."""
    raw = base64.urlsafe_b64decode(state.encode()).decode()
    return json.loads(raw)


def build_google_auth_url(state: str, nonce: str) -> str:
    """Build the Google OAuth2 authorization URL."""
    settings = get_settings()
    callback_url = f"{settings.API_PUBLIC_URL}/api/v1/auth/google/callback"
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": callback_url,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "nonce": nonce,
        "access_type": "online",
        "prompt": "select_account",
    }
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


async def exchange_code_for_user_info(code: str) -> GoogleUserInfo:
    """Exchange authorization code for tokens, verify ID token, return user info."""
    settings = get_settings()
    callback_url = f"{settings.API_PUBLIC_URL}/api/v1/auth/google/callback"

    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": callback_url,
                "grant_type": "authorization_code",
            },
        )
        token_response.raise_for_status()
        token_data = token_response.json()

    raw_id_token = token_data["id_token"]
    id_info = await asyncio.to_thread(
        google_id_token.verify_oauth2_token,
        raw_id_token,
        google_requests.Request(),
        settings.GOOGLE_CLIENT_ID,
    )

    return GoogleUserInfo(
        google_id=id_info["sub"],
        email=id_info["email"],
        name=id_info.get("name", id_info["email"].split("@")[0]),
        is_email_verified=id_info.get("email_verified", False),
    )
