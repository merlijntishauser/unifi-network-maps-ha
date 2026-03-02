"""Integration tests for http.py entity indexing with real HA registries."""

from __future__ import annotations

from typing import TYPE_CHECKING

from homeassistant.helpers import (
    device_registry as dr,
)
from homeassistant.helpers import (
    entity_registry as er,
)
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.unifi_network_map.entity_cache import (
    invalidate_entity_cache,
)
from custom_components.unifi_network_map.http import (
    _add_entities_from_registry,
    _add_entities_from_states,
    _build_mac_entity_index,
    _build_mac_to_all_entities_index,
    _get_or_build_enriched_payload,
    _iter_unifi_entity_entries,
    resolve_related_entities,
)

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

MAC_SWITCH = "aa:bb:cc:dd:ee:f1"
MAC_AP = "aa:bb:cc:dd:ee:f2"
MAC_CLIENT = "aa:bb:cc:dd:ee:f3"


def _add_unifi_config_entry(hass: HomeAssistant) -> MockConfigEntry:
    """Create and register a mock 'unifi' config entry."""
    entry = MockConfigEntry(domain="unifi", data={})
    entry.add_to_hass(hass)
    return entry


def _create_unifi_device(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
    mac: str,
    name: str,
) -> dr.DeviceEntry:
    """Create a device in the device registry with a UniFi MAC."""
    device_reg = dr.async_get(hass)
    return device_reg.async_get_or_create(
        config_entry_id=config_entry.entry_id,
        identifiers={("unifi", mac)},
        connections={
            (dr.CONNECTION_NETWORK_MAC, mac),
        },
        name=name,
    )


def _create_entity(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
    domain: str,
    unique_id: str,
    device: dr.DeviceEntry | None = None,
) -> er.RegistryEntry:
    """Create an entity in the entity registry."""
    entity_reg = er.async_get(hass)
    return entity_reg.async_get_or_create(
        domain,
        "unifi",
        unique_id,
        config_entry=config_entry,
        device_id=device.id if device else None,
    )


# ------------------------------------------------------------------
# Test 1: Full MAC-to-all-entities index with device grouping
# ------------------------------------------------------------------


async def test_build_mac_to_all_entities_index_with_unifi_device(
    hass: HomeAssistant,
) -> None:
    """Entities linked to a UniFi device are grouped under its MAC."""
    invalidate_entity_cache(hass)
    unifi_entry = _add_unifi_config_entry(hass)
    device = _create_unifi_device(hass, unifi_entry, MAC_SWITCH, "Test Switch")

    tracker = _create_entity(
        hass,
        unifi_entry,
        "device_tracker",
        f"tracker_{MAC_SWITCH.replace(':', '')}",
        device=device,
    )
    sensor = _create_entity(
        hass,
        unifi_entry,
        "sensor",
        f"uptime_{MAC_SWITCH.replace(':', '')}",
        device=device,
    )
    update = _create_entity(
        hass,
        unifi_entry,
        "update",
        f"firmware_{MAC_SWITCH.replace(':', '')}",
        device=device,
    )

    index = _build_mac_to_all_entities_index(hass)

    assert MAC_SWITCH in index
    entity_ids = index[MAC_SWITCH]
    assert tracker.entity_id in entity_ids
    assert sensor.entity_id in entity_ids
    assert update.entity_id in entity_ids


# ------------------------------------------------------------------
# Test 2: Cache hit on second call
# ------------------------------------------------------------------


async def test_build_mac_to_all_entities_index_caches_result(
    hass: HomeAssistant,
) -> None:
    """Second call returns cached result without rebuilding."""
    invalidate_entity_cache(hass)
    unifi_entry = _add_unifi_config_entry(hass)
    device = _create_unifi_device(hass, unifi_entry, MAC_AP, "Test AP")
    _create_entity(
        hass,
        unifi_entry,
        "device_tracker",
        f"tracker_{MAC_AP.replace(':', '')}",
        device=device,
    )

    first = _build_mac_to_all_entities_index(hass)
    second = _build_mac_to_all_entities_index(hass)

    # Same object reference proves the cache was used.
    assert first is second


# ------------------------------------------------------------------
# Test 3: Platform-based discovery (not from unifi config entry)
# ------------------------------------------------------------------


async def test_iter_unifi_entity_entries_includes_platform_entries(
    hass: HomeAssistant,
) -> None:
    """Entity with platform='unifi' is yielded even without
    a 'unifi' config entry."""
    entity_reg = er.async_get(hass)

    # Create a non-unifi config entry that has a "unifi" platform entity.
    other_entry = MockConfigEntry(domain="other_integration", data={})
    other_entry.add_to_hass(hass)

    entity_reg.async_get_or_create(
        "sensor",
        "unifi",
        "orphan_unique_id",
        config_entry=other_entry,
    )

    entries = list(_iter_unifi_entity_entries(hass, entity_reg))
    entity_ids = [e.entity_id for e in entries]

    assert "sensor.unifi_orphan_unique_id" in entity_ids


# ------------------------------------------------------------------
# Test 4: _add_entities_from_registry direct + device-fallback paths
# ------------------------------------------------------------------


async def test_add_entities_from_registry_with_device_mac(
    hass: HomeAssistant,
) -> None:
    """Entities are indexed by their direct MAC or device-fallback MAC."""
    invalidate_entity_cache(hass)
    unifi_entry = _add_unifi_config_entry(hass)
    device = _create_unifi_device(hass, unifi_entry, MAC_SWITCH, "Switch")

    entity_reg = er.async_get(hass)
    device_reg = dr.async_get(hass)

    # Entity with a MAC-containing unique_id (direct path)
    direct = entity_reg.async_get_or_create(
        "device_tracker",
        "unifi",
        MAC_SWITCH.replace(":", ""),
        config_entry=unifi_entry,
        device_id=device.id,
    )

    # Entity without MAC in unique_id but with device_id (fallback)
    fallback = entity_reg.async_get_or_create(
        "sensor",
        "unifi",
        "some_sensor_key",
        config_entry=unifi_entry,
        device_id=device.id,
    )

    entries = list(_iter_unifi_entity_entries(hass, entity_reg))
    device_to_mac = {device.id: MAC_SWITCH}
    mac_to_entities: dict[str, list[str]] = {}

    _add_entities_from_registry(
        entries, device_to_mac, hass, device_reg, mac_to_entities
    )

    assert MAC_SWITCH in mac_to_entities
    assert direct.entity_id in mac_to_entities[MAC_SWITCH]
    assert fallback.entity_id in mac_to_entities[MAC_SWITCH]


# ------------------------------------------------------------------
# Test 5: _add_entities_from_states discovers MAC from attributes
# ------------------------------------------------------------------


async def test_add_entities_from_states_with_mac_attribute(
    hass: HomeAssistant,
) -> None:
    """State objects with mac_address attribute contribute to the index."""
    invalidate_entity_cache(hass)
    hass.states.async_set(
        "device_tracker.wifi_client",
        "home",
        {"mac_address": MAC_CLIENT},
    )

    mac_to_entities: dict[str, list[str]] = {}
    _add_entities_from_states(hass, mac_to_entities)

    assert MAC_CLIENT in mac_to_entities
    assert "device_tracker.wifi_client" in mac_to_entities[MAC_CLIENT]


# ------------------------------------------------------------------
# Test 6: _get_or_build_enriched_payload caching
# ------------------------------------------------------------------


async def test_get_or_build_enriched_payload(
    hass: HomeAssistant,
) -> None:
    """Enriched payload is cached and returned on second call."""
    invalidate_entity_cache(hass)
    source = {"client_macs": {}, "device_macs": {}}

    first = _get_or_build_enriched_payload(hass, "entry1", source)
    assert isinstance(first, dict)

    # Second call with the same source should hit the cache.
    second = _get_or_build_enriched_payload(hass, "entry1", source)
    assert second is first


# ------------------------------------------------------------------
# Test 7: resolve_related_entities returns empty for unknown MAC
# ------------------------------------------------------------------


async def test_resolve_related_entities_returns_empty_for_unknown_mac(
    hass: HomeAssistant,
) -> None:
    """Unknown MAC yields no related entities for that node."""
    invalidate_entity_cache(hass)
    unknown_mac = "ff:ff:ff:ff:ff:ff"

    result = resolve_related_entities(
        hass,
        client_macs={"Ghost": unknown_mac},
        device_macs={},
    )

    # The node should not appear in the result at all.
    assert "Ghost" not in result


# ------------------------------------------------------------------
# Test 8: _build_mac_entity_index primary index with real registry
# ------------------------------------------------------------------


async def test_build_mac_entity_index_with_real_registry(
    hass: HomeAssistant,
) -> None:
    """Primary MAC-to-entity index picks the first entity per MAC."""
    invalidate_entity_cache(hass)
    unifi_entry = _add_unifi_config_entry(hass)
    device = _create_unifi_device(hass, unifi_entry, MAC_AP, "AP")

    first_entity = _create_entity(
        hass,
        unifi_entry,
        "device_tracker",
        f"tracker_{MAC_AP.replace(':', '')}",
        device=device,
    )
    _create_entity(
        hass,
        unifi_entry,
        "sensor",
        f"uptime_{MAC_AP.replace(':', '')}",
        device=device,
    )

    index = _build_mac_entity_index(hass)

    assert MAC_AP in index
    # setdefault keeps the first entity encountered.
    assert index[MAC_AP] == first_entity.entity_id
