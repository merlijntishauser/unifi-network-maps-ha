from __future__ import annotations

import builtins
import logging
from dataclasses import dataclass
from typing import Callable, cast

import pytest
from requests import Response
from requests.exceptions import HTTPError, RequestException

from custom_components.unifi_network_map import api as api_module
from custom_components.unifi_network_map.errors import CannotConnect, InvalidAuth
from custom_components.unifi_network_map.renderer import RenderSettings


@dataclass
class FakeRenderer:
    error: Exception | None = None

    def render(self, *_args, **_kwargs):
        if self.error:
            raise self.error
        return "ok"


def _build_settings() -> RenderSettings:
    return RenderSettings(
        include_ports=False,
        include_clients=False,
        client_scope="wired",
        only_unifi=False,
        svg_isometric=False,
        svg_width=None,
        svg_height=None,
        use_cache=False,
    )


def _build_cache_settings() -> RenderSettings:
    return RenderSettings(
        include_ports=False,
        include_clients=False,
        client_scope="wired",
        only_unifi=False,
        svg_isometric=False,
        svg_width=None,
        svg_height=None,
        use_cache=True,
    )


def test_client_cache_returns_cached(monkeypatch: pytest.MonkeyPatch) -> None:
    settings = _build_cache_settings()
    client = api_module.UniFiNetworkMapClient(
        base_url="https://controller",
        username="user",
        password="pass",
        site="default",
        verify_ssl=True,
        settings=settings,
    )
    data = api_module.UniFiNetworkMapData(svg="<svg />", payload={})
    calls: list[str] = []

    def _render_payload(*_args: object, **_kwargs: object) -> api_module.UniFiNetworkMapData:
        calls.append("render")
        return data

    monkeypatch.setattr(api_module, "_render_map_payload", _render_payload)
    monkeypatch.setattr(api_module, "monotonic", lambda: 100.0)

    first = client.fetch_map()
    second = client.fetch_map()

    assert first is second
    assert calls == ["render"]


def test_client_cache_expires(monkeypatch: pytest.MonkeyPatch) -> None:
    settings = _build_cache_settings()
    client = api_module.UniFiNetworkMapClient(
        base_url="https://controller",
        username="user",
        password="pass",
        site="default",
        verify_ssl=True,
        settings=settings,
    )
    counter = {"value": 0}

    def _render_payload(*_args: object, **_kwargs: object) -> api_module.UniFiNetworkMapData:
        counter["value"] += 1
        return api_module.UniFiNetworkMapData(svg=f"<svg {counter['value']} />", payload={})

    times = iter(
        [
            0.0,
            api_module.DEFAULT_RENDER_CACHE_SECONDS + 1,
            api_module.DEFAULT_RENDER_CACHE_SECONDS + 2,
        ]
    )
    monkeypatch.setattr(api_module, "_render_map_payload", _render_payload)
    monkeypatch.setattr(api_module, "monotonic", lambda: next(times))

    first = client.fetch_map()
    second = client.fetch_map()

    assert first.svg != second.svg
    assert counter["value"] == 2


def test_map_auth_error_rate_limit() -> None:
    map_auth_error = cast(Callable[[Exception], Exception], getattr(api_module, "_map_auth_error"))
    response = Response()
    response.status_code = 429
    cause = HTTPError(response=response)
    exc = Exception("boom")
    exc.__cause__ = cause

    mapped = map_auth_error(exc)

    assert isinstance(mapped, CannotConnect)


def test_map_auth_error_invalid_auth() -> None:
    map_auth_error = cast(Callable[[Exception], Exception], getattr(api_module, "_map_auth_error"))
    response = Response()
    response.status_code = 401
    cause = HTTPError(response=response)
    exc = Exception("boom")
    exc.__cause__ = cause

    mapped = map_auth_error(exc)

    assert isinstance(mapped, InvalidAuth)


def test_render_map_payload_maps_request_errors(monkeypatch: pytest.MonkeyPatch) -> None:
    render_map_payload = cast(
        Callable[[api_module.Config, RenderSettings], object],
        getattr(api_module, "_render_map_payload"),
    )

    def _renderer() -> FakeRenderer:
        return FakeRenderer(error=RequestException("timeout"))

    monkeypatch.setattr(api_module, "UniFiNetworkMapRenderer", _renderer)

    with pytest.raises(CannotConnect):
        render_map_payload(api_module.Config("url", "site", "u", "p", True), _build_settings())


def test_map_auth_error_falls_back_to_invalid_auth() -> None:
    map_auth_error = cast(Callable[[Exception], Exception], getattr(api_module, "_map_auth_error"))
    mapped = map_auth_error(Exception("boom"))

    assert isinstance(mapped, InvalidAuth)


def test_status_code_from_exception_missing_cause() -> None:
    status_code_from_exception = cast(
        Callable[[Exception], int | None], getattr(api_module, "_status_code_from_exception")
    )

    assert status_code_from_exception(Exception("boom")) is None


def test_load_unifi_auth_error_import_failure(monkeypatch: pytest.MonkeyPatch) -> None:
    real_import = builtins.__import__

    def _import(name: str, globals=None, locals=None, fromlist=(), level=0):
        if name == "unifi_controller_api":
            raise ImportError("missing")
        return real_import(name, globals, locals, fromlist, level)

    monkeypatch.setattr(builtins, "__import__", _import)

    with pytest.raises(CannotConnect):
        load_unifi_auth_error = cast(
            Callable[[], type[Exception]], getattr(api_module, "_load_unifi_auth_error")
        )
        load_unifi_auth_error()


def test_assert_unifi_connectivity_maps_invalid_auth(monkeypatch: pytest.MonkeyPatch) -> None:
    class AuthError(Exception):
        pass

    def _fetch_devices(*_args: object, **_kwargs: object) -> None:
        raise AuthError("nope")

    monkeypatch.setattr(api_module, "fetch_devices", _fetch_devices)

    with pytest.raises(InvalidAuth):
        assert_unifi_connectivity = cast(
            Callable[[api_module.Config, str, type[Exception]], None],
            getattr(api_module, "_assert_unifi_connectivity"),
        )
        assert_unifi_connectivity(
            api_module.Config("url", "site", "u", "p", True),
            "site",
            AuthError,
        )


def test_assert_unifi_connectivity_maps_cannot_connect(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    class AuthError(Exception):
        pass

    def _fetch_devices(*_args: object, **_kwargs: object) -> None:
        raise OSError("down")

    monkeypatch.setattr(api_module, "fetch_devices", _fetch_devices)

    with pytest.raises(CannotConnect):
        assert_unifi_connectivity = cast(
            Callable[[api_module.Config, str, type[Exception]], None],
            getattr(api_module, "_assert_unifi_connectivity"),
        )
        assert_unifi_connectivity(
            api_module.Config("url", "site", "u", "p", True),
            "site",
            AuthError,
        )


def test_render_map_payload_maps_auth_error(monkeypatch: pytest.MonkeyPatch) -> None:
    class AuthError(Exception):
        pass

    def _unifi_auth_error():
        return AuthError

    def _renderer() -> FakeRenderer:
        return FakeRenderer(error=AuthError("nope"))

    monkeypatch.setattr(api_module, "_unifi_auth_error", _unifi_auth_error)
    monkeypatch.setattr(api_module, "UniFiNetworkMapRenderer", _renderer)

    with pytest.raises(InvalidAuth):
        render_map_payload = cast(
            Callable[[api_module.Config, RenderSettings], api_module.UniFiNetworkMapData],
            getattr(api_module, "_render_map_payload"),
        )
        render_map_payload(api_module.Config("url", "site", "u", "p", True), _build_settings())


def test_ensure_ssl_warning_filter_adds_once() -> None:
    logger = logging.getLogger("unifi_controller_api.api_client")
    before = list(logger.filters)

    setattr(api_module, "_ssl_warning_filter_added", False)
    setattr(api_module, "_ssl_warning_filter", None)
    try:
        ensure_filter = cast(
            Callable[[bool], None], getattr(api_module, "_ensure_unifi_ssl_warning_filter")
        )
        ensure_filter(False)
        ensure_filter(False)

        added = [f for f in logger.filters if f not in before]
        assert len(added) == 1
        assert getattr(api_module, "_ssl_warning_filter_added") is True
    finally:
        for filt in logger.filters:
            if filt not in before:
                logger.removeFilter(filt)
        setattr(api_module, "_ssl_warning_filter_added", False)
        setattr(api_module, "_ssl_warning_filter", None)
