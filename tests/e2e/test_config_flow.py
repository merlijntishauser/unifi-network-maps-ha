"""Tests for config flow UI using Playwright."""

from __future__ import annotations

import os
from typing import TYPE_CHECKING

import pytest

from conftest import SKIP_BROWSER_IN_CI

if TYPE_CHECKING:
    import httpx
    from playwright.sync_api import Page

HA_URL = os.environ.get("HA_URL", "http://localhost:28123")

pytestmark = pytest.mark.usefixtures("docker_services")


def test_integration_appears_in_add_dialog(
    ha_client: "httpx.Client",
) -> None:
    """Test that the integration is registered and available for config flows.

    This verifies the integration is properly registered via the API.
    The API check is more reliable than UI interaction which can be flaky in CI.
    """
    # Verify via API that integration is in flow handlers
    response = ha_client.get("/api/config/config_entries/flow_handlers")
    response.raise_for_status()
    handlers = response.json()
    assert "unifi_network_map" in handlers, (
        f"unifi_network_map not in flow handlers. Available: {handlers[:20]}"
    )

    # Verify we can initiate a config flow for the integration
    response = ha_client.post(
        "/api/config/config_entries/flow",
        json={"handler": "unifi_network_map"},
    )
    assert response.status_code == 200, (
        f"Failed to start config flow: {response.status_code} - {response.text}"
    )
    flow_data = response.json()
    assert "flow_id" in flow_data, f"No flow_id in response: {flow_data}"

    # Clean up - abort the flow
    ha_client.delete(f"/api/config/config_entries/flow/{flow_data['flow_id']}")


@SKIP_BROWSER_IN_CI  # type: ignore[misc]
def test_integration_entry_visible_on_integrations_page(
    authenticated_page: Page,
    entry_id: str,
) -> None:
    """Test that a configured integration entry appears on the integrations page."""
    page = authenticated_page

    # Navigate to the integration page
    page.goto(f"{HA_URL}/config/integrations")
    page.wait_for_load_state("networkidle")

    # Wait for integrations to load and find our integration
    page.wait_for_timeout(3000)

    # The integration card should be visible
    # Use case-insensitive regex for flexibility
    integration_card = page.locator("text=/unifi network map/i").first
    integration_card.wait_for(state="visible", timeout=30000)

    assert integration_card.is_visible(), "Integration entry should appear on integrations page"
