from __future__ import annotations

import re
from html import escape


_HTML_TAG_PATTERN = re.compile(r"<[^>]+>")


def sanitize_text(value: str) -> str:
    """Strip HTML tags and escape remaining entities to prevent XSS."""
    stripped = _HTML_TAG_PATTERN.sub("", value)
    return escape(stripped)
