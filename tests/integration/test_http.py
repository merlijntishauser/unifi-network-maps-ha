from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace
from typing import Callable, cast

import pytest

from custom_components.unifi_network_map import http as http_module
from aiohttp import web
from custom_components.unifi_network_map.data import UniFiNetworkMapData
from custom_components.unifi_network_map.renderer import RenderSettings
from tests.helpers import build_settings
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


class FakeHttp:
    def __init__(self) -> None:
        self.views: list[object] = []

    def register_view(self, view: object) -> None:
        self.views.append(view)


class FakeConfigEntries:
    def __init__(self, entries: list[object]) -> None:
        self._entries = entries

    def async_entries(self, _domain: str) -> list[object]:
        return self._entries


class FakeHassWithHttp(FakeHass):
    def __init__(self, states: dict[str, FakeState]) -> None:
        super().__init__(states)
        self.http = FakeHttp()
        self.data: dict[str, object] = {}
        self.config_entries = FakeConfigEntries([])

    async def async_add_executor_job(self, func, *args: object):
        return func(*args)


@dataclass
class FakeCoordinator:
    settings: RenderSettings


@dataclass
class FakeEntityEntry:
    entity_id: str
    unique_id: str | None = None
    device_id: str | None = None
    platform: str | None = None


@dataclass
class FakeDevice:
    identifiers: set[tuple[str, str]]
    connections: set[tuple[str, str]]


class FakeDeviceRegistry:
    def __init__(self, devices: dict[str, FakeDevice]) -> None:
        self._devices = devices

    def async_get(self, device_id: str) -> FakeDevice | None:
        return self._devices.get(device_id)


class FakeEntityRegistry:
    def __init__(self, entries: dict[str, FakeEntityEntry]) -> None:
        self.entities = entries


def _run(coro):
    return asyncio.run(coro)


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


def test_register_unifi_http_views_registers_once() -> None:
    hass = FakeHassWithHttp({})
    register = http_module.register_unifi_http_views

    register(hass)
    register(hass)

    data = cast(dict[str, object], hass.data["unifi_network_map"])
    assert data["views_registered"] is True
    assert len(hass.http.views) == 2


def test_svg_view_returns_404_when_missing_data() -> None:
    hass = FakeHassWithHttp({})
    request = SimpleNamespace(app={"hass": hass}, query={})
    http_module.web.HTTPNotFound = type("HTTPNotFound", (Exception,), {})

    view = http_module.UniFiNetworkMapSvgView()

    with pytest.raises(web.HTTPNotFound):
        _run(view.get(request, "missing"))


def test_svg_view_renders_theme_when_requested(monkeypatch: pytest.MonkeyPatch) -> None:
    settings = build_settings()
    data = UniFiNetworkMapData(svg="<svg />", payload={"edges": [{"left": "a", "right": "b"}]})
    coordinator = FakeCoordinator(settings=settings)
    hass = FakeHassWithHttp({})
    hass.data["unifi_network_map"] = {"entry-1": coordinator}
    coordinator.data = data

    def _render_svg_with_theme(_data, _coordinator, _theme_name: str) -> str:
        return "themed"

    monkeypatch.setattr(http_module, "_render_svg_with_theme", _render_svg_with_theme)

    def _response(**kwargs: object) -> SimpleNamespace:
        return SimpleNamespace(**kwargs)

    http_module.web.Response = _response
    request = SimpleNamespace(app={"hass": hass}, query={"theme": "dark"})

    view = http_module.UniFiNetworkMapSvgView()
    response = _run(view.get(request, "entry-1"))

    assert response.text == "themed"


def test_payload_view_returns_mapped_entities(monkeypatch: pytest.MonkeyPatch) -> None:
    data = UniFiNetworkMapData(
        svg="<svg />",
        payload={"client_macs": {"One": "aa"}, "device_macs": {"Two": "bb"}},
    )
    coordinator = FakeCoordinator(settings=build_settings())
    coordinator.data = data
    hass = FakeHassWithHttp({})
    hass.data["unifi_network_map"] = {"entry-1": coordinator}

    def _json_response(payload: object) -> SimpleNamespace:
        return SimpleNamespace(status=200, body=bytes(str(payload), "utf-8"))

    def _resolve_client_entity_map(*_args: object) -> dict[str, str]:
        return {"One": "a"}

    def _resolve_device_entity_map(*_args: object) -> dict[str, str]:
        return {"Two": "b"}

    def _resolve_node_entity_map(*_args: object) -> dict[str, str]:
        return {"One": "a"}

    def _resolve_node_status_map(*_args: object) -> dict[str, dict[str, str]]:
        return {"One": {"state": "online"}}

    http_module.web.json_response = _json_response
    monkeypatch.setattr(http_module, "resolve_client_entity_map", _resolve_client_entity_map)
    monkeypatch.setattr(http_module, "resolve_device_entity_map", _resolve_device_entity_map)
    monkeypatch.setattr(http_module, "resolve_node_entity_map", _resolve_node_entity_map)
    monkeypatch.setattr(http_module, "resolve_node_status_map", _resolve_node_status_map)
    request = SimpleNamespace(app={"hass": hass})

    view = http_module.UniFiNetworkMapPayloadView()
    response = _run(view.get(request, "entry-1"))

    assert response.status == 200
    assert response.body


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


def test_payload_view_returns_404_when_missing_data() -> None:
    hass = FakeHassWithHttp({})
    http_module.web.HTTPNotFound = type("HTTPNotFound", (Exception,), {})
    request = SimpleNamespace(app={"hass": hass})

    view = http_module.UniFiNetworkMapPayloadView()

    with pytest.raises(http_module.web.HTTPNotFound):
        _run(view.get(request, "missing"))


def test_render_svg_with_theme_paths(monkeypatch: pytest.MonkeyPatch) -> None:
    settings = build_settings()
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
    settings = build_settings(svg_isometric=True)
    data = UniFiNetworkMapData(svg="<svg />", payload={"edges": [], "node_types": {}})
    coordinator = cast(http_module.UniFiNetworkMapCoordinator, FakeCoordinator(settings=settings))

    render_svg_with_theme = cast(
        Callable[[UniFiNetworkMapData, object, str], str],
        getattr(http_module, "_render_svg_with_theme"),
    )
    result = render_svg_with_theme(data, coordinator, "dark")

    assert result == "<svg />"


def test_render_svg_with_theme_returns_original_on_missing_theme(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    data = UniFiNetworkMapData(
        svg="<svg />",
        payload={"edges": [{"left": "a", "right": "b"}], "node_types": {"a": "gateway"}},
    )
    coordinator = cast(
        http_module.UniFiNetworkMapCoordinator, FakeCoordinator(settings=build_settings())
    )

    def _resolve_svg_theme(_name: str) -> object | None:
        return None

    monkeypatch.setattr(http_module, "_resolve_svg_theme", _resolve_svg_theme)

    render_svg_with_theme = cast(
        Callable[[UniFiNetworkMapData, object, str], str],
        getattr(http_module, "_render_svg_with_theme"),
    )
    result = render_svg_with_theme(data, coordinator, "dark")

    assert result == "<svg />"


def test_render_svg_with_theme_returns_original_on_invalid_edges(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    data = UniFiNetworkMapData(
        svg="<svg />",
        payload={"edges": [{"left": "a"}], "node_types": {"a": "gateway"}},
    )
    coordinator = cast(
        http_module.UniFiNetworkMapCoordinator, FakeCoordinator(settings=build_settings())
    )

    def _resolve_svg_theme(_name: str) -> object:
        return object()

    monkeypatch.setattr(http_module, "_resolve_svg_theme", _resolve_svg_theme)

    render_svg_with_theme = cast(
        Callable[[UniFiNetworkMapData, object, str], str],
        getattr(http_module, "_render_svg_with_theme"),
    )
    result = render_svg_with_theme(data, coordinator, "dark")

    assert result == "<svg />"


def test_render_svg_with_theme_isometric_branch(monkeypatch: pytest.MonkeyPatch) -> None:
    settings = build_settings(svg_isometric=True)
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

    def _render_svg_isometric(*_args: object, **_kwargs: object) -> str:
        return "iso"

    monkeypatch.setattr(http_module, "_resolve_svg_theme", _resolve_svg_theme)
    monkeypatch.setattr(http_module, "render_svg_isometric", _render_svg_isometric)

    render_svg_with_theme = cast(
        Callable[[UniFiNetworkMapData, object, str], str],
        getattr(http_module, "_render_svg_with_theme"),
    )
    result = render_svg_with_theme(data, coordinator, "dark")

    assert result == "iso"


def test_resolve_theme_file_variants() -> None:
    resolve_theme_file = cast(
        Callable[[str], object | None], getattr(http_module, "_resolve_theme_file")
    )

    dark_path = resolve_theme_file("dark")
    light_path = resolve_theme_file("light")
    invalid_path = resolve_theme_file("nope")

    assert dark_path is not None
    assert "dark.yaml" in str(dark_path)
    assert light_path is not None
    assert "default.yaml" in str(light_path)
    assert invalid_path is None


def test_resolve_svg_theme_handles_missing(monkeypatch: pytest.MonkeyPatch) -> None:
    def _resolve_theme_file(_name: str) -> object | None:
        return None

    monkeypatch.setattr(http_module, "_resolve_theme_file", _resolve_theme_file)
    resolve_svg_theme = cast(
        Callable[[str], object | None], getattr(http_module, "_resolve_svg_theme")
    )

    assert resolve_svg_theme("dark") is None


def test_resolve_svg_theme_loads_theme(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    # Create a real temp file for the mock to return
    mock_theme = tmp_path / "theme.yaml"
    mock_theme.write_text("test: true")

    class _Context:
        def __init__(self, path: object) -> None:
            self._path = path

        def __enter__(self):
            return Path(self._path) if isinstance(self._path, str) else self._path

        def __exit__(self, *_args: object) -> None:
            return None

    def _resolve_theme_file(_name: str) -> str:
        return "theme.yaml"

    def _as_file(_path: object) -> _Context:
        return _Context(mock_theme)

    def _resolve_themes(_path: object) -> tuple[None, object]:
        return (None, object())

    def _shutil_copy(_src: object, _dst: object) -> None:
        pass

    monkeypatch.setattr(http_module, "_resolve_theme_file", _resolve_theme_file)
    monkeypatch.setattr(http_module.importlib_resources, "as_file", _as_file)
    monkeypatch.setattr(http_module, "resolve_themes", _resolve_themes)
    monkeypatch.setattr(http_module.shutil, "copy", _shutil_copy)
    resolve_svg_theme = cast(
        Callable[[str], object | None], getattr(http_module, "_resolve_svg_theme")
    )

    assert resolve_svg_theme("dark") is not None


def test_build_mac_entity_index_prefers_registry(monkeypatch: pytest.MonkeyPatch) -> None:
    hass = FakeHassWithHttp({})
    hass.config_entries = FakeConfigEntries([SimpleNamespace(entry_id="1")])
    entity_registry = FakeEntityRegistry(
        {
            "sensor.one": FakeEntityEntry(
                entity_id="sensor.one",
                unique_id="aa:bb:cc:dd:ee:ff",
                platform="unifi",
            )
        }
    )
    device_registry = FakeDeviceRegistry({})
    state = FakeState(
        entity_id="device_tracker.one",
        state="home",
        attributes={"mac": "AA:BB:CC:DD:EE:FF"},
        last_changed=None,
    )
    hass.states = FakeStates({"device_tracker.one": state})

    def _async_get_entity_registry(_hass: object) -> FakeEntityRegistry:
        return entity_registry

    def _async_get_device_registry(_hass: object) -> FakeDeviceRegistry:
        return device_registry

    def _entries_for_config_entry(_reg: object, _entry_id: str) -> list[FakeEntityEntry]:
        return list(entity_registry.entities.values())

    monkeypatch.setattr(http_module.er, "async_get", _async_get_entity_registry)
    monkeypatch.setattr(http_module.dr, "async_get", _async_get_device_registry)
    monkeypatch.setattr(
        http_module.er,
        "async_entries_for_config_entry",
        _entries_for_config_entry,
        raising=False,
    )

    build_index = cast(
        Callable[[FakeHassWithHttp], dict[str, str]],
        getattr(http_module, "_build_mac_entity_index"),
    )
    index = build_index(hass)

    assert index["aa:bb:cc:dd:ee:ff"] == "sensor.one"


def test_is_state_mac_candidate_paths() -> None:
    is_state_mac_candidate = cast(
        Callable[[object], bool], getattr(http_module, "_is_state_mac_candidate")
    )
    state_tracker = FakeState(
        entity_id="device_tracker.one",
        state="home",
        attributes={},
        last_changed=None,
    )
    state_router = FakeState(
        entity_id="sensor.router",
        state="home",
        attributes={"source_type": "router", "mac": "aa:bb:cc:dd:ee:ff"},
        last_changed=None,
    )
    state_other = FakeState(
        entity_id="sensor.other",
        state="home",
        attributes={"mac_address": "aa:bb:cc:dd:ee:ff"},
        last_changed=None,
    )

    assert is_state_mac_candidate(state_tracker) is True
    assert is_state_mac_candidate(state_router) is True
    assert is_state_mac_candidate(state_other) is True


def test_is_state_mac_candidate_handles_non_dict_attributes() -> None:
    is_state_mac_candidate = cast(
        Callable[[object], bool], getattr(http_module, "_is_state_mac_candidate")
    )
    state = SimpleNamespace(entity_id="sensor.one", attributes=["mac"])

    assert is_state_mac_candidate(state) is False


def test_iter_state_entries_falls_back_to_all() -> None:
    class _States:
        def all(self):
            return [FakeState("device_tracker.one", "home", {}, None)]

    hass = FakeHassWithHttp({})
    hass.states = _States()

    iter_state_entries = cast(
        Callable[[FakeHassWithHttp], list[object]], getattr(http_module, "_iter_state_entries")
    )
    entries = iter_state_entries(hass)

    assert len(entries) == 1


def test_get_unifi_entity_mac_stats_counts(monkeypatch: pytest.MonkeyPatch) -> None:
    hass = FakeHassWithHttp({})
    hass.config_entries = FakeConfigEntries([SimpleNamespace(entry_id="1")])
    entity_registry = FakeEntityRegistry(
        {
            "sensor.one": FakeEntityEntry(
                entity_id="sensor.one",
                unique_id="aa:bb:cc:dd:ee:ff",
                platform="unifi",
            ),
            "sensor.two": FakeEntityEntry(
                entity_id="sensor.two",
                unique_id=None,
                platform="unifi",
            ),
        }
    )
    device_registry = FakeDeviceRegistry({})

    def _async_get_entity_registry(_hass: object) -> FakeEntityRegistry:
        return entity_registry

    def _async_get_device_registry(_hass: object) -> FakeDeviceRegistry:
        return device_registry

    def _entries_for_config_entry(_reg: object, _entry_id: str) -> list[FakeEntityEntry]:
        return list(entity_registry.entities.values())

    monkeypatch.setattr(http_module.er, "async_get", _async_get_entity_registry)
    monkeypatch.setattr(http_module.dr, "async_get", _async_get_device_registry)
    monkeypatch.setattr(
        http_module.er,
        "async_entries_for_config_entry",
        _entries_for_config_entry,
        raising=False,
    )

    stats = http_module.get_unifi_entity_mac_stats(hass)

    assert stats["unifi_entities_scanned"] == 2
    assert stats["unifi_entities_with_mac"] == 1


def test_get_state_entity_macs(monkeypatch: pytest.MonkeyPatch) -> None:
    hass = FakeHassWithHttp({})
    state = FakeState(
        entity_id="device_tracker.one",
        state="home",
        attributes={"mac": "AA:BB:CC:DD:EE:FF"},
        last_changed=None,
    )
    hass.states = SimpleNamespace(async_all=lambda: [state])

    assert "aa:bb:cc:dd:ee:ff" in http_module.get_state_entity_macs(hass)


def test_format_mac_handles_invalid(monkeypatch: pytest.MonkeyPatch) -> None:
    def _raise_value_error(_value: str) -> str:
        raise ValueError("bad")

    monkeypatch.setattr(http_module.dr, "format_mac", _raise_value_error)
    format_mac = cast(Callable[[str], str | None], getattr(http_module, "_format_mac"))

    assert format_mac("bad") is None


def test_format_mac_returns_none_when_formatter_missing(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(http_module.dr, "format_mac", None)
    format_mac = cast(Callable[[str], str | None], getattr(http_module, "_format_mac"))

    assert format_mac("AA:BB:CC:DD:EE:FF") is None


def test_format_mac_returns_none_on_blank() -> None:
    format_mac = cast(Callable[[str], str | None], getattr(http_module, "_format_mac"))

    assert format_mac("") is None


def test_get_unifi_entity_macs_and_normalize_mac_value(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    hass = FakeHassWithHttp({})
    hass.config_entries = FakeConfigEntries([SimpleNamespace(entry_id="1")])
    entity_registry = FakeEntityRegistry(
        {
            "sensor.one": FakeEntityEntry(
                entity_id="sensor.one",
                unique_id="aa:bb:cc:dd:ee:ff",
                platform="unifi",
            )
        }
    )
    device_registry = FakeDeviceRegistry({})

    def _async_get_entity_registry(_hass: object) -> FakeEntityRegistry:
        return entity_registry

    def _async_get_device_registry(_hass: object) -> FakeDeviceRegistry:
        return device_registry

    def _entries_for_config_entry(_reg: object, _entry_id: str) -> list[FakeEntityEntry]:
        return list(entity_registry.entities.values())

    monkeypatch.setattr(http_module.er, "async_get", _async_get_entity_registry)
    monkeypatch.setattr(http_module.dr, "async_get", _async_get_device_registry)
    monkeypatch.setattr(
        http_module.er,
        "async_entries_for_config_entry",
        _entries_for_config_entry,
        raising=False,
    )

    assert "aa:bb:cc:dd:ee:ff" in http_module.get_unifi_entity_macs(hass)
    assert http_module.normalize_mac_value("AA:BB:CC:DD:EE:FF") == "aa:bb:cc:dd:ee:ff"


def test_resolve_entity_map_returns_empty() -> None:
    resolve_entity_map = cast(
        Callable[[FakeHassWithHttp, dict[str, str]], dict[str, str]],
        getattr(http_module, "_resolve_entity_map"),
    )

    assert resolve_entity_map(FakeHassWithHttp({}), {}) == {}


def test_mac_from_state_entry_rejects_non_dict() -> None:
    mac_from_state_entry = cast(
        Callable[[object], str | None], getattr(http_module, "_mac_from_state_entry")
    )

    assert mac_from_state_entry(SimpleNamespace(attributes=["mac"])) is None


def test_get_mac_attribute_value_none() -> None:
    get_mac_attribute_value = cast(
        Callable[[dict[str, object]], str | None],
        getattr(http_module, "_get_mac_attribute_value"),
    )

    assert get_mac_attribute_value({"mac": ""}) is None


def test_mac_from_device_prefers_connection(monkeypatch: pytest.MonkeyPatch) -> None:
    entry = FakeEntityEntry(entity_id="sensor.one", device_id="device-1")
    device = FakeDevice(identifiers=set(), connections={("mac", "AA-BB-CC-DD-EE-FF")})
    device_registry = FakeDeviceRegistry({"device-1": device})
    mac_from_device = cast(
        Callable[[object, FakeDeviceRegistry], str | None],
        getattr(http_module, "_mac_from_device"),
    )

    assert mac_from_device(entry, device_registry) == "aa:bb:cc:dd:ee:ff"


def test_normalize_mac_uses_fallback(monkeypatch: pytest.MonkeyPatch) -> None:
    def _format_mac(_value: str) -> None:
        return None

    monkeypatch.setattr(http_module, "_format_mac", _format_mac)
    normalize_mac = cast(Callable[[str], str], getattr(http_module, "_normalize_mac"))

    assert normalize_mac(" AA:BB ") == "aa:bb"


def test_extract_mac_returns_none_for_empty() -> None:
    extract_mac = cast(Callable[[str], str | None], getattr(http_module, "_extract_mac"))

    assert extract_mac("") is None
