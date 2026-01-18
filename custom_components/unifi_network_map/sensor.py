from __future__ import annotations

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN, PAYLOAD_SCHEMA_VERSION
from .coordinator import UniFiNetworkMapCoordinator
from .data import UniFiNetworkMapData


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities,
) -> None:
    coordinator = hass.data.get(DOMAIN, {}).get(entry.entry_id)
    if not isinstance(coordinator, UniFiNetworkMapCoordinator):
        return
    async_add_entities([UniFiNetworkMapSensor(coordinator, entry)])


class UniFiNetworkMapSensor(CoordinatorEntity[UniFiNetworkMapData], SensorEntity):
    _attr_has_entity_name = True
    _attr_name = "Status"
    _attr_icon = "mdi:graph"

    def __init__(self, coordinator: UniFiNetworkMapCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator)
        self._entry = entry
        self._attr_unique_id = f"{entry.entry_id}_map"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)},
            name=entry.title,
            entry_type=DeviceEntryType.SERVICE,
            manufacturer="Ubiquiti",
        )

    @property
    def native_value(self) -> str:
        return _derive_state(self.coordinator)

    @property
    def extra_state_attributes(self) -> dict[str, str]:
        error = _format_error(self.coordinator)
        entry_id = self._entry.entry_id
        return {
            "entry_id": entry_id,
            "svg_url": f"/api/unifi_network_map/{entry_id}/svg",
            "payload_url": f"/api/unifi_network_map/{entry_id}/payload",
            "payload_schema_version": PAYLOAD_SCHEMA_VERSION,
            "last_error": error or "",
        }


def _derive_state(coordinator: UniFiNetworkMapCoordinator) -> str:
    if coordinator.data:
        return "ready"
    if coordinator.last_exception:
        return "error"
    return "unavailable"


def _format_error(coordinator: UniFiNetworkMapCoordinator) -> str | None:
    error = coordinator.last_exception
    if not error:
        return None
    return str(error)
