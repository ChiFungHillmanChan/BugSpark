from __future__ import annotations

from enum import Enum


class Role(str, Enum):
    USER = "user"
    ADMIN = "admin"
    SUPERADMIN = "superadmin"


class Plan(str, Enum):
    FREE = "free"
    STARTER = "starter"
    TEAM = "team"
    ENTERPRISE = "enterprise"


class BetaStatus(str, Enum):
    NONE = "none"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
