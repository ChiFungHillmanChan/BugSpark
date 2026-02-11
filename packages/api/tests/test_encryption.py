"""Tests for encrypt_value/decrypt_value round-trip."""
from __future__ import annotations

import os

import pytest


@pytest.fixture(autouse=True)
def _set_encryption_key():
    """Set a valid Fernet key for encryption tests."""
    from cryptography.fernet import Fernet

    key = Fernet.generate_key().decode()
    os.environ["ENCRYPTION_KEY"] = key

    # Reset the cached fernet instance and settings
    from app.config import get_settings
    get_settings.cache_clear()

    import app.utils.encryption as enc_mod
    enc_mod._fernet = None

    yield

    os.environ.pop("ENCRYPTION_KEY", None)
    enc_mod._fernet = None
    get_settings.cache_clear()


def test_encrypt_decrypt_round_trip():
    from app.utils.encryption import decrypt_value, encrypt_value

    plaintext = "my-secret-token-12345"
    ciphertext = encrypt_value(plaintext)

    assert ciphertext != plaintext
    assert decrypt_value(ciphertext) == plaintext


def test_encrypt_decrypt_empty_string():
    from app.utils.encryption import decrypt_value, encrypt_value

    ciphertext = encrypt_value("")
    assert decrypt_value(ciphertext) == ""


def test_encrypt_produces_different_ciphertext_each_time():
    from app.utils.encryption import encrypt_value

    plaintext = "same-value"
    ct1 = encrypt_value(plaintext)
    ct2 = encrypt_value(plaintext)

    # Fernet uses random IVs so ciphertexts should differ
    assert ct1 != ct2


def test_decrypt_invalid_ciphertext_returns_as_is():
    """Decrypting a non-Fernet string should return it unchanged (graceful fallback)."""
    from app.utils.encryption import decrypt_value

    not_encrypted = "plain-text-value"
    assert decrypt_value(not_encrypted) == not_encrypted


def test_encrypt_without_key_in_development():
    """In development with no key, encrypt/decrypt are no-ops."""
    import app.utils.encryption as enc_mod
    from app.config import get_settings

    os.environ.pop("ENCRYPTION_KEY", None)
    os.environ["ENVIRONMENT"] = "development"
    enc_mod._fernet = None
    get_settings.cache_clear()

    from app.utils.encryption import decrypt_value, encrypt_value

    plaintext = "dev-secret"
    assert encrypt_value(plaintext) == plaintext
    assert decrypt_value(plaintext) == plaintext

    # Restore
    os.environ.pop("ENVIRONMENT", None)
    get_settings.cache_clear()
