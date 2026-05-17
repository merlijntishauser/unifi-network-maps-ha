from __future__ import annotations

from typing import Any

import pytest
from unifi_topology.adapters.unifi_api import UnifiAuthError

from custom_components.unifi_network_map import api as api_module
from custom_components.unifi_network_map.errors import (
    CannotConnect,
    InvalidAuth,
)


def test_validate_unifi_credentials_maps_auth_error(monkeypatch):
    def _fetch_devices(*_args: Any, **_kwargs: Any):
        raise UnifiAuthError("bad auth")

    monkeypatch.setattr(api_module, "fetch_devices", _fetch_devices)

    with pytest.raises(InvalidAuth):
        api_module.validate_unifi_credentials(
            base_url="https://unifi.local",
            username="admin",
            password="secret",
            site="default",
            verify_ssl=True,
        )


def test_validate_unifi_credentials_maps_connection_error(monkeypatch):
    def _fetch_devices(*_args: Any, **_kwargs: Any):
        raise RuntimeError("offline")

    monkeypatch.setattr(api_module, "fetch_devices", _fetch_devices)

    with pytest.raises(CannotConnect):
        api_module.validate_unifi_credentials(
            base_url="https://unifi.local",
            username="admin",
            password="secret",
            site="default",
            verify_ssl=True,
        )


def test_validate_unifi_credentials_success(monkeypatch):
    def _fetch_devices(*_args: Any, **_kwargs: Any):
        return []

    monkeypatch.setattr(api_module, "fetch_devices", _fetch_devices)

    api_module.validate_unifi_credentials(
        base_url="https://unifi.local",
        username="admin",
        password="secret",
        site="default",
        verify_ssl=True,
    )


def test_validate_unifi_credentials_accepts_api_key(monkeypatch):
    """API key alone (no username/password) is a valid auth mode."""
    captured: dict[str, Any] = {}

    def _fetch_devices(config: Any, *_args: Any, **_kwargs: Any):
        captured["config"] = config
        return []

    monkeypatch.setattr(api_module, "fetch_devices", _fetch_devices)

    api_module.validate_unifi_credentials(
        base_url="https://unifi.local",
        username=None,
        password=None,
        site="default",
        verify_ssl=True,
        api_key="abc123",
    )

    config = captured["config"]
    assert config.api_key == "abc123"
    assert config.user is None
    assert config.password is None


def test_validate_unifi_credentials_api_key_maps_auth_error(monkeypatch):
    """A 401 against the api_key path surfaces as InvalidAuth."""

    def _fetch_devices(*_args: Any, **_kwargs: Any):
        raise UnifiAuthError("api key rejected")

    monkeypatch.setattr(api_module, "fetch_devices", _fetch_devices)

    with pytest.raises(InvalidAuth):
        api_module.validate_unifi_credentials(
            base_url="https://unifi.local",
            username=None,
            password=None,
            site="default",
            verify_ssl=True,
            api_key="bad-key",
        )
