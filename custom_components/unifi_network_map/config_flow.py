from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.const import CONF_PASSWORD, CONF_URL, CONF_USERNAME
from yarl import URL

from .api import validate_unifi_credentials
from .const import (
    CLIENT_SCOPE_OPTIONS,
    CONF_CLIENT_SCOPE,
    CONF_INCLUDE_CLIENTS,
    CONF_INCLUDE_PORTS,
    CONF_ONLY_UNIFI,
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
    DEFAULT_SITE,
    DEFAULT_SVG_ISOMETRIC,
    DEFAULT_USE_CACHE,
    DEFAULT_VERIFY_SSL,
    DOMAIN,
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
                return self.async_create_entry(title=data[CONF_URL], data=data)

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
            return self.async_create_entry(title="", data=user_input)

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
    width_default = options.get(CONF_SVG_WIDTH)
    height_default = options.get(CONF_SVG_HEIGHT)
    return {
        _bool_option(CONF_INCLUDE_PORTS, options, DEFAULT_INCLUDE_PORTS): bool,
        _bool_option(CONF_INCLUDE_CLIENTS, options, DEFAULT_INCLUDE_CLIENTS): bool,
        _choice_option(CONF_CLIENT_SCOPE, options, DEFAULT_CLIENT_SCOPE): vol.In(
            CLIENT_SCOPE_OPTIONS
        ),
        _bool_option(CONF_ONLY_UNIFI, options, DEFAULT_ONLY_UNIFI): bool,
        _bool_option(CONF_SVG_ISOMETRIC, options, DEFAULT_SVG_ISOMETRIC): bool,
        _size_option(CONF_SVG_WIDTH, width_default): _create_svg_size_validator(),
        _size_option(CONF_SVG_HEIGHT, height_default): _create_svg_size_validator(),
        _bool_option(CONF_USE_CACHE, options, DEFAULT_USE_CACHE): bool,
    }


def _bool_option(key: str, options: dict[str, Any], default: object) -> vol.Optional:
    return vol.Optional(key, default=options.get(key, default))


def _choice_option(key: str, options: dict[str, Any], default: object) -> vol.Optional:
    return vol.Optional(key, default=options.get(key, default))


def _size_option(key: str, default: object) -> vol.Optional:
    return vol.Optional(key, default=default)


def _create_svg_size_validator() -> vol.Schema:
    return vol.Any(None, vol.All(vol.Coerce(int), vol.Range(min=100, max=5000)))


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
