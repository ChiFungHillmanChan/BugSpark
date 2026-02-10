from __future__ import annotations

import uuid

from pydantic import BaseModel, EmailStr, Field

from app.schemas import CamelModel


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(min_length=1, max_length=255)


class BetaRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(min_length=1, max_length=255)
    reason: str = Field(default="", max_length=1000)


class BetaRegisterResponse(CamelModel):
    message: str
    beta_status: str


class CLIAuthResponse(CamelModel):
    """Response for CLI login/register — returns user info + a PAT token."""

    id: uuid.UUID
    email: str
    name: str
    role: str
    plan: str
    token: str
