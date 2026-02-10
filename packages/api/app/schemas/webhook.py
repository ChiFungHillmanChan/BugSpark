from __future__ import annotations

import ipaddress
import uuid
from datetime import datetime
from urllib.parse import urlparse

from pydantic import BaseModel, Field, field_validator

from app.schemas import CamelModel

_BLOCKED_HOSTS = {"localhost", "127.0.0.1", "0.0.0.0", "169.254.169.254", "[::1]"}


def _validate_webhook_url(value: str) -> str:
    """Validate webhook URL: require http(s) and block private/metadata addresses."""
    if not value.startswith(("https://", "http://")):
        raise ValueError("URL must start with http:// or https://")

    parsed = urlparse(value)
    hostname = (parsed.hostname or "").lower()

    if hostname in _BLOCKED_HOSTS:
        raise ValueError("Webhook URLs must not point to private or loopback addresses")

    # Block private, loopback, and link-local IPs
    try:
        ip = ipaddress.ip_address(hostname)
        if ip.is_private or ip.is_loopback or ip.is_link_local:
            raise ValueError("Webhook URLs must not point to private or loopback addresses")
    except ValueError:
        pass  # hostname is a domain name, not an IP — allowed

    return value


class WebhookCreate(BaseModel):
    url: str = Field(..., min_length=1, max_length=2048)
    events: list[str] = Field(..., min_length=1, max_length=50)

    @field_validator("url")
    @classmethod
    def validate_url(cls, value: str) -> str:
        return _validate_webhook_url(value)

    @field_validator("events")
    @classmethod
    def validate_events(cls, value: list[str]) -> list[str]:
        for event in value:
            if not event or len(event) > 100:
                raise ValueError("Each event name must be 1-100 characters")
        return value


class WebhookUpdate(CamelModel):
    url: str | None = Field(None, min_length=1, max_length=2048)
    events: list[str] | None = Field(None, min_length=1, max_length=50)
    is_active: bool | None = None

    @field_validator("url")
    @classmethod
    def validate_url(cls, value: str | None) -> str | None:
        if value is not None:
            return _validate_webhook_url(value)
        return value


class WebhookResponse(CamelModel):
    id: uuid.UUID
    project_id: uuid.UUID
    url: str
    events: list[str]
    is_active: bool
    created_at: datetime
