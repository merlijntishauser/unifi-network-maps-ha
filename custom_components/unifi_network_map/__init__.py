from __future__ import annotations

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import DOMAIN, LOGGER
from .coordinator import UniFiNetworkMapCoordinator


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    from .http import register_unifi_http_views

    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    await coordinator.async_config_entry_first_refresh()
    hass.data.setdefault(DOMAIN, {})[entry.entry_id] = coordinator
    register_unifi_http_views(hass)
    LOGGER.info(
        "UniFi Network Map endpoints: /api/unifi_network_map/%s/svg and /api/unifi_network_map/%s/payload",
        entry.entry_id,
        entry.entry_id,
    )
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    hass.data.get(DOMAIN, {}).pop(entry.entry_id, None)
    return True
