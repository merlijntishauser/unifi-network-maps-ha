from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from unifi_topology import VpnTunnel, WanInfo


@dataclass(slots=True)
class UniFiNetworkMapData:
    svg: str
    payload: dict[str, Any]
    wan_info: WanInfo | None = field(default=None)
    vpn_tunnels: list[VpnTunnel] | None = field(default=None)
