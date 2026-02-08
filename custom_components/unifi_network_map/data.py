from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from unifi_network_maps.model.topology import WanInfo


@dataclass(slots=True)
class UniFiNetworkMapData:
    svg: str
    payload: dict[str, Any]
    wan_info: WanInfo | None = field(default=None)
