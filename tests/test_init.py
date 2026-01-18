from __future__ import annotations

import asyncio
from dataclasses import dataclass
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

    async def async_add_executor_job(self, func, *args: object):
        return func(*args)


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
