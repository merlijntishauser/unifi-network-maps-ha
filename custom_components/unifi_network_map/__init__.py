from __future__ import annotations

from pathlib import Path
import inspect
import importlib

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from typing import Mapping
from homeassistant.const import EVENT_HOMEASSISTANT_START

import asyncio

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
    _register_static_asset(hass, js_path)
    LOGGER.info("Attempting Lovelace resource registration for %s", _frontend_bundle_url())
    _schedule_lovelace_resource_registration(hass)
    data["frontend_registered"] = True


def _frontend_bundle_path() -> Path:
    return Path(__file__).resolve().parent / "frontend" / "unifi-network-map.js"


def _frontend_bundle_url() -> str:
    return "/unifi-network-map/unifi-network-map.js"


def _register_static_asset(hass: HomeAssistant, js_path: Path) -> None:
    if hasattr(hass.http, "register_static_path"):
        hass.http.register_static_path(
            _frontend_bundle_url(),
            str(js_path),
            cache_headers=True,
        )
        return
    if hasattr(hass.http, "async_register_static_paths"):
        configs = _build_static_path_configs(js_path)
        result = hass.http.async_register_static_paths(configs)
        if hasattr(result, "__await__"):
            hass.async_create_task(result)
        return
    LOGGER.warning("Unable to register frontend bundle; HTTP static path API missing")


def _build_static_path_configs(js_path: Path) -> list[object]:
    try:
        from homeassistant.components.http import StaticPathConfig
    except Exception:  # pragma: no cover - fallback for older HA
        StaticPathConfig = None

    if StaticPathConfig is not None:
        config = _make_static_path_config(StaticPathConfig, js_path)
        if config is not None:
            return [config]
    return [
        {
            "path": _frontend_bundle_url(),
            "file_path": str(js_path),
            "cache_headers": True,
        }
    ]


def _make_static_path_config(static_path_config, js_path: Path) -> object | None:
    url_path = _frontend_bundle_url()
    file_path = str(js_path)
    try:
        return static_path_config(
            url_path=url_path,
            file_path=file_path,
            cache_headers=True,
        )
    except TypeError:
        pass
    try:
        return static_path_config(
            url_path=url_path,
            path=file_path,
            cache_headers=True,
        )
    except TypeError:
        pass
    try:
        return static_path_config(url_path, file_path, True)
    except TypeError:
        pass
    try:
        return static_path_config(url_path, file_path)
    except TypeError:
        pass
    try:
        signature = inspect.signature(static_path_config)
    except (TypeError, ValueError):
        return None
    kwargs: dict[str, object] = {}
    for name in signature.parameters:
        if name in {"url_path", "url"}:
            kwargs[name] = url_path
        elif name in {"file_path", "path", "filepath"}:
            kwargs[name] = file_path
        elif name in {"cache_headers", "cache", "cache_control"}:
            kwargs[name] = True
    if kwargs:
        try:
            return static_path_config(**kwargs)
        except TypeError:
            return None
    return None


async def _ensure_lovelace_resource(hass: HomeAssistant) -> None:
    if _lovelace_resource_registered(hass):
        return

    data = hass.data.setdefault(DOMAIN, {})
    attempts = data.get("lovelace_resource_attempts", 0)
    LOGGER.debug("_ensure_lovelace_resource attempt %d", attempts + 1)

    resources = _load_lovelace_resources()
    if resources is None:
        LOGGER.debug("Lovelace resources module not available yet")
        _schedule_lovelace_resource_retry(hass)
        return

    LOGGER.debug("Lovelace resources module loaded, fetching items")
    items = await _fetch_lovelace_items(hass, resources)
    if items is None:
        LOGGER.debug("Lovelace resources list not ready yet")
        _schedule_lovelace_resource_retry(hass)
        return

    resource_url = _frontend_bundle_url()
    LOGGER.debug("Got %d existing resources, checking for %s", len(items), resource_url)

    if any(item.get("url") == resource_url for item in items):
        LOGGER.info("Lovelace resource already registered: %s", resource_url)
        _mark_lovelace_resource_registered(hass)
        return

    LOGGER.debug("Creating Lovelace resource")
    created = await _create_lovelace_resource(hass, resources, resource_url)
    if created:
        _mark_lovelace_resource_registered(hass)
    else:
        LOGGER.debug("Lovelace resource creation failed, will retry")
        _schedule_lovelace_resource_retry(hass)


def _schedule_lovelace_resource_registration(hass: HomeAssistant) -> None:
    if hass.is_running:
        hass.async_create_task(_ensure_lovelace_resource(hass))
        return

    async def _on_start(_event) -> None:
        await _ensure_lovelace_resource(hass)

    hass.bus.async_listen_once(EVENT_HOMEASSISTANT_START, _on_start)


async def _retry_lovelace_resource(hass: HomeAssistant, delay_seconds: int) -> None:
    await asyncio.sleep(delay_seconds)
    await _ensure_lovelace_resource(hass)


def _schedule_lovelace_resource_retry(hass: HomeAssistant) -> None:
    data = hass.data.setdefault(DOMAIN, {})
    attempts = data.get("lovelace_resource_attempts", 0)
    if attempts >= 6:
        LOGGER.warning(
            "Lovelace resource registration failed after %d attempts. Add manually: %s",
            attempts,
            _frontend_bundle_url(),
        )
        return
    data["lovelace_resource_attempts"] = attempts + 1
    hass.async_create_task(_retry_lovelace_resource(hass, 10))


def _lovelace_resource_registered(hass: HomeAssistant) -> bool:
    data = hass.data.setdefault(DOMAIN, {})
    return bool(data.get("lovelace_resource_registered"))


def _mark_lovelace_resource_registered(hass: HomeAssistant) -> None:
    data = hass.data.setdefault(DOMAIN, {})
    data["lovelace_resource_registered"] = True


def _load_lovelace_resources() -> object | None:
    try:
        from homeassistant.components.lovelace import resources  # type: ignore[no-redef]

        return resources
    except Exception:  # pragma: no cover - optional in tests
        pass
    try:
        return importlib.import_module("homeassistant.components.lovelace.resources")
    except Exception:  # pragma: no cover - optional in tests
        return None


async def _fetch_lovelace_items(hass: HomeAssistant, resources) -> list[dict[str, object]] | None:
    # Try accessing the resource collection from hass.data["lovelace"].resources
    try:
        lovelace_data = hass.data.get("lovelace")
        if not lovelace_data:
            LOGGER.debug("hass.data['lovelace'] is None or missing")
            return None
        if not hasattr(lovelace_data, "resources"):
            LOGGER.debug(
                "lovelace_data has no 'resources' attribute, available: %s", dir(lovelace_data)
            )
            return None
        resource_collection = lovelace_data.resources
        if not resource_collection:
            LOGGER.debug("lovelace_data.resources is None")
            return None
        if not hasattr(resource_collection, "async_items"):
            LOGGER.debug(
                "resource_collection has no 'async_items', available: %s", dir(resource_collection)
            )
            return None
        items_result = resource_collection.async_items()
        # async_items() might return a list or a coroutine
        if hasattr(items_result, "__await__"):
            items = await items_result
        else:
            items = items_result
        return list(items) if items else []
    except Exception as err:
        LOGGER.warning("Unable to access lovelace data: %s", err, exc_info=True)

    # Fallback to old API
    try:
        info = resources.async_get_info(hass)
    except Exception as err:  # pragma: no cover - defensive
        LOGGER.debug("Unable to read Lovelace resources: %s", err)
        return None
    if hasattr(info, "async_get_info"):
        try:
            result = info.async_get_info()
        except Exception as err:  # pragma: no cover - defensive
            LOGGER.debug("Unable to read Lovelace resources info: %s", err)
            return None
        return await _maybe_await_list(result)
    return _as_resource_list(info)


async def _create_lovelace_resource(hass: HomeAssistant, resources, resource_url: str) -> bool:
    payload: Mapping[str, object] = {"url": resource_url, "res_type": "module"}

    # Try accessing the resource collection directly
    try:
        lovelace_data = hass.data.get("lovelace")
        if lovelace_data and hasattr(lovelace_data, "resources"):
            resource_collection = lovelace_data.resources
            if resource_collection and hasattr(resource_collection, "async_create_item"):
                await resource_collection.async_create_item(payload)
                LOGGER.info("Registered Lovelace resource %s", resource_url)
                return True
    except Exception as err:
        LOGGER.debug("Unable to create via collection: %s", err)

    # Fallback to old API
    result = await _create_lovelace_resource_with_module(hass, resources, payload)
    if result:
        LOGGER.info("Registered Lovelace resource %s", resource_url)
        return True

    try:
        info = resources.async_get_info(hass)
    except Exception as err:  # pragma: no cover - defensive
        LOGGER.debug("Unable to read Lovelace resources for create: %s", err)
        return False

    created = await _create_lovelace_resource_with_collection(info, payload)
    if created:
        LOGGER.info("Registered Lovelace resource %s", resource_url)
        return True
    return False


async def _create_lovelace_resource_with_module(
    hass: HomeAssistant, resources, payload: Mapping[str, object]
) -> bool:
    if not hasattr(resources, "async_create_item"):
        return False
    try:
        result = resources.async_create_item(hass, payload)
        if hasattr(result, "__await__"):
            await result
        return True
    except TypeError:
        try:
            result = resources.async_create_item(payload)
            if hasattr(result, "__await__"):
                await result
            return True
        except Exception as err:  # pragma: no cover - defensive
            LOGGER.debug("Unable to register Lovelace resource: %s", err)
            return False
    except Exception as err:  # pragma: no cover - defensive
        LOGGER.debug("Unable to register Lovelace resource: %s", err)
        return False


async def _create_lovelace_resource_with_collection(
    info: object, payload: Mapping[str, object]
) -> bool:
    if not hasattr(info, "async_create_item"):
        return False
    try:
        result = info.async_create_item(payload)
        if hasattr(result, "__await__"):
            await result
        return True
    except Exception as err:  # pragma: no cover - defensive
        LOGGER.debug("Unable to register Lovelace resource from collection: %s", err)
        return False


async def _maybe_await_list(result: object) -> list[dict[str, object]] | None:
    if hasattr(result, "__await__"):
        return _as_resource_list(await result)
    return _as_resource_list(result)


def _as_resource_list(value: object) -> list[dict[str, object]] | None:
    if isinstance(value, list) and all(isinstance(item, dict) for item in value):
        return value
    return None


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
