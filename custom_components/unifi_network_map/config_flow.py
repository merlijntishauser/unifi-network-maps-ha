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
            try:
                data = _prepare_entry_data(user_input)
                await self._async_validate_auth(data)
            except InvalidUrl:
                errors["base"] = "invalid_url"
            except UrlHasCredentials:
                errors["base"] = "url_has_credentials"
            except InvalidAuth:
                errors["base"] = "invalid_auth"
            except CannotConnect:
                errors["base"] = "cannot_connect"
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
    width_default = options.get(CONF_SVG_WIDTH)
    height_default = options.get(CONF_SVG_HEIGHT)
    return vol.Schema(
        {
            vol.Optional(
                CONF_INCLUDE_PORTS,
                default=options.get(CONF_INCLUDE_PORTS, DEFAULT_INCLUDE_PORTS),
            ): bool,
            vol.Optional(
                CONF_INCLUDE_CLIENTS,
                default=options.get(CONF_INCLUDE_CLIENTS, DEFAULT_INCLUDE_CLIENTS),
            ): bool,
            vol.Optional(
                CONF_CLIENT_SCOPE,
                default=options.get(CONF_CLIENT_SCOPE, DEFAULT_CLIENT_SCOPE),
            ): vol.In(CLIENT_SCOPE_OPTIONS),
            vol.Optional(
                CONF_ONLY_UNIFI,
                default=options.get(CONF_ONLY_UNIFI, DEFAULT_ONLY_UNIFI),
            ): bool,
            vol.Optional(
                CONF_SVG_ISOMETRIC,
                default=options.get(CONF_SVG_ISOMETRIC, DEFAULT_SVG_ISOMETRIC),
            ): bool,
            vol.Optional(CONF_SVG_WIDTH, default=width_default): _svg_size_validator(),
            vol.Optional(CONF_SVG_HEIGHT, default=height_default): _svg_size_validator(),
            vol.Optional(
                CONF_USE_CACHE,
                default=options.get(CONF_USE_CACHE, DEFAULT_USE_CACHE),
            ): bool,
        }
    )


def _svg_size_validator() -> vol.Schema:
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
