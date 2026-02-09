from __future__ import annotations

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings


def _create_engine():
    settings = get_settings()
    url = settings.DATABASE_URL

    if url.startswith("sqlite"):
        return create_async_engine(url, echo=False)

    return create_async_engine(
        url,
        echo=False,
        connect_args={"statement_cache_size": 0},
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=5,
        max_overflow=10,
    )


engine = _create_engine()

async_session = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass
