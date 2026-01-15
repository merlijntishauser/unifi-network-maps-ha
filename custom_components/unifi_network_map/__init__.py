from __future__ import annotations

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

import voluptuous as vol
from homeassistant.exceptions import HomeAssistantError

from .const import ATTR_ENTRY_ID, DOMAIN, LOGGER, PLATFORMS, SERVICE_REFRESH
from .coordinator import UniFiNetworkMapCoordinator


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    from .http import register_unifi_http_views

    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    await coordinator.async_config_entry_first_refresh()
    hass.data.setdefault(DOMAIN, {})[entry.entry_id] = coordinator
    register_unifi_http_views(hass)
    _register_refresh_service(hass)
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    LOGGER.info(
        "UniFi Network Map endpoints: /api/unifi_network_map/%s/svg and /api/unifi_network_map/%s/payload",
        entry.entry_id,
        entry.entry_id,
    )
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unload_ok:
        hass.data.get(DOMAIN, {}).pop(entry.entry_id, None)
    return unload_ok


def _register_refresh_service(hass: HomeAssistant) -> None:
    data = hass.data.setdefault(DOMAIN, {})
    if data.get("refresh_service_registered"):
        return

    async def _handle_refresh(call) -> None:
        entry_id = call.data.get(ATTR_ENTRY_ID)
        coordinators = _select_coordinators(hass, entry_id)
        if not coordinators:
            raise HomeAssistantError("No matching UniFi Network Map entry found")
        for coordinator in coordinators:
            await coordinator.async_request_refresh()

    hass.services.async_register(
        DOMAIN,
        SERVICE_REFRESH,
        _handle_refresh,
        schema=vol.Schema({vol.Optional(ATTR_ENTRY_ID): str}),
    )
    data["refresh_service_registered"] = True


def _select_coordinators(
    hass: HomeAssistant, entry_id: str | None
) -> list[UniFiNetworkMapCoordinator]:
    entries = hass.data.get(DOMAIN, {}).items()
    coordinators = [
        value
        for key, value in entries
        if isinstance(value, UniFiNetworkMapCoordinator) and (entry_id is None or key == entry_id)
    ]
    return coordinators
