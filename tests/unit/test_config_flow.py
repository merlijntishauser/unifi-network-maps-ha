from __future__ import annotations

from typing import TYPE_CHECKING, cast

from homeassistant.const import CONF_PASSWORD, CONF_URL, CONF_USERNAME

from custom_components.unifi_network_map import (
    config_flow as config_flow_module,
)
from custom_components.unifi_network_map.const import (
    CONF_SHOW_WAN,
    CONF_SITE,
    CONF_SVG_HEIGHT,
    CONF_SVG_WIDTH,
    CONF_VERIFY_SSL,
    CONF_WAN2_DISABLED,
    CONF_WAN2_LABEL,
    CONF_WAN2_SPEED,
    CONF_WAN_LABEL,
    CONF_WAN_SPEED,
    DEFAULT_SITE,
    DEFAULT_VERIFY_SSL,
)
from custom_components.unifi_network_map.errors import (
    CannotConnect,
    InvalidAuth,
)

if TYPE_CHECKING:
    from collections.abc import Callable


class FakeHass:
    async def async_add_executor_job(self, func, *args: object):
        return func(*args)


class FakeEntry:
    def __init__(self, options: dict[str, object] | None = None) -> None:
        self.options = options or {}
        self.entry_id = "test_entry_id"


def _make_flow():
    flow = config_flow_module.UniFiNetworkMapConfigFlow()
    flow.hass = FakeHass()
    flow._unique_id = None

    async def _async_set_unique_id(uid):
        flow._unique_id = uid

    flow.async_set_unique_id = _async_set_unique_id
    flow._abort_if_unique_id_configured = lambda: None
    return flow


def _make_reauth_flow(entry_data=None):
    flow = config_flow_module.UniFiNetworkMapConfigFlow()
    flow.hass = FakeHass()

    reauth_entry = FakeEntry()
    reauth_entry.data = entry_data or _base_input()

    flow._get_reauth_entry = lambda: reauth_entry

    def _update_reload_abort(entry, *, data=None, **_kw):
        if data is not None:
            entry.data = data
        return {"type": "abort", "reason": "reauth_successful"}

    flow.async_update_reload_and_abort = _update_reload_abort
    return flow


def _make_reconfigure_flow(entry_data=None):
    flow = config_flow_module.UniFiNetworkMapConfigFlow()
    flow.hass = FakeHass()

    reconfigure_entry = FakeEntry()
    reconfigure_entry.data = entry_data or _base_input()

    flow._get_reconfigure_entry = lambda: reconfigure_entry

    def _update_reload_abort(
        entry, *, data=None, unique_id=None, title=None, **_kw
    ):
        if data is not None:
            entry.data = data
        return {"type": "abort", "reason": "reconfigure_successful"}

    flow.async_update_reload_and_abort = _update_reload_abort
    return flow


def _base_input() -> dict[str, object]:
    return {
        CONF_URL: "https://unifi.local/",
        CONF_USERNAME: "admin",
        CONF_PASSWORD: "secret",
        CONF_SITE: DEFAULT_SITE,
        CONF_VERIFY_SSL: DEFAULT_VERIFY_SSL,
    }


async def test_step_user_creates_entry_on_success(monkeypatch):
    def _validate(*_args: object, **_kwargs: object) -> None:
        return None

    monkeypatch.setattr(
        config_flow_module, "validate_unifi_credentials", _validate
    )
    result = await _make_flow().async_step_user(_base_input())

    assert result["type"] == "create_entry"
    assert result["title"] == "UniFi Network Map (default)"
    assert result["data"][CONF_URL] == "https://unifi.local"


async def test_step_user_reports_invalid_auth(monkeypatch):
    def _validate(*_args: object, **_kwargs: object) -> None:
        raise InvalidAuth("bad auth")

    monkeypatch.setattr(
        config_flow_module, "validate_unifi_credentials", _validate
    )
    result = await _make_flow().async_step_user(_base_input())

    assert result["type"] == "form"
    assert result["errors"]["base"] == "invalid_auth"


async def test_step_user_reports_cannot_connect(monkeypatch):
    def _validate(*_args: object, **_kwargs: object) -> None:
        raise CannotConnect("no route")

    monkeypatch.setattr(
        config_flow_module, "validate_unifi_credentials", _validate
    )
    result = await _make_flow().async_step_user(_base_input())

    assert result["type"] == "form"
    assert result["errors"]["base"] == "cannot_connect"


async def test_step_user_reports_invalid_url(monkeypatch):
    def _validate(*_args: object, **_kwargs: object) -> None:
        return None

    monkeypatch.setattr(
        config_flow_module, "validate_unifi_credentials", _validate
    )
    bad_input = _base_input()
    bad_input[CONF_URL] = "not-a-url"
    result = await _make_flow().async_step_user(bad_input)

    assert result["type"] == "form"
    assert result["errors"]["base"] == "invalid_url"


async def test_step_user_rejects_url_with_credentials(monkeypatch):
    def _validate(*_args: object, **_kwargs: object) -> None:
        return None

    monkeypatch.setattr(
        config_flow_module, "validate_unifi_credentials", _validate
    )
    bad_input = _base_input()
    bad_input[CONF_URL] = "https://user:pass@unifi.local/"
    result = await _make_flow().async_step_user(bad_input)

    assert result["type"] == "form"
    assert result["errors"]["base"] == "url_has_credentials"


async def test_options_flow_returns_form_without_input(monkeypatch):
    flow = config_flow_module.UniFiNetworkMapOptionsFlow(FakeEntry())

    def _schema(_options):
        return config_flow_module.vol.Schema({})

    monkeypatch.setattr(config_flow_module, "_build_options_schema", _schema)
    result = await flow.async_step_init()

    assert result["type"] == "form"
    assert result["step_id"] == "init"


async def test_options_flow_filters_empty_svg_sizes():
    flow = config_flow_module.UniFiNetworkMapOptionsFlow(FakeEntry())
    user_input = {
        "include_ports": True,
        CONF_SVG_WIDTH: "",
        CONF_SVG_HEIGHT: None,
    }

    result = await flow.async_step_init(user_input)

    assert result["type"] == "create_entry"
    assert CONF_SVG_WIDTH not in result["data"]
    assert CONF_SVG_HEIGHT not in result["data"]


async def test_options_flow_reports_invalid_svg_size(monkeypatch):
    flow = config_flow_module.UniFiNetworkMapOptionsFlow(FakeEntry())
    user_input = {
        CONF_SVG_WIDTH: "abc",
    }

    def _schema(_options):
        return config_flow_module.vol.Schema({})

    monkeypatch.setattr(config_flow_module, "_build_options_schema", _schema)
    result = await flow.async_step_init(user_input)

    assert result["type"] == "form"
    assert result["errors"][CONF_SVG_WIDTH] == "expected_int"


def test_async_get_options_flow_returns_options_flow() -> None:
    entry = FakeEntry()
    flow = config_flow_module.UniFiNetworkMapConfigFlow.async_get_options_flow(
        entry
    )

    assert isinstance(flow, config_flow_module.UniFiNetworkMapOptionsFlow)


def test_options_schema_fields_use_entry_defaults() -> None:
    options: dict[str, object] = {"include_ports": True}
    options_schema_fields = cast(
        "Callable[[dict[str, object]], dict[str, object]]",
        getattr(config_flow_module, "_options_schema_fields"),
    )
    fields = options_schema_fields(options)

    include_ports_marker = next(
        marker
        for marker in fields
        if getattr(marker, "schema", None) == "include_ports"
    )

    default_value = (
        include_ports_marker.default()
        if callable(include_ports_marker.default)
        else include_ports_marker.default
    )

    assert default_value is True


def test_boolean_selector_returns_instance() -> None:
    boolean_selector = cast(
        "Callable[[], config_flow_module.selector.BooleanSelector]",
        getattr(config_flow_module, "_boolean_selector"),
    )
    selector_instance = boolean_selector()

    assert isinstance(
        selector_instance, config_flow_module.selector.BooleanSelector
    )


def test_client_scope_selector_returns_instance() -> None:
    client_scope_selector = cast(
        "Callable[[], config_flow_module.selector.SelectSelector]",
        getattr(config_flow_module, "_client_scope_selector"),
    )
    selector_instance = client_scope_selector()

    assert isinstance(
        selector_instance, config_flow_module.selector.SelectSelector
    )


def test_normalize_options_casts_numeric_strings() -> None:
    user_input: dict[str, object] = {
        CONF_SVG_WIDTH: " 120.5 ",
        CONF_SVG_HEIGHT: 80.2,
    }

    normalize_options = cast(
        "Callable["
        "[dict[str, object]],"
        " tuple[dict[str, object], dict[str, str]]]",
        getattr(config_flow_module, "_normalize_options"),
    )
    data, errors = normalize_options(user_input)

    assert data[CONF_SVG_WIDTH] == 120
    assert data[CONF_SVG_HEIGHT] == 80
    assert errors == {}


def test_normalize_options_strips_empty_string() -> None:
    user_input: dict[str, object] = {CONF_SVG_WIDTH: "   "}

    normalize_options = cast(
        "Callable["
        "[dict[str, object]],"
        " tuple[dict[str, object], dict[str, str]]]",
        getattr(config_flow_module, "_normalize_options"),
    )
    data, errors = normalize_options(user_input)

    assert CONF_SVG_WIDTH not in data
    assert errors == {}


def test_normalize_options_invalid_type() -> None:
    user_input: dict[str, object] = {CONF_SVG_HEIGHT: {"bad": 1}}

    normalize_options = cast(
        "Callable["
        "[dict[str, object]],"
        " tuple[dict[str, object], dict[str, str]]]",
        getattr(config_flow_module, "_normalize_options"),
    )
    _data, errors = normalize_options(user_input)

    assert CONF_SVG_HEIGHT in errors
    assert errors[CONF_SVG_HEIGHT] == "expected_int"


def test_prepare_entry_data_strips_trailing_slash() -> None:
    user_input = _base_input()
    user_input[CONF_URL] = "https://unifi.local/"

    prepare_entry_data = cast(
        "Callable[[dict[str, object]], dict[str, object]]",
        getattr(config_flow_module, "_prepare_entry_data"),
    )
    data = prepare_entry_data(user_input)

    assert data[CONF_URL] == "https://unifi.local"


def test_build_options_schema_returns_schema(monkeypatch) -> None:
    def _fields(_options: dict[str, object]) -> dict[str, object]:
        return {}

    monkeypatch.setattr(config_flow_module, "_options_schema_fields", _fields)
    build_options_schema = cast(
        "Callable[[dict[str, object]], config_flow_module.vol.Schema]",
        getattr(config_flow_module, "_build_options_schema"),
    )
    schema = build_options_schema({})

    assert isinstance(schema, config_flow_module.vol.Schema)


async def test_step_user_rejects_empty_username(monkeypatch):
    def _validate(*_args: object, **_kwargs: object) -> None:
        return None

    monkeypatch.setattr(
        config_flow_module, "validate_unifi_credentials", _validate
    )
    bad_input = _base_input()
    bad_input[CONF_USERNAME] = "   "
    result = await _make_flow().async_step_user(bad_input)

    assert result["type"] == "form"
    assert result["errors"]["base"] == "empty_credential"


async def test_step_user_rejects_empty_password(monkeypatch):
    def _validate(*_args: object, **_kwargs: object) -> None:
        return None

    monkeypatch.setattr(
        config_flow_module, "validate_unifi_credentials", _validate
    )
    bad_input = _base_input()
    bad_input[CONF_PASSWORD] = ""
    result = await _make_flow().async_step_user(bad_input)

    assert result["type"] == "form"
    assert result["errors"]["base"] == "empty_credential"


async def test_step_user_rejects_empty_site(monkeypatch):
    def _validate(*_args: object, **_kwargs: object) -> None:
        return None

    monkeypatch.setattr(
        config_flow_module, "validate_unifi_credentials", _validate
    )
    bad_input = _base_input()
    bad_input[CONF_SITE] = ""
    result = await _make_flow().async_step_user(bad_input)

    assert result["type"] == "form"
    assert result["errors"]["base"] == "empty_credential"


async def test_step_user_rejects_invalid_port(monkeypatch):
    def _validate(*_args: object, **_kwargs: object) -> None:
        return None

    monkeypatch.setattr(
        config_flow_module, "validate_unifi_credentials", _validate
    )
    bad_input = _base_input()
    bad_input[CONF_URL] = "https://unifi.local:99999"
    result = await _make_flow().async_step_user(bad_input)

    assert result["type"] == "form"
    assert result["errors"]["base"] == "invalid_port"


async def test_step_user_strips_url_whitespace(monkeypatch):
    def _validate(*_args: object, **_kwargs: object) -> None:
        return None

    monkeypatch.setattr(
        config_flow_module, "validate_unifi_credentials", _validate
    )
    input_data = _base_input()
    input_data[CONF_URL] = "  https://unifi.local/  "
    result = await _make_flow().async_step_user(input_data)

    assert result["type"] == "create_entry"
    assert result["data"][CONF_URL] == "https://unifi.local"


async def test_step_user_rejects_empty_url(monkeypatch):
    def _validate(*_args: object, **_kwargs: object) -> None:
        return None

    monkeypatch.setattr(
        config_flow_module, "validate_unifi_credentials", _validate
    )
    bad_input = _base_input()
    bad_input[CONF_URL] = ""
    result = await _make_flow().async_step_user(bad_input)

    assert result["type"] == "form"
    assert result["errors"]["base"] == "invalid_url"


async def test_options_flow_passes_wan_fields():
    flow = config_flow_module.UniFiNetworkMapOptionsFlow(FakeEntry())
    user_input = {
        "include_ports": True,
        CONF_SHOW_WAN: True,
        CONF_WAN_LABEL: "KPN Fiber",
        CONF_WAN_SPEED: "1 Gbps",
        CONF_WAN2_LABEL: "Backup",
        CONF_WAN2_SPEED: "100 Mbps",
        CONF_WAN2_DISABLED: "auto",
    }

    result = await flow.async_step_init(user_input)

    assert result["type"] == "create_entry"
    assert result["data"][CONF_SHOW_WAN] is True
    assert result["data"][CONF_WAN_LABEL] == "KPN Fiber"
    assert result["data"][CONF_WAN_SPEED] == "1 Gbps"
    assert result["data"][CONF_WAN2_LABEL] == "Backup"
    assert result["data"][CONF_WAN2_SPEED] == "100 Mbps"
    assert result["data"][CONF_WAN2_DISABLED] == "auto"


def test_options_schema_includes_wan_fields() -> None:
    options_schema_fields = cast(
        "Callable[[dict[str, object]], dict[str, object]]",
        getattr(config_flow_module, "_options_schema_fields"),
    )
    fields = options_schema_fields({})

    field_names = {getattr(marker, "schema", None) for marker in fields}
    assert CONF_SHOW_WAN in field_names
    assert CONF_WAN_LABEL in field_names
    assert CONF_WAN_SPEED in field_names
    assert CONF_WAN2_LABEL in field_names
    assert CONF_WAN2_SPEED in field_names
    assert CONF_WAN2_DISABLED in field_names


def test_text_selector_returns_instance() -> None:
    text_selector = cast(
        "Callable[[], config_flow_module.selector.TextSelector]",
        getattr(config_flow_module, "_text_selector"),
    )
    selector_instance = text_selector()

    assert isinstance(
        selector_instance, config_flow_module.selector.TextSelector
    )


def test_wan2_disabled_selector_returns_instance() -> None:
    wan2_disabled_selector = cast(
        "Callable[[], config_flow_module.selector.SelectSelector]",
        getattr(config_flow_module, "_wan2_disabled_selector"),
    )
    selector_instance = wan2_disabled_selector()

    assert isinstance(
        selector_instance, config_flow_module.selector.SelectSelector
    )


async def test_reauth_shows_confirm_form():
    flow = _make_reauth_flow()
    result = await flow.async_step_reauth(entry_data=_base_input())

    assert result["type"] == "form"
    assert result["step_id"] == "reauth_confirm"


async def test_reauth_confirm_success(monkeypatch):
    def _validate(*_args: object, **_kwargs: object) -> None:
        return None

    monkeypatch.setattr(
        config_flow_module, "validate_unifi_credentials", _validate
    )
    flow = _make_reauth_flow()
    result = await flow.async_step_reauth_confirm(
        {CONF_USERNAME: "newadmin", CONF_PASSWORD: "newsecret"}
    )

    assert result["type"] == "abort"
    assert result["reason"] == "reauth_successful"


async def test_reauth_confirm_invalid_auth(monkeypatch):
    def _validate(*_args: object, **_kwargs: object) -> None:
        raise InvalidAuth("bad auth")

    monkeypatch.setattr(
        config_flow_module, "validate_unifi_credentials", _validate
    )
    flow = _make_reauth_flow()
    result = await flow.async_step_reauth_confirm(
        {CONF_USERNAME: "wrong", CONF_PASSWORD: "wrong"}
    )

    assert result["type"] == "form"
    assert result["errors"]["base"] == "invalid_auth"


async def test_reauth_confirm_cannot_connect(monkeypatch):
    def _validate(*_args: object, **_kwargs: object) -> None:
        raise CannotConnect("no route")

    monkeypatch.setattr(
        config_flow_module, "validate_unifi_credentials", _validate
    )
    flow = _make_reauth_flow()
    result = await flow.async_step_reauth_confirm(
        {CONF_USERNAME: "admin", CONF_PASSWORD: "secret"}
    )

    assert result["type"] == "form"
    assert result["errors"]["base"] == "cannot_connect"


async def test_reconfigure_shows_form_with_current_values():
    flow = _make_reconfigure_flow()
    result = await flow.async_step_reconfigure(None)

    assert result["type"] == "form"
    assert result["step_id"] == "reconfigure"


async def test_reconfigure_success(monkeypatch):
    def _validate(*_args: object, **_kwargs: object) -> None:
        return None

    monkeypatch.setattr(
        config_flow_module,
        "validate_unifi_credentials",
        _validate,
    )
    flow = _make_reconfigure_flow()
    new_input = _base_input()
    new_input[CONF_URL] = "https://new-controller.local"
    result = await flow.async_step_reconfigure(new_input)

    assert result["type"] == "abort"
    assert result["reason"] == "reconfigure_successful"


async def test_reconfigure_invalid_auth(monkeypatch):
    def _validate(*_args: object, **_kwargs: object) -> None:
        raise InvalidAuth("bad auth")

    monkeypatch.setattr(
        config_flow_module,
        "validate_unifi_credentials",
        _validate,
    )
    flow = _make_reconfigure_flow()
    result = await flow.async_step_reconfigure(_base_input())

    assert result["type"] == "form"
    assert result["errors"]["base"] == "invalid_auth"


async def test_reconfigure_cannot_connect(monkeypatch):
    def _validate(*_args: object, **_kwargs: object) -> None:
        raise CannotConnect("no route")

    monkeypatch.setattr(
        config_flow_module,
        "validate_unifi_credentials",
        _validate,
    )
    flow = _make_reconfigure_flow()
    result = await flow.async_step_reconfigure(_base_input())

    assert result["type"] == "form"
    assert result["errors"]["base"] == "cannot_connect"


async def test_step_user_preserves_input_on_error(monkeypatch):
    def _validate(*_args: object, **_kwargs: object) -> None:
        raise InvalidAuth("bad auth")

    monkeypatch.setattr(
        config_flow_module, "validate_unifi_credentials", _validate
    )
    result = await _make_flow().async_step_user(_base_input())

    assert result["type"] == "form"
    assert result["errors"]["base"] == "invalid_auth"
    schema = result["data_schema"]
    suggested = {
        k.schema: k.description.get("suggested_value")
        for k in schema.schema
        if hasattr(k, "description") and k.description
    }
    assert suggested[CONF_URL] == "https://unifi.local/"
    assert suggested[CONF_USERNAME] == "admin"
    assert suggested[CONF_SITE] == DEFAULT_SITE
    assert CONF_PASSWORD not in suggested


async def test_reconfigure_invalid_url(monkeypatch):
    def _validate(*_args: object, **_kwargs: object) -> None:
        return None

    monkeypatch.setattr(
        config_flow_module,
        "validate_unifi_credentials",
        _validate,
    )
    flow = _make_reconfigure_flow()
    bad_input = _base_input()
    bad_input[CONF_URL] = "not-a-url"
    result = await flow.async_step_reconfigure(bad_input)

    assert result["type"] == "form"
    assert result["errors"]["base"] == "invalid_url"
