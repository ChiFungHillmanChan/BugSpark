"""Seed script for BugSpark development database.

Run with: python scripts/seed.py
Must be executed from the packages/api/ directory.
"""
from __future__ import annotations

import asyncio
import random
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Ensure the package root is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select

from app.database import Base, async_session, engine
from app.models.comment import Comment
from app.models.enums import Plan, Role
from app.models.project import Project
from app.models.report import Category, Report, Severity, Status
from app.models.user import User
from app.routers.projects import _api_key_prefix, _generate_api_key, _hash_api_key
from app.services.auth_service import hash_password

DEMO_EMAIL = "test@bugspark.dev"
DEMO_PASSWORD = "password123"
DEMO_NAME = "Test User"

PROJECTS = [
    {"name": "Acme Web App", "domain": "acme.example.com"},
    {"name": "Widget Dashboard", "domain": "widgets.example.com"},
]

SAMPLE_TITLES = [
    "Login button unresponsive on mobile",
    "Dashboard charts not loading",
    "Form validation error on email field",
    "Page crashes when uploading large files",
    "Navigation menu overlaps content",
    "Search results return empty for valid queries",
    "Profile image upload fails silently",
    "Notification bell shows wrong count",
    "Table sorting broken on date column",
    "Dark mode toggle doesn't persist",
    "API timeout on project list",
    "Dropdown menu clips at screen edge",
    "Export CSV produces corrupt file",
    "Password reset link expires too quickly",
    "Sidebar collapses unexpectedly on resize",
    "Tooltip positioning is off on Firefox",
    "Pagination skips page 2",
    "File drag-and-drop not working in Safari",
    "Keyboard shortcuts conflict with browser",
    "Logout doesn't clear session properly",
]

SAMPLE_DESCRIPTIONS = [
    "Steps to reproduce: 1) Navigate to the page 2) Click the element 3) Observe the error",
    "This issue occurs intermittently, roughly 1 in 5 page loads. Console shows a TypeError.",
    "Users reported this after the latest deployment. Rollback did not fix the issue.",
    "Affects all browsers on desktop. Mobile browsers seem unaffected.",
    "The issue is consistent and blocks the user workflow entirely.",
]


def _random_console_logs() -> dict:
    return {"entries": [
        {"level": "error", "message": "TypeError: Cannot read property 'map' of undefined", "timestamp": "2024-01-15T10:30:00Z"},
        {"level": "warn", "message": "React does not recognize the `isActive` prop", "timestamp": "2024-01-15T10:30:01Z"},
    ]}


def _random_network_logs() -> dict:
    return {"entries": [
        {"method": "GET", "url": "/api/v1/projects", "status": 500, "duration_ms": 1200},
        {"method": "POST", "url": "/api/v1/reports", "status": 201, "duration_ms": 340},
    ]}


def _random_user_actions() -> dict:
    return {"actions": [
        {"type": "click", "target": "button.submit", "timestamp": "2024-01-15T10:29:55Z"},
        {"type": "input", "target": "input[name=email]", "value": "user@test.com", "timestamp": "2024-01-15T10:29:50Z"},
        {"type": "navigation", "url": "/dashboard", "timestamp": "2024-01-15T10:29:45Z"},
    ]}


def _random_metadata() -> dict:
    return {
        "browser": random.choice(["Chrome 120", "Firefox 121", "Safari 17"]),
        "os": random.choice(["macOS 14.2", "Windows 11", "Ubuntu 22.04"]),
        "viewport": random.choice(["1920x1080", "1440x900", "375x812"]),
        "sdk_version": "0.1.0",
    }


async def seed() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        existing = await db.execute(select(User).where(User.email == DEMO_EMAIL))
        if existing.scalar_one_or_none() is not None:
            print("Seed data already exists. Skipping.")
            return

        user = User(
            email=DEMO_EMAIL,
            hashed_password=hash_password(DEMO_PASSWORD),
            name=DEMO_NAME,
            role=Role.USER,
            plan=Plan.FREE,
        )
        db.add(user)
        await db.flush()

        created_projects: list[Project] = []
        raw_keys: list[str] = []
        for project_data in PROJECTS:
            raw_key = _generate_api_key()
            raw_keys.append(raw_key)
            project = Project(
                owner_id=user.id,
                name=project_data["name"],
                domain=project_data["domain"],
                api_key_hash=_hash_api_key(raw_key),
                api_key_prefix=_api_key_prefix(raw_key),
            )
            db.add(project)
            created_projects.append(project)

        await db.flush()

        severities = list(Severity)
        categories = list(Category)
        statuses = list(Status)

        for i in range(20):
            project = random.choice(created_projects)
            days_ago = random.randint(0, 30)
            created_at = datetime.now(timezone.utc) - timedelta(days=days_ago)

            report = Report(
                project_id=project.id,
                tracking_id=f"BUG-{i + 1:04d}",
                title=SAMPLE_TITLES[i],
                description=random.choice(SAMPLE_DESCRIPTIONS),
                severity=random.choice(severities),
                category=random.choice(categories),
                status=random.choice(statuses),
                console_logs=_random_console_logs() if random.random() > 0.3 else None,
                network_logs=_random_network_logs() if random.random() > 0.3 else None,
                user_actions=_random_user_actions() if random.random() > 0.5 else None,
                metadata_=_random_metadata(),
                reporter_identifier=random.choice([None, "user@example.com", "anon_user_42"]),
                created_at=created_at,
            )
            db.add(report)

        await db.commit()
        print(f"Seeded: 1 user, {len(created_projects)} projects, 20 reports")
        print(f"  Email: {DEMO_EMAIL}")
        print(f"  Password: {DEMO_PASSWORD}")
        for i, key in enumerate(raw_keys):
            print(f"  Project {i + 1} API Key: {key}")


if __name__ == "__main__":
    asyncio.run(seed())
