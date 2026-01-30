from __future__ import annotations

from aiohttp import web
from pathlib import Path
import re
import shutil
import tempfile
from copy import deepcopy
from importlib import resources as importlib_resources
from typing import Mapping

from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant
from unifi_network_maps.model.topology import Edge
from unifi_network_maps.render.svg import SvgOptions, render_svg, render_svg_isometric
from unifi_network_maps.render.svg_theme import SvgTheme
from unifi_network_maps.render.theme import resolve_themes

from .const import DOMAIN, LOGGER
from .coordinator import UniFiNetworkMapCoordinator
from .data import UniFiNetworkMapData
from .entity_cache import get_entity_cache
from .renderer import RenderSettings

_VIEWS_REGISTERED = "views_registered"
_MAC_ATTRIBUTE_KEYS = ("mac_address", "mac")


def register_unifi_http_views(hass: HomeAssistant) -> None:
    data = hass.data.setdefault(DOMAIN, {})
    if data.get(_VIEWS_REGISTERED):
        return
    hass.http.register_view(UniFiNetworkMapSvgView)
    hass.http.register_view(UniFiNetworkMapPayloadView)
    data[_VIEWS_REGISTERED] = True


def _get_coordinator(hass: HomeAssistant, entry_id: str) -> UniFiNetworkMapCoordinator | None:
    return hass.data.get(DOMAIN, {}).get(entry_id)


def _get_data(coordinator: UniFiNetworkMapCoordinator | None) -> UniFiNetworkMapData | None:
    if coordinator is None:
        return None
    return coordinator.data


class UniFiNetworkMapSvgView(HomeAssistantView):  # type: ignore[reportUntypedBaseClass]
    url = "/api/unifi_network_map/{entry_id}/svg"
    name = "api:unifi_network_map:svg"

    async def get(self, request: web.Request, entry_id: str) -> web.Response:
        hass = request.app["hass"]
        coordinator = _get_coordinator(hass, entry_id)
        data = _get_data(coordinator)
        if data is None:
            raise web.HTTPNotFound()
        theme_name = request.query.get("theme")
        if theme_name and coordinator is not None:
            themed_svg = await hass.async_add_executor_job(
                _render_svg_with_theme, data, coordinator, theme_name
            )
            return web.Response(text=themed_svg, content_type="image/svg+xml")
        return web.Response(text=data.svg, content_type="image/svg+xml")


class UniFiNetworkMapPayloadView(HomeAssistantView):  # type: ignore[reportUntypedBaseClass]
    url = "/api/unifi_network_map/{entry_id}/payload"
    name = "api:unifi_network_map:payload"

    async def get(self, request: web.Request, entry_id: str) -> web.Response:
        hass = request.app["hass"]
        data = _get_data(_get_coordinator(hass, entry_id))
        if data is None:
            raise web.HTTPNotFound()
        payload = build_enriched_payload(hass, deepcopy(data.payload))
        return web.json_response(payload)


def resolve_client_entity_map(hass: HomeAssistant, client_macs: dict[str, str]) -> dict[str, str]:
    return _resolve_entity_map(hass, client_macs)


def resolve_device_entity_map(hass: HomeAssistant, device_macs: dict[str, str]) -> dict[str, str]:
    return _resolve_entity_map(hass, device_macs)


def resolve_node_entity_map(
    client_entities: dict[str, str], device_entities: dict[str, str]
) -> dict[str, str]:
    merged = dict(device_entities)
    merged.update(client_entities)
    return merged


def resolve_node_status_map(
    hass: HomeAssistant, node_entities: dict[str, str]
) -> dict[str, dict[str, str | None]]:
    """Resolve device_tracker states for linked entities."""
    status_map: dict[str, dict[str, str | None]] = {}
    for node_name, entity_id in node_entities.items():
        if not entity_id.startswith("device_tracker."):
            continue
        state = hass.states.get(entity_id)
        if state is None:
            continue
        status_map[node_name] = {
            "entity_id": entity_id,
            "state": _normalize_tracker_state(state.state),
            "last_changed": state.last_changed.isoformat() if state.last_changed else None,
        }
    return status_map


def build_enriched_payload(hass: HomeAssistant, payload: dict[str, object]) -> dict[str, object]:
    """Add entity, status, and related entity data to a map payload."""
    client_macs = payload.get("client_macs", {})
    device_macs = payload.get("device_macs", {})
    if not isinstance(client_macs, dict) or not isinstance(device_macs, dict):
        return payload
    client_entities = resolve_client_entity_map(hass, client_macs)
    device_entities = resolve_device_entity_map(hass, device_macs)
    node_entities = resolve_node_entity_map(client_entities, device_entities)
    _store_payload_field(payload, "client_entities", client_entities)
    _store_payload_field(payload, "device_entities", device_entities)
    _store_payload_field(payload, "node_entities", node_entities)
    node_status = resolve_node_status_map(hass, node_entities)
    _store_payload_field(payload, "node_status", node_status)
    related_entities = resolve_related_entities(hass, client_macs, device_macs)
    _store_payload_field(payload, "related_entities", related_entities)
    return payload


def _store_payload_field(payload: dict[str, object], key: str, value: object) -> None:
    if value:
        payload[key] = value


RelatedEntity = dict[str, str | None]


def resolve_related_entities(
    hass: HomeAssistant,
    client_macs: dict[str, str],
    device_macs: dict[str, str],
) -> dict[str, list[RelatedEntity]]:
    """Resolve all related entities for each node by MAC address."""
    mac_to_entities = _build_mac_to_all_entities_index(hass)
    all_macs = {**device_macs, **client_macs}
    result: dict[str, list[RelatedEntity]] = {}
    for node_name, mac in all_macs.items():
        normalized = _normalize_mac(mac)
        entities = mac_to_entities.get(normalized, [])
        if entities:
            related = [_entity_state_details(hass, eid) for eid in entities]
            result[node_name] = _sort_related_entities(related)
    return result


def _sort_related_entities(entities: list[RelatedEntity]) -> list[RelatedEntity]:
    """Sort related entities by domain priority and then by entity_id."""
    domain_priority = {
        "device_tracker": 0,
        "sensor": 1,
        "binary_sensor": 2,
        "switch": 3,
        "button": 4,
        "update": 5,
        "image": 6,
    }

    def sort_key(entity: RelatedEntity) -> tuple[int, str]:
        domain = entity.get("domain") or ""
        priority = domain_priority.get(domain, 99)
        entity_id = entity.get("entity_id") or ""
        return (priority, entity_id)

    return sorted(entities, key=sort_key)


def _build_mac_to_all_entities_index(hass: HomeAssistant) -> dict[str, list[str]]:
    """Build index mapping MAC addresses to ALL related entity IDs.

    This enhanced version finds all entities belonging to a device once we
    identify the device's MAC address. This ensures sensors, switches,
    device_trackers, and other entity types are all included.

    Results are cached and automatically invalidated when entity or device
    registry changes occur.
    """
    cache = get_entity_cache(hass)
    cached = cache.mac_to_all_entities
    if cached is not None:
        LOGGER.debug("Using cached mac_to_all_entities index (%d entries)", len(cached))
        return cached

    entity_registry = er.async_get(hass)
    device_registry = dr.async_get(hass)
    mac_to_entities: dict[str, list[str]] = {}

    entries = list(_iter_unifi_entity_entries(hass, entity_registry))

    device_to_mac = _build_device_mac_map(hass, entries, device_registry)
    _add_entities_from_registry(entries, device_to_mac, hass, device_registry, mac_to_entities)
    _add_entities_from_states(hass, mac_to_entities)

    cache.mac_to_all_entities = mac_to_entities
    LOGGER.debug("Built and cached mac_to_all_entities index (%d entries)", len(mac_to_entities))
    return mac_to_entities


def _build_device_mac_map(
    hass: HomeAssistant,
    entries: list[er.RegistryEntry],
    device_registry: dr.DeviceRegistry,
) -> dict[str, str]:
    """Map device_id -> MAC from registry entries that expose a MAC."""
    device_to_mac: dict[str, str] = {}
    for entry in entries:
        mac = mac_from_entity_entry(hass, entry, device_registry)
        if mac and entry.device_id:
            device_to_mac[entry.device_id] = mac
    return device_to_mac


def _add_entities_from_registry(
    entries: list[er.RegistryEntry],
    device_to_mac: dict[str, str],
    hass: HomeAssistant,
    device_registry: dr.DeviceRegistry,
    mac_to_entities: dict[str, list[str]],
) -> None:
    """Add entity_ids from registry entries using direct or device MAC lookup."""
    for entry in entries:
        mac = _resolve_entry_mac(hass, entry, device_registry, device_to_mac)
        if mac:
            _append_unique_entity(mac_to_entities, mac, entry.entity_id)


def _resolve_entry_mac(
    hass: HomeAssistant,
    entry: er.RegistryEntry,
    device_registry: dr.DeviceRegistry,
    device_to_mac: dict[str, str],
) -> str | None:
    mac = mac_from_entity_entry(hass, entry, device_registry)
    if mac:
        return mac
    if entry.device_id:
        return device_to_mac.get(entry.device_id)
    return None


def _add_entities_from_states(hass: HomeAssistant, mac_to_entities: dict[str, list[str]]) -> None:
    """Add entity_ids found via state-based MAC candidates."""
    for state in _iter_state_entries(hass):
        if not _is_state_mac_candidate(state):
            continue
        mac = _mac_from_state_entry(state)
        entity_id = getattr(state, "entity_id", None)
        if mac and entity_id:
            _append_unique_entity(mac_to_entities, mac, entity_id)


def _append_unique_entity(mac_to_entities: dict[str, list[str]], mac: str, entity_id: str) -> None:
    entities = mac_to_entities.setdefault(mac, [])
    if entity_id not in entities:
        entities.append(entity_id)


def _entity_state_details(hass: HomeAssistant, entity_id: str) -> RelatedEntity:
    """Get state details for an entity."""
    domain = entity_id.split(".", 1)[0] if entity_id else ""
    state = hass.states.get(entity_id)
    if state is None:
        return {"entity_id": entity_id, "domain": domain, "state": None}

    details: RelatedEntity = {
        "entity_id": entity_id,
        "domain": domain,
        "state": state.state,
        "last_changed": state.last_changed.isoformat() if state.last_changed else None,
    }

    attrs = state.attributes or {}
    if "ip" in attrs:
        details["ip"] = str(attrs["ip"])
    elif "ip_address" in attrs:
        details["ip"] = str(attrs["ip_address"])
    if "friendly_name" in attrs:
        details["friendly_name"] = str(attrs["friendly_name"])

    return details


def _normalize_tracker_state(state: str) -> str:
    """Normalize device_tracker state to online/offline/unknown."""
    if state == "home":
        return "online"
    if state == "not_home":
        return "offline"
    return "unknown"


def _resolve_entity_map(hass: HomeAssistant, macs: dict[str, str]) -> dict[str, str]:
    if not macs:
        return {}
    mac_to_entity = _build_mac_entity_index(hass)
    return {
        name: entity_id
        for name, mac in macs.items()
        if (entity_id := mac_to_entity.get(_normalize_mac(mac)))
    }


def _build_mac_entity_index(hass: HomeAssistant) -> dict[str, str]:
    """Build index mapping MAC addresses to primary entity IDs.

    Results are cached and automatically invalidated when entity or device
    registry changes occur.
    """
    cache = get_entity_cache(hass)
    cached = cache.mac_to_entity
    if cached is not None:
        LOGGER.debug("Using cached mac_to_entity index (%d entries)", len(cached))
        return cached

    entity_registry = er.async_get(hass)
    device_registry = dr.async_get(hass)
    mac_to_entity: dict[str, str] = {}
    _add_registry_macs(hass, entity_registry, device_registry, mac_to_entity)
    _add_state_macs(hass, mac_to_entity)

    cache.mac_to_entity = mac_to_entity
    LOGGER.debug("Built and cached mac_to_entity index (%d entries)", len(mac_to_entity))
    return mac_to_entity


def _iter_unifi_entity_entries(hass: HomeAssistant, entity_registry: er.EntityRegistry):
    seen: set[str] = set()
    for config_entry in hass.config_entries.async_entries("unifi"):
        for entry in er.async_entries_for_config_entry(entity_registry, config_entry.entry_id):
            if entry.entity_id in seen:
                continue
            seen.add(entry.entity_id)
            yield entry
    for entry in getattr(entity_registry, "entities", {}).values():
        if entry.entity_id in seen:
            continue
        platform = getattr(entry, "platform", None)
        if platform == "unifi":
            seen.add(entry.entity_id)
            yield entry


def get_unifi_entity_mac_stats(hass: HomeAssistant) -> dict[str, int]:
    entity_registry = er.async_get(hass)
    device_registry = dr.async_get(hass)
    scanned = 0
    with_mac = 0
    for entry in _iter_unifi_entity_entries(hass, entity_registry):
        scanned += 1
        if mac_from_entity_entry(hass, entry, device_registry):
            with_mac += 1
    return {"unifi_entities_scanned": scanned, "unifi_entities_with_mac": with_mac}


def get_unifi_entity_macs(hass: HomeAssistant) -> set[str]:
    return set(_build_mac_entity_index(hass).keys())


def get_state_entity_macs(hass: HomeAssistant) -> set[str]:
    return set(_build_state_mac_index(hass).keys())


def normalize_mac_value(value: str) -> str:
    return _normalize_mac(value)


def _add_registry_macs(
    hass: HomeAssistant,
    entity_registry: er.EntityRegistry,
    device_registry: dr.DeviceRegistry,
    mac_to_entity: dict[str, str],
) -> None:
    for entry in _iter_unifi_entity_entries(hass, entity_registry):
        mac = mac_from_entity_entry(hass, entry, device_registry)
        if mac:
            mac_to_entity.setdefault(mac, entry.entity_id)


def _add_state_macs(hass: HomeAssistant, mac_to_entity: dict[str, str]) -> None:
    for state in _iter_state_entries(hass):
        if not _is_state_mac_candidate(state):
            continue
        mac = _mac_from_state_entry(state)
        if mac:
            mac_to_entity.setdefault(mac, state.entity_id)


def _build_state_mac_index(hass: HomeAssistant) -> dict[str, str]:
    mac_to_entity: dict[str, str] = {}
    _add_state_macs(hass, mac_to_entity)
    return mac_to_entity


def _iter_state_entries(hass: HomeAssistant):
    if hasattr(hass.states, "async_all"):
        return hass.states.async_all()
    if hasattr(hass.states, "all"):
        return hass.states.all()
    return []


def _is_state_mac_candidate(state: object) -> bool:
    entity_id = getattr(state, "entity_id", "")
    domain = entity_id.split(".", 1)[0] if entity_id else ""
    if domain == "device_tracker":
        return True
    attributes = getattr(state, "attributes", {})
    if not isinstance(attributes, dict):
        return False
    if attributes.get("source_type") == "router":
        return True
    return _has_mac_attribute(attributes)


def _has_mac_attribute(attributes: dict[str, object]) -> bool:
    return _get_mac_attribute_value(attributes) is not None


def _mac_from_state_entry(state: object) -> str | None:
    attributes = getattr(state, "attributes", {})
    if not isinstance(attributes, dict):
        return None
    return _extract_mac_from_attributes(attributes)


def _get_mac_attribute_value(attributes: dict[str, object]) -> str | None:
    for key in _MAC_ATTRIBUTE_KEYS:
        value = attributes.get(key)
        if isinstance(value, str) and value.strip():
            return value
    return None


def _extract_mac_from_attributes(attributes: dict[str, object]) -> str | None:
    value = _get_mac_attribute_value(attributes)
    return _extract_mac(value) if value else None


def mac_from_entity_entry(
    hass: HomeAssistant, entry: er.RegistryEntry, device_registry: dr.DeviceRegistry
) -> str | None:
    return (
        _mac_from_unique_id(entry)
        or _mac_from_device(entry, device_registry)
        or _mac_from_state(hass, entry)
    )


def _mac_from_unique_id(entry: er.RegistryEntry) -> str | None:
    if not entry.unique_id:
        return None
    return _extract_mac(entry.unique_id)


def _mac_from_device(entry: er.RegistryEntry, device_registry: dr.DeviceRegistry) -> str | None:
    if not entry.device_id:
        return None
    device = device_registry.async_get(entry.device_id)
    if not device:
        return None
    for _domain, identifier in device.identifiers:
        identifier_mac = _extract_mac(identifier)
        if identifier_mac:
            return identifier_mac
    for conn_type, value in device.connections:
        if conn_type == dr.CONNECTION_NETWORK_MAC:
            conn_mac = _extract_mac(value)
            if conn_mac:
                return conn_mac
    return None


def _mac_from_state(hass: HomeAssistant, entry: er.RegistryEntry) -> str | None:
    state = hass.states.get(entry.entity_id)
    if not state:
        return None
    return _extract_mac_from_attributes(state.attributes)


def _normalize_mac(value: str) -> str:
    formatted = _format_mac(value)
    if formatted:
        return formatted
    return value.strip().lower()


def _extract_mac(value: str) -> str | None:
    if not value:
        return None
    formatted = _format_mac(value)
    if formatted:
        return formatted
    match = re.search(r"(?:[0-9A-Fa-f]{2}[-:]){5}[0-9A-Fa-f]{2}", value)
    if match:
        return _normalize_mac(match.group(0))
    match = re.search(r"[0-9A-Fa-f]{12}", value)
    if match:
        packed = match.group(0)
        return _normalize_mac(":".join(packed[i : i + 2] for i in range(0, 12, 2)))
    return None


def _render_svg_with_theme(
    data: UniFiNetworkMapData, coordinator: UniFiNetworkMapCoordinator, theme_name: str
) -> str:
    payload = data.payload or {}
    edges_payload = payload.get("edges") or []
    node_types = payload.get("node_types") or {}
    if not _should_render_svg(edges_payload, node_types):
        return data.svg
    theme = _resolve_svg_theme(theme_name)
    if theme is None:
        return data.svg
    edges = _build_svg_edges(edges_payload)
    if not edges:
        return data.svg
    options = _svg_options_from_settings(coordinator.settings)
    return _render_svg_variant(
        edges, node_types, options, theme, coordinator.settings.svg_isometric
    )


def _should_render_svg(
    edges_payload: list[Mapping[str, object]], node_types: dict[str, str]
) -> bool:
    return bool(edges_payload and node_types)


def _build_svg_edges(edges_payload: list[Mapping[str, object]]) -> list[Edge]:
    return [_edge_from_payload(edge) for edge in edges_payload if _valid_edge_payload(edge)]


def _svg_options_from_settings(settings: RenderSettings) -> SvgOptions:
    return SvgOptions(width=settings.svg_width, height=settings.svg_height)


def _render_svg_variant(
    edges: list[Edge],
    node_types: dict[str, str],
    options: SvgOptions,
    theme: SvgTheme,
    is_isometric: bool,
) -> str:
    if is_isometric:
        return render_svg_isometric(edges, node_types=node_types, options=options, theme=theme)
    return render_svg(edges, node_types=node_types, options=options, theme=theme)


def _resolve_svg_theme(theme_name: str) -> SvgTheme | None:
    theme_file = _resolve_theme_file(theme_name)
    if theme_file is None:
        return None
    with importlib_resources.as_file(theme_file) as path:
        # Copy theme to /tmp to satisfy unifi-network-maps path security check
        # (library requires theme files to be within /config, /root, or /tmp)
        tmp_path = Path(tempfile.gettempdir()) / f"unifi_theme_{path.name}"
        shutil.copy(path, tmp_path)
        try:
            _mermaid_theme, svg_theme = resolve_themes(tmp_path)
            return svg_theme
        finally:
            tmp_path.unlink(missing_ok=True)


def _resolve_theme_file(theme_name: str):
    theme_key = theme_name.strip().lower()
    if theme_key == "dark":
        filename = "dark.yaml"
    elif theme_key == "light":
        filename = "default.yaml"
    else:
        return None
    theme_root = importlib_resources.files("unifi_network_maps.assets.themes")
    return theme_root / filename


def _valid_edge_payload(edge: object) -> bool:
    return (
        isinstance(edge, dict)
        and isinstance(edge.get("left"), str)
        and isinstance(edge.get("right"), str)
    )


def _edge_from_payload(edge: Mapping[str, object]) -> Edge:
    label = edge.get("label")
    poe_value = edge.get("poe")
    wireless_value = edge.get("wireless")
    speed_value = edge.get("speed")
    channel_value = edge.get("channel")
    return Edge(
        left=str(edge.get("left", "")),
        right=str(edge.get("right", "")),
        label=label if isinstance(label, str) else None,
        poe=poe_value if isinstance(poe_value, bool) else False,
        wireless=wireless_value if isinstance(wireless_value, bool) else False,
        speed=speed_value if isinstance(speed_value, int) else None,
        channel=channel_value if isinstance(channel_value, int) else None,
    )


def _format_mac(value: str) -> str | None:
    formatter = getattr(dr, "format_mac", None)
    if formatter is None:
        return None
    try:
        formatted = formatter(value)
    except (ValueError, AttributeError, TypeError):
        return None
    if isinstance(formatted, str) and formatted.strip():
        return formatted.strip().lower()
    return None
