"""Payload caching with configurable TTL.

Caches enriched payloads to avoid re-enrichment on every HTTP request.
The cache is automatically invalidated when the underlying data changes.
"""

from __future__ import annotations

from dataclasses import dataclass, field
import hashlib
import json
from typing import Any

from homeassistant.core import HomeAssistant

from .const import DOMAIN, LOGGER
from .utils import monotonic_seconds

_CACHE_KEY = "payload_cache"


@dataclass
class CachedPayload:
    """A cached enriched payload with timestamp."""

    payload: dict[str, Any]
    cached_at: float
    source_hash: str


@dataclass
class PayloadCache:
    """Cache for enriched payloads per config entry."""

    _entries: dict[str, CachedPayload] = field(default_factory=dict)
    _ttl_seconds: float = 30.0

    @property
    def ttl_seconds(self) -> float:
        """Return the cache TTL in seconds."""
        return self._ttl_seconds

    @ttl_seconds.setter
    def ttl_seconds(self, value: float) -> None:
        """Set the cache TTL in seconds."""
        self._ttl_seconds = max(0.0, value)

    def get(self, entry_id: str, source_hash: str) -> dict[str, Any] | None:
        """Get a cached payload if valid.

        Returns None if:
        - No cached entry exists
        - The cached entry has expired (TTL exceeded)
        - The source data has changed (hash mismatch)
        """
        cached = self._entries.get(entry_id)
        if cached is None:
            return None
        if cached.source_hash != source_hash:
            LOGGER.debug("payload_cache miss entry_id=%s reason=hash_changed", entry_id)
            return None
        age = monotonic_seconds() - cached.cached_at
        if age > self._ttl_seconds:
            LOGGER.debug(
                "payload_cache miss entry_id=%s reason=ttl_expired age=%.1fs ttl=%.1fs",
                entry_id,
                age,
                self._ttl_seconds,
            )
            return None
        LOGGER.debug("payload_cache hit entry_id=%s age=%.1fs", entry_id, age)
        return cached.payload

    def set(self, entry_id: str, payload: dict[str, Any], source_hash: str) -> None:
        """Store an enriched payload in the cache."""
        self._entries[entry_id] = CachedPayload(
            payload=payload,
            cached_at=monotonic_seconds(),
            source_hash=source_hash,
        )
        LOGGER.debug("payload_cache stored entry_id=%s", entry_id)

    def invalidate(self, entry_id: str) -> None:
        """Invalidate the cache for a specific entry."""
        if entry_id in self._entries:
            del self._entries[entry_id]
            LOGGER.debug("payload_cache invalidated entry_id=%s", entry_id)

    def invalidate_all(self) -> None:
        """Invalidate all cached payloads."""
        if self._entries:
            count = len(self._entries)
            self._entries.clear()
            LOGGER.debug("payload_cache invalidated_all count=%d", count)


def get_payload_cache(hass: HomeAssistant) -> PayloadCache:
    """Get or create the payload cache for this hass instance."""
    data = hass.data.setdefault(DOMAIN, {})
    cache = data.get(_CACHE_KEY)
    if cache is None:
        cache = PayloadCache()
        data[_CACHE_KEY] = cache
        LOGGER.debug("payload_cache created")
    return cache


def set_payload_cache_ttl(hass: HomeAssistant, ttl_seconds: float) -> None:
    """Set the payload cache TTL."""
    cache = get_payload_cache(hass)
    cache.ttl_seconds = ttl_seconds
    LOGGER.debug("payload_cache ttl_configured ttl=%.1fs", ttl_seconds)


def invalidate_payload_cache(hass: HomeAssistant, entry_id: str | None = None) -> None:
    """Invalidate the payload cache.

    If entry_id is provided, only that entry is invalidated.
    Otherwise, all entries are invalidated.
    """
    data = hass.data.get(DOMAIN, {})
    cache = data.get(_CACHE_KEY)
    if cache is None:
        return
    if entry_id is not None:
        cache.invalidate(entry_id)
    else:
        cache.invalidate_all()


def compute_payload_hash(payload: dict[str, Any] | None) -> str:
    """Compute a hash of the source payload for cache validation.

    Uses key fields that indicate the payload has changed:
    - schema_version
    - edges (topology)
    - node_types
    - client_macs
    - device_macs
    - client_ips
    - device_ips
    - node_vlans
    - ap_client_counts
    """
    if payload is None:
        return ""
    snapshot = {
        "schema_version": payload.get("schema_version"),
        "edges": payload.get("edges", []),
        "node_types": payload.get("node_types", {}),
        "client_macs": payload.get("client_macs", {}),
        "device_macs": payload.get("device_macs", {}),
        "client_ips": payload.get("client_ips", {}),
        "device_ips": payload.get("device_ips", {}),
        "node_vlans": payload.get("node_vlans", {}),
        "ap_client_counts": payload.get("ap_client_counts", {}),
    }
    encoded = json.dumps(snapshot, sort_keys=True, separators=(",", ":"), default=str)
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()
