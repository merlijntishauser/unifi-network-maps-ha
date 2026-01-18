from __future__ import annotations

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
