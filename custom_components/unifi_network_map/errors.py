from __future__ import annotations

from homeassistant.exceptions import HomeAssistantError

from .const import DOMAIN


class UniFiNetworkMapError(HomeAssistantError):  # type: ignore[reportUntypedBaseClass]
    """Base exception for UniFi Network Map errors."""

    translation_domain = DOMAIN


class InvalidUrl(UniFiNetworkMapError):
    """Raised when the controller URL is invalid."""


class UrlHasCredentials(UniFiNetworkMapError):
    """Raised when the URL contains embedded credentials."""


class InvalidAuth(UniFiNetworkMapError):
    """Raised when authentication fails."""


class CannotConnect(UniFiNetworkMapError):
    """Raised when the controller cannot be reached."""


class EmptyCredential(UniFiNetworkMapError):
    """Raised when username, password, or site is empty."""


class InvalidPort(UniFiNetworkMapError):
    """Raised when the URL contains an invalid port number."""
