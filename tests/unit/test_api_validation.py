from __future__ import annotations

from typing import Any

import pytest
from unifi_topology.adapters.unifi_api import UnifiAuthError

from custom_components.unifi_network_map import api as api_module
from custom_components.unifi_network_map.errors import CannotConnect, InvalidAuth


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
