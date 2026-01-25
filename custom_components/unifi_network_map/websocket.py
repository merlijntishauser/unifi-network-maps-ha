"""WebSocket API for UniFi Network Map."""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from .const import DOMAIN
from .coordinator import UniFiNetworkMapCoordinator
from .http import (
    resolve_client_entity_map,
    resolve_device_entity_map,
    resolve_node_entity_map,
    resolve_node_status_map,
    resolve_related_entities,
)


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
        connection.send_error(msg["id"], "not_found", f"Entry {entry_id} not found")
        return

    if coordinator.data is None:
        connection.send_error(msg["id"], "no_data", "Coordinator has no data yet")
        return

    payload = _build_payload(hass, coordinator)
    connection.send_message(websocket_api.event_message(msg["id"], {"payload": payload}))

    @callback  # type: ignore[reportUntypedFunctionDecorator]
    def _on_update() -> None:
        """Handle coordinator update."""
        if coordinator.data is None:
            return
        updated_payload = _build_payload(hass, coordinator)
        connection.send_message(
            websocket_api.event_message(msg["id"], {"payload": updated_payload})
        )

    unsubscribe = coordinator.async_add_listener(_on_update)
    connection.subscriptions[msg["id"]] = unsubscribe


def _get_coordinator(hass: HomeAssistant, entry_id: str) -> UniFiNetworkMapCoordinator | None:
    """Get coordinator by entry ID."""
    coordinator = hass.data.get(DOMAIN, {}).get(entry_id)
    if isinstance(coordinator, UniFiNetworkMapCoordinator):
        return coordinator
    return None


def _build_payload(hass: HomeAssistant, coordinator: UniFiNetworkMapCoordinator) -> dict[str, Any]:
    """Build full payload with resolved entities."""
    data = coordinator.data
    if data is None:
        return {}

    payload = dict(data.payload)
    client_macs = payload.get("client_macs", {})
    device_macs = payload.get("device_macs", {})

    client_entities = resolve_client_entity_map(hass, client_macs)
    device_entities = resolve_device_entity_map(hass, device_macs)
    node_entities = resolve_node_entity_map(client_entities, device_entities)

    if client_entities:
        payload["client_entities"] = client_entities
    if device_entities:
        payload["device_entities"] = device_entities
    if node_entities:
        payload["node_entities"] = node_entities

    node_status = resolve_node_status_map(hass, node_entities)
    if node_status:
        payload["node_status"] = node_status

    related_entities = resolve_related_entities(hass, client_macs, device_macs)
    if related_entities:
        payload["related_entities"] = related_entities

    return payload
