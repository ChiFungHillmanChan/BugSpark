from __future__ import annotations

import secrets
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.exceptions import ForbiddenException, NotFoundException
from app.models.project import Project
from app.models.user import User
from app.models.webhook import Webhook
from app.schemas.webhook import WebhookCreate, WebhookResponse, WebhookUpdate
from app.utils.encryption import encrypt_value
from app.utils.url_validator import validate_webhook_url

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


async def _verify_project_ownership(
    project_id: uuid.UUID, user: User, db: AsyncSession
) -> None:
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if project is None:
        raise NotFoundException("Project not found")
    if project.owner_id != user.id:
        raise ForbiddenException("Not the project owner")


@router.post("", response_model=WebhookResponse, status_code=201)
async def create_webhook(
    body: WebhookCreate,
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> WebhookResponse:
    await _verify_project_ownership(project_id, current_user, db)

    validate_webhook_url(body.url)

    webhook = Webhook(
        project_id=project_id,
        url=body.url,
        events=body.events,
        secret=encrypt_value(secrets.token_hex(32)),
    )
    db.add(webhook)
    await db.commit()
    await db.refresh(webhook)

    return WebhookResponse.model_validate(webhook)


@router.get("", response_model=list[WebhookResponse])
async def list_webhooks(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[WebhookResponse]:
    await _verify_project_ownership(project_id, current_user, db)

    result = await db.execute(
        select(Webhook).where(Webhook.project_id == project_id)
    )
    webhooks = result.scalars().all()
    return [WebhookResponse.model_validate(w) for w in webhooks]


@router.patch("/{webhook_id}", response_model=WebhookResponse)
async def update_webhook(
    webhook_id: uuid.UUID,
    body: WebhookUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> WebhookResponse:
    result = await db.execute(select(Webhook).where(Webhook.id == webhook_id))
    webhook = result.scalar_one_or_none()

    if webhook is None:
        raise NotFoundException("Webhook not found")

    await _verify_project_ownership(webhook.project_id, current_user, db)

    update_data = body.model_dump(exclude_unset=True)
    if "url" in update_data:
        validate_webhook_url(update_data["url"])
    for field, value in update_data.items():
        setattr(webhook, field, value)

    await db.commit()
    await db.refresh(webhook)

    return WebhookResponse.model_validate(webhook)


@router.delete("/{webhook_id}", status_code=204)
async def delete_webhook(
    webhook_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(select(Webhook).where(Webhook.id == webhook_id))
    webhook = result.scalar_one_or_none()

    if webhook is None:
        raise NotFoundException("Webhook not found")

    await _verify_project_ownership(webhook.project_id, current_user, db)

    await db.delete(webhook)
    await db.commit()
