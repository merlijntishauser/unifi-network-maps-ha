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


def _create_module(name: str) -> Any:
    return cast(Any, ModuleType(name))


def _create_homeassistant_modules() -> dict[str, Any]:
    return {
        "homeassistant": _create_module("homeassistant"),
        "homeassistant.config_entries": _create_module("homeassistant.config_entries"),
        "homeassistant.core": _create_module("homeassistant.core"),
        "homeassistant.const": _create_module("homeassistant.const"),
        "homeassistant.components": _create_module("homeassistant.components"),
        "homeassistant.components.http": _create_module("homeassistant.components.http"),
        "homeassistant.components.diagnostics": _create_module(
            "homeassistant.components.diagnostics"
        ),
        "homeassistant.components.sensor": _create_module("homeassistant.components.sensor"),
        "homeassistant.components.binary_sensor": _create_module(
            "homeassistant.components.binary_sensor"
        ),
        "homeassistant.components.websocket_api": _create_module(
            "homeassistant.components.websocket_api"
        ),
        "homeassistant.helpers": _create_module("homeassistant.helpers"),
        "homeassistant.helpers.update_coordinator": _create_module(
            "homeassistant.helpers.update_coordinator"
        ),
        "homeassistant.helpers.selector": _create_module("homeassistant.helpers.selector"),
        "homeassistant.helpers.device_registry": _create_module(
            "homeassistant.helpers.device_registry"
        ),
        "homeassistant.helpers.entity_registry": _create_module(
            "homeassistant.helpers.entity_registry"
        ),
        "homeassistant.helpers.entity_platform": _create_module(
            "homeassistant.helpers.entity_platform"
        ),
        "homeassistant.exceptions": _create_module("homeassistant.exceptions"),
    }


def _register_config_entry_stubs(modules: dict[str, Any]) -> None:
    config_entries = modules["homeassistant.config_entries"]

    class ConfigEntry:  # minimal stub for imports
        pass

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
        def async_show_form(
            self,
            *,
            step_id: str,
            data_schema,
            errors: dict[str, str] | None = None,
        ):
            return {
                "type": "form",
                "step_id": step_id,
                "data_schema": data_schema,
                "errors": errors,
            }

        def async_create_entry(self, *, title: str, data: dict[str, object]):
            return {"type": "create_entry", "title": title, "data": data}

    config_entries.ConfigEntry = ConfigEntry
    config_entries.ConfigFlow = ConfigFlow
    config_entries.OptionsFlow = OptionsFlow


def _register_core_stubs(modules: dict[str, Any]) -> None:
    core = modules["homeassistant.core"]
    const = modules["homeassistant.const"]

    class HomeAssistant:  # minimal stub for imports
        async def async_add_executor_job(self, func, *args: object):
            return func(*args)

    class ServiceCall:  # minimal stub for imports
        def __init__(self, data: dict[str, object] | None = None) -> None:
            self.data = data or {}

    class Event:  # minimal stub for imports
        def __init__(self, data: dict[str, object] | None = None) -> None:
            self.data = data or {}

        @classmethod
        def __class_getitem__(cls, _item: object):
            return cls

    def callback(func):
        """Stub callback decorator."""
        return func

    core.HomeAssistant = HomeAssistant
    core.ServiceCall = ServiceCall
    core.Event = Event
    core.callback = callback
    const.CONF_PASSWORD = "password"
    const.CONF_URL = "url"
    const.CONF_USERNAME = "username"
    const.EVENT_HOMEASSISTANT_START = "homeassistant_start"


def _register_helpers_stubs(modules: dict[str, Any]) -> None:
    helpers_update = modules["homeassistant.helpers.update_coordinator"]
    exceptions = modules["homeassistant.exceptions"]

    class CoordinatorEntity:  # minimal stub for imports
        def __init__(self, coordinator: object) -> None:
            self.coordinator = coordinator

        @classmethod
        def __class_getitem__(cls, _item: object):
            return cls

    class DataUpdateCoordinator:  # minimal stub for imports
        def __init__(self, *args: object, **kwargs: object) -> None:
            self.hass = args[0] if args else None

        @classmethod
        def __class_getitem__(cls, _item: object):
            return cls

    class UpdateFailed(Exception):
        pass

    helpers_update.DataUpdateCoordinator = DataUpdateCoordinator
    helpers_update.UpdateFailed = UpdateFailed
    helpers_update.CoordinatorEntity = CoordinatorEntity
    exceptions.HomeAssistantError = Exception


def _register_registry_stubs(modules: dict[str, Any]) -> None:
    device_registry = modules["homeassistant.helpers.device_registry"]
    entity_registry = modules["homeassistant.helpers.entity_registry"]

    class DeviceEntryType:  # minimal stub for imports
        SERVICE = "service"

    class DeviceInfo(dict[str, object]):  # minimal stub for imports
        def __init__(self, **kwargs: object) -> None:
            super().__init__(kwargs)

    device_registry.CONNECTION_NETWORK_MAC = "mac"
    device_registry.async_get = _async_get_stub
    device_registry.format_mac = _format_mac
    device_registry.DeviceEntryType = DeviceEntryType
    device_registry.DeviceInfo = DeviceInfo
    device_registry.EVENT_DEVICE_REGISTRY_UPDATED = "device_registry_updated"
    entity_registry.async_get = _async_get_stub
    entity_registry.EVENT_ENTITY_REGISTRY_UPDATED = "entity_registry_updated"


def _register_components_stubs(modules: dict[str, Any]) -> None:
    components_http = modules["homeassistant.components.http"]
    components_diagnostics = modules["homeassistant.components.diagnostics"]
    components_sensor = modules["homeassistant.components.sensor"]
    components_binary_sensor = modules["homeassistant.components.binary_sensor"]
    helpers_entity_platform = modules["homeassistant.helpers.entity_platform"]

    def async_redact_data(data: dict[str, object], _keys: set[str]) -> dict[str, object]:
        return dict(data)

    class SensorEntity:  # minimal stub for imports
        @property
        def unique_id(self) -> str | None:
            return getattr(self, "_attr_unique_id", None)

    class SensorStateClass:  # minimal stub for imports
        MEASUREMENT = "measurement"
        TOTAL = "total"
        TOTAL_INCREASING = "total_increasing"

    class BinarySensorEntity:  # minimal stub for imports
        @property
        def unique_id(self) -> str | None:
            return getattr(self, "_attr_unique_id", None)

        @property
        def name(self) -> str | None:
            return getattr(self, "_attr_name", None)

        @property
        def device_info(self) -> dict[str, object] | None:
            return getattr(self, "_attr_device_info", None)

        @property
        def device_class(self) -> str | None:
            return getattr(self, "_attr_device_class", None)

    class BinarySensorDeviceClass:  # minimal stub for imports
        CONNECTIVITY = "connectivity"
        PRESENCE = "presence"

    class HomeAssistantView:  # minimal stub for imports
        url = ""
        name = ""

    @dataclass
    class StaticPathConfig:  # minimal stub for imports
        url_path: str
        path: str
        cache_headers: bool

    # Type alias for AddEntitiesCallback
    AddEntitiesCallback = Any

    components_http.HomeAssistantView = HomeAssistantView
    components_http.StaticPathConfig = StaticPathConfig
    components_diagnostics.async_redact_data = async_redact_data
    components_sensor.SensorEntity = SensorEntity
    components_sensor.SensorStateClass = SensorStateClass
    components_binary_sensor.BinarySensorEntity = BinarySensorEntity
    components_binary_sensor.BinarySensorDeviceClass = BinarySensorDeviceClass
    helpers_entity_platform.AddEntitiesCallback = AddEntitiesCallback


def _register_selector_stubs(modules: dict[str, Any]) -> None:
    selector = modules["homeassistant.helpers.selector"]

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


def _register_websocket_stubs(modules: dict[str, Any]) -> None:
    components_websocket_api = modules["homeassistant.components.websocket_api"]

    def websocket_command(_schema: dict[str, object]):
        def decorator(func):
            return func

        return decorator

    def async_response(func):
        return func

    def async_register_command(_hass: object, _handler: object) -> None:
        pass

    def event_message(msg_id: int, data: dict[str, object]) -> dict[str, object]:
        return {"id": msg_id, "type": "event", "event": data}

    class ActiveConnection:  # minimal stub for imports
        def __init__(self) -> None:
            self.subscriptions: dict[int, object] = {}

        def send_message(self, msg: dict[str, object]) -> None:
            pass

        def send_error(self, msg_id: int, code: str, message: str) -> None:
            pass

    components_websocket_api.websocket_command = websocket_command
    components_websocket_api.async_response = async_response
    components_websocket_api.async_register_command = async_register_command
    components_websocket_api.event_message = event_message
    components_websocket_api.ActiveConnection = ActiveConnection


def _register_modules(modules: dict[str, Any]) -> None:
    for name, module in modules.items():
        sys.modules.setdefault(name, module)


def _install_homeassistant_stubs() -> None:
    modules = _create_homeassistant_modules()
    modules["homeassistant"].__path__ = []
    _register_config_entry_stubs(modules)
    _register_core_stubs(modules)
    _register_helpers_stubs(modules)
    _register_registry_stubs(modules)
    _register_components_stubs(modules)
    _register_selector_stubs(modules)
    _register_websocket_stubs(modules)
    _register_modules(modules)


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
