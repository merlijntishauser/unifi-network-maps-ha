from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Callable, cast

import pytest

from custom_components.unifi_network_map import http as http_module
from custom_components.unifi_network_map.data import UniFiNetworkMapData
from custom_components.unifi_network_map.renderer import RenderSettings
from unifi_network_maps.model.topology import Edge


@dataclass
class FakeState:
    entity_id: str
    state: str
    attributes: dict[str, object]
    last_changed: datetime | None


class FakeStates:
    def __init__(self, states: dict[str, FakeState]) -> None:
        self._states = states

    def get(self, entity_id: str) -> FakeState | None:
        return self._states.get(entity_id)


class FakeHass:
    def __init__(self, states: dict[str, FakeState]) -> None:
        self.states = FakeStates(states)


@dataclass
class FakeCoordinator:
    settings: RenderSettings


def test_resolve_node_status_map_filters_non_trackers() -> None:
    now = datetime(2026, 1, 17, tzinfo=timezone.utc)
    hass = FakeHass(
        {
            "device_tracker.one": FakeState(
                entity_id="device_tracker.one",
                state="home",
                attributes={},
                last_changed=now,
            ),
            "device_tracker.two": FakeState(
                entity_id="device_tracker.two",
                state="not_home",
                attributes={},
                last_changed=None,
            ),
            "sensor.temp": FakeState(
                entity_id="sensor.temp",
                state="23",
                attributes={},
                last_changed=now,
            ),
        }
    )
    node_entities = {
        "Gateway": "device_tracker.one",
        "Switch": "device_tracker.two",
        "Temp": "sensor.temp",
    }

    result = http_module.resolve_node_status_map(hass, node_entities)

    assert result["Gateway"]["state"] == "online"
    assert result["Switch"]["state"] == "offline"
    assert "Temp" not in result


def test_normalize_tracker_state() -> None:
    normalize_tracker_state = cast(
        Callable[[str], str], getattr(http_module, "_normalize_tracker_state")
    )
    assert normalize_tracker_state("home") == "online"
    assert normalize_tracker_state("not_home") == "offline"
    assert normalize_tracker_state("unknown") == "unknown"


def test_extract_mac_parses_common_formats() -> None:
    extract_mac = cast(Callable[[str], str | None], getattr(http_module, "_extract_mac"))
    assert extract_mac("AA:BB:CC:DD:EE:FF") == "aa:bb:cc:dd:ee:ff"
    assert extract_mac("aa-bb-cc-dd-ee-ff") == "aa:bb:cc:dd:ee:ff"
    assert extract_mac("aabbccddeeff") == "aa:bb:cc:dd:ee:ff"
    assert extract_mac("invalid") is None


def test_edge_payload_validation_and_defaults() -> None:
    valid_edge_payload = cast(
        Callable[[dict[str, object]], bool], getattr(http_module, "_valid_edge_payload")
    )
    edge_from_payload = cast(
        Callable[[dict[str, object]], Edge], getattr(http_module, "_edge_from_payload")
    )
    assert valid_edge_payload({"left": "a", "right": "b"}) is True
    assert valid_edge_payload({"left": "a"}) is False
    edge = edge_from_payload(
        {"left": "a", "right": "b", "label": 123, "poe": None, "wireless": None}
    )
    assert edge.label is None
    assert edge.poe is False
    assert edge.wireless is False


def test_render_svg_with_theme_paths(monkeypatch: pytest.MonkeyPatch) -> None:
    settings = RenderSettings(
        include_ports=False,
        include_clients=False,
        client_scope="wired",
        only_unifi=False,
        svg_isometric=False,
        svg_width=None,
        svg_height=None,
        use_cache=False,
    )
    data = UniFiNetworkMapData(
        svg="<svg />",
        payload={
            "edges": [{"left": "a", "right": "b"}],
            "node_types": {"a": "gateway", "b": "switch"},
        },
    )
    coordinator = cast(http_module.UniFiNetworkMapCoordinator, FakeCoordinator(settings=settings))

    def _resolve_svg_theme(_name: str) -> object:
        return object()

    def _render_svg(*_args: object, **_kwargs: object) -> str:
        return "rendered"

    monkeypatch.setattr(http_module, "_resolve_svg_theme", _resolve_svg_theme)
    monkeypatch.setattr(http_module, "render_svg", _render_svg)

    render_svg_with_theme = cast(
        Callable[[UniFiNetworkMapData, object, str], str],
        getattr(http_module, "_render_svg_with_theme"),
    )
    result = render_svg_with_theme(data, coordinator, "dark")

    assert result == "rendered"


def test_render_svg_with_theme_returns_original_on_missing_edges() -> None:
    settings = RenderSettings(
        include_ports=False,
        include_clients=False,
        client_scope="wired",
        only_unifi=False,
        svg_isometric=True,
        svg_width=None,
        svg_height=None,
        use_cache=False,
    )
    data = UniFiNetworkMapData(svg="<svg />", payload={"edges": [], "node_types": {}})
    coordinator = cast(http_module.UniFiNetworkMapCoordinator, FakeCoordinator(settings=settings))

    render_svg_with_theme = cast(
        Callable[[UniFiNetworkMapData, object, str], str],
        getattr(http_module, "_render_svg_with_theme"),
    )
    result = render_svg_with_theme(data, coordinator, "dark")

    assert result == "<svg />"
