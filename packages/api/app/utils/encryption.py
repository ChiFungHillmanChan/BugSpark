"""Symmetric encryption helpers for secrets stored at rest."""
from __future__ import annotations

import logging

from cryptography.fernet import Fernet, InvalidToken

from app.config import get_settings

logger = logging.getLogger(__name__)

_fernet: Fernet | None = None


def _get_fernet() -> Fernet | None:
    global _fernet
    if _fernet is not None:
        return _fernet

    key = get_settings().ENCRYPTION_KEY
    if not key:
        return None

    _fernet = Fernet(key.encode() if isinstance(key, str) else key)
    return _fernet


def encrypt_value(plaintext: str) -> str:
    """Encrypt a plaintext string. Returns ciphertext as URL-safe base64.
    If no encryption key is configured in development, returns the plaintext unchanged.
    In production, raises RuntimeError to prevent storing secrets in plaintext.
    """
    fernet = _get_fernet()
    if fernet is None:
        if get_settings().ENVIRONMENT != "development":
            raise RuntimeError(
                "ENCRYPTION_KEY must be set in production. "
                "Generate one with: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
            )
        return plaintext
    return fernet.encrypt(plaintext.encode("utf-8")).decode("utf-8")


def decrypt_value(ciphertext: str) -> str:
    """Decrypt a ciphertext string.
    If no encryption key is configured in development, returns the value unchanged.
    In production, raises RuntimeError to prevent reading unencrypted secrets.
    If decryption fails (e.g. plaintext stored before encryption was enabled), returns as-is.

    Note: After rotating ENCRYPTION_KEY, previously encrypted values will fail to decrypt
    and be returned as-is. Monitor logs for warnings to identify values needing re-encryption.
    """
    fernet = _get_fernet()
    if fernet is None:
        if get_settings().ENVIRONMENT != "development":
            raise RuntimeError(
                "ENCRYPTION_KEY must be set in production. "
                "Generate one with: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
            )
        return ciphertext
    try:
        return fernet.decrypt(ciphertext.encode("utf-8")).decode("utf-8")
    except InvalidToken:
        # Gracefully handle values stored before encryption was enabled
        logger.warning("Failed to decrypt value — returning as-is (may be plaintext or encrypted with a rotated key)")
        return ciphertext
