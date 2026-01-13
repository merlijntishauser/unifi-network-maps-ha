from __future__ import annotations

from typing import Any

from unifi_network_maps.adapters.config import Config
from unifi_network_maps.adapters import unifi as unifi_adapter
from unifi_network_maps.model.mock import MockOptions, generate_mock_payload

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


def test_renderer_contract(monkeypatch) -> None:
    payload = _mock_payload()
    _patch_unifi_fetchers(monkeypatch, payload)
    result = UniFiNetworkMapRenderer().render(_build_config(), _build_settings())
    assert result.svg.startswith("<svg")
    assert result.payload["edges"]
    assert result.payload["node_types"]


def _patch_unifi_fetchers(monkeypatch, payload: dict[str, list[dict[str, Any]]]) -> None:
    monkeypatch.setattr(
        unifi_adapter,
        "fetch_devices",
        lambda *_args, **_kwargs: payload["devices"],
    )
    monkeypatch.setattr(
        unifi_adapter,
        "fetch_clients",
        lambda *_args, **_kwargs: payload["clients"],
    )
