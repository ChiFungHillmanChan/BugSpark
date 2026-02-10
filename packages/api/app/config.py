from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://bugspark:bugspark_dev@localhost:5432/bugspark"

    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    S3_ENDPOINT_URL: str = "http://localhost:9000"
    S3_ACCESS_KEY: str = "bugspark"
    S3_SECRET_KEY: str = "bugspark_dev"
    S3_BUCKET_NAME: str = "bugspark-uploads"
    S3_PUBLIC_URL: str = "http://localhost:9000/bugspark-uploads"

    ANTHROPIC_API_KEY: str = ""

    SUPERADMIN_EMAIL: str = ""
    SUPERADMIN_PASSWORD: str = ""

    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    FRONTEND_URL: str = "http://localhost:3000"

    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"

    ENVIRONMENT: str = "development"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
