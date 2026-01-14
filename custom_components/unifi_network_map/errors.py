from __future__ import annotations


class UniFiNetworkMapError(Exception):
    """Base exception for UniFi Network Map errors."""


class InvalidUrl(UniFiNetworkMapError):
    """Raised when the controller URL is invalid."""
