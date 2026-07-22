"""WebSocket API for UniFi Network Map."""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from .const import DOMAIN
from .coordinator import UniFiNetworkMapCoordinator
from .http import get_or_build_enriched_payload


def async_register_websocket_api(hass: HomeAssistant) -> None:
    """Register WebSocket API commands."""
    data = hass.data.setdefault(DOMAIN, {})
    if data.get("websocket_registered"):
        return
    websocket_api.async_register_command(hass, websocket_subscribe_map)
    data["websocket_registered"] = True


@websocket_api.websocket_command(  # type: ignore[reportUntypedFunctionDecorator]
    {
        vol.Required("type"): "unifi_network_map/subscribe",
        vol.Required("entry_id"): str,
    }
)
@websocket_api.async_response  # type: ignore[reportUntypedFunctionDecorator]
async def websocket_subscribe_map(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Subscribe to network map updates."""
    entry_id = msg["entry_id"]
    coordinator = _get_coordinator(hass, entry_id)

    if coordinator is None:
        connection.send_error(
            msg["id"], "not_found", f"Entry {entry_id} not found"
        )
        return

    if coordinator.data is None:
        connection.send_error(
            msg["id"], "no_data", "Coordinator has no data yet"
        )
        return

    # The result message resolves the frontend's subscribeMessage promise;
    # events alone never settle it.
    connection.send_result(msg["id"])

    payload = _build_payload(hass, coordinator, entry_id)
    connection.send_message(
        websocket_api.event_message(msg["id"], {"payload": payload})
    )

    @callback  # type: ignore[reportUntypedFunctionDecorator]
    def _on_update() -> None:
        """Handle coordinator update."""
        if coordinator.data is None:
            return
        updated_payload = _build_payload(hass, coordinator, entry_id)
        connection.send_message(
            websocket_api.event_message(
                msg["id"], {"payload": updated_payload}
            )
        )

    unsubscribe = coordinator.async_add_listener(_on_update)
    connection.subscriptions[msg["id"]] = unsubscribe


def _get_coordinator(
    hass: HomeAssistant, entry_id: str
) -> UniFiNetworkMapCoordinator | None:
    """Get coordinator by entry ID."""
    entry = hass.config_entries.async_get_entry(entry_id)
    if entry is None:
        return None
    data = getattr(entry, "runtime_data", None)
    if isinstance(data, UniFiNetworkMapCoordinator):
        return data
    return None


def _build_payload(
    hass: HomeAssistant,
    coordinator: UniFiNetworkMapCoordinator,
    entry_id: str,
) -> dict[str, Any]:
    """Build the enriched payload via the shared hash+TTL cache.

    Sharing the HTTP view's cache means N subscribers cost one
    enrichment per coordinator update instead of one each.
    """
    data = coordinator.data
    if data is None:
        return {}
    return get_or_build_enriched_payload(hass, entry_id, data.payload)
