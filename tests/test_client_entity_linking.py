from __future__ import annotations

from dataclasses import dataclass

from pytest import MonkeyPatch

from custom_components.unifi_network_map import http as http_module


class _FakeConfigEntries:
    def __init__(self, domains: set[str]) -> None:
        self._domains = domains

    def async_entries(self, domain: str):
        return [object()] if domain in self._domains else []


class _FakeHass:
    def __init__(self, domains: set[str]) -> None:
        self.config_entries = _FakeConfigEntries(domains)
        self.states = _FakeStates({})


class _FakeStates:
    def __init__(self, states: dict[str, object]) -> None:
        self._states = states

    def get(self, entity_id: str):
        return self._states.get(entity_id)


@dataclass
class _FakeEntry:
    entity_id: str
    unique_id: str | None = None
    device_id: str | None = None


@dataclass
class _FakeDevice:
    identifiers: set[tuple[str, str]]
    connections: set[tuple[str, str]]


class _FakeDeviceRegistry:
    def __init__(self, devices: dict[str, _FakeDevice]) -> None:
        self._devices = devices

    def async_get(self, device_id: str):
        return self._devices.get(device_id)


def test_resolve_client_entities_happy_path(monkeypatch: MonkeyPatch) -> None:
    hass = _FakeHass({"unifi"})
    client_macs = {"iPad": "AA:BB:CC:DD:EE:FF"}
    monkeypatch.setattr(
        http_module,
        "_build_mac_entity_index",
        _fake_entity_index({"aa:bb:cc:dd:ee:ff": "sensor.unifi_client_ipad"}),
    )

    result = http_module.resolve_client_entity_map(hass, client_macs)

    assert result == {"iPad": "sensor.unifi_client_ipad"}


def test_resolve_client_entities_unifi_missing(monkeypatch: MonkeyPatch) -> None:
    hass = _FakeHass(set())
    monkeypatch.setattr(
        http_module,
        "_build_mac_entity_index",
        _fake_entity_index({"aa:bb:cc:dd:ee:ff": "sensor.unifi_client_ipad"}),
    )

    result = http_module.resolve_client_entity_map(hass, {"iPad": "AA:BB:CC:DD:EE:FF"})

    assert result == {}


def test_resolve_client_entities_no_match(monkeypatch: MonkeyPatch) -> None:
    hass = _FakeHass({"unifi"})
    monkeypatch.setattr(http_module, "_build_mac_entity_index", _fake_entity_index({}))

    result = http_module.resolve_client_entity_map(hass, {"iPad": "AA:BB:CC:DD:EE:FF"})

    assert result == {}


def test_mac_from_unique_id() -> None:
    hass = _FakeHass(set())
    entry = _FakeEntry(entity_id="sensor.unifi_client_ipad", unique_id="client_001122334455")
    device_registry = _FakeDeviceRegistry({})

    result = http_module.mac_from_entity_entry(hass, entry, device_registry)

    assert result == "00:11:22:33:44:55"


def test_mac_from_device_identifier() -> None:
    hass = _FakeHass(set())
    entry = _FakeEntry(entity_id="sensor.unifi_client_ipad", device_id="device-1")
    device = _FakeDevice(identifiers={("unifi", "AA-BB-CC-DD-EE-FF")}, connections=set())
    device_registry = _FakeDeviceRegistry({"device-1": device})

    result = http_module.mac_from_entity_entry(hass, entry, device_registry)

    assert result == "aa:bb:cc:dd:ee:ff"


def test_mac_from_state_attribute() -> None:
    state = type("State", (), {"attributes": {"mac_address": "AA:BB:CC:DD:EE:FF"}})()
    hass = _FakeHass(set())
    hass.states = _FakeStates({"sensor.unifi_client_ipad": state})
    entry = _FakeEntry(entity_id="sensor.unifi_client_ipad")
    device_registry = _FakeDeviceRegistry({})

    result = http_module.mac_from_entity_entry(hass, entry, device_registry)

    assert result == "aa:bb:cc:dd:ee:ff"


def _fake_entity_index(mapping: dict[str, str]):
    def _handler(_hass: object) -> dict[str, str]:
        return mapping

    return _handler
