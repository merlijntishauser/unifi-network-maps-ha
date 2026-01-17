from __future__ import annotations

import sys
from pathlib import Path
from dataclasses import dataclass
import importlib.util
from types import ModuleType
from typing import Any, cast


def _format_mac(value: str) -> str:
    cleaned = "".join(ch for ch in value if ch.isalnum())
    if len(cleaned) != 12:
        raise ValueError("Invalid MAC length")
    if not all(ch in "0123456789abcdefABCDEF" for ch in cleaned):
        raise ValueError("Invalid MAC characters")
    return ":".join(cleaned[i : i + 2] for i in range(0, 12, 2)).lower()


def _async_get_stub(_hass: object) -> None:
    return None


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
    selector = cast(Any, ModuleType("homeassistant.helpers.selector"))
    device_registry = cast(Any, ModuleType("homeassistant.helpers.device_registry"))
    entity_registry = cast(Any, ModuleType("homeassistant.helpers.entity_registry"))
    update_coordinator = cast(Any, ModuleType("homeassistant.helpers.update_coordinator"))
    exceptions = cast(Any, ModuleType("homeassistant.exceptions"))

    class ConfigEntry:  # minimal stub for imports
        pass

    class HomeAssistant:  # minimal stub for imports
        async def async_add_executor_job(self, func, *args: object):
            return func(*args)

    class ServiceCall:  # minimal stub for imports
        def __init__(self, data: dict[str, object] | None = None) -> None:
            self.data = data or {}

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

    @dataclass
    class StaticPathConfig:  # minimal stub for imports
        url_path: str
        path: str
        cache_headers: bool

    class BooleanSelector:  # minimal stub for imports
        def __init__(self) -> None:
            pass

    class SelectSelectorConfig:  # minimal stub for imports
        def __init__(self, **_kwargs: object) -> None:
            pass

    class SelectOptionDict(dict[str, str]):  # minimal stub for imports
        pass

    class SelectSelectorMode:  # minimal stub for imports
        DROPDOWN = "dropdown"

    class SelectSelector:  # minimal stub for imports
        def __init__(self, *_args: object, **_kwargs: object) -> None:
            pass

    class NumberSelectorConfig:  # minimal stub for imports
        def __init__(self, **_kwargs: object) -> None:
            pass

    class NumberSelectorMode:  # minimal stub for imports
        BOX = "box"

    class NumberSelector:  # minimal stub for imports
        def __init__(self, *_args: object, **_kwargs: object) -> None:
            pass

    class TextSelectorConfig:  # minimal stub for imports
        def __init__(self, **_kwargs: object) -> None:
            pass

    class TextSelectorType:  # minimal stub for imports
        NUMBER = "number"

    class TextSelector:  # minimal stub for imports
        def __init__(self, *_args: object, **_kwargs: object) -> None:
            pass

    config_entries.ConfigEntry = ConfigEntry
    config_entries.ConfigFlow = ConfigFlow
    config_entries.OptionsFlow = OptionsFlow
    core.HomeAssistant = HomeAssistant
    core.ServiceCall = ServiceCall
    const.CONF_PASSWORD = "password"
    const.CONF_URL = "url"
    const.CONF_USERNAME = "username"
    const.EVENT_HOMEASSISTANT_START = "homeassistant_start"
    update_coordinator.DataUpdateCoordinator = DataUpdateCoordinator
    update_coordinator.UpdateFailed = UpdateFailed
    exceptions.HomeAssistantError = Exception
    device_registry.CONNECTION_NETWORK_MAC = "mac"
    device_registry.async_get = _async_get_stub
    device_registry.format_mac = _format_mac
    entity_registry.async_get = _async_get_stub
    components_http.HomeAssistantView = HomeAssistantView
    components_http.StaticPathConfig = StaticPathConfig
    selector.BooleanSelector = BooleanSelector
    selector.SelectSelector = SelectSelector
    selector.SelectSelectorConfig = SelectSelectorConfig
    selector.SelectOptionDict = SelectOptionDict
    selector.SelectSelectorMode = SelectSelectorMode
    selector.NumberSelector = NumberSelector
    selector.NumberSelectorConfig = NumberSelectorConfig
    selector.NumberSelectorMode = NumberSelectorMode
    selector.TextSelector = TextSelector
    selector.TextSelectorConfig = TextSelectorConfig
    selector.TextSelectorType = TextSelectorType

    sys.modules.setdefault("homeassistant", homeassistant)
    sys.modules.setdefault("homeassistant.components", components)
    sys.modules.setdefault("homeassistant.components.http", components_http)
    sys.modules.setdefault("homeassistant.config_entries", config_entries)
    sys.modules.setdefault("homeassistant.core", core)
    sys.modules.setdefault("homeassistant.const", const)
    sys.modules.setdefault("homeassistant.helpers", helpers)
    sys.modules.setdefault("homeassistant.helpers.selector", selector)
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


def _install_voluptuous() -> None:
    """Install voluptuous in sys.modules if not already available."""
    if importlib.util.find_spec("voluptuous") is not None:
        return
    # If voluptuous is not installed, create a minimal stub
    vol = cast(Any, ModuleType("voluptuous"))

    def _schema(value: object) -> object:
        return value

    def _identity(value: object, *args: object, **kwargs: object) -> object:
        return value

    def _in(*_args: object) -> object | None:
        return None

    vol.Schema = _schema
    vol.Optional = _identity
    vol.Required = _identity
    vol.In = _in
    sys.modules.setdefault("voluptuous", vol)


def _install_yarl() -> None:
    """Install yarl in sys.modules if not already available."""
    if importlib.util.find_spec("yarl") is not None:
        return
    # If yarl is not installed, create a minimal stub
    yarl_module = cast(Any, ModuleType("yarl"))

    class _FakeURL:
        def __init__(self, url: str) -> None:
            from urllib.parse import urlparse

            parsed = urlparse(url)
            self.scheme: str = parsed.scheme
            self.host: str | None = parsed.hostname
            self.path: str = parsed.path
            self.user: str | None = parsed.username
            self.password: str | None = parsed.password

    yarl_module.URL = _FakeURL
    sys.modules.setdefault("yarl", yarl_module)


_install_homeassistant_stubs()
_install_aiohttp_stubs()
_install_voluptuous()
_install_yarl()
