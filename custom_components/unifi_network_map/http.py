from __future__ import annotations

from aiohttp import web
import re

from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant

from .const import DOMAIN
from .coordinator import UniFiNetworkMapCoordinator
from .data import UniFiNetworkMapData

_VIEWS_REGISTERED = "views_registered"


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


class UniFiNetworkMapSvgView(HomeAssistantView):
    url = "/api/unifi_network_map/{entry_id}/svg"
    name = "api:unifi_network_map:svg"

    async def get(self, request: web.Request, entry_id: str) -> web.Response:
        data = _get_data(_get_coordinator(request.app["hass"], entry_id))
        if data is None:
            raise web.HTTPNotFound()
        return web.Response(text=data.svg, content_type="image/svg+xml")


class UniFiNetworkMapPayloadView(HomeAssistantView):
    url = "/api/unifi_network_map/{entry_id}/payload"
    name = "api:unifi_network_map:payload"

    async def get(self, request: web.Request, entry_id: str) -> web.Response:
        hass = request.app["hass"]
        data = _get_data(_get_coordinator(hass, entry_id))
        if data is None:
            raise web.HTTPNotFound()
        payload = dict(data.payload)
        client_entities = resolve_client_entity_map(hass, payload.get("client_macs", {}))
        device_entities = resolve_device_entity_map(hass, payload.get("device_macs", {}))
        node_entities = resolve_node_entity_map(client_entities, device_entities)
        if client_entities:
            payload["client_entities"] = client_entities
        if device_entities:
            payload["device_entities"] = device_entities
        if node_entities:
            payload["node_entities"] = node_entities
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
    entity_registry = er.async_get(hass)
    device_registry = dr.async_get(hass)
    mac_to_entity: dict[str, str] = {}
    _add_registry_macs(hass, entity_registry, device_registry, mac_to_entity)
    _add_state_macs(hass, mac_to_entity)
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
    for key in ("mac_address", "mac"):
        value = attributes.get(key)
        if isinstance(value, str) and value.strip():
            return True
    return False


def _mac_from_state_entry(state: object) -> str | None:
    attributes = getattr(state, "attributes", {})
    if not isinstance(attributes, dict):
        return None
    for key in ("mac_address", "mac"):
        value = attributes.get(key)
        if isinstance(value, str) and value.strip():
            state_mac = _extract_mac(value)
            if state_mac:
                return state_mac
    return None


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
    for key in ("mac_address", "mac"):
        value = state.attributes.get(key)
        if isinstance(value, str) and value.strip():
            state_mac = _extract_mac(value)
            if state_mac:
                return state_mac
    return None


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
