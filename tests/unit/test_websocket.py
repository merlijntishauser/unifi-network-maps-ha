"""Unit tests for websocket module."""

from __future__ import annotations

from typing import Any
from unittest.mock import MagicMock, patch

import pytest

from custom_components.unifi_network_map.const import DOMAIN
from custom_components.unifi_network_map.coordinator import UniFiNetworkMapCoordinator
from custom_components.unifi_network_map.data import UniFiNetworkMapData
from custom_components.unifi_network_map.websocket import (
    _build_payload,
    _get_coordinator,
    async_register_websocket_api,
    websocket_subscribe_map,
)


class TestAsyncRegisterWebsocketApi:
    """Tests for async_register_websocket_api function."""

    def test_registers_command(self) -> None:
        hass = MagicMock()
        hass.data = {}

        with patch(
            "custom_components.unifi_network_map.websocket.websocket_api.async_register_command"
        ) as mock_register:
            async_register_websocket_api(hass)

        mock_register.assert_called_once()
        assert hass.data[DOMAIN]["websocket_registered"] is True

    def test_does_not_register_twice(self) -> None:
        hass = MagicMock()
        hass.data = {DOMAIN: {"websocket_registered": True}}

        with patch(
            "custom_components.unifi_network_map.websocket.websocket_api.async_register_command"
        ) as mock_register:
            async_register_websocket_api(hass)

        mock_register.assert_not_called()


class TestGetCoordinator:
    """Tests for _get_coordinator function."""

    def test_returns_coordinator_if_found(self) -> None:
        coordinator = MagicMock(spec=UniFiNetworkMapCoordinator)
        hass = MagicMock()
        hass.data = {DOMAIN: {"entry123": coordinator}}

        result = _get_coordinator(hass, "entry123")
        assert result is coordinator

    def test_returns_none_if_not_found(self) -> None:
        hass = MagicMock()
        hass.data = {DOMAIN: {}}

        result = _get_coordinator(hass, "entry123")
        assert result is None

    def test_returns_none_if_wrong_type(self) -> None:
        hass = MagicMock()
        hass.data = {DOMAIN: {"entry123": "not a coordinator"}}

        result = _get_coordinator(hass, "entry123")
        assert result is None

    def test_returns_none_if_no_domain_data(self) -> None:
        hass = MagicMock()
        hass.data = {}

        result = _get_coordinator(hass, "entry123")
        assert result is None


class TestBuildPayload:
    """Tests for _build_payload function."""

    def test_returns_empty_dict_if_no_data(self) -> None:
        hass = MagicMock()
        coordinator = MagicMock(spec=UniFiNetworkMapCoordinator)
        coordinator.data = None

        result = _build_payload(hass, coordinator)
        assert result == {}

    def test_builds_enriched_payload(self) -> None:
        hass = MagicMock()
        coordinator = MagicMock(spec=UniFiNetworkMapCoordinator)
        coordinator.data = UniFiNetworkMapData(
            svg="<svg></svg>",
            payload={"edges": [], "node_types": {}},
        )

        with patch(
            "custom_components.unifi_network_map.websocket.build_enriched_payload"
        ) as mock_enrich:
            mock_enrich.return_value = {"enriched": True}
            result = _build_payload(hass, coordinator)

        assert result == {"enriched": True}
        mock_enrich.assert_called_once()

    def test_deep_copies_payload(self) -> None:
        hass = MagicMock()
        original_payload = {"edges": [{"left": "a", "right": "b"}], "node_types": {"a": "switch"}}
        coordinator = MagicMock(spec=UniFiNetworkMapCoordinator)
        coordinator.data = UniFiNetworkMapData(
            svg="<svg></svg>",
            payload=original_payload,
        )

        with patch(
            "custom_components.unifi_network_map.websocket.build_enriched_payload"
        ) as mock_enrich:
            mock_enrich.return_value = {"enriched": True}
            _build_payload(hass, coordinator)

        # Verify the original payload wasn't modified
        args = mock_enrich.call_args[0]
        assert args[1] is not original_payload  # Should be a copy


class TestWebsocketSubscribeMap:
    """Tests for websocket_subscribe_map function."""

    @pytest.mark.asyncio  # type: ignore[misc]
    async def test_sends_error_if_coordinator_not_found(self) -> None:
        hass = MagicMock()
        hass.data = {}
        connection = MagicMock()
        msg: dict[str, Any] = {"id": 1, "entry_id": "unknown"}

        await websocket_subscribe_map(hass, connection, msg)

        connection.send_error.assert_called_once()
        args = connection.send_error.call_args[0]
        assert args[0] == 1
        assert args[1] == "not_found"

    @pytest.mark.asyncio  # type: ignore[misc]
    async def test_sends_error_if_no_data(self) -> None:
        coordinator = MagicMock(spec=UniFiNetworkMapCoordinator)
        coordinator.data = None
        hass = MagicMock()
        hass.data = {DOMAIN: {"entry123": coordinator}}
        connection = MagicMock()
        msg: dict[str, Any] = {"id": 1, "entry_id": "entry123"}

        await websocket_subscribe_map(hass, connection, msg)

        connection.send_error.assert_called_once()
        args = connection.send_error.call_args[0]
        assert args[0] == 1
        assert args[1] == "no_data"

    @pytest.mark.asyncio  # type: ignore[misc]
    async def test_sends_initial_payload_and_subscribes(self) -> None:
        coordinator = MagicMock(spec=UniFiNetworkMapCoordinator)
        coordinator.data = UniFiNetworkMapData(
            svg="<svg></svg>",
            payload={"edges": [], "node_types": {}},
        )
        coordinator.async_add_listener = MagicMock(return_value=MagicMock())

        hass = MagicMock()
        hass.data = {DOMAIN: {"entry123": coordinator}}
        connection = MagicMock()
        connection.subscriptions = {}
        msg: dict[str, Any] = {"id": 1, "entry_id": "entry123"}

        with patch(
            "custom_components.unifi_network_map.websocket.build_enriched_payload"
        ) as mock_enrich:
            mock_enrich.return_value = {"enriched": True}
            await websocket_subscribe_map(hass, connection, msg)

        # Should send initial message
        connection.send_message.assert_called_once()

        # Should subscribe to updates
        coordinator.async_add_listener.assert_called_once()

        # Should store unsubscribe callback
        assert 1 in connection.subscriptions

    @pytest.mark.asyncio  # type: ignore[misc]
    async def test_update_callback_sends_message(self) -> None:
        coordinator = MagicMock(spec=UniFiNetworkMapCoordinator)
        coordinator.data = UniFiNetworkMapData(
            svg="<svg></svg>",
            payload={"edges": [], "node_types": {}},
        )

        captured_callback = None

        def capture_listener(callback: Any) -> MagicMock:
            nonlocal captured_callback
            captured_callback = callback
            return MagicMock()

        coordinator.async_add_listener = capture_listener

        hass = MagicMock()
        hass.data = {DOMAIN: {"entry123": coordinator}}
        connection = MagicMock()
        connection.subscriptions = {}
        msg: dict[str, Any] = {"id": 1, "entry_id": "entry123"}

        with patch(
            "custom_components.unifi_network_map.websocket.build_enriched_payload"
        ) as mock_enrich:
            mock_enrich.return_value = {"enriched": True}
            await websocket_subscribe_map(hass, connection, msg)

        # Reset mock to check update call
        connection.send_message.reset_mock()

        # Trigger the update callback
        assert captured_callback is not None
        captured_callback()

        # Should send update message
        connection.send_message.assert_called_once()

    @pytest.mark.asyncio  # type: ignore[misc]
    async def test_update_callback_skips_if_no_data(self) -> None:
        coordinator = MagicMock(spec=UniFiNetworkMapCoordinator)
        coordinator.data = UniFiNetworkMapData(
            svg="<svg></svg>",
            payload={"edges": [], "node_types": {}},
        )

        captured_callback = None

        def capture_listener(callback: Any) -> MagicMock:
            nonlocal captured_callback
            captured_callback = callback
            return MagicMock()

        coordinator.async_add_listener = capture_listener

        hass = MagicMock()
        hass.data = {DOMAIN: {"entry123": coordinator}}
        connection = MagicMock()
        connection.subscriptions = {}
        msg: dict[str, Any] = {"id": 1, "entry_id": "entry123"}

        with patch(
            "custom_components.unifi_network_map.websocket.build_enriched_payload"
        ) as mock_enrich:
            mock_enrich.return_value = {"enriched": True}
            await websocket_subscribe_map(hass, connection, msg)

        # Reset mock and set data to None
        connection.send_message.reset_mock()
        coordinator.data = None

        # Trigger the update callback
        assert captured_callback is not None
        captured_callback()

        # Should not send message when data is None
        connection.send_message.assert_not_called()
