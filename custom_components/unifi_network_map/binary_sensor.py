from __future__ import annotations

# pyright: reportUntypedBaseClass=false

from typing import Any

from homeassistant.components.binary_sensor import (
    BinarySensorDeviceClass,
    BinarySensorEntity,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import CONF_TRACKED_CLIENTS, DOMAIN
from .coordinator import UniFiNetworkMapCoordinator
from .data import UniFiNetworkMapData

DEVICE_TYPES_TO_TRACK = frozenset({"gateway", "switch", "ap"})
EntityList = list["UniFiDevicePresenceSensor | UniFiClientPresenceSensor"]


class _EntityTracker:
    """Tracks added entities and handles dynamic entity creation."""

    def __init__(
        self,
        coordinator: UniFiNetworkMapCoordinator,
        entry: ConfigEntry,
        async_add_entities: AddEntitiesCallback,
    ) -> None:
        self._coordinator = coordinator
        self._entry = entry
        self._async_add_entities = async_add_entities
        self._added_devices: set[str] = set()
        self._added_clients: set[str] = set()

    def add_new_entities(self) -> None:
        """Add any new entities based on current coordinator data."""
        if not self._coordinator.data or not self._coordinator.data.payload:
            return

        new_entities: EntityList = []
        self._collect_device_entities(new_entities)
        self._collect_client_entities(new_entities)

        if new_entities:
            self._async_add_entities(new_entities)

    def _collect_device_entities(self, entities: EntityList) -> None:
        """Collect new device entities."""
        for entity in _create_device_presence_entities(self._coordinator, self._entry):
            if entity.unique_id and entity.unique_id not in self._added_devices:
                self._added_devices.add(entity.unique_id)
                entities.append(entity)

    def _collect_client_entities(self, entities: EntityList) -> None:
        """Collect new client entities."""
        for entity in _create_client_presence_entities(self._coordinator, self._entry):
            if entity.unique_id and entity.unique_id not in self._added_clients:
                self._added_clients.add(entity.unique_id)
                entities.append(entity)

    def register_listener(self) -> None:
        """Register coordinator update listener."""
        if not hasattr(self._coordinator, "async_add_listener"):
            return

        @callback  # type: ignore[misc]
        def _handle_update() -> None:
            self.add_new_entities()

        self._entry.async_on_unload(self._coordinator.async_add_listener(_handle_update))


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up device and client presence binary sensors from a config entry."""
    coordinator = hass.data.get(DOMAIN, {}).get(entry.entry_id)
    if not isinstance(coordinator, UniFiNetworkMapCoordinator):
        return

    tracker = _EntityTracker(coordinator, entry, async_add_entities)
    tracker.add_new_entities()
    tracker.register_listener()


def _create_device_presence_entities(
    coordinator: UniFiNetworkMapCoordinator,
    entry: ConfigEntry,
) -> list["UniFiDevicePresenceSensor"]:
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


def _create_client_presence_entities(
    coordinator: UniFiNetworkMapCoordinator,
    entry: ConfigEntry,
) -> list["UniFiClientPresenceSensor"]:
    """Create binary sensors for tracked clients."""
    tracked_macs = _parse_tracked_clients(entry)
    if not tracked_macs:
        return []

    entities: list[UniFiClientPresenceSensor] = []
    for mac in tracked_macs:
        entities.append(
            UniFiClientPresenceSensor(
                coordinator=coordinator,
                entry=entry,
                client_mac=mac,
            )
        )
    return entities


def _parse_tracked_clients(entry: ConfigEntry) -> list[str]:
    """Parse tracked client MAC addresses from entry options."""
    raw_value = entry.options.get(CONF_TRACKED_CLIENTS, "")
    if not raw_value or not isinstance(raw_value, str):
        return []

    macs: list[str] = []
    for line in raw_value.strip().split("\n"):
        mac = _normalize_mac(line.strip())
        if mac:
            macs.append(mac)
    return macs


def _normalize_mac(mac: str) -> str | None:
    """Normalize and validate a MAC address."""
    if not mac:
        return None
    # Remove common separators and convert to lowercase
    cleaned = mac.lower().replace(":", "").replace("-", "").replace(".", "")
    if len(cleaned) != 12:
        return None
    if not all(c in "0123456789abcdef" for c in cleaned):
        return None
    # Return as colon-separated lowercase
    return ":".join(cleaned[i : i + 2] for i in range(0, 12, 2))


class UniFiClientPresenceSensor(  # type: ignore[reportUntypedBaseClass]
    CoordinatorEntity[UniFiNetworkMapData], BinarySensorEntity
):
    """Binary sensor for UniFi client presence."""

    _attr_device_class = BinarySensorDeviceClass.CONNECTIVITY
    _attr_has_entity_name = True

    def __init__(
        self,
        coordinator: UniFiNetworkMapCoordinator,
        entry: ConfigEntry,
        client_mac: str,
    ) -> None:
        """Initialize the client presence sensor."""
        super().__init__(coordinator)
        self._entry = entry
        self._client_mac = client_mac

        mac_normalized = client_mac.replace(":", "")
        self._attr_unique_id = f"{entry.entry_id}_client_{mac_normalized}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)},
        )

    @property
    def name(self) -> str:
        """Return client name from current data or MAC."""
        details = self._get_client_details()
        if details and details.get("name"):
            return str(details["name"])
        return self._client_mac

    @property
    def is_on(self) -> bool:
        """Return True if client is connected."""
        return self._get_client_details() is not None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return client attributes."""
        details = self._get_client_details()
        attrs: dict[str, Any] = {"mac": self._client_mac}

        if not details:
            return attrs

        if details.get("ip"):
            attrs["ip"] = details["ip"]
        if details.get("vlan") is not None:
            attrs["vlan"] = details["vlan"]
        if details.get("network"):
            attrs["network"] = details["network"]

        # Resolve connected_to device name
        connected_to_mac = details.get("connected_to_mac")
        if connected_to_mac:
            connected_to_name = self._resolve_device_name(connected_to_mac)
            if connected_to_name:
                attrs["connected_to"] = connected_to_name

        # Connection type
        is_wired = details.get("is_wired")
        if is_wired is not None:
            attrs["connection_type"] = "wired" if is_wired else "wireless"

        return attrs

    def _get_client_details(self) -> dict[str, Any] | None:
        """Get client details from current coordinator data."""
        if not self.coordinator.data or not self.coordinator.data.payload:
            return None
        client_details = self.coordinator.data.payload.get("client_details", {})
        return client_details.get(self._client_mac)

    def _resolve_device_name(self, mac: str) -> str | None:
        """Resolve a device MAC to its name."""
        if not self.coordinator.data or not self.coordinator.data.payload:
            return None
        device_macs = self.coordinator.data.payload.get("device_macs", {})
        for name, device_mac in device_macs.items():
            if device_mac.lower() == mac.lower():
                return name
        return None
