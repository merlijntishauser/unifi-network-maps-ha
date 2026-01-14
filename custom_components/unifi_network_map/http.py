from __future__ import annotations

from aiohttp import web
from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant

from .const import DOMAIN
from .coordinator import UniFiNetworkMapCoordinator
from .data import UniFiNetworkMapData

_VIEWS_REGISTERED = "views_registered"


def register_unifi_http_views(hass: HomeAssistant) -> None:
    data = hass.data.setdefault(DOMAIN, {})
    if data.get(_VIEWS_REGISTERED):
        return
    hass.http.register_view(UniFiNetworkMapSvgView)
    hass.http.register_view(UniFiNetworkMapPayloadView)
    data[_VIEWS_REGISTERED] = True


def _get_coordinator(hass: HomeAssistant, entry_id: str) -> UniFiNetworkMapCoordinator | None:
    return hass.data.get(DOMAIN, {}).get(entry_id)


def _get_data(coordinator: UniFiNetworkMapCoordinator | None) -> UniFiNetworkMapData | None:
    if coordinator is None:
        return None
    return coordinator.data


class UniFiNetworkMapSvgView(HomeAssistantView):
    url = "/api/unifi_network_map/{entry_id}/svg"
    name = "api:unifi_network_map:svg"

    async def get(self, request: web.Request) -> web.Response:
        entry_id = request.match_info["entry_id"]
        data = _get_data(_get_coordinator(request.app["hass"], entry_id))
        if data is None:
            raise web.HTTPNotFound()
        return web.Response(text=data.svg, content_type="image/svg+xml")


class UniFiNetworkMapPayloadView(HomeAssistantView):
    url = "/api/unifi_network_map/{entry_id}/payload"
    name = "api:unifi_network_map:payload"

    async def get(self, request: web.Request) -> web.Response:
        entry_id = request.match_info["entry_id"]
        data = _get_data(_get_coordinator(request.app["hass"], entry_id))
        if data is None:
            raise web.HTTPNotFound()
        return web.json_response(data.payload)
