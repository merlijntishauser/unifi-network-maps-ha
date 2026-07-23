from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import TYPE_CHECKING, cast

import pytest
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import HomeAssistantError

import custom_components.unifi_network_map as init_module
from custom_components.unifi_network_map.coordinator import (
    UniFiNetworkMapCoordinator,
)

if TYPE_CHECKING:
    from collections.abc import Callable, Coroutine


@dataclass
class FakeEntry:
    entry_id: str
    data: dict[str, object]
    options: dict[str, object]
    runtime_data: object = None

    def add_update_listener(
        self, _callback: Callable[..., object]
    ) -> Callable[[], None]:
        """Mock add_update_listener that returns a no-op removal function."""
        return lambda: None

    def async_on_unload(self, _func: Callable[[], None]) -> None:
        """Mock async_on_unload that does nothing."""
        pass


class FakeServices:
    def __init__(self) -> None:
        self.registered = []

    def async_register(
        self, domain: str, service: str, handler, schema=None
    ) -> None:
        self.registered.append((domain, service, handler, schema))


class FakeBus:
    def async_listen_once(self, _event_type: str, _callback) -> None:
        return None


class FakeHass:
    def __init__(self) -> None:
        self.data: dict[str, object] = {}
        self.services = FakeServices()
        self.bus = FakeBus()
        self.is_running = True
        self.http = _FakeHttp()
        self.created_tasks: list[object] = []
        self.config_entries = _FakeConfigEntries()

    async def async_add_executor_job(self, func, *args: object):
        return func(*args)

    def async_create_task(self, coro: object) -> None:
        self.created_tasks.append(coro)
        if hasattr(coro, "close"):
            coro.close()


class _FakeHttp:
    def __init__(self) -> None:
        self.registered: list[dict[str, object]] = []

    def async_register_static_paths(self, paths: list[object]):
        async def _noop() -> None:
            return None

        self.registered.append({"paths": paths})
        return _noop()


class _FakeConfigEntries:
    def __init__(self) -> None:
        self.forwarded: list[tuple[object, list[str]]] = []
        self.unloaded: list[tuple[object, list[str]]] = []
        self.entries: list[FakeEntry] = []

    async def async_forward_entry_setups(
        self, entry: object, platforms: list[str]
    ) -> None:
        self.forwarded.append((entry, list(platforms)))

    async def async_unload_platforms(
        self, entry: object, platforms: list[str]
    ) -> bool:
        self.unloaded.append((entry, list(platforms)))
        return True

    def async_entries(self, domain: str) -> list[FakeEntry]:
        return [e for e in self.entries if True]


def _make_service_call(data: dict[str, object]) -> ServiceCall:
    """Create a ServiceCall with the required positional args."""
    from types import SimpleNamespace

    fake_hass = SimpleNamespace()
    return ServiceCall(fake_hass, "unifi_network_map", "refresh", data)


def _build_entry(entry_id: str) -> FakeEntry:
    return FakeEntry(
        entry_id=entry_id,
        data={
            "url": "https://controller.local",
            "username": "user",
            "password": "pass",
            "site": "default",
        },
        options={},
    )


async def test_async_setup_entry_stores_coordinator() -> None:
    hass = FakeHass()
    entry = _build_entry("entry-1")

    class FakeCoordinator:
        def __init__(self, _hass: FakeHass, _entry: FakeEntry) -> None:
            self.hass = _hass
            self.entry = _entry
            self.refreshed = False

        async def async_config_entry_first_refresh(self) -> None:
            self.refreshed = True

    async def _noop_forward(_hass: FakeHass, _entry: FakeEntry) -> None:
        return None

    called = {"runtime": False, "logged": False}

    def _runtime(_hass: FakeHass, _register_views) -> None:
        called["runtime"] = True

    def _log(_entry_id: str) -> None:
        called["logged"] = True

    original_coordinator = init_module.UniFiNetworkMapCoordinator
    original_runtime = getattr(init_module, "_register_runtime_services")
    original_forward = getattr(init_module, "_forward_entry_setups")
    original_log = getattr(init_module, "_log_api_endpoints")
    try:
        setattr(init_module, "UniFiNetworkMapCoordinator", FakeCoordinator)
        setattr(init_module, "_register_runtime_services", _runtime)
        setattr(init_module, "_forward_entry_setups", _noop_forward)
        setattr(init_module, "_log_api_endpoints", _log)

        result = await init_module.async_setup_entry(hass, entry)
    finally:
        setattr(
            init_module, "UniFiNetworkMapCoordinator", original_coordinator
        )
        setattr(init_module, "_register_runtime_services", original_runtime)
        setattr(init_module, "_forward_entry_setups", original_forward)
        setattr(init_module, "_log_api_endpoints", original_log)

    assert result is True
    assert isinstance(entry.runtime_data, FakeCoordinator)
    assert called["runtime"] is True
    assert called["logged"] is True


async def test_async_unload_entry_unloads_platforms(
    hass: HomeAssistant,
) -> None:
    fake_hass = FakeHass()
    entry = _build_entry("entry-1")
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    entry.runtime_data = coordinator

    result = await init_module.async_unload_entry(fake_hass, entry)

    assert result is True
    assert fake_hass.config_entries.unloaded


async def test_unload_last_entry_cleans_up_entity_cache(
    hass: HomeAssistant,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Unloading the last entry unsubscribes the registry listeners."""
    from custom_components.unifi_network_map import entity_cache

    fake_hass = FakeHass()
    entry = _build_entry("entry-1")
    entry.runtime_data = UniFiNetworkMapCoordinator(hass, entry)
    fake_hass.config_entries.entries = [entry]
    cleaned = {"value": False}

    def _cleanup(_hass: object) -> None:
        cleaned["value"] = True

    monkeypatch.setattr(entity_cache, "cleanup_entity_cache", _cleanup)

    result = await init_module.async_unload_entry(fake_hass, entry)

    assert result is True
    assert cleaned["value"] is True


async def test_unload_keeps_entity_cache_while_other_entry_loaded(
    hass: HomeAssistant,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from homeassistant.config_entries import ConfigEntryState

    from custom_components.unifi_network_map import entity_cache

    fake_hass = FakeHass()
    entry = _build_entry("entry-1")
    entry.runtime_data = UniFiNetworkMapCoordinator(hass, entry)
    other_entry = _build_entry("entry-2")
    other_entry.state = ConfigEntryState.LOADED
    fake_hass.config_entries.entries = [entry, other_entry]
    cleaned = {"value": False}

    def _cleanup(_hass: object) -> None:
        cleaned["value"] = True

    monkeypatch.setattr(entity_cache, "cleanup_entity_cache", _cleanup)

    result = await init_module.async_unload_entry(fake_hass, entry)

    assert result is True
    assert cleaned["value"] is False


def test_register_runtime_services_calls_helpers() -> None:
    hass = FakeHass()
    called = {"views": False, "frontend": False, "refresh": False}

    def _register_views(_hass: FakeHass) -> None:
        called["views"] = True

    def _register_frontend_assets(_hass: FakeHass) -> None:
        called["frontend"] = True

    def _register_refresh_service(_hass: FakeHass) -> None:
        called["refresh"] = True

    original_frontend = getattr(init_module, "_register_frontend_assets")
    original_refresh = getattr(init_module, "_register_refresh_service")

    try:
        setattr(
            init_module, "_register_frontend_assets", _register_frontend_assets
        )
        setattr(
            init_module, "_register_refresh_service", _register_refresh_service
        )
        register_runtime_services = cast(
            "Callable[[FakeHass, Callable[[FakeHass], None]], None]",
            getattr(init_module, "_register_runtime_services"),
        )
        register_runtime_services(hass, _register_views)
    finally:
        setattr(init_module, "_register_frontend_assets", original_frontend)
        setattr(init_module, "_register_refresh_service", original_refresh)

    assert called == {"views": True, "frontend": True, "refresh": True}


def test_register_websocket_api_calls_helper() -> None:
    hass = FakeHass()
    called = {"websocket": False}

    import custom_components.unifi_network_map.websocket as ws_module

    original_ws_register = ws_module.async_register_websocket_api

    def _async_register_websocket_api(_hass: FakeHass) -> None:
        called["websocket"] = True

    try:
        ws_module.async_register_websocket_api = _async_register_websocket_api
        register_websocket = cast(
            "Callable[[FakeHass], None]",
            getattr(init_module, "_register_websocket_api"),
        )
        register_websocket(hass)
    finally:
        ws_module.async_register_websocket_api = original_ws_register

    assert called == {"websocket": True}


async def test_initialize_coordinator_triggers_refresh(
    hass: HomeAssistant,
) -> None:
    coordinator = UniFiNetworkMapCoordinator(hass, _build_entry("entry-1"))
    coordinator.called = False

    async def _refresh() -> None:
        coordinator.called = True

    coordinator.async_config_entry_first_refresh = _refresh

    initialize = cast(
        "Callable["
        "[UniFiNetworkMapCoordinator],"
        " Coroutine[object, object, None]]",
        getattr(init_module, "_initialize_coordinator"),
    )
    await initialize(coordinator)

    assert coordinator.called is True


def test_log_api_endpoints_logs(caplog: pytest.LogCaptureFixture) -> None:
    caplog.set_level("DEBUG")
    log_api_endpoints = cast(
        "Callable[[str], None]", getattr(init_module, "_log_api_endpoints")
    )

    log_api_endpoints("entry-1")

    assert "/api/unifi_network_map/entry-1/svg" in caplog.text


async def test_select_coordinators_filters_by_entry_id(
    hass: HomeAssistant,
) -> None:
    fake_hass = FakeHass()
    entry = _build_entry("entry-1")
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    entry.runtime_data = coordinator

    other_entry = _build_entry("other")
    other_entry.runtime_data = object()

    fake_hass.config_entries.entries = [entry, other_entry]

    select_coordinators = cast(
        "Callable[[FakeHass, str | None], list[UniFiNetworkMapCoordinator]]",
        getattr(init_module, "_select_coordinators"),
    )
    selected = select_coordinators(fake_hass, "entry-1")

    assert selected == [coordinator]


async def test_refresh_handler_raises_when_no_match() -> None:
    hass = FakeHass()
    hass.config_entries.entries = []
    build_refresh_handler = cast(
        "Callable["
        "[FakeHass],"
        " Callable[[ServiceCall],"
        " Coroutine[object, object, None]]]",
        getattr(init_module, "_build_refresh_handler"),
    )
    handler = build_refresh_handler(hass)

    call = _make_service_call({"entry_id": "missing"})
    with pytest.raises(HomeAssistantError):
        await handler(call)


async def test_refresh_handler_calls_matching_coordinator(
    hass: HomeAssistant,
) -> None:
    fake_hass = FakeHass()
    entry = _build_entry("entry-1")
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    called: list[str] = []

    async def _refresh() -> None:
        called.append("ok")

    coordinator.async_request_refresh = _refresh
    entry.runtime_data = coordinator
    fake_hass.config_entries.entries = [entry]

    build_refresh_handler = cast(
        "Callable["
        "[FakeHass],"
        " Callable[[ServiceCall],"
        " Coroutine[object, object, None]]]",
        getattr(init_module, "_build_refresh_handler"),
    )
    handler = build_refresh_handler(fake_hass)

    call = _make_service_call({"entry_id": "entry-1"})
    await handler(call)

    assert called == ["ok"]


def test_register_refresh_service_registers_once() -> None:
    hass = FakeHass()
    register_refresh_service = cast(
        "Callable[[FakeHass], None]",
        getattr(init_module, "_register_refresh_service"),
    )
    refresh_service_registered = cast(
        "Callable[[FakeHass], bool]",
        getattr(init_module, "_refresh_service_registered"),
    )

    register_refresh_service(hass)
    register_refresh_service(hass)

    assert refresh_service_registered(hass) is True
    assert len(hass.services.registered) == 1


def test_register_static_asset_schedules_async_paths() -> None:
    from homeassistant.components.http import StaticPathConfig

    hass = FakeHass()
    register_static_asset = cast(
        "Callable[[FakeHass, str, Path], None]",
        getattr(init_module, "_register_static_asset"),
    )
    js_path = Path(__file__)
    test_url = "/test/path.js"

    register_static_asset(hass, test_url, js_path)

    assert hass.created_tasks
    assert hass.http.registered
    paths = cast("list[object]", hass.http.registered[0]["paths"])
    config = cast("StaticPathConfig", paths[0])
    assert config.url_path == test_url
    assert config.path == str(js_path)
    assert config.cache_headers is True


async def test_select_coordinators_without_entry_id(
    hass: HomeAssistant,
) -> None:
    fake_hass = FakeHass()
    entry = _build_entry("entry-1")
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    entry.runtime_data = coordinator

    other_entry = _build_entry("other")
    other_entry.runtime_data = object()

    fake_hass.config_entries.entries = [entry, other_entry]

    select_coordinators = cast(
        "Callable[[FakeHass, str | None], list[UniFiNetworkMapCoordinator]]",
        getattr(init_module, "_select_coordinators"),
    )
    selected = select_coordinators(fake_hass, None)

    assert selected == [coordinator]


async def test_forward_entry_setups_calls_config_entries() -> None:
    hass = FakeHass()
    entry = _build_entry("entry-1")

    forward_entry_setups = cast(
        "Callable[[FakeHass, FakeEntry], Coroutine[object, object, None]]",
        getattr(init_module, "_forward_entry_setups"),
    )
    await forward_entry_setups(hass, entry)

    assert hass.config_entries.forwarded
