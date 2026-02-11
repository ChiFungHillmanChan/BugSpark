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
        connect_args={
            "statement_cache_size": 0,
            "command_timeout": 30,
        },
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=3,
        max_overflow=7,
        pool_timeout=30,
    )


engine = _create_engine()

async_session = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass
