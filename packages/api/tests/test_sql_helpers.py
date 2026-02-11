"""Tests for SQL LIKE escape utility."""
from __future__ import annotations

from app.utils.sql_helpers import escape_like


def test_escapes_percent():
    assert escape_like("100%") == "100\\%"


def test_escapes_underscore():
    assert escape_like("user_name") == "user\\_name"


def test_escapes_backslash():
    assert escape_like("path\\to\\file") == "path\\\\to\\\\file"


def test_escapes_all_special_chars():
    result = escape_like("%_\\")
    assert result == "\\%\\_\\\\"


def test_plain_text_unchanged():
    text = "normal search term"
    assert escape_like(text) == text


def test_empty_string():
    assert escape_like("") == ""


def test_mixed_content():
    result = escape_like("10% of users_active")
    assert result == "10\\% of users\\_active"
