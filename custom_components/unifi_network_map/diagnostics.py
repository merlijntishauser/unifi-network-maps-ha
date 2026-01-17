from __future__ import annotations

from typing import Any

from homeassistant.components.diagnostics import async_redact_data
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_PASSWORD, CONF_USERNAME
from homeassistant.core import HomeAssistant

from .const import DOMAIN
from .data import UniFiNetworkMapData
from .http import resolve_client_entity_map

_REDACT_KEYS = {CONF_PASSWORD, CONF_USERNAME}


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, entry: ConfigEntry
) -> dict[str, Any]:
    coordinator = hass.data.get(DOMAIN, {}).get(entry.entry_id)
    data = coordinator.data if coordinator else None
    return {
        "entry": {
            "entry_id": entry.entry_id,
            "title": entry.title,
            "data": async_redact_data(entry.data, _REDACT_KEYS),
            "options": entry.options,
        },
        "coordinator": {
            "last_update_success": getattr(coordinator, "last_update_success", None),
            "last_exception": str(getattr(coordinator, "last_exception", "")) or None,
        },
        "map_summary": _summarize_map_data(hass, data),
    }


def _summarize_map_data(
    hass: HomeAssistant, data: UniFiNetworkMapData | None
) -> dict[str, Any] | None:
    if data is None:
        return None
    payload = data.payload or {}
    node_types = payload.get("node_types") or {}
    edges = payload.get("edges") or []
    client_macs = payload.get("client_macs") or {}
    client_entities = resolve_client_entity_map(hass, client_macs)
    return {
        "svg_length": len(data.svg),
        "payload_schema_version": payload.get("schema_version"),
        "node_count": len(node_types),
        "edge_count": len(edges),
        "client_macs_count": len(client_macs),
        "linked_clients_count": len(client_entities),
    }
