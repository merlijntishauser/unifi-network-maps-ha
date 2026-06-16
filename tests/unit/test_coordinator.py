from __future__ import annotations

from custom_components.unifi_network_map.coordinator import _should_backoff
from custom_components.unifi_network_map.errors import (
    CannotConnect,
    InvalidAuth,
    RequestRejected,
)


def test_should_backoff_on_invalid_auth() -> None:
    assert _should_backoff(InvalidAuth("bad auth")) is True


def test_should_backoff_on_request_rejected() -> None:
    """A persistent post-login rejection should back off, not hammer."""
    assert _should_backoff(RequestRejected("rejected")) is True


def test_should_backoff_on_rate_limited_cannot_connect() -> None:
    assert _should_backoff(CannotConnect("Rate limited by controller")) is True


def test_should_not_backoff_on_plain_cannot_connect() -> None:
    assert _should_backoff(CannotConnect("Unable to connect")) is False
