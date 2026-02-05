from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, Mapping, Protocol, TypedDict, cast

from unifi_network_maps.adapters.config import Config
from unifi_network_maps.adapters.unifi import fetch_clients, fetch_devices
from unifi_network_maps.cli.runtime import normalize_devices
from unifi_network_maps.model.clients import build_client_edges, build_node_type_map
from unifi_network_maps.model.edges import build_device_index, build_topology, group_devices_by_type
from unifi_network_maps.model.topology import Device, Edge, TopologyResult, WanInfo
from unifi_network_maps.model.wan import extract_wan_info
from unifi_network_maps.render.svg import SvgOptions, render_svg
from unifi_network_maps.render.svg_isometric import render_svg_isometric

from .const import LOGGER, PAYLOAD_SCHEMA_VERSION
from .data import UniFiNetworkMapData
from .errors import UniFiNetworkMapError

if TYPE_CHECKING:
    from unifi_controller_api import UnifiController


@dataclass(frozen=True)
class RenderSettings:
    include_ports: bool
    include_clients: bool
    client_scope: str
    only_unifi: bool
    svg_isometric: bool
    svg_width: int | None
    svg_height: int | None
    use_cache: bool
    svg_theme: str | None = None
    icon_set: str | None = None
    show_wan: bool = True


class ClientDict(TypedDict, total=False):
    name: str
    hostname: str
    mac: str
    ip: str


class ClientLike(Protocol):
    name: str | None
    hostname: str | None
    mac: str | None
    ip: str | None


ClientData = ClientLike | Mapping[str, Any]


class UniFiNetworkMapRenderer:
    def render(self, config: Config, settings: RenderSettings) -> UniFiNetworkMapData:
        try:
            return _render_map(config, settings)
        except (KeyError, TypeError, ValueError) as err:
            LOGGER.debug(
                "renderer failed site=%s error=%s message=%s",
                config.site,
                type(err).__name__,
                str(err),
            )
            raise UniFiNetworkMapError(f"Failed to render UniFi network map: {err}") from err


def _render_map(config: Config, settings: RenderSettings) -> UniFiNetworkMapData:
    LOGGER.debug(
        "renderer started site=%s include_clients=%s client_scope=%s",
        config.site,
        settings.include_clients,
        settings.client_scope,
    )
    devices = _load_devices(config, settings)
    LOGGER.debug("renderer devices_loaded count=%d", len(devices))
    topology, gateways = _build_topology(devices, settings)
    edges, clients = _apply_clients(config, settings, topology, devices)
    client_count = len(clients) if clients else 0
    LOGGER.debug(
        "renderer topology_built edges=%d clients=%d gateways=%d",
        len(edges),
        client_count,
        len(gateways),
    )
    node_types = build_node_type_map(devices, clients, client_mode=settings.client_scope)
    wan_info = _extract_wan_info(devices, settings)
    svg = _render_svg(edges, node_types, settings, wan_info)
    # Always fetch clients for stats (wireless counts per AP)
    all_clients = _load_all_clients(config, settings)
    networks = _load_networks(config, settings)
    payload = _build_payload(edges, node_types, gateways, clients, devices, all_clients, networks)
    LOGGER.debug("renderer completed nodes=%d svg_bytes=%d", len(node_types), len(svg))
    return UniFiNetworkMapData(svg=svg, payload=payload)


def _load_devices(config: Config, settings: RenderSettings) -> list[Device]:
    raw_devices = list(
        fetch_devices(
            config,
            site=config.site,
            detailed=True,
            use_cache=settings.use_cache,
        )
    )
    return normalize_devices(raw_devices)


def _build_topology(
    devices: list[Device], settings: RenderSettings
) -> tuple[TopologyResult, list[str]]:
    groups = group_devices_by_type(devices)
    gateways = groups.get("gateway", [])
    topology = build_topology(
        devices,
        include_ports=settings.include_ports,
        only_unifi=settings.only_unifi,
        gateways=gateways,
    )
    return topology, gateways


def _apply_clients(
    config: Config,
    settings: RenderSettings,
    topology: TopologyResult,
    devices: list[Device],
) -> tuple[list[Edge], list[ClientData] | None]:
    edges = _select_edges(topology)
    clients = _load_clients(config, settings)
    if not clients:
        return edges, None
    client_edges = _build_client_edges(devices, clients, settings)
    return edges + client_edges, clients


def _build_client_edges(
    devices: list[Device],
    clients: list[ClientData],
    settings: RenderSettings,
) -> list[Edge]:
    device_index = build_device_index(devices)
    return build_client_edges(
        clients,
        device_index,
        include_ports=settings.include_ports,
        client_mode=settings.client_scope,
    )


def _select_edges(topology: TopologyResult) -> list[Edge]:
    return topology.tree_edges or topology.raw_edges or []


def _load_clients(config: Config, settings: RenderSettings) -> list[ClientData] | None:
    if not settings.include_clients:
        return None
    return cast(
        list[ClientData],
        list(fetch_clients(config, site=config.site, use_cache=settings.use_cache)),
    )


def _load_all_clients(config: Config, settings: RenderSettings) -> list[ClientData]:
    """Load all clients for stats purposes (always fetched regardless of include_clients)."""
    return cast(
        list[ClientData],
        list(fetch_clients(config, site=config.site, use_cache=settings.use_cache)),
    )


def fetch_networks(
    config: Config, *, site: str | None = None, use_cache: bool = True
) -> list[Mapping[str, Any]]:
    """Fetch UniFi network configurations with fallback for older libraries."""
    try:
        from unifi_network_maps.adapters.unifi import fetch_networks as upstream_fetch_networks
    except ImportError:
        return _load_networks_fallback(config)
    networks = upstream_fetch_networks(config, site=site, use_cache=use_cache)
    return [network for network in networks if isinstance(network, Mapping)]


def _load_networks(config: Config, settings: RenderSettings) -> list[Mapping[str, Any]]:
    """Load UniFi network configurations to include VLANs with zero clients."""
    try:
        networks = fetch_networks(config, site=config.site, use_cache=settings.use_cache)
    except Exception as err:  # noqa: BLE001 - keep map rendering usable without networks
        LOGGER.debug(
            "renderer network_fetch_failed site=%s error=%s", config.site, type(err).__name__
        )
        return []
    return networks


def _load_networks_fallback(config: Config) -> list[Mapping[str, Any]]:
    """Fallback network fetch for older unifi-network-maps versions."""
    LOGGER.info(
        "renderer network_fetch_fallback reason=missing_fetch_networks site=%s",
        config.site,
    )
    try:
        from unifi_controller_api import UnifiAuthenticationError, UnifiController
    except ImportError:
        return []

    controller = _init_controller_for_networks(UnifiController, UnifiAuthenticationError, config)
    if controller is None:
        return []
    try:
        networks = controller.get_unifi_site_networkconf(site_name=config.site, raw=True)
    except Exception as err:  # noqa: BLE001 - keep map rendering usable without networks
        LOGGER.debug(
            "renderer network_fetch_failed site=%s error=%s", config.site, type(err).__name__
        )
        return []
    return [network for network in networks if isinstance(network, Mapping)]


def _init_controller_for_networks(
    controller_cls: type["UnifiController"],
    auth_error: type[Exception],
    config: Config,
) -> "UnifiController | None":
    try:
        return controller_cls(
            controller_url=config.url,
            username=config.user,
            password=config.password,
            is_udm_pro=True,
            verify_ssl=config.verify_ssl,
        )
    except auth_error:
        pass
    try:
        return controller_cls(
            controller_url=config.url,
            username=config.user,
            password=config.password,
            is_udm_pro=False,
            verify_ssl=config.verify_ssl,
        )
    except auth_error:
        return None


def _render_svg(
    edges: list[Edge],
    node_types: dict[str, str],
    settings: RenderSettings,
    wan_info: WanInfo | None = None,
) -> str:
    LOGGER.debug(
        "renderer svg_render_started svg_theme=%s icon_set=%s isometric=%s wan=%s",
        settings.svg_theme,
        settings.icon_set,
        settings.svg_isometric,
        wan_info is not None,
    )
    options = SvgOptions(width=settings.svg_width, height=settings.svg_height)
    theme = _resolve_svg_theme(settings.svg_theme, settings.icon_set)
    if settings.svg_isometric:
        return render_svg_isometric(
            edges, node_types=node_types, options=options, theme=theme, wan_info=wan_info
        )
    return render_svg(edges, node_types=node_types, options=options, theme=theme, wan_info=wan_info)


def _resolve_svg_theme(svg_theme: str | None, icon_set: str | None):
    """Load SVG theme by name and apply icon_set override."""
    from dataclasses import replace

    theme = _load_builtin_svg_theme(svg_theme)
    if icon_set and theme.icon_set != icon_set:
        theme = replace(theme, icon_set=icon_set)
    return theme


def _load_builtin_svg_theme(theme_name: str | None):
    """Load a built-in SVG theme, working around Docker path restrictions.

    The library's resolve_themes() validates that theme files are within
    /config, /root, or /tmp. In Docker, the library's assets directory is
    in /usr/local/lib/... which fails this check. We copy the theme file
    to /tmp before loading.
    """
    import importlib.resources
    import shutil
    import tempfile
    from pathlib import Path

    from unifi_network_maps.render.theme import BUILTIN_THEMES, DEFAULT_SVG_THEME, load_theme

    if not theme_name:
        return DEFAULT_SVG_THEME
    if theme_name not in BUILTIN_THEMES:
        LOGGER.warning("renderer unknown_theme theme=%s using_default=True", theme_name)
        return DEFAULT_SVG_THEME

    theme_filename = BUILTIN_THEMES[theme_name]
    theme_resource = importlib.resources.files("unifi_network_maps.assets.themes") / theme_filename

    tmp_path = Path(tempfile.gettempdir()) / f"unifi_theme_{theme_filename}"
    try:
        with importlib.resources.as_file(theme_resource) as source_path:
            shutil.copy(source_path, tmp_path)
        _, svg_theme = load_theme(tmp_path)
        return svg_theme
    except Exception as err:
        LOGGER.warning("renderer theme_load_failed theme=%s error=%s", theme_name, err)
        return DEFAULT_SVG_THEME
    finally:
        tmp_path.unlink(missing_ok=True)


def _extract_wan_info(devices: list[Device], settings: RenderSettings) -> WanInfo | None:
    """Extract WAN info from the gateway device if show_wan is enabled."""
    if not settings.show_wan:
        return None
    groups = group_devices_by_type(devices)
    gateway_names = groups.get("gateway", [])
    if not gateway_names:
        return None
    gateway_name = gateway_names[0]
    for device in devices:
        if device.name == gateway_name:
            wan_info = extract_wan_info(device)
            if wan_info and (wan_info.wan1 or wan_info.wan2):
                LOGGER.debug(
                    "renderer wan_info_extracted gateway=%s wan1=%s wan2=%s",
                    gateway_name,
                    wan_info.wan1 is not None,
                    wan_info.wan2 is not None,
                )
                return wan_info
            break
    return None


def _build_payload(
    edges: list[Edge],
    node_types: dict[str, str],
    gateways: list[str],
    clients: list[ClientData] | None,
    devices: list[Device],
    all_clients: list[ClientData],
    networks: list[Mapping[str, Any]],
) -> dict[str, Any]:
    return {
        "schema_version": PAYLOAD_SCHEMA_VERSION,
        "edges": [_edge_to_dict(edge) for edge in edges],
        "node_types": node_types,
        "gateways": gateways,
        "client_macs": _build_client_mac_index(clients),
        "device_macs": _build_device_mac_index(devices),
        "client_ips": _build_client_ip_index(clients),
        "device_ips": _build_device_ip_index(devices),
        "node_vlans": _build_node_vlan_index(clients, networks),
        "vlan_info": _build_vlan_info(clients, networks),
        "ap_client_counts": _build_ap_client_counts(all_clients, devices),
        "device_details": _build_device_details(devices),
        "client_details": _build_client_details(all_clients),
        "device_ports": _build_device_ports(devices),
    }


def _edge_to_dict(edge: Edge) -> dict[str, Any]:
    return {
        "left": edge.left,
        "right": edge.right,
        "label": edge.label,
        "poe": edge.poe,
        "wireless": edge.wireless,
        "speed": edge.speed,
        "channel": edge.channel,
    }


def _build_client_mac_index(clients: list[ClientData] | None) -> dict[str, str]:
    if not clients:
        return {}
    client_macs: dict[str, str] = {}
    for client in clients:
        name = _client_display_name(client)
        mac = _client_mac(client)
        if not name or not mac:
            continue
        client_macs[name] = mac.strip().lower()
    return client_macs


def _build_device_mac_index(devices: list[Device]) -> dict[str, str]:
    device_macs: dict[str, str] = {}
    for device in devices:
        if device.name and device.mac:
            device_macs[device.name] = device.mac.strip().lower()
    return device_macs


def _build_client_ip_index(clients: list[ClientData] | None) -> dict[str, str]:
    if not clients:
        return {}
    client_ips: dict[str, str] = {}
    for client in clients:
        name = _client_display_name(client)
        ip = _client_ip(client)
        if not name or not ip:
            continue
        client_ips[name] = ip.strip()
    return client_ips


def _build_device_ip_index(devices: list[Device]) -> dict[str, str]:
    device_ips: dict[str, str] = {}
    for device in devices:
        if device.name and device.ip:
            device_ips[device.name] = device.ip.strip()
    return device_ips


def _client_display_name(client: ClientData) -> str | None:
    for key in ("name", "hostname", "mac"):
        value = _client_field(client, key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def _client_mac(client: ClientData) -> str | None:
    value = _client_field(client, "mac")
    if isinstance(value, str) and value.strip():
        return value.strip()
    return None


def _client_ip(client: ClientData) -> str | None:
    value = _client_field(client, "ip")
    if isinstance(value, str) and value.strip():
        return value.strip()
    return None


def _client_field(client: ClientData, name: str) -> object | None:
    if isinstance(client, Mapping):
        return client.get(name)
    return getattr(client, name, None)


def _client_vlan(client: ClientData) -> int | None:
    """Extract VLAN ID from client data.

    Checks 'vlan' field first, falls back to 'network_id'.
    """
    vlan = _client_field(client, "vlan")
    if isinstance(vlan, int):
        return vlan
    if isinstance(vlan, str) and vlan.isdigit():
        return int(vlan)
    network_id = _client_field(client, "network_id")
    if isinstance(network_id, int):
        return network_id
    if isinstance(network_id, str) and network_id.isdigit():
        return int(network_id)
    return None


def _client_network_name(client: ClientData) -> str | None:
    """Extract network/SSID name from client data."""
    for key in ("network", "essid", "network_name"):
        value = _client_field(client, key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def _build_node_vlan_index(
    clients: list[ClientData] | None, networks: list[Mapping[str, Any]]
) -> dict[str, int | None]:
    """Map node names to their VLAN IDs."""
    if not clients:
        return {}
    network_name_map = _build_network_name_map(networks)
    node_vlans: dict[str, int | None] = {}
    for client in clients:
        name = _client_display_name(client)
        if not name:
            continue
        vlan = _client_vlan(client)
        if vlan is None:
            vlan = _client_vlan_from_network_name(client, network_name_map)
        node_vlans[name] = vlan
    return node_vlans


def _build_vlan_info(
    clients: list[ClientData] | None, networks: list[Mapping[str, Any]]
) -> dict[int, dict[str, Any]]:
    """Build VLAN metadata (id, name, client_count, clients) from client + network data."""
    network_name_map = _build_network_name_map(networks)
    vlan_info, vlan_clients = _build_vlan_info_from_clients(clients, network_name_map)
    _merge_vlan_info_from_networks(vlan_info, networks)
    _finalize_vlan_info(vlan_info, vlan_clients)
    return vlan_info


def _build_vlan_info_from_clients(
    clients: list[ClientData] | None,
    network_name_map: dict[str, int],
) -> tuple[dict[int, dict[str, Any]], dict[int, list[str]]]:
    vlan_info: dict[int, dict[str, Any]] = {}
    vlan_clients: dict[int, list[str]] = {}
    if not clients:
        return vlan_info, vlan_clients
    for client in clients:
        vlan = _client_vlan(client)
        if vlan is None:
            vlan = _client_vlan_from_network_name(client, network_name_map)
        if vlan is None:
            continue
        client_name = _client_display_name(client)
        if client_name:
            vlan_clients.setdefault(vlan, []).append(client_name)
        if vlan in vlan_info:
            continue
        network_name = _client_network_name(client)
        vlan_info[vlan] = {
            "id": vlan,
            "name": network_name or f"VLAN {vlan}",
        }
    return vlan_info, vlan_clients


def _merge_vlan_info_from_networks(
    vlan_info: dict[int, dict[str, Any]], networks: list[Mapping[str, Any]]
) -> None:
    for network in networks:
        vlan_id = _network_vlan_id(network)
        if vlan_id is None:
            continue
        name = _network_name(network, vlan_id)
        if vlan_id not in vlan_info:
            vlan_info[vlan_id] = {"id": vlan_id, "name": name}
            continue
        if name and _is_default_vlan_name(vlan_info[vlan_id].get("name")):
            vlan_info[vlan_id]["name"] = name


def _finalize_vlan_info(
    vlan_info: dict[int, dict[str, Any]], vlan_clients: dict[int, list[str]]
) -> None:
    max_clients_in_list = 20
    for vlan_id, info in vlan_info.items():
        clients_list = vlan_clients.get(vlan_id, [])
        info["client_count"] = len(clients_list)
        info["clients"] = clients_list[:max_clients_in_list]


def _network_vlan_id(network: Mapping[str, Any]) -> int | None:
    vlan = network.get("vlan")
    if isinstance(vlan, int):
        return vlan
    if isinstance(vlan, str) and vlan.isdigit():
        return int(vlan)
    vlan_enabled = network.get("vlan_enabled")
    if vlan_enabled is True:
        return None
    purpose = str(network.get("purpose", "")).lower()
    if purpose in {"corporate", "guest"}:
        return 1
    return None


def _network_name(network: Mapping[str, Any], vlan_id: int) -> str:
    name = network.get("name")
    if isinstance(name, str) and name.strip():
        return name.strip()
    return f"VLAN {vlan_id}"


def _is_default_vlan_name(value: object) -> bool:
    return isinstance(value, str) and value.lower().startswith("vlan ")


def _build_network_name_map(networks: list[Mapping[str, Any]]) -> dict[str, int]:
    name_map: dict[str, int] = {}
    for network in networks:
        vlan_id = _network_vlan_id(network)
        if vlan_id is None:
            continue
        name = _network_name(network, vlan_id).strip().lower()
        if name:
            name_map[name] = vlan_id
    return name_map


def _client_vlan_from_network_name(
    client: ClientData, network_name_map: dict[str, int]
) -> int | None:
    network_name = _client_network_name(client)
    if not network_name:
        return None
    return network_name_map.get(network_name.strip().lower())


def _build_ap_client_counts(clients: list[ClientData], devices: list[Device]) -> dict[str, int]:
    """Build wireless client counts per access point.

    Returns a dict mapping AP name to the number of wireless clients connected to it.
    """
    # Build MAC to device name mapping for APs
    ap_mac_to_name: dict[str, str] = {}
    for device in devices:
        if device.mac and device.name:
            ap_mac_to_name[device.mac.strip().lower()] = device.name

    # Count wireless clients per AP
    ap_counts: dict[str, int] = {}
    for client in clients:
        # Check if client is wireless (has ap_mac field)
        ap_mac = _client_field(client, "ap_mac")
        if not ap_mac or not isinstance(ap_mac, str):
            continue
        ap_mac_normalized = ap_mac.strip().lower()
        ap_name = ap_mac_to_name.get(ap_mac_normalized)
        if ap_name:
            ap_counts[ap_name] = ap_counts.get(ap_name, 0) + 1

    return ap_counts


def _build_device_details(devices: list[Device]) -> dict[str, dict[str, Any]]:
    """Build detailed device info for entity attributes.

    Returns a dict mapping device name to details including mac, ip, model, and uplink.
    """
    details: dict[str, dict[str, Any]] = {}
    for device in devices:
        if not device.name:
            continue
        uplink_name = device.uplink.name if device.uplink else None
        details[device.name] = {
            "mac": device.mac.strip().lower() if device.mac else None,
            "ip": device.ip.strip() if device.ip else None,
            "model": device.model,
            "model_name": device.model_name,
            "uplink_device": uplink_name,
        }
    return details


def _build_device_ports(devices: list[Device]) -> dict[str, list[dict[str, Any]]]:
    """Build port information for each device.

    Returns a dict mapping device name to list of port details including
    port number, name, speed, PoE status, and power consumption.
    """
    result: dict[str, list[dict[str, Any]]] = {}
    for device in devices:
        if not device.name or not device.port_table:
            continue
        ports: list[dict[str, Any]] = []
        for port in device.port_table:
            if port.port_idx is None:
                continue
            poe_active = port.poe_enable and port.poe_good
            ports.append(
                {
                    "port": port.port_idx,
                    "name": port.name,
                    "speed": port.speed,
                    "poe_enabled": port.poe_enable,
                    "poe_active": poe_active,
                    "poe_power": port.poe_power if poe_active else None,
                }
            )
        if ports:
            # Sort by port number
            ports.sort(key=lambda p: p["port"])
            result[device.name] = ports
    return result


def _build_client_details(clients: list[ClientData]) -> dict[str, dict[str, Any]]:
    """Build detailed client info indexed by MAC address.

    Returns a dict mapping client MAC to details for presence sensor attributes.
    """
    details: dict[str, dict[str, Any]] = {}
    for client in clients:
        mac = _client_mac(client)
        if not mac:
            continue
        mac_normalized = mac.strip().lower()
        is_wired = _client_field(client, "is_wired")
        connected_to_mac = _client_field(client, "ap_mac") or _client_field(client, "sw_mac")
        connected_to_mac_str: str | None = None
        if isinstance(connected_to_mac, str) and connected_to_mac.strip():
            connected_to_mac_str = connected_to_mac.strip().lower()
        details[mac_normalized] = {
            "name": _client_display_name(client),
            "mac": mac_normalized,
            "ip": _client_ip(client),
            "vlan": _client_vlan(client),
            "network": _client_network_name(client),
            "is_wired": bool(is_wired) if is_wired is not None else None,
            "connected_to_mac": connected_to_mac_str,
        }
    return details
