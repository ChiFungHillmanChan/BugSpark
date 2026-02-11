"""Tests for background task queue service."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.background_task import BackgroundTask
from app.services.task_queue_service import (
    TASK_HANDLERS,
    _process_single_task,
    enqueue,
    register_handler,
)


@pytest.mark.asyncio
async def test_enqueue_creates_task(db_session: AsyncSession):
    task_id = await enqueue(db_session, "test_task", {"key": "value"})

    result = await db_session.execute(
        select(BackgroundTask).where(BackgroundTask.id == task_id)
    )
    task = result.scalar_one()
    assert task.task_type == "test_task"
    assert task.payload == {"key": "value"}
    assert task.status == "pending"
    assert task.attempts == 0


@pytest.mark.asyncio
async def test_process_task_success(db_session: AsyncSession):
    call_log: list[dict] = []

    async def mock_handler(payload: dict) -> None:
        call_log.append(payload)

    register_handler("test_success", mock_handler)

    try:
        task_id = await enqueue(db_session, "test_success", {"data": 42})
        result = await db_session.execute(
            select(BackgroundTask).where(BackgroundTask.id == task_id)
        )
        task = result.scalar_one()

        success = await _process_single_task(db_session, task)
        assert success is True
        assert task.status == "completed"
        assert len(call_log) == 1
        assert call_log[0] == {"data": 42}
    finally:
        TASK_HANDLERS.pop("test_success", None)


@pytest.mark.asyncio
async def test_process_task_failure_retries(db_session: AsyncSession):
    call_count = 0

    async def failing_handler(payload: dict) -> None:
        nonlocal call_count
        call_count += 1
        raise RuntimeError("Simulated failure")

    register_handler("test_fail", failing_handler)

    try:
        task_id = await enqueue(db_session, "test_fail", {}, max_attempts=3)
        result = await db_session.execute(
            select(BackgroundTask).where(BackgroundTask.id == task_id)
        )
        task = result.scalar_one()

        success = await _process_single_task(db_session, task)
        assert success is False
        assert task.attempts == 1
        assert task.status == "pending"  # Will retry
        assert task.next_retry_at is not None
    finally:
        TASK_HANDLERS.pop("test_fail", None)


@pytest.mark.asyncio
async def test_process_task_failure_permanent(db_session: AsyncSession):
    async def failing_handler(payload: dict) -> None:
        raise RuntimeError("Permanent failure")

    register_handler("test_perm_fail", failing_handler)

    try:
        task_id = await enqueue(db_session, "test_perm_fail", {}, max_attempts=1)
        result = await db_session.execute(
            select(BackgroundTask).where(BackgroundTask.id == task_id)
        )
        task = result.scalar_one()

        success = await _process_single_task(db_session, task)
        assert success is False
        assert task.status == "failed"
        assert "Permanent failure" in (task.error_message or "")
    finally:
        TASK_HANDLERS.pop("test_perm_fail", None)


@pytest.mark.asyncio
async def test_process_task_no_handler(db_session: AsyncSession):
    task_id = await enqueue(db_session, "nonexistent_handler_type", {})
    result = await db_session.execute(
        select(BackgroundTask).where(BackgroundTask.id == task_id)
    )
    task = result.scalar_one()

    success = await _process_single_task(db_session, task)
    assert success is False
    assert task.status == "failed"
    assert "No handler" in (task.error_message or "")
