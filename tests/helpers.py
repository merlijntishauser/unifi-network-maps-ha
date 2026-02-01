from __future__ import annotations

from dataclasses import dataclass

from custom_components.unifi_network_map.renderer import RenderSettings


@dataclass
class FakeEntry:
    entry_id: str
    title: str
    data: dict[str, object]
    options: dict[str, object]

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
