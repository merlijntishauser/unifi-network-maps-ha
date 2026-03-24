"""Unit tests for renderer.py private functions (coverage gaps)."""

from __future__ import annotations

from dataclasses import replace
from unittest.mock import MagicMock, patch

from custom_components.unifi_network_map.renderer import (
    RenderSettings,
    _build_client_ip_index,
    _build_node_vlan_index,
    _build_vlan_info_from_clients,
    _build_vpn_tunnel_list,
    _extract_vpn_info,
    _load_builtin_svg_theme,
    _load_networks,
    _resolve_svg_theme,
)

_DEFAULT_SETTINGS = RenderSettings(
    include_ports=False,
    include_clients=False,
    client_scope="all",
    only_unifi=False,
    svg_isometric=False,
    svg_width=None,
    svg_height=None,
    use_cache=False,
    show_vpn=False,
)


# -- _load_networks ----------------------------------------------------------


def test_load_networks_returns_empty_on_error() -> None:
    """When _fetch_networks_filtered raises, _load_networks returns []."""
    config = MagicMock()
    config.site = "default"
    settings = replace(_DEFAULT_SETTINGS, use_cache=False)

    with patch(
        "custom_components.unifi_network_map.renderer"
        "._fetch_networks_filtered",
        side_effect=RuntimeError("connection refused"),
    ):
        result = _load_networks(config, settings)

    assert result == []


# -- _load_builtin_svg_theme --------------------------------------------------


def test_load_builtin_svg_theme_returns_default_for_unknown() -> None:
    """An unknown theme name falls back to DEFAULT_SVG_THEME."""
    from unifi_topology import DEFAULT_SVG_THEME

    result = _load_builtin_svg_theme("nonexistent_theme_xyz")
    assert result == DEFAULT_SVG_THEME


# -- _resolve_svg_theme -------------------------------------------------------


def test_resolve_svg_theme_overrides_icon_set() -> None:
    """When icon_set differs from the theme default, it is replaced."""
    result = _resolve_svg_theme("unifi", "isometric")
    assert result.icon_set == "isometric"


# -- _extract_vpn_info --------------------------------------------------------


def test_extract_vpn_info_returns_none_when_disabled() -> None:
    """With show_vpn=False the function short-circuits to None."""
    settings = replace(_DEFAULT_SETTINGS, show_vpn=False)
    result = _extract_vpn_info([], settings)
    assert result is None


def test_extract_vpn_info_returns_tunnels_when_found() -> None:
    """With show_vpn=True and tunnels present, returns tunnel list."""
    settings = replace(_DEFAULT_SETTINGS, show_vpn=True)
    tunnel = MagicMock()
    tunnel.name = "Site-to-Site"

    with patch(
        "custom_components.unifi_network_map.renderer.extract_vpn_tunnels",
        return_value=[tunnel],
    ):
        result = _extract_vpn_info([MagicMock()], settings)

    assert result is not None
    assert len(result) == 1
    assert result[0].name == "Site-to-Site"


# -- _build_vpn_tunnel_list ---------------------------------------------------


def test_build_vpn_tunnel_list_returns_empty_for_none() -> None:
    """None input produces an empty list."""
    assert _build_vpn_tunnel_list(None) == []


def test_build_vpn_tunnel_list_returns_empty_for_empty() -> None:
    """Empty list input also produces an empty list."""
    assert _build_vpn_tunnel_list([]) == []


# -- _build_client_ip_index ---------------------------------------------------


def test_build_client_ip_index_skips_no_ip() -> None:
    """Clients without an ip field are excluded from the index."""
    clients = [
        {"name": "Phone", "mac": "aa:bb:cc:dd:ee:ff"},
    ]
    result = _build_client_ip_index(clients)
    assert "Phone" not in result


def test_build_client_ip_index_includes_valid_client() -> None:
    """Clients with both mac and ip are indexed by MAC."""
    clients = [
        {
            "name": "Phone",
            "mac": "aa:bb:cc:dd:ee:ff",
            "ip": "192.168.1.10",
        },
    ]
    result = _build_client_ip_index(clients)
    assert result["aa:bb:cc:dd:ee:ff"] == "192.168.1.10"


# -- _build_node_vlan_index ---------------------------------------------------


def test_build_node_vlan_index_skips_unnamed_client() -> None:
    """A client without name/hostname/mac is skipped entirely."""
    clients: list[dict[str, object]] = [
        {"ip": "10.0.0.5", "vlan": 100},
    ]
    result = _build_node_vlan_index(clients, [])
    assert len(result) == 0


def test_build_node_vlan_index_maps_named_client() -> None:
    """A client with a MAC and VLAN shows up in the index keyed by MAC."""
    clients = [
        {"name": "Laptop", "mac": "11:22:33:44:55:66", "vlan": 42},
    ]
    result = _build_node_vlan_index(clients, [])
    assert result["11:22:33:44:55:66"] == 42


# -- _build_vlan_info_from_clients --------------------------------------------


def test_build_vlan_info_from_clients_resolves_from_network_name() -> None:
    """When vlan is absent, the network name map provides the vlan id."""
    clients = [
        {
            "name": "TV",
            "mac": "aa:bb:cc:dd:ee:01",
            "network": "IoT",
        },
    ]
    network_name_map = {"iot": 200}

    vlan_info, vlan_clients = _build_vlan_info_from_clients(
        clients, network_name_map
    )

    assert 200 in vlan_info
    assert vlan_info[200]["id"] == 200
    assert "TV" in vlan_clients[200]


def test_build_vlan_info_from_clients_empty_for_none() -> None:
    """None clients produce empty dicts."""
    vlan_info, vlan_clients = _build_vlan_info_from_clients(None, {})
    assert vlan_info == {}
    assert vlan_clients == {}
