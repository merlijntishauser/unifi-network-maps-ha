from __future__ import annotations

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
from .errors import UniFiNetworkMapError
from .renderer import RenderSettings


class UniFiNetworkMapCoordinator(DataUpdateCoordinator[UniFiNetworkMapData]):
    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        super().__init__(
            hass,
            LOGGER,
            name=DOMAIN,
            update_interval=DEFAULT_SCAN_INTERVAL,
        )
        self._client = _build_client(hass, entry)

    async def _async_update_data(self) -> UniFiNetworkMapData:
        try:
            return await self.hass.async_add_executor_job(self._client.fetch_map)
        except UniFiNetworkMapError as err:
            raise UpdateFailed(str(err)) from err


def _build_client(hass: HomeAssistant, entry: ConfigEntry) -> UniFiNetworkMapClient:
    return UniFiNetworkMapClient(
        base_url=entry.data[CONF_URL],
        username=entry.data[CONF_USERNAME],
        password=entry.data[CONF_PASSWORD],
        site=entry.data[CONF_SITE],
        verify_ssl=entry.data.get(CONF_VERIFY_SSL, True),
        settings=_build_settings(entry),
    )


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
