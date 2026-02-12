from __future__ import annotations

import pytest

from app.config import Settings, get_settings


@pytest.fixture(autouse=True)
def _clear_settings_cache():
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def test_cors_origins_list_parsing():
    settings = Settings(CORS_ORIGINS="http://a.com, http://b.com , http://c.com")
    origins = settings.cors_origins_list
    assert origins == ["http://a.com", "http://b.com", "http://c.com"]


def test_default_settings():
    settings = Settings()
    assert settings.JWT_ALGORITHM == "HS256"
    assert settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES == 60
    assert settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS == 30
    assert settings.S3_BUCKET_NAME == "bugspark-uploads"
    assert isinstance(settings.cors_origins_list, list)
    assert len(settings.cors_origins_list) >= 1


def _production_kwargs(**overrides: str | bool) -> dict[str, str | bool]:
    values: dict[str, str | bool] = {
        "ENVIRONMENT": "production",
        "JWT_SECRET": "x" * 40,
        "ENCRYPTION_KEY": "enc-key-placeholder",
        "S3_ENDPOINT_URL": "https://s3.example.com",
        "COOKIE_SECURE": True,
        "COOKIE_SAMESITE": "lax",
        "FRONTEND_URL": "https://bugspark.hillmanchan.com",
        "CORS_ORIGINS": "http://localhost:3000,https://bugspark.hillmanchan.com",
    }
    values.update(overrides)
    return values


def test_production_cors_normalization_removes_local_origins():
    settings = Settings(**_production_kwargs())
    assert settings.cors_origins_list == ["https://bugspark.hillmanchan.com"]


def test_production_cors_falls_back_to_frontend_url_when_only_localhost():
    settings = Settings(**_production_kwargs(CORS_ORIGINS="http://localhost:3000"))
    assert settings.cors_origins_list == ["https://bugspark.hillmanchan.com"]


def test_production_cors_adds_frontend_url_if_missing():
    settings = Settings(
        **_production_kwargs(
            CORS_ORIGINS="https://app.example.com,https://admin.example.com",
        )
    )
    assert settings.cors_origins_list == [
        "https://app.example.com",
        "https://admin.example.com",
        "https://bugspark.hillmanchan.com",
    ]


def test_production_frontend_url_falls_back_to_first_production_cors_origin():
    settings = Settings(
        **_production_kwargs(
            FRONTEND_URL="http://localhost:3000",
            CORS_ORIGINS="https://app.example.com,https://admin.example.com",
        )
    )
    assert settings.FRONTEND_URL == "https://app.example.com"
    assert settings.cors_origins_list == [
        "https://app.example.com",
        "https://admin.example.com",
    ]


def test_production_requires_at_least_one_non_local_origin():
    with pytest.raises(ValueError, match="FRONTEND_URL must be set to a production URL"):
        Settings(
            **_production_kwargs(
                FRONTEND_URL="http://localhost:3000",
                CORS_ORIGINS="http://localhost:3000",
            )
        )
