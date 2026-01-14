from __future__ import annotations

from dataclasses import dataclass

from unifi_network_maps.adapters.config import Config

from .data import UniFiNetworkMapData
from .renderer import RenderSettings, UniFiNetworkMapRenderer


@dataclass(slots=True)
class UniFiNetworkMapClient:
    base_url: str
    username: str
    password: str
    site: str
    verify_ssl: bool
    settings: RenderSettings

    def fetch_map(self) -> UniFiNetworkMapData:
        config = Config(
            url=self.base_url,
            site=self.site,
            user=self.username,
            password=self.password,
            verify_ssl=self.verify_ssl,
        )
        return UniFiNetworkMapRenderer().render(config, self.settings)
