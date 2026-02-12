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
os.environ["JWT_SECRET"] = "test-secret-key-that-is-at-least-32-bytes-long"
os.environ["JWT_ALGORITHM"] = "HS256"
os.environ["S3_BUCKET_NAME"] = "bugspark-uploads"

# Clear settings cache so test env vars take effect
from app.config import get_settings

get_settings.cache_clear()

from app.database import Base  # noqa: E402
from app.dependencies import get_db  # noqa: E402
from app.models.app_settings import AppSettings  # noqa: E402
from app.models.enums import BetaStatus, Plan, Role  # noqa: E402
from app.models.project import Project  # noqa: E402
from app.models.user import User  # noqa: E402
from app.routers.projects import _api_key_prefix, _generate_api_key, _hash_api_key  # noqa: E402
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


@pytest.fixture(autouse=True)
def _reset_rate_limiter():
    """Reset rate-limiter storage before each test to avoid 429 errors."""
    from app.rate_limiter import limiter

    try:
        limiter.reset()
    except Exception:
        pass
    yield


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
    import app.database as db_module

    app.dependency_overrides[get_db] = _override_get_db
    # Override the global async_session so background tasks use the test DB
    original_session = db_module.async_session
    db_module.async_session = session_factory
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
    db_module.async_session = original_session


@pytest.fixture()
async def test_user(db_session: AsyncSession) -> User:
    user = User(
        id=uuid.uuid4(),
        email="testuser@example.com",
        hashed_password=hash_password("TestPassword123!"),
        name="Test User",
        role=Role.USER,
        plan=Plan.FREE,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture()
async def test_superadmin(db_session: AsyncSession) -> User:
    user = User(
        id=uuid.uuid4(),
        email="superadmin@example.com",
        hashed_password=hash_password("SuperAdmin123!"),
        name="Super Admin",
        role=Role.SUPERADMIN,
        plan=Plan.ENTERPRISE,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


CSRF_TEST_TOKEN = "test-csrf-token"


@pytest.fixture()
def auth_cookies(test_user: User) -> dict[str, str]:
    token = create_access_token(str(test_user.id), test_user.email)
    return {
        "bugspark_access_token": token,
        "bugspark_csrf_token": CSRF_TEST_TOKEN,
    }


@pytest.fixture()
def superadmin_cookies(test_superadmin: User) -> dict[str, str]:
    token = create_access_token(str(test_superadmin.id), test_superadmin.email)
    return {
        "bugspark_access_token": token,
        "bugspark_csrf_token": CSRF_TEST_TOKEN,
    }


@pytest.fixture()
def csrf_headers() -> dict[str, str]:
    return {"X-CSRF-Token": CSRF_TEST_TOKEN}


@pytest.fixture()
async def test_project(db_session: AsyncSession, test_user: User) -> tuple[Project, str]:
    raw_key = _generate_api_key()
    project = Project(
        id=uuid.uuid4(),
        owner_id=test_user.id,
        name="Test Project",
        domain="example.com",
        api_key_hash=_hash_api_key(raw_key),
        api_key_prefix=_api_key_prefix(raw_key),
        settings={},
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(project)
    await db_session.commit()
    await db_session.refresh(project)
    return project, raw_key


@pytest.fixture()
async def beta_mode_off(db_session: AsyncSession) -> AppSettings:
    """Seed AppSettings with beta_mode_enabled=False (open registration)."""
    settings = AppSettings(id=1, beta_mode_enabled=False)
    db_session.add(settings)
    await db_session.commit()
    await db_session.refresh(settings)
    return settings


@pytest.fixture()
async def beta_mode_on(db_session: AsyncSession) -> AppSettings:
    """Seed AppSettings with beta_mode_enabled=True (beta gated registration)."""
    settings = AppSettings(id=1, beta_mode_enabled=True)
    db_session.add(settings)
    await db_session.commit()
    await db_session.refresh(settings)
    return settings


@pytest.fixture()
async def google_oauth_user(db_session: AsyncSession) -> User:
    """A user authenticated via Google OAuth (has google_id, no password)."""
    user = User(
        id=uuid.uuid4(),
        email="googleuser@gmail.com",
        hashed_password=None,
        google_id="google_12345",
        name="Google User",
        role=Role.USER,
        plan=Plan.FREE,
        is_active=True,
        is_email_verified=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture()
def google_oauth_cookies(google_oauth_user: User) -> dict[str, str]:
    token = create_access_token(str(google_oauth_user.id), google_oauth_user.email)
    return {
        "bugspark_access_token": token,
        "bugspark_csrf_token": CSRF_TEST_TOKEN,
    }


@pytest.fixture()
async def pending_beta_user(db_session: AsyncSession) -> User:
    """A user with beta_status=PENDING (on waiting list)."""
    user = User(
        id=uuid.uuid4(),
        email="betapending@example.com",
        hashed_password=hash_password("BetaPass123!"),
        name="Beta Pending User",
        role=Role.USER,
        plan=Plan.FREE,
        is_active=True,
        beta_status=BetaStatus.PENDING,
        beta_applied_at=datetime.now(timezone.utc),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture()
async def rejected_beta_user(db_session: AsyncSession) -> User:
    """A user with beta_status=REJECTED."""
    user = User(
        id=uuid.uuid4(),
        email="betarejected@example.com",
        hashed_password=hash_password("BetaPass123!"),
        name="Beta Rejected User",
        role=Role.USER,
        plan=Plan.FREE,
        is_active=True,
        beta_status=BetaStatus.REJECTED,
        beta_applied_at=datetime.now(timezone.utc),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture()
async def approved_beta_user(db_session: AsyncSession) -> User:
    """A user with beta_status=APPROVED (allowed to login)."""
    user = User(
        id=uuid.uuid4(),
        email="betaapproved@example.com",
        hashed_password=hash_password("BetaPass123!"),
        name="Beta Approved User",
        role=Role.USER,
        plan=Plan.FREE,
        is_active=True,
        beta_status=BetaStatus.APPROVED,
        beta_applied_at=datetime.now(timezone.utc),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


# Fixture aliases for backward compatibility
@pytest.fixture()
async def db(db_session: AsyncSession) -> AsyncSession:
    """Alias for db_session."""
    return db_session


@pytest.fixture()
async def user(test_user: User) -> User:
    """Alias for test_user."""
    return test_user


@pytest.fixture()
async def project(test_project: tuple[Project, str]) -> Project:
    """Alias for test_project that returns just the project."""
    return test_project[0]
