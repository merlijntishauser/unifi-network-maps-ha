"""Tests for the Lovelace card registration and interaction using Playwright."""

from __future__ import annotations

import os
from typing import TYPE_CHECKING

import pytest

from conftest import SKIP_BROWSER_IN_CI

if TYPE_CHECKING:
    from playwright.sync_api import Locator, Page

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


def _create_test_card_in_ha_card(page: Page, entry_id: str, auth_token: str) -> None:
    """Create test card wrapped in ha-card to simulate real HA DOM structure.

    In production, cards are slotted inside ha-card's shadow DOM:
    hui-card > ha-card (shadow: slot) > unifi-network-map

    This nesting can cause pointer events to not properly propagate through
    the shadow DOM boundary, which is why we need to test in this structure.
    """
    page.evaluate(
        """([entryId, token]) => {
        // Create ha-card wrapper (simulates HA's card container)
        const haCard = document.createElement("ha-card");
        haCard.id = "test-ha-card";
        haCard.style.cssText = `
            width: 600px;
            height: 500px;
            display: block;
            position: fixed;
            top: 50px;
            left: 50px;
            z-index: 9999;
        `;

        // Create our custom card
        const card = document.createElement("unifi-network-map");
        card.id = "test-card";
        card.style.cssText = `
            width: 100%;
            height: 100%;
            display: block;
        `;

        // Slot the card into ha-card (this is how HA does it)
        haCard.appendChild(card);
        document.body.appendChild(haCard);

        card.setConfig({
            svg_url: `/api/unifi_network_map/${entryId}/svg`,
            data_url: `/api/unifi_network_map/${entryId}/payload`,
            theme: "dark"
        });
        card.hass = {
            auth: { data: { access_token: token } }
        };
    }""",
        [entry_id, auth_token],
    )
    # Wait for SVG to load
    page.wait_for_selector("#test-card svg", timeout=10000)
    page.wait_for_timeout(1000)  # Extra time for payload to load


def _node_locator(page: Page, node_name: str) -> "Locator":
    selector = f'#test-card [data-node-id="{node_name}"]'
    page.wait_for_selector(selector, timeout=10000)
    return page.locator(selector)


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
    node = _node_locator(page, "Office Switch")
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


def test_node_click_selects_node_with_small_drag(
    authenticated_page: Page,
    entry_id: str,
    ha_auth_token: str,
) -> None:
    """Test that a small pointer jitter does not prevent selection."""
    page = authenticated_page

    page.goto(f"{HA_URL}/lovelace/e2e-test")
    page.wait_for_load_state("networkidle")
    page.wait_for_function(
        "customElements.get('unifi-network-map') !== undefined",
        timeout=10000,
    )

    _create_test_card(page, entry_id, ha_auth_token)

    node = _node_locator(page, "Office Switch")
    box = node.bounding_box()
    assert box is not None, "Node bounding box not found"
    cx = box["x"] + box["width"] / 2
    cy = box["y"] + box["height"] / 2

    page.mouse.move(cx, cy)
    page.mouse.down()
    page.mouse.move(cx + 4, cy + 4)
    page.mouse.up()
    page.wait_for_timeout(500)

    result = page.evaluate("""() => {
        const card = document.getElementById("test-card");
        const selected = card.querySelectorAll('[data-selected="true"]');
        return {
            selectedCount: selected.length,
            selectedId: selected[0]?.getAttribute("data-node-id")
        };
    }""")

    assert result["selectedCount"] == 1, "Node should be selected after small drag"
    assert result["selectedId"] == "Office Switch", "Office Switch should be selected"


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
    node = _node_locator(page, "UDM Pro")
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


def test_context_menu_opens_with_small_drag(
    authenticated_page: Page,
    entry_id: str,
    ha_auth_token: str,
) -> None:
    """Test that a small pointer jitter does not block context menu."""
    page = authenticated_page

    page.goto(f"{HA_URL}/lovelace/e2e-test")
    page.wait_for_load_state("networkidle")
    page.wait_for_function(
        "customElements.get('unifi-network-map') !== undefined",
        timeout=10000,
    )

    _create_test_card(page, entry_id, ha_auth_token)

    node = _node_locator(page, "UDM Pro")
    box = node.bounding_box()
    assert box is not None, "Node bounding box not found"
    cx = box["x"] + box["width"] / 2
    cy = box["y"] + box["height"] / 2

    page.mouse.move(cx, cy)
    page.mouse.down(button="right")
    page.mouse.move(cx + 4, cy + 4)
    page.mouse.up(button="right")
    page.wait_for_timeout(500)

    result = page.evaluate("""() => {
        const menu = document.querySelector(".context-menu");
        return {
            menuExists: !!menu,
            menuVisible: menu ? getComputedStyle(menu).display !== "none" : false,
            menuNode: menu?.getAttribute("data-context-node")
        };
    }""")

    assert result["menuExists"], "Context menu should exist"
    assert result["menuVisible"], "Context menu should be visible"
    assert result["menuNode"] == "UDM Pro", "Context menu should be for UDM Pro"


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
    node = _node_locator(page, "Living Room AP")
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


def test_node_click_works_inside_ha_card(
    authenticated_page: Page,
    entry_id: str,
    ha_auth_token: str,
) -> None:
    """Test that clicking on a node works when card is slotted inside ha-card.

    This test catches shadow DOM pointer event issues that don't manifest when
    the card is directly attached to document.body. In production, cards are
    inside ha-card which uses shadow DOM with slots, which can break event
    propagation if not handled correctly.
    """
    page = authenticated_page

    page.goto(f"{HA_URL}/lovelace/e2e-test")
    page.wait_for_load_state("networkidle")
    page.wait_for_function(
        "customElements.get('unifi-network-map') !== undefined",
        timeout=10000,
    )

    _create_test_card_in_ha_card(page, entry_id, ha_auth_token)

    # Find a node and click on it
    node = _node_locator(page, "Office Switch")
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

    assert result["selectedCount"] == 1, "One node should be selected inside ha-card"
    assert result["selectedId"] == "Office Switch", "Office Switch should be selected"
    assert result["panelContainsNodeName"], "Panel should show selected node name"


def test_context_menu_works_inside_ha_card(
    authenticated_page: Page,
    entry_id: str,
    ha_auth_token: str,
) -> None:
    """Test that right-click context menu works when card is inside ha-card.

    This test ensures context menu works through the shadow DOM boundary.
    """
    page = authenticated_page

    page.goto(f"{HA_URL}/lovelace/e2e-test")
    page.wait_for_load_state("networkidle")
    page.wait_for_function(
        "customElements.get('unifi-network-map') !== undefined",
        timeout=10000,
    )

    _create_test_card_in_ha_card(page, entry_id, ha_auth_token)

    # Right-click on a node
    node = _node_locator(page, "UDM Pro")
    node.click(button="right")
    page.wait_for_timeout(500)

    # Verify context menu appears
    result = page.evaluate("""() => {
        const menu = document.querySelector(".context-menu");
        return {
            menuExists: !!menu,
            menuVisible: menu ? getComputedStyle(menu).display !== "none" : false,
            menuNode: menu?.getAttribute("data-context-node")
        };
    }""")

    assert result["menuExists"], "Context menu should exist inside ha-card"
    assert result["menuVisible"], "Context menu should be visible inside ha-card"
    assert result["menuNode"] == "UDM Pro", "Context menu should be for UDM Pro"
