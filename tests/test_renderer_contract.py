from __future__ import annotations

from typing import Any

from pytest import MonkeyPatch

from unifi_network_maps.adapters.config import Config
from unifi_network_maps.model.mock import MockOptions, generate_mock_payload

from custom_components.unifi_network_map import renderer as renderer_module
from custom_components.unifi_network_map.renderer import RenderSettings, UniFiNetworkMapRenderer


def _mock_payload() -> dict[str, list[dict[str, Any]]]:
    return generate_mock_payload(MockOptions())


def _build_settings() -> RenderSettings:
    return RenderSettings(
        include_ports=True,
        include_clients=True,
        client_scope="all",
        only_unifi=False,
        svg_isometric=False,
        svg_width=None,
        svg_height=None,
        use_cache=False,
    )


def _build_config() -> Config:
    return Config(
        url="https://unifi.local",
        site="default",
        user="user",
        password="pass",
        verify_ssl=True,
    )


def test_renderer_contract(monkeypatch: MonkeyPatch) -> None:
    payload = _mock_payload()
    _patch_unifi_fetchers(monkeypatch, payload)
    result = UniFiNetworkMapRenderer().render(_build_config(), _build_settings())
    assert result.svg.startswith("<svg")
    assert result.payload["schema_version"] == "1.0"
    assert result.payload["edges"]
    assert result.payload["node_types"]


def _patch_unifi_fetchers(
    monkeypatch: MonkeyPatch, payload: dict[str, list[dict[str, Any]]]
) -> None:
    def _fetch_devices(*_args: object, **_kwargs: object) -> list[dict[str, Any]]:
        return payload["devices"]

    def _fetch_clients(*_args: object, **_kwargs: object) -> list[dict[str, Any]]:
        return payload["clients"]

    monkeypatch.setattr(
        renderer_module,
        "fetch_devices",
        _fetch_devices,
    )
    monkeypatch.setattr(
        renderer_module,
        "fetch_clients",
        _fetch_clients,
    )
