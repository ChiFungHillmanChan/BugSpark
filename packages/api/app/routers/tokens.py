from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.exceptions import ForbiddenException, NotFoundException
from app.i18n import get_locale, translate
from app.models.personal_access_token import PersonalAccessToken
from app.models.user import User
from app.schemas.token import TokenCreateRequest, TokenCreateResponse, TokenResponse
from app.services.auth_service import PAT_PREFIX, PAT_PREFIX_LEN

router = APIRouter(prefix="/auth/tokens", tags=["tokens"])


def _generate_and_create_pat(
    user_id: uuid.UUID,
    name: str,
    expires_in_days: int | None,
) -> tuple[str, PersonalAccessToken]:
    """Generate a PAT and return (raw_token, PersonalAccessToken model)."""
    import hashlib
    import secrets

    raw_token = f"{PAT_PREFIX}{secrets.token_urlsafe(48)}="
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    token_prefix = raw_token[:PAT_PREFIX_LEN]

    expires_at = None
    if expires_in_days is not None:
        expires_at = datetime.now(timezone.utc) + timedelta(days=expires_in_days)

    pat = PersonalAccessToken(
        user_id=user_id,
        name=name,
        token_hash=token_hash,
        token_prefix=token_prefix,
        expires_at=expires_at,
    )
    return raw_token, pat


@router.post("", response_model=TokenCreateResponse, status_code=201)
async def create_token(
    body: TokenCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TokenCreateResponse:
    raw_token, pat = _generate_and_create_pat(
        current_user.id, body.name, body.expires_in_days
    )
    db.add(pat)
    await db.commit()
    await db.refresh(pat)

    return TokenCreateResponse(
        id=pat.id,
        name=pat.name,
        token=raw_token,
        expires_at=pat.expires_at,
        created_at=pat.created_at,
    )


@router.get("", response_model=list[TokenResponse])
async def list_tokens(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[TokenResponse]:
    result = await db.execute(
        select(PersonalAccessToken)
        .where(PersonalAccessToken.user_id == current_user.id)
        .order_by(PersonalAccessToken.created_at.desc())
    )
    tokens = result.scalars().all()

    return [
        TokenResponse(
            id=t.id,
            name=t.name,
            token_prefix=t.token_prefix + "...",
            last_used_at=t.last_used_at,
            expires_at=t.expires_at,
            created_at=t.created_at,
        )
        for t in tokens
    ]


@router.delete("/{token_id}", status_code=204)
async def revoke_token(
    token_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    locale = get_locale(request)

    result = await db.execute(
        select(PersonalAccessToken).where(PersonalAccessToken.id == token_id)
    )
    pat = result.scalar_one_or_none()

    if pat is None:
        raise NotFoundException(translate("token.not_found", locale))

    if pat.user_id != current_user.id:
        raise ForbiddenException(translate("token.not_owner", locale))

    await db.delete(pat)
    await db.commit()
