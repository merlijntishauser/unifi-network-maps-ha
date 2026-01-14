from __future__ import annotations

import asyncio

from custom_components.unifi_network_map import config_flow as config_flow_module
from custom_components.unifi_network_map.const import (
    CONF_SITE,
    CONF_VERIFY_SSL,
    DEFAULT_SITE,
    DEFAULT_VERIFY_SSL,
)
from custom_components.unifi_network_map.errors import CannotConnect, InvalidAuth
from homeassistant.const import CONF_PASSWORD, CONF_URL, CONF_USERNAME


class FakeHass:
    async def async_add_executor_job(self, func, *args: object):
        return func(*args)


def _run(coro):
    return asyncio.run(coro)


def _make_flow():
    flow = config_flow_module.UniFiNetworkMapConfigFlow()
    flow.hass = FakeHass()
    return flow


def _base_input():
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
    assert result["title"] == "https://unifi.local"
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
