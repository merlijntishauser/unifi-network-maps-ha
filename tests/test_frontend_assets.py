from __future__ import annotations

from pathlib import Path
from typing import Callable, cast

import pytest

import custom_components.unifi_network_map as unifi_network_map


class _FakeHttp:
    def __init__(self) -> None:
        self.registered: list[dict[str, object]] = []

    def async_register_static_paths(self, paths) -> None:
        for path in paths:
            if hasattr(path, "url_path"):
                self.registered.append(
                    {
                        "path": path.url_path,
                        "file_path": getattr(path, "file_path", path.path),
                        "cache_headers": path.cache_headers,
                    }
                )
            else:
                self.registered.append(path)


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


def test_register_frontend_assets_warns_when_bundle_missing(
    tmp_path: Path, caplog: pytest.LogCaptureFixture
) -> None:
    hass = _FakeHass()
    missing_path = tmp_path / "missing.js"
    monkeypatch_frontend_path = cast(
        Callable[[], Path], getattr(unifi_network_map, "_frontend_bundle_path")
    )

    def _fake_frontend_bundle_path() -> Path:
        return missing_path

    caplog.set_level("WARNING")
    setattr(unifi_network_map, "_frontend_bundle_path", _fake_frontend_bundle_path)
    try:
        register = getattr(unifi_network_map, "_register_frontend_assets")
        register(hass)
    finally:
        setattr(unifi_network_map, "_frontend_bundle_path", monkeypatch_frontend_path)

    assert "Frontend bundle missing" in caplog.text
    assert not hass.data.get("unifi_network_map", {}).get("frontend_registered")


def test_build_static_path_configs_falls_back_to_dict(tmp_path: Path) -> None:
    js_path = tmp_path / "card.js"
    js_path.write_text("test")

    original_make_config = getattr(unifi_network_map, "_make_static_path_config")

    def _make_config(*_args: object, **_kwargs: object) -> object | None:
        return None

    setattr(unifi_network_map, "_make_static_path_config", _make_config)
    try:
        build_configs = cast(
            Callable[[Path], list[object]],
            getattr(unifi_network_map, "_build_static_path_configs"),
        )
        configs = build_configs(js_path)
    finally:
        setattr(unifi_network_map, "_make_static_path_config", original_make_config)

    assert isinstance(configs[0], dict)
    assert configs[0]["path"] == "/unifi-network-map/unifi-network-map.js"
