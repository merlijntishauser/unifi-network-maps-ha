from __future__ import annotations

from pathlib import Path

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
    _register_frontend_assets(hass)
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


def _register_frontend_assets(hass: HomeAssistant) -> None:
    data = hass.data.setdefault(DOMAIN, {})
    if data.get("frontend_registered"):
        return
    js_path = _frontend_bundle_path()
    if not js_path.exists():
        LOGGER.warning("Frontend bundle missing at %s", js_path)
        return
    hass.http.register_static_path(_frontend_bundle_url(), str(js_path), cache_headers=True)
    hass.async_create_task(_ensure_lovelace_resource(hass))
    data["frontend_registered"] = True


def _frontend_bundle_path() -> Path:
    return Path(__file__).resolve().parent / "frontend" / "unifi-network-map.js"


def _frontend_bundle_url() -> str:
    return "/unifi-network-map/unifi-network-map.js"


async def _ensure_lovelace_resource(hass: HomeAssistant) -> None:
    resources = _load_lovelace_resources()
    if resources is None:
        return
    items = await _fetch_lovelace_items(hass, resources)
    if items is None:
        return
    resource_url = _frontend_bundle_url()
    if any(item.get("url") == resource_url for item in items):
        return
    await _create_lovelace_resource(hass, resources, resource_url)


def _load_lovelace_resources():
    try:
        from homeassistant.components.lovelace import resources
    except Exception:  # pragma: no cover - optional in tests
        return None
    return resources


async def _fetch_lovelace_items(hass: HomeAssistant, resources) -> list[dict] | None:
    try:
        info = resources.async_get_info(hass)
    except Exception as err:  # pragma: no cover - defensive
        LOGGER.debug("Unable to read Lovelace resources: %s", err)
        return None
    if hasattr(info, "async_get_info"):
        result = info.async_get_info()
        return await _maybe_await(result)
    return info


async def _create_lovelace_resource(
    hass: HomeAssistant, resources, resource_url: str
) -> None:
    try:
        await resources.async_create_item(
            hass,
            {"url": resource_url, "type": "module"},
        )
        LOGGER.info("Registered Lovelace resource %s", resource_url)
    except Exception as err:  # pragma: no cover - defensive
        LOGGER.debug("Unable to register Lovelace resource: %s", err)


async def _maybe_await(result):
    if hasattr(result, "__await__"):
        return await result
    return result


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
