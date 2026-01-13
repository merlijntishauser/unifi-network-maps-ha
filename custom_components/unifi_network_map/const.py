from __future__ import annotations

from datetime import timedelta
import logging

DOMAIN = "unifi_network_map"
DEFAULT_SCAN_INTERVAL_SECONDS = 60
DEFAULT_SCAN_INTERVAL = timedelta(seconds=DEFAULT_SCAN_INTERVAL_SECONDS)
DEFAULT_SITE = "default"
DEFAULT_VERIFY_SSL = True

CONF_SITE = "site"
CONF_VERIFY_SSL = "verify_ssl"

LOGGER = logging.getLogger(__name__)
