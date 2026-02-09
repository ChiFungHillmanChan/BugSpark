from __future__ import annotations

from fastapi import Request

from app.i18n.messages.en import MESSAGES as EN_MESSAGES
from app.i18n.messages.zh_tw import MESSAGES as ZH_TW_MESSAGES

SUPPORTED_LOCALES = {"en", "zh-TW"}
DEFAULT_LOCALE = "en"

_MESSAGE_MAP: dict[str, dict[str, str]] = {
    "en": EN_MESSAGES,
    "zh-TW": ZH_TW_MESSAGES,
}


def get_locale(request: Request) -> str:
    """Extract the best matching locale from the Accept-Language header."""
    accept_lang = request.headers.get("Accept-Language", "en")
    for locale in SUPPORTED_LOCALES:
        if locale.lower() in accept_lang.lower():
            return locale
    if "zh" in accept_lang.lower():
        return "zh-TW"
    return DEFAULT_LOCALE


def translate(key: str, locale: str = DEFAULT_LOCALE) -> str:
    """Look up a translated message by key and locale."""
    messages = _MESSAGE_MAP.get(locale, EN_MESSAGES)
    return messages.get(key, EN_MESSAGES.get(key, key))
