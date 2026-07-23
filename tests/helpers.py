from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime
from types import SimpleNamespace

from custom_components.unifi_network_map.renderer import RenderSettings


@dataclass
class FakeEntry:
    entry_id: str
    title: str
    data: dict[str, object]
    options: dict[str, object]
    runtime_data: object = None

    def async_on_unload(self, callback: object) -> None:
        """Mock async_on_unload - does nothing in tests."""
        pass


def build_entry(options: dict[str, object] | None = None) -> FakeEntry:
    return FakeEntry(
        entry_id="entry-1",
        title="Controller",
        data={
            "url": "https://controller.local",
            "username": "user",
            "password": "pass",
            "site": "default",
        },
        options=options or {},
    )


class FakeBus:
    def __init__(self) -> None:
        self.listeners: dict[str, list[Callable[..., None]]] = {}

    def async_listen(
        self,
        event_type: str,
        callback: Callable[..., None],
    ) -> Callable[[], None]:
        if event_type not in self.listeners:
            self.listeners[event_type] = []
        self.listeners[event_type].append(callback)

        def unsub() -> None:
            if (
                event_type in self.listeners
                and callback in self.listeners[event_type]
            ):
                self.listeners[event_type].remove(callback)

        return unsub

    def fire(self, event_type: str, data: dict[str, str]) -> None:
        event = SimpleNamespace(data=data)
        for listener in self.listeners.get(event_type, []):
            listener(event)


def build_settings(
    *,
    include_ports: bool = False,
    include_clients: bool = False,
    client_scope: str = "wired",
    only_unifi: bool = False,
    svg_isometric: bool = False,
    svg_width: int | None = None,
    svg_height: int | None = None,
    use_cache: bool = False,
) -> RenderSettings:
    return RenderSettings(
        include_ports=include_ports,
        include_clients=include_clients,
        client_scope=client_scope,
        only_unifi=only_unifi,
        svg_isometric=svg_isometric,
        svg_width=svg_width,
        svg_height=svg_height,
        use_cache=use_cache,
    )


@dataclass
class FakeState:
    entity_id: str
    state: str
    attributes: dict[str, object]
    last_changed: datetime | None


class FakeStates:
    def __init__(self, states: dict[str, FakeState]) -> None:
        self._states = states

    def get(self, entity_id: str) -> FakeState | None:
        return self._states.get(entity_id)


class FakeHass:
    def __init__(self, states: dict[str, FakeState]) -> None:
        self.states = FakeStates(states)


class FakeHttp:
    def __init__(self) -> None:
        self.views: list[object] = []

    def register_view(self, view: object) -> None:
        self.views.append(view)


class FakeConfigEntries:
    def __init__(self, entries: list[object]) -> None:
        self.entries = entries
        self.entries_by_id: dict[str, object] = {}

    def async_entries(self, _domain: str) -> list[object]:
        return self.entries

    def async_get_entry(self, entry_id: str) -> object | None:
        return self.entries_by_id.get(entry_id)


class FakeHassWithHttp(FakeHass):
    def __init__(self, states: dict[str, FakeState]) -> None:
        super().__init__(states)
        self.http = FakeHttp()
        self.data: dict[str, object] = {}
        self.config_entries = FakeConfigEntries([])
        self.bus = FakeBus()

    async def async_add_executor_job(self, func, *args: object):
        return func(*args)


@dataclass
class FakeCoordinator:
    settings: RenderSettings


@dataclass
class FakeEntityEntry:
    entity_id: str
    unique_id: str | None = None
    device_id: str | None = None
    platform: str | None = None
    disabled_by: str | None = None


@dataclass
class FakeDevice:
    identifiers: set[tuple[str, str]]
    connections: set[tuple[str, str]]


class FakeDeviceRegistry:
    def __init__(self, devices: dict[str, FakeDevice]) -> None:
        self._devices = devices

    def async_get(self, device_id: str) -> FakeDevice | None:
        return self._devices.get(device_id)


class FakeEntityRegistry:
    def __init__(self, entries: dict[str, FakeEntityEntry]) -> None:
        self.entities = entries
