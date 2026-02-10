from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest
import jwt

from app.services.auth_service import (
    create_access_token,
    create_refresh_token,
    generate_jti,
    hash_password,
    verify_password,
    verify_token,
)


@pytest.fixture(autouse=True)
def _clear_settings_cache():
    from app.config import get_settings
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def test_hash_password_returns_bcrypt_hash():
    hashed = hash_password("mypassword")
    assert hashed.startswith("$2b$")
    assert hashed != "mypassword"


def test_verify_password_correct():
    hashed = hash_password("correctpassword")
    assert verify_password("correctpassword", hashed) is True


def test_verify_password_incorrect():
    hashed = hash_password("correctpassword")
    assert verify_password("wrongpassword", hashed) is False


def test_create_access_token_contains_claims():
    token = create_access_token("user-id-123", "user@example.com")
    payload = jwt.decode(token, "test-secret-key-that-is-at-least-32-bytes-long", algorithms=["HS256"])
    assert payload["sub"] == "user-id-123"
    assert payload["email"] == "user@example.com"
    assert payload["type"] == "access"
    assert "exp" in payload


def test_create_refresh_token_has_refresh_type():
    jti = generate_jti()
    token = create_refresh_token("user-id-123", jti)
    payload = jwt.decode(token, "test-secret-key-that-is-at-least-32-bytes-long", algorithms=["HS256"])
    assert payload["sub"] == "user-id-123"
    assert payload["type"] == "refresh"
    assert payload["jti"] == jti
    assert "exp" in payload


def test_verify_token_valid():
    token = create_access_token("user-id-456", "valid@example.com")
    payload = verify_token(token)
    assert payload["sub"] == "user-id-456"
    assert payload["email"] == "valid@example.com"


def test_verify_token_expired():
    expired_time = datetime.now(timezone.utc) - timedelta(hours=1)
    with patch("app.services.auth_service.datetime") as mock_dt:
        mock_dt.now.return_value = expired_time
        mock_dt.side_effect = lambda *args, **kwargs: datetime(*args, **kwargs)
        # Create a manually expired token
        payload = {
            "sub": "user-id-789",
            "email": "expired@example.com",
            "exp": expired_time + timedelta(minutes=1),
            "type": "access",
        }
        token = jwt.encode(payload, "test-secret-key-that-is-at-least-32-bytes-long", algorithm="HS256")

    with pytest.raises(ValueError, match="Invalid token"):
        verify_token(token)


def test_verify_token_invalid_string():
    with pytest.raises(ValueError, match="Invalid token"):
        verify_token("this.is.not.a.valid.token")
