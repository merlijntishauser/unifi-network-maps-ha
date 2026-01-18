from __future__ import annotations

from custom_components.unifi_network_map import utils


def test_monotonic_seconds_returns_float() -> None:
    result = utils.monotonic_seconds()

    assert isinstance(result, float)
