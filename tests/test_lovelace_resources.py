from __future__ import annotations

import asyncio

import custom_components.unifi_network_map as unifi_network_map


class _FakeHass:
    """Fake HomeAssistant instance for testing."""

    def __init__(self) -> None:
        self.data: dict[str, object] = {}
        self.is_running = False
        self.bus = _FakeBus()
        self.tasks: list[object] = []

    def async_create_task(self, coro: object) -> object:
        """Create a task from a coroutine."""
        self.tasks.append(coro)
        if hasattr(coro, "close"):
            coro.close()
        return coro


class _FakeBus:
    """Fake event bus for testing."""

    def __init__(self) -> None:
        self.listeners: dict[str, list[object]] = {}

    def async_listen_once(self, event_type: str, callback):
        """Register a one-time listener."""
        if event_type not in self.listeners:
            self.listeners[event_type] = []
        self.listeners[event_type].append(callback)

    async def fire_event(self, event_type: str):
        """Fire an event to all listeners."""
        for listener in self.listeners.get(event_type, []):
            await listener(None)


class _ResourceCollection:
    """Mock Lovelace resource collection."""

    def __init__(self, items: list[dict[str, object]] | None = None) -> None:
        self.items: list[dict[str, object]] = items or []
        self.created: list[dict[str, object]] = []

    def async_items(self):
        """Return the list of items (not async)."""
        return self.items

    async def async_create_item(self, payload: dict[str, object]) -> None:
        """Create a new resource."""
        self.created.append(payload)
        self.items.append(payload)


class _LovelaceData:
    """Mock Lovelace data structure."""

    def __init__(self, collection: _ResourceCollection) -> None:
        self.resources = collection


class _ResourcesModule:
    """Mock resources module (fallback API)."""

    def __init__(self) -> None:
        self.created: list[dict[str, object]] = []
        self._collection = _ResourceCollection(self.created)

    def async_get_info(self, _hass: _FakeHass):
        """Return a resource collection (old API)."""
        return self._collection

    async def async_create_item(self, _hass: object, payload: dict[str, object]) -> None:
        """Create a new resource (fallback method)."""
        self.created.append(payload)
        self._collection.items.append(payload)


def _make_hass_with_collection(
    items: list[dict[str, object]] | None = None,
) -> tuple[_FakeHass, _ResourceCollection]:
    hass = _FakeHass()
    collection = _ResourceCollection(items)
    hass.data["lovelace"] = _LovelaceData(collection)
    return hass, collection


def test_lovelace_resource_create_with_new_api() -> None:
    """Test resource creation using the new hass.data['lovelace'].resources API."""
    hass, collection = _make_hass_with_collection()
    resources = _ResourcesModule()

    create_resource = getattr(unifi_network_map, "_create_lovelace_resource")
    asyncio.run(create_resource(hass, resources, "/unifi-network-map/unifi-network-map.js"))

    assert len(collection.created) == 1
    payload = collection.created[0]
    assert payload["url"] == "/unifi-network-map/unifi-network-map.js"
    assert payload["res_type"] == "module"


def test_lovelace_resource_create_with_fallback_api() -> None:
    """Test resource creation falls back to old API when new API not available."""
    hass = _FakeHass()
    # Don't set hass.data["lovelace"] to trigger fallback
    resources = _ResourcesModule()

    create_resource = getattr(unifi_network_map, "_create_lovelace_resource")
    asyncio.run(create_resource(hass, resources, "/unifi-network-map/unifi-network-map.js"))

    # Should have used fallback API
    assert len(resources.created) == 1
    payload = resources.created[0]
    assert payload["url"] == "/unifi-network-map/unifi-network-map.js"
    assert payload["res_type"] == "module"


def test_lovelace_resource_fetch_items_with_new_api() -> None:
    """Test fetching items using the new hass.data['lovelace'].resources API."""
    existing_items: list[dict[str, object]] = [
        {"url": "/local/some-card.js", "type": "module"},
        {"url": "/local/another-card.js", "type": "js"},
    ]
    hass, _collection = _make_hass_with_collection(existing_items)
    resources = _ResourcesModule()

    fetch_items = getattr(unifi_network_map, "_fetch_lovelace_items")
    items = asyncio.run(fetch_items(hass, resources))

    assert items == existing_items


def test_lovelace_resource_fetch_items_returns_empty_list() -> None:
    """Test fetching items returns empty list when no resources exist."""
    hass, _collection = _make_hass_with_collection([])
    resources = _ResourcesModule()

    fetch_items = getattr(unifi_network_map, "_fetch_lovelace_items")
    items = asyncio.run(fetch_items(hass, resources))

    assert items == []


def test_schedule_lovelace_resource_when_running() -> None:
    """Test resource registration is scheduled immediately when HA is running."""
    hass = _FakeHass()
    hass.is_running = True

    schedule_registration = getattr(unifi_network_map, "_schedule_lovelace_resource_registration")
    schedule_registration(hass)

    # Should have created a task immediately
    assert len(hass.tasks) == 1


def test_schedule_lovelace_resource_when_not_running() -> None:
    """Test resource registration waits for start event when HA is not running."""
    hass = _FakeHass()
    hass.is_running = False

    schedule_registration = getattr(unifi_network_map, "_schedule_lovelace_resource_registration")
    schedule_registration(hass)

    # Should not have created a task yet
    assert len(hass.tasks) == 0

    # Should have registered a listener
    assert "homeassistant_start" in hass.bus.listeners
    assert len(hass.bus.listeners["homeassistant_start"]) == 1


def test_ensure_lovelace_resource_skips_if_already_registered() -> None:
    """Test that resource registration is skipped if already registered."""
    hass, collection = _make_hass_with_collection(
        [{"url": "/unifi-network-map/unifi-network-map.js", "type": "module"}]
    )
    hass.data["unifi_network_map"] = {}

    ensure_resource = getattr(unifi_network_map, "_ensure_lovelace_resource")
    asyncio.run(ensure_resource(hass))

    # Should not have created a new resource
    assert len(collection.created) == 0


def test_ensure_lovelace_resource_creates_when_not_exists() -> None:
    """Test that resource is created when it doesn't exist."""
    hass, collection = _make_hass_with_collection([])
    hass.data["unifi_network_map"] = {}
    resources = _ResourcesModule()

    # Mock _load_lovelace_resources to return resources module
    original_load = getattr(unifi_network_map, "_load_lovelace_resources")

    def mock_load():
        return resources

    setattr(unifi_network_map, "_load_lovelace_resources", mock_load)

    try:
        ensure_resource = getattr(unifi_network_map, "_ensure_lovelace_resource")
        asyncio.run(ensure_resource(hass))

        # Should have created the resource
        assert len(collection.created) == 1
        assert collection.created[0]["url"] == "/unifi-network-map/unifi-network-map.js"
        assert collection.created[0]["res_type"] == "module"
    finally:
        # Restore original function
        setattr(unifi_network_map, "_load_lovelace_resources", original_load)


def test_ensure_lovelace_resource_handles_missing_lovelace_data() -> None:
    """Test that resource registration handles missing lovelace data gracefully."""
    hass = _FakeHass()
    # Don't set hass.data["lovelace"]
    hass.data["unifi_network_map"] = {}

    # Mock _load_lovelace_resources to return None
    original_load = getattr(unifi_network_map, "_load_lovelace_resources")

    def mock_load():
        return None

    setattr(unifi_network_map, "_load_lovelace_resources", mock_load)

    try:
        ensure_resource = getattr(unifi_network_map, "_ensure_lovelace_resource")
        asyncio.run(ensure_resource(hass))

        # Should have handled missing data gracefully (no exception)
    finally:
        # Restore original function
        setattr(unifi_network_map, "_load_lovelace_resources", original_load)


def test_resource_payload_uses_res_type_field() -> None:
    """Test that resource payload uses 'res_type' field, not 'type'."""
    hass = _FakeHass()
    collection = _ResourceCollection()
    hass.data["lovelace"] = _LovelaceData(collection)
    resources = _ResourcesModule()

    create_resource = getattr(unifi_network_map, "_create_lovelace_resource")
    asyncio.run(create_resource(hass, resources, "/test.js"))

    # Must use res_type, not type
    assert "res_type" in collection.created[0]
    assert collection.created[0]["res_type"] == "module"
    # Old 'type' field should not be present in new API
    # (it gets added by the collection itself for storage)
