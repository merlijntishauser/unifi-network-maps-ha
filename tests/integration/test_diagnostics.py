from __future__ import annotations

import asyncio

import pytest

from custom_components.unifi_network_map import diagnostics
from custom_components.unifi_network_map.data import UniFiNetworkMapData
from tests.helpers import build_entry


class FakeHass:
    def __init__(self) -> None:
        self.data: dict[str, object] = {}


def _resolve_client_entity_map(_hass: FakeHass, _macs: dict[str, str]) -> dict[str, str]:
    return {"Client": "device_tracker.client"}


def _entity_mac_stats(_hass: FakeHass) -> dict[str, int]:
    return {"unifi_entities_scanned": 2, "unifi_entities_with_mac": 2}


def _entity_macs(_hass: FakeHass) -> set[str]:
    return {"aa:bb:cc:dd:ee:ff"}


def _state_entity_macs(_hass: FakeHass) -> set[str]:
    return {"11:22:33:44:55:66"}


def _normalize_mac_value(value: str) -> str:
    return value.strip().lower()


def test_diagnostics_without_coordinator() -> None:
    hass = FakeHass()
    entry = build_entry()

    result = asyncio.run(diagnostics.async_get_config_entry_diagnostics(hass, entry))

    assert result["entry"]["entry_id"] == entry.entry_id
    assert result["coordinator"]["last_update_success"] is None
    assert result["map_summary"] is None


def test_diagnostics_summary_with_payload(monkeypatch: pytest.MonkeyPatch) -> None:
    hass = FakeHass()
    entry = build_entry()
    data = UniFiNetworkMapData(
        svg="<svg />",
        payload={
            "schema_version": "1.1",
            "node_types": {"gw": "gateway", "sw": "switch"},
            "edges": [{"left": "gw", "right": "sw"}],
            "client_macs": {"Client": "AA:BB:CC:DD:EE:FF"},
            "device_macs": {"Switch": "11:22:33:44:55:66"},
        },
    )
    coordinator = type(
        "Coordinator",
        (),
        {
            "data": data,
            "last_update_success": True,
            "last_exception": None,
        },
    )()
    hass.data["unifi_network_map"] = {entry.entry_id: coordinator}

    monkeypatch.setattr(
        diagnostics,
        "resolve_client_entity_map",
        _resolve_client_entity_map,
    )
    monkeypatch.setattr(
        diagnostics,
        "get_unifi_entity_mac_stats",
        _entity_mac_stats,
    )
    monkeypatch.setattr(
        diagnostics,
        "get_unifi_entity_macs",
        _entity_macs,
    )
    monkeypatch.setattr(
        diagnostics,
        "get_state_entity_macs",
        _state_entity_macs,
    )
    monkeypatch.setattr(
        diagnostics,
        "normalize_mac_value",
        _normalize_mac_value,
    )

    result = asyncio.run(diagnostics.async_get_config_entry_diagnostics(hass, entry))
    summary = result["map_summary"]

    assert summary["node_count"] == 2
    assert summary["edge_count"] == 1
    assert summary["client_macs_count"] == 1
    assert summary["linked_clients_count"] == 1
    assert summary["device_macs_count"] == 1
    assert summary["client_mac_overlap_count"] == 1
    assert summary["state_mac_overlap_count"] == 1
    assert summary["payload_schema_version"] == "1.1"
