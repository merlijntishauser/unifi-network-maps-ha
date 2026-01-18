from __future__ import annotations

import asyncio
from dataclasses import dataclass

import pytest

from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import UpdateFailed

from custom_components.unifi_network_map.coordinator import (
    AUTH_BACKOFF_BASE_SECONDS,
    UniFiNetworkMapCoordinator,
)
from custom_components.unifi_network_map.data import UniFiNetworkMapData
from custom_components.unifi_network_map.errors import CannotConnect, InvalidAuth
from custom_components.unifi_network_map.renderer import RenderSettings


@dataclass
class FakeEntry:
    data: dict[str, object]
    options: dict[str, object]


class FakeClient:
    def __init__(self, responses: list[UniFiNetworkMapData | Exception]) -> None:
        self._responses = responses
        self.settings = RenderSettings(
            include_ports=False,
            include_clients=False,
            client_scope="wired",
            only_unifi=False,
            svg_isometric=False,
            svg_width=None,
            svg_height=None,
            use_cache=False,
        )

    def fetch_map(self) -> UniFiNetworkMapData:
        response = self._responses.pop(0)
        if isinstance(response, Exception):
            raise response
        return response


def _build_entry() -> FakeEntry:
    return FakeEntry(
        data={
            "url": "https://controller.local",
            "username": "user",
            "password": "pass",
            "site": "default",
        },
        options={},
    )


def test_auth_backoff_blocks_immediate_retry(monkeypatch: pytest.MonkeyPatch) -> None:
    def _now() -> float:
        return 100.0

    monkeypatch.setattr(
        "custom_components.unifi_network_map.coordinator.monotonic_seconds",
        _now,
    )
    coordinator = UniFiNetworkMapCoordinator(
        HomeAssistant(), _build_entry(), client=FakeClient([InvalidAuth("Authentication failed")])
    )

    with pytest.raises(UpdateFailed):
        asyncio.run(coordinator.async_fetch_for_testing())

    assert coordinator.auth_backoff_until == pytest.approx(100.0 + AUTH_BACKOFF_BASE_SECONDS)
    assert coordinator.auth_backoff_seconds == AUTH_BACKOFF_BASE_SECONDS * 2

    with pytest.raises(UpdateFailed) as exc:
        asyncio.run(coordinator.async_fetch_for_testing())
    assert "Auth backoff active" in str(exc.value)


def test_auth_backoff_resets_after_success(monkeypatch: pytest.MonkeyPatch) -> None:
    def _start_time() -> float:
        return 100.0

    monkeypatch.setattr(
        "custom_components.unifi_network_map.coordinator.monotonic_seconds",
        _start_time,
    )
    coordinator = UniFiNetworkMapCoordinator(
        HomeAssistant(),
        _build_entry(),
        client=FakeClient(
            [
                InvalidAuth("Authentication failed"),
                UniFiNetworkMapData(svg="<svg />", payload={}),
            ]
        ),
    )

    with pytest.raises(UpdateFailed):
        asyncio.run(coordinator.async_fetch_for_testing())

    def _resume_time() -> float:
        return 100.0 + AUTH_BACKOFF_BASE_SECONDS + 1

    monkeypatch.setattr(
        "custom_components.unifi_network_map.coordinator.monotonic_seconds",
        _resume_time,
    )
    data = asyncio.run(coordinator.async_fetch_for_testing())

    assert data.svg == "<svg />"
    assert coordinator.auth_backoff_until is None
    assert coordinator.auth_backoff_seconds == AUTH_BACKOFF_BASE_SECONDS


def test_rate_limit_triggers_backoff(monkeypatch: pytest.MonkeyPatch) -> None:
    def _rate_limit_time() -> float:
        return 200.0

    monkeypatch.setattr(
        "custom_components.unifi_network_map.coordinator.monotonic_seconds",
        _rate_limit_time,
    )
    coordinator = UniFiNetworkMapCoordinator(
        HomeAssistant(),
        _build_entry(),
        client=FakeClient([CannotConnect("Rate limited by UniFi controller")]),
    )

    with pytest.raises(UpdateFailed):
        asyncio.run(coordinator.async_fetch_for_testing())

    assert coordinator.auth_backoff_until == pytest.approx(200.0 + AUTH_BACKOFF_BASE_SECONDS)
