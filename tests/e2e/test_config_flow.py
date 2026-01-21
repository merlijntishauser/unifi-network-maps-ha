"""Tests for config flow UI using Playwright."""

from __future__ import annotations

import os
from typing import TYPE_CHECKING

import pytest

if TYPE_CHECKING:
    import httpx
    from playwright.sync_api import Page

HA_URL = os.environ.get("HA_URL", "http://localhost:28123")

pytestmark = pytest.mark.usefixtures("docker_services")


def test_integration_appears_in_add_dialog(
    authenticated_page: Page,
    ha_client: "httpx.Client",
) -> None:
    """Test that the integration appears in the Add Integration dialog.

    This verifies the integration is properly registered and discoverable.
    The actual config flow is tested via API in test_http_endpoints.py.
    """
    # First verify via API that integration is loaded (faster, more reliable)
    response = ha_client.get("/api/config/config_entries/flow_handlers")
    response.raise_for_status()
    handlers = response.json()
    assert "unifi_network_map" in handlers, (
        f"unifi_network_map not in flow handlers. Available: {handlers[:20]}"
    )

    page = authenticated_page

    # Navigate to Settings > Devices & Services
    page.goto(f"{HA_URL}/config/integrations")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)  # Extra wait for JS to initialize

    # Click "Add Integration" button (case insensitive)
    add_button = page.locator("text=/add integration/i").first
    add_button.wait_for(state="visible", timeout=30000)
    add_button.click()

    # Wait for the dialog to fully appear
    page.wait_for_timeout(2000)

    # Use keyboard to type in the auto-focused search field
    page.keyboard.type("unifi network map", delay=50)
    page.wait_for_timeout(3000)  # Wait for search results

    # Search for the integration in the shadow DOM hierarchy
    # HA uses nested shadow DOMs, so we need to traverse them
    found = page.evaluate("""() => {
        function getDeepText(element) {
            let text = element.textContent || '';
            if (element.shadowRoot) {
                text += getDeepText(element.shadowRoot);
            }
            element.querySelectorAll('*').forEach(child => {
                if (child.shadowRoot) {
                    text += getDeepText(child.shadowRoot);
                }
            });
            return text;
        }

        const ha = document.querySelector('home-assistant');
        if (!ha) return false;

        const deepText = getDeepText(ha).toLowerCase();
        return deepText.includes('unifi network map');
    }""")

    assert found, "UniFi Network Map should appear in Add Integration dialog search results"


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
