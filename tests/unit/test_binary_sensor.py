from __future__ import annotations

from typing import Any

from custom_components.unifi_network_map.binary_sensor import (
    UniFiClientPresenceSensor,
    UniFiDevicePresenceSensor,
    _normalize_mac,
    _normalize_name,
    _parse_tracked_clients,
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


# --- Client Presence Sensor Tests ---


def test_normalize_mac_colon_separated() -> None:
    assert _normalize_mac("aa:bb:cc:dd:ee:ff") == "aa:bb:cc:dd:ee:ff"


def test_normalize_mac_dash_separated() -> None:
    assert _normalize_mac("AA-BB-CC-DD-EE-FF") == "aa:bb:cc:dd:ee:ff"


def test_normalize_mac_no_separator() -> None:
    assert _normalize_mac("aabbccddeeff") == "aa:bb:cc:dd:ee:ff"


def test_normalize_mac_invalid_length() -> None:
    assert _normalize_mac("aa:bb:cc") is None


def test_normalize_mac_invalid_chars() -> None:
    assert _normalize_mac("gg:hh:ii:jj:kk:ll") is None


def test_normalize_mac_empty() -> None:
    assert _normalize_mac("") is None


def test_parse_tracked_clients_empty() -> None:
    from tests.helpers import FakeEntry

    entry = FakeEntry(entry_id="test", title="Test", data={}, options={})
    assert _parse_tracked_clients(entry) == []


def test_parse_tracked_clients_single_mac() -> None:
    from tests.helpers import FakeEntry

    entry = FakeEntry(
        entry_id="test",
        title="Test",
        data={},
        options={"tracked_clients": "aa:bb:cc:dd:ee:ff"},
    )
    assert _parse_tracked_clients(entry) == ["aa:bb:cc:dd:ee:ff"]


def test_parse_tracked_clients_multiple_macs() -> None:
    from tests.helpers import FakeEntry

    entry = FakeEntry(
        entry_id="test",
        title="Test",
        data={},
        options={"tracked_clients": "aa:bb:cc:dd:ee:ff\n11:22:33:44:55:66"},
    )
    result = _parse_tracked_clients(entry)
    assert result == ["aa:bb:cc:dd:ee:ff", "11:22:33:44:55:66"]


def test_parse_tracked_clients_skips_invalid() -> None:
    from tests.helpers import FakeEntry

    entry = FakeEntry(
        entry_id="test",
        title="Test",
        data={},
        options={"tracked_clients": "aa:bb:cc:dd:ee:ff\ninvalid\n11:22:33:44:55:66"},
    )
    result = _parse_tracked_clients(entry)
    assert result == ["aa:bb:cc:dd:ee:ff", "11:22:33:44:55:66"]


def test_client_presence_is_on_when_connected() -> None:
    payload = {
        "client_details": {
            "aa:bb:cc:dd:ee:ff": {
                "name": "Sonos Speaker",
                "mac": "aa:bb:cc:dd:ee:ff",
                "ip": "192.168.1.50",
            }
        },
    }
    coordinator = _build_coordinator_with_payload(payload)
    entry = build_entry()

    sensor = UniFiClientPresenceSensor(
        coordinator=coordinator,
        entry=entry,
        client_mac="aa:bb:cc:dd:ee:ff",
    )

    assert sensor.is_on is True


def test_client_presence_is_off_when_disconnected() -> None:
    payload = {"client_details": {}}
    coordinator = _build_coordinator_with_payload(payload)
    entry = build_entry()

    sensor = UniFiClientPresenceSensor(
        coordinator=coordinator,
        entry=entry,
        client_mac="aa:bb:cc:dd:ee:ff",
    )

    assert sensor.is_on is False


def test_client_presence_name_from_details() -> None:
    payload = {
        "client_details": {
            "aa:bb:cc:dd:ee:ff": {
                "name": "Sonos Speaker",
                "mac": "aa:bb:cc:dd:ee:ff",
            }
        },
    }
    coordinator = _build_coordinator_with_payload(payload)
    entry = build_entry()

    sensor = UniFiClientPresenceSensor(
        coordinator=coordinator,
        entry=entry,
        client_mac="aa:bb:cc:dd:ee:ff",
    )

    assert sensor.name == "Sonos Speaker"


def test_client_presence_name_fallback_to_mac() -> None:
    payload = {"client_details": {}}
    coordinator = _build_coordinator_with_payload(payload)
    entry = build_entry()

    sensor = UniFiClientPresenceSensor(
        coordinator=coordinator,
        entry=entry,
        client_mac="aa:bb:cc:dd:ee:ff",
    )

    assert sensor.name == "aa:bb:cc:dd:ee:ff"


def test_client_presence_attributes() -> None:
    payload = {
        "client_details": {
            "aa:bb:cc:dd:ee:ff": {
                "name": "Sonos Speaker",
                "mac": "aa:bb:cc:dd:ee:ff",
                "ip": "192.168.10.50",
                "vlan": 10,
                "network": "IoT",
                "is_wired": False,
                "connected_to_mac": "11:22:33:44:55:66",
            }
        },
        "device_macs": {"Living Room AP": "11:22:33:44:55:66"},
    }
    coordinator = _build_coordinator_with_payload(payload)
    entry = build_entry()

    sensor = UniFiClientPresenceSensor(
        coordinator=coordinator,
        entry=entry,
        client_mac="aa:bb:cc:dd:ee:ff",
    )

    attrs = sensor.extra_state_attributes
    assert attrs["mac"] == "aa:bb:cc:dd:ee:ff"
    assert attrs["ip"] == "192.168.10.50"
    assert attrs["vlan"] == 10
    assert attrs["network"] == "IoT"
    assert attrs["connected_to"] == "Living Room AP"
    assert attrs["connection_type"] == "wireless"


def test_client_presence_wired_connection_type() -> None:
    payload = {
        "client_details": {
            "aa:bb:cc:dd:ee:ff": {
                "name": "Desktop PC",
                "mac": "aa:bb:cc:dd:ee:ff",
                "is_wired": True,
            }
        },
    }
    coordinator = _build_coordinator_with_payload(payload)
    entry = build_entry()

    sensor = UniFiClientPresenceSensor(
        coordinator=coordinator,
        entry=entry,
        client_mac="aa:bb:cc:dd:ee:ff",
    )

    attrs = sensor.extra_state_attributes
    assert attrs["connection_type"] == "wired"


def test_client_presence_unique_id_format() -> None:
    coordinator = _build_coordinator_with_payload({})
    entry = build_entry()

    sensor = UniFiClientPresenceSensor(
        coordinator=coordinator,
        entry=entry,
        client_mac="aa:bb:cc:dd:ee:ff",
    )

    assert sensor.unique_id == f"{entry.entry_id}_client_aabbccddeeff"
