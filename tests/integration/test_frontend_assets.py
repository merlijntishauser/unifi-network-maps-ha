from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING, cast

import custom_components.unifi_network_map as unifi_network_map

if TYPE_CHECKING:
    from collections.abc import Callable

    import pytest


class _FakeHttp:
    def __init__(self) -> None:
        self.registered: list[dict[str, object]] = []

    def async_register_static_paths(self, paths) -> None:
        for path in paths:
            self.registered.append(
                {
                    "path": path.url_path,
                    "file_path": path.path,
                    "cache_headers": path.cache_headers,
                }
            )


class _FakeHass:
    def __init__(self) -> None:
        self.data: dict[str, object] = {}
        self.http = _FakeHttp()
        self.is_running = True

    def async_create_task(self, _coro) -> None:
        if hasattr(_coro, "close"):
            _coro.close()
        return None


def test_register_frontend_assets_with_async_static_paths(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    hass = _FakeHass()
    hass.data["unifi_network_map"] = {}
    notifications: list[object] = []
    monkeypatch.setattr(
        unifi_network_map.persistent_notification,
        "async_create",
        lambda *args, **kwargs: notifications.append((args, kwargs)),
    )
    register = getattr(unifi_network_map, "_register_frontend_assets")
    register(hass)
    assert notifications, "Expected the install notification to be created"
    assert hass.http.registered, (
        "Expected static path registration to be called"
    )
    entry = hass.http.registered[0]
    assert entry["path"] == "/unifi-network-map/unifi-network-map.js"
    assert isinstance(entry["file_path"], str)
    assert Path(entry["file_path"]).name == "unifi-network-map.js"


def test_register_frontend_assets_warns_when_bundle_missing(
    tmp_path: Path, caplog: pytest.LogCaptureFixture
) -> None:
    hass = _FakeHass()
    hass.data["unifi_network_map"] = {}
    missing_path = tmp_path / "missing.js"
    monkeypatch_frontend_path = cast(
        "Callable[[], Path]",
        getattr(unifi_network_map, "_frontend_bundle_path"),
    )

    def _fake_frontend_bundle_path() -> Path:
        return missing_path

    caplog.set_level("WARNING")
    setattr(
        unifi_network_map, "_frontend_bundle_path", _fake_frontend_bundle_path
    )
    try:
        register = getattr(unifi_network_map, "_register_frontend_assets")
        register(hass)
    finally:
        setattr(
            unifi_network_map,
            "_frontend_bundle_path",
            monkeypatch_frontend_path,
        )

    assert "frontend_bundle_missing" in caplog.text
    assert not hass.data.get("unifi_network_map", {}).get(
        "frontend_registered"
    )


def test_register_frontend_assets_skips_when_already_registered() -> None:
    hass = _FakeHass()
    hass.data["unifi_network_map"] = {"frontend_registered": True}

    register = getattr(unifi_network_map, "_register_frontend_assets")
    register(hass)

    assert not hass.http.registered
