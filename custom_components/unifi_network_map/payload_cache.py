"""Payload caching with configurable TTL.

Caches enriched payloads to avoid re-enrichment on every HTTP request.
The cache is automatically invalidated when the underlying data changes.
"""

from __future__ import annotations

from dataclasses import dataclass, field
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
            LOGGER.debug("Payload cache miss for %s: source hash changed", entry_id)
            return None
        age = monotonic_seconds() - cached.cached_at
        if age > self._ttl_seconds:
            LOGGER.debug("Payload cache miss for %s: TTL expired (age=%.1fs)", entry_id, age)
            return None
        LOGGER.debug("Payload cache hit for %s (age=%.1fs)", entry_id, age)
        return cached.payload

    def set(self, entry_id: str, payload: dict[str, Any], source_hash: str) -> None:
        """Store an enriched payload in the cache."""
        self._entries[entry_id] = CachedPayload(
            payload=payload,
            cached_at=monotonic_seconds(),
            source_hash=source_hash,
        )
        LOGGER.debug("Payload cached for %s", entry_id)

    def invalidate(self, entry_id: str) -> None:
        """Invalidate the cache for a specific entry."""
        if entry_id in self._entries:
            del self._entries[entry_id]
            LOGGER.debug("Payload cache invalidated for %s", entry_id)

    def invalidate_all(self) -> None:
        """Invalidate all cached payloads."""
        if self._entries:
            count = len(self._entries)
            self._entries.clear()
            LOGGER.debug("Payload cache invalidated: %d entries cleared", count)


def get_payload_cache(hass: HomeAssistant) -> PayloadCache:
    """Get or create the payload cache for this hass instance."""
    data = hass.data.setdefault(DOMAIN, {})
    cache = data.get(_CACHE_KEY)
    if cache is None:
        cache = PayloadCache()
        data[_CACHE_KEY] = cache
        LOGGER.debug("Payload cache created")
    return cache


def set_payload_cache_ttl(hass: HomeAssistant, ttl_seconds: float) -> None:
    """Set the payload cache TTL."""
    cache = get_payload_cache(hass)
    cache.ttl_seconds = ttl_seconds
    LOGGER.debug("Payload cache TTL set to %.1f seconds", ttl_seconds)


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
    """
    if payload is None:
        return ""
    parts = [
        str(payload.get("schema_version", "")),
        str(len(payload.get("edges", []))),
        str(len(payload.get("node_types", {}))),
        str(len(payload.get("client_macs", {}))),
        str(len(payload.get("device_macs", {}))),
    ]
    return "|".join(parts)
