from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from unifi_network_maps.adapters.config import Config
from unifi_network_maps.adapters.unifi import fetch_clients, fetch_devices
from unifi_network_maps.model.topology import (
    Device,
    Edge,
    TopologyResult,
    build_device_index,
    build_client_edges,
    build_node_type_map,
    build_topology,
    group_devices_by_type,
    normalize_devices,
)
from unifi_network_maps.render.svg import SvgOptions, render_svg, render_svg_isometric

from .data import UniFiNetworkMapData
from .errors import UniFiNetworkMapError


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


class UniFiNetworkMapRenderer:
    def render(self, config: Config, settings: RenderSettings) -> UniFiNetworkMapData:
        try:
            return _render_map(config, settings)
        except Exception as err:  # noqa: BLE001
            raise UniFiNetworkMapError(
                f"Failed to render UniFi network map: {err}"
            ) from err


def _render_map(config: Config, settings: RenderSettings) -> UniFiNetworkMapData:
    devices = _load_devices(config, settings)
    topology, gateways = _build_topology(devices, settings)
    edges, clients = _apply_clients(config, settings, topology, devices)
    node_types = build_node_type_map(devices, clients, client_mode=settings.client_scope)
    svg = _render_svg(edges, node_types, settings)
    payload = _build_payload(edges, node_types, gateways)
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
) -> tuple[list[Edge], list[object] | None]:
    edges = _select_edges(topology)
    clients = _load_clients(config, settings)
    if not clients:
        return edges, None
    device_index = build_device_index(devices)
    client_edges = build_client_edges(
        clients,
        device_index,
        include_ports=settings.include_ports,
        client_mode=settings.client_scope,
    )
    return edges + client_edges, clients


def _select_edges(topology: TopologyResult) -> list[Edge]:
    return topology.tree_edges or topology.raw_edges


def _load_clients(config: Config, settings: RenderSettings) -> list[object] | None:
    if not settings.include_clients:
        return None
    return list(fetch_clients(config, site=config.site, use_cache=settings.use_cache))


def _render_svg(
    edges: list[Edge],
    node_types: dict[str, str],
    settings: RenderSettings,
) -> str:
    options = SvgOptions(width=settings.svg_width, height=settings.svg_height)
    if settings.svg_isometric:
        return render_svg_isometric(edges, node_types=node_types, options=options)
    return render_svg(edges, node_types=node_types, options=options)


def _build_payload(
    edges: list[Edge],
    node_types: dict[str, str],
    gateways: list[str],
) -> dict[str, Any]:
    return {
        "edges": [_edge_to_dict(edge) for edge in edges],
        "node_types": node_types,
        "gateways": gateways,
    }


def _edge_to_dict(edge: Edge) -> dict[str, Any]:
    return {
        "left": edge.left,
        "right": edge.right,
        "label": edge.label,
        "poe": edge.poe,
        "wireless": edge.wireless,
    }
