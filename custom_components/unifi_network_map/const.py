from __future__ import annotations

from datetime import timedelta
import logging

DOMAIN = "unifi_network_map"
PLATFORMS = ["sensor"]
PAYLOAD_SCHEMA_VERSION = "1.2"

SERVICE_REFRESH = "refresh"
ATTR_ENTRY_ID = "entry_id"
DEFAULT_SCAN_INTERVAL_SECONDS = 600
DEFAULT_SCAN_INTERVAL = timedelta(seconds=DEFAULT_SCAN_INTERVAL_SECONDS)
DEFAULT_RENDER_CACHE_SECONDS = DEFAULT_SCAN_INTERVAL_SECONDS
DEFAULT_SITE = "default"
DEFAULT_VERIFY_SSL = True
DEFAULT_INCLUDE_PORTS = False
DEFAULT_INCLUDE_CLIENTS = False
DEFAULT_CLIENT_SCOPE = "wired"
DEFAULT_ONLY_UNIFI = False
DEFAULT_SVG_ISOMETRIC = False
DEFAULT_USE_CACHE = False
CLIENT_SCOPE_OPTIONS = ["wired", "wireless", "all"]

CONF_SITE = "site"
CONF_VERIFY_SSL = "verify_ssl"
CONF_INCLUDE_PORTS = "include_ports"
CONF_INCLUDE_CLIENTS = "include_clients"
CONF_CLIENT_SCOPE = "client_scope"
CONF_ONLY_UNIFI = "only_unifi"
CONF_SVG_ISOMETRIC = "svg_isometric"
CONF_SVG_WIDTH = "svg_width"
CONF_SVG_HEIGHT = "svg_height"
CONF_USE_CACHE = "use_cache"
CONF_SCAN_INTERVAL = "scan_interval"

MIN_SCAN_INTERVAL_MINUTES = 1
MAX_SCAN_INTERVAL_MINUTES = 60
DEFAULT_SCAN_INTERVAL_MINUTES = 10

LOGGER = logging.getLogger(__name__)
