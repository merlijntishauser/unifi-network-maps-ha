from __future__ import annotations

# pyright: reportUntypedBaseClass=false, reportCallIssue=false
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from collections.abc import Mapping

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.const import CONF_PASSWORD, CONF_URL, CONF_USERNAME
from homeassistant.helpers import selector
from yarl import URL

from .api import validate_unifi_credentials
from .const import (
    CONF_API_KEY,
    CONF_CLIENT_SCOPE,
    CONF_INCLUDE_CLIENTS,
    CONF_INCLUDE_PORTS,
    CONF_ONLY_UNIFI,
    CONF_PAYLOAD_CACHE_TTL,
    CONF_REQUEST_TIMEOUT_SECONDS,
    CONF_SCAN_INTERVAL,
    CONF_SHOW_VPN,
    CONF_SHOW_WAN,
    CONF_SITE,
    CONF_SVG_HEIGHT,
    CONF_SVG_ISOMETRIC,
    CONF_SVG_WIDTH,
    CONF_TRACKED_CLIENTS,
    CONF_USE_CACHE,
    CONF_VERIFY_SSL,
    CONF_WAN2_DISABLED,
    CONF_WAN2_LABEL,
    CONF_WAN2_SPEED,
    CONF_WAN_LABEL,
    CONF_WAN_SPEED,
    DEFAULT_CLIENT_SCOPE,
    DEFAULT_INCLUDE_CLIENTS,
    DEFAULT_INCLUDE_PORTS,
    DEFAULT_ONLY_UNIFI,
    DEFAULT_PAYLOAD_CACHE_TTL_SECONDS,
    DEFAULT_REQUEST_TIMEOUT_SECONDS,
    DEFAULT_SCAN_INTERVAL_MINUTES,
    DEFAULT_SHOW_VPN,
    DEFAULT_SHOW_WAN,
    DEFAULT_SITE,
    DEFAULT_SVG_ISOMETRIC,
    DEFAULT_TRACKED_CLIENTS,
    DEFAULT_USE_CACHE,
    DEFAULT_VERIFY_SSL,
    DEFAULT_WAN2_DISABLED,
    DEFAULT_WAN2_LABEL,
    DEFAULT_WAN2_SPEED,
    DEFAULT_WAN_LABEL,
    DEFAULT_WAN_SPEED,
    DOMAIN,
    LOGGER,
    MAX_PAYLOAD_CACHE_TTL_SECONDS,
    MAX_SCAN_INTERVAL_MINUTES,
    MIN_PAYLOAD_CACHE_TTL_SECONDS,
    MIN_SCAN_INTERVAL_MINUTES,
)
from .errors import (
    CannotConnect,
    InvalidAuth,
    InvalidCredentialCombination,
    InvalidPort,
    InvalidUrl,
    RequestRejected,
    UrlHasCredentials,
)


class UniFiNetworkMapConfigFlow(  # type: ignore[reportUntypedBaseClass,reportGeneralTypeIssues,reportCallIssue]
    config_entries.ConfigFlow, domain=DOMAIN
):
    VERSION = 1
    MINOR_VERSION = 1

    async def async_step_reauth(self, entry_data: Mapping[str, Any]):
        """Handle reauth when credentials become invalid."""
        return await self.async_step_reauth_confirm()

    async def async_step_reauth_confirm(
        self, user_input: dict[str, Any] | None = None
    ):
        """Handle reauth credential input."""
        errors: dict[str, str] = {}
        reauth_entry = self._get_reauth_entry()

        if user_input is not None:
            data = _merge_reauth_data(reauth_entry.data, user_input)
            try:
                _validate_credentials(data)
                await self._async_validate_auth(data)
            except InvalidCredentialCombination:
                errors["base"] = "empty_credential"
            except InvalidAuth:
                errors["base"] = "invalid_auth"
            except RequestRejected:
                errors["base"] = "request_rejected"
            except CannotConnect:
                errors["base"] = "cannot_connect"
            except Exception:
                LOGGER.exception("config_flow reauth unexpected error")
                errors["base"] = "unknown"
            else:
                return self.async_update_reload_and_abort(
                    reauth_entry, data=data
                )

        return self.async_show_form(
            step_id="reauth_confirm",
            data_schema=vol.Schema(
                {
                    vol.Optional(CONF_USERNAME): str,
                    vol.Optional(CONF_PASSWORD): str,
                    vol.Optional(CONF_API_KEY): str,
                }
            ),
            errors=errors,
        )

    async def async_step_reconfigure(
        self, user_input: dict[str, Any] | None = None
    ):
        """Handle reconfiguration of credentials."""
        errors: dict[str, str] = {}
        reconfigure_entry = self._get_reconfigure_entry()

        if user_input is not None:
            data, error = await self._validate_user_input(user_input)
            if error:
                errors["base"] = error
            else:
                return self.async_update_reload_and_abort(
                    reconfigure_entry,
                    data=data,
                    unique_id=_build_unique_id(data),
                    title=_build_entry_title(data),
                )

        current = reconfigure_entry.data
        return self.async_show_form(
            step_id="reconfigure",
            data_schema=_build_reconfigure_schema(current),
            errors=errors,
        )

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
                LOGGER.debug(
                    "config_flow validation_failed error=%s",
                    error,
                )
                errors["base"] = error
            else:
                unique_id = _build_unique_id(data)
                await self.async_set_unique_id(unique_id)
                self._abort_if_unique_id_configured()
                title = _build_entry_title(data)
                LOGGER.debug("config_flow entry_created title=%s", title)
                return self.async_create_entry(title=title, data=data)

        schema = _build_schema()
        if user_input is not None:
            schema = self.add_suggested_values_to_schema(
                schema, _suggested_values_on_error(user_input)
            )

        return self.async_show_form(
            step_id="user",
            data_schema=schema,
            errors=errors,
        )

    async def _async_validate_auth(self, data: dict[str, Any]) -> None:
        await self.hass.async_add_executor_job(
            _validate_credentials_call,
            data,
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
        except InvalidCredentialCombination:
            return user_input, "empty_credential"
        except InvalidAuth:
            return user_input, "invalid_auth"
        except RequestRejected:
            return user_input, "request_rejected"
        except CannotConnect:
            return user_input, "cannot_connect"
        except Exception:
            LOGGER.exception("config_flow unexpected validation error")
            return user_input, "unknown"
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
            LOGGER.debug(
                "options_flow started entry_id=%s", self._entry.entry_id
            )
            data, errors = _normalize_options(user_input)
            if errors:
                LOGGER.debug(
                    "options_flow validation_failed errors=%s",
                    list(errors.keys()),
                )
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


def _suggested_values_on_error(user_input: dict[str, Any]) -> dict[str, Any]:
    """Return values to pre-fill when re-showing the form after an error.

    Excludes secret fields so they aren't resubmitted.
    """
    secrets = {CONF_PASSWORD, CONF_API_KEY}
    return {k: v for k, v in user_input.items() if k not in secrets}


def _build_schema() -> vol.Schema:
    return vol.Schema(
        {
            vol.Required(CONF_URL): str,
            vol.Optional(CONF_USERNAME): str,
            vol.Optional(CONF_PASSWORD): str,
            vol.Optional(CONF_API_KEY): str,
            vol.Required(CONF_SITE, default=DEFAULT_SITE): str,
            vol.Optional(CONF_VERIFY_SSL, default=DEFAULT_VERIFY_SSL): bool,
        }
    )


def _build_reconfigure_schema(
    current: Mapping[str, Any],
) -> vol.Schema:
    return vol.Schema(
        {
            vol.Required(CONF_URL, default=current.get(CONF_URL, "")): str,
            vol.Optional(
                CONF_USERNAME,
                default=current.get(CONF_USERNAME, ""),
            ): str,
            vol.Optional(CONF_PASSWORD): str,
            vol.Optional(CONF_API_KEY): str,
            vol.Required(
                CONF_SITE,
                default=current.get(CONF_SITE, DEFAULT_SITE),
            ): str,
            vol.Optional(
                CONF_VERIFY_SSL,
                default=current.get(CONF_VERIFY_SSL, DEFAULT_VERIFY_SSL),
            ): bool,
        }
    )


def _build_options_schema(options: dict[str, Any]) -> vol.Schema:
    return vol.Schema(_options_schema_fields(options))


def _options_schema_fields(
    options: dict[str, Any],
) -> dict[vol.Marker, object]:
    def opt(key: str, default: object) -> vol.Optional:
        return vol.Optional(key, default=options.get(key, default))

    return {
        opt(
            CONF_SCAN_INTERVAL, DEFAULT_SCAN_INTERVAL_MINUTES
        ): _scan_interval_selector(),
        opt(
            CONF_REQUEST_TIMEOUT_SECONDS, DEFAULT_REQUEST_TIMEOUT_SECONDS
        ): _request_timeout_selector(),
        opt(
            CONF_PAYLOAD_CACHE_TTL, DEFAULT_PAYLOAD_CACHE_TTL_SECONDS
        ): _payload_cache_ttl_selector(),
        opt(CONF_INCLUDE_PORTS, DEFAULT_INCLUDE_PORTS): _boolean_selector(),
        opt(
            CONF_INCLUDE_CLIENTS, DEFAULT_INCLUDE_CLIENTS
        ): _boolean_selector(),
        opt(CONF_CLIENT_SCOPE, DEFAULT_CLIENT_SCOPE): _client_scope_selector(),
        opt(CONF_ONLY_UNIFI, DEFAULT_ONLY_UNIFI): _boolean_selector(),
        opt(CONF_SVG_ISOMETRIC, DEFAULT_SVG_ISOMETRIC): _boolean_selector(),
        opt(CONF_USE_CACHE, DEFAULT_USE_CACHE): _boolean_selector(),
        opt(
            CONF_TRACKED_CLIENTS, DEFAULT_TRACKED_CLIENTS
        ): _tracked_clients_selector(),
        opt(CONF_SHOW_WAN, DEFAULT_SHOW_WAN): _boolean_selector(),
        opt(CONF_WAN_LABEL, DEFAULT_WAN_LABEL): _text_selector(),
        opt(CONF_WAN_SPEED, DEFAULT_WAN_SPEED): _text_selector(),
        opt(CONF_WAN2_LABEL, DEFAULT_WAN2_LABEL): _text_selector(),
        opt(CONF_WAN2_SPEED, DEFAULT_WAN2_SPEED): _text_selector(),
        opt(
            CONF_WAN2_DISABLED, DEFAULT_WAN2_DISABLED
        ): _wan2_disabled_selector(),
        opt(CONF_SHOW_VPN, DEFAULT_SHOW_VPN): _boolean_selector(),
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


def _text_selector() -> selector.TextSelector:
    return selector.TextSelector()


def _wan2_disabled_selector() -> selector.SelectSelector:
    return selector.SelectSelector(
        selector.SelectSelectorConfig(
            options=[
                selector.SelectOptionDict(value="auto", label="Auto"),
                selector.SelectOptionDict(value="false", label="Enabled"),
                selector.SelectOptionDict(value="true", label="Disabled"),
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


def _normalize_options(
    user_input: dict[str, Any],
) -> tuple[dict[str, Any], dict[str, str]]:
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
    data = {**user_input, CONF_URL: normalized_url}
    for key in (CONF_USERNAME, CONF_PASSWORD, CONF_API_KEY):
        if not _is_present(data.get(key)):
            data.pop(key, None)
    return data


def _is_present(value: object) -> bool:
    return isinstance(value, str) and bool(value.strip())


def _merge_reauth_data(
    existing: Mapping[str, Any], user_input: Mapping[str, Any]
) -> dict[str, Any]:
    """Merge reauth input over existing entry data, dropping stale auth fields.

    When the user supplies new credentials of one type, drop the credentials
    of the other type so the new auth mode wins cleanly.
    """
    merged: dict[str, Any] = {**existing, **user_input}
    new_has_password = _is_present(
        user_input.get(CONF_USERNAME)
    ) and _is_present(user_input.get(CONF_PASSWORD))
    new_has_api_key = _is_present(user_input.get(CONF_API_KEY))
    if new_has_api_key and not new_has_password:
        merged.pop(CONF_USERNAME, None)
        merged.pop(CONF_PASSWORD, None)
    elif new_has_password and not new_has_api_key:
        merged.pop(CONF_API_KEY, None)
    for key in (CONF_USERNAME, CONF_PASSWORD, CONF_API_KEY):
        if not _is_present(merged.get(key)):
            merged.pop(key, None)
    return merged


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
    """Validate that required credential fields are not empty.

    Exactly one of (username + password) OR api_key must be provided.
    """
    site = user_input.get(CONF_SITE, "")
    if not isinstance(site, str) or not site.strip():
        raise InvalidCredentialCombination
    has_password_auth = _has_password_auth(user_input)
    has_api_key = _has_api_key(user_input)
    if has_password_auth == has_api_key:
        raise InvalidCredentialCombination


def _has_password_auth(user_input: dict[str, Any]) -> bool:
    username = user_input.get(CONF_USERNAME) or ""
    password = user_input.get(CONF_PASSWORD) or ""
    return (
        isinstance(username, str)
        and bool(username.strip())
        and isinstance(password, str)
        and bool(password)
    )


def _has_api_key(user_input: dict[str, Any]) -> bool:
    api_key = user_input.get(CONF_API_KEY) or ""
    return isinstance(api_key, str) and bool(api_key.strip())


def _validate_credentials_call(data: dict[str, Any]) -> None:
    """Executor entry point that forwards entry data to the validator."""
    validate_unifi_credentials(
        base_url=data[CONF_URL],
        username=data.get(CONF_USERNAME) or None,
        password=data.get(CONF_PASSWORD) or None,
        site=data[CONF_SITE],
        verify_ssl=data.get(CONF_VERIFY_SSL, DEFAULT_VERIFY_SSL),
        api_key=data.get(CONF_API_KEY) or None,
    )


def _build_unique_id(data: dict[str, Any]) -> str:
    url = data.get(CONF_URL, "")
    site = data.get(CONF_SITE, DEFAULT_SITE)
    return f"{url}_{site}"


def _build_entry_title(data: dict[str, Any]) -> str:
    site = data.get(CONF_SITE, DEFAULT_SITE)
    return f"UniFi Network Map ({site})"
