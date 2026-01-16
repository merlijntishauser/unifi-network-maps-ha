from __future__ import annotations

from typing import Any, Iterable

from pytest import MonkeyPatch

from unifi_network_maps.adapters.config import Config
from unifi_network_maps.model.mock import MockOptions, generate_mock_payload

from custom_components.unifi_network_map import renderer as renderer_module
from custom_components.unifi_network_map.const import PAYLOAD_SCHEMA_VERSION
from custom_components.unifi_network_map.renderer import RenderSettings, UniFiNetworkMapRenderer


def _mock_payload() -> dict[str, list[dict[str, Any]]]:
    return generate_mock_payload(MockOptions())


def _build_settings(*, include_clients: bool = True) -> RenderSettings:
    return RenderSettings(
        include_ports=True,
        include_clients=include_clients,
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
    _assert_payload_schema(result.payload)


def test_renderer_contract_without_clients(monkeypatch: MonkeyPatch) -> None:
    payload = _mock_payload()
    _patch_unifi_fetchers(monkeypatch, payload)
    settings = _build_settings(include_clients=False)
    result = UniFiNetworkMapRenderer().render(_build_config(), settings)
    _assert_payload_schema(result.payload)


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


def _assert_payload_schema(payload: dict[str, Any]) -> None:
    assert payload["schema_version"] == PAYLOAD_SCHEMA_VERSION
    _assert_edges(payload["edges"])
    _assert_node_types(payload["node_types"])
    _assert_gateways(payload["gateways"])


def _assert_edges(edges: Iterable[dict[str, Any]]) -> None:
    edges_list = list(edges)
    assert edges_list
    for edge in edges_list:
        assert isinstance(edge.get("left"), str)
        assert isinstance(edge.get("right"), str)
        _assert_optional_types(
            edge,
            {
                "label": (str, type(None)),
                "poe": (bool, type(None)),
                "wireless": (bool, type(None)),
            },
        )


def _assert_node_types(node_types: dict[str, Any]) -> None:
    assert node_types
    for key, value in node_types.items():
        assert isinstance(key, str)
        assert isinstance(value, str)


def _assert_gateways(gateways: Iterable[Any]) -> None:
    for gateway in gateways:
        assert isinstance(gateway, str)


def _assert_optional_types(data: dict[str, Any], expected: dict[str, tuple[type, ...]]) -> None:
    for key, types in expected.items():
        if key in data:
            assert isinstance(data[key], types)
