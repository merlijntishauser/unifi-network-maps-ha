"""Tests for the Lovelace card registration using Playwright."""

from __future__ import annotations

import os
from typing import TYPE_CHECKING

import pytest

if TYPE_CHECKING:
    from playwright.sync_api import Page

HA_URL = os.environ.get("HA_URL", "http://localhost:28123")

pytestmark = pytest.mark.usefixtures("docker_services")


def test_custom_card_element_registered(
    authenticated_page: Page,
    entry_id: str,
) -> None:
    """Test that the custom card element is registered in the browser.

    This verifies that the frontend bundle loaded correctly and registered
    the custom element with the browser.
    """
    page = authenticated_page

    # Navigate to Lovelace so custom resources are loaded
    page.goto(f"{HA_URL}/lovelace/e2e-test")
    page.wait_for_load_state("networkidle")

    # Wait for the custom element registration
    page.wait_for_function(
        "customElements.get('unifi-network-map') !== undefined",
        timeout=10000,
    )

    # Check if our custom element is registered
    is_registered = page.evaluate("""() => {
        return customElements.get('unifi-network-map') !== undefined;
    }""")

    assert is_registered, "unifi-network-map custom element should be registered"


def test_card_can_be_instantiated(
    authenticated_page: Page,
    entry_id: str,
) -> None:
    """Test that the custom card can be instantiated programmatically.

    This verifies the card class is properly defined and can be created.
    """
    page = authenticated_page

    # Navigate to Lovelace so custom resources are loaded
    page.goto(f"{HA_URL}/lovelace/e2e-test")
    page.wait_for_load_state("networkidle")

    # Wait for the custom element registration
    page.wait_for_function(
        "customElements.get('unifi-network-map') !== undefined",
        timeout=10000,
    )

    # Try to instantiate the custom element
    result = page.evaluate("""() => {
        try {
            const card = document.createElement('unifi-network-map');
            return {
                success: true,
                tagName: card.tagName.toLowerCase(),
                hasSetConfig: typeof card.setConfig === 'function'
            };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }""")

    assert result["success"], f"Failed to instantiate card: {result.get('error')}"
    assert result["tagName"] == "unifi-network-map"
    assert result["hasSetConfig"], "Card should have setConfig method"
