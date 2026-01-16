from __future__ import annotations

import asyncio

import custom_components.unifi_network_map as unifi_network_map


class _FakeHass:
    pass


class _ResourceCollection:
    def __init__(self, created: list[dict[str, object]]) -> None:
        self._created = created

    def async_get_info(self):
        return []

    async def async_create_item(self, payload: dict[str, object]) -> None:
        self._created.append(payload)


class _ResourcesModule:
    def __init__(self) -> None:
        self.created: list[dict[str, object]] = []

    def async_get_info(self, _hass: _FakeHass):
        return _ResourceCollection(self.created)


def test_lovelace_resource_create_uses_collection() -> None:
    hass = _FakeHass()
    resources = _ResourcesModule()
    create_resource = getattr(unifi_network_map, "_create_lovelace_resource")
    asyncio.run(create_resource(hass, resources, "/unifi-network-map/unifi-network-map.js"))
    assert resources.created == [
        {"url": "/unifi-network-map/unifi-network-map.js", "type": "module"}
    ]
