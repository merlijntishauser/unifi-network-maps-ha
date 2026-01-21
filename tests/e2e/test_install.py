"""Tests for integration installation and loading."""

from __future__ import annotations

from typing import TYPE_CHECKING

import json
import os
import time
from pathlib import Path

import pytest

if TYPE_CHECKING:
    import httpx
    from playwright.sync_api import Page

E2E_DIR = Path(__file__).resolve().parent
HA_STORAGE_DIR = E2E_DIR / "ha-config" / ".storage"
HA_URL = os.environ.get("HA_URL", "http://localhost:28123")


def _read_lovelace_resources_from_storage(timeout: int = 10) -> list[dict[str, object]]:
    """Read Lovelace resources from storage, waiting for them to appear."""
    storage_path = HA_STORAGE_DIR / "lovelace_resources"
    start = time.time()
    while time.time() - start < timeout:
        if storage_path.exists():
            data = json.loads(storage_path.read_text())
            return data.get("data", {}).get("items", [])
        time.sleep(0.5)
    return []


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


def test_lovelace_resource_registered(
    ha_client: httpx.Client, entry_id: str, authenticated_page: Page
) -> None:
    """Verify Lovelace resource is auto-registered.

    Note: The Lovelace resource is registered when a config entry is created,
    so this test requires the entry_id fixture.
    """
    response = ha_client.get("/api/lovelace/resources")
    resources: list[dict[str, object]]
    if response.status_code == 404:
        # Force Lovelace frontend to initialize, then retry
        authenticated_page.goto(f"{HA_URL}/lovelace/e2e-test")
        authenticated_page.wait_for_load_state("networkidle")
        response = ha_client.get("/api/lovelace/resources")

    if response.status_code == 404:
        resources = _read_lovelace_resources_from_storage()
    else:
        response.raise_for_status()
        resources = response.json()

    # Look for our resource
    resource_urls: list[str] = []
    for resource in resources:
        url = resource.get("url")
        if isinstance(url, str):
            resource_urls.append(url)
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
