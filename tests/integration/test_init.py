from __future__ import annotations

import asyncio
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Coroutine, cast

import pytest

import custom_components.unifi_network_map as init_module
from custom_components.unifi_network_map.const import DOMAIN
from custom_components.unifi_network_map.coordinator import UniFiNetworkMapCoordinator
from homeassistant.core import ServiceCall
from homeassistant.exceptions import HomeAssistantError


@dataclass
class FakeEntry:
    entry_id: str
    data: dict[str, object]
    options: dict[str, object]

    def add_update_listener(self, _callback: Callable[..., object]) -> Callable[[], None]:
        """Mock add_update_listener that returns a no-op removal function."""
        return lambda: None

    def async_on_unload(self, _func: Callable[[], None]) -> None:
        """Mock async_on_unload that does nothing."""
        pass


class FakeServices:
    def __init__(self) -> None:
        self.registered = []

    def async_register(self, domain: str, service: str, handler, schema=None) -> None:
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
        self.static_calls: list[tuple[str, str, bool]] = []

    def register_static_path(self, url_path: str, file_path: str, cache_headers: bool) -> None:
        self.static_calls.append((url_path, file_path, cache_headers))

    def async_register_static_paths(self, paths: list[object]):
        async def _noop() -> None:
            return None

        self.registered.append({"paths": paths})
        return _noop()


class _FakeConfigEntries:
    def __init__(self) -> None:
        self.forwarded: list[tuple[object, list[str]]] = []
        self.unloaded: list[tuple[object, list[str]]] = []

    async def async_forward_entry_setups(self, entry: object, platforms: list[str]) -> None:
        self.forwarded.append((entry, list(platforms)))

    async def async_unload_platforms(self, entry: object, platforms: list[str]) -> bool:
        self.unloaded.append((entry, list(platforms)))
        return True


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


def test_async_setup_entry_stores_coordinator() -> None:
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

        result = asyncio.run(init_module.async_setup_entry(hass, entry))
    finally:
        setattr(init_module, "UniFiNetworkMapCoordinator", original_coordinator)
        setattr(init_module, "_register_runtime_services", original_runtime)
        setattr(init_module, "_forward_entry_setups", original_forward)
        setattr(init_module, "_log_api_endpoints", original_log)

    assert result is True
    stored = cast(dict[str, object], hass.data[DOMAIN])
    assert isinstance(stored[entry.entry_id], FakeCoordinator)
    assert called["runtime"] is True
    assert called["logged"] is True


def test_async_unload_entry_removes_coordinator() -> None:
    hass = FakeHass()
    entry = _build_entry("entry-1")
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    hass.data[DOMAIN] = {"entry-1": coordinator}

    result = asyncio.run(init_module.async_unload_entry(hass, entry))

    assert result is True
    stored = cast(dict[str, object], hass.data[DOMAIN])
    assert "entry-1" not in stored


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
        setattr(init_module, "_register_frontend_assets", _register_frontend_assets)
        setattr(init_module, "_register_refresh_service", _register_refresh_service)
        register_runtime_services = cast(
            Callable[[FakeHass, Callable[[FakeHass], None]], None],
            getattr(init_module, "_register_runtime_services"),
        )
        register_runtime_services(hass, _register_views)
    finally:
        setattr(init_module, "_register_frontend_assets", original_frontend)
        setattr(init_module, "_register_refresh_service", original_refresh)

    assert called == {"views": True, "frontend": True, "refresh": True}


def test_initialize_coordinator_triggers_refresh() -> None:
    hass = FakeHass()
    coordinator = UniFiNetworkMapCoordinator(hass, _build_entry("entry-1"))
    coordinator.called = False

    async def _refresh() -> None:
        coordinator.called = True

    coordinator.async_config_entry_first_refresh = _refresh

    initialize = cast(
        Callable[[UniFiNetworkMapCoordinator], Coroutine[object, object, None]],
        getattr(init_module, "_initialize_coordinator"),
    )
    asyncio.run(initialize(coordinator))

    assert coordinator.called is True


def test_log_api_endpoints_logs(caplog: pytest.LogCaptureFixture) -> None:
    caplog.set_level("INFO")
    log_api_endpoints = cast(Callable[[str], None], getattr(init_module, "_log_api_endpoints"))

    log_api_endpoints("entry-1")

    assert "/api/unifi_network_map/entry-1/svg" in caplog.text


def test_select_coordinators_filters_by_entry_id() -> None:
    hass = FakeHass()
    coordinator = UniFiNetworkMapCoordinator(hass, _build_entry("entry-1"))
    hass.data[DOMAIN] = {"entry-1": coordinator, "other": object()}

    select_coordinators = cast(
        Callable[[FakeHass, str | None], list[UniFiNetworkMapCoordinator]],
        getattr(init_module, "_select_coordinators"),
    )
    selected = select_coordinators(hass, "entry-1")

    assert selected == [coordinator]


def test_refresh_handler_raises_when_no_match() -> None:
    hass = FakeHass()
    build_refresh_handler = cast(
        Callable[[FakeHass], Callable[[ServiceCall], Coroutine[object, object, None]]],
        getattr(init_module, "_build_refresh_handler"),
    )
    handler = build_refresh_handler(hass)

    with pytest.raises(HomeAssistantError):

        async def _call_handler() -> None:
            await handler(ServiceCall({"entry_id": "missing"}))

        asyncio.run(_call_handler())


def test_refresh_handler_calls_matching_coordinator() -> None:
    hass = FakeHass()
    entry = _build_entry("entry-1")
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    called: list[str] = []

    async def _refresh() -> None:
        called.append("ok")

    coordinator.async_request_refresh = _refresh
    hass.data[DOMAIN] = {"entry-1": coordinator}

    build_refresh_handler = cast(
        Callable[[FakeHass], Callable[[ServiceCall], Coroutine[object, object, None]]],
        getattr(init_module, "_build_refresh_handler"),
    )
    handler = build_refresh_handler(hass)

    async def _call_handler() -> None:
        await handler(ServiceCall({"entry_id": "entry-1"}))

    asyncio.run(_call_handler())

    assert called == ["ok"]


def test_make_static_path_config_uses_supported_signature() -> None:
    class StaticPathConfig:
        def __init__(self, url_path: str, path: str, cache_headers: bool) -> None:
            self.url_path = url_path
            self.path = path
            self.cache_headers = cache_headers

    make_static_path_config = cast(
        Callable[[type[object], object], object],
        getattr(init_module, "_make_static_path_config"),
    )
    frontend_bundle_path = cast(object, getattr(init_module, "_frontend_bundle_path")())
    frontend_bundle_url = cast(str, getattr(init_module, "_frontend_bundle_url")())

    result = make_static_path_config(StaticPathConfig, frontend_bundle_path)

    assert result is not None
    assert result.url_path == frontend_bundle_url


def test_register_refresh_service_registers_once() -> None:
    hass = FakeHass()
    register_refresh_service = cast(
        Callable[[FakeHass], None], getattr(init_module, "_register_refresh_service")
    )
    refresh_service_registered = cast(
        Callable[[FakeHass], bool], getattr(init_module, "_refresh_service_registered")
    )

    register_refresh_service(hass)
    register_refresh_service(hass)

    assert refresh_service_registered(hass) is True
    assert len(hass.services.registered) == 1


def test_register_static_asset_uses_sync_http() -> None:
    hass = FakeHass()
    register_static_asset = cast(
        Callable[[FakeHass, Path], None], getattr(init_module, "_register_static_asset")
    )
    js_path = Path(__file__)

    register_static_asset(hass, js_path)

    assert hass.http.static_calls
    url_path, file_path, cache_headers = hass.http.static_calls[0]
    assert url_path == "/unifi-network-map/unifi-network-map.js"
    assert file_path == str(js_path)
    assert cache_headers is True


def test_register_static_asset_schedules_async_paths() -> None:
    class _AsyncOnlyHttp:
        def __init__(self) -> None:
            self.registered: list[dict[str, object]] = []

        def async_register_static_paths(self, paths: list[object]):
            async def _noop() -> None:
                return None

            self.registered.append({"paths": paths})
            return _noop()

    hass = FakeHass()
    hass.http = _AsyncOnlyHttp()
    register_static_asset = cast(
        Callable[[FakeHass, Path], None], getattr(init_module, "_register_static_asset")
    )
    js_path = Path(__file__)

    register_static_asset(hass, js_path)

    assert hass.http.registered
    assert hass.created_tasks


def test_register_static_asset_warns_when_no_http_api(caplog: pytest.LogCaptureFixture) -> None:
    class _NoHttpApi:
        pass

    hass = FakeHass()
    hass.http = _NoHttpApi()
    register_static_asset = cast(
        Callable[[FakeHass, Path], None], getattr(init_module, "_register_static_asset")
    )

    caplog.set_level("WARNING")
    register_static_asset(hass, Path(__file__))

    assert "Unable to register frontend bundle" in caplog.text


def test_make_config_from_signature_maps_args() -> None:
    make_config_from_signature = cast(
        Callable[[Callable[..., object], str, str], object | None],
        getattr(init_module, "_make_config_from_signature"),
    )

    class StaticPathConfig:
        def __init__(self, url: str, filepath: str, cache_control: bool) -> None:
            self.url_path = url
            self.path = filepath
            self.cache_headers = cache_control

    result = make_config_from_signature(StaticPathConfig, "/url", "/file.js")

    assert result is not None
    assert result.url_path == "/url"
    assert result.path == "/file.js"
    assert result.cache_headers is True


def test_make_static_path_config_returns_none_when_all_fail() -> None:
    make_static_path_config = cast(
        Callable[[Callable[..., object], Path], object | None],
        getattr(init_module, "_make_static_path_config"),
    )

    class StaticPathConfig:
        def __init__(self) -> None:
            raise TypeError("no args supported")

    result = make_static_path_config(StaticPathConfig, Path(__file__))

    assert result is None


def test_make_config_from_signature_handles_invalid_callable() -> None:
    make_config_from_signature = cast(
        Callable[[Callable[..., object], str, str], object | None],
        getattr(init_module, "_make_config_from_signature"),
    )

    result = make_config_from_signature(123, "/url", "/file.js")  # type: ignore[arg-type]

    assert result is None


def test_as_resource_list_rejects_non_dict() -> None:
    as_resource_list = cast(
        Callable[[object], list[dict[str, object]] | None],
        getattr(init_module, "_as_resource_list"),
    )

    assert as_resource_list([{"ok": True}]) == [{"ok": True}]
    assert as_resource_list([1, 2]) is None


def test_maybe_await_list_handles_coroutine() -> None:
    maybe_await_list = cast(
        Callable[[object], Coroutine[object, object, list[dict[str, object]] | None]],
        getattr(init_module, "_maybe_await_list"),
    )

    async def _result() -> list[dict[str, object]]:
        return [{"url": "demo"}]

    result = asyncio.run(maybe_await_list(_result()))

    assert result == [{"url": "demo"}]


def test_maybe_await_list_handles_sync_value() -> None:
    maybe_await_list = cast(
        Callable[[object], Coroutine[object, object, list[dict[str, object]] | None]],
        getattr(init_module, "_maybe_await_list"),
    )

    result = asyncio.run(maybe_await_list([{"url": "local"}]))

    assert result == [{"url": "local"}]


def test_select_coordinators_without_entry_id() -> None:
    hass = FakeHass()
    coordinator = UniFiNetworkMapCoordinator(hass, _build_entry("entry-1"))
    hass.data[DOMAIN] = {"entry-1": coordinator, "other": object()}

    select_coordinators = cast(
        Callable[[FakeHass, str | None], list[UniFiNetworkMapCoordinator]],
        getattr(init_module, "_select_coordinators"),
    )
    selected = select_coordinators(hass, None)

    assert selected == [coordinator]


def test_forward_entry_setups_calls_config_entries() -> None:
    hass = FakeHass()
    entry = _build_entry("entry-1")

    forward_entry_setups = cast(
        Callable[[FakeHass, FakeEntry], Coroutine[object, object, None]],
        getattr(init_module, "_forward_entry_setups"),
    )
    asyncio.run(forward_entry_setups(hass, entry))

    assert hass.config_entries.forwarded
