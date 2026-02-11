from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, Depends
from httpx import HTTPStatusError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_accessible_project, get_current_user, get_db, get_owned_project
from app.exceptions import BadRequestException, ForbiddenException, NotFoundException
from app.models.enums import Role
from app.models.integration import Integration
from app.models.project import Project
from app.models.report import Report
from app.models.user import User
from app.schemas.integration import (
    ExportResponse,
    IntegrationCreate,
    IntegrationResponse,
    IntegrationUpdate,
)
from app.services.github_integration import (
    create_github_issue,
    format_report_as_github_issue,
)
from app.services.linear_integration import (
    create_linear_issue,
    format_report_as_linear_issue,
)
from app.utils.encryption import decrypt_value, encrypt_value

# Config keys that contain sensitive tokens
_SENSITIVE_CONFIG_KEYS = {"token", "apiKey", "api_key", "secret", "access_token"}


def _encrypt_config(config: dict) -> dict:
    """Encrypt sensitive values in an integration config dict."""
    return {
        k: encrypt_value(v) if k in _SENSITIVE_CONFIG_KEYS and isinstance(v, str) else v
        for k, v in config.items()
    }


def _decrypt_config(config: dict) -> dict:
    """Decrypt sensitive values in an integration config dict."""
    return {
        k: decrypt_value(v) if k in _SENSITIVE_CONFIG_KEYS and isinstance(v, str) else v
        for k, v in config.items()
    }

logger = logging.getLogger(__name__)

router = APIRouter(tags=["integrations"])


@router.post(
    "/projects/{project_id}/integrations",
    response_model=IntegrationResponse,
    status_code=201,
)
async def create_integration(
    project_id: uuid.UUID,
    body: IntegrationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> IntegrationResponse:
    project = await get_owned_project(project_id, current_user, db)

    integration = Integration(
        project_id=project.id,
        provider=body.provider,
        config=_encrypt_config(body.config),
    )
    db.add(integration)
    await db.commit()
    await db.refresh(integration)

    return IntegrationResponse.from_integration(integration)


@router.get(
    "/projects/{project_id}/integrations",
    response_model=list[IntegrationResponse],
)
async def list_integrations(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[IntegrationResponse]:
    await get_accessible_project(project_id, current_user, db)

    result = await db.execute(
        select(Integration).where(Integration.project_id == project_id)
    )
    integrations = result.scalars().all()
    return [IntegrationResponse.from_integration(i) for i in integrations]


@router.patch(
    "/integrations/{integration_id}",
    response_model=IntegrationResponse,
)
async def update_integration(
    integration_id: uuid.UUID,
    body: IntegrationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> IntegrationResponse:
    result = await db.execute(
        select(Integration).where(Integration.id == integration_id)
    )
    integration = result.scalar_one_or_none()
    if integration is None:
        raise NotFoundException("Integration not found")

    await get_owned_project(integration.project_id, current_user, db)

    update_data = body.model_dump(exclude_unset=True)
    if "config" in update_data and update_data["config"] is not None:
        merged_config = {**integration.config, **_encrypt_config(update_data["config"])}
        integration.config = merged_config
        del update_data["config"]

    for field, value in update_data.items():
        setattr(integration, field, value)

    await db.commit()
    await db.refresh(integration)

    return IntegrationResponse.from_integration(integration)


@router.delete("/integrations/{integration_id}", status_code=204)
async def delete_integration(
    integration_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(
        select(Integration).where(Integration.id == integration_id)
    )
    integration = result.scalar_one_or_none()
    if integration is None:
        raise NotFoundException("Integration not found")

    await get_owned_project(integration.project_id, current_user, db)

    await db.delete(integration)
    await db.commit()


@router.post(
    "/reports/{report_id}/export/{provider}",
    response_model=ExportResponse,
)
async def export_report_to_tracker(
    report_id: uuid.UUID,
    provider: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ExportResponse:
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if report is None:
        raise NotFoundException("Report not found")

    user_project_ids = select(Project.id).where(Project.owner_id == current_user.id)
    project_check = await db.execute(
        select(Project.id).where(
            Project.id == report.project_id,
            Project.id.in_(user_project_ids),
        )
    )
    if project_check.scalar_one_or_none() is None:
        raise ForbiddenException("Not authorized to export this report")

    integration_result = await db.execute(
        select(Integration).where(
            Integration.project_id == report.project_id,
            Integration.provider == provider,
            Integration.is_active.is_(True),
        )
    )
    integration = integration_result.scalar_one_or_none()
    if integration is None:
        raise NotFoundException(f"No active {provider} integration found for this project")

    if provider == "github":
        config = _decrypt_config(integration.config)
        body = format_report_as_github_issue(report)

        try:
            issue_data = await create_github_issue(
                token=config["token"],
                owner=config["owner"],
                repo=config["repo"],
                title=f"[{report.tracking_id}] {report.title}",
                body=body,
                labels=["bug", report.severity.value],
            )
        except HTTPStatusError as exc:
            logger.warning("GitHub API error: %s", exc.response.text)
            raise BadRequestException(
                f"GitHub API error: {exc.response.status_code}"
            )

        return ExportResponse(
            issue_url=issue_data["html_url"],
            issue_number=issue_data["number"],
        )

    elif provider == "linear":
        config = _decrypt_config(integration.config)
        formatted = format_report_as_linear_issue(report)

        issue_data = await create_linear_issue(
            api_key=config["apiKey"],
            team_id=config["teamId"],
            title=formatted.title,
            description=formatted.description,
            priority=formatted.priority,
        )

        return ExportResponse(
            issue_url=issue_data["issue_url"],
            issue_number=0,
            issue_identifier=issue_data["issue_identifier"],
        )

    raise BadRequestException(f"Unsupported provider: {provider}")
