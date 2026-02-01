"""Tests for payload cache module."""

from __future__ import annotations

from typing import Any
from unittest.mock import patch

from custom_components.unifi_network_map import payload_cache
from custom_components.unifi_network_map.const import DOMAIN


class FakeHass:
    def __init__(self) -> None:
        self.data: dict[str, Any] = {}


def test_cached_payload_dataclass() -> None:
    cached = payload_cache.CachedPayload(
        payload={"test": "data"},
        cached_at=100.0,
        source_hash="hash123",
    )
    assert cached.payload == {"test": "data"}
    assert cached.cached_at == 100.0
    assert cached.source_hash == "hash123"


def test_payload_cache_ttl_property() -> None:
    cache = payload_cache.PayloadCache()
    assert cache.ttl_seconds == 30.0

    cache.ttl_seconds = 60.0
    assert cache.ttl_seconds == 60.0

    cache.ttl_seconds = -10.0
    assert cache.ttl_seconds == 0.0


def test_payload_cache_get_returns_none_when_empty() -> None:
    cache = payload_cache.PayloadCache()
    result = cache.get("entry1", "hash123")
    assert result is None


def test_payload_cache_get_returns_none_when_hash_mismatch() -> None:
    cache = payload_cache.PayloadCache()
    cache.set("entry1", {"data": "value"}, "hash123")

    result = cache.get("entry1", "different_hash")
    assert result is None


def test_payload_cache_get_returns_none_when_expired() -> None:
    cache = payload_cache.PayloadCache()
    cache._ttl_seconds = 10.0

    with patch.object(payload_cache, "monotonic_seconds", return_value=100.0):
        cache.set("entry1", {"data": "value"}, "hash123")

    with patch.object(payload_cache, "monotonic_seconds", return_value=115.0):
        result = cache.get("entry1", "hash123")

    assert result is None


def test_payload_cache_get_returns_cached_payload_when_valid() -> None:
    cache = payload_cache.PayloadCache()
    cache._ttl_seconds = 30.0
    payload_data = {"data": "value", "more": "data"}

    with patch.object(payload_cache, "monotonic_seconds", return_value=100.0):
        cache.set("entry1", payload_data, "hash123")

    with patch.object(payload_cache, "monotonic_seconds", return_value=110.0):
        result = cache.get("entry1", "hash123")

    assert result == payload_data


def test_payload_cache_set_stores_payload() -> None:
    cache = payload_cache.PayloadCache()
    payload_data = {"test": "data"}

    with patch.object(payload_cache, "monotonic_seconds", return_value=50.0):
        cache.set("entry1", payload_data, "hash123")

    assert "entry1" in cache._entries
    assert cache._entries["entry1"].payload == payload_data
    assert cache._entries["entry1"].source_hash == "hash123"
    assert cache._entries["entry1"].cached_at == 50.0


def test_payload_cache_invalidate_removes_entry() -> None:
    cache = payload_cache.PayloadCache()
    cache.set("entry1", {"data": "value"}, "hash1")
    cache.set("entry2", {"data": "other"}, "hash2")

    cache.invalidate("entry1")

    assert "entry1" not in cache._entries
    assert "entry2" in cache._entries


def test_payload_cache_invalidate_does_nothing_for_missing_entry() -> None:
    cache = payload_cache.PayloadCache()
    cache.invalidate("nonexistent")


def test_payload_cache_invalidate_all_clears_all_entries() -> None:
    cache = payload_cache.PayloadCache()
    cache.set("entry1", {"data": "value"}, "hash1")
    cache.set("entry2", {"data": "other"}, "hash2")

    cache.invalidate_all()

    assert len(cache._entries) == 0


def test_get_payload_cache_creates_new_cache() -> None:
    hass = FakeHass()

    cache = payload_cache.get_payload_cache(hass)

    assert cache is not None
    assert hass.data[DOMAIN]["payload_cache"] is cache


def test_get_payload_cache_returns_existing_cache() -> None:
    hass = FakeHass()

    cache1 = payload_cache.get_payload_cache(hass)
    cache2 = payload_cache.get_payload_cache(hass)

    assert cache1 is cache2


def test_set_payload_cache_ttl() -> None:
    hass = FakeHass()

    payload_cache.set_payload_cache_ttl(hass, 60.0)

    cache = payload_cache.get_payload_cache(hass)
    assert cache.ttl_seconds == 60.0


def test_invalidate_payload_cache_with_entry_id() -> None:
    hass = FakeHass()
    cache = payload_cache.get_payload_cache(hass)
    cache.set("entry1", {"data": "value"}, "hash1")
    cache.set("entry2", {"data": "other"}, "hash2")

    payload_cache.invalidate_payload_cache(hass, "entry1")

    assert "entry1" not in cache._entries
    assert "entry2" in cache._entries


def test_invalidate_payload_cache_all_entries() -> None:
    hass = FakeHass()
    cache = payload_cache.get_payload_cache(hass)
    cache.set("entry1", {"data": "value"}, "hash1")
    cache.set("entry2", {"data": "other"}, "hash2")

    payload_cache.invalidate_payload_cache(hass)

    assert len(cache._entries) == 0


def test_invalidate_payload_cache_does_nothing_when_no_cache() -> None:
    hass = FakeHass()
    payload_cache.invalidate_payload_cache(hass, "entry1")


def test_compute_payload_hash_with_none() -> None:
    result = payload_cache.compute_payload_hash(None)
    assert result == ""


def test_compute_payload_hash_creates_hash() -> None:
    payload: dict[str, Any] = {
        "schema_version": "1.0",
        "edges": [{"left": "a", "right": "b"}],
        "node_types": {"Gateway": "gateway", "Switch": "switch"},
        "client_macs": {"Client1": "aa:bb:cc:dd:ee:ff"},
        "device_macs": {"Gateway": "11:22:33:44:55:66"},
    }

    result = payload_cache.compute_payload_hash(payload)

    assert result
    assert len(result) == 64


def test_compute_payload_hash_changes_with_different_data() -> None:
    payload1: dict[str, Any] = {
        "schema_version": "1.0",
        "edges": [{"left": "a", "right": "b"}],
        "node_types": {"Gateway": "gateway"},
        "client_macs": {},
        "device_macs": {},
    }
    payload2: dict[str, Any] = {
        "schema_version": "1.0",
        "edges": [{"left": "a", "right": "b"}, {"left": "b", "right": "c"}],
        "node_types": {"Gateway": "gateway"},
        "client_macs": {},
        "device_macs": {},
    }

    hash1 = payload_cache.compute_payload_hash(payload1)
    hash2 = payload_cache.compute_payload_hash(payload2)

    assert hash1 != hash2


def test_compute_payload_hash_changes_with_same_counts() -> None:
    payload1: dict[str, Any] = {
        "schema_version": "1.0",
        "edges": [{"left": "a", "right": "b"}],
        "node_types": {"Gateway": "gateway"},
        "client_macs": {"Client1": "aa:bb:cc:dd:ee:ff"},
        "device_macs": {"Gateway": "11:22:33:44:55:66"},
        "client_ips": {"Client1": "192.168.1.2"},
    }
    payload2: dict[str, Any] = {
        "schema_version": "1.0",
        "edges": [{"left": "a", "right": "b"}],
        "node_types": {"Gateway": "gateway"},
        "client_macs": {"Client1": "aa:bb:cc:dd:ee:00"},
        "device_macs": {"Gateway": "11:22:33:44:55:66"},
        "client_ips": {"Client1": "192.168.1.2"},
    }

    hash1 = payload_cache.compute_payload_hash(payload1)
    hash2 = payload_cache.compute_payload_hash(payload2)

    assert hash1 != hash2


def test_compute_payload_hash_same_for_same_data() -> None:
    payload: dict[str, Any] = {
        "schema_version": "1.0",
        "edges": [{"left": "a", "right": "b"}],
        "node_types": {"Gateway": "gateway"},
        "client_macs": {},
        "device_macs": {},
    }

    hash1 = payload_cache.compute_payload_hash(payload)
    hash2 = payload_cache.compute_payload_hash(payload)

    assert hash1 == hash2


def test_payload_cache_integration_scenario() -> None:
    hass = FakeHass()

    payload_cache.set_payload_cache_ttl(hass, 60.0)
    cache = payload_cache.get_payload_cache(hass)

    source_payload: dict[str, Any] = {
        "schema_version": "1.0",
        "edges": [],
        "node_types": {"Gateway": "gateway"},
        "client_macs": {},
        "device_macs": {},
    }
    enriched_payload = {**source_payload, "node_entities": {"Gateway": "device_tracker.gateway"}}
    source_hash = payload_cache.compute_payload_hash(source_payload)

    assert cache.get("entry1", source_hash) is None

    with patch.object(payload_cache, "monotonic_seconds", return_value=100.0):
        cache.set("entry1", enriched_payload, source_hash)

    with patch.object(payload_cache, "monotonic_seconds", return_value=130.0):
        result = cache.get("entry1", source_hash)
        assert result == enriched_payload

    with patch.object(payload_cache, "monotonic_seconds", return_value=200.0):
        result = cache.get("entry1", source_hash)
        assert result is None
