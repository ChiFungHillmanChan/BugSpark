from __future__ import annotations

import json
import logging
from typing import Any

import anthropic

from app.config import get_settings

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = (
    "You are a bug-triage assistant. Analyze the provided bug report data and "
    "respond with a JSON object containing exactly these fields:\n"
    '- "summary": a concise 1-2 sentence summary of the bug\n'
    '- "suggestedCategory": one of "bug", "ui", "performance", "crash", "other"\n'
    '- "suggestedSeverity": one of "critical", "high", "medium", "low"\n'
    '- "reproductionSteps": an array of step strings to reproduce the issue\n'
    "Respond ONLY with valid JSON. No markdown fences, no extra text."
)


def _format_logs(logs: list[Any] | dict[str, Any] | None) -> str:
    if not logs:
        return "None"
    entries = logs if isinstance(logs, list) else [logs]
    lines: list[str] = []
    for entry in entries[:30]:
        if isinstance(entry, dict):
            level = entry.get("level", "")
            message = entry.get("message", "")
            lines.append(f"[{level}] {message}")
        else:
            lines.append(str(entry))
    return "\n".join(lines) or "None"


def _format_network(logs: list[Any] | dict[str, Any] | None) -> str:
    if not logs:
        return "None"
    entries = logs if isinstance(logs, list) else [logs]
    lines: list[str] = []
    for entry in entries[:30]:
        if isinstance(entry, dict):
            method = entry.get("method", "")
            url = entry.get("url", "")
            status = entry.get("status", "")
            duration = entry.get("duration", "")
            lines.append(f"{method} {url} -> {status} ({duration}ms)")
        else:
            lines.append(str(entry))
    return "\n".join(lines) or "None"


def _format_actions(actions: list[Any] | dict[str, Any] | None) -> str:
    if not actions:
        return "None"
    entries = actions if isinstance(actions, list) else [actions]
    lines: list[str] = []
    for entry in entries[:30]:
        if isinstance(entry, dict):
            action_type = entry.get("type", "")
            target = entry.get("target", "")
            lines.append(f"{action_type}: {target}")
        else:
            lines.append(str(entry))
    return "\n".join(lines) or "None"


def _format_metadata(metadata: dict[str, Any] | None) -> str:
    if not metadata:
        return "None"
    parts: list[str] = []
    for key in ("userAgent", "platform", "viewport", "url", "locale"):
        if key in metadata:
            parts.append(f"{key}: {metadata[key]}")
    return ", ".join(parts) or "None"


async def analyze_bug_report(
    title: str,
    description: str,
    console_logs: list[Any] | dict[str, Any] | None,
    network_logs: list[Any] | dict[str, Any] | None,
    user_actions: list[Any] | dict[str, Any] | None,
    metadata: dict[str, Any] | None,
) -> dict[str, Any]:
    settings = get_settings()
    if not settings.ANTHROPIC_API_KEY:
        raise ValueError("ANTHROPIC_API_KEY not configured")

    client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY, timeout=30)

    user_prompt = (
        f"Title: {title}\n"
        f"Description: {description}\n\n"
        f"Console Logs:\n{_format_logs(console_logs)}\n\n"
        f"Network Logs:\n{_format_network(network_logs)}\n\n"
        f"User Actions:\n{_format_actions(user_actions)}\n\n"
        f"Device Info: {_format_metadata(metadata)}"
    )

    message = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        system=_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )

    raw_text = message.content[0].text
    try:
        parsed = json.loads(raw_text)
    except json.JSONDecodeError:
        logger.warning("AI returned non-JSON response: %s", raw_text[:200])
        parsed = {
            "summary": raw_text[:500],
            "suggestedCategory": "other",
            "suggestedSeverity": "medium",
            "reproductionSteps": [],
        }

    return {
        "summary": str(parsed.get("summary", "")),
        "suggested_category": str(parsed.get("suggestedCategory", "other")),
        "suggested_severity": str(parsed.get("suggestedSeverity", "medium")),
        "reproduction_steps": list(parsed.get("reproductionSteps", [])),
    }
