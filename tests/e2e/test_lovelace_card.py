"""Tests for the Lovelace card registration and interaction using Playwright."""

from __future__ import annotations

import os
from typing import TYPE_CHECKING

import pytest

from conftest import SKIP_BROWSER_IN_CI

if TYPE_CHECKING:
    from playwright.sync_api import Page

HA_URL = os.environ.get("HA_URL", "http://localhost:28123")

# All tests in this module use Playwright browser - skip in CI
pytestmark = [
    pytest.mark.usefixtures("docker_services"),
    SKIP_BROWSER_IN_CI,
]


def _create_test_card(page: Page, entry_id: str, auth_token: str) -> None:
    """Create a test card programmatically and wait for it to load."""
    page.evaluate(
        """([entryId, token, haUrl]) => {
        const card = document.createElement("unifi-network-map");
        card.id = "test-card";
        card.style.cssText = `
            width: 600px;
            height: 500px;
            display: block;
            position: fixed;
            top: 50px;
            left: 50px;
            z-index: 9999;
        `;
        document.body.appendChild(card);

        card.setConfig({
            svg_url: `/api/unifi_network_map/${entryId}/svg`,
            data_url: `/api/unifi_network_map/${entryId}/payload`,
            theme: "dark"
        });
        card.hass = {
            auth: { data: { access_token: token } }
        };
    }""",
        [entry_id, auth_token, HA_URL],
    )
    # Wait for SVG to load
    page.wait_for_selector("#test-card svg", timeout=10000)
    page.wait_for_timeout(1000)  # Extra time for payload to load


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


def test_node_click_selects_node(
    authenticated_page: Page,
    entry_id: str,
    ha_auth_token: str,
) -> None:
    """Test that clicking on a node selects it and updates the panel."""
    page = authenticated_page

    page.goto(f"{HA_URL}/lovelace/e2e-test")
    page.wait_for_load_state("networkidle")
    page.wait_for_function(
        "customElements.get('unifi-network-map') !== undefined",
        timeout=10000,
    )

    _create_test_card(page, entry_id, ha_auth_token)

    # Find a node and click on it
    node = page.locator('#test-card g[data-node-id="Office Switch"]')
    node.click()
    page.wait_for_timeout(500)

    # Verify selection
    result = page.evaluate("""() => {
        const card = document.getElementById("test-card");
        const selected = card.querySelectorAll('[data-selected="true"]');
        const panel = card.querySelector(".unifi-network-map__panel");
        return {
            selectedCount: selected.length,
            selectedId: selected[0]?.getAttribute("data-node-id"),
            panelContainsNodeName: panel?.innerHTML.includes("Office Switch")
        };
    }""")

    assert result["selectedCount"] == 1, "One node should be selected"
    assert result["selectedId"] == "Office Switch", "Office Switch should be selected"
    assert result["panelContainsNodeName"], "Panel should show selected node name"


def test_context_menu_opens_on_right_click(
    authenticated_page: Page,
    entry_id: str,
    ha_auth_token: str,
) -> None:
    """Test that right-clicking on a node opens the context menu."""
    page = authenticated_page

    page.goto(f"{HA_URL}/lovelace/e2e-test")
    page.wait_for_load_state("networkidle")
    page.wait_for_function(
        "customElements.get('unifi-network-map') !== undefined",
        timeout=10000,
    )

    _create_test_card(page, entry_id, ha_auth_token)

    # Right-click on a node
    node = page.locator('#test-card g[data-node-id="UDM Pro"]')
    node.click(button="right")
    page.wait_for_timeout(500)

    # Verify context menu appears
    result = page.evaluate("""() => {
        const menu = document.querySelector(".context-menu");
        return {
            menuExists: !!menu,
            menuVisible: menu ? getComputedStyle(menu).display !== "none" : false,
            menuNode: menu?.getAttribute("data-context-node"),
            hasSelectAction: !!menu?.querySelector('[data-context-action="select"]'),
            hasCopyMacAction: !!menu?.querySelector('[data-context-action="copy-mac"]')
        };
    }""")

    assert result["menuExists"], "Context menu should exist"
    assert result["menuVisible"], "Context menu should be visible"
    assert result["menuNode"] == "UDM Pro", "Context menu should be for UDM Pro"
    assert result["hasSelectAction"], "Context menu should have select action"
    assert result["hasCopyMacAction"], "Context menu should have copy MAC action"


def test_context_menu_select_action(
    authenticated_page: Page,
    entry_id: str,
    ha_auth_token: str,
) -> None:
    """Test that clicking Select in context menu selects the node."""
    page = authenticated_page

    page.goto(f"{HA_URL}/lovelace/e2e-test")
    page.wait_for_load_state("networkidle")
    page.wait_for_function(
        "customElements.get('unifi-network-map') !== undefined",
        timeout=10000,
    )

    _create_test_card(page, entry_id, ha_auth_token)

    # Right-click on a node to open context menu
    node = page.locator('#test-card g[data-node-id="Living Room AP"]')
    node.click(button="right")
    page.wait_for_timeout(500)

    # Click Select action using JavaScript (context menu overlays viewport)
    page.evaluate("""() => {
        const btn = document.querySelector('[data-context-action="select"]');
        if (btn) btn.click();
    }""")
    page.wait_for_timeout(1000)

    # Verify node is selected and context menu is closed
    result = page.evaluate("""() => {
        const card = document.getElementById("test-card");
        const selected = card.querySelectorAll('[data-selected="true"]');
        const menu = document.querySelector(".context-menu");
        return {
            selectedCount: selected.length,
            selectedId: selected[0]?.getAttribute("data-node-id"),
            menuClosed: !menu
        };
    }""")

    assert result["menuClosed"], "Context menu should be closed after action"
    assert result["selectedCount"] == 1, "One node should be selected"
    assert result["selectedId"] == "Living Room AP", "Living Room AP should be selected"
