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
    assert settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES == 15
    assert settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS == 7
    assert settings.S3_BUCKET_NAME == "bugspark-uploads"
    assert isinstance(settings.cors_origins_list, list)
    assert len(settings.cors_origins_list) >= 1
