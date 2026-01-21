"""Tests for config flow UI using Playwright."""

from __future__ import annotations

import os
from typing import TYPE_CHECKING

import pytest

if TYPE_CHECKING:
    from playwright.sync_api import Page

HA_URL = os.environ.get("HA_URL", "http://localhost:28123")

pytestmark = pytest.mark.usefixtures("docker_services")


def test_integration_appears_in_add_dialog(authenticated_page: Page) -> None:
    """Test that the integration appears in the Add Integration dialog.

    This verifies the integration is properly registered and discoverable.
    The actual config flow is tested via API in test_http_endpoints.py.
    """
    page = authenticated_page

    # Navigate to Settings > Devices & Services
    page.goto(f"{HA_URL}/config/integrations")
    page.wait_for_load_state("networkidle")

    # Click "Add Integration" button (case insensitive)
    add_button = page.locator("text=/add integration/i").first
    add_button.wait_for(state="visible", timeout=30000)
    add_button.click()

    # Wait for the dialog to appear
    page.wait_for_timeout(3000)

    # Type to search - the search field is auto-focused in HA's dialog
    page.keyboard.type("unifi network")
    page.wait_for_timeout(2000)

    # Verify our integration appears in the search results
    integration_item = page.locator("text=UniFi Network Map").first
    integration_item.wait_for(state="visible", timeout=10000)

    # Test passed - integration is discoverable in the UI
    assert integration_item.is_visible(), "UniFi Network Map should appear in Add Integration dialog"


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
