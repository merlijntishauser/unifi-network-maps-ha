"""Unit tests for renderer module."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from unittest.mock import MagicMock, patch

import pytest

from custom_components.unifi_network_map.renderer import (
    RenderSettings,
    UniFiNetworkMapRenderer,
    _build_ap_client_counts,
    _build_client_details,
    _build_client_ip_index,
    _build_client_mac_index,
    _build_device_details,
    _build_device_ip_index,
    _build_device_mac_index,
    _build_device_ports,
    _build_network_name_map,
    _build_node_vlan_index,
    _build_vlan_info,
    _client_display_name,
    _client_field,
    _client_ip,
    _client_mac,
    _client_network_name,
    _client_vlan,
    _client_vlan_from_network_name,
    _edge_to_dict,
    _extract_wan_info,
    _is_default_vlan_name,
    _network_name,
    _network_vlan_id,
    _select_edges,
)
from custom_components.unifi_network_map.errors import UniFiNetworkMapError


@dataclass
class MockDevice:
    """Mock device for testing."""

    name: str | None = None
    mac: str | None = None
    ip: str | None = None
    model: str | None = None
    model_name: str | None = None
    uplink: Any = None
    port_table: list[Any] | None = None


@dataclass
class MockPort:
    """Mock port for testing."""

    port_idx: int | None = None
    name: str | None = None
    speed: int | None = None
    poe_enable: bool = False
    poe_good: bool = False
    poe_power: float | None = None


@dataclass
class MockEdge:
    """Mock edge for testing."""

    left: str
    right: str
    label: str | None = None
    poe: bool | None = None
    wireless: bool | None = None
    speed: int | None = None
    channel: int | None = None


@dataclass
class MockTopologyResult:
    """Mock topology result for testing."""

    tree_edges: list[MockEdge] | None = None
    raw_edges: list[MockEdge] | None = None


@dataclass
class MockClientObject:
    """Mock client object (not dict) for testing Protocol path."""

    name: str | None = None
    hostname: str | None = None
    mac: str | None = None
    ip: str | None = None
    vlan: int | None = None
    network: str | None = None
    network_id: int | None = None
    ap_mac: str | None = None
    sw_mac: str | None = None
    is_wired: bool | None = None


class TestClientField:
    """Tests for _client_field function."""

    def test_dict_client_existing_key(self) -> None:
        client: dict[str, Any] = {"name": "test-client", "mac": "aa:bb:cc:dd:ee:ff"}
        assert _client_field(client, "name") == "test-client"
        assert _client_field(client, "mac") == "aa:bb:cc:dd:ee:ff"

    def test_dict_client_missing_key(self) -> None:
        client: dict[str, Any] = {"name": "test-client"}
        assert _client_field(client, "ip") is None

    def test_object_client_existing_attr(self) -> None:
        client = MockClientObject(name="test-client", mac="aa:bb:cc:dd:ee:ff")
        assert _client_field(client, "name") == "test-client"
        assert _client_field(client, "mac") == "aa:bb:cc:dd:ee:ff"

    def test_object_client_missing_attr(self) -> None:
        client = MockClientObject(name="test-client")
        assert _client_field(client, "nonexistent") is None


class TestClientDisplayName:
    """Tests for _client_display_name function."""

    def test_returns_name_if_present(self) -> None:
        client: dict[str, Any] = {"name": "My Device", "hostname": "device.local", "mac": "aa:bb"}
        assert _client_display_name(client) == "My Device"

    def test_returns_hostname_if_no_name(self) -> None:
        client: dict[str, Any] = {"hostname": "device.local", "mac": "aa:bb"}
        assert _client_display_name(client) == "device.local"

    def test_returns_mac_if_no_name_or_hostname(self) -> None:
        client: dict[str, Any] = {"mac": "aa:bb:cc:dd:ee:ff"}
        assert _client_display_name(client) == "aa:bb:cc:dd:ee:ff"

    def test_returns_none_if_all_empty(self) -> None:
        client: dict[str, Any] = {"name": "", "hostname": "", "mac": ""}
        assert _client_display_name(client) is None

    def test_returns_none_if_all_missing(self) -> None:
        client: dict[str, Any] = {}
        assert _client_display_name(client) is None

    def test_strips_whitespace(self) -> None:
        client: dict[str, Any] = {"name": "  My Device  "}
        assert _client_display_name(client) == "My Device"

    def test_skips_whitespace_only_values(self) -> None:
        client: dict[str, Any] = {"name": "   ", "hostname": "device.local"}
        assert _client_display_name(client) == "device.local"


class TestClientMac:
    """Tests for _client_mac function."""

    def test_returns_mac(self) -> None:
        client: dict[str, Any] = {"mac": "AA:BB:CC:DD:EE:FF"}
        assert _client_mac(client) == "AA:BB:CC:DD:EE:FF"

    def test_returns_none_if_missing(self) -> None:
        client: dict[str, Any] = {"name": "test"}
        assert _client_mac(client) is None

    def test_returns_none_if_empty(self) -> None:
        client: dict[str, Any] = {"mac": ""}
        assert _client_mac(client) is None

    def test_strips_whitespace(self) -> None:
        client: dict[str, Any] = {"mac": "  aa:bb:cc  "}
        assert _client_mac(client) == "aa:bb:cc"


class TestClientIp:
    """Tests for _client_ip function."""

    def test_returns_ip(self) -> None:
        client: dict[str, Any] = {"ip": "192.168.1.100"}
        assert _client_ip(client) == "192.168.1.100"

    def test_returns_none_if_missing(self) -> None:
        client: dict[str, Any] = {"name": "test"}
        assert _client_ip(client) is None

    def test_returns_none_if_empty(self) -> None:
        client: dict[str, Any] = {"ip": ""}
        assert _client_ip(client) is None

    def test_strips_whitespace(self) -> None:
        client: dict[str, Any] = {"ip": "  192.168.1.1  "}
        assert _client_ip(client) == "192.168.1.1"


class TestClientVlan:
    """Tests for _client_vlan function."""

    def test_returns_int_vlan(self) -> None:
        client: dict[str, Any] = {"vlan": 10}
        assert _client_vlan(client) == 10

    def test_returns_string_vlan_as_int(self) -> None:
        client: dict[str, Any] = {"vlan": "20"}
        assert _client_vlan(client) == 20

    def test_returns_network_id_as_fallback(self) -> None:
        client: dict[str, Any] = {"network_id": 30}
        assert _client_vlan(client) == 30

    def test_returns_network_id_string_as_int(self) -> None:
        client: dict[str, Any] = {"network_id": "40"}
        assert _client_vlan(client) == 40

    def test_returns_none_if_no_vlan(self) -> None:
        client: dict[str, Any] = {"name": "test"}
        assert _client_vlan(client) is None

    def test_prefers_vlan_over_network_id(self) -> None:
        client: dict[str, Any] = {"vlan": 10, "network_id": 20}
        assert _client_vlan(client) == 10

    def test_returns_none_for_non_numeric_string(self) -> None:
        client: dict[str, Any] = {"vlan": "abc"}
        assert _client_vlan(client) is None


class TestClientNetworkName:
    """Tests for _client_network_name function."""

    def test_returns_network(self) -> None:
        client: dict[str, Any] = {"network": "IoT"}
        assert _client_network_name(client) == "IoT"

    def test_returns_essid(self) -> None:
        client: dict[str, Any] = {"essid": "MyWiFi"}
        assert _client_network_name(client) == "MyWiFi"

    def test_returns_network_name(self) -> None:
        client: dict[str, Any] = {"network_name": "Guest"}
        assert _client_network_name(client) == "Guest"

    def test_returns_none_if_missing(self) -> None:
        client: dict[str, Any] = {"name": "test"}
        assert _client_network_name(client) is None

    def test_prefers_network_over_essid(self) -> None:
        client: dict[str, Any] = {"network": "Primary", "essid": "Secondary"}
        assert _client_network_name(client) == "Primary"

    def test_strips_whitespace(self) -> None:
        client: dict[str, Any] = {"network": "  IoT  "}
        assert _client_network_name(client) == "IoT"


class TestNetworkVlanId:
    """Tests for _network_vlan_id function."""

    def test_returns_int_vlan(self) -> None:
        network: dict[str, Any] = {"vlan": 100}
        assert _network_vlan_id(network) == 100

    def test_returns_string_vlan(self) -> None:
        network: dict[str, Any] = {"vlan": "200"}
        assert _network_vlan_id(network) == 200

    def test_returns_none_if_vlan_enabled_true(self) -> None:
        network: dict[str, Any] = {"vlan_enabled": True}
        assert _network_vlan_id(network) is None

    def test_returns_1_for_corporate_purpose(self) -> None:
        network: dict[str, Any] = {"purpose": "corporate"}
        assert _network_vlan_id(network) == 1

    def test_returns_1_for_guest_purpose(self) -> None:
        network: dict[str, Any] = {"purpose": "guest"}
        assert _network_vlan_id(network) == 1

    def test_returns_none_for_other_purpose(self) -> None:
        network: dict[str, Any] = {"purpose": "other"}
        assert _network_vlan_id(network) is None

    def test_returns_none_if_empty(self) -> None:
        network: dict[str, Any] = {}
        assert _network_vlan_id(network) is None


class TestNetworkName:
    """Tests for _network_name function."""

    def test_returns_name(self) -> None:
        network: dict[str, Any] = {"name": "IoT Network"}
        assert _network_name(network, 10) == "IoT Network"

    def test_returns_default_if_no_name(self) -> None:
        network: dict[str, Any] = {}
        assert _network_name(network, 10) == "VLAN 10"

    def test_returns_default_if_empty_name(self) -> None:
        network: dict[str, Any] = {"name": ""}
        assert _network_name(network, 20) == "VLAN 20"

    def test_strips_whitespace(self) -> None:
        network: dict[str, Any] = {"name": "  My Network  "}
        assert _network_name(network, 10) == "My Network"


class TestIsDefaultVlanName:
    """Tests for _is_default_vlan_name function."""

    def test_returns_true_for_vlan_prefix(self) -> None:
        assert _is_default_vlan_name("VLAN 10") is True
        assert _is_default_vlan_name("vlan 20") is True
        assert _is_default_vlan_name("Vlan 30") is True

    def test_returns_false_for_custom_name(self) -> None:
        assert _is_default_vlan_name("IoT Network") is False
        assert _is_default_vlan_name("Guest") is False

    def test_returns_false_for_non_string(self) -> None:
        assert _is_default_vlan_name(10) is False
        assert _is_default_vlan_name(None) is False


class TestBuildNetworkNameMap:
    """Tests for _build_network_name_map function."""

    def test_builds_map(self) -> None:
        networks: list[dict[str, Any]] = [
            {"name": "IoT", "vlan": 10},
            {"name": "Guest", "vlan": 20},
        ]
        result = _build_network_name_map(networks)
        assert result == {"iot": 10, "guest": 20}

    def test_skips_networks_without_vlan(self) -> None:
        networks: list[dict[str, Any]] = [
            {"name": "NoVlan"},
            {"name": "WithVlan", "vlan": 10},
        ]
        result = _build_network_name_map(networks)
        assert result == {"withvlan": 10}

    def test_handles_empty_list(self) -> None:
        assert _build_network_name_map([]) == {}


class TestClientVlanFromNetworkName:
    """Tests for _client_vlan_from_network_name function."""

    def test_returns_vlan_from_map(self) -> None:
        client: dict[str, Any] = {"network": "IoT"}
        network_map = {"iot": 10, "guest": 20}
        assert _client_vlan_from_network_name(client, network_map) == 10

    def test_returns_none_if_not_in_map(self) -> None:
        client: dict[str, Any] = {"network": "Unknown"}
        network_map = {"iot": 10}
        assert _client_vlan_from_network_name(client, network_map) is None

    def test_returns_none_if_no_network_name(self) -> None:
        client: dict[str, Any] = {"name": "test"}
        network_map = {"iot": 10}
        assert _client_vlan_from_network_name(client, network_map) is None


class TestEdgeToDict:
    """Tests for _edge_to_dict function."""

    def test_converts_edge(self) -> None:
        edge = MockEdge(
            left="switch1",
            right="ap1",
            label="Port 5",
            poe=True,
            wireless=False,
            speed=1000,
            channel=None,
        )
        result = _edge_to_dict(edge)
        assert result == {
            "left": "switch1",
            "right": "ap1",
            "label": "Port 5",
            "poe": True,
            "wireless": False,
            "speed": 1000,
            "channel": None,
        }


class TestSelectEdges:
    """Tests for _select_edges function."""

    def test_prefers_tree_edges(self) -> None:
        tree = [MockEdge("a", "b")]
        raw = [MockEdge("c", "d")]
        topology = MockTopologyResult(tree_edges=tree, raw_edges=raw)
        assert _select_edges(topology) == tree

    def test_falls_back_to_raw_edges(self) -> None:
        raw = [MockEdge("c", "d")]
        topology = MockTopologyResult(tree_edges=None, raw_edges=raw)
        assert _select_edges(topology) == raw

    def test_returns_empty_if_no_edges(self) -> None:
        topology = MockTopologyResult(tree_edges=None, raw_edges=None)
        assert _select_edges(topology) == []


class TestBuildClientMacIndex:
    """Tests for _build_client_mac_index function."""

    def test_builds_index(self) -> None:
        clients: list[dict[str, Any]] = [
            {"name": "Client1", "mac": "AA:BB:CC:DD:EE:01"},
            {"name": "Client2", "mac": "AA:BB:CC:DD:EE:02"},
        ]
        result = _build_client_mac_index(clients)
        assert result == {
            "Client1": "aa:bb:cc:dd:ee:01",
            "Client2": "aa:bb:cc:dd:ee:02",
        }

    def test_skips_clients_without_mac(self) -> None:
        clients: list[dict[str, Any]] = [
            {"name": "Client1", "mac": "AA:BB:CC:DD:EE:01"},
            {"name": "Client2"},
        ]
        result = _build_client_mac_index(clients)
        assert "Client2" not in result

    def test_returns_empty_for_none(self) -> None:
        assert _build_client_mac_index(None) == {}

    def test_returns_empty_for_empty_list(self) -> None:
        assert _build_client_mac_index([]) == {}


class TestBuildDeviceMacIndex:
    """Tests for _build_device_mac_index function."""

    def test_builds_index(self) -> None:
        devices = [
            MockDevice(name="Switch1", mac="AA:BB:CC:DD:EE:01"),
            MockDevice(name="AP1", mac="AA:BB:CC:DD:EE:02"),
        ]
        result = _build_device_mac_index(devices)
        assert result == {
            "Switch1": "aa:bb:cc:dd:ee:01",
            "AP1": "aa:bb:cc:dd:ee:02",
        }

    def test_skips_devices_without_mac_or_name(self) -> None:
        devices = [
            MockDevice(name="Switch1", mac="AA:BB:CC:DD:EE:01"),
            MockDevice(name=None, mac="AA:BB:CC:DD:EE:02"),
            MockDevice(name="AP1", mac=None),
        ]
        result = _build_device_mac_index(devices)
        assert result == {"Switch1": "aa:bb:cc:dd:ee:01"}


class TestBuildClientIpIndex:
    """Tests for _build_client_ip_index function."""

    def test_builds_index(self) -> None:
        clients: list[dict[str, Any]] = [
            {"name": "Client1", "ip": "192.168.1.100"},
            {"name": "Client2", "ip": "192.168.1.101"},
        ]
        result = _build_client_ip_index(clients)
        assert result == {
            "Client1": "192.168.1.100",
            "Client2": "192.168.1.101",
        }

    def test_returns_empty_for_none(self) -> None:
        assert _build_client_ip_index(None) == {}


class TestBuildDeviceIpIndex:
    """Tests for _build_device_ip_index function."""

    def test_builds_index(self) -> None:
        devices = [
            MockDevice(name="Switch1", ip="192.168.1.1"),
            MockDevice(name="AP1", ip="192.168.1.2"),
        ]
        result = _build_device_ip_index(devices)
        assert result == {
            "Switch1": "192.168.1.1",
            "AP1": "192.168.1.2",
        }


class TestBuildNodeVlanIndex:
    """Tests for _build_node_vlan_index function."""

    def test_builds_index(self) -> None:
        clients: list[dict[str, Any]] = [
            {"name": "Client1", "vlan": 10},
            {"name": "Client2", "vlan": 20},
        ]
        result = _build_node_vlan_index(clients, [])
        assert result == {"Client1": 10, "Client2": 20}

    def test_uses_network_name_map_fallback(self) -> None:
        clients: list[dict[str, Any]] = [{"name": "Client1", "network": "IoT"}]
        networks: list[dict[str, Any]] = [{"name": "IoT", "vlan": 10}]
        result = _build_node_vlan_index(clients, networks)
        assert result == {"Client1": 10}

    def test_returns_empty_for_none(self) -> None:
        assert _build_node_vlan_index(None, []) == {}


class TestBuildVlanInfo:
    """Tests for _build_vlan_info function."""

    def test_builds_info_from_clients(self) -> None:
        clients: list[dict[str, Any]] = [
            {"name": "Client1", "vlan": 10, "network": "IoT"},
            {"name": "Client2", "vlan": 10, "network": "IoT"},
        ]
        result = _build_vlan_info(clients, [])
        assert 10 in result
        assert result[10]["name"] == "IoT"
        assert result[10]["client_count"] == 2
        assert "Client1" in result[10]["clients"]

    def test_merges_network_names(self) -> None:
        clients: list[dict[str, Any]] = [{"name": "Client1", "vlan": 10}]
        networks: list[dict[str, Any]] = [{"name": "IoT Network", "vlan": 10}]
        result = _build_vlan_info(clients, networks)
        assert result[10]["name"] == "IoT Network"

    def test_adds_networks_with_zero_clients(self) -> None:
        networks: list[dict[str, Any]] = [{"name": "EmptyNetwork", "vlan": 99}]
        result = _build_vlan_info([], networks)
        assert 99 in result
        assert result[99]["name"] == "EmptyNetwork"
        assert result[99]["client_count"] == 0

    def test_limits_clients_list_to_20(self) -> None:
        clients: list[dict[str, Any]] = [{"name": f"Client{i}", "vlan": 10} for i in range(30)]
        result = _build_vlan_info(clients, [])
        assert len(result[10]["clients"]) == 20


class TestBuildApClientCounts:
    """Tests for _build_ap_client_counts function."""

    def test_counts_wireless_clients(self) -> None:
        devices = [MockDevice(name="AP1", mac="aa:bb:cc:dd:ee:01")]
        clients: list[dict[str, Any]] = [
            {"name": "Client1", "ap_mac": "aa:bb:cc:dd:ee:01"},
            {"name": "Client2", "ap_mac": "aa:bb:cc:dd:ee:01"},
            {"name": "Client3", "ap_mac": "aa:bb:cc:dd:ee:02"},  # Unknown AP
        ]
        result = _build_ap_client_counts(clients, devices)
        assert result == {"AP1": 2}

    def test_ignores_wired_clients(self) -> None:
        devices = [MockDevice(name="Switch1", mac="aa:bb:cc:dd:ee:01")]
        clients: list[dict[str, Any]] = [{"name": "Client1"}]  # No ap_mac
        result = _build_ap_client_counts(clients, devices)
        assert result == {}

    def test_handles_empty_lists(self) -> None:
        assert _build_ap_client_counts([], []) == {}


class TestBuildDeviceDetails:
    """Tests for _build_device_details function."""

    def test_builds_details(self) -> None:
        uplink = MockDevice(name="Gateway")
        devices = [
            MockDevice(
                name="Switch1",
                mac="AA:BB:CC:DD:EE:01",
                ip="192.168.1.1",
                model="USW-24",
                model_name="Switch 24",
                uplink=uplink,
            )
        ]
        result = _build_device_details(devices)
        assert result == {
            "Switch1": {
                "mac": "aa:bb:cc:dd:ee:01",
                "ip": "192.168.1.1",
                "model": "USW-24",
                "model_name": "Switch 24",
                "uplink_device": "Gateway",
            }
        }

    def test_handles_none_uplink(self) -> None:
        devices = [MockDevice(name="Switch1", mac="aa:bb", uplink=None)]
        result = _build_device_details(devices)
        assert result["Switch1"]["uplink_device"] is None

    def test_skips_devices_without_name(self) -> None:
        devices = [MockDevice(name=None, mac="aa:bb")]
        assert _build_device_details(devices) == {}


class TestBuildDevicePorts:
    """Tests for _build_device_ports function."""

    def test_builds_port_list(self) -> None:
        ports = [
            MockPort(
                port_idx=1, name="Port 1", speed=1000, poe_enable=True, poe_good=True, poe_power=5.5
            ),
            MockPort(port_idx=2, name="Port 2", speed=100, poe_enable=False, poe_good=False),
        ]
        devices = [MockDevice(name="Switch1", port_table=ports)]
        result = _build_device_ports(devices)
        assert "Switch1" in result
        assert len(result["Switch1"]) == 2
        assert result["Switch1"][0]["port"] == 1
        assert result["Switch1"][0]["poe_active"] is True
        assert result["Switch1"][0]["poe_power"] == 5.5
        assert result["Switch1"][1]["poe_active"] is False
        assert result["Switch1"][1]["poe_power"] is None

    def test_skips_ports_without_idx(self) -> None:
        ports = [MockPort(port_idx=None, name="Unknown")]
        devices = [MockDevice(name="Switch1", port_table=ports)]
        result = _build_device_ports(devices)
        assert result == {}

    def test_skips_devices_without_ports(self) -> None:
        devices = [MockDevice(name="Switch1", port_table=None)]
        assert _build_device_ports(devices) == {}

    def test_sorts_by_port_number(self) -> None:
        ports = [
            MockPort(port_idx=3, name="Port 3"),
            MockPort(port_idx=1, name="Port 1"),
            MockPort(port_idx=2, name="Port 2"),
        ]
        devices = [MockDevice(name="Switch1", port_table=ports)]
        result = _build_device_ports(devices)
        port_nums = [p["port"] for p in result["Switch1"]]
        assert port_nums == [1, 2, 3]


class TestBuildClientDetails:
    """Tests for _build_client_details function."""

    def test_builds_details(self) -> None:
        clients: list[dict[str, Any]] = [
            {
                "name": "Client1",
                "mac": "AA:BB:CC:DD:EE:01",
                "ip": "192.168.1.100",
                "vlan": 10,
                "network": "IoT",
                "is_wired": False,
                "ap_mac": "11:22:33:44:55:66",
            }
        ]
        result = _build_client_details(clients)
        assert "aa:bb:cc:dd:ee:01" in result
        detail = result["aa:bb:cc:dd:ee:01"]
        assert detail["name"] == "Client1"
        assert detail["ip"] == "192.168.1.100"
        assert detail["vlan"] == 10
        assert detail["network"] == "IoT"
        assert detail["is_wired"] is False
        assert detail["connected_to_mac"] == "11:22:33:44:55:66"

    def test_skips_clients_without_mac(self) -> None:
        clients: list[dict[str, Any]] = [{"name": "NoMac"}]
        assert _build_client_details(clients) == {}

    def test_handles_sw_mac_fallback(self) -> None:
        clients: list[dict[str, Any]] = [
            {"mac": "aa:bb:cc:dd:ee:01", "sw_mac": "11:22:33:44:55:66"}
        ]
        result = _build_client_details(clients)
        assert result["aa:bb:cc:dd:ee:01"]["connected_to_mac"] == "11:22:33:44:55:66"


class TestRendererErrorHandling:
    """Tests for renderer error handling."""

    def test_wraps_key_error(self) -> None:
        with patch(
            "custom_components.unifi_network_map.renderer._render_map",
            side_effect=KeyError("test"),
        ):
            renderer = UniFiNetworkMapRenderer()
            config = MagicMock()
            settings = RenderSettings(
                include_ports=True,
                include_clients=True,
                client_scope="all",
                only_unifi=False,
                svg_isometric=False,
                svg_width=None,
                svg_height=None,
                use_cache=False,
            )
            with pytest.raises(UniFiNetworkMapError):
                renderer.render(config, settings)

    def test_wraps_type_error(self) -> None:
        with patch(
            "custom_components.unifi_network_map.renderer._render_map",
            side_effect=TypeError("test"),
        ):
            renderer = UniFiNetworkMapRenderer()
            config = MagicMock()
            settings = RenderSettings(
                include_ports=True,
                include_clients=True,
                client_scope="all",
                only_unifi=False,
                svg_isometric=False,
                svg_width=None,
                svg_height=None,
                use_cache=False,
            )
            with pytest.raises(UniFiNetworkMapError):
                renderer.render(config, settings)

    def test_wraps_value_error(self) -> None:
        with patch(
            "custom_components.unifi_network_map.renderer._render_map",
            side_effect=ValueError("test"),
        ):
            renderer = UniFiNetworkMapRenderer()
            config = MagicMock()
            settings = RenderSettings(
                include_ports=True,
                include_clients=True,
                client_scope="all",
                only_unifi=False,
                svg_isometric=False,
                svg_width=None,
                svg_height=None,
                use_cache=False,
            )
            with pytest.raises(UniFiNetworkMapError):
                renderer.render(config, settings)


class TestExtractWanInfo:
    """Tests for _extract_wan_info function."""

    def test_passes_wan_params_to_extract_wan_info(self) -> None:
        gateway = MockDevice(name="Gateway")
        devices = [gateway]
        settings = RenderSettings(
            include_ports=True,
            include_clients=False,
            client_scope="wired",
            only_unifi=False,
            svg_isometric=False,
            svg_width=None,
            svg_height=None,
            use_cache=False,
            show_wan=True,
            wan_label="KPN Fiber",
            wan_speed="1 Gbps",
            wan2_label="Backup ISP",
            wan2_speed="100 Mbps",
            wan2_disabled="true",
        )
        with (
            patch(
                "custom_components.unifi_network_map.renderer.group_devices_by_type",
                return_value={"gateway": ["Gateway"]},
            ),
            patch(
                "custom_components.unifi_network_map.renderer.extract_wan_info",
            ) as mock_extract,
        ):
            mock_extract.return_value = None
            _extract_wan_info(devices, settings)

            mock_extract.assert_called_once_with(
                gateway,
                wan1_label="KPN Fiber",
                wan1_isp_speed="1 Gbps",
                wan2_label="Backup ISP",
                wan2_isp_speed="100 Mbps",
                wan2_disabled="true",
            )

    def test_empty_labels_passed_as_none(self) -> None:
        gateway = MockDevice(name="Gateway")
        devices = [gateway]
        settings = RenderSettings(
            include_ports=True,
            include_clients=False,
            client_scope="wired",
            only_unifi=False,
            svg_isometric=False,
            svg_width=None,
            svg_height=None,
            use_cache=False,
            show_wan=True,
            wan_label="",
            wan_speed="",
            wan2_label="",
            wan2_speed="",
            wan2_disabled="auto",
        )
        with (
            patch(
                "custom_components.unifi_network_map.renderer.group_devices_by_type",
                return_value={"gateway": ["Gateway"]},
            ),
            patch(
                "custom_components.unifi_network_map.renderer.extract_wan_info",
            ) as mock_extract,
        ):
            mock_extract.return_value = None
            _extract_wan_info(devices, settings)

            mock_extract.assert_called_once_with(
                gateway,
                wan1_label=None,
                wan1_isp_speed=None,
                wan2_label=None,
                wan2_isp_speed=None,
                wan2_disabled="auto",
            )

    def test_returns_none_when_show_wan_disabled(self) -> None:
        settings = RenderSettings(
            include_ports=True,
            include_clients=False,
            client_scope="wired",
            only_unifi=False,
            svg_isometric=False,
            svg_width=None,
            svg_height=None,
            use_cache=False,
            show_wan=False,
        )
        result = _extract_wan_info([], settings)
        assert result is None
