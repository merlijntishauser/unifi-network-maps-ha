from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.const import CONF_PASSWORD, CONF_URL, CONF_USERNAME
from homeassistant.helpers import selector
from yarl import URL

from .api import validate_unifi_credentials
from .const import (
    CONF_CLIENT_SCOPE,
    CONF_INCLUDE_CLIENTS,
    CONF_INCLUDE_PORTS,
    CONF_ONLY_UNIFI,
    CONF_SCAN_INTERVAL,
    CONF_SITE,
    CONF_SVG_HEIGHT,
    CONF_SVG_ISOMETRIC,
    CONF_SVG_WIDTH,
    CONF_USE_CACHE,
    CONF_VERIFY_SSL,
    DEFAULT_CLIENT_SCOPE,
    DEFAULT_INCLUDE_CLIENTS,
    DEFAULT_INCLUDE_PORTS,
    DEFAULT_ONLY_UNIFI,
    DEFAULT_SCAN_INTERVAL_MINUTES,
    DEFAULT_SITE,
    DEFAULT_SVG_ISOMETRIC,
    DEFAULT_USE_CACHE,
    DEFAULT_VERIFY_SSL,
    DOMAIN,
    MAX_SCAN_INTERVAL_MINUTES,
    MIN_SCAN_INTERVAL_MINUTES,
)
from .errors import CannotConnect, InvalidAuth, InvalidUrl, UrlHasCredentials


class UniFiNetworkMapConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None):
        errors: dict[str, str] = {}
        if user_input is not None:
            data, error = await self._validate_user_input(user_input)
            if error:
                errors["base"] = error
            else:
                title = _build_entry_title(data)
                return self.async_create_entry(title=title, data=data)

        return self.async_show_form(
            step_id="user",
            data_schema=_build_schema(),
            errors=errors,
        )

    async def _async_validate_auth(self, data: dict[str, Any]) -> None:
        await self.hass.async_add_executor_job(
            validate_unifi_credentials,
            data[CONF_URL],
            data[CONF_USERNAME],
            data[CONF_PASSWORD],
            data[CONF_SITE],
            data[CONF_VERIFY_SSL],
        )

    async def _validate_user_input(
        self, user_input: dict[str, Any]
    ) -> tuple[dict[str, Any], str | None]:
        try:
            data = _prepare_entry_data(user_input)
            await self._async_validate_auth(data)
        except InvalidUrl:
            return user_input, "invalid_url"
        except UrlHasCredentials:
            return user_input, "url_has_credentials"
        except InvalidAuth:
            return user_input, "invalid_auth"
        except CannotConnect:
            return user_input, "cannot_connect"
        return data, None

    @staticmethod
    def async_get_options_flow(
        config_entry: config_entries.ConfigEntry,
    ) -> config_entries.OptionsFlow:
        return UniFiNetworkMapOptionsFlow(config_entry)


class UniFiNetworkMapOptionsFlow(config_entries.OptionsFlow):
    def __init__(self, config_entry: config_entries.ConfigEntry) -> None:
        self._entry = config_entry

    async def async_step_init(self, user_input: dict[str, Any] | None = None):
        if user_input is not None:
            data, errors = _normalize_options(user_input)
            if errors:
                return self.async_show_form(
                    step_id="init",
                    data_schema=_build_options_schema(self._entry.options),
                    errors=errors,
                )
            return self.async_create_entry(title="", data=data)

        return self.async_show_form(
            step_id="init",
            data_schema=_build_options_schema(self._entry.options),
        )


def _build_schema() -> vol.Schema:
    return vol.Schema(
        {
            vol.Required(CONF_URL): str,
            vol.Required(CONF_USERNAME): str,
            vol.Required(CONF_PASSWORD): str,
            vol.Required(CONF_SITE, default=DEFAULT_SITE): str,
            vol.Optional(CONF_VERIFY_SSL, default=DEFAULT_VERIFY_SSL): bool,
        }
    )


def _build_options_schema(options: dict[str, Any]) -> vol.Schema:
    return vol.Schema(_options_schema_fields(options))


def _options_schema_fields(options: dict[str, Any]) -> dict[vol.Marker, object]:
    def opt(key: str, default: object) -> vol.Optional:
        return vol.Optional(key, default=options.get(key, default))

    return {
        opt(CONF_SCAN_INTERVAL, DEFAULT_SCAN_INTERVAL_MINUTES): _scan_interval_selector(),
        opt(CONF_INCLUDE_PORTS, DEFAULT_INCLUDE_PORTS): _boolean_selector(),
        opt(CONF_INCLUDE_CLIENTS, DEFAULT_INCLUDE_CLIENTS): _boolean_selector(),
        opt(CONF_CLIENT_SCOPE, DEFAULT_CLIENT_SCOPE): _client_scope_selector(),
        opt(CONF_ONLY_UNIFI, DEFAULT_ONLY_UNIFI): _boolean_selector(),
        opt(CONF_SVG_ISOMETRIC, DEFAULT_SVG_ISOMETRIC): _boolean_selector(),
        opt(CONF_USE_CACHE, DEFAULT_USE_CACHE): _boolean_selector(),
    }


def _boolean_selector() -> selector.BooleanSelector:
    return selector.BooleanSelector()


def _scan_interval_selector() -> selector.NumberSelector:
    return selector.NumberSelector(
        selector.NumberSelectorConfig(
            min=MIN_SCAN_INTERVAL_MINUTES,
            max=MAX_SCAN_INTERVAL_MINUTES,
            step=1,
            unit_of_measurement="minutes",
            mode=selector.NumberSelectorMode.BOX,
        )
    )


def _client_scope_selector() -> selector.SelectSelector:
    return selector.SelectSelector(
        selector.SelectSelectorConfig(
            options=[
                selector.SelectOptionDict(value="wired", label="Wired"),
                selector.SelectOptionDict(value="wireless", label="Wireless"),
                selector.SelectOptionDict(value="all", label="All"),
            ],
            mode=selector.SelectSelectorMode.DROPDOWN,
        )
    )


def _normalize_options(user_input: dict[str, Any]) -> tuple[dict[str, Any], dict[str, str]]:
    cleaned = dict(user_input)
    errors: dict[str, str] = {}
    for key in (CONF_SVG_WIDTH, CONF_SVG_HEIGHT):
        value = cleaned.get(key)
        if value in ("", None):
            cleaned.pop(key, None)
            continue
        if isinstance(value, (int, float)):
            cleaned[key] = int(value)
            continue
        if isinstance(value, str):
            stripped = value.strip()
            if not stripped:
                cleaned.pop(key, None)
                continue
            try:
                cleaned[key] = int(float(stripped))
                continue
            except ValueError:
                errors[key] = "expected_int"
                continue
        errors[key] = "expected_int"
    return cleaned, errors


def _prepare_entry_data(user_input: dict[str, Any]) -> dict[str, Any]:
    normalized_url = _normalize_url(user_input[CONF_URL])
    _validate_url(normalized_url)
    return {**user_input, CONF_URL: normalized_url}


def _normalize_url(url: str) -> str:
    return url.rstrip("/")


def _validate_url(url: str) -> None:
    parsed = URL(url)
    if parsed.scheme not in {"http", "https"} or not parsed.host:
        raise InvalidUrl
    if parsed.user or parsed.password:
        raise UrlHasCredentials


def _build_entry_title(data: dict[str, Any]) -> str:
    site = data.get(CONF_SITE, DEFAULT_SITE)
    return f"UniFi Network Map ({site})"
