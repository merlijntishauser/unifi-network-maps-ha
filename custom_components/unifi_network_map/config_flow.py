from __future__ import annotations
# pyright: reportUntypedBaseClass=false, reportCallIssue=false

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
    CONF_PAYLOAD_CACHE_TTL,
    CONF_REQUEST_TIMEOUT_SECONDS,
    CONF_SCAN_INTERVAL,
    CONF_SITE,
    CONF_SVG_HEIGHT,
    CONF_SVG_ISOMETRIC,
    CONF_SVG_WIDTH,
    CONF_TRACKED_CLIENTS,
    CONF_USE_CACHE,
    CONF_VERIFY_SSL,
    DEFAULT_CLIENT_SCOPE,
    DEFAULT_INCLUDE_CLIENTS,
    DEFAULT_INCLUDE_PORTS,
    DEFAULT_ONLY_UNIFI,
    DEFAULT_PAYLOAD_CACHE_TTL_SECONDS,
    DEFAULT_REQUEST_TIMEOUT_SECONDS,
    DEFAULT_SCAN_INTERVAL_MINUTES,
    DEFAULT_SITE,
    DEFAULT_SVG_ISOMETRIC,
    DEFAULT_TRACKED_CLIENTS,
    DEFAULT_USE_CACHE,
    DEFAULT_VERIFY_SSL,
    DOMAIN,
    LOGGER,
    MAX_PAYLOAD_CACHE_TTL_SECONDS,
    MAX_SCAN_INTERVAL_MINUTES,
    MIN_PAYLOAD_CACHE_TTL_SECONDS,
    MIN_SCAN_INTERVAL_MINUTES,
)
from .errors import (
    CannotConnect,
    EmptyCredential,
    InvalidAuth,
    InvalidPort,
    InvalidUrl,
    UrlHasCredentials,
)


class UniFiNetworkMapConfigFlow(  # type: ignore[reportUntypedBaseClass,reportGeneralTypeIssues,reportCallIssue]
    config_entries.ConfigFlow, domain=DOMAIN
):
    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None):
        errors: dict[str, str] = {}
        if user_input is not None:
            LOGGER.debug(
                "config_flow user_step started url=%s site=%s",
                user_input.get(CONF_URL),
                user_input.get(CONF_SITE),
            )
            data, error = await self._validate_user_input(user_input)
            if error:
                LOGGER.debug("config_flow validation_failed error=%s", error)
                errors["base"] = error
            else:
                title = _build_entry_title(data)
                LOGGER.debug("config_flow entry_created title=%s", title)
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
        except InvalidPort:
            return user_input, "invalid_port"
        except EmptyCredential:
            return user_input, "empty_credential"
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


class UniFiNetworkMapOptionsFlow(config_entries.OptionsFlow):  # type: ignore[reportUntypedBaseClass]
    def __init__(self, config_entry: config_entries.ConfigEntry) -> None:
        self._entry = config_entry

    async def async_step_init(self, user_input: dict[str, Any] | None = None):
        if user_input is not None:
            LOGGER.debug("options_flow started entry_id=%s", self._entry.entry_id)
            data, errors = _normalize_options(user_input)
            if errors:
                LOGGER.debug("options_flow validation_failed errors=%s", list(errors.keys()))
                return self.async_show_form(
                    step_id="init",
                    data_schema=_build_options_schema(self._entry.options),
                    errors=errors,
                )
            LOGGER.debug(
                "options_flow completed entry_id=%s options=%s",
                self._entry.entry_id,
                list(data.keys()),
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
        opt(
            CONF_REQUEST_TIMEOUT_SECONDS, DEFAULT_REQUEST_TIMEOUT_SECONDS
        ): _request_timeout_selector(),
        opt(
            CONF_PAYLOAD_CACHE_TTL, DEFAULT_PAYLOAD_CACHE_TTL_SECONDS
        ): _payload_cache_ttl_selector(),
        opt(CONF_INCLUDE_PORTS, DEFAULT_INCLUDE_PORTS): _boolean_selector(),
        opt(CONF_INCLUDE_CLIENTS, DEFAULT_INCLUDE_CLIENTS): _boolean_selector(),
        opt(CONF_CLIENT_SCOPE, DEFAULT_CLIENT_SCOPE): _client_scope_selector(),
        opt(CONF_ONLY_UNIFI, DEFAULT_ONLY_UNIFI): _boolean_selector(),
        opt(CONF_SVG_ISOMETRIC, DEFAULT_SVG_ISOMETRIC): _boolean_selector(),
        opt(CONF_USE_CACHE, DEFAULT_USE_CACHE): _boolean_selector(),
        opt(CONF_TRACKED_CLIENTS, DEFAULT_TRACKED_CLIENTS): _tracked_clients_selector(),
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


def _request_timeout_selector() -> selector.NumberSelector:
    return selector.NumberSelector(
        selector.NumberSelectorConfig(
            min=5,
            max=120,
            step=1,
            unit_of_measurement="seconds",
            mode=selector.NumberSelectorMode.BOX,
        )
    )


def _payload_cache_ttl_selector() -> selector.NumberSelector:
    return selector.NumberSelector(
        selector.NumberSelectorConfig(
            min=MIN_PAYLOAD_CACHE_TTL_SECONDS,
            max=MAX_PAYLOAD_CACHE_TTL_SECONDS,
            step=5,
            unit_of_measurement="seconds",
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


def _tracked_clients_selector() -> selector.TextSelector:
    return selector.TextSelector(
        selector.TextSelectorConfig(
            multiline=True,
        )
    )


def _normalize_options(user_input: dict[str, Any]) -> tuple[dict[str, Any], dict[str, str]]:
    cleaned = dict(user_input)
    errors: dict[str, str] = {}
    for key in (CONF_SVG_WIDTH, CONF_SVG_HEIGHT, CONF_REQUEST_TIMEOUT_SECONDS):
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
    normalized_url = _normalize_url(user_input.get(CONF_URL, ""))
    _validate_url(normalized_url)
    _validate_credentials(user_input)
    return {**user_input, CONF_URL: normalized_url}


def _normalize_url(url: str) -> str:
    return url.strip().rstrip("/")


def _validate_url(url: str) -> None:
    if not url:
        raise InvalidUrl
    try:
        parsed = URL(url)
    except ValueError as err:
        if "port" in str(err).lower():
            raise InvalidPort from err
        raise InvalidUrl from err
    if parsed.scheme not in {"http", "https"} or not parsed.host:
        raise InvalidUrl
    if parsed.user or parsed.password:
        raise UrlHasCredentials


def _validate_credentials(user_input: dict[str, Any]) -> None:
    """Validate that required credential fields are not empty."""
    username = user_input.get(CONF_USERNAME, "")
    password = user_input.get(CONF_PASSWORD, "")
    site = user_input.get(CONF_SITE, "")
    if not isinstance(username, str) or not username.strip():
        raise EmptyCredential
    if not isinstance(password, str) or not password:
        raise EmptyCredential
    if not isinstance(site, str) or not site.strip():
        raise EmptyCredential


def _build_entry_title(data: dict[str, Any]) -> str:
    site = data.get(CONF_SITE, DEFAULT_SITE)
    return f"UniFi Network Map ({site})"
