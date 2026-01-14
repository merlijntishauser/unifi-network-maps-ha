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
    helpers = cast(Any, ModuleType("homeassistant.helpers"))
    update_coordinator = cast(Any, ModuleType("homeassistant.helpers.update_coordinator"))

    class ConfigEntry:  # minimal stub for imports
        pass

    class HomeAssistant:  # minimal stub for imports
        pass

    class DataUpdateCoordinator:  # minimal stub for imports
        def __init__(self, *args: object, **kwargs: object) -> None:
            self.hass = args[0] if args else None

        @classmethod
        def __class_getitem__(cls, _item: object):
            return cls

    class UpdateFailed(Exception):
        pass

    config_entries.ConfigEntry = ConfigEntry
    core.HomeAssistant = HomeAssistant
    const.CONF_PASSWORD = "password"
    const.CONF_URL = "url"
    const.CONF_USERNAME = "username"
    update_coordinator.DataUpdateCoordinator = DataUpdateCoordinator
    update_coordinator.UpdateFailed = UpdateFailed

    sys.modules.setdefault("homeassistant", homeassistant)
    sys.modules.setdefault("homeassistant.config_entries", config_entries)
    sys.modules.setdefault("homeassistant.core", core)
    sys.modules.setdefault("homeassistant.const", const)
    sys.modules.setdefault("homeassistant.helpers", helpers)
    sys.modules.setdefault("homeassistant.helpers.update_coordinator", update_coordinator)


_install_homeassistant_stubs()
