from __future__ import annotations

# pyright: reportUntypedBaseClass=false

from typing import Any

from homeassistant.components.sensor import SensorEntity, SensorStateClass
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN, PAYLOAD_SCHEMA_VERSION
from .coordinator import UniFiNetworkMapCoordinator
from .data import UniFiNetworkMapData

EntityList = list["UniFiNetworkMapSensor | UniFiVlanClientsSensor"]


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up sensors from a config entry."""
    coordinator = hass.data.get(DOMAIN, {}).get(entry.entry_id)
    if not isinstance(coordinator, UniFiNetworkMapCoordinator):
        return

    # Always add the status sensor
    async_add_entities([UniFiNetworkMapSensor(coordinator, entry)])

    # Track which VLAN sensors we've already added
    added_vlans: set[str] = set()

    def _add_new_vlan_sensors() -> None:
        """Add any new VLAN sensors based on current coordinator data."""
        if not coordinator.data or not coordinator.data.payload:
            return

        new_entities: list[UniFiVlanClientsSensor] = []

        for entity in _create_vlan_sensors(coordinator, entry):
            if entity.unique_id and entity.unique_id not in added_vlans:
                added_vlans.add(entity.unique_id)
                new_entities.append(entity)

        if new_entities:
            async_add_entities(new_entities)

    # Add VLAN sensors from current data (if available)
    _add_new_vlan_sensors()

    @callback  # type: ignore[misc]
    def _handle_coordinator_update() -> None:
        """Handle coordinator data updates - add new VLAN sensors if needed."""
        _add_new_vlan_sensors()

    # Listen for future coordinator updates to add new VLAN sensors
    if hasattr(coordinator, "async_add_listener"):
        entry.async_on_unload(coordinator.async_add_listener(_handle_coordinator_update))


def _create_vlan_sensors(
    coordinator: UniFiNetworkMapCoordinator,
    entry: ConfigEntry,
) -> list["UniFiVlanClientsSensor"]:
    """Create VLAN client count sensors."""
    if not coordinator.data or not coordinator.data.payload:
        return []

    vlan_info = coordinator.data.payload.get("vlan_info", {})
    if not vlan_info:
        return []

    entities: list[UniFiVlanClientsSensor] = []
    for vlan_id, info in vlan_info.items():
        entities.append(
            UniFiVlanClientsSensor(
                coordinator=coordinator,
                entry=entry,
                vlan_id=int(vlan_id),
                vlan_name=str(info.get("name", f"VLAN {vlan_id}")),
            )
        )
    return entities


class UniFiNetworkMapSensor(  # type: ignore[reportUntypedBaseClass]
    CoordinatorEntity[UniFiNetworkMapData], SensorEntity
):
    """Status sensor for the UniFi Network Map integration."""

    _attr_has_entity_name = True
    _attr_name = "Status"
    _attr_icon = "mdi:graph"

    def __init__(self, coordinator: UniFiNetworkMapCoordinator, entry: ConfigEntry) -> None:
        """Initialize the status sensor."""
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
        """Return the current state."""
        return _derive_state(self.coordinator)

    @property
    def extra_state_attributes(self) -> dict[str, str]:
        """Return additional state attributes."""
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
    """Derive sensor state from coordinator."""
    if coordinator.data:
        return "ready"
    if coordinator.last_exception:
        return "error"
    return "unavailable"


def _format_error(coordinator: UniFiNetworkMapCoordinator) -> str | None:
    """Format error message from coordinator."""
    error = coordinator.last_exception
    if not error:
        return None
    return str(error)


class UniFiVlanClientsSensor(  # type: ignore[reportUntypedBaseClass]
    CoordinatorEntity[UniFiNetworkMapData], SensorEntity
):
    """Sensor showing client count per VLAN."""

    _attr_has_entity_name = True
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_icon = "mdi:lan"

    def __init__(
        self,
        coordinator: UniFiNetworkMapCoordinator,
        entry: ConfigEntry,
        vlan_id: int,
        vlan_name: str,
    ) -> None:
        """Initialize the VLAN client count sensor."""
        super().__init__(coordinator)
        self._entry = entry
        self._vlan_id = vlan_id
        self._vlan_name = vlan_name

        self._attr_unique_id = f"{entry.entry_id}_vlan_{vlan_id}_clients"
        self._attr_name = f"{vlan_name} Clients"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)},
        )

    @property
    def native_value(self) -> int:
        """Return the number of clients on this VLAN."""
        vlan_info = self._get_vlan_info()
        if not vlan_info:
            return 0
        return int(vlan_info.get("client_count", 0))

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return VLAN attributes."""
        vlan_info = self._get_vlan_info()
        clients = vlan_info.get("clients", []) if vlan_info else []

        return {
            "vlan_id": self._vlan_id,
            "vlan_name": self._vlan_name,
            "clients": clients,
        }

    def _get_vlan_info(self) -> dict[str, Any] | None:
        """Get VLAN info from current coordinator data."""
        if not self.coordinator.data or not self.coordinator.data.payload:
            return None
        vlan_info = self.coordinator.data.payload.get("vlan_info", {})
        return vlan_info.get(self._vlan_id)
