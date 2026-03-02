from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.unifi_network_map import binary_sensor
from custom_components.unifi_network_map.binary_sensor import (
    UniFiClientPresenceSensor,
    UniFiDevicePresenceSensor,
)
from custom_components.unifi_network_map.coordinator import (
    UniFiNetworkMapCoordinator,
)
from custom_components.unifi_network_map.data import UniFiNetworkMapData
from tests.integration.conftest import build_mock_entry


async def _setup_binary_sensor(
    hass: HomeAssistant,
    entry: MockConfigEntry,
    coordinator: UniFiNetworkMapCoordinator,
) -> list[object]:
    """Set up binary sensor entities and shut down coordinator."""
    entry.runtime_data = coordinator
    added: list[object] = []
    await binary_sensor.async_setup_entry(
        hass, entry, lambda entities: added.extend(entities)
    )
    await coordinator.async_shutdown()
    return added


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


async def test_setup_creates_entities_for_devices(
    hass: HomeAssistant,
) -> None:
    entry = build_mock_entry()
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = UniFiNetworkMapData(
        svg="<svg />",
        payload=_build_payload_with_devices(),
    )
    coordinator.last_exception = None

    added = await _setup_binary_sensor(hass, entry, coordinator)

    assert len(added) == 3
    names = {e.name for e in added}
    assert names == {
        "Dream Machine Pro",
        "Office Switch",
        "Living Room AP",
    }


async def test_setup_excludes_client_and_other_types(
    hass: HomeAssistant,
) -> None:
    entry = build_mock_entry()
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = UniFiNetworkMapData(
        svg="<svg />",
        payload=_build_payload_with_devices(),
    )
    coordinator.last_exception = None

    added = await _setup_binary_sensor(hass, entry, coordinator)

    types = {e._device_type for e in added}
    assert "client" not in types
    assert "other" not in types


async def test_setup_creates_no_entities_when_no_data(
    hass: HomeAssistant,
) -> None:
    entry = build_mock_entry()
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = None
    coordinator.last_exception = None

    added = await _setup_binary_sensor(hass, entry, coordinator)

    assert added == []


async def test_setup_creates_no_entities_when_empty_payload(
    hass: HomeAssistant,
) -> None:
    entry = build_mock_entry()
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = UniFiNetworkMapData(svg="<svg />", payload={})
    coordinator.last_exception = None

    added = await _setup_binary_sensor(hass, entry, coordinator)

    assert added == []


async def test_entities_link_to_parent_device(
    hass: HomeAssistant,
) -> None:
    entry = build_mock_entry()
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = UniFiNetworkMapData(
        svg="<svg />",
        payload=_build_payload_with_devices(),
    )
    coordinator.last_exception = None

    added = await _setup_binary_sensor(hass, entry, coordinator)

    for entity in added:
        device_info = entity.device_info
        assert device_info is not None
        assert (
            "unifi_network_map",
            entry.entry_id,
        ) in device_info["identifiers"]


async def test_entities_have_connectivity_device_class(
    hass: HomeAssistant,
) -> None:
    entry = build_mock_entry()
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = UniFiNetworkMapData(
        svg="<svg />",
        payload=_build_payload_with_devices(),
    )
    coordinator.last_exception = None

    added = await _setup_binary_sensor(hass, entry, coordinator)

    from homeassistant.components.binary_sensor import (
        BinarySensorDeviceClass,
    )

    for entity in added:
        assert entity.device_class == BinarySensorDeviceClass.CONNECTIVITY


# --- Client Presence Sensor Integration Tests ---


def _build_payload_with_clients() -> dict[str, Any]:
    return {
        "node_types": {"Dream Machine Pro": "gateway"},
        "device_details": {
            "Dream Machine Pro": {
                "mac": "00:00:00:00:00:01",
            }
        },
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


async def test_setup_creates_client_entities_from_tracked_macs(
    hass: HomeAssistant,
) -> None:
    entry = build_mock_entry(
        options={"tracked_clients": ("aa:bb:cc:dd:ee:ff\n11:22:33:44:55:66")}
    )
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = UniFiNetworkMapData(
        svg="<svg />",
        payload=_build_payload_with_clients(),
    )
    coordinator.last_exception = None

    added = await _setup_binary_sensor(hass, entry, coordinator)

    device_sensors = [
        e for e in added if isinstance(e, UniFiDevicePresenceSensor)
    ]
    client_sensors = [
        e for e in added if isinstance(e, UniFiClientPresenceSensor)
    ]

    assert len(device_sensors) == 1
    assert len(client_sensors) == 2


async def test_setup_skips_clients_when_no_tracked_macs(
    hass: HomeAssistant,
) -> None:
    entry = build_mock_entry()
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = UniFiNetworkMapData(
        svg="<svg />",
        payload=_build_payload_with_clients(),
    )
    coordinator.last_exception = None

    added = await _setup_binary_sensor(hass, entry, coordinator)

    client_sensors = [
        e for e in added if isinstance(e, UniFiClientPresenceSensor)
    ]
    assert len(client_sensors) == 0


async def test_client_entities_have_connectivity_device_class(
    hass: HomeAssistant,
) -> None:
    entry = build_mock_entry(options={"tracked_clients": "aa:bb:cc:dd:ee:ff"})
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = UniFiNetworkMapData(
        svg="<svg />",
        payload=_build_payload_with_clients(),
    )
    coordinator.last_exception = None

    added = await _setup_binary_sensor(hass, entry, coordinator)

    from homeassistant.components.binary_sensor import (
        BinarySensorDeviceClass,
    )

    client_sensors = [
        e for e in added if isinstance(e, UniFiClientPresenceSensor)
    ]
    assert len(client_sensors) == 1
    for entity in client_sensors:
        assert entity.device_class == BinarySensorDeviceClass.CONNECTIVITY


async def test_client_entities_link_to_parent_device(
    hass: HomeAssistant,
) -> None:
    entry = build_mock_entry(options={"tracked_clients": "aa:bb:cc:dd:ee:ff"})
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = UniFiNetworkMapData(
        svg="<svg />",
        payload=_build_payload_with_clients(),
    )
    coordinator.last_exception = None

    added = await _setup_binary_sensor(hass, entry, coordinator)

    client_sensors = [
        e for e in added if isinstance(e, UniFiClientPresenceSensor)
    ]
    for entity in client_sensors:
        device_info = entity.device_info
        assert device_info is not None
        assert (
            "unifi_network_map",
            entry.entry_id,
        ) in device_info["identifiers"]


async def test_setup_skips_invalid_macs_in_tracked_clients(
    hass: HomeAssistant,
) -> None:
    entry = build_mock_entry(
        options={
            "tracked_clients": (
                "aa:bb:cc:dd:ee:ff\ninvalid_mac\n11:22:33:44:55:66"
            )
        }
    )
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = UniFiNetworkMapData(
        svg="<svg />",
        payload=_build_payload_with_clients(),
    )
    coordinator.last_exception = None

    added = await _setup_binary_sensor(hass, entry, coordinator)

    client_sensors = [
        e for e in added if isinstance(e, UniFiClientPresenceSensor)
    ]
    assert len(client_sensors) == 2


# --- Migration Tests ---


async def test_migration_skips_when_mac_empty(
    hass: HomeAssistant,
) -> None:
    """Migration skips devices with empty MAC addresses."""
    entry = build_mock_entry()
    payload: dict[str, Any] = {
        "node_types": {"No-MAC Switch": "switch"},
        "device_details": {
            "No-MAC Switch": {
                "mac": "",
                "ip": "192.168.1.10",
            }
        },
    }
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = UniFiNetworkMapData(svg="<svg />", payload=payload)
    coordinator.last_exception = None

    added = await _setup_binary_sensor(hass, entry, coordinator)

    device_sensors = [
        e for e in added if isinstance(e, UniFiDevicePresenceSensor)
    ]
    # Entity should still be created (using normalized name)
    assert len(device_sensors) == 1


async def test_migration_skips_when_mac_matches_normalized_name(
    hass: HomeAssistant,
) -> None:
    """Migration skips when old_suffix == new_suffix."""
    entry = build_mock_entry()
    # Device name is the hex form of its MAC, so normalized
    # name equals mac.lower().replace(":", "")
    payload: dict[str, Any] = {
        "node_types": {"aabbccddeeff": "gateway"},
        "device_details": {
            "aabbccddeeff": {
                "mac": "aa:bb:cc:dd:ee:ff",
                "ip": "10.0.0.1",
            }
        },
    }
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = UniFiNetworkMapData(svg="<svg />", payload=payload)
    coordinator.last_exception = None

    added = await _setup_binary_sensor(hass, entry, coordinator)

    device_sensors = [
        e for e in added if isinstance(e, UniFiDevicePresenceSensor)
    ]
    assert len(device_sensors) == 1
    assert device_sensors[0].is_on is True


# --- Client Sensor Property Tests ---


async def test_client_sensor_attributes_when_disconnected(
    hass: HomeAssistant,
) -> None:
    """Client sensor returns minimal attrs when disconnected."""
    entry = build_mock_entry(options={"tracked_clients": "aa:bb:cc:dd:ee:ff"})
    # Payload has no client_details for the tracked MAC
    payload: dict[str, Any] = {
        "node_types": {"Gateway": "gateway"},
        "device_details": {"Gateway": {"mac": "00:00:00:00:00:01"}},
        "client_details": {},
    }
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = UniFiNetworkMapData(svg="<svg />", payload=payload)
    coordinator.last_exception = None

    added = await _setup_binary_sensor(hass, entry, coordinator)

    client_sensors = [
        e for e in added if isinstance(e, UniFiClientPresenceSensor)
    ]
    assert len(client_sensors) == 1
    sensor = client_sensors[0]

    assert sensor.is_on is False
    attrs = sensor.extra_state_attributes
    assert attrs == {"mac": "aa:bb:cc:dd:ee:ff"}


async def test_client_sensor_is_off_when_no_data(
    hass: HomeAssistant,
) -> None:
    """Client sensor is off when coordinator has no data."""
    entry = build_mock_entry(options={"tracked_clients": "aa:bb:cc:dd:ee:ff"})
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    # Start with data so entities get created
    coordinator.data = UniFiNetworkMapData(
        svg="<svg />",
        payload=_build_payload_with_clients(),
    )
    coordinator.last_exception = None

    added = await _setup_binary_sensor(hass, entry, coordinator)

    client_sensors = [
        e for e in added if isinstance(e, UniFiClientPresenceSensor)
    ]
    assert len(client_sensors) == 1
    sensor = client_sensors[0]

    # Clear data to simulate lost connection
    coordinator.data = None

    assert sensor.is_on is False
    assert sensor._get_client_details() is None
    # Name falls back to MAC when no data
    assert sensor.name == "aa:bb:cc:dd:ee:ff"
    # Attributes should only contain mac
    attrs = sensor.extra_state_attributes
    assert attrs == {"mac": "aa:bb:cc:dd:ee:ff"}

    await coordinator.async_shutdown()
