from __future__ import annotations

import base64
import json
import logging
from collections.abc import AsyncGenerator
from typing import Any

import anthropic

from app.config import get_settings
from app.utils.sanitize import sanitize_text

logger = logging.getLogger(__name__)

_anthropic_client: anthropic.AsyncAnthropic | None = None


def _get_anthropic_client() -> anthropic.AsyncAnthropic:
    global _anthropic_client
    if _anthropic_client is None:
        settings = get_settings()
        if not settings.ANTHROPIC_API_KEY:
            raise ValueError("ANTHROPIC_API_KEY not configured")
        _anthropic_client = anthropic.AsyncAnthropic(
            api_key=settings.ANTHROPIC_API_KEY, timeout=30
        )
    return _anthropic_client

_SYSTEM_PROMPT = (
    "You are a bug-triage assistant. Analyze the provided bug report data and "
    "respond with a JSON object containing exactly these fields:\n"
    '- "summary": a concise 1-2 sentence summary of the bug\n'
    '- "suggestedCategory": one of "bug", "ui", "performance", "crash", "other"\n'
    '- "suggestedSeverity": one of "critical", "high", "medium", "low"\n'
    '- "reproductionSteps": an array of step strings to reproduce the issue\n'
    '- "rootCause": 1-3 sentences explaining the likely root cause\n'
    '- "fixSuggestions": an array of 1-3 actionable fix suggestions\n'
    '- "affectedArea": a string identifying the component/area affected '
    '(e.g. "Authentication", "UI/Forms", "API/Network")\n'
    "Respond ONLY with valid JSON. No markdown fences, no extra text."
)

_SYSTEM_PROMPT_STREAMING = (
    "You are a bug-triage assistant. Analyze the provided bug report data. "
    "Provide a clear, structured analysis in plain text with these sections:\n"
    "## Summary\n## Category\n## Severity\n## Reproduction Steps\n"
    "## Root Cause\n## Fix Suggestions\n## Affected Area\n"
    "Be concise but thorough."
)


_MAX_STACK_LENGTH = 300


def _format_logs(logs: list[Any] | dict[str, Any] | None) -> str:
    if not logs:
        return "None"
    entries = logs if isinstance(logs, list) else [logs]
    lines: list[str] = []
    for entry in entries[:30]:
        if isinstance(entry, dict):
            level = entry.get("level", "")
            message = entry.get("message", "")
            stack = entry.get("stack", "")
            line = f"[{level}] {message}"
            if stack:
                line += f"\n  Stack: {str(stack)[:_MAX_STACK_LENGTH]}"
            lines.append(line)
        else:
            lines.append(str(entry))
    return "\n".join(lines) or "None"


_FAILED_STATUS_THRESHOLD = 400


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
            prefix = "[FAILED] " if isinstance(status, int) and status >= _FAILED_STATUS_THRESHOLD else ""
            lines.append(f"{prefix}{method} {url} -> {status} ({duration}ms)")
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


def _build_user_prompt(
    title: str,
    description: str,
    console_logs: list[Any] | dict[str, Any] | None,
    network_logs: list[Any] | dict[str, Any] | None,
    user_actions: list[Any] | dict[str, Any] | None,
    metadata: dict[str, Any] | None,
) -> str:
    title = sanitize_text(title)
    description = sanitize_text(description)
    return (
        f"Title: {title}\n"
        f"Description: {description}\n\n"
        f"Console Logs:\n{_format_logs(console_logs)}\n\n"
        f"Network Logs:\n{_format_network(network_logs)}\n\n"
        f"User Actions:\n{_format_actions(user_actions)}\n\n"
        f"Device Info: {_format_metadata(metadata)}"
    )


def _build_message_content(
    user_prompt: str,
    screenshot_data: bytes | None = None,
    screenshot_media_type: str = "image/png",
) -> list[dict[str, Any]]:
    """Build message content with optional multi-modal screenshot."""
    content: list[dict[str, Any]] = []
    if screenshot_data:
        content.append({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": screenshot_media_type,
                "data": base64.b64encode(screenshot_data).decode("ascii"),
            },
        })
        content.append({
            "type": "text",
            "text": "Above is a screenshot of the bug. Analyze it alongside the report data below.\n\n" + user_prompt,
        })
    else:
        content.append({"type": "text", "text": user_prompt})
    return content


def _parse_analysis_response(raw_text: str) -> dict[str, Any]:
    try:
        parsed = json.loads(raw_text)
    except json.JSONDecodeError:
        logger.warning("AI returned non-JSON response: %s", raw_text[:200])
        parsed = {
            "summary": raw_text[:500],
            "suggestedCategory": "other",
            "suggestedSeverity": "medium",
            "reproductionSteps": [],
            "rootCause": "",
            "fixSuggestions": [],
            "affectedArea": "",
        }

    return {
        "summary": str(parsed.get("summary", "")),
        "suggested_category": str(parsed.get("suggestedCategory", "other")),
        "suggested_severity": str(parsed.get("suggestedSeverity", "medium")),
        "reproduction_steps": list(parsed.get("reproductionSteps", [])),
        "root_cause": str(parsed.get("rootCause", "")),
        "fix_suggestions": list(parsed.get("fixSuggestions", [])),
        "affected_area": str(parsed.get("affectedArea", "")),
    }


async def analyze_bug_report(
    title: str,
    description: str,
    console_logs: list[Any] | dict[str, Any] | None,
    network_logs: list[Any] | dict[str, Any] | None,
    user_actions: list[Any] | dict[str, Any] | None,
    metadata: dict[str, Any] | None,
    screenshot_data: bytes | None = None,
    screenshot_media_type: str = "image/png",
) -> dict[str, Any]:
    settings = get_settings()
    client = _get_anthropic_client()

    user_prompt = _build_user_prompt(
        title, description, console_logs, network_logs, user_actions, metadata
    )
    content = _build_message_content(user_prompt, screenshot_data, screenshot_media_type)

    message = await client.messages.create(
        model=settings.AI_MODEL,
        max_tokens=1024,
        system=_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": content}],
    )

    if not message.content or not hasattr(message.content[0], "text"):
        raise ValueError("AI returned an empty or non-text response")

    return _parse_analysis_response(message.content[0].text)


async def analyze_bug_report_stream(
    title: str,
    description: str,
    console_logs: list[Any] | dict[str, Any] | None,
    network_logs: list[Any] | dict[str, Any] | None,
    user_actions: list[Any] | dict[str, Any] | None,
    metadata: dict[str, Any] | None,
    screenshot_data: bytes | None = None,
    screenshot_media_type: str = "image/png",
) -> AsyncGenerator[str, None]:
    """Stream AI analysis as Server-Sent Events text chunks."""
    settings = get_settings()
    client = _get_anthropic_client()

    user_prompt = _build_user_prompt(
        title, description, console_logs, network_logs, user_actions, metadata
    )
    content = _build_message_content(user_prompt, screenshot_data, screenshot_media_type)

    async with client.messages.stream(
        model=settings.AI_MODEL,
        max_tokens=1024,
        system=_SYSTEM_PROMPT_STREAMING,
        messages=[{"role": "user", "content": content}],
    ) as stream:
        async for text in stream.text_stream:
            yield text
