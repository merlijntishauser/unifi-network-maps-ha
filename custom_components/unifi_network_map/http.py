from __future__ import annotations

from aiohttp import web
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
        if client_entities:
            payload["client_entities"] = client_entities
        return web.json_response(payload)


def resolve_client_entity_map(hass: HomeAssistant, client_macs: dict[str, str]) -> dict[str, str]:
    if not client_macs or not hass.config_entries.async_entries("unifi"):
        return {}
    mac_to_entity = _build_mac_entity_index(hass)
    return {
        name: entity_id
        for name, mac in client_macs.items()
        if (entity_id := mac_to_entity.get(_normalize_mac(mac)))
    }


def _build_mac_entity_index(hass: HomeAssistant) -> dict[str, str]:
    entity_registry = er.async_get(hass)
    device_registry = dr.async_get(hass)
    mac_to_entity: dict[str, str] = {}
    for entry in _iter_unifi_entity_entries(hass, entity_registry):
        mac = _mac_from_entity_entry(hass, entry, device_registry)
        if mac:
            mac_to_entity.setdefault(mac, entry.entity_id)
    return mac_to_entity


def _iter_unifi_entity_entries(hass: HomeAssistant, entity_registry: er.EntityRegistry):
    for config_entry in hass.config_entries.async_entries("unifi"):
        for entry in er.async_entries_for_config_entry(entity_registry, config_entry.entry_id):
            yield entry


def _mac_from_entity_entry(
    hass: HomeAssistant, entry: er.RegistryEntry, device_registry: dr.DeviceRegistry
) -> str | None:
    if entry.unique_id and ":" in entry.unique_id:
        return _normalize_mac(entry.unique_id)
    if entry.device_id:
        device = device_registry.async_get(entry.device_id)
        if device:
            for conn_type, value in device.connections:
                if conn_type == dr.CONNECTION_NETWORK_MAC:
                    return _normalize_mac(value)
    state = hass.states.get(entry.entity_id)
    if state:
        for key in ("mac_address", "mac"):
            value = state.attributes.get(key)
            if isinstance(value, str) and value.strip():
                return _normalize_mac(value)
    return None


def _normalize_mac(value: str) -> str:
    return value.strip().lower()
