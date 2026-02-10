from __future__ import annotations

import secrets
import string
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_active_user, get_db
from app.exceptions import BadRequestException, UnauthorizedException
from app.i18n import get_locale, translate
from app.models.device_auth import DeviceAuthSession
from app.models.personal_access_token import PersonalAccessToken
from app.models.user import User
from app.services.auth_service import create_cli_pat


def _utcnow() -> datetime:
    """Return a UTC datetime that is safe to compare against DB-returned timestamps.

    PostgreSQL returns timezone-aware datetimes while SQLite returns naive ones.
    We always return timezone-aware and, where compared, normalise the DB value.
    """
    return datetime.now(timezone.utc)


def _is_expired(dt: datetime) -> bool:
    """Compare a possibly-naive datetime against the current UTC time."""
    now = _utcnow()
    # Normalise: if the stored value is naive, assume UTC
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt < now

router = APIRouter(prefix="/auth/device", tags=["device-auth"])

_device_limiter = Limiter(key_func=get_remote_address)

# ── Schemas ────────────────────────────────────────────────────────────────

DEVICE_CODE_EXPIRY_MINUTES = 15
POLL_INTERVAL_SECONDS = 5


class DeviceCodeRequest(BaseModel):
    pass


class DeviceCodeResponse(BaseModel):
    device_code: str
    user_code: str
    verification_url: str
    expires_in: int
    interval: int


class DeviceTokenRequest(BaseModel):
    device_code: str


class DeviceTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: DeviceTokenUser


class DeviceTokenUser(BaseModel):
    id: str
    email: str
    name: str
    role: str
    plan: str


class DeviceApproveRequest(BaseModel):
    user_code: str


class DeviceApproveResponse(BaseModel):
    approved: bool


# ── Helpers ────────────────────────────────────────────────────────────────


def _generate_user_code() -> str:
    """Generate a human-friendly 8-char code like ABCD-EFGH."""
    chars = string.ascii_uppercase.replace("O", "").replace("I", "").replace("L", "")
    part1 = "".join(secrets.choice(chars) for _ in range(4))
    part2 = "".join(secrets.choice(chars) for _ in range(4))
    return f"{part1}-{part2}"


def _generate_device_code() -> str:
    """Generate a long random device code (not shown to user)."""
    return secrets.token_urlsafe(32)


# ── Endpoints ──────────────────────────────────────────────────────────────


@router.post("/code", response_model=DeviceCodeResponse)
@_device_limiter.limit("10/minute")
async def request_device_code(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> DeviceCodeResponse:
    """
    Step 1 of device flow (RFC 8628).
    CLI calls this to get a device_code + user_code.
    """
    from app.config import get_settings

    settings = get_settings()

    device_code = _generate_device_code()
    user_code = _generate_user_code()
    expires_at = _utcnow() + timedelta(minutes=DEVICE_CODE_EXPIRY_MINUTES)

    session = DeviceAuthSession(
        device_code=device_code,
        user_code=user_code,
        status="pending",
        expires_at=expires_at,
    )
    db.add(session)
    await db.commit()

    verification_url = f"{settings.FRONTEND_URL}/device?code={user_code}"

    return DeviceCodeResponse(
        device_code=device_code,
        user_code=user_code,
        verification_url=verification_url,
        expires_in=DEVICE_CODE_EXPIRY_MINUTES * 60,
        interval=POLL_INTERVAL_SECONDS,
    )


@router.post("/approve", response_model=DeviceApproveResponse)
async def approve_device(
    body: DeviceApproveRequest,
    request: Request,
    current_user: User = Depends(get_active_user),
    db: AsyncSession = Depends(get_db),
) -> DeviceApproveResponse:
    """
    Step 2 of device flow.
    Authenticated user approves a user_code from the dashboard.
    Creates a PAT and stores it on the session for the CLI to pick up.
    """
    locale = get_locale(request)

    result = await db.execute(
        select(DeviceAuthSession).where(
            DeviceAuthSession.user_code == body.user_code,
            DeviceAuthSession.status == "pending",
        )
    )
    session = result.scalar_one_or_none()

    if session is None:
        raise BadRequestException(translate("device.invalid_code", locale))

    if _is_expired(session.expires_at):
        session.status = "expired"
        await db.commit()
        raise BadRequestException(translate("device.code_expired", locale))

    # Clean up old CLI PATs for this user
    old_pats = await db.execute(
        select(PersonalAccessToken).where(
            PersonalAccessToken.user_id == current_user.id,
            PersonalAccessToken.name == "BugSpark CLI",
        )
    )
    for old_pat in old_pats.scalars().all():
        await db.delete(old_pat)
    await db.flush()

    # Create PAT using shared service
    raw_token, pat = create_cli_pat(current_user.id)
    db.add(pat)

    # Mark session as approved and store token
    session.status = "approved"
    session.user_id = current_user.id
    session.token_value = raw_token
    await db.commit()

    return DeviceApproveResponse(approved=True)


@router.post("/token", response_model=DeviceTokenResponse)
@_device_limiter.limit("30/minute")
async def poll_device_token(
    body: DeviceTokenRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> DeviceTokenResponse:
    """
    Step 3 of device flow.
    CLI polls this endpoint until the user approves or the code expires.
    """
    locale = get_locale(request)

    result = await db.execute(
        select(DeviceAuthSession).where(
            DeviceAuthSession.device_code == body.device_code,
        )
    )
    session = result.scalar_one_or_none()

    if session is None:
        raise BadRequestException(translate("device.invalid_code", locale))

    if _is_expired(session.expires_at):
        session.status = "expired"
        await db.commit()
        raise BadRequestException(translate("device.code_expired", locale))

    if session.status == "pending":
        raise UnauthorizedException("authorization_pending")

    if session.status == "expired":
        raise BadRequestException(translate("device.code_expired", locale))

    if session.status != "approved" or session.token_value is None or session.user_id is None:
        raise BadRequestException(translate("device.invalid_code", locale))

    # Fetch the user info
    user_result = await db.execute(select(User).where(User.id == session.user_id))
    user = user_result.scalar_one_or_none()
    if user is None:
        raise BadRequestException(translate("device.invalid_code", locale))

    token = session.token_value

    # Consume the session (one-time use)
    session.status = "consumed"
    session.token_value = None
    await db.commit()

    return DeviceTokenResponse(
        access_token=token,
        token_type="bearer",
        user=DeviceTokenUser(
            id=str(user.id),
            email=user.email,
            name=user.name,
            role=user.role.value if hasattr(user.role, "value") else str(user.role),
            plan=user.plan.value if hasattr(user.plan, "value") else str(user.plan),
        ),
    )
