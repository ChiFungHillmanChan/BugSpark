from __future__ import annotations

from pydantic import BaseModel, EmailStr

from app.schemas import CamelModel
from app.schemas.user import UserResponse


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str


class TokenResponse(CamelModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class RefreshRequest(BaseModel):
    refresh_token: str | None = None
    refreshToken: str | None = None

    def get_token(self) -> str:
        """Accept both snake_case and camelCase from clients."""
        token = self.refresh_token or self.refreshToken
        if not token:
            raise ValueError("refresh_token is required")
        return token
