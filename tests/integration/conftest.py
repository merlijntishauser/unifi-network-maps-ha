from __future__ import annotations

from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.unifi_network_map.const import DOMAIN


def build_mock_entry(
    options: dict[str, object] | None = None,
) -> MockConfigEntry:
    return MockConfigEntry(
        domain=DOMAIN,
        data={
            "url": "https://controller.local",
            "username": "user",
            "password": "pass",
            "site": "default",
        },
        options=options or {},
    )
