from __future__ import annotations

from dataclasses import dataclass, field
import logging
import os
from time import monotonic

from unifi_network_maps.adapters.config import Config
from unifi_network_maps.adapters.unifi import fetch_devices
from requests import RequestException
from requests.exceptions import HTTPError

from .data import UniFiNetworkMapData
from .errors import CannotConnect, InvalidAuth, UniFiNetworkMapError
from .renderer import RenderSettings, UniFiNetworkMapRenderer
from .const import DEFAULT_RENDER_CACHE_SECONDS

SSL_WARNING_MESSAGE = (
    "SSL certificate verification is disabled. This is not recommended for production use."
)
DEFAULT_REQUEST_TIMEOUT_SECONDS = 30.0

_ssl_warning_filter_added = False
_ssl_warning_filter: logging.Filter | None = None


@dataclass(slots=True)
class UniFiNetworkMapClient:
    base_url: str
    username: str
    password: str
    site: str
    verify_ssl: bool
    settings: RenderSettings
    request_timeout_seconds: float | None = None
    _cache_data: UniFiNetworkMapData | None = field(default=None, init=False)
    _cache_time: float | None = field(default=None, init=False)

    def fetch_map(self) -> UniFiNetworkMapData:
        _ensure_unifi_ssl_warning_filter(self.verify_ssl)
        _ensure_unifi_request_timeout(self.request_timeout_seconds)
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
        data = _render_map_payload(config, self.settings)
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
    _ensure_unifi_ssl_warning_filter(verify_ssl)
    _ensure_unifi_request_timeout(None)
    config = _build_config(base_url, username, password, site, verify_ssl)
    auth_error = _load_unifi_auth_error()
    _assert_unifi_connectivity(config, site, auth_error)


def _build_config(
    base_url: str, username: str, password: str, site: str, verify_ssl: bool
) -> Config:
    return Config(
        url=base_url,
        site=site,
        user=username,
        password=password,
        verify_ssl=verify_ssl,
    )


def _load_unifi_auth_error():
    try:
        from unifi_controller_api import UnifiAuthenticationError
    except ImportError as exc:
        raise CannotConnect("Missing dependency: unifi-controller-api") from exc
    return UnifiAuthenticationError


def _ensure_unifi_request_timeout(timeout_seconds: float | None) -> None:
    value = DEFAULT_REQUEST_TIMEOUT_SECONDS if timeout_seconds is None else timeout_seconds
    if value <= 0:
        os.environ.pop("UNIFI_REQUEST_TIMEOUT_SECONDS", None)
        return
    os.environ["UNIFI_REQUEST_TIMEOUT_SECONDS"] = str(value)


def _assert_unifi_connectivity(config: Config, site: str, auth_error: type[Exception]) -> None:
    try:
        fetch_devices(config, site=site, detailed=False, use_cache=False)
    except auth_error as exc:
        raise InvalidAuth("Authentication failed") from exc
    except (OSError, RequestException, RuntimeError, TimeoutError, ValueError) as exc:
        raise CannotConnect("Unable to connect") from exc


def _render_map_payload(config: Config, settings: RenderSettings) -> UniFiNetworkMapData:
    try:
        return UniFiNetworkMapRenderer().render(config, settings)
    except _unifi_auth_error() as exc:
        raise _map_auth_error(exc) from exc
    except (OSError, RequestException, RuntimeError, TimeoutError) as exc:
        raise CannotConnect("Unable to connect") from exc


def _map_auth_error(exc: Exception) -> UniFiNetworkMapError:
    status_code = _status_code_from_exception(exc)
    if status_code == 429:
        return CannotConnect("Rate limited by UniFi controller")
    return InvalidAuth("Authentication failed")


def _status_code_from_exception(exc: Exception) -> int | None:
    cause = getattr(exc, "__cause__", None)
    if isinstance(cause, HTTPError) and cause.response is not None:
        return cause.response.status_code
    return None


def _unifi_auth_error():
    from unifi_controller_api import UnifiAuthenticationError

    return UnifiAuthenticationError


class _OnceSSLWarningFilter(logging.Filter):
    def __init__(self) -> None:
        super().__init__()
        self._seen = False

    def filter(self, record: logging.LogRecord) -> bool:
        if record.levelno == logging.WARNING and record.getMessage() == SSL_WARNING_MESSAGE:
            if self._seen:
                return False
            self._seen = True
        return True


def _ensure_unifi_ssl_warning_filter(verify_ssl: bool) -> None:
    global _ssl_warning_filter_added, _ssl_warning_filter
    if verify_ssl or _ssl_warning_filter_added:
        return
    logger = logging.getLogger("unifi_controller_api.api_client")
    if _ssl_warning_filter is None:
        _ssl_warning_filter = _OnceSSLWarningFilter()
    logger.addFilter(_ssl_warning_filter)
    _ssl_warning_filter_added = True
