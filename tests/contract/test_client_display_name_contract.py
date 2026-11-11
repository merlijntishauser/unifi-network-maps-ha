"""Contract: client names come from unifi-topology's client_display_name.

The payload's client_details (client sensor entity names) and VLAN client
lists use it, so they match the labels on the rendered map.
"""

from __future__ import annotations

from typing import Any

from unifi_topology.model.classify import client_display_name


def test_prefers_name_then_hostname_then_mac() -> None:
    full: dict[str, Any] = {"name": "My Device", "hostname": "h", "mac": "aa"}
    assert client_display_name(full) == "My Device"
    assert client_display_name({"hostname": "device.local", "mac": "aa"}) == (
        "device.local"
    )
    assert client_display_name({"mac": "aa:bb:cc:dd:ee:ff"}) == (
        "aa:bb:cc:dd:ee:ff"
    )


def test_strips_and_skips_blank_values() -> None:
    assert client_display_name({"name": "  My Device  "}) == "My Device"
    assert client_display_name({"name": "   ", "hostname": "h"}) == "h"


def test_returns_none_without_any_name() -> None:
    assert client_display_name({}) is None
    assert client_display_name({"name": "", "hostname": "", "mac": ""}) is None


def test_ignores_root_name_that_is_the_model() -> None:
    camera: dict[str, Any] = {
        "name": "G6 Pro Bullet",
        "unifi_device_info_from_ucore": {
            "name": "Kamera_Kapu",
            "computed_model": "G6 Pro Bullet",
        },
    }
    assert client_display_name(camera) == "Kamera_Kapu"
