from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from pydantic import BaseModel, Field, ValidationInfo, field_validator

from app.schemas import CamelModel

if TYPE_CHECKING:
    from app.models.integration import Integration as IntegrationModel

SUPPORTED_PROVIDERS = {"github", "linear"}


class IntegrationCreate(BaseModel):
    provider: str = Field(..., min_length=1, max_length=50)
    config: dict[str, Any] = Field(...)

    @field_validator("provider")
    @classmethod
    def validate_provider(cls, value: str) -> str:
        if value not in SUPPORTED_PROVIDERS:
            raise ValueError(f"Unsupported provider: {value}")
        return value

    @field_validator("config")
    @classmethod
    def validate_config(cls, value: dict[str, Any], info: ValidationInfo) -> dict[str, Any]:
        provider = info.data.get("provider")
        if provider == "github":
            required_keys = {"token", "owner", "repo"}
            missing = required_keys - set(value.keys())
            if missing:
                raise ValueError(f"GitHub config missing keys: {', '.join(missing)}")
        elif provider == "linear":
            required_keys = {"apiKey", "teamId"}
            missing = required_keys - set(value.keys())
            if missing:
                raise ValueError(f"Linear config missing keys: {', '.join(missing)}")
        return value


class IntegrationUpdate(CamelModel):
    config: dict[str, Any] | None = None
    is_active: bool | None = None


class IntegrationResponse(CamelModel):
    id: uuid.UUID
    project_id: uuid.UUID
    provider: str
    is_active: bool
    created_at: datetime
    has_token: bool = False

    @classmethod
    def from_integration(cls, integration: IntegrationModel) -> IntegrationResponse:
        config = integration.config or {}
        return cls(
            id=integration.id,
            project_id=integration.project_id,
            provider=integration.provider,
            is_active=integration.is_active,
            created_at=integration.created_at,
            has_token=bool(config.get("token")),
        )


class ExportResponse(CamelModel):
    issue_url: str
    issue_number: int
    issue_identifier: str | None = None
