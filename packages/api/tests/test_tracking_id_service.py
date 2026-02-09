from __future__ import annotations

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.services.tracking_id_service import generate_tracking_id


async def test_first_tracking_id_is_bug_0001():
    """generate_tracking_id should return BUG-0001 when counter goes from 0 to 1."""
    mock_result = MagicMock()
    mock_result.scalar_one.return_value = 1

    mock_db = AsyncMock()
    mock_db.execute.return_value = mock_result

    tracking_id = await generate_tracking_id(mock_db, str(uuid.uuid4()))
    assert tracking_id == "BUG-0001"


async def test_increments_tracking_id():
    """generate_tracking_id should use the returned counter value."""
    mock_result = MagicMock()
    mock_result.scalar_one.return_value = 5

    mock_db = AsyncMock()
    mock_db.execute.return_value = mock_result

    tracking_id = await generate_tracking_id(mock_db, str(uuid.uuid4()))
    assert tracking_id == "BUG-0005"


async def test_tracking_id_zero_pads():
    """Tracking IDs should be zero-padded to 4 digits."""
    mock_result = MagicMock()
    mock_result.scalar_one.return_value = 42

    mock_db = AsyncMock()
    mock_db.execute.return_value = mock_result

    tracking_id = await generate_tracking_id(mock_db, str(uuid.uuid4()))
    assert tracking_id == "BUG-0042"


async def test_large_tracking_id():
    """Tracking IDs above 9999 should extend naturally."""
    mock_result = MagicMock()
    mock_result.scalar_one.return_value = 12345

    mock_db = AsyncMock()
    mock_db.execute.return_value = mock_result

    tracking_id = await generate_tracking_id(mock_db, str(uuid.uuid4()))
    assert tracking_id == "BUG-12345"
