from __future__ import annotations

from dataclasses import dataclass

from unifi_network_maps.adapters.config import Config
from unifi_network_maps.adapters.unifi import fetch_devices

from .data import UniFiNetworkMapData
from .errors import CannotConnect, InvalidAuth
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


def validate_unifi_credentials(
    base_url: str,
    username: str,
    password: str,
    site: str,
    verify_ssl: bool,
) -> None:
    config = Config(
        url=base_url,
        site=site,
        user=username,
        password=password,
        verify_ssl=verify_ssl,
    )
    try:
        from unifi_controller_api import UnifiAuthenticationError
    except ImportError as exc:
        raise CannotConnect("Missing dependency: unifi-controller-api") from exc
    try:
        fetch_devices(config, site=site, detailed=False, use_cache=False)
    except UnifiAuthenticationError as exc:
        raise InvalidAuth("Authentication failed") from exc
    except Exception as exc:  # noqa: BLE001
        raise CannotConnect("Unable to connect") from exc
