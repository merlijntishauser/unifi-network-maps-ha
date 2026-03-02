from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.unifi_network_map import sensor
from custom_components.unifi_network_map.coordinator import (
    UniFiNetworkMapCoordinator,
)
from custom_components.unifi_network_map.data import UniFiNetworkMapData
from custom_components.unifi_network_map.sensor import (
    UniFiVlanClientsSensor,
)
from tests.integration.conftest import build_mock_entry


async def _setup_sensor(
    hass: HomeAssistant,
    entry: MockConfigEntry,
    coordinator: UniFiNetworkMapCoordinator,
) -> list[object]:
    """Set up sensor entities and shut down the coordinator."""
    entry.runtime_data = coordinator
    added: list[object] = []
    await sensor.async_setup_entry(
        hass, entry, lambda entities: added.extend(entities)
    )
    await coordinator.async_shutdown()
    return added


async def test_sensor_state_and_attributes(
    hass: HomeAssistant,
) -> None:
    entry = build_mock_entry()
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = UniFiNetworkMapData(svg="<svg />", payload={})
    coordinator.last_exception = None

    added = await _setup_sensor(hass, entry, coordinator)

    assert len(added) == 1
    entity = added[0]
    assert entity.native_value == "ready"
    attrs = entity.extra_state_attributes
    assert attrs["entry_id"] == entry.entry_id
    assert attrs["svg_url"].endswith(f"/{entry.entry_id}/svg")
    assert attrs["payload_url"].endswith(f"/{entry.entry_id}/payload")


async def test_sensor_error_state(hass: HomeAssistant) -> None:
    entry = build_mock_entry()
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = None
    coordinator.last_exception = RuntimeError("boom")

    added = await _setup_sensor(hass, entry, coordinator)

    entity = added[0]
    assert entity.native_value == "error"
    assert entity.extra_state_attributes["last_error"] == "boom"


# --- VLAN Client Sensor Tests ---


def _build_payload_with_vlans() -> dict[str, Any]:
    return {
        "vlan_info": {
            "10": {
                "id": 10,
                "name": "IoT",
                "client_count": 3,
                "clients": [
                    "Sonos Speaker",
                    "Hue Bridge",
                    "Smart TV",
                ],
            },
            "20": {
                "id": 20,
                "name": "Guest",
                "client_count": 2,
                "clients": ["iPhone", "iPad"],
            },
        },
    }


async def test_setup_creates_vlan_sensors(
    hass: HomeAssistant,
) -> None:
    entry = build_mock_entry()
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = UniFiNetworkMapData(
        svg="<svg />", payload=_build_payload_with_vlans()
    )
    coordinator.last_exception = None

    added = await _setup_sensor(hass, entry, coordinator)

    vlan_sensors = [e for e in added if isinstance(e, UniFiVlanClientsSensor)]
    assert len(vlan_sensors) == 2


async def test_vlan_sensor_state_shows_client_count(
    hass: HomeAssistant,
) -> None:
    entry = build_mock_entry()
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = UniFiNetworkMapData(
        svg="<svg />", payload=_build_payload_with_vlans()
    )
    coordinator.last_exception = None

    added = await _setup_sensor(hass, entry, coordinator)

    vlan_sensors = [e for e in added if isinstance(e, UniFiVlanClientsSensor)]
    iot_sensor = next(s for s in vlan_sensors if s._vlan_id == 10)
    guest_sensor = next(s for s in vlan_sensors if s._vlan_id == 20)

    assert iot_sensor.native_value == 3
    assert guest_sensor.native_value == 2


async def test_vlan_sensor_attributes(
    hass: HomeAssistant,
) -> None:
    entry = build_mock_entry()
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = UniFiNetworkMapData(
        svg="<svg />", payload=_build_payload_with_vlans()
    )
    coordinator.last_exception = None

    added = await _setup_sensor(hass, entry, coordinator)

    vlan_sensors = [e for e in added if isinstance(e, UniFiVlanClientsSensor)]
    iot_sensor = next(s for s in vlan_sensors if s._vlan_id == 10)

    attrs = iot_sensor.extra_state_attributes
    assert attrs["vlan_id"] == 10
    assert attrs["vlan_name"] == "IoT"
    assert attrs["clients"] == [
        "Sonos Speaker",
        "Hue Bridge",
        "Smart TV",
    ]


async def test_vlan_sensor_unique_id_format(
    hass: HomeAssistant,
) -> None:
    entry = build_mock_entry()
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = UniFiNetworkMapData(
        svg="<svg />", payload=_build_payload_with_vlans()
    )
    coordinator.last_exception = None

    added = await _setup_sensor(hass, entry, coordinator)

    vlan_sensors = [e for e in added if isinstance(e, UniFiVlanClientsSensor)]
    iot_sensor = next(s for s in vlan_sensors if s._vlan_id == 10)

    assert iot_sensor.unique_id == f"{entry.entry_id}_vlan_10_clients"


async def test_no_vlan_sensors_when_vlan_info_empty(
    hass: HomeAssistant,
) -> None:
    entry = build_mock_entry()
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = UniFiNetworkMapData(
        svg="<svg />", payload={"vlan_info": {}}
    )
    coordinator.last_exception = None

    added = await _setup_sensor(hass, entry, coordinator)

    vlan_sensors = [e for e in added if isinstance(e, UniFiVlanClientsSensor)]
    assert len(vlan_sensors) == 0


async def test_no_vlan_sensors_when_no_data(
    hass: HomeAssistant,
) -> None:
    entry = build_mock_entry()
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = None
    coordinator.last_exception = None

    added = await _setup_sensor(hass, entry, coordinator)

    vlan_sensors = [e for e in added if isinstance(e, UniFiVlanClientsSensor)]
    assert len(vlan_sensors) == 0


async def test_sensor_unavailable_state(
    hass: HomeAssistant,
) -> None:
    """Sensor returns 'unavailable' when both are None."""
    entry = build_mock_entry()
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = None
    coordinator.last_exception = None

    added = await _setup_sensor(hass, entry, coordinator)

    entity = added[0]
    assert entity.native_value == "unavailable"


async def test_vlan_sensor_returns_zero_when_data_cleared(
    hass: HomeAssistant,
) -> None:
    """VLAN sensor returns 0 when coordinator data is cleared after setup."""
    entry = build_mock_entry()
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = UniFiNetworkMapData(
        svg="<svg />", payload=_build_payload_with_vlans()
    )
    coordinator.last_exception = None

    added = await _setup_sensor(hass, entry, coordinator)

    vlan_sensors = [e for e in added if isinstance(e, UniFiVlanClientsSensor)]
    assert len(vlan_sensors) == 2

    # Clear coordinator data to simulate lost connection
    coordinator.data = None

    for vlan_sensor in vlan_sensors:
        assert vlan_sensor.native_value == 0
        assert vlan_sensor._get_vlan_info() is None

    await coordinator.async_shutdown()
