from __future__ import annotations

from dataclasses import dataclass, field
from time import monotonic

from unifi_network_maps.adapters.config import Config
from unifi_network_maps.adapters.unifi import fetch_devices

from .data import UniFiNetworkMapData
from .errors import CannotConnect, InvalidAuth
from .renderer import RenderSettings, UniFiNetworkMapRenderer
from .const import DEFAULT_RENDER_CACHE_SECONDS


@dataclass(slots=True)
class UniFiNetworkMapClient:
    base_url: str
    username: str
    password: str
    site: str
    verify_ssl: bool
    settings: RenderSettings
    _cache_data: UniFiNetworkMapData | None = field(default=None, init=False)
    _cache_time: float | None = field(default=None, init=False)

    def fetch_map(self) -> UniFiNetworkMapData:
        cached = self._get_cached_map()
        if cached is not None:
            return cached
        config = Config(
            url=self.base_url,
            site=self.site,
            user=self.username,
            password=self.password,
            verify_ssl=self.verify_ssl,
        )
        data = UniFiNetworkMapRenderer().render(config, self.settings)
        self._store_cache(data)
        return data

    def _get_cached_map(self) -> UniFiNetworkMapData | None:
        if not self.settings.use_cache:
            return None
        if self._cache_data is None or self._cache_time is None:
            return None
        if monotonic() - self._cache_time > DEFAULT_RENDER_CACHE_SECONDS:
            return None
        return self._cache_data

    def _store_cache(self, data: UniFiNetworkMapData) -> None:
        if not self.settings.use_cache:
            return
        self._cache_data = data
        self._cache_time = monotonic()


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
