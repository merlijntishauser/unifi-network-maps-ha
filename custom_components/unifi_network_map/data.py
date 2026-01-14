from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(slots=True)
class UniFiNetworkMapData:
    svg: str
    payload: dict[str, Any]
