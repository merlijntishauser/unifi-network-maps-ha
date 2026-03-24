from __future__ import annotations

import hashlib
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from homeassistant.components.diagnostics import async_redact_data
from homeassistant.const import CONF_PASSWORD, CONF_USERNAME

from .http import (
    get_state_entity_macs,
    get_unifi_entity_mac_stats,
    get_unifi_entity_macs,
    normalize_mac_value,
)

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

    from .data import (
        UniFiNetworkMapConfigEntry,
        UniFiNetworkMapData,
    )

_REDACT_KEYS = {CONF_PASSWORD, CONF_USERNAME}


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, entry: UniFiNetworkMapConfigEntry
) -> dict[str, Any]:
    coordinator = entry.runtime_data
    data = coordinator.data if coordinator else None
    return {
        "entry": {
            "entry_id": entry.entry_id,
            "title": entry.title,
            "data": async_redact_data(entry.data, _REDACT_KEYS),
            "options": entry.options,
        },
        "coordinator": {
            "last_update_success": getattr(
                coordinator, "last_update_success", None
            ),
            "last_update_success_time": _format_timestamp(
                getattr(coordinator, "last_update_success_time", None)
            ),
            "last_exception": str(getattr(coordinator, "last_exception", ""))
            or None,
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
    now = datetime.now(UTC)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
    return (now - dt).total_seconds()


def _extract_payload_macs(node_types: dict[str, str]) -> set[str]:
    return {normalize_mac_value(mac) for mac in node_types if mac.strip()}


def _count_device_types(
    node_types: dict[str, str],
) -> tuple[int, int]:
    device_types = frozenset({"gateway", "switch", "ap"})
    device_count = sum(1 for t in node_types.values() if t in device_types)
    return device_count, len(node_types) - device_count


def _summarize_map_data(
    hass: HomeAssistant, data: UniFiNetworkMapData | None
) -> dict[str, Any] | None:
    if data is None:
        return None
    payload = data.payload or {}
    node_types = payload.get("node_types") or {}
    edges = payload.get("edges") or []
    ap_client_counts = payload.get("ap_client_counts") or {}
    payload_mac_set = _extract_payload_macs(node_types)
    entity_mac_set = get_unifi_entity_macs(hass)
    state_mac_set = get_state_entity_macs(hass)
    device_count, client_count = _count_device_types(node_types)
    return {
        "svg_length": len(data.svg),
        "payload_schema_version": payload.get("schema_version"),
        "node_count": len(node_types),
        "edge_count": len(edges),
        "client_count": client_count,
        "device_count": device_count,
        "mac_overlap_count": len(payload_mac_set & entity_mac_set),
        "payload_mac_hashes": _hash_mac_samples(payload_mac_set),
        "entity_mac_hashes": _hash_mac_samples(entity_mac_set),
        "state_mac_count": len(state_mac_set),
        "state_mac_overlap_count": len(payload_mac_set & state_mac_set),
        "state_mac_hashes": _hash_mac_samples(state_mac_set),
        "clients": _summarize_clients(node_types, edges),
        "ap_wireless_client_counts": _summarize_ap_client_counts(
            ap_client_counts
        ),
        **get_unifi_entity_mac_stats(hass),
    }


def _summarize_clients(
    node_types: dict[str, str],
    edges: list[dict[str, Any]],
) -> dict[str, Any]:
    """Summarize client information with anonymized sample MACs."""
    client_macs = {
        mac for mac, ntype in node_types.items() if ntype == "client"
    }

    wired_clients: list[str] = []
    wireless_clients: list[str] = []

    for edge in edges:
        left = edge.get("left", "")
        right = edge.get("right", "")
        is_wireless = edge.get("wireless", False)

        for mac in [left, right]:
            if mac in client_macs:
                if is_wireless:
                    if mac not in wireless_clients:
                        wireless_clients.append(mac)
                else:
                    if mac not in wired_clients:
                        wired_clients.append(mac)

    return {
        "total_count": len(client_macs),
        "wired_count": len(wired_clients),
        "wireless_count": len(wireless_clients),
        "sample_macs_hashed": _hash_name_samples(sorted(client_macs)),
        "wired_sample_hashed": _hash_name_samples(wired_clients),
        "wireless_sample_hashed": _hash_name_samples(wireless_clients),
    }


def _summarize_ap_client_counts(
    ap_client_counts: dict[str, int],
) -> dict[str, Any]:
    """Summarize AP client counts with anonymized AP names."""
    if not ap_client_counts:
        return {"ap_count": 0, "total_wireless_clients": 0}

    total_clients = sum(ap_client_counts.values())
    ap_names = list(ap_client_counts.keys())

    return {
        "ap_count": len(ap_client_counts),
        "total_wireless_clients": total_clients,
        "ap_sample_hashed": [
            {
                "name_hash": _hash_value(name),
                "client_count": ap_client_counts[name],
            }
            for name in sorted(ap_names)[:5]
        ],
    }


def _hash_name_samples(names: list[str], sample_size: int = 5) -> list[str]:
    """Hash a sample of names for anonymized diagnostics."""
    samples = sorted(names)[:sample_size]
    return [_hash_value(name) for name in samples]


def _hash_mac_samples(values: set[str], sample_size: int = 5) -> list[str]:
    samples = sorted(values)[:sample_size]
    return [_hash_value(sample) for sample in samples]


def _hash_value(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()[:10]
