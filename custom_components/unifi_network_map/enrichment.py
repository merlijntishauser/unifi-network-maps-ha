"""MAC-to-entity resolution and payload enrichment.

Builds indexes from the Home Assistant entity and device registries
(plus state attributes) that map UniFi MAC addresses to entities, and
uses them to enrich the topology payload with entity links, tracker
status, and related entity details.
"""

from __future__ import annotations

import re
from copy import deepcopy
from typing import TYPE_CHECKING

from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er

from .const import LOGGER
from .entity_cache import get_entity_cache
from .payload_cache import compute_payload_hash, get_payload_cache

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

_MAC_ATTRIBUTE_KEYS = ("mac_address", "mac")


def get_or_build_enriched_payload(
    hass: HomeAssistant, entry_id: str, source_payload: dict[str, object]
) -> dict[str, object]:
    """Get cached enriched payload or build and cache a new one."""
    cache = get_payload_cache(hass)
    source_hash = compute_payload_hash(source_payload)
    cached = cache.get(entry_id, source_hash)
    if cached is not None:
        return cached
    payload = build_enriched_payload(hass, deepcopy(source_payload))
    cache.set(entry_id, payload, source_hash)
    return payload


def _resolve_entity_map_by_mac(
    hass: HomeAssistant, macs: set[str]
) -> dict[str, str]:
    """Resolve MAC addresses to their primary HA entity IDs."""
    if not macs:
        return {}
    mac_to_entity = _build_mac_entity_index(hass)
    return {
        mac: entity_id
        for mac in macs
        if (entity_id := mac_to_entity.get(_normalize_mac(mac)))
    }


def resolve_node_status_map(
    hass: HomeAssistant, node_entities: dict[str, str]
) -> dict[str, dict[str, str | None]]:
    """Resolve device_tracker states for linked entities."""
    status_map: dict[str, dict[str, str | None]] = {}
    for node_mac, entity_id in node_entities.items():
        if not entity_id.startswith("device_tracker."):
            continue
        state = hass.states.get(entity_id)
        if state is None:
            continue
        status_map[node_mac] = {
            "entity_id": entity_id,
            "state": _normalize_tracker_state(state.state),
            "last_changed": state.last_changed.isoformat()
            if state.last_changed
            else None,
        }
    return status_map


def build_enriched_payload(
    hass: HomeAssistant, payload: dict[str, object]
) -> dict[str, object]:
    """Add entity, status, and related entity data to a map payload."""
    node_types = payload.get("node_types", {})
    if not isinstance(node_types, dict):
        return payload
    all_macs = set(node_types.keys())
    device_types = frozenset({"gateway", "switch", "ap"})
    device_macs = {m for m in all_macs if node_types.get(m) in device_types}
    client_macs = all_macs - device_macs
    device_entities = _resolve_entity_map_by_mac(hass, device_macs)
    client_entities = _resolve_entity_map_by_mac(hass, client_macs)
    node_entities = {**device_entities, **client_entities}
    _store_payload_field(payload, "client_entities", client_entities)
    _store_payload_field(payload, "device_entities", device_entities)
    _store_payload_field(payload, "node_entities", node_entities)
    node_status = resolve_node_status_map(hass, node_entities)
    _store_payload_field(payload, "node_status", node_status)
    related_entities = resolve_related_entities(hass, all_macs)
    _store_payload_field(payload, "related_entities", related_entities)
    return payload


def _store_payload_field(
    payload: dict[str, object], key: str, value: object
) -> None:
    if value:
        payload[key] = value


RelatedEntity = dict[str, str | None]


def resolve_related_entities(
    hass: HomeAssistant,
    node_macs: set[str],
) -> dict[str, list[RelatedEntity]]:
    """Resolve all related entities for each node by MAC address."""
    mac_to_entities = _build_mac_to_all_entities_index(hass)
    result: dict[str, list[RelatedEntity]] = {}
    matched = 0
    unmatched = 0
    for mac in node_macs:
        normalized = _normalize_mac(mac)
        entities = mac_to_entities.get(normalized, [])
        if entities:
            matched += 1
            related = [_entity_state_details(hass, eid) for eid in entities]
            result[mac] = _sort_related_entities(related)
        else:
            unmatched += 1
            LOGGER.debug(
                "http related_entities no_match mac=%s normalized=%s",
                mac,
                normalized,
            )
    LOGGER.debug(
        "http related_entities resolved nodes=%d matched=%d unmatched=%d",
        len(node_macs),
        matched,
        unmatched,
    )
    return result


def _sort_related_entities(
    entities: list[RelatedEntity],
) -> list[RelatedEntity]:
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


def _build_mac_to_all_entities_index(
    hass: HomeAssistant,
) -> dict[str, list[str]]:
    """Build index mapping MAC addresses to ALL related entity IDs.

    This enhanced version finds all entities belonging to a device once we
    identify the device's MAC address. Uses multiple discovery methods:
    1. Device identifiers and connections
    2. Entity unique_id patterns
    3. State attributes (mac, mac_address)
    4. Device-based grouping (all entities with same device_id)

    Results are cached and automatically invalidated when entity or device
    registry changes occur.
    """
    cache = get_entity_cache(hass)
    cached = cache.mac_to_all_entities
    if cached is not None:
        LOGGER.debug(
            "http mac_index cache_hit=true type=all_entities count=%d",
            len(cached),
        )
        return cached

    entity_registry = er.async_get(hass)
    device_registry = dr.async_get(hass)
    mac_to_entities: dict[str, list[str]] = {}

    entries = list(_iter_unifi_entity_entries(hass, entity_registry))
    LOGGER.debug("http mac_index unifi_entries=%d", len(entries))

    # First, build a comprehensive device_id -> MAC map from device registry
    device_to_mac = _build_device_mac_map_from_registry(device_registry)
    LOGGER.debug(
        "http mac_index device_to_mac_registry=%d", len(device_to_mac)
    )

    # Supplement with MACs found from entity entries
    device_to_mac_from_entities = _build_device_mac_map(
        hass, entries, device_registry
    )
    for device_id, mac in device_to_mac_from_entities.items():
        if device_id not in device_to_mac:
            device_to_mac[device_id] = mac
    LOGGER.debug(
        "http mac_index device_to_mac_combined=%d", len(device_to_mac)
    )

    # Group entities by device_id for device-based lookup
    device_to_entities = _build_device_entities_map(entries)
    LOGGER.debug(
        "http mac_index devices_with_entities=%d", len(device_to_entities)
    )

    # Add all entities for each device to its MAC
    _add_entities_by_device(device_to_mac, device_to_entities, mac_to_entities)
    # Also add entities directly (for those without device_id)
    _add_entities_from_registry(
        entries, device_to_mac, hass, device_registry, mac_to_entities
    )
    _add_entities_from_states(hass, mac_to_entities)

    cache.mac_to_all_entities = mac_to_entities

    # Log summary of entities per MAC
    total_entities = sum(len(v) for v in mac_to_entities.values())
    LOGGER.debug(
        "http mac_index built type=all_entities macs=%d total_entities=%d",
        len(mac_to_entities),
        total_entities,
    )
    # Log a sample of what was found (first 3 MACs)
    for i, (mac, entities) in enumerate(mac_to_entities.items()):
        if i >= 3:
            break
        LOGGER.debug(
            "http mac_index sample mac=%s entities=%s", mac, entities[:5]
        )
    return mac_to_entities


def _build_device_mac_map_from_registry(
    device_registry: dr.DeviceRegistry | None,
) -> dict[str, str]:
    """Build device_id -> MAC map directly from device registry.

    Looks at all devices with UniFi identifiers and extracts MACs from
    their identifiers and connections.
    """
    device_to_mac: dict[str, str] = {}
    if device_registry is None:
        return device_to_mac
    devices = getattr(device_registry, "devices", None)
    if devices is None:
        return device_to_mac
    for device in devices.values():
        # Check if this is a UniFi device
        is_unifi = any(
            len(ident) >= 2 and ident[0] == "unifi"
            for ident in device.identifiers
        )
        if not is_unifi:
            continue
        # Try to extract MAC from identifiers
        mac = _mac_from_device_entry(device)
        if mac:
            device_to_mac[device.id] = mac
    return device_to_mac


def _mac_from_device_entry(device: dr.DeviceEntry) -> str | None:
    """Extract MAC from a device entry's identifiers and connections."""
    # Check identifiers first
    for _domain, identifier in device.identifiers:
        mac = _extract_mac(identifier)
        if mac:
            return mac
    # Check connections
    for conn_type, value in device.connections:
        if conn_type == dr.CONNECTION_NETWORK_MAC:
            mac = _extract_mac(value)
            if mac:
                return mac
    return None


def _build_device_entities_map(
    entries: list[er.RegistryEntry],
) -> dict[str, list[str]]:
    """Group entity_ids by device_id, excluding disabled entities."""
    device_to_entities: dict[str, list[str]] = {}
    for entry in entries:
        if entry.device_id and _is_entity_enabled(entry):
            entities = device_to_entities.setdefault(entry.device_id, [])
            if entry.entity_id not in entities:
                entities.append(entry.entity_id)
    return device_to_entities


def _is_entity_enabled(entry: er.RegistryEntry) -> bool:
    """Check if an entity registry entry is enabled."""
    disabled_by = getattr(entry, "disabled_by", None)
    return disabled_by is None


def _add_entities_by_device(
    device_to_mac: dict[str, str],
    device_to_entities: dict[str, list[str]],
    mac_to_entities: dict[str, list[str]],
) -> None:
    """Add all entities for each device to the MAC index."""
    for device_id, entities in device_to_entities.items():
        mac = device_to_mac.get(device_id)
        if mac:
            for entity_id in entities:
                _append_unique_entity(mac_to_entities, mac, entity_id)


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
    """Add entity_ids from registry entries using direct or device MAC lookup.

    Disabled entities are filtered out.
    """
    for entry in entries:
        if not _is_entity_enabled(entry):
            continue
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


def _add_entities_from_states(
    hass: HomeAssistant, mac_to_entities: dict[str, list[str]]
) -> None:
    """Add entity_ids found via state-based MAC candidates."""
    for state in _iter_state_entries(hass):
        if not _is_state_mac_candidate(state):
            continue
        mac = _mac_from_state_entry(state)
        entity_id = getattr(state, "entity_id", None)
        if mac and entity_id:
            _append_unique_entity(mac_to_entities, mac, entity_id)


def _append_unique_entity(
    mac_to_entities: dict[str, list[str]], mac: str, entity_id: str
) -> None:
    entities = mac_to_entities.setdefault(mac, [])
    if entity_id not in entities:
        entities.append(entity_id)


def _entity_state_details(
    hass: HomeAssistant, entity_id: str
) -> RelatedEntity:
    """Get state details for an entity."""
    domain = entity_id.split(".", 1)[0] if entity_id else ""
    state = hass.states.get(entity_id)
    if state is None:
        return {"entity_id": entity_id, "domain": domain, "state": None}

    details: RelatedEntity = {
        "entity_id": entity_id,
        "domain": domain,
        "state": state.state,
        "last_changed": state.last_changed.isoformat()
        if state.last_changed
        else None,
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


def _build_mac_entity_index(hass: HomeAssistant) -> dict[str, str]:
    """Build index mapping MAC addresses to primary entity IDs.

    Results are cached and automatically invalidated when entity or device
    registry changes occur.
    """
    cache = get_entity_cache(hass)
    cached = cache.mac_to_entity
    if cached is not None:
        LOGGER.debug(
            "http mac_index cache_hit=true type=primary count=%d", len(cached)
        )
        return cached

    entity_registry = er.async_get(hass)
    device_registry = dr.async_get(hass)
    mac_to_entity: dict[str, str] = {}
    _add_registry_macs(hass, entity_registry, device_registry, mac_to_entity)
    _add_state_macs(hass, mac_to_entity)

    cache.mac_to_entity = mac_to_entity
    LOGGER.debug(
        "http mac_index built type=primary count=%d", len(mac_to_entity)
    )
    return mac_to_entity


def _iter_unifi_entity_entries(
    hass: HomeAssistant, entity_registry: er.EntityRegistry
):
    seen: set[str] = set()
    for config_entry in hass.config_entries.async_entries("unifi"):
        for entry in er.async_entries_for_config_entry(
            entity_registry, config_entry.entry_id
        ):
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
    return {
        "unifi_entities_scanned": scanned,
        "unifi_entities_with_mac": with_mac,
    }


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


def _add_state_macs(
    hass: HomeAssistant, mac_to_entity: dict[str, str]
) -> None:
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
    hass: HomeAssistant,
    entry: er.RegistryEntry,
    device_registry: dr.DeviceRegistry,
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


def _mac_from_device(
    entry: er.RegistryEntry, device_registry: dr.DeviceRegistry
) -> str | None:
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


def _mac_from_state(
    hass: HomeAssistant, entry: er.RegistryEntry
) -> str | None:
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
        return _normalize_mac(
            ":".join(packed[i : i + 2] for i in range(0, 12, 2))
        )
    return None


_MAC_PATTERN = re.compile(r"^(?:[0-9a-f]{2}:){5}[0-9a-f]{2}$", re.IGNORECASE)


def _format_mac(value: str) -> str | None:
    formatter = getattr(dr, "format_mac", None)
    if formatter is None:
        return None
    try:
        formatted = formatter(value)
    except (ValueError, AttributeError, TypeError) as err:
        LOGGER.debug(
            "http mac_format_failed value=%s error=%s",
            value[:20] if value else "",
            type(err).__name__,
        )
        return None
    if not isinstance(formatted, str):
        return None
    result = formatted.strip().lower()
    if _MAC_PATTERN.match(result):
        return result
    return None
