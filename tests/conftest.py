from __future__ import annotations

import sys
from pathlib import Path
from types import ModuleType
from typing import Any, cast


PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


def _install_homeassistant_stubs() -> None:
    homeassistant = cast(Any, ModuleType("homeassistant"))
    homeassistant.__path__ = []  # mark as package for submodule imports
    config_entries = cast(Any, ModuleType("homeassistant.config_entries"))
    core = cast(Any, ModuleType("homeassistant.core"))
    const = cast(Any, ModuleType("homeassistant.const"))
    components = cast(Any, ModuleType("homeassistant.components"))
    components_http = cast(Any, ModuleType("homeassistant.components.http"))
    helpers = cast(Any, ModuleType("homeassistant.helpers"))
    device_registry = cast(Any, ModuleType("homeassistant.helpers.device_registry"))
    entity_registry = cast(Any, ModuleType("homeassistant.helpers.entity_registry"))
    update_coordinator = cast(Any, ModuleType("homeassistant.helpers.update_coordinator"))
    exceptions = cast(Any, ModuleType("homeassistant.exceptions"))

    class ConfigEntry:  # minimal stub for imports
        pass

    class HomeAssistant:  # minimal stub for imports
        async def async_add_executor_job(self, func, *args: object):
            return func(*args)

    class ConfigFlow:  # minimal stub for imports
        def __init_subclass__(cls, **_kwargs: object) -> None:
            return None

        def async_show_form(self, *, step_id: str, data_schema, errors: dict[str, str]):
            return {
                "type": "form",
                "step_id": step_id,
                "data_schema": data_schema,
                "errors": errors,
            }

        def async_create_entry(self, *, title: str, data: dict[str, object]):
            return {"type": "create_entry", "title": title, "data": data}

    class OptionsFlow:  # minimal stub for imports
        def async_show_form(self, *, step_id: str, data_schema):
            return {"type": "form", "step_id": step_id, "data_schema": data_schema}

        def async_create_entry(self, *, title: str, data: dict[str, object]):
            return {"type": "create_entry", "title": title, "data": data}

    class DataUpdateCoordinator:  # minimal stub for imports
        def __init__(self, *args: object, **kwargs: object) -> None:
            self.hass = args[0] if args else None

        @classmethod
        def __class_getitem__(cls, _item: object):
            return cls

    class UpdateFailed(Exception):
        pass

    class HomeAssistantView:  # minimal stub for imports
        url = ""
        name = ""

    config_entries.ConfigEntry = ConfigEntry
    config_entries.ConfigFlow = ConfigFlow
    config_entries.OptionsFlow = OptionsFlow
    core.HomeAssistant = HomeAssistant
    const.CONF_PASSWORD = "password"
    const.CONF_URL = "url"
    const.CONF_USERNAME = "username"
    const.EVENT_HOMEASSISTANT_START = "homeassistant_start"
    update_coordinator.DataUpdateCoordinator = DataUpdateCoordinator
    update_coordinator.UpdateFailed = UpdateFailed
    exceptions.HomeAssistantError = Exception
    device_registry.CONNECTION_NETWORK_MAC = "mac"
    components_http.HomeAssistantView = HomeAssistantView

    sys.modules.setdefault("homeassistant", homeassistant)
    sys.modules.setdefault("homeassistant.components", components)
    sys.modules.setdefault("homeassistant.components.http", components_http)
    sys.modules.setdefault("homeassistant.config_entries", config_entries)
    sys.modules.setdefault("homeassistant.core", core)
    sys.modules.setdefault("homeassistant.const", const)
    sys.modules.setdefault("homeassistant.helpers", helpers)
    sys.modules.setdefault("homeassistant.helpers.device_registry", device_registry)
    sys.modules.setdefault("homeassistant.helpers.entity_registry", entity_registry)
    sys.modules.setdefault("homeassistant.helpers.update_coordinator", update_coordinator)
    sys.modules.setdefault("homeassistant.exceptions", exceptions)


def _install_aiohttp_stubs() -> None:
    aiohttp = cast(Any, ModuleType("aiohttp"))
    web = cast(Any, ModuleType("aiohttp.web"))
    aiohttp.web = web
    sys.modules.setdefault("aiohttp", aiohttp)
    sys.modules.setdefault("aiohttp.web", web)


_install_homeassistant_stubs()
_install_aiohttp_stubs()
