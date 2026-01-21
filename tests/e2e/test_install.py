"""Tests for integration installation and loading."""

from __future__ import annotations

from typing import TYPE_CHECKING

import pytest

if TYPE_CHECKING:
    import httpx

pytestmark = pytest.mark.usefixtures("docker_services")


def test_integration_loads_without_errors(ha_client: httpx.Client) -> None:
    """Verify the integration loads without errors."""
    # Check that the integration domain is registered
    response = ha_client.get("/api/config/config_entries/flow_handlers")
    response.raise_for_status()

    handlers = response.json()
    assert "unifi_network_map" in handlers, "unifi_network_map not in available flow handlers"


def test_frontend_bundle_served(ha_client: httpx.Client, entry_id: str) -> None:
    """Verify frontend bundle is served at expected path.

    Note: The frontend bundle is only registered after a config entry is created,
    so this test requires the entry_id fixture.
    """
    response = ha_client.get("/unifi-network-map/unifi-network-map.js")

    assert response.status_code == 200, f"Frontend bundle not served: {response.status_code}"
    assert "text/javascript" in response.headers.get("content-type", ""), (
        "Wrong content type for JS bundle"
    )
    # Check for expected content markers
    content = response.text
    assert "customElements" in content or "LitElement" in content, (
        "Bundle doesn't appear to be a valid web component"
    )


def test_lovelace_resource_registered(ha_client: httpx.Client, entry_id: str) -> None:
    """Verify Lovelace resource is auto-registered.

    Note: The Lovelace resource is registered when a config entry is created,
    so this test requires the entry_id fixture.
    """
    response = ha_client.get("/api/lovelace/resources")

    # Note: This may return 404 if no resources configured yet
    if response.status_code == 404:
        pytest.skip("Lovelace resources not available (no dashboard configured)")

    response.raise_for_status()
    resources = response.json()

    # Look for our resource
    resource_urls = [r.get("url", "") for r in resources]
    matching = [url for url in resource_urls if "unifi-network-map" in url]

    assert matching, f"Lovelace resource not found. Available: {resource_urls}"


def test_api_returns_401_without_auth() -> None:
    """Verify API endpoints require authentication."""
    import os

    import httpx

    ha_url = os.environ.get("HA_URL", "http://localhost:28123")

    # Use a client without auth headers
    with httpx.Client(base_url=ha_url, timeout=10) as client:
        response = client.get("/api/config/config_entries/flow_handlers")
        assert response.status_code == 401, "API should require authentication"
