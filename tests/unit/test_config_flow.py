from __future__ import annotations

import asyncio
from typing import Callable, cast

from custom_components.unifi_network_map import config_flow as config_flow_module
from custom_components.unifi_network_map.const import (
    CONF_SITE,
    CONF_SVG_HEIGHT,
    CONF_SVG_WIDTH,
    CONF_VERIFY_SSL,
    DEFAULT_SITE,
    DEFAULT_VERIFY_SSL,
)
from custom_components.unifi_network_map.errors import CannotConnect, InvalidAuth
from homeassistant.const import CONF_PASSWORD, CONF_URL, CONF_USERNAME


class FakeHass:
    async def async_add_executor_job(self, func, *args: object):
        return func(*args)


class FakeEntry:
    def __init__(self, options: dict[str, object] | None = None) -> None:
        self.options = options or {}
        self.entry_id = "test_entry_id"


def _run(coro):
    return asyncio.run(coro)


def _make_flow():
    flow = config_flow_module.UniFiNetworkMapConfigFlow()
    flow.hass = FakeHass()
    return flow


def _base_input() -> dict[str, object]:
    return {
        CONF_URL: "https://unifi.local/",
        CONF_USERNAME: "admin",
        CONF_PASSWORD: "secret",
        CONF_SITE: DEFAULT_SITE,
        CONF_VERIFY_SSL: DEFAULT_VERIFY_SSL,
    }


def test_step_user_creates_entry_on_success(monkeypatch):
    def _validate(*_args: object, **_kwargs: object) -> None:
        return None

    monkeypatch.setattr(config_flow_module, "validate_unifi_credentials", _validate)
    result = _run(_make_flow().async_step_user(_base_input()))

    assert result["type"] == "create_entry"
    assert result["title"] == "UniFi Network Map (default)"
    assert result["data"][CONF_URL] == "https://unifi.local"


def test_step_user_reports_invalid_auth(monkeypatch):
    def _validate(*_args: object, **_kwargs: object) -> None:
        raise InvalidAuth("bad auth")

    monkeypatch.setattr(config_flow_module, "validate_unifi_credentials", _validate)
    result = _run(_make_flow().async_step_user(_base_input()))

    assert result["type"] == "form"
    assert result["errors"]["base"] == "invalid_auth"


def test_step_user_reports_cannot_connect(monkeypatch):
    def _validate(*_args: object, **_kwargs: object) -> None:
        raise CannotConnect("no route")

    monkeypatch.setattr(config_flow_module, "validate_unifi_credentials", _validate)
    result = _run(_make_flow().async_step_user(_base_input()))

    assert result["type"] == "form"
    assert result["errors"]["base"] == "cannot_connect"


def test_step_user_reports_invalid_url(monkeypatch):
    def _validate(*_args: object, **_kwargs: object) -> None:
        return None

    monkeypatch.setattr(config_flow_module, "validate_unifi_credentials", _validate)
    bad_input = _base_input()
    bad_input[CONF_URL] = "not-a-url"
    result = _run(_make_flow().async_step_user(bad_input))

    assert result["type"] == "form"
    assert result["errors"]["base"] == "invalid_url"


def test_step_user_rejects_url_with_credentials(monkeypatch):
    def _validate(*_args: object, **_kwargs: object) -> None:
        return None

    monkeypatch.setattr(config_flow_module, "validate_unifi_credentials", _validate)
    bad_input = _base_input()
    bad_input[CONF_URL] = "https://user:pass@unifi.local/"
    result = _run(_make_flow().async_step_user(bad_input))

    assert result["type"] == "form"
    assert result["errors"]["base"] == "url_has_credentials"


def test_options_flow_returns_form_without_input(monkeypatch):
    flow = config_flow_module.UniFiNetworkMapOptionsFlow(FakeEntry())

    def _schema(_options):
        return config_flow_module.vol.Schema({})

    monkeypatch.setattr(config_flow_module, "_build_options_schema", _schema)
    result = _run(flow.async_step_init())

    assert result["type"] == "form"
    assert result["step_id"] == "init"


def test_options_flow_filters_empty_svg_sizes():
    flow = config_flow_module.UniFiNetworkMapOptionsFlow(FakeEntry())
    user_input = {
        "include_ports": True,
        CONF_SVG_WIDTH: "",
        CONF_SVG_HEIGHT: None,
    }

    result = _run(flow.async_step_init(user_input))

    assert result["type"] == "create_entry"
    assert CONF_SVG_WIDTH not in result["data"]
    assert CONF_SVG_HEIGHT not in result["data"]


def test_options_flow_reports_invalid_svg_size(monkeypatch):
    flow = config_flow_module.UniFiNetworkMapOptionsFlow(FakeEntry())
    user_input = {
        CONF_SVG_WIDTH: "abc",
    }

    def _schema(_options):
        return config_flow_module.vol.Schema({})

    monkeypatch.setattr(config_flow_module, "_build_options_schema", _schema)
    result = _run(flow.async_step_init(user_input))

    assert result["type"] == "form"
    assert result["errors"][CONF_SVG_WIDTH] == "expected_int"


def test_async_get_options_flow_returns_options_flow() -> None:
    entry = FakeEntry()
    flow = config_flow_module.UniFiNetworkMapConfigFlow.async_get_options_flow(entry)

    assert isinstance(flow, config_flow_module.UniFiNetworkMapOptionsFlow)


def test_options_schema_fields_use_entry_defaults() -> None:
    options: dict[str, object] = {"include_ports": True}
    options_schema_fields = cast(
        Callable[[dict[str, object]], dict[str, object]],
        getattr(config_flow_module, "_options_schema_fields"),
    )
    fields = options_schema_fields(options)

    include_ports_marker = next(
        marker for marker in fields.keys() if getattr(marker, "schema", None) == "include_ports"
    )

    default_value = (
        include_ports_marker.default()
        if callable(include_ports_marker.default)
        else include_ports_marker.default
    )

    assert default_value is True


def test_boolean_selector_returns_instance() -> None:
    boolean_selector = cast(
        Callable[[], config_flow_module.selector.BooleanSelector],
        getattr(config_flow_module, "_boolean_selector"),
    )
    selector_instance = boolean_selector()

    assert isinstance(selector_instance, config_flow_module.selector.BooleanSelector)


def test_client_scope_selector_returns_instance() -> None:
    client_scope_selector = cast(
        Callable[[], config_flow_module.selector.SelectSelector],
        getattr(config_flow_module, "_client_scope_selector"),
    )
    selector_instance = client_scope_selector()

    assert isinstance(selector_instance, config_flow_module.selector.SelectSelector)


def test_normalize_options_casts_numeric_strings() -> None:
    user_input: dict[str, object] = {
        CONF_SVG_WIDTH: " 120.5 ",
        CONF_SVG_HEIGHT: 80.2,
    }

    normalize_options = cast(
        Callable[[dict[str, object]], tuple[dict[str, object], dict[str, str]]],
        getattr(config_flow_module, "_normalize_options"),
    )
    data, errors = normalize_options(user_input)

    assert data[CONF_SVG_WIDTH] == 120
    assert data[CONF_SVG_HEIGHT] == 80
    assert errors == {}


def test_normalize_options_strips_empty_string() -> None:
    user_input: dict[str, object] = {CONF_SVG_WIDTH: "   "}

    normalize_options = cast(
        Callable[[dict[str, object]], tuple[dict[str, object], dict[str, str]]],
        getattr(config_flow_module, "_normalize_options"),
    )
    data, errors = normalize_options(user_input)

    assert CONF_SVG_WIDTH not in data
    assert errors == {}


def test_normalize_options_invalid_type() -> None:
    user_input: dict[str, object] = {CONF_SVG_HEIGHT: {"bad": 1}}

    normalize_options = cast(
        Callable[[dict[str, object]], tuple[dict[str, object], dict[str, str]]],
        getattr(config_flow_module, "_normalize_options"),
    )
    _data, errors = normalize_options(user_input)

    assert CONF_SVG_HEIGHT in errors
    assert errors[CONF_SVG_HEIGHT] == "expected_int"


def test_prepare_entry_data_strips_trailing_slash() -> None:
    user_input = _base_input()
    user_input[CONF_URL] = "https://unifi.local/"

    prepare_entry_data = cast(
        Callable[[dict[str, object]], dict[str, object]],
        getattr(config_flow_module, "_prepare_entry_data"),
    )
    data = prepare_entry_data(user_input)

    assert data[CONF_URL] == "https://unifi.local"


def test_build_options_schema_returns_schema(monkeypatch) -> None:
    def _fields(_options: dict[str, object]) -> dict[str, object]:
        return {}

    monkeypatch.setattr(config_flow_module, "_options_schema_fields", _fields)
    build_options_schema = cast(
        Callable[[dict[str, object]], config_flow_module.vol.Schema],
        getattr(config_flow_module, "_build_options_schema"),
    )
    schema = build_options_schema({})

    assert isinstance(schema, config_flow_module.vol.Schema)


def test_step_user_rejects_empty_username(monkeypatch):
    def _validate(*_args: object, **_kwargs: object) -> None:
        return None

    monkeypatch.setattr(config_flow_module, "validate_unifi_credentials", _validate)
    bad_input = _base_input()
    bad_input[CONF_USERNAME] = "   "
    result = _run(_make_flow().async_step_user(bad_input))

    assert result["type"] == "form"
    assert result["errors"]["base"] == "empty_credential"


def test_step_user_rejects_empty_password(monkeypatch):
    def _validate(*_args: object, **_kwargs: object) -> None:
        return None

    monkeypatch.setattr(config_flow_module, "validate_unifi_credentials", _validate)
    bad_input = _base_input()
    bad_input[CONF_PASSWORD] = ""
    result = _run(_make_flow().async_step_user(bad_input))

    assert result["type"] == "form"
    assert result["errors"]["base"] == "empty_credential"


def test_step_user_rejects_empty_site(monkeypatch):
    def _validate(*_args: object, **_kwargs: object) -> None:
        return None

    monkeypatch.setattr(config_flow_module, "validate_unifi_credentials", _validate)
    bad_input = _base_input()
    bad_input[CONF_SITE] = ""
    result = _run(_make_flow().async_step_user(bad_input))

    assert result["type"] == "form"
    assert result["errors"]["base"] == "empty_credential"


def test_step_user_rejects_invalid_port(monkeypatch):
    def _validate(*_args: object, **_kwargs: object) -> None:
        return None

    monkeypatch.setattr(config_flow_module, "validate_unifi_credentials", _validate)
    bad_input = _base_input()
    bad_input[CONF_URL] = "https://unifi.local:99999"
    result = _run(_make_flow().async_step_user(bad_input))

    assert result["type"] == "form"
    assert result["errors"]["base"] == "invalid_port"


def test_step_user_strips_url_whitespace(monkeypatch):
    def _validate(*_args: object, **_kwargs: object) -> None:
        return None

    monkeypatch.setattr(config_flow_module, "validate_unifi_credentials", _validate)
    input_data = _base_input()
    input_data[CONF_URL] = "  https://unifi.local/  "
    result = _run(_make_flow().async_step_user(input_data))

    assert result["type"] == "create_entry"
    assert result["data"][CONF_URL] == "https://unifi.local"


def test_step_user_rejects_empty_url(monkeypatch):
    def _validate(*_args: object, **_kwargs: object) -> None:
        return None

    monkeypatch.setattr(config_flow_module, "validate_unifi_credentials", _validate)
    bad_input = _base_input()
    bad_input[CONF_URL] = ""
    result = _run(_make_flow().async_step_user(bad_input))

    assert result["type"] == "form"
    assert result["errors"]["base"] == "invalid_url"
