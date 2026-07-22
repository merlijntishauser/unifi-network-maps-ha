from __future__ import annotations

import logging
import os
import re
from dataclasses import dataclass, field
from time import monotonic
from typing import TYPE_CHECKING

from requests import RequestException
from requests.exceptions import HTTPError
from unifi_topology import Config, fetch_devices
from unifi_topology.adapters.unifi_api import UnifiApiError, UnifiAuthError

from .const import DEFAULT_RENDER_CACHE_SECONDS, LOGGER
from .errors import (
    CannotConnect,
    InvalidAuth,
    RequestRejected,
    UniFiNetworkMapError,
)
from .renderer import RenderSettings, UniFiNetworkMapRenderer

if TYPE_CHECKING:
    from .data import UniFiNetworkMapData

SSL_WARNING_MESSAGE = (
    "SSL certificate verification is disabled."
    " This is not recommended for production use."
)
DEFAULT_REQUEST_TIMEOUT_SECONDS = 30.0

_ssl_warning_filter_added = False
_ssl_warning_filter: logging.Filter | None = None


@dataclass(slots=True)
class UniFiNetworkMapClient:
    base_url: str
    username: str | None
    password: str | None
    site: str
    verify_ssl: bool
    settings: RenderSettings
    request_timeout_seconds: float | None = None
    api_key: str | None = None
    _cache_data: UniFiNetworkMapData | None = field(default=None, init=False)
    _cache_time: float | None = field(default=None, init=False)

    def fetch_map(self) -> UniFiNetworkMapData:
        _ensure_unifi_ssl_warning_filter(self.verify_ssl)
        _ensure_unifi_request_timeout(self.request_timeout_seconds)
        cached = self._get_cached_map()
        if cached is not None:
            LOGGER.debug("api fetch_map cache_hit=true site=%s", self.site)
            return cached
        LOGGER.debug(
            "api fetch_map started site=%s verify_ssl=%s timeout=%s auth=%s",
            self.site,
            self.verify_ssl,
            self.request_timeout_seconds,
            "api_key" if self.api_key else "password",
        )
        config = _build_config(
            base_url=self.base_url,
            username=self.username,
            password=self.password,
            site=self.site,
            verify_ssl=self.verify_ssl,
            api_key=self.api_key,
        )
        data = _render_map_payload(config, self.settings)
        self._store_cache(data)
        LOGGER.debug("api fetch_map completed site=%s", self.site)
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
    username: str | None,
    password: str | None,
    site: str,
    verify_ssl: bool,
    api_key: str | None = None,
) -> None:
    LOGGER.debug(
        "api validate_credentials started site=%s verify_ssl=%s auth=%s",
        site,
        verify_ssl,
        "api_key" if api_key else "password",
    )
    _ensure_unifi_ssl_warning_filter(verify_ssl)
    _ensure_unifi_request_timeout(None)
    config = _build_config(
        base_url=base_url,
        username=username,
        password=password,
        site=site,
        verify_ssl=verify_ssl,
        api_key=api_key,
    )
    _assert_unifi_connectivity(config, site)
    LOGGER.debug("api validate_credentials succeeded site=%s", site)


def _build_config(
    *,
    base_url: str,
    username: str | None,
    password: str | None,
    site: str,
    verify_ssl: bool,
    api_key: str | None = None,
) -> Config:
    return Config(
        url=base_url,
        site=site,
        user=username,
        password=password,
        api_key=api_key,
        verify_ssl=verify_ssl,
    )


def _ensure_unifi_request_timeout(timeout_seconds: float | None) -> None:
    value = (
        DEFAULT_REQUEST_TIMEOUT_SECONDS
        if timeout_seconds is None
        else timeout_seconds
    )
    if value <= 0:
        os.environ.pop("UNIFI_REQUEST_TIMEOUT_SECONDS", None)
        return
    os.environ["UNIFI_REQUEST_TIMEOUT_SECONDS"] = str(value)


def _assert_unifi_connectivity(config: Config, site: str) -> None:
    try:
        fetch_devices(config, site=site, detailed=False, use_cache=False)
    except UnifiAuthError as exc:
        LOGGER.debug(
            "api connectivity_check failed reason=auth_error site=%s", site
        )
        raise InvalidAuth("Authentication failed") from exc
    except UnifiApiError as exc:
        mapped = _map_api_error(exc)
        LOGGER.debug(
            "api connectivity_check failed reason=%s site=%s error=%s",
            "request_rejected"
            if isinstance(mapped, RequestRejected)
            else "connection_error",
            site,
            type(exc).__name__,
        )
        raise mapped from exc
    except (
        OSError,
        RequestException,
        RuntimeError,
        TimeoutError,
        ValueError,
    ) as exc:
        LOGGER.debug(
            "api connectivity_check failed"
            " reason=connection_error"
            " site=%s error=%s",
            site,
            type(exc).__name__,
        )
        raise CannotConnect("Unable to connect") from exc


def _render_map_payload(
    config: Config, settings: RenderSettings
) -> UniFiNetworkMapData:
    try:
        return UniFiNetworkMapRenderer().render(config, settings)
    except UnifiAuthError as exc:
        LOGGER.debug(
            "api render_map failed reason=auth_error site=%s", config.site
        )
        raise _map_auth_error(exc) from exc
    except UnifiApiError as exc:
        mapped = _map_api_error(exc)
        LOGGER.debug(
            "api render_map failed reason=%s site=%s error=%s",
            "request_rejected"
            if isinstance(mapped, RequestRejected)
            else "connection_error",
            config.site,
            type(exc).__name__,
        )
        raise mapped from exc
    except (
        OSError,
        RequestException,
        RuntimeError,
        TimeoutError,
    ) as exc:
        LOGGER.debug(
            "api render_map failed reason=connection_error site=%s error=%s",
            config.site,
            type(exc).__name__,
        )
        raise CannotConnect("Unable to connect") from exc


_REQUEST_REJECTED_STATUS = frozenset({401, 403})
_HTTP_STATUS_IN_MESSAGE = re.compile(r"\(HTTP (\d{3})\)")


def _map_auth_error(exc: Exception) -> UniFiNetworkMapError:
    status_code = _status_code_from_exception(exc)
    if status_code == 429:
        return CannotConnect("Rate limited by UniFi controller")
    return InvalidAuth("Authentication failed")


def _map_api_error(exc: Exception) -> UniFiNetworkMapError:
    """Map a data-endpoint failure, distinguishing a post-login rejection.

    A 401/403 here means login succeeded but the request was refused
    (wrong site, missing permission, or 2FA) -- surfaced as a distinct,
    actionable error rather than a misleading "cannot connect".
    """
    status_code = _unifi_api_status_code(exc)
    if status_code in _REQUEST_REJECTED_STATUS:
        return RequestRejected(
            "Controller accepted the login but rejected the request"
            f" (HTTP {status_code})"
        )
    return CannotConnect("Unable to connect")


def _status_code_from_exception(exc: Exception) -> int | None:
    status_code = getattr(exc, "status_code", None)
    if isinstance(status_code, int):
        return status_code
    cause = getattr(exc, "__cause__", None)
    if isinstance(cause, HTTPError) and cause.response is not None:
        return cause.response.status_code
    return None


def _unifi_api_status_code(exc: Exception) -> int | None:
    """Extract the HTTP status from a UnifiApiError.

    Prefers the ``status_code`` attribute (unifi-topology >= 3.0), then the
    ``HTTPError`` cause, then the ``... failed (HTTP <code>)`` message format
    locked by the contract test.
    """
    cause_status = _status_code_from_exception(exc)
    if cause_status is not None:
        return cause_status
    match = _HTTP_STATUS_IN_MESSAGE.search(str(exc))
    return int(match.group(1)) if match else None


class _OnceSSLWarningFilter(logging.Filter):
    def __init__(self) -> None:
        super().__init__()
        self._seen = False

    def filter(self, record: logging.LogRecord) -> bool:
        if (
            record.levelno == logging.WARNING
            and record.getMessage() == SSL_WARNING_MESSAGE
        ):
            if self._seen:
                return False
            self._seen = True
        return True


def _ensure_unifi_ssl_warning_filter(verify_ssl: bool) -> None:
    global _ssl_warning_filter_added, _ssl_warning_filter
    if verify_ssl or _ssl_warning_filter_added:
        return
    logger = logging.getLogger("unifi_topology.adapters.unifi_api")
    if _ssl_warning_filter is None:
        _ssl_warning_filter = _OnceSSLWarningFilter()
    logger.addFilter(_ssl_warning_filter)
    _ssl_warning_filter_added = True
