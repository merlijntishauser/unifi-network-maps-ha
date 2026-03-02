"""Tests for uncovered lines in __init__.py."""

from __future__ import annotations

import logging
from pathlib import Path
from types import SimpleNamespace
from typing import TYPE_CHECKING
from unittest.mock import AsyncMock, MagicMock, patch

import custom_components.unifi_network_map as init_module
from custom_components.unifi_network_map import (
    _async_options_updated,
    _create_install_notification,
    _frontend_bundle_url,
    _suppress_unifi_api_info_logs,
    _UnifiApiInfoFilter,
    async_migrate_entry,
)

if TYPE_CHECKING:
    import pytest


# -- _UnifiApiInfoFilter (line 41) --


def test_unifi_api_info_filter_blocks_info() -> None:
    f = _UnifiApiInfoFilter()
    record = logging.LogRecord("test", logging.INFO, "", 0, "msg", (), None)
    assert f.filter(record) is False


def test_unifi_api_info_filter_passes_warning() -> None:
    f = _UnifiApiInfoFilter()
    record = logging.LogRecord("test", logging.WARNING, "", 0, "msg", (), None)
    assert f.filter(record) is True


def test_unifi_api_info_filter_passes_debug() -> None:
    f = _UnifiApiInfoFilter()
    record = logging.LogRecord("test", logging.DEBUG, "", 0, "msg", (), None)
    assert f.filter(record) is True


# -- async_migrate_entry (lines 129-136) --


async def test_async_migrate_entry_returns_true() -> None:
    hass = MagicMock()
    entry = MagicMock()
    entry.version = 1
    entry.minor_version = 1
    result = await async_migrate_entry(hass, entry)
    assert result is True


# -- _async_options_updated (lines 98-105) --


async def test_async_options_updated() -> None:
    hass = MagicMock()
    hass.data = {}
    entry = MagicMock()
    entry.entry_id = "test_entry"
    entry.options = {}
    coordinator = MagicMock()
    coordinator.async_request_refresh = AsyncMock()
    entry.runtime_data = coordinator

    with (
        patch(
            "custom_components.unifi_network_map.payload_cache"
            ".invalidate_payload_cache"
        ),
        patch(
            "custom_components.unifi_network_map._configure_payload_cache_ttl"
        ),
    ):
        await _async_options_updated(hass, entry)

    coordinator.update_settings.assert_called_once()
    coordinator.async_request_refresh.assert_awaited_once()


# -- _suppress_unifi_api_info_logs early return (line 144) --


def test_suppress_unifi_api_info_logs_skips_in_debug_mode(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(init_module, "_unifi_api_info_filter_added", False)
    hass = MagicMock()
    hass.config.debug = True
    _suppress_unifi_api_info_logs(hass)
    # Should not flip the global flag because it returned early.
    assert init_module._unifi_api_info_filter_added is False


def test_suppress_unifi_api_info_logs_skips_when_already_added(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(init_module, "_unifi_api_info_filter_added", True)
    hass = MagicMock()
    hass.config.debug = False
    _suppress_unifi_api_info_logs(hass)
    # Already added, so nothing should change.
    assert init_module._unifi_api_info_filter_added is True


# -- _create_install_notification early return (lines 279-280) --


def test_create_install_notification_skips_when_unavailable() -> None:
    hass = MagicMock()
    # SimpleNamespace without persistent_notification attribute
    hass.components = SimpleNamespace()
    _create_install_notification(hass)
    # Should not crash -- just return early.


# -- _frontend_bundle_url fallback (line 318) --


def test_frontend_bundle_url_without_bundle() -> None:
    with patch(
        "custom_components.unifi_network_map._frontend_bundle_path"
    ) as mock_path:
        mock_path.return_value = Path("/nonexistent/path")
        url = _frontend_bundle_url()
    assert url.startswith("/unifi-network-map/unifi-network-map.js")
    assert "?v=" in url
    # Without a real file the URL should not contain a dash-separated mtime.
    version = init_module._INTEGRATION_VERSION
    assert url.endswith(f"?v={version}")
