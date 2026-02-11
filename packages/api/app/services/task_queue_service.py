from __future__ import annotations

import asyncio
import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Callable, Coroutine

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.models.background_task import BackgroundTask

logger = logging.getLogger(__name__)

POLL_INTERVAL_SECONDS = 10
BASE_RETRY_DELAY_SECONDS = 30
TASK_TTL_DAYS = 7

TaskHandler = Callable[[dict], Coroutine[None, None, None]]

TASK_HANDLERS: dict[str, TaskHandler] = {}


def register_handler(task_type: str, handler: TaskHandler) -> None:
    """Register a handler function for a specific task type."""
    TASK_HANDLERS[task_type] = handler


async def enqueue(
    db: AsyncSession,
    task_type: str,
    payload: dict,
    max_attempts: int = 3,
) -> uuid.UUID:
    """Create a new background task record and return its ID."""
    task = BackgroundTask(
        task_type=task_type,
        payload=payload,
        max_attempts=max_attempts,
    )
    db.add(task)
    await db.flush()
    task_id = task.id
    await db.commit()
    logger.info("Enqueued task %s (type=%s)", task_id, task_type)
    return task_id


async def _process_single_task(db: AsyncSession, task: BackgroundTask) -> bool:
    """Process one task. Returns True on success, False on failure."""
    handler = TASK_HANDLERS.get(task.task_type)
    if handler is None:
        logger.error("No handler registered for task type: %s", task.task_type)
        task.status = "failed"
        task.error_message = f"No handler for task type: {task.task_type}"
        await db.commit()
        return False

    try:
        await handler(task.payload)
        task.status = "completed"
        task.completed_at = datetime.now(timezone.utc)
        await db.commit()
        logger.info("Task %s completed successfully", task.id)
        return True
    except Exception as exc:
        task.attempts += 1
        if task.attempts >= task.max_attempts:
            task.status = "failed"
            task.error_message = str(exc)[:1000]
            logger.warning(
                "Task %s failed permanently after %d attempts: %s",
                task.id, task.attempts, exc,
            )
        else:
            delay = BASE_RETRY_DELAY_SECONDS * (2 ** task.attempts)
            task.next_retry_at = datetime.now(timezone.utc) + timedelta(seconds=delay)
            task.status = "pending"
            task.error_message = str(exc)[:1000]
            logger.info(
                "Task %s attempt %d failed, retrying in %ds: %s",
                task.id, task.attempts, delay, exc,
            )
        await db.commit()
        return False


async def process_pending_tasks() -> int:
    """Find and process all pending tasks that are ready. Returns count processed.

    Uses FOR UPDATE SKIP LOCKED (on PostgreSQL) to prevent duplicate processing
    across multiple workers. Falls back to simple SELECT on SQLite (tests).
    """
    now = datetime.now(timezone.utc)
    processed = 0

    async with async_session() as db:
        base_query = (
            select(BackgroundTask)
            .where(
                BackgroundTask.status == "pending",
            )
            .where(
                (BackgroundTask.next_retry_at.is_(None))
                | (BackgroundTask.next_retry_at <= now)
            )
            .order_by(BackgroundTask.created_at)
            .limit(20)
        )

        # Use FOR UPDATE SKIP LOCKED on PostgreSQL to prevent race conditions
        dialect_name = db.bind.dialect.name if db.bind else ""
        if dialect_name == "postgresql":
            base_query = base_query.with_for_update(skip_locked=True)

        result = await db.execute(base_query)
        tasks = result.scalars().all()

        for task in tasks:
            # Mark as processing to prevent double-pickup
            task.status = "processing"
            await db.commit()

            await _process_single_task(db, task)
            processed += 1

    return processed


async def cleanup_old_tasks() -> int:
    """Delete completed/failed tasks older than TASK_TTL_DAYS. Returns count deleted."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=TASK_TTL_DAYS)

    async with async_session() as db:
        result = await db.execute(
            delete(BackgroundTask).where(
                BackgroundTask.status.in_(["completed", "failed"]),
                BackgroundTask.created_at < cutoff,
            )
        )
        await db.commit()
        return result.rowcount


async def start_task_processor() -> None:
    """Infinite polling loop that processes pending background tasks."""
    logger.info("Background task processor started (polling every %ds)", POLL_INTERVAL_SECONDS)
    cleanup_counter = 0
    while True:
        try:
            count = await process_pending_tasks()
            if count > 0:
                logger.info("Processed %d background tasks", count)

            # Run cleanup every ~100 iterations (~17 minutes at 10s intervals)
            cleanup_counter += 1
            if cleanup_counter >= 100:
                cleanup_counter = 0
                deleted = await cleanup_old_tasks()
                if deleted > 0:
                    logger.info("Cleaned up %d old tasks", deleted)
        except Exception as exc:
            logger.error("Task processor error: %s", exc)
        await asyncio.sleep(POLL_INTERVAL_SECONDS)


def _register_default_handlers() -> None:
    """Register built-in task handlers for webhook delivery and email sending."""

    async def handle_webhook(payload: dict) -> None:
        from app.services.webhook_service import deliver_webhook_from_payload
        await deliver_webhook_from_payload(payload)

    async def handle_email(payload: dict) -> None:
        from app.services.email_service import send_email

        success = await send_email(
            to=payload["to"],
            subject=payload["subject"],
            html=payload["html"],
        )
        if not success:
            raise RuntimeError(f"Email delivery failed for {payload['to']}")

    register_handler("webhook_delivery", handle_webhook)
    register_handler("send_email", handle_email)


# Auto-register default handlers on import
_register_default_handlers()
