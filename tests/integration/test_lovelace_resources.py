from __future__ import annotations

import asyncio
from typing import TYPE_CHECKING

import custom_components.unifi_network_map as unifi_network_map

if TYPE_CHECKING:
    from collections.abc import Callable

    import pytest


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
        self.updated: list[tuple[str, dict[str, object]]] = []

    def async_items(self):
        """Return the list of items (not async)."""
        return self.items

    async def async_create_item(self, payload: dict[str, object]) -> None:
        """Create a new resource."""
        self.created.append(payload)
        self.items.append(payload)

    async def async_update_item(
        self, item_id: str, payload: dict[str, object]
    ) -> None:
        """Update an existing resource."""
        self.updated.append((item_id, payload))
        for item in self.items:
            if item.get("id") == item_id:
                item.update(payload)
                break


class _LovelaceData:
    """Mock Lovelace data structure."""

    def __init__(self, collection: _ResourceCollection) -> None:
        self.resources = collection


def _make_hass_with_collection(
    items: list[dict[str, object]] | None = None,
) -> tuple[_FakeHass, _ResourceCollection]:
    hass = _FakeHass()
    collection = _ResourceCollection(items)
    hass.data["lovelace"] = _LovelaceData(collection)
    return hass, collection


async def test_lovelace_resource_create_via_collection() -> None:
    """Resource creation uses hass.data['lovelace'].resources."""
    hass, collection = _make_hass_with_collection()

    create_resource = getattr(unifi_network_map, "_create_lovelace_resource")
    result = await create_resource(
        hass, "/unifi-network-map/unifi-network-map.js"
    )

    assert result is True
    assert len(collection.created) == 1
    payload = collection.created[0]
    assert payload["url"] == "/unifi-network-map/unifi-network-map.js"
    assert payload["res_type"] == "module"


async def test_lovelace_resource_create_fails_without_lovelace_data() -> None:
    hass = _FakeHass()

    create_resource = getattr(unifi_network_map, "_create_lovelace_resource")
    result = await create_resource(
        hass, "/unifi-network-map/unifi-network-map.js"
    )

    assert result is False


async def test_lovelace_resource_create_fails_without_collection() -> None:
    hass = _FakeHass()
    hass.data["lovelace"] = object()

    create_resource = getattr(unifi_network_map, "_create_lovelace_resource")
    result = await create_resource(
        hass, "/unifi-network-map/unifi-network-map.js"
    )

    assert result is False


async def test_lovelace_resource_fetch_items() -> None:
    existing_items: list[dict[str, object]] = [
        {"url": "/local/some-card.js", "type": "module"},
        {"url": "/local/another-card.js", "type": "js"},
    ]
    hass, _collection = _make_hass_with_collection(existing_items)

    fetch_items = getattr(unifi_network_map, "_fetch_lovelace_items")
    items = await fetch_items(hass)

    assert items == existing_items


async def test_lovelace_resource_fetch_items_returns_empty_list() -> None:
    hass, _collection = _make_hass_with_collection([])

    fetch_items = getattr(unifi_network_map, "_fetch_lovelace_items")
    items = await fetch_items(hass)

    assert items == []


def test_schedule_lovelace_resource_when_running() -> None:
    hass = _FakeHass()
    hass.is_running = True

    schedule_registration = getattr(
        unifi_network_map, "_schedule_lovelace_resource_registration"
    )
    schedule_registration(hass)

    assert len(hass.tasks) == 1


def test_schedule_lovelace_resource_when_not_running() -> None:
    hass = _FakeHass()
    hass.is_running = False

    schedule_registration = getattr(
        unifi_network_map, "_schedule_lovelace_resource_registration"
    )
    schedule_registration(hass)

    assert len(hass.tasks) == 0
    assert "homeassistant_start" in hass.bus.listeners
    assert len(hass.bus.listeners["homeassistant_start"]) == 1


async def test_ensure_lovelace_resource_skips_if_already_registered() -> None:
    versioned_url = getattr(unifi_network_map, "_frontend_bundle_url")()
    hass, collection = _make_hass_with_collection(
        [{"url": versioned_url, "type": "module"}]
    )
    hass.data["unifi_network_map"] = {}

    ensure_resource = getattr(unifi_network_map, "_ensure_lovelace_resource")
    await ensure_resource(hass)

    assert len(collection.created) == 0


async def test_ensure_lovelace_resource_creates_when_not_exists() -> None:
    hass, collection = _make_hass_with_collection([])
    hass.data["unifi_network_map"] = {}

    ensure_resource = getattr(unifi_network_map, "_ensure_lovelace_resource")
    await ensure_resource(hass)

    versioned_url = getattr(unifi_network_map, "_frontend_bundle_url")()
    assert len(collection.created) == 1
    assert collection.created[0]["url"] == versioned_url
    assert collection.created[0]["res_type"] == "module"


async def test_ensure_lovelace_resource_retries_without_lovelace_data() -> (
    None
):
    """Missing lovelace data (not loaded yet) schedules a retry."""
    hass = _FakeHass()
    hass.data["unifi_network_map"] = {}

    ensure_resource = getattr(unifi_network_map, "_ensure_lovelace_resource")
    await ensure_resource(hass)

    assert hass.data["unifi_network_map"]["lovelace_resource_attempts"] == 1
    assert hass.tasks


def test_schedule_lovelace_resource_retry_schedules_once() -> None:
    hass = _FakeHass()
    hass.data["unifi_network_map"] = {"lovelace_resource_attempts": 1}

    schedule_retry = getattr(
        unifi_network_map, "_schedule_lovelace_resource_retry"
    )
    schedule_retry(hass)
    schedule_retry(hass)

    assert hass.data["unifi_network_map"]["lovelace_resource_attempts"] == 1
    assert len(hass.tasks) == 1


async def test_ensure_lovelace_resource_logs_failure_after_attempts(
    caplog: pytest.LogCaptureFixture,
) -> None:
    hass = _FakeHass()
    hass.data["unifi_network_map"] = {"lovelace_resource_attempts": 6}

    caplog.set_level("ERROR")
    ensure_resource = getattr(unifi_network_map, "_ensure_lovelace_resource")
    await ensure_resource(hass)

    assert "lovelace registration_failed" in caplog.text
    assert hass.data["unifi_network_map"]["lovelace_resource_failed"] is True


async def test_ensure_lovelace_resource_returns_when_already_marked() -> None:
    hass = _FakeHass()
    hass.data["unifi_network_map"] = {"lovelace_resource_registered": True}

    ensure_resource = getattr(unifi_network_map, "_ensure_lovelace_resource")
    await ensure_resource(hass)

    assert not hass.tasks


async def test_ensure_lovelace_resource_retries_when_items_missing() -> None:
    hass = _FakeHass()
    hass.data["unifi_network_map"] = {}

    original_fetch = getattr(unifi_network_map, "_fetch_lovelace_items")

    async def _fetch(_hass: _FakeHass):
        return None

    setattr(unifi_network_map, "_fetch_lovelace_items", _fetch)
    try:
        ensure_resource = getattr(
            unifi_network_map, "_ensure_lovelace_resource"
        )
        await ensure_resource(hass)
    finally:
        setattr(unifi_network_map, "_fetch_lovelace_items", original_fetch)

    assert hass.data["unifi_network_map"]["lovelace_resource_attempts"] == 1
    assert hass.tasks


async def test_ensure_lovelace_resource_retries_when_create_fails() -> None:
    hass = _FakeHass()
    hass.data["unifi_network_map"] = {}

    original_fetch = getattr(unifi_network_map, "_fetch_lovelace_items")
    original_create = getattr(unifi_network_map, "_create_lovelace_resource")

    async def _fetch(_hass: _FakeHass):
        return []

    async def _create(_hass: _FakeHass, _url: str) -> bool:
        return False

    setattr(unifi_network_map, "_fetch_lovelace_items", _fetch)
    setattr(unifi_network_map, "_create_lovelace_resource", _create)
    try:
        ensure_resource = getattr(
            unifi_network_map, "_ensure_lovelace_resource"
        )
        await ensure_resource(hass)
    finally:
        setattr(unifi_network_map, "_fetch_lovelace_items", original_fetch)
        setattr(
            unifi_network_map, "_create_lovelace_resource", original_create
        )

    assert hass.data["unifi_network_map"]["lovelace_resource_attempts"] == 1
    assert hass.tasks


async def test_ensure_lovelace_resource_serializes_concurrent_calls() -> None:
    hass = _FakeHass()
    hass.data["unifi_network_map"] = {}
    calls: list[str] = []
    gate = asyncio.Event()

    async def _fetch(_hass: _FakeHass):
        calls.append("fetch")
        await gate.wait()
        return []

    async def _create(_hass: _FakeHass, _url: str) -> bool:
        return True

    original_fetch = getattr(unifi_network_map, "_fetch_lovelace_items")
    original_create = getattr(unifi_network_map, "_create_lovelace_resource")

    setattr(unifi_network_map, "_fetch_lovelace_items", _fetch)
    setattr(unifi_network_map, "_create_lovelace_resource", _create)

    try:
        ensure_resource = getattr(
            unifi_network_map, "_ensure_lovelace_resource"
        )
        task1 = asyncio.create_task(ensure_resource(hass))
        await asyncio.sleep(0)
        task2 = asyncio.create_task(ensure_resource(hass))
        await asyncio.sleep(0)
        assert calls == ["fetch"]
        gate.set()
        await asyncio.gather(task1, task2)
    finally:
        setattr(unifi_network_map, "_fetch_lovelace_items", original_fetch)
        setattr(
            unifi_network_map, "_create_lovelace_resource", original_create
        )

    assert calls == ["fetch"]
    assert (
        hass.data["unifi_network_map"]["lovelace_resource_registered"] is True
    )
    assert hass.data["unifi_network_map"]["lovelace_resource_attempts"] == 0


async def test_retry_lovelace_resource_calls_ensure(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    hass = _FakeHass()
    called = {"ensure": False, "slept": False}

    async def _sleep(_delay: int) -> None:
        called["slept"] = True

    async def _ensure(_hass: _FakeHass) -> None:
        called["ensure"] = True

    monkeypatch.setattr(unifi_network_map.asyncio, "sleep", _sleep)
    monkeypatch.setattr(
        unifi_network_map, "_ensure_lovelace_resource", _ensure
    )

    retry = getattr(unifi_network_map, "_retry_lovelace_resource")
    await retry(hass, 0)

    assert called == {"ensure": True, "slept": True}


async def test_ensure_lovelace_resource_marks_registered_on_existing() -> None:
    versioned_url = getattr(unifi_network_map, "_frontend_bundle_url")()
    hass, _collection = _make_hass_with_collection(
        [{"url": versioned_url, "type": "module"}]
    )
    hass.data["unifi_network_map"] = {}

    ensure_resource = getattr(unifi_network_map, "_ensure_lovelace_resource")
    await ensure_resource(hass)

    assert (
        hass.data["unifi_network_map"]["lovelace_resource_registered"] is True
    )


async def test_schedule_lovelace_resource_registration_runs_on_start() -> None:
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
        await hass.bus.fire_event("homeassistant_start")
    finally:
        setattr(
            unifi_network_map, "_ensure_lovelace_resource", original_ensure
        )

    assert called["ensure"] is True


async def test_fetch_lovelace_items_returns_none_when_missing() -> None:
    hass = _FakeHass()

    fetch_items = getattr(unifi_network_map, "_fetch_lovelace_items")
    result = await fetch_items(hass)

    assert result is None


async def test_fetch_lovelace_items_returns_none_when_missing_resources_attr():
    hass = _FakeHass()
    hass.data["lovelace"] = object()

    fetch_items = getattr(unifi_network_map, "_fetch_lovelace_items")
    result = await fetch_items(hass)

    assert result is None


async def test_fetch_lovelace_items_returns_none_when_missing_async_items():
    class _Lovelace:
        def __init__(self) -> None:
            self.resources = object()

    hass = _FakeHass()
    hass.data["lovelace"] = _Lovelace()

    fetch_items = getattr(unifi_network_map, "_fetch_lovelace_items")
    result = await fetch_items(hass)

    assert result is None


async def test_fetch_lovelace_items_handles_async_items_coroutine() -> None:
    class _Collection:
        async def async_items(self):
            return [{"url": "/local/card.js"}]

    class _Lovelace:
        def __init__(self) -> None:
            self.resources = _Collection()

    hass = _FakeHass()
    hass.data["lovelace"] = _Lovelace()

    fetch_items = getattr(unifi_network_map, "_fetch_lovelace_items")
    result = await fetch_items(hass)

    assert result == [{"url": "/local/card.js"}]


async def test_fetch_lovelace_items_returns_none_on_collection_error() -> None:
    class _Collection:
        def async_items(self):
            raise RuntimeError("boom")

    class _Lovelace:
        def __init__(self) -> None:
            self.resources = _Collection()

    hass = _FakeHass()
    hass.data["lovelace"] = _Lovelace()

    fetch_items = getattr(unifi_network_map, "_fetch_lovelace_items")
    result = await fetch_items(hass)

    assert result is None


async def test_resource_payload_uses_res_type_field() -> None:
    """Resource payload must use 'res_type', not 'type'."""
    hass, collection = _make_hass_with_collection()

    create_resource = getattr(unifi_network_map, "_create_lovelace_resource")
    await create_resource(hass, "/test.js")

    assert "res_type" in collection.created[0]
    assert collection.created[0]["res_type"] == "module"


async def test_ensure_lovelace_resource_updates_old_version() -> None:
    """An existing resource with an old version gets updated."""
    versioned_url = getattr(unifi_network_map, "_frontend_bundle_url")()
    old_url = "/unifi-network-map/unifi-network-map.js?v=0.1.0"
    hass, collection = _make_hass_with_collection(
        [{"id": "abc123", "url": old_url, "type": "module"}]
    )
    hass.data["unifi_network_map"] = {}

    ensure_resource = getattr(unifi_network_map, "_ensure_lovelace_resource")
    await ensure_resource(hass)

    assert len(collection.created) == 0
    assert len(collection.updated) == 1
    assert collection.updated[0] == ("abc123", {"url": versioned_url})
    assert (
        hass.data["unifi_network_map"]["lovelace_resource_registered"] is True
    )


async def test_ensure_lovelace_resource_updates_unversioned_url() -> None:
    """An existing resource with no version query gets updated."""
    versioned_url = getattr(unifi_network_map, "_frontend_bundle_url")()
    hass, collection = _make_hass_with_collection(
        [
            {
                "id": "xyz789",
                "url": "/unifi-network-map/unifi-network-map.js",
                "type": "module",
            }
        ]
    )
    hass.data["unifi_network_map"] = {}

    ensure_resource = getattr(unifi_network_map, "_ensure_lovelace_resource")
    await ensure_resource(hass)

    assert len(collection.created) == 0
    assert len(collection.updated) == 1
    assert collection.updated[0] == ("xyz789", {"url": versioned_url})
    assert (
        hass.data["unifi_network_map"]["lovelace_resource_registered"] is True
    )


async def test_ensure_lovelace_resource_current_version_is_noop() -> None:
    """An existing resource with the current version is left alone."""
    versioned_url = getattr(unifi_network_map, "_frontend_bundle_url")()
    hass, collection = _make_hass_with_collection(
        [{"id": "cur456", "url": versioned_url, "type": "module"}]
    )
    hass.data["unifi_network_map"] = {}

    ensure_resource = getattr(unifi_network_map, "_ensure_lovelace_resource")
    await ensure_resource(hass)

    assert len(collection.created) == 0
    assert len(collection.updated) == 0
    assert (
        hass.data["unifi_network_map"]["lovelace_resource_registered"] is True
    )
