from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
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
