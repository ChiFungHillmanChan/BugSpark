from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from typing import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import JSON, String, Text, TypeDecorator, event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

# Set test environment before any app imports
os.environ["DATABASE_URL"] = "sqlite+aiosqlite://"
os.environ["JWT_SECRET"] = "change-me-in-production"
os.environ["JWT_ALGORITHM"] = "HS256"
os.environ["S3_BUCKET_NAME"] = "bugspark-uploads"

# Clear settings cache so test env vars take effect
from app.config import get_settings

get_settings.cache_clear()

from app.database import Base  # noqa: E402
from app.dependencies import get_db  # noqa: E402
from app.models.project import Project  # noqa: E402
from app.models.user import User  # noqa: E402
from app.routers.projects import _generate_api_key, _generate_api_secret  # noqa: E402
from app.services.auth_service import create_access_token, hash_password  # noqa: E402

# ---------- SQLite-compatible type overrides ----------
# SQLite does not support PostgreSQL JSONB or PostgreSQL ARRAY.

import sqlalchemy.dialects.postgresql.json as pg_json  # noqa: E402
import sqlalchemy.sql.sqltypes as sqltypes  # noqa: E402


class _SQLiteUUID(TypeDecorator):
    """Store UUIDs as plain strings in SQLite."""

    impl = String(36)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            return str(value)
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            return uuid.UUID(value) if not isinstance(value, uuid.UUID) else value
        return value


class _SQLiteJSONB(TypeDecorator):
    impl = JSON
    cache_ok = True


class _SQLiteARRAY(TypeDecorator):
    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            return json.dumps(value)
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            return json.loads(value)
        return value


def _patch_pg_types_for_sqlite() -> None:
    """Replace PostgreSQL-specific column types with SQLite-compatible ones."""
    for table in Base.metadata.tables.values():
        for column in table.columns:
            if isinstance(column.type, sqltypes.Uuid):
                column.type = _SQLiteUUID()
            elif isinstance(column.type, pg_json.JSONB):
                column.type = _SQLiteJSONB()
            elif isinstance(column.type, sqltypes.ARRAY):
                column.type = _SQLiteARRAY()


# Apply patches once at import time
_patch_pg_types_for_sqlite()

TEST_DATABASE_URL = "sqlite+aiosqlite://"


@pytest.fixture(autouse=True)
def _clear_settings_cache():
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture()
async def db_engine():
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine.sync_engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, _connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture()
async def db_session(db_engine) -> AsyncGenerator[AsyncSession, None]:
    session_factory = async_sessionmaker(db_engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session


@pytest.fixture()
async def client(db_engine) -> AsyncGenerator[AsyncClient, None]:
    session_factory = async_sessionmaker(db_engine, expire_on_commit=False)

    async def _override_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with session_factory() as session:
            yield session

    from app.main import app

    app.dependency_overrides[get_db] = _override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture()
async def test_user(db_session: AsyncSession) -> User:
    user = User(
        id=uuid.uuid4(),
        email="testuser@example.com",
        hashed_password=hash_password("TestPassword123!"),
        name="Test User",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture()
def auth_headers(test_user: User) -> dict[str, str]:
    token = create_access_token(str(test_user.id), test_user.email)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
async def test_project(db_session: AsyncSession, test_user: User) -> Project:
    project = Project(
        id=uuid.uuid4(),
        owner_id=test_user.id,
        name="Test Project",
        domain="example.com",
        api_key=_generate_api_key(),
        api_secret=_generate_api_secret(),
        settings={},
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(project)
    await db_session.commit()
    await db_session.refresh(project)
    return project
