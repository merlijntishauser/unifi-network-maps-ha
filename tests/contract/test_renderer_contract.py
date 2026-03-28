from __future__ import annotations

from typing import TYPE_CHECKING, Any

from unifi_topology import Config, WanInfo
from unifi_topology.model import MockOptions, generate_mock_payload

from custom_components.unifi_network_map import renderer as renderer_module
from custom_components.unifi_network_map.const import PAYLOAD_SCHEMA_VERSION
from custom_components.unifi_network_map.renderer import (
    RenderSettings,
    UniFiNetworkMapRenderer,
)

if TYPE_CHECKING:
    from collections.abc import Iterable

    from pytest import MonkeyPatch

    from custom_components.unifi_network_map.data import UniFiNetworkMapData


def _mock_payload() -> dict[str, list[dict[str, Any]]]:
    return generate_mock_payload(MockOptions())


def _mock_payload_with_wan_port() -> dict[str, list[dict[str, Any]]]:
    """Mock payload with a WAN port on the gateway."""
    payload = _mock_payload()
    gateway = next(d for d in payload["devices"] if d["type"] == "udm")
    gateway["port_table"].append(
        {
            "port_idx": 1,
            "name": "WAN",
            "ifname": "eth0",
            "is_uplink": True,
            "ip": "100.64.1.1",
            "native_vlan": None,
            "tagged_vlans": [],
            "poe_enable": False,
            "port_poe": False,
            "poe_class": 0,
            "poe_power": 0.0,
            "poe_good": False,
            "poe_voltage": 0.0,
            "poe_current": 0.0,
            "speed": 2500,
            "up": True,
        }
    )
    return payload


def _build_settings(
    *,
    include_clients: bool = True,
    show_wan: bool = True,
    svg_isometric: bool = False,
) -> RenderSettings:
    return RenderSettings(
        include_ports=True,
        include_clients=include_clients,
        client_scope="all",
        only_unifi=False,
        svg_isometric=svg_isometric,
        svg_width=None,
        svg_height=None,
        use_cache=False,
        show_wan=show_wan,
    )


def _build_config() -> Config:
    return Config(
        url="https://unifi.local",
        site="default",
        user="user",
        password="pass",
        verify_ssl=True,
    )


def _render(
    monkeypatch: MonkeyPatch,
    payload: dict[str, list[dict[str, Any]]] | None = None,
    **settings_kwargs: object,
) -> UniFiNetworkMapData:
    if payload is None:
        payload = _mock_payload()
    _patch_unifi_fetchers(monkeypatch, payload)
    settings = _build_settings(**settings_kwargs)  # type: ignore[arg-type]
    return UniFiNetworkMapRenderer().render(_build_config(), settings)


# --- Core contract tests ---


def test_renderer_contract(monkeypatch: MonkeyPatch) -> None:
    result = _render(monkeypatch)
    assert result.svg.startswith("<svg")
    _assert_payload_schema(result.payload)


def test_renderer_contract_without_clients(monkeypatch: MonkeyPatch) -> None:
    result = _render(monkeypatch, include_clients=False)
    _assert_payload_schema(result.payload)


def test_renderer_contract_isometric(monkeypatch: MonkeyPatch) -> None:
    result = _render(monkeypatch, svg_isometric=True)
    assert result.svg.startswith("<svg")
    _assert_payload_schema(result.payload)


# --- Payload field contracts ---


def test_client_ips(monkeypatch: MonkeyPatch) -> None:
    result = _render(monkeypatch)
    client_ips = result.payload["client_ips"]
    assert isinstance(client_ips, dict)
    for mac, ip in client_ips.items():
        assert isinstance(mac, str)
        assert isinstance(ip, str)


def test_device_ips(monkeypatch: MonkeyPatch) -> None:
    result = _render(monkeypatch)
    device_ips = result.payload["device_ips"]
    assert isinstance(device_ips, dict)
    assert device_ips
    for mac, ip in device_ips.items():
        assert isinstance(mac, str)
        assert isinstance(ip, str)


def test_device_details(monkeypatch: MonkeyPatch) -> None:
    result = _render(monkeypatch)
    details = result.payload["device_details"]
    assert isinstance(details, dict)
    assert details
    for mac, info in details.items():
        assert isinstance(mac, str)
        assert isinstance(info, dict)
        assert isinstance(info["mac"], str)
        _assert_optional_types(
            info,
            {
                "ip": (str, type(None)),
                "model": (str, type(None)),
                "model_name": (str, type(None)),
                "uplink_device": (str, type(None)),
            },
        )


def test_client_details(monkeypatch: MonkeyPatch) -> None:
    result = _render(monkeypatch)
    details = result.payload["client_details"]
    assert isinstance(details, dict)
    assert details
    for mac, info in details.items():
        assert isinstance(mac, str)
        assert isinstance(info, dict)
        assert isinstance(info["mac"], str)
        _assert_optional_types(
            info,
            {
                "name": (str, type(None)),
                "ip": (str, type(None)),
                "vlan": (int, type(None)),
                "network": (str, type(None)),
                "is_wired": (bool, type(None)),
                "connected_to_mac": (str, type(None)),
            },
        )


def test_device_ports(monkeypatch: MonkeyPatch) -> None:
    result = _render(monkeypatch)
    ports = result.payload["device_ports"]
    assert isinstance(ports, dict)
    for mac, port_list in ports.items():
        assert isinstance(mac, str)
        assert isinstance(port_list, list)
        for port in port_list:
            assert isinstance(port["port"], int)
            _assert_optional_types(
                port,
                {
                    "name": (str, type(None)),
                    "speed": (int, type(None)),
                    "poe_enabled": (bool, type(None)),
                    "poe_active": (bool, type(None)),
                    "poe_power": (float, int, type(None)),
                },
            )


def test_vlan_info(monkeypatch: MonkeyPatch) -> None:
    result = _render(monkeypatch)
    vlan_info = result.payload["vlan_info"]
    assert isinstance(vlan_info, dict)
    for vlan_id, info in vlan_info.items():
        assert isinstance(vlan_id, int)
        assert isinstance(info, dict)
        assert isinstance(info["id"], int)
        assert isinstance(info["name"], str)
        assert isinstance(info["client_count"], int)
        assert isinstance(info["clients"], list)


def test_node_vlans(monkeypatch: MonkeyPatch) -> None:
    result = _render(monkeypatch)
    node_vlans = result.payload["node_vlans"]
    assert isinstance(node_vlans, dict)
    for mac, vlan in node_vlans.items():
        assert isinstance(mac, str)
        assert isinstance(vlan, (int, type(None)))


def test_ap_client_counts(monkeypatch: MonkeyPatch) -> None:
    result = _render(monkeypatch)
    counts = result.payload["ap_client_counts"]
    assert isinstance(counts, dict)
    for mac, count in counts.items():
        assert isinstance(mac, str)
        assert isinstance(count, int)


def test_vpn_tunnels(monkeypatch: MonkeyPatch) -> None:
    result = _render(monkeypatch)
    tunnels = result.payload["vpn_tunnels"]
    assert isinstance(tunnels, list)
    for tunnel in tunnels:
        assert isinstance(tunnel, dict)
        assert isinstance(tunnel["name"], str)
        assert isinstance(tunnel["vpn_type"], str)
        assert isinstance(tunnel["remote_subnets"], list)
        _assert_optional_types(
            tunnel,
            {
                "ifname": (str, type(None)),
                "enabled": (bool,),
                "up": (bool,),
                "gateway_mac": (str, type(None)),
            },
        )


# --- WAN info contracts ---


def test_wan_info_with_wan_port(monkeypatch: MonkeyPatch) -> None:
    payload = _mock_payload_with_wan_port()
    result = _render(monkeypatch, payload=payload)
    assert result.wan_info is not None
    assert isinstance(result.wan_info, WanInfo)
    wan1 = result.wan_info.wan1
    assert wan1 is not None
    assert isinstance(wan1.ip_address, str)
    assert isinstance(wan1.link_speed, (int, type(None)))
    assert isinstance(wan1.enabled, bool)
    assert isinstance(wan1.public_ip, (str, type(None)))


def test_wan_info_none_without_wan_port(monkeypatch: MonkeyPatch) -> None:
    result = _render(monkeypatch)
    assert result.wan_info is None


def test_wan_info_disabled(monkeypatch: MonkeyPatch) -> None:
    payload = _mock_payload_with_wan_port()
    result = _render(monkeypatch, payload=payload, show_wan=False)
    assert result.wan_info is None


def test_wan_public_ip_filters_loopback(monkeypatch: MonkeyPatch) -> None:
    """Verify upstream filters non-global connect_request_ip (issue #157)."""
    payload = _mock_payload_with_wan_port()
    gateway = next(d for d in payload["devices"] if d["type"] == "udm")
    gateway["connect_request_ip"] = "127.0.0.1"
    result = _render(monkeypatch, payload=payload)
    assert result.wan_info is not None
    assert result.wan_info.wan1 is not None
    assert result.wan_info.wan1.public_ip is None


def test_wan_public_ip_valid(monkeypatch: MonkeyPatch) -> None:
    """Verify upstream propagates a valid global connect_request_ip."""
    payload = _mock_payload_with_wan_port()
    gateway = next(d for d in payload["devices"] if d["type"] == "udm")
    gateway["connect_request_ip"] = "93.184.216.34"
    result = _render(monkeypatch, payload=payload)
    assert result.wan_info is not None
    assert result.wan_info.wan1 is not None
    assert result.wan_info.wan1.public_ip == "93.184.216.34"


# --- UniFiNetworkMapData contract ---


def test_result_data_structure(monkeypatch: MonkeyPatch) -> None:
    result = _render(monkeypatch)
    assert isinstance(result.svg, str)
    assert isinstance(result.payload, dict)
    assert result.vpn_tunnels is None or isinstance(result.vpn_tunnels, list)


# --- Helpers ---


def _patch_unifi_fetchers(
    monkeypatch: MonkeyPatch, payload: dict[str, list[dict[str, Any]]]
) -> None:
    def _fetch_devices(
        *_args: object, **_kwargs: object
    ) -> list[dict[str, Any]]:
        return payload["devices"]

    def _fetch_clients(
        *_args: object, **_kwargs: object
    ) -> list[dict[str, Any]]:
        return payload["clients"]

    def _fetch_networks(
        *_args: object, **_kwargs: object
    ) -> list[dict[str, Any]]:
        return payload.get("networks", [])

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
    monkeypatch.setattr(
        renderer_module,
        "fetch_networks",
        _fetch_networks,
    )


def _assert_payload_schema(payload: dict[str, Any]) -> None:
    assert payload["schema_version"] == PAYLOAD_SCHEMA_VERSION
    _assert_edges(payload["edges"])
    _assert_node_types(payload["node_types"])
    _assert_node_names(payload["node_names"])
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
                "speed": (int, type(None)),
                "channel": (int, type(None)),
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


def _assert_node_names(node_names: dict[str, Any]) -> None:
    assert node_names
    for mac, name in node_names.items():
        assert isinstance(mac, str)
        assert isinstance(name, str)


def _assert_optional_types(
    data: dict[str, Any], expected: dict[str, tuple[type, ...]]
) -> None:
    for key, types in expected.items():
        if key in data:
            assert isinstance(data[key], types)
