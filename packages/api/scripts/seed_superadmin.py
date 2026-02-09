"""Seed or promote a superadmin user for BugSpark.

Reads SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD from environment / .env.
If the user already exists, promotes them to superadmin + enterprise.
If the user does not exist, creates them.
Safe to run on every deploy (idempotent).

Run with: python scripts/seed_superadmin.py
Must be executed from the packages/api/ directory.
"""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select

from app.config import get_settings
from app.database import Base, async_session, engine
from app.models.enums import Plan, Role
from app.models.user import User
from app.services.auth_service import hash_password


async def seed_superadmin() -> None:
    settings = get_settings()
    email = settings.SUPERADMIN_EMAIL
    password = settings.SUPERADMIN_PASSWORD

    if not email or not password:
        print("SUPERADMIN_EMAIL or SUPERADMIN_PASSWORD not set. Skipping.")
        return

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if user is not None:
            user.role = Role.SUPERADMIN
            user.plan = Plan.ENTERPRISE
            user.is_active = True
            await db.commit()
            print(f"Promoted existing user {email} to superadmin + enterprise.")
        else:
            user = User(
                email=email,
                hashed_password=hash_password(password),
                name=email.split("@")[0],
                role=Role.SUPERADMIN,
                plan=Plan.ENTERPRISE,
            )
            db.add(user)
            await db.commit()
            print(f"Created superadmin user: {email}")


if __name__ == "__main__":
    asyncio.run(seed_superadmin())
