from __future__ import annotations

from pathlib import Path

import custom_components.unifi_network_map as unifi_network_map


class _FakeHttp:
    def __init__(self) -> None:
        self.registered: list[dict[str, object]] = []

    def async_register_static_paths(self, paths: list[dict[str, object]]) -> None:
        self.registered.extend(paths)


class _FakeHass:
    def __init__(self) -> None:
        self.data: dict[str, object] = {}
        self.http = _FakeHttp()
        self.is_running = True

    def async_create_task(self, _coro) -> None:
        if hasattr(_coro, "close"):
            _coro.close()
        return None


def test_register_frontend_assets_with_async_static_paths() -> None:
    hass = _FakeHass()
    register = getattr(unifi_network_map, "_register_frontend_assets")
    register(hass)
    assert hass.http.registered, "Expected static path registration to be called"
    entry = hass.http.registered[0]
    assert entry["path"] == "/unifi-network-map/unifi-network-map.js"
    assert isinstance(entry["file_path"], str)
    assert Path(entry["file_path"]).name == "unifi-network-map.js"
