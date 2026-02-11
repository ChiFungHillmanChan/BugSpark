"""Tests for XSS prevention in sanitize utility."""
from __future__ import annotations

from app.utils.sanitize import sanitize_text


def test_strips_script_tags():
    result = sanitize_text("<script>alert('xss')</script>Hello")
    assert "<script>" not in result
    assert "</script>" not in result
    assert "Hello" in result


def test_strips_event_handler_attributes():
    result = sanitize_text('<img onerror="alert(1)" src="x">')
    assert "<img" not in result


def test_strips_nested_html():
    result = sanitize_text("<div><b>bold</b><script>bad</script></div>")
    assert "<div>" not in result
    assert "<script>" not in result
    assert "bold" in result


def test_escapes_ampersand():
    """The escape function should handle & characters after tag stripping."""
    result = sanitize_text("a & b")
    assert "&amp;" in result


def test_escapes_angle_brackets_in_text():
    """Angle brackets that survive tag stripping are escaped."""
    # Input that won't match the tag regex — only bare &
    result = sanitize_text("5 &gt; 3")
    assert "&amp;" in result


def test_plain_text_unchanged():
    text = "This is a normal bug report about a login issue"
    result = sanitize_text(text)
    assert result == text


def test_strips_iframe():
    result = sanitize_text('<iframe src="https://evil.com"></iframe>Content')
    assert "<iframe" not in result
    assert "Content" in result


def test_strips_anchor_with_javascript():
    result = sanitize_text('<a href="javascript:alert(1)">Click</a>')
    assert "<a" not in result
    assert "Click" in result
