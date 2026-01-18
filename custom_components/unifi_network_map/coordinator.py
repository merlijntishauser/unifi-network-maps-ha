from __future__ import annotations

from typing import Any, Mapping, Protocol

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_PASSWORD, CONF_URL, CONF_USERNAME
from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .api import UniFiNetworkMapClient
from .const import (
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
    DEFAULT_SCAN_INTERVAL,
    DEFAULT_SVG_ISOMETRIC,
    DEFAULT_USE_CACHE,
    DOMAIN,
    LOGGER,
)
from .data import UniFiNetworkMapData
from .errors import CannotConnect, InvalidAuth, UniFiNetworkMapError
from .renderer import RenderSettings
from .utils import monotonic_seconds

AUTH_BACKOFF_BASE_SECONDS = 30
AUTH_BACKOFF_MAX_SECONDS = 600


class MapClient(Protocol):
    settings: RenderSettings

    def fetch_map(self) -> UniFiNetworkMapData: ...


class UniFiNetworkMapCoordinator(DataUpdateCoordinator[UniFiNetworkMapData]):
    def __init__(
        self,
        hass: HomeAssistant,
        entry: ConfigEntry,
        client: MapClient | None = None,
    ) -> None:
        super().__init__(
            hass,
            LOGGER,
            name=DOMAIN,
            update_interval=DEFAULT_SCAN_INTERVAL,
        )
        self._client = client or _build_client(hass, entry)
        self._auth_backoff_until: float | None = None
        self._auth_backoff_seconds = AUTH_BACKOFF_BASE_SECONDS

    @property
    def settings(self) -> RenderSettings:
        return self._client.settings

    @property
    def auth_backoff_until(self) -> float | None:
        return self._auth_backoff_until

    @property
    def auth_backoff_seconds(self) -> int:
        return self._auth_backoff_seconds

    async def _async_update_data(self) -> UniFiNetworkMapData:
        backoff_remaining = self._auth_backoff_remaining()
        if backoff_remaining is not None:
            LOGGER.debug("Skipping fetch: backoff active for %ds", int(backoff_remaining))
            raise UpdateFailed(f"Auth backoff active, retrying in {int(backoff_remaining)}s")
        try:
            data = await self.hass.async_add_executor_job(self._client.fetch_map)
            self._reset_auth_backoff()
            return data
        except UniFiNetworkMapError as err:
            if _should_backoff(err):
                self._advance_auth_backoff()
            raise UpdateFailed(str(err)) from err

    async def async_fetch_for_testing(self) -> UniFiNetworkMapData:
        return await self._async_update_data()

    def _auth_backoff_remaining(self) -> float | None:
        if self._auth_backoff_until is None:
            return None
        remaining = self._auth_backoff_until - monotonic_seconds()
        if remaining <= 0:
            return None
        return remaining

    def _advance_auth_backoff(self) -> None:
        now = monotonic_seconds()
        delay = min(self._auth_backoff_seconds, AUTH_BACKOFF_MAX_SECONDS)
        self._auth_backoff_until = now + delay
        LOGGER.warning(
            "Auth backoff activated: waiting %ds before retry (next delay: %ds)",
            delay,
            min(delay * 2, AUTH_BACKOFF_MAX_SECONDS),
        )
        self._auth_backoff_seconds = min(delay * 2, AUTH_BACKOFF_MAX_SECONDS)

    def _reset_auth_backoff(self) -> None:
        if self._auth_backoff_until is not None:
            LOGGER.debug("Auth backoff cleared after successful fetch")
        self._auth_backoff_until = None
        self._auth_backoff_seconds = AUTH_BACKOFF_BASE_SECONDS


def _should_backoff(err: UniFiNetworkMapError) -> bool:
    if isinstance(err, InvalidAuth):
        return True
    if isinstance(err, CannotConnect):
        return "rate limited" in str(err).lower()
    return False


def _build_client(hass: HomeAssistant, entry: ConfigEntry) -> UniFiNetworkMapClient:
    data = entry.data
    _validate_required_keys(data)
    return UniFiNetworkMapClient(
        base_url=data[CONF_URL],
        username=data[CONF_USERNAME],
        password=data[CONF_PASSWORD],
        site=data[CONF_SITE],
        verify_ssl=data.get(CONF_VERIFY_SSL, True),
        settings=_build_settings(entry),
    )


_REQUIRED_KEYS = (CONF_URL, CONF_USERNAME, CONF_PASSWORD, CONF_SITE)


def _validate_required_keys(data: Mapping[str, Any]) -> None:
    missing = [key for key in _REQUIRED_KEYS if key not in data]
    if missing:
        raise UniFiNetworkMapError(f"Missing required config keys: {', '.join(missing)}")


def _build_settings(entry: ConfigEntry) -> RenderSettings:
    options = entry.options
    return RenderSettings(
        include_ports=options.get(CONF_INCLUDE_PORTS, DEFAULT_INCLUDE_PORTS),
        include_clients=options.get(CONF_INCLUDE_CLIENTS, DEFAULT_INCLUDE_CLIENTS),
        client_scope=options.get(CONF_CLIENT_SCOPE, DEFAULT_CLIENT_SCOPE),
        only_unifi=options.get(CONF_ONLY_UNIFI, DEFAULT_ONLY_UNIFI),
        svg_isometric=options.get(CONF_SVG_ISOMETRIC, DEFAULT_SVG_ISOMETRIC),
        svg_width=options.get(CONF_SVG_WIDTH),
        svg_height=options.get(CONF_SVG_HEIGHT),
        use_cache=options.get(CONF_USE_CACHE, DEFAULT_USE_CACHE),
    )
