from __future__ import annotations

from unittest.mock import patch

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import UpdateFailed
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.unifi_network_map.const import DOMAIN
from custom_components.unifi_network_map.coordinator import (
    AUTH_BACKOFF_BASE_SECONDS,
    UniFiNetworkMapCoordinator,
    _should_backoff,
    _validate_required_keys,
)
from custom_components.unifi_network_map.data import UniFiNetworkMapData
from custom_components.unifi_network_map.errors import (
    CannotConnect,
    InvalidAuth,
    UniFiNetworkMapError,
)
from custom_components.unifi_network_map.renderer import RenderSettings


class FakeClient:
    def __init__(
        self, responses: list[UniFiNetworkMapData | Exception]
    ) -> None:
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


def _build_entry() -> MockConfigEntry:
    return MockConfigEntry(
        domain=DOMAIN,
        data={
            "url": "https://controller.local",
            "username": "user",
            "password": "pass",
            "site": "default",
        },
        options={},
    )


async def test_auth_backoff_blocks_immediate_retry(
    hass: HomeAssistant,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        "custom_components.unifi_network_map.coordinator.monotonic_seconds",
        lambda: 100.0,
    )
    entry = _build_entry()
    coordinator = UniFiNetworkMapCoordinator(
        hass,
        entry,
        client=FakeClient([InvalidAuth("Authentication failed")]),
    )

    with (
        patch.object(entry, "async_start_reauth"),
        pytest.raises(UpdateFailed),
    ):
        await coordinator.async_fetch_for_testing()

    assert coordinator.auth_backoff_until == pytest.approx(
        100.0 + AUTH_BACKOFF_BASE_SECONDS
    )
    assert coordinator.auth_backoff_seconds == AUTH_BACKOFF_BASE_SECONDS * 2

    with pytest.raises(UpdateFailed) as exc:
        await coordinator.async_fetch_for_testing()
    assert "Auth backoff active" in str(exc.value)


async def test_auth_backoff_resets_after_success(
    hass: HomeAssistant,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        "custom_components.unifi_network_map.coordinator.monotonic_seconds",
        lambda: 100.0,
    )
    entry = _build_entry()
    coordinator = UniFiNetworkMapCoordinator(
        hass,
        entry,
        client=FakeClient(
            [
                InvalidAuth("Authentication failed"),
                UniFiNetworkMapData(svg="<svg />", payload={}),
            ]
        ),
    )

    with (
        patch.object(entry, "async_start_reauth"),
        pytest.raises(UpdateFailed),
    ):
        await coordinator.async_fetch_for_testing()

    monkeypatch.setattr(
        "custom_components.unifi_network_map.coordinator.monotonic_seconds",
        lambda: 100.0 + AUTH_BACKOFF_BASE_SECONDS + 1,
    )
    data = await coordinator.async_fetch_for_testing()

    assert data.svg == "<svg />"
    assert coordinator.auth_backoff_until is None
    assert coordinator.auth_backoff_seconds == AUTH_BACKOFF_BASE_SECONDS


async def test_invalid_auth_triggers_reauth(
    hass: HomeAssistant,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        "custom_components.unifi_network_map.coordinator.monotonic_seconds",
        lambda: 100.0,
    )
    entry = _build_entry()
    coordinator = UniFiNetworkMapCoordinator(
        hass,
        entry,
        client=FakeClient([InvalidAuth("Authentication failed")]),
    )

    with (
        patch.object(entry, "async_start_reauth") as mock_reauth,
        pytest.raises(UpdateFailed),
    ):
        await coordinator.async_fetch_for_testing()

    mock_reauth.assert_called_once()


async def test_connect_error_does_not_trigger_reauth(
    hass: HomeAssistant,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        "custom_components.unifi_network_map.coordinator.monotonic_seconds",
        lambda: 100.0,
    )
    entry = _build_entry()
    coordinator = UniFiNetworkMapCoordinator(
        hass,
        entry,
        client=FakeClient([CannotConnect("connection refused")]),
    )

    with (
        patch.object(entry, "async_start_reauth") as mock_reauth,
        pytest.raises(UpdateFailed),
    ):
        await coordinator.async_fetch_for_testing()

    mock_reauth.assert_not_called()


async def test_rate_limit_triggers_backoff(
    hass: HomeAssistant,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        "custom_components.unifi_network_map.coordinator.monotonic_seconds",
        lambda: 200.0,
    )
    coordinator = UniFiNetworkMapCoordinator(
        hass,
        _build_entry(),
        client=FakeClient([CannotConnect("Rate limited by UniFi controller")]),
    )

    with pytest.raises(UpdateFailed):
        await coordinator.async_fetch_for_testing()

    assert coordinator.auth_backoff_until == pytest.approx(
        200.0 + AUTH_BACKOFF_BASE_SECONDS
    )


def test_should_backoff_returns_false_for_generic_error() -> None:
    err = UniFiNetworkMapError("generic")
    assert _should_backoff(err) is False


def test_should_backoff_returns_false_for_non_rate_limited_connect_error() -> (
    None
):
    err = CannotConnect("timeout")
    assert _should_backoff(err) is False


def test_validate_required_keys_raises_for_missing_keys() -> None:
    with pytest.raises(UniFiNetworkMapError, match="Missing required"):
        _validate_required_keys({})


async def test_update_settings_rebuilds_client(
    hass: HomeAssistant,
) -> None:
    entry = _build_entry()
    coordinator = UniFiNetworkMapCoordinator(hass, entry)

    coordinator.update_settings()

    assert isinstance(coordinator.settings, RenderSettings)
    await coordinator.async_shutdown()
