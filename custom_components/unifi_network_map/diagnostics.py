from __future__ import annotations

from datetime import datetime, timezone
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
            "last_update_success_time": _format_timestamp(
                getattr(coordinator, "last_update_success_time", None)
            ),
            "last_exception": str(getattr(coordinator, "last_exception", "")) or None,
            "data_age_seconds": _calculate_data_age(
                getattr(coordinator, "last_update_success_time", None)
            ),
        },
        "map_summary": _summarize_map_data(hass, data),
    }


def _format_timestamp(dt: datetime | None) -> str | None:
    """Format a datetime as ISO 8601 string."""
    if dt is None:
        return None
    return dt.isoformat()


def _calculate_data_age(dt: datetime | None) -> float | None:
    """Calculate age of data in seconds."""
    if dt is None:
        return None
    now = datetime.now(timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return (now - dt).total_seconds()


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
    ap_client_counts = payload.get("ap_client_counts") or {}
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
        "clients": _summarize_clients(node_types, edges, client_macs),
        "ap_wireless_client_counts": _summarize_ap_client_counts(ap_client_counts),
        **entity_stats,
    }


def _summarize_clients(
    node_types: dict[str, str],
    edges: list[dict[str, Any]],
    client_macs: dict[str, str],
) -> dict[str, Any]:
    """Summarize client information with anonymized sample names."""
    # Find all client nodes
    client_names = [name for name, ntype in node_types.items() if ntype == "client"]

    # Count wired vs wireless clients from edges
    wired_clients: list[str] = []
    wireless_clients: list[str] = []

    for edge in edges:
        left = edge.get("left", "")
        right = edge.get("right", "")
        is_wireless = edge.get("wireless", False)

        # Check if either end is a client
        for name in [left, right]:
            if name in client_names:
                if is_wireless:
                    if name not in wireless_clients:
                        wireless_clients.append(name)
                else:
                    if name not in wired_clients:
                        wired_clients.append(name)

    return {
        "total_count": len(client_names),
        "wired_count": len(wired_clients),
        "wireless_count": len(wireless_clients),
        "with_mac_count": len(client_macs),
        "sample_names_hashed": _hash_name_samples(client_names),
        "wired_sample_hashed": _hash_name_samples(wired_clients),
        "wireless_sample_hashed": _hash_name_samples(wireless_clients),
    }


def _summarize_ap_client_counts(ap_client_counts: dict[str, int]) -> dict[str, Any]:
    """Summarize AP client counts with anonymized AP names."""
    if not ap_client_counts:
        return {"ap_count": 0, "total_wireless_clients": 0}

    total_clients = sum(ap_client_counts.values())
    ap_names = list(ap_client_counts.keys())

    return {
        "ap_count": len(ap_client_counts),
        "total_wireless_clients": total_clients,
        "ap_sample_hashed": [
            {"name_hash": _hash_value(name), "client_count": ap_client_counts[name]}
            for name in sorted(ap_names)[:5]
        ],
    }


def _hash_name_samples(names: list[str], sample_size: int = 5) -> list[str]:
    """Hash a sample of names for anonymized diagnostics."""
    samples = sorted(names)[:sample_size]
    return [_hash_value(name) for name in samples]


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
