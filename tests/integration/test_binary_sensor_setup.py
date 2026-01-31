from __future__ import annotations

import asyncio
from typing import Any

from custom_components.unifi_network_map import binary_sensor
from custom_components.unifi_network_map.binary_sensor import (
    UniFiClientPresenceSensor,
    UniFiDevicePresenceSensor,
)
from custom_components.unifi_network_map.coordinator import UniFiNetworkMapCoordinator
from custom_components.unifi_network_map.data import UniFiNetworkMapData
from tests.helpers import build_entry


class FakeHass:
    def __init__(self) -> None:
        self.data: dict[str, object] = {}

    async def async_add_executor_job(self, func, *args: object):
        return func(*args)


def _build_payload_with_devices() -> dict[str, Any]:
    return {
        "node_types": {
            "Dream Machine Pro": "gateway",
            "Office Switch": "switch",
            "Living Room AP": "ap",
            "Sonos Speaker": "client",
            "Unknown Device": "other",
        },
        "device_details": {
            "Dream Machine Pro": {
                "mac": "00:00:00:00:00:01",
                "ip": "192.168.1.1",
                "model": "UDM-Pro",
                "uplink_device": None,
            },
            "Office Switch": {
                "mac": "00:00:00:00:00:02",
                "ip": "192.168.1.2",
                "model": "USW-24-PoE",
                "uplink_device": "Dream Machine Pro",
            },
            "Living Room AP": {
                "mac": "00:00:00:00:00:03",
                "ip": "192.168.1.3",
                "model": "U6-LR",
                "uplink_device": "Office Switch",
            },
        },
        "ap_client_counts": {"Living Room AP": 3},
    }


def test_setup_skips_without_coordinator() -> None:
    hass = FakeHass()
    entry = build_entry()
    added: list[object] = []

    def _add_entities(entities):
        added.extend(entities)

    asyncio.run(binary_sensor.async_setup_entry(hass, entry, _add_entities))

    assert added == []


def test_setup_skips_with_wrong_coordinator_type() -> None:
    hass = FakeHass()
    entry = build_entry()
    hass.data["unifi_network_map"] = {entry.entry_id: "not a coordinator"}
    added: list[object] = []

    def _add_entities(entities):
        added.extend(entities)

    asyncio.run(binary_sensor.async_setup_entry(hass, entry, _add_entities))

    assert added == []


def test_setup_creates_entities_for_devices() -> None:
    hass = FakeHass()
    entry = build_entry()
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = UniFiNetworkMapData(svg="<svg />", payload=_build_payload_with_devices())
    coordinator.last_exception = None
    hass.data["unifi_network_map"] = {entry.entry_id: coordinator}
    added: list[UniFiDevicePresenceSensor] = []

    def _add_entities(entities):
        added.extend(entities)

    asyncio.run(binary_sensor.async_setup_entry(hass, entry, _add_entities))

    # Should create entities for gateway, switch, ap only (not client, other)
    assert len(added) == 3
    names = {e.name for e in added}
    assert names == {"Dream Machine Pro", "Office Switch", "Living Room AP"}


def test_setup_excludes_client_and_other_types() -> None:
    hass = FakeHass()
    entry = build_entry()
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = UniFiNetworkMapData(svg="<svg />", payload=_build_payload_with_devices())
    coordinator.last_exception = None
    hass.data["unifi_network_map"] = {entry.entry_id: coordinator}
    added: list[UniFiDevicePresenceSensor] = []

    def _add_entities(entities):
        added.extend(entities)

    asyncio.run(binary_sensor.async_setup_entry(hass, entry, _add_entities))

    types = {e._device_type for e in added}
    assert "client" not in types
    assert "other" not in types


def test_setup_creates_no_entities_when_no_data() -> None:
    hass = FakeHass()
    entry = build_entry()
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = None
    coordinator.last_exception = None
    hass.data["unifi_network_map"] = {entry.entry_id: coordinator}
    added: list[object] = []

    def _add_entities(entities):
        added.extend(entities)

    asyncio.run(binary_sensor.async_setup_entry(hass, entry, _add_entities))

    assert added == []


def test_setup_creates_no_entities_when_empty_payload() -> None:
    hass = FakeHass()
    entry = build_entry()
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = UniFiNetworkMapData(svg="<svg />", payload={})
    coordinator.last_exception = None
    hass.data["unifi_network_map"] = {entry.entry_id: coordinator}
    added: list[object] = []

    def _add_entities(entities):
        added.extend(entities)

    asyncio.run(binary_sensor.async_setup_entry(hass, entry, _add_entities))

    assert added == []


def test_entities_link_to_parent_device() -> None:
    hass = FakeHass()
    entry = build_entry()
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = UniFiNetworkMapData(svg="<svg />", payload=_build_payload_with_devices())
    coordinator.last_exception = None
    hass.data["unifi_network_map"] = {entry.entry_id: coordinator}
    added: list[UniFiDevicePresenceSensor] = []

    def _add_entities(entities):
        added.extend(entities)

    asyncio.run(binary_sensor.async_setup_entry(hass, entry, _add_entities))

    for entity in added:
        device_info = entity.device_info
        assert device_info is not None
        assert ("unifi_network_map", entry.entry_id) in device_info["identifiers"]


def test_entities_have_connectivity_device_class() -> None:
    hass = FakeHass()
    entry = build_entry()
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = UniFiNetworkMapData(svg="<svg />", payload=_build_payload_with_devices())
    coordinator.last_exception = None
    hass.data["unifi_network_map"] = {entry.entry_id: coordinator}
    added: list[UniFiDevicePresenceSensor] = []

    def _add_entities(entities):
        added.extend(entities)

    asyncio.run(binary_sensor.async_setup_entry(hass, entry, _add_entities))

    from homeassistant.components.binary_sensor import BinarySensorDeviceClass

    for entity in added:
        assert entity.device_class == BinarySensorDeviceClass.CONNECTIVITY


# --- Client Presence Sensor Integration Tests ---


def _build_payload_with_clients() -> dict[str, Any]:
    return {
        "node_types": {"Dream Machine Pro": "gateway"},
        "device_details": {"Dream Machine Pro": {"mac": "00:00:00:00:00:01"}},
        "client_details": {
            "aa:bb:cc:dd:ee:ff": {
                "name": "Sonos Speaker",
                "mac": "aa:bb:cc:dd:ee:ff",
                "ip": "192.168.1.50",
            },
            "11:22:33:44:55:66": {
                "name": "iPhone",
                "mac": "11:22:33:44:55:66",
                "ip": "192.168.1.51",
            },
        },
    }


def test_setup_creates_client_entities_from_tracked_macs() -> None:
    hass = FakeHass()
    entry = build_entry(options={"tracked_clients": "aa:bb:cc:dd:ee:ff\n11:22:33:44:55:66"})
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = UniFiNetworkMapData(svg="<svg />", payload=_build_payload_with_clients())
    coordinator.last_exception = None
    hass.data["unifi_network_map"] = {entry.entry_id: coordinator}
    added: list[object] = []

    def _add_entities(entities):
        added.extend(entities)

    asyncio.run(binary_sensor.async_setup_entry(hass, entry, _add_entities))

    # Should create 1 device sensor + 2 client sensors
    device_sensors = [e for e in added if isinstance(e, UniFiDevicePresenceSensor)]
    client_sensors = [e for e in added if isinstance(e, UniFiClientPresenceSensor)]

    assert len(device_sensors) == 1
    assert len(client_sensors) == 2


def test_setup_skips_clients_when_no_tracked_macs() -> None:
    hass = FakeHass()
    entry = build_entry()  # No tracked_clients option
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = UniFiNetworkMapData(svg="<svg />", payload=_build_payload_with_clients())
    coordinator.last_exception = None
    hass.data["unifi_network_map"] = {entry.entry_id: coordinator}
    added: list[object] = []

    def _add_entities(entities):
        added.extend(entities)

    asyncio.run(binary_sensor.async_setup_entry(hass, entry, _add_entities))

    # Should only create device sensors, no client sensors
    client_sensors = [e for e in added if isinstance(e, UniFiClientPresenceSensor)]
    assert len(client_sensors) == 0


def test_client_entities_have_connectivity_device_class() -> None:
    hass = FakeHass()
    entry = build_entry(options={"tracked_clients": "aa:bb:cc:dd:ee:ff"})
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = UniFiNetworkMapData(svg="<svg />", payload=_build_payload_with_clients())
    coordinator.last_exception = None
    hass.data["unifi_network_map"] = {entry.entry_id: coordinator}
    added: list[object] = []

    def _add_entities(entities):
        added.extend(entities)

    asyncio.run(binary_sensor.async_setup_entry(hass, entry, _add_entities))

    from homeassistant.components.binary_sensor import BinarySensorDeviceClass

    client_sensors = [e for e in added if isinstance(e, UniFiClientPresenceSensor)]
    assert len(client_sensors) == 1
    for entity in client_sensors:
        assert entity.device_class == BinarySensorDeviceClass.CONNECTIVITY


def test_client_entities_link_to_parent_device() -> None:
    hass = FakeHass()
    entry = build_entry(options={"tracked_clients": "aa:bb:cc:dd:ee:ff"})
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = UniFiNetworkMapData(svg="<svg />", payload=_build_payload_with_clients())
    coordinator.last_exception = None
    hass.data["unifi_network_map"] = {entry.entry_id: coordinator}
    added: list[object] = []

    def _add_entities(entities):
        added.extend(entities)

    asyncio.run(binary_sensor.async_setup_entry(hass, entry, _add_entities))

    client_sensors = [e for e in added if isinstance(e, UniFiClientPresenceSensor)]
    for entity in client_sensors:
        device_info = entity.device_info
        assert device_info is not None
        assert ("unifi_network_map", entry.entry_id) in device_info["identifiers"]


def test_setup_skips_invalid_macs_in_tracked_clients() -> None:
    hass = FakeHass()
    entry = build_entry(
        options={"tracked_clients": "aa:bb:cc:dd:ee:ff\ninvalid_mac\n11:22:33:44:55:66"}
    )
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = UniFiNetworkMapData(svg="<svg />", payload=_build_payload_with_clients())
    coordinator.last_exception = None
    hass.data["unifi_network_map"] = {entry.entry_id: coordinator}
    added: list[object] = []

    def _add_entities(entities):
        added.extend(entities)

    asyncio.run(binary_sensor.async_setup_entry(hass, entry, _add_entities))

    # Should only create 2 client sensors (invalid one skipped)
    client_sensors = [e for e in added if isinstance(e, UniFiClientPresenceSensor)]
    assert len(client_sensors) == 2
