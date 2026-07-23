from __future__ import annotations

from types import SimpleNamespace
from typing import TYPE_CHECKING, cast

import pytest
from aiohttp import web

from custom_components.unifi_network_map import http as http_module
from custom_components.unifi_network_map import renderer as renderer_module
from custom_components.unifi_network_map.data import UniFiNetworkMapData
from tests.helpers import (
    FakeCoordinator,
    FakeHassWithHttp,
    build_settings,
)

if TYPE_CHECKING:
    from collections.abc import Callable

    from unifi_topology import Edge


def test_register_unifi_http_views_registers_once() -> None:
    hass = FakeHassWithHttp({})
    register = http_module.register_unifi_http_views

    register(hass)
    register(hass)

    data = cast("dict[str, object]", hass.data["unifi_network_map"])
    assert data["views_registered"] is True
    assert len(hass.http.views) == 2


async def test_svg_view_returns_404_when_missing_data() -> None:
    hass = FakeHassWithHttp({})
    request = SimpleNamespace(app={"hass": hass}, query={})
    http_module.web.HTTPNotFound = type("HTTPNotFound", (Exception,), {})

    view = http_module.UniFiNetworkMapSvgView()

    with pytest.raises(web.HTTPNotFound):
        await view.get(request, "missing")


async def test_svg_view_renders_theme_when_requested(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    settings = build_settings()
    data = UniFiNetworkMapData(
        svg="<svg />", payload={"edges": [{"left": "a", "right": "b"}]}
    )
    coordinator = FakeCoordinator(settings=settings)
    coordinator.data = data
    fake_entry = SimpleNamespace(runtime_data=coordinator)
    hass = FakeHassWithHttp({})
    hass.config_entries.entries_by_id["entry-1"] = fake_entry

    def _render_themed_svg(
        _data: object,
        _settings: object,
        _svg_theme: str | None,
        _icon_set: str | None,
    ) -> tuple[str, str]:
        return ("themed", "#1c1e21")

    monkeypatch.setattr(http_module, "render_themed_svg", _render_themed_svg)

    def _response(**kwargs: object) -> SimpleNamespace:
        return SimpleNamespace(**kwargs)

    http_module.web.Response = _response
    request = SimpleNamespace(
        app={"hass": hass}, query={"svg_theme": "unifi-dark"}
    )

    view = http_module.UniFiNetworkMapSvgView()
    response = await view.get(request, "entry-1")

    assert response.text == "themed"
    assert response.headers == {"X-Theme-Background": "#1c1e21"}


async def test_payload_view_returns_mapped_entities(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    data = UniFiNetworkMapData(
        svg="<svg />",
        payload={
            "node_types": {
                "aa:bb:cc:dd:ee:01": "client",
                "aa:bb:cc:dd:ee:02": "switch",
            },
        },
    )
    coordinator = FakeCoordinator(settings=build_settings())
    coordinator.data = data
    fake_entry = SimpleNamespace(runtime_data=coordinator)
    hass = FakeHassWithHttp({})
    hass.config_entries.entries_by_id["entry-1"] = fake_entry

    def _json_response(payload: object) -> SimpleNamespace:
        return SimpleNamespace(status=200, body=bytes(str(payload), "utf-8"))

    enriched = {
        "node_entities": {"One": "a"},
        "node_status": {"One": {"state": "online"}},
    }

    http_module.web.json_response = _json_response
    monkeypatch.setattr(
        http_module,
        "get_or_build_enriched_payload",
        lambda _hass, _eid, _payload: enriched,
    )
    request = SimpleNamespace(app={"hass": hass})

    view = http_module.UniFiNetworkMapPayloadView()
    response = await view.get(request, "entry-1")

    assert response.status == 200
    assert response.body


def test_edge_payload_validation_and_defaults() -> None:
    valid_edge_payload = cast(
        "Callable[[dict[str, object]], bool]",
        getattr(renderer_module, "_valid_edge_payload"),
    )
    edge_from_payload = cast(
        "Callable[[dict[str, object]], Edge]",
        getattr(renderer_module, "_edge_from_payload"),
    )
    assert valid_edge_payload({"left": "a", "right": "b"}) is True
    assert valid_edge_payload({"left": "a"}) is False
    edge = edge_from_payload(
        {
            "left": "a",
            "right": "b",
            "label": 123,
            "poe": None,
            "wireless": None,
            "speed": "fast",
            "channel": "auto",
        }
    )
    assert edge.label is None
    assert edge.poe is False
    assert edge.wireless is False
    assert edge.speed is None
    assert edge.channel is None


async def test_payload_view_returns_404_when_missing_data() -> None:
    hass = FakeHassWithHttp({})
    http_module.web.HTTPNotFound = type("HTTPNotFound", (Exception,), {})
    request = SimpleNamespace(app={"hass": hass})

    view = http_module.UniFiNetworkMapPayloadView()

    with pytest.raises(http_module.web.HTTPNotFound):
        await view.get(request, "missing")


def test_render_themed_svg_paths(monkeypatch: pytest.MonkeyPatch) -> None:
    from custom_components.unifi_network_map import renderer

    settings = build_settings()
    data = UniFiNetworkMapData(
        svg="<svg />",
        payload={
            "edges": [{"left": "a", "right": "b"}],
            "node_types": {"a": "gateway", "b": "switch"},
        },
    )

    def _render_svg(*_args: object, **_kwargs: object) -> str:
        return "rendered"

    monkeypatch.setattr(renderer, "render_svg", _render_svg)

    svg, background = renderer.render_themed_svg(data, settings, "unifi", None)

    assert svg == "rendered"
    assert background == "#f9fafa"


def test_render_themed_svg_returns_original_on_missing_edges() -> None:
    from custom_components.unifi_network_map import renderer

    settings = build_settings(svg_isometric=True)
    data = UniFiNetworkMapData(
        svg="<svg />", payload={"edges": [], "node_types": {}}
    )

    svg, background = renderer.render_themed_svg(data, settings, "unifi", None)

    assert svg == "<svg />"
    assert background == "#f9fafa"


def test_render_themed_svg_returns_original_on_invalid_edges() -> None:
    from custom_components.unifi_network_map import renderer

    data = UniFiNetworkMapData(
        svg="<svg />",
        payload={"edges": [{"left": "a"}], "node_types": {"a": "gateway"}},
    )

    svg, background = renderer.render_themed_svg(
        data, build_settings(), "unifi", None
    )

    assert svg == "<svg />"
    assert background == "#f9fafa"


def test_render_themed_svg_isometric_branch(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from custom_components.unifi_network_map import renderer

    settings = build_settings(svg_isometric=True)
    data = UniFiNetworkMapData(
        svg="<svg />",
        payload={
            "edges": [{"left": "a", "right": "b"}],
            "node_types": {"a": "gateway", "b": "switch"},
        },
    )

    def _render_svg_isometric(*_args: object, **_kwargs: object) -> str:
        return "iso"

    monkeypatch.setattr(
        renderer, "render_svg_isometric", _render_svg_isometric
    )

    svg, background = renderer.render_themed_svg(data, settings, "unifi", None)

    assert svg == "iso"
    assert background == "#f9fafa"


def test_resolve_svg_theme_applies_icon_set_override() -> None:
    from custom_components.unifi_network_map import renderer

    resolve_svg_theme = cast(
        "Callable[[str | None, str | None], object]",
        getattr(renderer, "_resolve_svg_theme"),
    )

    theme = resolve_svg_theme("unifi", "isometric")
    assert getattr(theme, "icon_set", None) == "isometric"

    theme_default = resolve_svg_theme("unifi", None)
    assert hasattr(theme_default, "icon_set")


def test_resolve_svg_theme_falls_back_on_unknown_theme() -> None:
    """An unknown theme name falls back instead of raising HTTP 500."""
    from custom_components.unifi_network_map import renderer

    resolve_svg_theme = cast(
        "Callable[[str | None, str | None], object]",
        getattr(renderer, "_resolve_svg_theme"),
    )

    theme = resolve_svg_theme("bogus", None)

    assert hasattr(theme, "background")
