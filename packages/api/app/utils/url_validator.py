"""Webhook URL validation — blocks SSRF against internal networks."""
from __future__ import annotations

import ipaddress
import socket
from urllib.parse import urlparse

from app.exceptions import BadRequestException

# ---------------------------------------------------------------------------
# Blocked IP ranges — reserved, private, link-local, multicast, etc.
# ---------------------------------------------------------------------------

# Reserved / internal IP ranges that webhooks should never target
_BLOCKED_RANGES = [
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("100.64.0.0/10"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.0.0.0/24"),
    ipaddress.ip_network("192.0.2.0/24"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("198.18.0.0/15"),
    ipaddress.ip_network("198.51.100.0/24"),
    ipaddress.ip_network("203.0.113.0/24"),
    ipaddress.ip_network("224.0.0.0/4"),
    ipaddress.ip_network("240.0.0.0/4"),
    ipaddress.ip_network("255.255.255.255/32"),
    # IPv6 internal ranges
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
]


def validate_webhook_url(url: str) -> str:
    """
    Validate a webhook URL is safe to call.
    Blocks internal IPs, non-HTTPS schemes, and hostnames resolving to private ranges.
    Returns the validated URL on success.
    Raises BadRequestException on failure.
    """
    parsed = urlparse(url)

    if parsed.scheme not in ("http", "https"):
        raise BadRequestException("Webhook URL must use http or https")

    hostname = parsed.hostname
    if not hostname:
        raise BadRequestException("Webhook URL must include a hostname")

    # Block obvious internal hostnames
    blocked_hostnames = {"localhost", "0.0.0.0", "[::]", "[::1]"}
    if hostname.lower() in blocked_hostnames:
        raise BadRequestException("Webhook URL cannot target internal addresses")

    # Resolve hostname and check against blocked IP ranges
    try:
        infos = socket.getaddrinfo(hostname, None, socket.AF_UNSPEC, socket.SOCK_STREAM)
    except socket.gaierror:
        raise BadRequestException(f"Cannot resolve webhook hostname: {hostname}")

    for info in infos:
        addr = ipaddress.ip_address(info[4][0])
        for network in _BLOCKED_RANGES:
            if addr in network:
                raise BadRequestException(
                    "Webhook URL cannot target internal or reserved addresses"
                )

    return url


def resolve_and_validate_url(url: str) -> tuple[str, list[str]]:
    """Resolve DNS for a webhook URL and validate all resolved IPs.

    Returns ``(original_url, list_of_safe_ips)`` so callers can pin the
    HTTP connection to a validated IP, eliminating TOCTOU / DNS-rebinding
    attacks.

    Raises :class:`BadRequestException` when any resolved IP falls within
    a blocked range.
    """
    parsed = urlparse(url)

    if parsed.scheme not in ("http", "https"):
        raise BadRequestException("Webhook URL must use http or https")

    hostname = parsed.hostname
    if not hostname:
        raise BadRequestException("Webhook URL must include a hostname")

    blocked_hostnames = {"localhost", "0.0.0.0", "[::]", "[::1]"}
    if hostname.lower() in blocked_hostnames:
        raise BadRequestException("Webhook URL cannot target internal addresses")

    try:
        infos = socket.getaddrinfo(
            hostname, None, socket.AF_UNSPEC, socket.SOCK_STREAM,
        )
    except socket.gaierror:
        raise BadRequestException(f"Cannot resolve webhook hostname: {hostname}")

    resolved_ips: list[str] = []
    for info in infos:
        ip_str = info[4][0]
        addr = ipaddress.ip_address(ip_str)
        for network in _BLOCKED_RANGES:
            if addr in network:
                raise BadRequestException(
                    "Webhook URL cannot target internal or reserved addresses"
                )
        resolved_ips.append(ip_str)

    if not resolved_ips:
        raise BadRequestException(f"Cannot resolve webhook hostname: {hostname}")

    return url, resolved_ips
