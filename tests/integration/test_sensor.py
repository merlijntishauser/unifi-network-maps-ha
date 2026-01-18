from __future__ import annotations

import asyncio
from dataclasses import dataclass

from custom_components.unifi_network_map import sensor
from custom_components.unifi_network_map.coordinator import UniFiNetworkMapCoordinator
from custom_components.unifi_network_map.data import UniFiNetworkMapData


@dataclass
class FakeEntry:
    entry_id: str
    title: str
    data: dict[str, object]
    options: dict[str, object]


class FakeHass:
    def __init__(self) -> None:
        self.data: dict[str, object] = {}

    async def async_add_executor_job(self, func, *args: object):
        return func(*args)


def _build_entry() -> FakeEntry:
    return FakeEntry(
        entry_id="entry-1",
        title="Controller",
        data={
            "url": "https://controller.local",
            "username": "user",
            "password": "pass",
            "site": "default",
        },
        options={},
    )


def test_sensor_setup_skips_without_coordinator() -> None:
    hass = FakeHass()
    entry = _build_entry()
    added: list[object] = []

    def _add_entities(entities):
        added.extend(entities)

    asyncio.run(sensor.async_setup_entry(hass, entry, _add_entities))

    assert added == []


def test_sensor_state_and_attributes() -> None:
    hass = FakeHass()
    entry = _build_entry()
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
    entry = _build_entry()
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
