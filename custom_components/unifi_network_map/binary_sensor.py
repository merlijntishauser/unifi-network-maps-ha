from __future__ import annotations

# pyright: reportUntypedBaseClass=false

from typing import Any

from homeassistant.components.binary_sensor import (
    BinarySensorDeviceClass,
    BinarySensorEntity,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN
from .coordinator import UniFiNetworkMapCoordinator
from .data import UniFiNetworkMapData

DEVICE_TYPES_TO_TRACK = frozenset({"gateway", "switch", "ap"})


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up device presence binary sensors from a config entry."""
    coordinator = hass.data.get(DOMAIN, {}).get(entry.entry_id)
    if not isinstance(coordinator, UniFiNetworkMapCoordinator):
        return

    entities = _create_device_presence_entities(coordinator, entry)
    if entities:
        async_add_entities(entities)


def _create_device_presence_entities(
    coordinator: UniFiNetworkMapCoordinator,
    entry: ConfigEntry,
) -> list[UniFiDevicePresenceSensor]:
    """Create binary sensors for network devices."""
    if not coordinator.data or not coordinator.data.payload:
        return []

    payload = coordinator.data.payload
    node_types = payload.get("node_types", {})
    device_details = payload.get("device_details", {})

    entities: list[UniFiDevicePresenceSensor] = []
    for name, device_type in node_types.items():
        if device_type not in DEVICE_TYPES_TO_TRACK:
            continue
        details = device_details.get(name, {})
        entities.append(
            UniFiDevicePresenceSensor(
                coordinator=coordinator,
                entry=entry,
                device_name=name,
                device_type=device_type,
                device_details=details,
            )
        )
    return entities


class UniFiDevicePresenceSensor(  # type: ignore[reportUntypedBaseClass]
    CoordinatorEntity[UniFiNetworkMapData], BinarySensorEntity
):
    """Binary sensor for UniFi network device presence."""

    _attr_device_class = BinarySensorDeviceClass.CONNECTIVITY
    _attr_has_entity_name = True

    def __init__(
        self,
        coordinator: UniFiNetworkMapCoordinator,
        entry: ConfigEntry,
        device_name: str,
        device_type: str,
        device_details: dict[str, Any],
    ) -> None:
        """Initialize the device presence sensor."""
        super().__init__(coordinator)
        self._entry = entry
        self._device_name = device_name
        self._device_type = device_type
        self._initial_details = device_details

        normalized_name = _normalize_name(device_name)
        self._attr_unique_id = f"{entry.entry_id}_device_{normalized_name}"
        self._attr_name = device_name
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)},
        )

    @property
    def is_on(self) -> bool:
        """Return True if device is present in current topology."""
        if not self.coordinator.data or not self.coordinator.data.payload:
            return False
        node_types = self.coordinator.data.payload.get("node_types", {})
        return self._device_name in node_types

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return device attributes."""
        details = self._get_current_details()
        attrs: dict[str, Any] = {
            "device_type": self._device_type,
        }

        if details.get("mac"):
            attrs["mac"] = details["mac"]
        if details.get("ip"):
            attrs["ip"] = details["ip"]
        if details.get("model"):
            attrs["model"] = details["model"]
        if details.get("uplink_device"):
            attrs["uplink_device"] = details["uplink_device"]

        if self._device_type == "ap":
            ap_counts = self._get_ap_client_counts()
            attrs["clients_connected"] = ap_counts.get(self._device_name, 0)

        return attrs

    def _get_current_details(self) -> dict[str, Any]:
        """Get device details from current coordinator data."""
        if not self.coordinator.data or not self.coordinator.data.payload:
            return self._initial_details
        device_details = self.coordinator.data.payload.get("device_details", {})
        return device_details.get(self._device_name, self._initial_details)

    def _get_ap_client_counts(self) -> dict[str, int]:
        """Get AP client counts from coordinator data."""
        if not self.coordinator.data or not self.coordinator.data.payload:
            return {}
        return self.coordinator.data.payload.get("ap_client_counts", {})


def _normalize_name(name: str) -> str:
    """Normalize device name for entity ID."""
    normalized = name.lower()
    normalized = normalized.replace(" ", "_")
    normalized = normalized.replace("-", "_")
    normalized = normalized.replace(".", "_")
    return normalized
