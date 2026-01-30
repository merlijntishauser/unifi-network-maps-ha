"""Entity registry index caching for MAC-to-entity lookups.

Caches the MAC address indices and invalidates them when entity or device
registry changes occur.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable

from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er

from .const import DOMAIN, LOGGER

_CACHE_KEY = "entity_registry_cache"


@dataclass
class EntityRegistryCache:
    """Cache for MAC-to-entity index data."""

    _mac_to_entity: dict[str, str] | None = field(default=None, repr=False)
    _mac_to_all_entities: dict[str, list[str]] | None = field(default=None, repr=False)
    _unsub_entity: Callable[[], None] | None = field(default=None, repr=False)
    _unsub_device: Callable[[], None] | None = field(default=None, repr=False)

    @property
    def mac_to_entity(self) -> dict[str, str] | None:
        """Return cached primary MAC-to-entity index."""
        return self._mac_to_entity

    @mac_to_entity.setter
    def mac_to_entity(self, value: dict[str, str]) -> None:
        self._mac_to_entity = value

    @property
    def mac_to_all_entities(self) -> dict[str, list[str]] | None:
        """Return cached all-entities index."""
        return self._mac_to_all_entities

    @mac_to_all_entities.setter
    def mac_to_all_entities(self, value: dict[str, list[str]]) -> None:
        self._mac_to_all_entities = value

    def invalidate(self) -> None:
        """Clear cached indices."""
        self._mac_to_entity = None
        self._mac_to_all_entities = None

    def unsubscribe(self) -> None:
        """Unsubscribe from registry events."""
        if self._unsub_entity:
            self._unsub_entity()
            self._unsub_entity = None
        if self._unsub_device:
            self._unsub_device()
            self._unsub_device = None

    def set_unsubscribe_callbacks(
        self,
        unsub_entity: Callable[[], None],
        unsub_device: Callable[[], None],
    ) -> None:
        """Set the unsubscribe callbacks for registry events."""
        self._unsub_entity = unsub_entity
        self._unsub_device = unsub_device


def get_entity_cache(hass: HomeAssistant) -> EntityRegistryCache:
    """Get or create the entity registry cache for this hass instance."""
    data = hass.data.setdefault(DOMAIN, {})
    cache = data.get(_CACHE_KEY)
    if cache is None:
        cache = EntityRegistryCache()
        data[_CACHE_KEY] = cache
        _subscribe_to_registry_events(hass, cache)
    return cache


def invalidate_entity_cache(hass: HomeAssistant) -> None:
    """Invalidate the entity registry cache."""
    data = hass.data.get(DOMAIN, {})
    cache = data.get(_CACHE_KEY)
    if cache is not None:
        cache.invalidate()
        LOGGER.debug("Entity registry cache invalidated")


def cleanup_entity_cache(hass: HomeAssistant) -> None:
    """Clean up the entity cache and unsubscribe from events."""
    data = hass.data.get(DOMAIN, {})
    cache = data.pop(_CACHE_KEY, None)
    if cache is not None:
        cache.unsubscribe()
        LOGGER.debug("Entity registry cache cleaned up")


def _subscribe_to_registry_events(hass: HomeAssistant, cache: EntityRegistryCache) -> None:
    """Subscribe to entity and device registry update events."""

    @callback  # type: ignore[reportUntypedFunctionDecorator]
    def _on_entity_registry_updated(event: Event[dict[str, str]]) -> None:
        action = event.data.get("action", "")
        entity_id = event.data.get("entity_id", "")
        if _is_unifi_relevant_event(hass, entity_id):
            cache.invalidate()
            LOGGER.debug("Entity cache invalidated: entity %s %s", action, entity_id)

    @callback  # type: ignore[reportUntypedFunctionDecorator]
    def _on_device_registry_updated(event: Event[dict[str, str]]) -> None:
        action = event.data.get("action", "")
        device_id = event.data.get("device_id", "")
        if _is_unifi_relevant_device(hass, device_id):
            cache.invalidate()
            LOGGER.debug("Entity cache invalidated: device %s %s", action, device_id)

    entity_event = _get_entity_registry_event()
    device_event = _get_device_registry_event()

    unsub_entity = hass.bus.async_listen(entity_event, _on_entity_registry_updated)
    unsub_device = hass.bus.async_listen(device_event, _on_device_registry_updated)
    cache.set_unsubscribe_callbacks(unsub_entity, unsub_device)
    LOGGER.debug("Subscribed to entity and device registry events")


def _get_entity_registry_event() -> str:
    """Get the entity registry event name."""
    event = getattr(er, "EVENT_ENTITY_REGISTRY_UPDATED", None)
    if event is not None:
        return str(event) if not isinstance(event, str) else event
    return "entity_registry_updated"


def _get_device_registry_event() -> str:
    """Get the device registry event name."""
    event = getattr(dr, "EVENT_DEVICE_REGISTRY_UPDATED", None)
    if event is not None:
        return str(event) if not isinstance(event, str) else event
    return "device_registry_updated"


def _is_unifi_relevant_event(hass: HomeAssistant, entity_id: str) -> bool:
    """Check if the entity change is relevant to UniFi entities."""
    if not entity_id:
        return True
    entity_registry = er.async_get(hass)
    entry = entity_registry.async_get(entity_id)
    if entry is None:
        return True
    platform = getattr(entry, "platform", None)
    if platform == "unifi":
        return True
    for config_entry in hass.config_entries.async_entries("unifi"):
        if entry.config_entry_id == config_entry.entry_id:
            return True
    return False


def _is_unifi_relevant_device(hass: HomeAssistant, device_id: str) -> bool:
    """Check if the device change is relevant to UniFi devices."""
    if not device_id:
        return True
    device_registry = dr.async_get(hass)
    device = device_registry.async_get(device_id)
    if device is None:
        return True
    for identifier in device.identifiers:
        if len(identifier) >= 2 and identifier[0] == "unifi":
            return True
    for config_entry_id in device.config_entries:
        entry = hass.config_entries.async_get_entry(config_entry_id)
        if entry is not None and entry.domain == "unifi":
            return True
    return False
