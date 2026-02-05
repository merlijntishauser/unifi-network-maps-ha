from __future__ import annotations

from datetime import timedelta
import logging

DOMAIN = "unifi_network_map"
PLATFORMS = ["sensor", "binary_sensor"]
PAYLOAD_SCHEMA_VERSION = "1.4"

SERVICE_REFRESH = "refresh"
ATTR_ENTRY_ID = "entry_id"
DEFAULT_SCAN_INTERVAL_SECONDS = 600
DEFAULT_SCAN_INTERVAL = timedelta(seconds=DEFAULT_SCAN_INTERVAL_SECONDS)
DEFAULT_RENDER_CACHE_SECONDS = DEFAULT_SCAN_INTERVAL_SECONDS
DEFAULT_SITE = "default"
DEFAULT_VERIFY_SSL = False
DEFAULT_INCLUDE_PORTS = True
DEFAULT_INCLUDE_CLIENTS = True
DEFAULT_CLIENT_SCOPE = "wired"
DEFAULT_ONLY_UNIFI = False
DEFAULT_SVG_ISOMETRIC = True
DEFAULT_USE_CACHE = True
DEFAULT_REQUEST_TIMEOUT_SECONDS = 30
DEFAULT_PAYLOAD_CACHE_TTL_SECONDS = 30
MIN_PAYLOAD_CACHE_TTL_SECONDS = 0
MAX_PAYLOAD_CACHE_TTL_SECONDS = 300
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
CONF_SVG_THEME = "svg_theme"
CONF_ICON_SET = "icon_set"
CONF_SHOW_WAN = "show_wan"
CONF_USE_CACHE = "use_cache"

DEFAULT_SVG_THEME = "unifi"
DEFAULT_ICON_SET = "modern"
DEFAULT_SHOW_WAN = True
CONF_SCAN_INTERVAL = "scan_interval"
CONF_REQUEST_TIMEOUT_SECONDS = "request_timeout_seconds"
CONF_PAYLOAD_CACHE_TTL = "payload_cache_ttl"
CONF_TRACKED_CLIENTS = "tracked_clients"
DEFAULT_TRACKED_CLIENTS = ""

MIN_SCAN_INTERVAL_MINUTES = 1
MAX_SCAN_INTERVAL_MINUTES = 60
DEFAULT_SCAN_INTERVAL_MINUTES = 10

LOGGER = logging.getLogger(__name__)

# UniFi model code to friendly name mapping
# Used as fallback when controller doesn't provide model_name
UNIFI_MODEL_NAMES: dict[str, str] = {
    # Dream Machines / Gateways
    "UDM": "UniFi Dream Machine",
    "UDMPRO": "UniFi Dream Machine Pro",
    "UDMSE": "UniFi Dream Machine SE",
    "UDMPROSE": "UniFi Dream Machine Pro SE",
    "UDM-Pro": "UniFi Dream Machine Pro",
    "UDM-SE": "UniFi Dream Machine SE",
    "UDM-Pro-SE": "UniFi Dream Machine Pro SE",
    "UDR": "UniFi Dream Router",
    "UDW": "UniFi Dream Wall",
    "UXG-Pro": "UniFi Next-Gen Gateway Pro",
    "UXGPRO": "UniFi Next-Gen Gateway Pro",
    "UXG-Lite": "UniFi Express",
    "UXGLite": "UniFi Express",
    "USG": "UniFi Security Gateway",
    "USG-Pro-4": "UniFi Security Gateway Pro 4",
    "USG-XG-8": "UniFi Security Gateway XG 8",
    "UCG-Ultra": "UniFi Cloud Gateway Ultra",
    "UCGUltra": "UniFi Cloud Gateway Ultra",
    "UCG-Max": "UniFi Cloud Gateway Max",
    "UCGMax": "UniFi Cloud Gateway Max",
    # Switches - Standard
    "US-8": "UniFi Switch 8",
    "US-8-60W": "UniFi Switch 8 60W",
    "US-8-150W": "UniFi Switch 8 150W",
    "US-16-150W": "UniFi Switch 16 150W",
    "US-24": "UniFi Switch 24",
    "US-24-250W": "UniFi Switch 24 250W",
    "US-24-500W": "UniFi Switch 24 500W",
    "US-48": "UniFi Switch 48",
    "US-48-500W": "UniFi Switch 48 500W",
    "US-48-750W": "UniFi Switch 48 750W",
    # Switches - Lite/Flex
    "USW-Lite-8-PoE": "UniFi Switch Lite 8 PoE",
    "USL8LP": "UniFi Switch Lite 8 PoE",
    "USW-Lite-16-PoE": "UniFi Switch Lite 16 PoE",
    "USL16LP": "UniFi Switch Lite 16 PoE",
    "USW-Flex": "UniFi Switch Flex",
    "USF-Flex": "UniFi Switch Flex",
    "USW-Flex-Mini": "UniFi Switch Flex Mini",
    "USW-Flex-XG": "UniFi Switch Flex XG",
    # Switches - Pro/Enterprise
    "USW-Pro-24": "UniFi Switch Pro 24",
    "USW-Pro-24-PoE": "UniFi Switch Pro 24 PoE",
    "USW-Pro-48": "UniFi Switch Pro 48",
    "USW-Pro-48-PoE": "UniFi Switch Pro 48 PoE",
    "USW-Pro-Max-24": "UniFi Pro Max 24",
    "USW-Pro-Max-24-PoE": "UniFi Pro Max 24 PoE",
    "USW-Pro-Max-48": "UniFi Pro Max 48",
    "USW-Pro-Max-48-PoE": "UniFi Pro Max 48 PoE",
    "USW-Enterprise-8-PoE": "UniFi Switch Enterprise 8 PoE",
    "USW-Enterprise-24-PoE": "UniFi Switch Enterprise 24 PoE",
    "USW-Enterprise-48-PoE": "UniFi Switch Enterprise 48 PoE",
    "USW-EnterpriseXG-24": "UniFi Switch Enterprise XG 24",
    # Switches - Aggregation
    "USW-Aggregation": "UniFi Switch Aggregation",
    "USW-Pro-Aggregation": "UniFi Switch Pro Aggregation",
    # Access Points - WiFi 6 (U6)
    "U6-Lite": "UniFi U6 Lite",
    "U6Lite": "UniFi U6 Lite",
    "U6-LR": "UniFi U6 Long-Range",
    "U6LR": "UniFi U6 Long-Range",
    "U6-Pro": "UniFi U6 Pro",
    "U6Pro": "UniFi U6 Pro",
    "U6-Plus": "UniFi U6+",
    "U6Plus": "UniFi U6+",
    "U6-Extender": "UniFi U6 Extender",
    "U6-Mesh": "UniFi U6 Mesh",
    "U6Mesh": "UniFi U6 Mesh",
    "U6-Enterprise": "UniFi U6 Enterprise",
    "U6Enterprise": "UniFi U6 Enterprise",
    "U6-Enterprise-IW": "UniFi U6 Enterprise In-Wall",
    "U6-IW": "UniFi U6 In-Wall",
    # Access Points - WiFi 7 (U7)
    "U7-Pro": "UniFi U7 Pro",
    "U7Pro": "UniFi U7 Pro",
    "U7-Pro-Max": "UniFi U7 Pro Max",
    "U7-Outdoor": "UniFi U7 Outdoor",
    # Access Points - Legacy
    "UAP": "UniFi AP",
    "UAP-LR": "UniFi AP Long-Range",
    "UAP-Pro": "UniFi AP Pro",
    "UAP-AC-Lite": "UniFi AP AC Lite",
    "UAP-AC-LR": "UniFi AP AC Long-Range",
    "UAP-AC-Pro": "UniFi AP AC Pro",
    "UAP-AC-HD": "UniFi AP AC HD",
    "UAP-AC-SHD": "UniFi AP AC SHD",
    "UAP-AC-M": "UniFi AP AC Mesh",
    "UAP-AC-M-Pro": "UniFi AP AC Mesh Pro",
    "UAP-AC-IW": "UniFi AP AC In-Wall",
    "UAP-AC-IW-Pro": "UniFi AP AC In-Wall Pro",
    "UAP-IW-HD": "UniFi AP In-Wall HD",
    "UAP-nanoHD": "UniFi nanoHD",
    "UAP-FlexHD": "UniFi FlexHD",
    "UAP-BeaconHD": "UniFi BeaconHD",
    "UWB-XG": "UniFi WiFi BaseStation XG",
    # Building-to-Building
    "UBB": "UniFi Building-to-Building Bridge",
    "UBB-XG": "UniFi Building-to-Building Bridge XG",
}
