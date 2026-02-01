from __future__ import annotations

import asyncio
from typing import Any

from custom_components.unifi_network_map import sensor
from custom_components.unifi_network_map.coordinator import UniFiNetworkMapCoordinator
from custom_components.unifi_network_map.data import UniFiNetworkMapData
from custom_components.unifi_network_map.sensor import UniFiVlanClientsSensor
from tests.helpers import build_entry


class FakeHass:
    def __init__(self) -> None:
        self.data: dict[str, object] = {}

    async def async_add_executor_job(self, func, *args: object):
        return func(*args)


def test_sensor_setup_skips_without_coordinator() -> None:
    hass = FakeHass()
    entry = build_entry()
    added: list[object] = []

    def _add_entities(entities):
        added.extend(entities)

    asyncio.run(sensor.async_setup_entry(hass, entry, _add_entities))

    assert added == []


def test_sensor_state_and_attributes() -> None:
    hass = FakeHass()
    entry = build_entry()
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = UniFiNetworkMapData(svg="<svg />", payload={})
    coordinator.last_exception = None
    hass.data["unifi_network_map"] = {entry.entry_id: coordinator}
    added: list[sensor.UniFiNetworkMapSensor] = []

    def _add_entities(entities):
        added.extend(entities)

    asyncio.run(sensor.async_setup_entry(hass, entry, _add_entities))

    assert len(added) == 1
    entity = added[0]
    assert entity.native_value == "ready"
    attrs = entity.extra_state_attributes
    assert attrs["entry_id"] == entry.entry_id
    assert attrs["svg_url"].endswith(f"/{entry.entry_id}/svg")
    assert attrs["payload_url"].endswith(f"/{entry.entry_id}/payload")


def test_sensor_error_state() -> None:
    hass = FakeHass()
    entry = build_entry()
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = None
    coordinator.last_exception = RuntimeError("boom")
    hass.data["unifi_network_map"] = {entry.entry_id: coordinator}
    added: list[sensor.UniFiNetworkMapSensor] = []

    def _add_entities(entities):
        added.extend(entities)

    asyncio.run(sensor.async_setup_entry(hass, entry, _add_entities))

    entity = added[0]
    assert entity.native_value == "error"
    assert entity.extra_state_attributes["last_error"] == "boom"


# --- VLAN Client Sensor Tests ---


def _build_payload_with_vlans() -> dict[str, Any]:
    # Use string keys to match JSON behavior (JSON keys are always strings)
    return {
        "vlan_info": {
            "10": {
                "id": 10,
                "name": "IoT",
                "client_count": 3,
                "clients": ["Sonos Speaker", "Hue Bridge", "Smart TV"],
            },
            "20": {
                "id": 20,
                "name": "Guest",
                "client_count": 2,
                "clients": ["iPhone", "iPad"],
            },
        },
    }


def test_setup_creates_vlan_sensors() -> None:
    hass = FakeHass()
    entry = build_entry()
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = UniFiNetworkMapData(svg="<svg />", payload=_build_payload_with_vlans())
    coordinator.last_exception = None
    hass.data["unifi_network_map"] = {entry.entry_id: coordinator}
    added: list[object] = []

    def _add_entities(entities):
        added.extend(entities)

    asyncio.run(sensor.async_setup_entry(hass, entry, _add_entities))

    # Should create 1 status sensor + 2 VLAN sensors
    vlan_sensors = [e for e in added if isinstance(e, UniFiVlanClientsSensor)]
    assert len(vlan_sensors) == 2


def test_vlan_sensor_state_shows_client_count() -> None:
    hass = FakeHass()
    entry = build_entry()
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = UniFiNetworkMapData(svg="<svg />", payload=_build_payload_with_vlans())
    coordinator.last_exception = None
    hass.data["unifi_network_map"] = {entry.entry_id: coordinator}
    added: list[object] = []

    def _add_entities(entities):
        added.extend(entities)

    asyncio.run(sensor.async_setup_entry(hass, entry, _add_entities))

    vlan_sensors = [e for e in added if isinstance(e, UniFiVlanClientsSensor)]
    iot_sensor = next(s for s in vlan_sensors if s._vlan_id == 10)
    guest_sensor = next(s for s in vlan_sensors if s._vlan_id == 20)

    assert iot_sensor.native_value == 3
    assert guest_sensor.native_value == 2


def test_vlan_sensor_attributes() -> None:
    hass = FakeHass()
    entry = build_entry()
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = UniFiNetworkMapData(svg="<svg />", payload=_build_payload_with_vlans())
    coordinator.last_exception = None
    hass.data["unifi_network_map"] = {entry.entry_id: coordinator}
    added: list[object] = []

    def _add_entities(entities):
        added.extend(entities)

    asyncio.run(sensor.async_setup_entry(hass, entry, _add_entities))

    vlan_sensors = [e for e in added if isinstance(e, UniFiVlanClientsSensor)]
    iot_sensor = next(s for s in vlan_sensors if s._vlan_id == 10)

    attrs = iot_sensor.extra_state_attributes
    assert attrs["vlan_id"] == 10
    assert attrs["vlan_name"] == "IoT"
    assert attrs["clients"] == ["Sonos Speaker", "Hue Bridge", "Smart TV"]


def test_vlan_sensor_unique_id_format() -> None:
    hass = FakeHass()
    entry = build_entry()
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = UniFiNetworkMapData(svg="<svg />", payload=_build_payload_with_vlans())
    coordinator.last_exception = None
    hass.data["unifi_network_map"] = {entry.entry_id: coordinator}
    added: list[object] = []

    def _add_entities(entities):
        added.extend(entities)

    asyncio.run(sensor.async_setup_entry(hass, entry, _add_entities))

    vlan_sensors = [e for e in added if isinstance(e, UniFiVlanClientsSensor)]
    iot_sensor = next(s for s in vlan_sensors if s._vlan_id == 10)

    assert iot_sensor.unique_id == f"{entry.entry_id}_vlan_10_clients"


def test_no_vlan_sensors_when_vlan_info_empty() -> None:
    hass = FakeHass()
    entry = build_entry()
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = UniFiNetworkMapData(svg="<svg />", payload={"vlan_info": {}})
    coordinator.last_exception = None
    hass.data["unifi_network_map"] = {entry.entry_id: coordinator}
    added: list[object] = []

    def _add_entities(entities):
        added.extend(entities)

    asyncio.run(sensor.async_setup_entry(hass, entry, _add_entities))

    vlan_sensors = [e for e in added if isinstance(e, UniFiVlanClientsSensor)]
    assert len(vlan_sensors) == 0


def test_no_vlan_sensors_when_no_data() -> None:
    hass = FakeHass()
    entry = build_entry()
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = None
    coordinator.last_exception = None
    hass.data["unifi_network_map"] = {entry.entry_id: coordinator}
    added: list[object] = []

    def _add_entities(entities):
        added.extend(entities)

    asyncio.run(sensor.async_setup_entry(hass, entry, _add_entities))

    vlan_sensors = [e for e in added if isinstance(e, UniFiVlanClientsSensor)]
    assert len(vlan_sensors) == 0
