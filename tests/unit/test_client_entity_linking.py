from __future__ import annotations

from dataclasses import dataclass
from typing import Callable

from pytest import MonkeyPatch

from custom_components.unifi_network_map import http as http_module


class _FakeConfigEntries:
    def __init__(self, domains: set[str]) -> None:
        self._domains = domains

    def async_entries(self, domain: str):
        return [object()] if domain in self._domains else []


class _FakeBus:
    def __init__(self) -> None:
        self.listeners: dict[str, list[Callable[..., None]]] = {}

    def async_listen(self, event_type: str, callback: Callable[..., None]) -> Callable[[], None]:
        if event_type not in self.listeners:
            self.listeners[event_type] = []
        self.listeners[event_type].append(callback)

        def unsub() -> None:
            if event_type in self.listeners and callback in self.listeners[event_type]:
                self.listeners[event_type].remove(callback)

        return unsub


class _FakeHass:
    def __init__(self, domains: set[str]) -> None:
        self.config_entries = _FakeConfigEntries(domains)
        self.states = _FakeStates({})
        self.data: dict[str, object] = {}
        self.bus = _FakeBus()


class _FakeStates:
    def __init__(self, states: dict[str, object]) -> None:
        self._states = states

    def get(self, entity_id: str):
        return self._states.get(entity_id)

    def async_all(self):
        return list(self._states.values())


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


@dataclass
class _FakeState:
    entity_id: str
    attributes: dict[str, object]


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


def test_resolve_client_entities_empty_payload(monkeypatch: MonkeyPatch) -> None:
    hass = _FakeHass(set())
    monkeypatch.setattr(
        http_module,
        "_build_mac_entity_index",
        _fake_entity_index({"aa:bb:cc:dd:ee:ff": "sensor.unifi_client_ipad"}),
    )

    result = http_module.resolve_client_entity_map(hass, {})

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
    state = _FakeState(
        entity_id="sensor.unifi_client_ipad",
        attributes={"mac_address": "AA:BB:CC:DD:EE:FF"},
    )
    hass = _FakeHass(set())
    hass.states = _FakeStates({"sensor.unifi_client_ipad": state})
    entry = _FakeEntry(entity_id="sensor.unifi_client_ipad")
    device_registry = _FakeDeviceRegistry({})

    result = http_module.mac_from_entity_entry(hass, entry, device_registry)

    assert result == "aa:bb:cc:dd:ee:ff"


def test_resolve_client_entities_from_state(monkeypatch: MonkeyPatch) -> None:
    state = _FakeState(
        entity_id="device_tracker.appletv_4k",
        attributes={"mac": "50:DE:06:76:60:00", "source_type": "router"},
    )
    hass = _FakeHass(set())
    hass.states = _FakeStates({"device_tracker.appletv_4k": state})
    monkeypatch.setattr(http_module, "_iter_unifi_entity_entries", _empty_iter)
    monkeypatch.setattr(http_module.er, "async_get", _fake_async_get)
    monkeypatch.setattr(http_module.dr, "async_get", _fake_async_get)

    result = http_module.resolve_client_entity_map(hass, {"AppleTV 4K": "50:de:06:76:60:00"})

    assert result == {"AppleTV 4K": "device_tracker.appletv_4k"}


def _empty_iter(_hass: object, _registry: object):
    return iter(())


def _fake_async_get(_hass: object) -> object:
    return object()


def _fake_entity_index(mapping: dict[str, str]):
    def _handler(_hass: object) -> dict[str, str]:
        return mapping

    return _handler
