"""Tests for entity registry cache module."""

from __future__ import annotations

from dataclasses import dataclass
from types import SimpleNamespace
from typing import Any, Callable
from unittest.mock import MagicMock, patch

from custom_components.unifi_network_map import entity_cache
from custom_components.unifi_network_map.const import DOMAIN


@dataclass
class FakeEntityEntry:
    entity_id: str
    unique_id: str | None = None
    device_id: str | None = None
    platform: str | None = None
    config_entry_id: str | None = None


@dataclass
class FakeDevice:
    identifiers: set[tuple[str, str]]
    connections: set[tuple[str, str]]
    config_entries: set[str]


class FakeEntityRegistry:
    def __init__(self, entries: dict[str, FakeEntityEntry]) -> None:
        self.entities = entries

    def async_get(self, entity_id: str) -> FakeEntityEntry | None:
        return self.entities.get(entity_id)


class FakeDeviceRegistry:
    def __init__(self, devices: dict[str, FakeDevice]) -> None:
        self._devices = devices

    def async_get(self, device_id: str) -> FakeDevice | None:
        return self._devices.get(device_id)


class FakeConfigEntry:
    def __init__(self, entry_id: str, domain: str = "unifi") -> None:
        self.entry_id = entry_id
        self.domain = domain


class FakeConfigEntries:
    def __init__(self, entries: list[FakeConfigEntry]) -> None:
        self._entries = entries
        self._entries_by_id = {e.entry_id: e for e in entries}

    def async_entries(self, domain: str) -> list[FakeConfigEntry]:
        return [e for e in self._entries if e.domain == domain]

    def async_get_entry(self, entry_id: str) -> FakeConfigEntry | None:
        return self._entries_by_id.get(entry_id)


class FakeBus:
    def __init__(self) -> None:
        self.listeners: dict[str, list[Callable[..., None]]] = {}

    def async_listen(self, event_type: str, callback: Callable[..., None]) -> Callable[[], None]:
        if event_type not in self.listeners:
            self.listeners[event_type] = []
        self.listeners[event_type].append(callback)

        def unsub() -> None:
            if event_type in self.listeners and callback in self.listeners[event_type]:
                self.listeners[event_type].remove(callback)

        return unsub

    def fire(self, event_type: str, data: dict[str, str]) -> None:
        event = SimpleNamespace(data=data)
        for listener in self.listeners.get(event_type, []):
            listener(event)


class FakeHass:
    def __init__(self) -> None:
        self.data: dict[str, Any] = {}
        self.bus = FakeBus()
        self.config_entries = FakeConfigEntries([])


def test_entity_registry_cache_stores_and_retrieves_indices() -> None:
    cache = entity_cache.EntityRegistryCache()
    cache.mac_to_entity = {"aa:bb:cc:dd:ee:ff": "device_tracker.test"}
    cache.mac_to_all_entities = {"aa:bb:cc:dd:ee:ff": ["device_tracker.test", "sensor.test"]}

    assert cache.mac_to_entity == {"aa:bb:cc:dd:ee:ff": "device_tracker.test"}
    assert cache.mac_to_all_entities == {
        "aa:bb:cc:dd:ee:ff": ["device_tracker.test", "sensor.test"]
    }


def test_entity_registry_cache_invalidate_clears_indices() -> None:
    cache = entity_cache.EntityRegistryCache()
    cache.mac_to_entity = {"aa:bb:cc:dd:ee:ff": "device_tracker.test"}
    cache.mac_to_all_entities = {"aa:bb:cc:dd:ee:ff": ["device_tracker.test"]}

    cache.invalidate()

    assert cache.mac_to_entity is None
    assert cache.mac_to_all_entities is None


def test_entity_registry_cache_unsubscribe() -> None:
    unsub_entity = MagicMock()
    unsub_device = MagicMock()
    cache = entity_cache.EntityRegistryCache()
    cache.set_unsubscribe_callbacks(unsub_entity, unsub_device)

    cache.unsubscribe()

    unsub_entity.assert_called_once()
    unsub_device.assert_called_once()


def test_get_entity_cache_creates_new_cache() -> None:
    hass = FakeHass()

    with patch.object(entity_cache, "_subscribe_to_registry_events"):
        cache = entity_cache.get_entity_cache(hass)

    assert cache is not None
    assert hass.data[DOMAIN]["entity_registry_cache"] is cache


def test_get_entity_cache_returns_existing_cache() -> None:
    hass = FakeHass()

    with patch.object(entity_cache, "_subscribe_to_registry_events"):
        cache1 = entity_cache.get_entity_cache(hass)
        cache2 = entity_cache.get_entity_cache(hass)

    assert cache1 is cache2


def test_invalidate_entity_cache() -> None:
    hass = FakeHass()

    with patch.object(entity_cache, "_subscribe_to_registry_events"):
        cache = entity_cache.get_entity_cache(hass)

    cache.mac_to_entity = {"test": "value"}

    entity_cache.invalidate_entity_cache(hass)

    assert cache.mac_to_entity is None


def test_cleanup_entity_cache() -> None:
    hass = FakeHass()

    with patch.object(entity_cache, "_subscribe_to_registry_events"):
        cache = entity_cache.get_entity_cache(hass)

    unsub_entity = MagicMock()
    unsub_device = MagicMock()
    cache.set_unsubscribe_callbacks(unsub_entity, unsub_device)

    entity_cache.cleanup_entity_cache(hass)

    assert "entity_registry_cache" not in hass.data.get(DOMAIN, {})
    unsub_entity.assert_called_once()
    unsub_device.assert_called_once()


def test_subscribe_to_registry_events() -> None:
    hass = FakeHass()
    cache = entity_cache.EntityRegistryCache()

    entity_cache._subscribe_to_registry_events(hass, cache)

    assert "entity_registry_updated" in hass.bus.listeners
    assert "device_registry_updated" in hass.bus.listeners
    # Verify unsubscribe callbacks were set by calling unsubscribe
    cache.unsubscribe()
    assert len(hass.bus.listeners.get("entity_registry_updated", [])) == 0
    assert len(hass.bus.listeners.get("device_registry_updated", [])) == 0


def test_entity_registry_event_invalidates_cache_for_unifi_entity() -> None:
    hass = FakeHass()
    entity_registry = FakeEntityRegistry(
        {
            "device_tracker.unifi_test": FakeEntityEntry(
                "device_tracker.unifi_test", platform="unifi"
            )
        }
    )
    cache = entity_cache.EntityRegistryCache()
    cache.mac_to_entity = {"test": "value"}

    with patch.object(entity_cache.er, "async_get", return_value=entity_registry):
        entity_cache._subscribe_to_registry_events(hass, cache)
        hass.bus.fire(
            "entity_registry_updated",
            {"action": "create", "entity_id": "device_tracker.unifi_test"},
        )

    assert cache.mac_to_entity is None


def test_entity_registry_event_ignores_non_unifi_entity() -> None:
    hass = FakeHass()
    entity_registry = FakeEntityRegistry(
        {"sensor.other": FakeEntityEntry("sensor.other", platform="other_platform")}
    )
    cache = entity_cache.EntityRegistryCache()
    cache.mac_to_entity = {"test": "value"}

    with patch.object(entity_cache.er, "async_get", return_value=entity_registry):
        entity_cache._subscribe_to_registry_events(hass, cache)
        hass.bus.fire("entity_registry_updated", {"action": "create", "entity_id": "sensor.other"})

    assert cache.mac_to_entity == {"test": "value"}


def test_device_registry_event_invalidates_cache_for_unifi_device() -> None:
    hass = FakeHass()
    device_registry = FakeDeviceRegistry(
        {
            "dev1": FakeDevice(
                identifiers={("unifi", "mac")}, connections=set(), config_entries=set()
            )
        }
    )
    cache = entity_cache.EntityRegistryCache()
    cache.mac_to_entity = {"test": "value"}

    with patch.object(entity_cache.dr, "async_get", return_value=device_registry):
        entity_cache._subscribe_to_registry_events(hass, cache)
        hass.bus.fire("device_registry_updated", {"action": "create", "device_id": "dev1"})

    assert cache.mac_to_entity is None


def test_device_registry_event_ignores_non_unifi_device() -> None:
    hass = FakeHass()
    device_registry = FakeDeviceRegistry(
        {"dev1": FakeDevice(identifiers={("other", "id")}, connections=set(), config_entries=set())}
    )
    cache = entity_cache.EntityRegistryCache()
    cache.mac_to_entity = {"test": "value"}

    with patch.object(entity_cache.dr, "async_get", return_value=device_registry):
        entity_cache._subscribe_to_registry_events(hass, cache)
        hass.bus.fire("device_registry_updated", {"action": "create", "device_id": "dev1"})

    assert cache.mac_to_entity == {"test": "value"}


def test_is_unifi_relevant_event_returns_true_for_empty_entity_id() -> None:
    hass = FakeHass()

    result = entity_cache._is_unifi_relevant_event(hass, "")

    assert result is True


def test_is_unifi_relevant_event_returns_true_for_missing_entity() -> None:
    hass = FakeHass()
    entity_registry = FakeEntityRegistry({})

    with patch.object(entity_cache.er, "async_get", return_value=entity_registry):
        result = entity_cache._is_unifi_relevant_event(hass, "missing.entity")

    assert result is True


def test_is_unifi_relevant_event_returns_true_for_unifi_config_entry() -> None:
    hass = FakeHass()
    hass.config_entries = FakeConfigEntries([FakeConfigEntry("entry1", "unifi")])
    entity_registry = FakeEntityRegistry(
        {"sensor.test": FakeEntityEntry("sensor.test", config_entry_id="entry1")}
    )

    with patch.object(entity_cache.er, "async_get", return_value=entity_registry):
        result = entity_cache._is_unifi_relevant_event(hass, "sensor.test")

    assert result is True


def test_is_unifi_relevant_device_returns_true_for_empty_device_id() -> None:
    hass = FakeHass()

    result = entity_cache._is_unifi_relevant_device(hass, "")

    assert result is True


def test_is_unifi_relevant_device_returns_true_for_unifi_config_entry() -> None:
    hass = FakeHass()
    hass.config_entries = FakeConfigEntries([FakeConfigEntry("entry1", "unifi")])
    device_registry = FakeDeviceRegistry(
        {"dev1": FakeDevice(identifiers=set(), connections=set(), config_entries={"entry1"})}
    )

    with patch.object(entity_cache.dr, "async_get", return_value=device_registry):
        result = entity_cache._is_unifi_relevant_device(hass, "dev1")

    assert result is True


def test_get_entity_registry_event_uses_constant_if_available() -> None:
    with patch.object(entity_cache.er, "EVENT_ENTITY_REGISTRY_UPDATED", "custom_event"):
        result = entity_cache._get_entity_registry_event()

    assert result == "custom_event"


def test_get_entity_registry_event_uses_fallback() -> None:
    with patch.object(entity_cache.er, "EVENT_ENTITY_REGISTRY_UPDATED", None):
        result = entity_cache._get_entity_registry_event()

    assert result == "entity_registry_updated"


def test_get_device_registry_event_uses_constant_if_available() -> None:
    with patch.object(entity_cache.dr, "EVENT_DEVICE_REGISTRY_UPDATED", "custom_device_event"):
        result = entity_cache._get_device_registry_event()

    assert result == "custom_device_event"


def test_get_device_registry_event_uses_fallback() -> None:
    with patch.object(entity_cache.dr, "EVENT_DEVICE_REGISTRY_UPDATED", None):
        result = entity_cache._get_device_registry_event()

    assert result == "device_registry_updated"
