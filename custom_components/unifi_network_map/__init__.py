from __future__ import annotations

import json
from pathlib import Path
import inspect
import importlib
import logging
from types import ModuleType

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, ServiceCall
from typing import Any, Awaitable, Callable, Mapping, Protocol, cast
from homeassistant.const import EVENT_HOMEASSISTANT_START

import asyncio

import voluptuous as vol
from homeassistant.exceptions import HomeAssistantError

from .const import (
    ATTR_ENTRY_ID,
    CONF_PAYLOAD_CACHE_TTL,
    DEFAULT_PAYLOAD_CACHE_TTL_SECONDS,
    DOMAIN,
    LOGGER,
    PLATFORMS,
    SERVICE_REFRESH,
)
from .coordinator import UniFiNetworkMapCoordinator


ResourceItem = Mapping[str, Any]
_unifi_api_info_filter_added = False


class _UnifiApiInfoFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        return record.levelno != logging.INFO


class LovelaceResourcesModule(Protocol):
    def async_get_info(self, hass: HomeAssistant) -> object: ...

    def async_create_item(
        self, hass: HomeAssistant, payload: Mapping[str, Any]
    ) -> Awaitable[None] | None: ...


class LovelaceResourceCollection(Protocol):
    def async_items(self) -> list[ResourceItem] | Awaitable[list[ResourceItem]]: ...

    def async_create_item(self, payload: Mapping[str, Any]) -> Awaitable[None] | None: ...

    def async_update_item(
        self, item_id: str, payload: Mapping[str, Any]
    ) -> Awaitable[None] | None: ...


class LovelaceResourcesInfo(Protocol):
    def async_get_info(self) -> object: ...

    def async_create_item(self, payload: Mapping[str, Any]) -> Awaitable[None] | None: ...


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    from .http import register_unifi_http_views

    _suppress_unifi_api_info_logs(hass)
    _register_websocket_api(hass)
    _configure_payload_cache_ttl(hass, entry)
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
    from .payload_cache import invalidate_payload_cache

    _configure_payload_cache_ttl(hass, entry)
    invalidate_payload_cache(hass, entry.entry_id)
    coordinator = hass.data.get(DOMAIN, {}).get(entry.entry_id)
    if isinstance(coordinator, UniFiNetworkMapCoordinator):
        coordinator.update_settings()
        await coordinator.async_request_refresh()
        LOGGER.debug("init options_updated entry_id=%s", entry.entry_id)


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    from .entity_cache import invalidate_entity_cache
    from .payload_cache import invalidate_payload_cache

    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unload_ok:
        hass.data.get(DOMAIN, {}).pop(entry.entry_id, None)
        invalidate_entity_cache(hass)
        invalidate_payload_cache(hass, entry.entry_id)
    return unload_ok


def _suppress_unifi_api_info_logs(hass: HomeAssistant) -> None:
    global _unifi_api_info_filter_added
    if _unifi_api_info_filter_added or getattr(getattr(hass, "config", None), "debug", False):
        return
    logging.getLogger("unifi_topology.adapters.unifi_api").addFilter(_UnifiApiInfoFilter())
    _unifi_api_info_filter_added = True


def _configure_payload_cache_ttl(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Configure the payload cache TTL from entry options."""
    from .payload_cache import set_payload_cache_ttl

    ttl = entry.options.get(CONF_PAYLOAD_CACHE_TTL, DEFAULT_PAYLOAD_CACHE_TTL_SECONDS)
    set_payload_cache_ttl(hass, float(ttl))


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
    register_views(hass)
    _register_frontend_assets(hass)
    _register_refresh_service(hass)


def _register_websocket_api(hass: HomeAssistant) -> None:
    from .websocket import async_register_websocket_api

    async_register_websocket_api(hass)


async def _forward_entry_setups(hass: HomeAssistant, entry: ConfigEntry) -> None:
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)


def _log_api_endpoints(entry_id: str) -> None:
    LOGGER.debug(
        "init setup_complete entry_id=%s svg_url=/api/unifi_network_map/%s/svg payload_url=/api/unifi_network_map/%s/payload",
        entry_id,
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
        LOGGER.warning("init frontend_bundle_missing path=%s", js_path)
        return
    _register_static_asset(hass, _frontend_bundle_base_url(), js_path)
    preview_path = _preview_image_path()
    if preview_path.exists():
        _register_static_asset(hass, _preview_image_url(), preview_path)
    LOGGER.debug("init lovelace_registration started url=%s", _frontend_bundle_url())
    _schedule_lovelace_resource_registration(hass)
    _create_install_notification(hass)
    _set_flag(data, "frontend_registered")


def _flag_is_set(data: dict[str, object], key: str) -> bool:
    return bool(data.get(key))


def _set_flag(data: dict[str, object], key: str) -> None:
    data[key] = True


def _create_install_notification(hass: HomeAssistant) -> None:
    """Create a one-time notification about card availability after install."""
    persistent_notification = getattr(
        getattr(hass, "components", None), "persistent_notification", None
    )
    if persistent_notification is None:
        LOGGER.debug("init notification_skipped reason=component_unavailable")
        return
    persistent_notification.async_create(
        title="UniFi Network Map Installed",
        message=(
            "The UniFi Network Map card has been installed. "
            "If you don't see it in the Lovelace card picker, "
            "**clear your browser cache** or do a **hard refresh** "
            "(Ctrl+Shift+R on Windows/Linux, Cmd+Shift+R on Mac)."
        ),
        notification_id=f"{DOMAIN}_install",
    )


def _frontend_bundle_path() -> Path:
    return Path(__file__).resolve().parent / "frontend" / "unifi-network-map.js"


def _read_integration_version() -> str:
    manifest_path = Path(__file__).resolve().parent / "manifest.json"
    with manifest_path.open() as f:
        return json.load(f)["version"]


_INTEGRATION_VERSION = _read_integration_version()


def _frontend_bundle_base_url() -> str:
    return "/unifi-network-map/unifi-network-map.js"


def _frontend_bundle_url() -> str:
    version = _INTEGRATION_VERSION
    bundle = _frontend_bundle_path()
    if bundle.exists():
        mtime = int(bundle.stat().st_mtime)
        return f"{_frontend_bundle_base_url()}?v={version}-{mtime}"
    return f"{_frontend_bundle_base_url()}?v={version}"


def _preview_image_path() -> Path:
    return Path(__file__).resolve().parent / "frontend" / "card-preview.svg"


def _preview_image_url() -> str:
    return "/unifi-network-map/card-preview.svg"


def _register_static_asset(hass: HomeAssistant, url_path: str, file_path: Path) -> None:
    if hasattr(hass.http, "register_static_path"):
        hass.http.register_static_path(
            url_path,
            str(file_path),
            cache_headers=True,
        )
        return
    if hasattr(hass.http, "async_register_static_paths"):
        configs = _build_static_path_configs(url_path, file_path)
        result = hass.http.async_register_static_paths(configs)
        if hasattr(result, "__await__"):
            hass.async_create_task(result)
        return
    LOGGER.warning("init static_asset_failed url=%s reason=api_missing", url_path)


def _build_static_path_configs(url_path: str, file_path: Path) -> list[object]:
    try:
        from homeassistant.components.http import StaticPathConfig
    except (ImportError, AttributeError):  # pragma: no cover - fallback for older HA
        StaticPathConfig = None

    if StaticPathConfig is not None:
        config = _make_static_path_config(StaticPathConfig, url_path, file_path)
        if config is not None:
            return [config]
    return [
        {
            "path": url_path,
            "file_path": str(file_path),
            "cache_headers": True,
        }
    ]


def _make_static_path_config(
    static_path_config: Callable[..., object], url_path: str, file_path: Path
) -> object | None:
    file_path_str = str(file_path)
    strategies: list[Callable[[], object | None]] = [
        lambda: static_path_config(url_path=url_path, file_path=file_path_str, cache_headers=True),
        lambda: static_path_config(url_path=url_path, path=file_path_str, cache_headers=True),
        lambda: static_path_config(url_path, file_path_str, True),
        lambda: static_path_config(url_path, file_path_str),
        lambda: _make_config_from_signature(static_path_config, url_path, file_path_str),
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
    lock = _get_lovelace_resource_lock(hass)
    async with lock:
        if _lovelace_resource_registered(hass):
            return

        data = hass.data.setdefault(DOMAIN, {})
        attempts = data.get("lovelace_resource_attempts", 0) + 1
        data["lovelace_resource_attempts"] = attempts
        LOGGER.debug("lovelace attempt=%d", attempts)
        if attempts > 6:
            _log_lovelace_registration_failure(hass, attempts)
            return

        resources = _load_lovelace_resources()
        if resources is None:
            LOGGER.debug("lovelace retry reason=module_unavailable")
            _schedule_lovelace_resource_retry(hass)
            return

        LOGGER.debug("lovelace module_loaded")
        items = await _fetch_lovelace_items(hass, resources)
        if items is None:
            LOGGER.debug("lovelace retry reason=items_unavailable")
            _schedule_lovelace_resource_retry(hass)
            return

        resource_url = _frontend_bundle_url()
        base_url = _frontend_bundle_base_url()
        LOGGER.debug("lovelace items_fetched count=%d target_url=%s", len(items), resource_url)

        existing = _find_existing_resource(items, base_url)
        if existing is not None:
            if existing.get("url") == resource_url:
                LOGGER.debug("lovelace already_registered url=%s", resource_url)
                _mark_lovelace_resource_registered(hass)
                return
            updated = await _update_lovelace_resource(hass, existing, resource_url)
            if updated:
                _mark_lovelace_resource_registered(hass)
            else:
                LOGGER.debug("lovelace retry reason=update_failed")
                _schedule_lovelace_resource_retry(hass)
            return

        LOGGER.debug("lovelace creating_resource url=%s", resource_url)
        created = await _create_lovelace_resource(hass, resources, resource_url)
        if created:
            _mark_lovelace_resource_registered(hass)
        else:
            LOGGER.debug("lovelace retry reason=creation_failed")
            _schedule_lovelace_resource_retry(hass)


def _find_existing_resource(items: list[ResourceItem], base_url: str) -> ResourceItem | None:
    for item in items:
        url = item.get("url", "")
        if isinstance(url, str) and url.split("?")[0] == base_url:
            return item
    return None


async def _update_lovelace_resource(hass: HomeAssistant, item: ResourceItem, new_url: str) -> bool:
    item_id = item.get("id")
    if not item_id or not isinstance(item_id, str):
        LOGGER.debug("lovelace update_skipped reason=no_item_id")
        return False
    try:
        lovelace_data = hass.data.get("lovelace")
        if not lovelace_data:
            return False
        resource_collection = _get_lovelace_resource_collection(lovelace_data)
        if resource_collection is None:
            return False
        result = resource_collection.async_update_item(item_id, {"url": new_url})
        if inspect.iscoroutine(result):
            await result
        LOGGER.debug("lovelace resource_updated url=%s", new_url)
        return True
    except Exception as err:
        LOGGER.debug("lovelace update_failed error=%s", err)
        return False


def _schedule_lovelace_resource_registration(hass: HomeAssistant) -> None:
    if hass.is_running:
        hass.async_create_task(_ensure_lovelace_resource(hass))
        return

    async def _on_start(_event: object) -> None:
        await _ensure_lovelace_resource(hass)

    hass.bus.async_listen_once(EVENT_HOMEASSISTANT_START, _on_start)


async def _retry_lovelace_resource(hass: HomeAssistant, delay_seconds: int) -> None:
    await asyncio.sleep(delay_seconds)
    await _ensure_lovelace_resource(hass)


def _schedule_lovelace_resource_retry(hass: HomeAssistant) -> None:
    data = hass.data.setdefault(DOMAIN, {})
    task = data.get("lovelace_resource_retry_task")
    if task and not task.done():
        return
    retry_task = hass.async_create_task(_retry_lovelace_resource(hass, 10))
    data["lovelace_resource_retry_task"] = retry_task

    def _on_retry_done(_task: asyncio.Task[None]) -> None:
        _clear_lovelace_retry_task(hass, retry_task)

    retry_task.add_done_callback(_on_retry_done)


def _log_lovelace_registration_failure(hass: HomeAssistant, attempts: int) -> None:
    data = hass.data.setdefault(DOMAIN, {})
    if data.get("lovelace_resource_failed"):
        return
    data["lovelace_resource_failed"] = True
    LOGGER.error(
        "lovelace registration_failed attempts=%d manual_url=%s manual_type=module",
        attempts,
        _frontend_bundle_url(),
    )


def _lovelace_resource_registered(hass: HomeAssistant) -> bool:
    data = hass.data.setdefault(DOMAIN, {})
    return bool(data.get("lovelace_resource_registered"))


def _mark_lovelace_resource_registered(hass: HomeAssistant) -> None:
    data = hass.data.setdefault(DOMAIN, {})
    data["lovelace_resource_registered"] = True
    data["lovelace_resource_attempts"] = 0
    data.pop("lovelace_resource_failed", None)
    data.pop("lovelace_resource_retry_task", None)


def _clear_lovelace_retry_task(hass: HomeAssistant, task: asyncio.Task[None]) -> None:
    data = hass.data.setdefault(DOMAIN, {})
    if data.get("lovelace_resource_retry_task") is task:
        data.pop("lovelace_resource_retry_task", None)


def _get_lovelace_resource_lock(hass: HomeAssistant) -> asyncio.Lock:
    data = hass.data.setdefault(DOMAIN, {})
    lock = data.get("lovelace_resource_lock")
    if isinstance(lock, asyncio.Lock):
        return lock
    lock = asyncio.Lock()
    data["lovelace_resource_lock"] = lock
    return lock


def _load_lovelace_resources() -> ModuleType | LovelaceResourcesModule | None:
    try:
        from homeassistant.components.lovelace import resources  # type: ignore[no-redef]

        return resources
    except (
        ImportError,
        AttributeError,
        ModuleNotFoundError,
    ):  # pragma: no cover - optional in tests
        pass
    try:
        return importlib.import_module("homeassistant.components.lovelace.resources")
    except (ImportError, ModuleNotFoundError):  # pragma: no cover - optional in tests
        return None


async def _fetch_lovelace_items(
    hass: HomeAssistant, resources: ModuleType | LovelaceResourcesModule
) -> list[ResourceItem] | None:
    # Try accessing the resource collection from hass.data["lovelace"].resources
    try:
        items = await _fetch_lovelace_items_from_collection(hass)
        if items is not None:
            return items
    except Exception as err:
        LOGGER.warning("lovelace collection_access_failed error=%s", err, exc_info=True)

    # Fallback to old API
    try:
        if not hasattr(resources, "async_get_info"):
            return None
        resources_module = cast(LovelaceResourcesModule, resources)
        info = resources_module.async_get_info(hass)
    except Exception as err:  # pragma: no cover - defensive
        LOGGER.debug("lovelace read_failed error=%s", err)
        return None
    if hasattr(info, "async_get_info"):
        try:
            info_module = cast(LovelaceResourcesInfo, info)
            result = info_module.async_get_info()
        except Exception as err:  # pragma: no cover - defensive
            LOGGER.debug("lovelace info_read_failed error=%s", err)
            return None
        return await _maybe_await_list(result)
    return _as_resource_list(info)


async def _fetch_lovelace_items_from_collection(
    hass: HomeAssistant,
) -> list[ResourceItem] | None:
    lovelace_data = hass.data.get("lovelace")
    if not lovelace_data:
        LOGGER.debug("lovelace data_missing")
        return None
    resource_collection = _get_lovelace_resource_collection(lovelace_data)
    if resource_collection is None:
        return None
    items = await _maybe_await_items(resource_collection.async_items())
    return list(items) if items else []


def _get_lovelace_resource_collection(
    lovelace_data: object,
) -> LovelaceResourceCollection | None:
    if not hasattr(lovelace_data, "resources"):
        LOGGER.debug("lovelace resources_attr_missing")
        return None
    resource_collection = cast(Any, lovelace_data).resources
    if not resource_collection:
        LOGGER.debug("lovelace resources_none")
        return None
    if not hasattr(resource_collection, "async_items"):
        LOGGER.debug("lovelace async_items_missing")
        return None
    return cast(LovelaceResourceCollection, resource_collection)


async def _create_lovelace_resource(
    hass: HomeAssistant, resources: ModuleType | LovelaceResourcesModule, resource_url: str
) -> bool:
    payload: Mapping[str, Any] = {"url": resource_url, "res_type": "module"}

    # Try accessing the resource collection directly
    try:
        lovelace_data = hass.data.get("lovelace")
        if lovelace_data:
            resource_collection = _get_lovelace_resource_collection(lovelace_data)
            if resource_collection is not None:
                result = resource_collection.async_create_item(payload)
                if inspect.iscoroutine(result):
                    await result
                LOGGER.debug("lovelace resource_registered url=%s method=collection", resource_url)
                return True
    except Exception as err:
        LOGGER.debug("lovelace collection_create_failed error=%s", err)

    # Fallback to old API
    result = await _create_lovelace_resource_with_module(hass, resources, payload)
    if result:
        LOGGER.debug("lovelace resource_registered url=%s method=module", resource_url)
        return True

    try:
        if not hasattr(resources, "async_get_info"):
            return False
        resources_module = cast(LovelaceResourcesModule, resources)
        info = resources_module.async_get_info(hass)
    except Exception as err:  # pragma: no cover - defensive
        LOGGER.debug("lovelace info_read_for_create_failed error=%s", err)
        return False

    created = await _create_lovelace_resource_with_collection(info, payload)
    if created:
        LOGGER.debug("lovelace resource_registered url=%s method=info_collection", resource_url)
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
        result = cast(
            Callable[[HomeAssistant, Mapping[str, Any]], Awaitable[None] | None],
            resources.async_create_item,
        )(hass, payload)
        if inspect.iscoroutine(result):
            await result
        return True
    except TypeError:
        try:
            result = cast(
                Callable[[Mapping[str, Any]], Awaitable[None] | None],
                resources.async_create_item,
            )(payload)
            if inspect.iscoroutine(result):
                await result
            return True
        except Exception as err:  # pragma: no cover - defensive
            LOGGER.debug("lovelace module_register_failed error=%s", err)
            return False
    except Exception as err:  # pragma: no cover - defensive
        LOGGER.debug("lovelace module_register_failed error=%s", err)
        return False


async def _create_lovelace_resource_with_collection(
    info: object, payload: Mapping[str, Any]
) -> bool:
    if not hasattr(info, "async_create_item"):
        return False
    try:
        collection = cast(LovelaceResourceCollection, info)
        result = collection.async_create_item(payload)
        if inspect.iscoroutine(result):
            await result
        return True
    except Exception as err:  # pragma: no cover - defensive
        LOGGER.debug("lovelace collection_register_failed error=%s", err)
        return False


async def _maybe_await_list(result: object) -> list[ResourceItem] | None:
    if inspect.iscoroutine(result):
        return _as_resource_list(await result)
    return _as_resource_list(result)


async def _maybe_await_items(
    result: list[ResourceItem] | Awaitable[list[ResourceItem]],
) -> list[ResourceItem]:
    if inspect.iscoroutine(result):
        return await cast(Awaitable[list[ResourceItem]], result)
    return cast(list[ResourceItem], result)


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
