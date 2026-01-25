from __future__ import annotations

from pathlib import Path
import inspect
import importlib
from types import ModuleType

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, ServiceCall
from typing import Any, Awaitable, Callable, Mapping, Protocol
from homeassistant.const import EVENT_HOMEASSISTANT_START

import asyncio

import voluptuous as vol
from homeassistant.exceptions import HomeAssistantError

from .const import ATTR_ENTRY_ID, DOMAIN, LOGGER, PLATFORMS, SERVICE_REFRESH
from .coordinator import UniFiNetworkMapCoordinator


ResourceItem = Mapping[str, Any]


class LovelaceResourcesModule(Protocol):
    def async_get_info(self, hass: HomeAssistant) -> object: ...

    def async_create_item(
        self, hass: HomeAssistant, payload: Mapping[str, Any]
    ) -> Awaitable[None] | None: ...


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    from .http import register_unifi_http_views

    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    await _initialize_coordinator(coordinator)
    _store_coordinator(hass, entry.entry_id, coordinator)
    _register_runtime_services(hass, register_unifi_http_views)
    await _forward_entry_setups(hass, entry)
    entry.async_on_unload(entry.add_update_listener(_async_options_updated))
    _log_api_endpoints(entry.entry_id)
    return True


async def _async_options_updated(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Handle options update - rebuild coordinator client and refresh."""
    coordinator = hass.data.get(DOMAIN, {}).get(entry.entry_id)
    if isinstance(coordinator, UniFiNetworkMapCoordinator):
        coordinator.update_settings()
        await coordinator.async_request_refresh()
        LOGGER.info("Options updated, refreshing UniFi Network Map")


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unload_ok:
        hass.data.get(DOMAIN, {}).pop(entry.entry_id, None)
    return unload_ok


def _register_refresh_service(hass: HomeAssistant) -> None:
    if _refresh_service_registered(hass):
        return
    handler = _build_refresh_handler(hass)
    _register_refresh_handler(hass, handler)
    _mark_refresh_service_registered(hass)


async def _initialize_coordinator(coordinator: UniFiNetworkMapCoordinator) -> None:
    await coordinator.async_config_entry_first_refresh()


def _store_coordinator(
    hass: HomeAssistant, entry_id: str, coordinator: UniFiNetworkMapCoordinator
) -> None:
    hass.data.setdefault(DOMAIN, {})[entry_id] = coordinator


def _register_runtime_services(
    hass: HomeAssistant, register_views: Callable[[HomeAssistant], None]
) -> None:
    from .websocket import async_register_websocket_api

    register_views(hass)
    _register_frontend_assets(hass)
    _register_refresh_service(hass)
    async_register_websocket_api(hass)


async def _forward_entry_setups(hass: HomeAssistant, entry: ConfigEntry) -> None:
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)


def _log_api_endpoints(entry_id: str) -> None:
    LOGGER.info(
        "UniFi Network Map endpoints: /api/unifi_network_map/%s/svg and /api/unifi_network_map/%s/payload",
        entry_id,
        entry_id,
    )


def _refresh_service_registered(hass: HomeAssistant) -> bool:
    data = hass.data.setdefault(DOMAIN, {})
    return _flag_is_set(data, "refresh_service_registered")


def _mark_refresh_service_registered(hass: HomeAssistant) -> None:
    data = hass.data.setdefault(DOMAIN, {})
    _set_flag(data, "refresh_service_registered")


def _build_refresh_handler(hass: HomeAssistant) -> Callable[[ServiceCall], Awaitable[None]]:
    async def _handle_refresh(call: ServiceCall) -> None:
        entry_id = call.data.get(ATTR_ENTRY_ID)
        coordinators = _select_coordinators(hass, entry_id)
        if not coordinators:
            raise HomeAssistantError("No matching UniFi Network Map entry found")
        for coordinator in coordinators:
            await coordinator.async_request_refresh()

    return _handle_refresh


def _register_refresh_handler(
    hass: HomeAssistant, handler: Callable[[ServiceCall], Awaitable[None]]
) -> None:
    hass.services.async_register(
        DOMAIN,
        SERVICE_REFRESH,
        handler,
        schema=vol.Schema({vol.Optional(ATTR_ENTRY_ID): str}),
    )


def _register_frontend_assets(hass: HomeAssistant) -> None:
    data = hass.data.setdefault(DOMAIN, {})
    if _flag_is_set(data, "frontend_registered"):
        return
    js_path = _frontend_bundle_path()
    if not js_path.exists():
        LOGGER.warning("Frontend bundle missing at %s", js_path)
        return
    _register_static_asset(hass, js_path)
    LOGGER.info("Attempting Lovelace resource registration for %s", _frontend_bundle_url())
    _schedule_lovelace_resource_registration(hass)
    _set_flag(data, "frontend_registered")


def _flag_is_set(data: dict[str, object], key: str) -> bool:
    return bool(data.get(key))


def _set_flag(data: dict[str, object], key: str) -> None:
    data[key] = True


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


def _make_static_path_config(
    static_path_config: Callable[..., object], js_path: Path
) -> object | None:
    url_path = _frontend_bundle_url()
    file_path = str(js_path)
    strategies: list[Callable[[], object | None]] = [
        lambda: static_path_config(url_path=url_path, file_path=file_path, cache_headers=True),
        lambda: static_path_config(url_path=url_path, path=file_path, cache_headers=True),
        lambda: static_path_config(url_path, file_path, True),
        lambda: static_path_config(url_path, file_path),
        lambda: _make_config_from_signature(static_path_config, url_path, file_path),
    ]
    for strategy in strategies:
        try:
            result = strategy()
            if result is not None:
                return result
        except TypeError:
            continue
    return None


def _make_config_from_signature(
    static_path_config: Callable[..., object], url_path: str, file_path: str
) -> object | None:
    try:
        signature = inspect.signature(static_path_config)
    except (TypeError, ValueError):
        return None
    param_map = {
        frozenset({"url_path", "url"}): url_path,
        frozenset({"file_path", "path", "filepath"}): file_path,
        frozenset({"cache_headers", "cache", "cache_control"}): True,
    }
    kwargs: dict[str, object] = {}
    for name in signature.parameters:
        for keys, value in param_map.items():
            if name in keys:
                kwargs[name] = value
                break
    return static_path_config(**kwargs) if kwargs else None


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
    # Increment first to avoid race condition where multiple concurrent calls
    # could all read the same value before any of them increments
    attempts = data.get("lovelace_resource_attempts", 0) + 1
    data["lovelace_resource_attempts"] = attempts
    if attempts > 6:
        _log_lovelace_registration_failure(hass, attempts)
        return
    hass.async_create_task(_retry_lovelace_resource(hass, 10))


def _log_lovelace_registration_failure(hass: HomeAssistant, attempts: int) -> None:
    data = hass.data.setdefault(DOMAIN, {})
    if data.get("lovelace_resource_failed"):
        return
    data["lovelace_resource_failed"] = True
    LOGGER.error(
        "Lovelace auto-registration failed after %d attempts. "
        "Add this resource manually: url=%s type=module. "
        "If the resource is missing, confirm Lovelace is in Storage mode and reload.",
        attempts,
        _frontend_bundle_url(),
    )


def _lovelace_resource_registered(hass: HomeAssistant) -> bool:
    data = hass.data.setdefault(DOMAIN, {})
    return bool(data.get("lovelace_resource_registered"))


def _mark_lovelace_resource_registered(hass: HomeAssistant) -> None:
    data = hass.data.setdefault(DOMAIN, {})
    data["lovelace_resource_registered"] = True


def _load_lovelace_resources() -> ModuleType | LovelaceResourcesModule | None:
    try:
        from homeassistant.components.lovelace import resources  # type: ignore[no-redef]

        return resources
    except Exception:  # pragma: no cover - optional in tests
        pass
    try:
        return importlib.import_module("homeassistant.components.lovelace.resources")
    except Exception:  # pragma: no cover - optional in tests
        return None


async def _fetch_lovelace_items(
    hass: HomeAssistant, resources: ModuleType | LovelaceResourcesModule
) -> list[ResourceItem] | None:
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
        if inspect.iscoroutine(items_result):
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


async def _create_lovelace_resource(
    hass: HomeAssistant, resources: ModuleType | LovelaceResourcesModule, resource_url: str
) -> bool:
    payload: Mapping[str, Any] = {"url": resource_url, "res_type": "module"}

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
    hass: HomeAssistant,
    resources: ModuleType | LovelaceResourcesModule,
    payload: Mapping[str, Any],
) -> bool:
    if not hasattr(resources, "async_create_item"):
        return False
    try:
        result = resources.async_create_item(hass, payload)
        if inspect.iscoroutine(result):
            await result
        return True
    except TypeError:
        try:
            result = resources.async_create_item(payload)
            if inspect.iscoroutine(result):
                await result
            return True
        except Exception as err:  # pragma: no cover - defensive
            LOGGER.debug("Unable to register Lovelace resource: %s", err)
            return False
    except Exception as err:  # pragma: no cover - defensive
        LOGGER.debug("Unable to register Lovelace resource: %s", err)
        return False


async def _create_lovelace_resource_with_collection(
    info: object, payload: Mapping[str, Any]
) -> bool:
    if not hasattr(info, "async_create_item"):
        return False
    try:
        result = info.async_create_item(payload)
        if inspect.iscoroutine(result):
            await result
        return True
    except Exception as err:  # pragma: no cover - defensive
        LOGGER.debug("Unable to register Lovelace resource from collection: %s", err)
        return False


async def _maybe_await_list(result: object) -> list[ResourceItem] | None:
    if inspect.iscoroutine(result):
        return _as_resource_list(await result)
    return _as_resource_list(result)


def _as_resource_list(value: object) -> list[ResourceItem] | None:
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
