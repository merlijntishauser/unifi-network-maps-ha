from __future__ import annotations

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN, PAYLOAD_SCHEMA_VERSION
from .coordinator import UniFiNetworkMapCoordinator
from .data import UniFiNetworkMapData


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities,
) -> None:
    coordinator: UniFiNetworkMapCoordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([UniFiNetworkMapSensor(coordinator, entry.entry_id)])


class UniFiNetworkMapSensor(CoordinatorEntity[UniFiNetworkMapData], SensorEntity):
    _attr_name = "UniFi Network Map"
    _attr_icon = "mdi:graph"

    def __init__(self, coordinator: UniFiNetworkMapCoordinator, entry_id: str) -> None:
        super().__init__(coordinator)
        self._entry_id = entry_id
        self._attr_unique_id = f"{entry_id}_map"

    @property
    def native_value(self) -> str:
        return "ready" if self.coordinator.data else "unavailable"

    @property
    def extra_state_attributes(self) -> dict[str, str]:
        return {
            "entry_id": self._entry_id,
            "svg_url": f"/api/unifi_network_map/{self._entry_id}/svg",
            "payload_url": f"/api/unifi_network_map/{self._entry_id}/payload",
            "payload_schema_version": PAYLOAD_SCHEMA_VERSION,
        }
