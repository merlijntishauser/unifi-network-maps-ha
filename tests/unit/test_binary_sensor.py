from __future__ import annotations

from typing import Any

from custom_components.unifi_network_map.binary_sensor import (
    UniFiDevicePresenceSensor,
    _normalize_name,
)
from custom_components.unifi_network_map.coordinator import UniFiNetworkMapCoordinator
from custom_components.unifi_network_map.data import UniFiNetworkMapData
from tests.helpers import build_entry


class FakeHass:
    def __init__(self) -> None:
        self.data: dict[str, object] = {}

    async def async_add_executor_job(self, func, *args: object):
        return func(*args)


def _build_coordinator_with_payload(
    payload: dict[str, Any],
) -> UniFiNetworkMapCoordinator:
    hass = FakeHass()
    entry = build_entry()
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = UniFiNetworkMapData(svg="<svg />", payload=payload)
    coordinator.last_exception = None
    return coordinator


def test_normalize_name_replaces_spaces() -> None:
    assert _normalize_name("Office Switch") == "office_switch"


def test_normalize_name_replaces_dashes() -> None:
    assert _normalize_name("Living-Room-AP") == "living_room_ap"


def test_normalize_name_replaces_dots() -> None:
    assert _normalize_name("switch.local") == "switch_local"


def test_normalize_name_handles_mixed() -> None:
    assert _normalize_name("Office Switch-1.local") == "office_switch_1_local"


def test_device_presence_is_on_when_in_topology() -> None:
    payload = {
        "node_types": {"Office Switch": "switch"},
        "device_details": {"Office Switch": {"mac": "aa:bb:cc:dd:ee:ff"}},
    }
    coordinator = _build_coordinator_with_payload(payload)
    entry = build_entry()

    sensor = UniFiDevicePresenceSensor(
        coordinator=coordinator,
        entry=entry,
        device_name="Office Switch",
        device_type="switch",
        device_details={"mac": "aa:bb:cc:dd:ee:ff"},
    )

    assert sensor.is_on is True


def test_device_presence_is_off_when_missing_from_topology() -> None:
    payload = {
        "node_types": {},
        "device_details": {},
    }
    coordinator = _build_coordinator_with_payload(payload)
    entry = build_entry()

    sensor = UniFiDevicePresenceSensor(
        coordinator=coordinator,
        entry=entry,
        device_name="Office Switch",
        device_type="switch",
        device_details={"mac": "aa:bb:cc:dd:ee:ff"},
    )

    assert sensor.is_on is False


def test_device_presence_is_off_when_no_data() -> None:
    hass = FakeHass()
    entry = build_entry()
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    coordinator.data = None

    sensor = UniFiDevicePresenceSensor(
        coordinator=coordinator,
        entry=entry,
        device_name="Office Switch",
        device_type="switch",
        device_details={"mac": "aa:bb:cc:dd:ee:ff"},
    )

    assert sensor.is_on is False


def test_device_presence_attributes_include_device_type() -> None:
    payload = {
        "node_types": {"Office Switch": "switch"},
        "device_details": {
            "Office Switch": {
                "mac": "aa:bb:cc:dd:ee:ff",
                "ip": "192.168.1.10",
                "model": "USW-24-PoE",
                "uplink_device": "Dream Machine",
            }
        },
    }
    coordinator = _build_coordinator_with_payload(payload)
    entry = build_entry()

    sensor = UniFiDevicePresenceSensor(
        coordinator=coordinator,
        entry=entry,
        device_name="Office Switch",
        device_type="switch",
        device_details=payload["device_details"]["Office Switch"],
    )

    attrs = sensor.extra_state_attributes
    assert attrs["device_type"] == "switch"
    assert attrs["mac"] == "aa:bb:cc:dd:ee:ff"
    assert attrs["ip"] == "192.168.1.10"
    assert attrs["model"] == "USW-24-PoE"
    assert attrs["uplink_device"] == "Dream Machine"


def test_device_presence_attributes_omit_none_values() -> None:
    payload = {
        "node_types": {"Office Switch": "switch"},
        "device_details": {
            "Office Switch": {
                "mac": "aa:bb:cc:dd:ee:ff",
                "ip": None,
                "model": None,
                "uplink_device": None,
            }
        },
    }
    coordinator = _build_coordinator_with_payload(payload)
    entry = build_entry()

    sensor = UniFiDevicePresenceSensor(
        coordinator=coordinator,
        entry=entry,
        device_name="Office Switch",
        device_type="switch",
        device_details=payload["device_details"]["Office Switch"],
    )

    attrs = sensor.extra_state_attributes
    assert "ip" not in attrs
    assert "model" not in attrs
    assert "uplink_device" not in attrs


def test_ap_includes_clients_connected_attribute() -> None:
    payload = {
        "node_types": {"Living Room AP": "ap"},
        "device_details": {
            "Living Room AP": {
                "mac": "11:22:33:44:55:66",
                "ip": "192.168.1.20",
                "model": "U6-LR",
            }
        },
        "ap_client_counts": {"Living Room AP": 5},
    }
    coordinator = _build_coordinator_with_payload(payload)
    entry = build_entry()

    sensor = UniFiDevicePresenceSensor(
        coordinator=coordinator,
        entry=entry,
        device_name="Living Room AP",
        device_type="ap",
        device_details=payload["device_details"]["Living Room AP"],
    )

    attrs = sensor.extra_state_attributes
    assert attrs["clients_connected"] == 5


def test_ap_clients_connected_defaults_to_zero() -> None:
    payload = {
        "node_types": {"Living Room AP": "ap"},
        "device_details": {"Living Room AP": {"mac": "11:22:33:44:55:66"}},
        "ap_client_counts": {},
    }
    coordinator = _build_coordinator_with_payload(payload)
    entry = build_entry()

    sensor = UniFiDevicePresenceSensor(
        coordinator=coordinator,
        entry=entry,
        device_name="Living Room AP",
        device_type="ap",
        device_details=payload["device_details"]["Living Room AP"],
    )

    attrs = sensor.extra_state_attributes
    assert attrs["clients_connected"] == 0


def test_switch_does_not_include_clients_connected() -> None:
    payload = {
        "node_types": {"Office Switch": "switch"},
        "device_details": {"Office Switch": {"mac": "aa:bb:cc:dd:ee:ff"}},
        "ap_client_counts": {},
    }
    coordinator = _build_coordinator_with_payload(payload)
    entry = build_entry()

    sensor = UniFiDevicePresenceSensor(
        coordinator=coordinator,
        entry=entry,
        device_name="Office Switch",
        device_type="switch",
        device_details=payload["device_details"]["Office Switch"],
    )

    attrs = sensor.extra_state_attributes
    assert "clients_connected" not in attrs


def test_unique_id_format() -> None:
    coordinator = _build_coordinator_with_payload({})
    entry = build_entry()

    sensor = UniFiDevicePresenceSensor(
        coordinator=coordinator,
        entry=entry,
        device_name="Office Switch",
        device_type="switch",
        device_details={},
    )

    assert sensor.unique_id == f"{entry.entry_id}_device_office_switch"


def test_device_uses_current_details_from_coordinator() -> None:
    initial_payload = {
        "node_types": {"Office Switch": "switch"},
        "device_details": {"Office Switch": {"ip": "192.168.1.10"}},
    }
    coordinator = _build_coordinator_with_payload(initial_payload)
    entry = build_entry()

    sensor = UniFiDevicePresenceSensor(
        coordinator=coordinator,
        entry=entry,
        device_name="Office Switch",
        device_type="switch",
        device_details={"ip": "192.168.1.10"},
    )

    # Initial IP
    assert sensor.extra_state_attributes["ip"] == "192.168.1.10"

    # Simulate coordinator update with new IP
    updated_payload = {
        "node_types": {"Office Switch": "switch"},
        "device_details": {"Office Switch": {"ip": "192.168.1.99"}},
    }
    coordinator.data = UniFiNetworkMapData(svg="<svg />", payload=updated_payload)

    # Should use new IP from coordinator
    assert sensor.extra_state_attributes["ip"] == "192.168.1.99"
