"""HTTP views serving the rendered SVG map and enriched payload."""

from __future__ import annotations

from typing import TYPE_CHECKING

from aiohttp import web
from homeassistant.components.http import HomeAssistantView

from .const import DOMAIN
from .enrichment import get_or_build_enriched_payload
from .renderer import render_themed_svg

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

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


def _get_coordinator(
    hass: HomeAssistant, entry_id: str
) -> UniFiNetworkMapCoordinator | None:
    entry = hass.config_entries.async_get_entry(entry_id)
    if entry is None:
        return None
    return getattr(entry, "runtime_data", None)


def _get_data(
    coordinator: UniFiNetworkMapCoordinator | None,
) -> UniFiNetworkMapData | None:
    if coordinator is None:
        return None
    return coordinator.data


class UniFiNetworkMapSvgView(HomeAssistantView):  # type: ignore[reportUntypedBaseClass]
    url = "/api/unifi_network_map/{entry_id}/svg"
    name = "api:unifi_network_map:svg"

    async def get(self, request: web.Request, entry_id: str) -> web.Response:
        hass = request.app["hass"]
        coordinator = _get_coordinator(hass, entry_id)
        data = _get_data(coordinator)
        if data is None:
            raise web.HTTPNotFound()
        svg_theme = request.query.get("svg_theme")
        icon_set = request.query.get("icon_set")
        if (svg_theme or icon_set) and coordinator is not None:
            themed_svg, background = await hass.async_add_executor_job(
                render_themed_svg,
                data,
                coordinator.settings,
                svg_theme,
                icon_set,
            )
            headers = {"X-Theme-Background": background}
            return web.Response(
                text=themed_svg, content_type="image/svg+xml", headers=headers
            )
        return web.Response(text=data.svg, content_type="image/svg+xml")


class UniFiNetworkMapPayloadView(HomeAssistantView):  # type: ignore[reportUntypedBaseClass]
    url = "/api/unifi_network_map/{entry_id}/payload"
    name = "api:unifi_network_map:payload"

    async def get(self, request: web.Request, entry_id: str) -> web.Response:
        hass = request.app["hass"]
        data = _get_data(_get_coordinator(hass, entry_id))
        if data is None:
            raise web.HTTPNotFound()
        payload = get_or_build_enriched_payload(hass, entry_id, data.payload)
        return web.json_response(payload)
