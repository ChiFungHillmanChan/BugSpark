from __future__ import annotations

from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://bugspark:bugspark_dev@localhost:5432/bugspark"

    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60  # Short-lived for security (industry standard: 15-60 min)
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 30  # Extended from 7 to 30 days for better UX (industry standard: 7-30 days)

    S3_ENDPOINT_URL: str = "http://localhost:9000"
    S3_ACCESS_KEY: str = "bugspark"
    S3_SECRET_KEY: str = "bugspark_dev"
    S3_BUCKET_NAME: str = "bugspark-uploads"
    S3_PUBLIC_URL: str = "http://localhost:9000/bugspark-uploads"

    ANTHROPIC_API_KEY: str = ""
    AI_MODEL: str = "claude-haiku-4-5-20251001"

    SUPERADMIN_EMAIL: str = ""
    SUPERADMIN_PASSWORD: str = ""

    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    CORS_ORIGIN_REGEX: str = ""  # Optional regex for dynamic origins (not needed for single domain setup)
    FRONTEND_URL: str = "http://localhost:3000"

    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"
    COOKIE_DOMAIN: str = ""  # e.g. ".hillmanchan.com" to share cookies across subdomains

    RESEND_API_KEY: str = ""
    EMAIL_FROM_ADDRESS: str = "BugSpark <noreply@bugspark.dev>"

    ENCRYPTION_KEY: str = ""  # Fernet key for encrypting secrets at rest. Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

    SENTRY_DSN: str = ""

    ENVIRONMENT: str = "development"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @model_validator(mode="after")
    def _validate_production_settings(self) -> Settings:
        import logging
        import warnings

        if self.ENVIRONMENT != "development":
            if self.JWT_SECRET == "change-me-in-production":
                raise ValueError(
                    "JWT_SECRET must be changed from the default value in non-development environments"
                )
            if len(self.JWT_SECRET) < 32:
                raise ValueError(
                    "JWT_SECRET must be at least 32 characters in non-development environments"
                )
            if not self.ENCRYPTION_KEY:
                raise ValueError(
                    "ENCRYPTION_KEY is required in non-development environments"
                )
            if not self.S3_ENDPOINT_URL or "localhost" in self.S3_ENDPOINT_URL:
                raise ValueError(
                    "S3_ENDPOINT_URL must be a remote URL in non-development environments"
                )
            if not self.COOKIE_SECURE:
                raise ValueError(
                    "COOKIE_SECURE must be True in non-development environments (HTTPS required)"
                )
            if self.COOKIE_SAMESITE.lower() == "none":
                _logger = logging.getLogger(__name__)
                _logger.warning(
                    "COOKIE_SAMESITE is set to 'none' — this allows cross-site cookie sending. "
                    "Consider using 'lax' or 'strict' for better security."
                )
                warnings.warn(
                    "COOKIE_SAMESITE='none' is insecure for production",
                    stacklevel=1,
                )
        return self

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
