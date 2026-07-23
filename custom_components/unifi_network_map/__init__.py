from __future__ import annotations

import asyncio
import inspect
import json
import logging
from collections.abc import Awaitable, Callable, Mapping
from pathlib import Path
from typing import TYPE_CHECKING, Any, Protocol, cast

import voluptuous as vol
from homeassistant.components import persistent_notification
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntryState
from homeassistant.const import EVENT_HOMEASSISTANT_START
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

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry
    from homeassistant.core import HomeAssistant, ServiceCall

    from .data import UniFiNetworkMapConfigEntry

ResourceItem = Mapping[str, Any]
_unifi_api_info_filter_added = False


class _UnifiApiInfoFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        return record.levelno != logging.INFO


class LovelaceResourceCollection(Protocol):
    def async_items(
        self,
    ) -> list[ResourceItem] | Awaitable[list[ResourceItem]]: ...

    def async_create_item(
        self, payload: Mapping[str, Any]
    ) -> Awaitable[None] | None: ...

    def async_update_item(
        self, item_id: str, payload: Mapping[str, Any]
    ) -> Awaitable[None] | None: ...


async def async_setup_entry(
    hass: HomeAssistant,
    entry: UniFiNetworkMapConfigEntry,
) -> bool:
    from .http import register_unifi_http_views

    _suppress_unifi_api_info_logs(hass)
    _register_websocket_api(hass)
    _configure_payload_cache_ttl(hass, entry)
    coordinator = UniFiNetworkMapCoordinator(hass, entry)
    await _initialize_coordinator(coordinator)
    entry.runtime_data = coordinator
    _register_runtime_services(hass, register_unifi_http_views)
    await _forward_entry_setups(hass, entry)
    entry.async_on_unload(entry.add_update_listener(_async_options_updated))
    _log_api_endpoints(entry.entry_id)
    return True


async def _async_options_updated(
    hass: HomeAssistant,
    entry: UniFiNetworkMapConfigEntry,
) -> None:
    """Handle options update -- rebuild coordinator and refresh."""
    from .payload_cache import invalidate_payload_cache

    _configure_payload_cache_ttl(hass, entry)
    invalidate_payload_cache(hass, entry.entry_id)
    coordinator = entry.runtime_data
    coordinator.update_settings()
    await coordinator.async_request_refresh()
    LOGGER.debug("init options_updated entry_id=%s", entry.entry_id)


async def async_unload_entry(
    hass: HomeAssistant,
    entry: UniFiNetworkMapConfigEntry,
) -> bool:
    from . import entity_cache
    from .payload_cache import invalidate_payload_cache

    unload_ok = await hass.config_entries.async_unload_platforms(
        entry, PLATFORMS
    )
    if unload_ok:
        entity_cache.invalidate_entity_cache(hass)
        invalidate_payload_cache(hass, entry.entry_id)
        if not _other_loaded_entries(hass, entry):
            entity_cache.cleanup_entity_cache(hass)
    return unload_ok


def _other_loaded_entries(
    hass: HomeAssistant, entry: UniFiNetworkMapConfigEntry
) -> list[ConfigEntry]:
    return [
        other
        for other in hass.config_entries.async_entries(DOMAIN)
        if other.entry_id != entry.entry_id
        and other.state is ConfigEntryState.LOADED
    ]


async def async_migrate_entry(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
) -> bool:
    """Migrate config entry to a new version."""
    LOGGER.debug(
        "init migrating entry version=%s.%s",
        config_entry.version,
        config_entry.minor_version,
    )
    # No migrations needed yet (VERSION=1, MINOR_VERSION=1).
    # Future migrations go here.
    return True


def _suppress_unifi_api_info_logs(hass: HomeAssistant) -> None:
    global _unifi_api_info_filter_added
    if _unifi_api_info_filter_added or getattr(
        getattr(hass, "config", None), "debug", False
    ):
        return
    logging.getLogger("unifi_topology.adapters.unifi_api").addFilter(
        _UnifiApiInfoFilter()
    )
    _unifi_api_info_filter_added = True


def _configure_payload_cache_ttl(
    hass: HomeAssistant, entry: ConfigEntry
) -> None:
    """Configure the payload cache TTL from entry options."""
    from .payload_cache import set_payload_cache_ttl

    ttl = entry.options.get(
        CONF_PAYLOAD_CACHE_TTL, DEFAULT_PAYLOAD_CACHE_TTL_SECONDS
    )
    set_payload_cache_ttl(hass, float(ttl))


def _register_refresh_service(hass: HomeAssistant) -> None:
    if _refresh_service_registered(hass):
        return
    handler = _build_refresh_handler(hass)
    _register_refresh_handler(hass, handler)
    _mark_refresh_service_registered(hass)


async def _initialize_coordinator(
    coordinator: UniFiNetworkMapCoordinator,
) -> None:
    await coordinator.async_config_entry_first_refresh()


def _register_runtime_services(
    hass: HomeAssistant, register_views: Callable[[HomeAssistant], None]
) -> None:
    register_views(hass)
    _register_frontend_assets(hass)
    _register_refresh_service(hass)


def _register_websocket_api(hass: HomeAssistant) -> None:
    from .websocket import async_register_websocket_api

    async_register_websocket_api(hass)


async def _forward_entry_setups(
    hass: HomeAssistant, entry: ConfigEntry
) -> None:
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)


def _log_api_endpoints(entry_id: str) -> None:
    LOGGER.debug(
        "init setup_complete entry_id=%s"
        " svg_url=/api/unifi_network_map/%s/svg"
        " payload_url=/api/unifi_network_map/%s/payload",
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


def _build_refresh_handler(
    hass: HomeAssistant,
) -> Callable[[ServiceCall], Awaitable[None]]:
    async def _handle_refresh(call: ServiceCall) -> None:
        entry_id = call.data.get(ATTR_ENTRY_ID)
        coordinators = _select_coordinators(hass, entry_id)
        if not coordinators:
            raise HomeAssistantError(
                "No matching UniFi Network Map entry found"
            )
        for coordinator in coordinators:
            await coordinator.async_force_refresh()

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
    LOGGER.debug(
        "init lovelace_registration started url=%s", _frontend_bundle_url()
    )
    _schedule_lovelace_resource_registration(hass)
    _create_install_notification(hass)
    _set_flag(data, "frontend_registered")


def _flag_is_set(data: dict[str, object], key: str) -> bool:
    return bool(data.get(key))


def _set_flag(data: dict[str, object], key: str) -> None:
    data[key] = True


def _create_install_notification(hass: HomeAssistant) -> None:
    """Create a one-time notification about card availability after install."""
    persistent_notification.async_create(
        hass,
        (
            "The UniFi Network Map card has been installed. "
            "If you don't see it in the Lovelace card picker, "
            "**clear your browser cache** or do a **hard refresh** "
            "(Ctrl+Shift+R on Windows/Linux, Cmd+Shift+R on Mac)."
        ),
        title="UniFi Network Map Installed",
        notification_id=f"{DOMAIN}_install",
    )


def _frontend_bundle_path() -> Path:
    return (
        Path(__file__).resolve().parent / "frontend" / "unifi-network-map.js"
    )


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


def _register_static_asset(
    hass: HomeAssistant, url_path: str, file_path: Path
) -> None:
    hass.async_create_task(
        hass.http.async_register_static_paths(
            [StaticPathConfig(url_path, str(file_path), True)]
        )
    )


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

        items = await _fetch_lovelace_items(hass)
        if items is None:
            LOGGER.debug("lovelace retry reason=items_unavailable")
            _schedule_lovelace_resource_retry(hass)
            return

        resource_url = _frontend_bundle_url()
        base_url = _frontend_bundle_base_url()
        LOGGER.debug(
            "lovelace items_fetched count=%d target_url=%s",
            len(items),
            resource_url,
        )

        existing = _find_existing_resource(items, base_url)
        if existing is not None:
            if existing.get("url") == resource_url:
                LOGGER.debug(
                    "lovelace already_registered url=%s", resource_url
                )
                _mark_lovelace_resource_registered(hass)
                return
            updated = await _update_lovelace_resource(
                hass, existing, resource_url
            )
            if updated:
                _mark_lovelace_resource_registered(hass)
            else:
                LOGGER.debug("lovelace retry reason=update_failed")
                _schedule_lovelace_resource_retry(hass)
            return

        LOGGER.debug("lovelace creating_resource url=%s", resource_url)
        created = await _create_lovelace_resource(hass, resource_url)
        if created:
            _mark_lovelace_resource_registered(hass)
        else:
            LOGGER.debug("lovelace retry reason=creation_failed")
            _schedule_lovelace_resource_retry(hass)


def _find_existing_resource(
    items: list[ResourceItem], base_url: str
) -> ResourceItem | None:
    for item in items:
        url = item.get("url", "")
        if isinstance(url, str) and url.split("?")[0] == base_url:
            return item
    return None


async def _update_lovelace_resource(
    hass: HomeAssistant, item: ResourceItem, new_url: str
) -> bool:
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
        result = resource_collection.async_update_item(
            item_id, {"url": new_url}
        )
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


async def _retry_lovelace_resource(
    hass: HomeAssistant, delay_seconds: int
) -> None:
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


def _log_lovelace_registration_failure(
    hass: HomeAssistant, attempts: int
) -> None:
    data = hass.data.setdefault(DOMAIN, {})
    if data.get("lovelace_resource_failed"):
        return
    data["lovelace_resource_failed"] = True
    LOGGER.error(
        "lovelace registration_failed"
        " attempts=%d manual_url=%s"
        " manual_type=module",
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


def _clear_lovelace_retry_task(
    hass: HomeAssistant, task: asyncio.Task[None]
) -> None:
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


async def _fetch_lovelace_items(
    hass: HomeAssistant,
) -> list[ResourceItem] | None:
    lovelace_data = hass.data.get("lovelace")
    if not lovelace_data:
        LOGGER.debug("lovelace data_missing")
        return None
    resource_collection = _get_lovelace_resource_collection(lovelace_data)
    if resource_collection is None:
        return None
    try:
        items = await _maybe_await_items(resource_collection.async_items())
    except Exception as err:
        LOGGER.warning(
            "lovelace collection_access_failed error=%s", err, exc_info=True
        )
        return None
    return list(items) if items else []


def _get_lovelace_resource_collection(
    lovelace_data: object,
) -> LovelaceResourceCollection | None:
    if not hasattr(lovelace_data, "resources"):
        LOGGER.debug("lovelace resources_attr_missing")
        return None
    resource_collection = cast("Any", lovelace_data).resources
    if not resource_collection:
        LOGGER.debug("lovelace resources_none")
        return None
    if not hasattr(resource_collection, "async_items"):
        LOGGER.debug("lovelace async_items_missing")
        return None
    return cast("LovelaceResourceCollection", resource_collection)


async def _create_lovelace_resource(
    hass: HomeAssistant, resource_url: str
) -> bool:
    payload: Mapping[str, Any] = {"url": resource_url, "res_type": "module"}
    lovelace_data = hass.data.get("lovelace")
    if not lovelace_data:
        return False
    resource_collection = _get_lovelace_resource_collection(lovelace_data)
    if resource_collection is None:
        return False
    try:
        result = resource_collection.async_create_item(payload)
        if inspect.iscoroutine(result):
            await result
    except Exception as err:
        LOGGER.debug("lovelace collection_create_failed error=%s", err)
        return False
    LOGGER.debug("lovelace resource_registered url=%s", resource_url)
    return True


async def _maybe_await_items(
    result: list[ResourceItem] | Awaitable[list[ResourceItem]],
) -> list[ResourceItem]:
    if inspect.iscoroutine(result):
        return await cast("Awaitable[list[ResourceItem]]", result)
    return cast("list[ResourceItem]", result)


def _select_coordinators(
    hass: HomeAssistant, entry_id: str | None
) -> list[UniFiNetworkMapCoordinator]:
    entries = hass.config_entries.async_entries(DOMAIN)
    return [
        entry.runtime_data
        for entry in entries
        if hasattr(entry, "runtime_data")
        and isinstance(entry.runtime_data, UniFiNetworkMapCoordinator)
        and (entry_id is None or entry.entry_id == entry_id)
    ]
