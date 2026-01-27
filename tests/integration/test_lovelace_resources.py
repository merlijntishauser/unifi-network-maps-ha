from __future__ import annotations

import asyncio
import sys
from types import ModuleType
from typing import Callable, Coroutine, cast

import pytest

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
        task = _FakeTask(coro)
        self.tasks.append(task)
        if hasattr(coro, "close"):
            coro.close()
        return task


class _FakeTask:
    """Minimal task shim for retry scheduling."""

    def __init__(self, coro: object) -> None:
        self._coro = coro
        self._done = False
        self._callbacks: list[Callable[[object], None]] = []

    def done(self) -> bool:
        return self._done

    def add_done_callback(self, callback: Callable[[object], None]) -> None:
        self._callbacks.append(callback)

    def set_done(self) -> None:
        self._done = True
        for callback in list(self._callbacks):
            callback(self)


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


def test_schedule_lovelace_resource_retry_schedules_once() -> None:
    hass = _FakeHass()
    hass.data["unifi_network_map"] = {"lovelace_resource_attempts": 1}

    schedule_retry = getattr(unifi_network_map, "_schedule_lovelace_resource_retry")
    schedule_retry(hass)
    schedule_retry(hass)

    assert hass.data["unifi_network_map"]["lovelace_resource_attempts"] == 1
    assert len(hass.tasks) == 1


def test_ensure_lovelace_resource_logs_failure_after_attempts(
    caplog: pytest.LogCaptureFixture,
) -> None:
    hass = _FakeHass()
    hass.data["unifi_network_map"] = {"lovelace_resource_attempts": 6}

    caplog.set_level("ERROR")
    ensure_resource = getattr(unifi_network_map, "_ensure_lovelace_resource")
    asyncio.run(ensure_resource(hass))

    assert "Lovelace auto-registration failed after" in caplog.text
    assert hass.data["unifi_network_map"]["lovelace_resource_failed"] is True


def test_ensure_lovelace_resource_returns_when_already_marked() -> None:
    hass = _FakeHass()
    hass.data["unifi_network_map"] = {"lovelace_resource_registered": True}

    ensure_resource = getattr(unifi_network_map, "_ensure_lovelace_resource")
    asyncio.run(ensure_resource(hass))

    assert not hass.tasks


def test_ensure_lovelace_resource_retries_when_items_missing() -> None:
    hass = _FakeHass()
    hass.data["unifi_network_map"] = {}
    resources = _ResourcesModule()

    original_load = getattr(unifi_network_map, "_load_lovelace_resources")
    original_fetch = getattr(unifi_network_map, "_fetch_lovelace_items")

    async def _fetch(_hass: _FakeHass, _resources: object):
        return None

    setattr(unifi_network_map, "_load_lovelace_resources", lambda: resources)
    setattr(unifi_network_map, "_fetch_lovelace_items", _fetch)
    try:
        ensure_resource = getattr(unifi_network_map, "_ensure_lovelace_resource")
        asyncio.run(ensure_resource(hass))
    finally:
        setattr(unifi_network_map, "_load_lovelace_resources", original_load)
        setattr(unifi_network_map, "_fetch_lovelace_items", original_fetch)

    assert hass.data["unifi_network_map"]["lovelace_resource_attempts"] == 1
    assert hass.tasks


def test_ensure_lovelace_resource_retries_when_create_fails() -> None:
    hass = _FakeHass()
    hass.data["unifi_network_map"] = {}
    resources = _ResourcesModule()

    original_load = getattr(unifi_network_map, "_load_lovelace_resources")
    original_fetch = getattr(unifi_network_map, "_fetch_lovelace_items")
    original_create = getattr(unifi_network_map, "_create_lovelace_resource")

    async def _fetch(_hass: _FakeHass, _resources: object):
        return []

    async def _create(_hass: _FakeHass, _resources: object, _url: str) -> bool:
        return False

    setattr(unifi_network_map, "_load_lovelace_resources", lambda: resources)
    setattr(unifi_network_map, "_fetch_lovelace_items", _fetch)
    setattr(unifi_network_map, "_create_lovelace_resource", _create)
    try:
        ensure_resource = getattr(unifi_network_map, "_ensure_lovelace_resource")
        asyncio.run(ensure_resource(hass))
    finally:
        setattr(unifi_network_map, "_load_lovelace_resources", original_load)
        setattr(unifi_network_map, "_fetch_lovelace_items", original_fetch)
        setattr(unifi_network_map, "_create_lovelace_resource", original_create)

    assert hass.data["unifi_network_map"]["lovelace_resource_attempts"] == 1
    assert hass.tasks


def test_ensure_lovelace_resource_serializes_concurrent_calls() -> None:
    hass = _FakeHass()
    hass.data["unifi_network_map"] = {}
    resources = _ResourcesModule()
    calls: list[str] = []
    gate = asyncio.Event()

    async def _fetch(_hass: _FakeHass, _resources: object):
        calls.append("fetch")
        await gate.wait()
        return []

    async def _create(_hass: _FakeHass, _resources: object, _url: str) -> bool:
        return True

    original_load = getattr(unifi_network_map, "_load_lovelace_resources")
    original_fetch = getattr(unifi_network_map, "_fetch_lovelace_items")
    original_create = getattr(unifi_network_map, "_create_lovelace_resource")

    setattr(unifi_network_map, "_load_lovelace_resources", lambda: resources)
    setattr(unifi_network_map, "_fetch_lovelace_items", _fetch)
    setattr(unifi_network_map, "_create_lovelace_resource", _create)

    async def _run() -> None:
        ensure_resource = getattr(unifi_network_map, "_ensure_lovelace_resource")
        task1 = asyncio.create_task(ensure_resource(hass))
        await asyncio.sleep(0)
        task2 = asyncio.create_task(ensure_resource(hass))
        await asyncio.sleep(0)
        assert calls == ["fetch"]
        gate.set()
        await asyncio.gather(task1, task2)

    try:
        asyncio.run(_run())
    finally:
        setattr(unifi_network_map, "_load_lovelace_resources", original_load)
        setattr(unifi_network_map, "_fetch_lovelace_items", original_fetch)
        setattr(unifi_network_map, "_create_lovelace_resource", original_create)

    assert calls == ["fetch"]
    assert hass.data["unifi_network_map"]["lovelace_resource_registered"] is True
    assert hass.data["unifi_network_map"]["lovelace_resource_attempts"] == 0


def test_retry_lovelace_resource_calls_ensure(monkeypatch: pytest.MonkeyPatch) -> None:
    hass = _FakeHass()
    called = {"ensure": False, "slept": False}

    async def _sleep(_delay: int) -> None:
        called["slept"] = True

    async def _ensure(_hass: _FakeHass) -> None:
        called["ensure"] = True

    monkeypatch.setattr(unifi_network_map.asyncio, "sleep", _sleep)
    monkeypatch.setattr(unifi_network_map, "_ensure_lovelace_resource", _ensure)

    retry = getattr(unifi_network_map, "_retry_lovelace_resource")
    asyncio.run(retry(hass, 0))

    assert called == {"ensure": True, "slept": True}


def test_ensure_lovelace_resource_marks_registered_on_existing() -> None:
    hass, _collection = _make_hass_with_collection(
        [{"url": "/unifi-network-map/unifi-network-map.js", "type": "module"}]
    )
    hass.data["unifi_network_map"] = {}
    resources = _ResourcesModule()

    original_load = getattr(unifi_network_map, "_load_lovelace_resources")
    setattr(unifi_network_map, "_load_lovelace_resources", lambda: resources)
    try:
        ensure_resource = getattr(unifi_network_map, "_ensure_lovelace_resource")
        asyncio.run(ensure_resource(hass))
    finally:
        setattr(unifi_network_map, "_load_lovelace_resources", original_load)

    assert hass.data["unifi_network_map"]["lovelace_resource_registered"] is True


def test_schedule_lovelace_resource_registration_runs_on_start() -> None:
    hass = _FakeHass()
    hass.is_running = False
    hass.data["unifi_network_map"] = {}

    called = {"ensure": False}

    async def _ensure(_hass: _FakeHass) -> None:
        called["ensure"] = True

    original_ensure = getattr(unifi_network_map, "_ensure_lovelace_resource")
    setattr(unifi_network_map, "_ensure_lovelace_resource", _ensure)
    try:
        schedule_registration = getattr(
            unifi_network_map, "_schedule_lovelace_resource_registration"
        )
        schedule_registration(hass)
        asyncio.run(hass.bus.fire_event("homeassistant_start"))
    finally:
        setattr(unifi_network_map, "_ensure_lovelace_resource", original_ensure)

    assert called["ensure"] is True


def test_fetch_lovelace_items_returns_none_when_missing() -> None:
    hass = _FakeHass()
    resources = _ResourcesModule()

    fetch_items = getattr(unifi_network_map, "_fetch_lovelace_items")
    result = asyncio.run(fetch_items(hass, resources))

    assert result is None


def test_fetch_lovelace_items_returns_none_when_missing_resources_attr() -> None:
    hass = _FakeHass()
    hass.data["lovelace"] = object()
    resources = _ResourcesModule()

    fetch_items = getattr(unifi_network_map, "_fetch_lovelace_items")
    result = asyncio.run(fetch_items(hass, resources))

    assert result is None


def test_fetch_lovelace_items_returns_none_when_missing_async_items() -> None:
    class _Lovelace:
        def __init__(self) -> None:
            self.resources = object()

    hass = _FakeHass()
    hass.data["lovelace"] = _Lovelace()
    resources = _ResourcesModule()

    fetch_items = getattr(unifi_network_map, "_fetch_lovelace_items")
    result = asyncio.run(fetch_items(hass, resources))

    assert result is None


def test_fetch_lovelace_items_handles_async_items_coroutine() -> None:
    class _Collection:
        async def async_items(self):
            return [{"url": "/local/card.js"}]

    class _Lovelace:
        def __init__(self) -> None:
            self.resources = _Collection()

    hass = _FakeHass()
    hass.data["lovelace"] = _Lovelace()
    resources = _ResourcesModule()

    fetch_items = getattr(unifi_network_map, "_fetch_lovelace_items")
    result = asyncio.run(fetch_items(hass, resources))

    assert result == [{"url": "/local/card.js"}]


def test_fetch_lovelace_items_fallback_after_exception(monkeypatch: pytest.MonkeyPatch) -> None:
    class _Collection:
        def async_items(self):
            raise RuntimeError("boom")

    class _Lovelace:
        def __init__(self) -> None:
            self.resources = _Collection()

    class _Resources:
        def async_get_info(self, _hass: _FakeHass):
            return [{"url": "/local/fallback.js"}]

    hass = _FakeHass()
    hass.data["lovelace"] = _Lovelace()
    resources = _Resources()

    fetch_items = getattr(unifi_network_map, "_fetch_lovelace_items")
    result = asyncio.run(fetch_items(hass, resources))

    assert result == [{"url": "/local/fallback.js"}]


def test_create_lovelace_resource_with_module_typeerror() -> None:
    class _Resources:
        def __init__(self) -> None:
            self.created: list[dict[str, object]] = []

        def async_create_item(self, payload: dict[str, object]) -> None:
            self.created.append(payload)

    hass = _FakeHass()
    resources = _Resources()
    payload = {"url": "/local/card.js", "res_type": "module"}

    create_with_module = getattr(unifi_network_map, "_create_lovelace_resource_with_module")
    result = asyncio.run(create_with_module(hass, resources, payload))

    assert result is True
    assert resources.created == [payload]


def test_create_lovelace_resource_with_module_missing() -> None:
    class _Resources:
        pass

    hass = _FakeHass()
    resources = _Resources()
    payload = {"url": "/local/card.js", "res_type": "module"}

    create_with_module = getattr(unifi_network_map, "_create_lovelace_resource_with_module")
    result = asyncio.run(create_with_module(hass, resources, payload))

    assert result is False


def test_create_lovelace_resource_with_collection_missing() -> None:
    payload = {"url": "/local/card.js", "res_type": "module"}

    create_with_collection = getattr(unifi_network_map, "_create_lovelace_resource_with_collection")
    result = asyncio.run(create_with_collection(object(), payload))

    assert result is False


def test_create_lovelace_resource_falls_back_to_collection() -> None:
    class _Info:
        def __init__(self) -> None:
            self.created: list[dict[str, object]] = []

        def async_create_item(self, payload: dict[str, object]) -> None:
            self.created.append(payload)

    class _Resources:
        def __init__(self, info: _Info) -> None:
            self._info = info

        def async_get_info(self, _hass: _FakeHass):
            return self._info

    hass = _FakeHass()
    info = _Info()
    resources = _Resources(info)
    create_resource = cast(
        Callable[[object, object, str], Coroutine[object, object, bool]],
        getattr(unifi_network_map, "_create_lovelace_resource"),
    )
    result = asyncio.run(create_resource(hass, resources, "/local/card.js"))

    assert result is True
    assert info.created[0]["url"] == "/local/card.js"


def test_load_lovelace_resources_prefers_module() -> None:
    resources_module = ModuleType("resources")
    lovelace_module = ModuleType("homeassistant.components.lovelace")
    lovelace_module.resources = resources_module

    sys.modules["homeassistant.components.lovelace"] = lovelace_module

    load_resources = cast(
        Callable[[], object | None], getattr(unifi_network_map, "_load_lovelace_resources")
    )
    result = load_resources()

    assert result is resources_module


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
