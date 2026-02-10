"""Shared SQL utility functions."""
from __future__ import annotations


def escape_like(value: str) -> str:
    """Escape %, _, and \\ so they are treated as literal characters in LIKE patterns."""
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
