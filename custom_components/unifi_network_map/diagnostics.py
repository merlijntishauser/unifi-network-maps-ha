from __future__ import annotations

from typing import Any
import hashlib

from homeassistant.components.diagnostics import async_redact_data
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_PASSWORD, CONF_USERNAME
from homeassistant.core import HomeAssistant

from .const import DOMAIN
from .data import UniFiNetworkMapData
from .http import (
    get_unifi_entity_mac_stats,
    get_unifi_entity_macs,
    get_state_entity_macs,
    normalize_mac_value,
    resolve_client_entity_map,
)

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
    device_macs = payload.get("device_macs") or {}
    client_entities = resolve_client_entity_map(hass, client_macs)
    entity_stats = get_unifi_entity_mac_stats(hass)
    payload_mac_set = _normalize_mac_values(client_macs) | _normalize_mac_values(device_macs)
    entity_mac_set = get_unifi_entity_macs(hass)
    overlap = payload_mac_set & entity_mac_set
    state_mac_set = get_state_entity_macs(hass)
    state_overlap = payload_mac_set & state_mac_set
    return {
        "svg_length": len(data.svg),
        "payload_schema_version": payload.get("schema_version"),
        "node_count": len(node_types),
        "edge_count": len(edges),
        "client_macs_count": len(client_macs),
        "linked_clients_count": len(client_entities),
        "device_macs_count": len(device_macs),
        "client_mac_overlap_count": len(overlap),
        "payload_mac_hashes": _hash_mac_samples(payload_mac_set),
        "entity_mac_hashes": _hash_mac_samples(entity_mac_set),
        "state_mac_count": len(state_mac_set),
        "state_mac_overlap_count": len(state_overlap),
        "state_mac_hashes": _hash_mac_samples(state_mac_set),
        **entity_stats,
    }


def _normalize_mac_values(mac_map: dict[str, Any]) -> set[str]:
    normalized: set[str] = set()
    for mac in mac_map.values():
        if isinstance(mac, str) and mac.strip():
            normalized.add(normalize_mac_value(mac))
    return normalized


def _hash_mac_samples(values: set[str], sample_size: int = 5) -> list[str]:
    samples = sorted(values)[:sample_size]
    return [_hash_value(sample) for sample in samples]


def _hash_value(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()[:10]
