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
    # Wait for SVG to load and nodes to be annotated
    page.wait_for_selector("#test-card svg", timeout=10000)
    page.wait_for_selector("#test-card [data-node-id]", timeout=10000)
    page.wait_for_timeout(500)  # Extra time for full initialization


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
    # Wait for SVG to load and nodes to be annotated
    page.wait_for_selector("#test-card svg", timeout=10000)
    page.wait_for_selector("#test-card [data-node-id]", timeout=10000)
    page.wait_for_timeout(500)  # Extra time for full initialization


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
        const card = document.getElementById("test-card");
        const payload = card?._payload;
        const hasIp = !!payload?.related_entities?.["UDM Pro"]?.some((entity) => entity.ip);
        return {
            menuExists: !!menu,
            menuVisible: menu ? getComputedStyle(menu).display !== "none" : false,
            menuNode: menu?.getAttribute("data-context-node"),
            hasCopyMacAction: !!menu?.querySelector('[data-context-action="copy-mac"]'),
            hasCopyIpAction: !!menu?.querySelector('[data-context-action="copy-ip"]'),
            expectsCopyIp: hasIp
        };
    }""")

    assert result["menuExists"], "Context menu should exist"
    assert result["menuVisible"], "Context menu should be visible"
    assert result["menuNode"] == "UDM Pro", "Context menu should be for UDM Pro"
    assert result["hasCopyMacAction"], "Context menu should have copy MAC action"
    if result["expectsCopyIp"]:
        assert result["hasCopyIpAction"], "Context menu should have copy IP action"


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


def test_filter_bar_renders_with_device_counts(
    authenticated_page: Page,
    entry_id: str,
    ha_auth_token: str,
) -> None:
    """Test that the filter bar renders with correct device type counts."""
    page = authenticated_page

    page.goto(f"{HA_URL}/lovelace/e2e-test")
    page.wait_for_load_state("networkidle")
    page.wait_for_function(
        "customElements.get('unifi-network-map') !== undefined",
        timeout=10000,
    )

    _create_test_card(page, entry_id, ha_auth_token)

    # Wait for filter bar to appear
    page.wait_for_selector("#test-card .filter-bar", timeout=10000)

    # Verify filter bar structure and counts
    result = page.evaluate("""() => {
        const card = document.getElementById("test-card");
        const filterBar = card.querySelector(".filter-bar");
        const buttons = filterBar?.querySelectorAll(".filter-button") || [];

        const counts = {};
        for (const btn of buttons) {
            const type = btn.getAttribute("data-filter-type");
            const countEl = btn.querySelector(".filter-button__count");
            counts[type] = parseInt(countEl?.textContent || "0", 10);
        }

        return {
            filterBarExists: !!filterBar,
            buttonCount: buttons.length,
            counts: counts,
            allActive: Array.from(buttons).every(b => b.classList.contains("filter-button--active"))
        };
    }""")

    assert result["filterBarExists"], "Filter bar should exist"
    assert result["buttonCount"] == 5, (
        "Should have 5 filter buttons (gateway, switch, ap, client, other)"
    )
    assert result["counts"].get("gateway") == 1, "Should have 1 gateway"
    assert result["counts"].get("switch") == 1, "Should have 1 switch"
    assert result["counts"].get("ap") == 1, "Should have 1 AP"
    assert result["counts"].get("client") == 3, "Should have 3 clients"
    assert result["allActive"], "All filters should be active by default"


def test_filter_button_toggles_node_visibility(
    authenticated_page: Page,
    entry_id: str,
    ha_auth_token: str,
) -> None:
    """Test that clicking a filter button hides/shows nodes of that type."""
    page = authenticated_page

    page.goto(f"{HA_URL}/lovelace/e2e-test")
    page.wait_for_load_state("networkidle")
    page.wait_for_function(
        "customElements.get('unifi-network-map') !== undefined",
        timeout=10000,
    )

    _create_test_card(page, entry_id, ha_auth_token)
    page.wait_for_selector("#test-card .filter-bar", timeout=10000)

    # Initially all clients should be visible
    initial_result = page.evaluate("""() => {
        const card = document.getElementById("test-card");
        const clientNodes = card.querySelectorAll('[data-node-id="MacBook Pro"], [data-node-id="Desktop PC"], [data-node-id="iPhone"]');
        return {
            clientCount: clientNodes.length,
            allVisible: Array.from(clientNodes).every(n => !n.classList.contains("node--filtered"))
        };
    }""")

    assert initial_result["clientCount"] == 3, "Should find 3 client nodes"
    assert initial_result["allVisible"], "All client nodes should be visible initially"

    # Click the client filter button to hide clients
    client_filter = page.locator('#test-card .filter-button[data-filter-type="client"]')
    client_filter.click()
    page.wait_for_timeout(300)

    # Verify clients are now hidden
    after_hide = page.evaluate("""() => {
        const card = document.getElementById("test-card");
        const clientNodes = card.querySelectorAll('[data-node-id="MacBook Pro"], [data-node-id="Desktop PC"], [data-node-id="iPhone"]');
        const filterBtn = card.querySelector('.filter-button[data-filter-type="client"]');
        return {
            allHidden: Array.from(clientNodes).every(n => n.classList.contains("node--filtered")),
            buttonInactive: filterBtn?.classList.contains("filter-button--inactive")
        };
    }""")

    assert after_hide["allHidden"], "All client nodes should be hidden after clicking filter"
    assert after_hide["buttonInactive"], "Client filter button should be inactive"

    # Click again to show clients
    client_filter.click()
    page.wait_for_timeout(300)

    after_show = page.evaluate("""() => {
        const card = document.getElementById("test-card");
        const clientNodes = card.querySelectorAll('[data-node-id="MacBook Pro"], [data-node-id="Desktop PC"], [data-node-id="iPhone"]');
        const filterBtn = card.querySelector('.filter-button[data-filter-type="client"]');
        return {
            allVisible: Array.from(clientNodes).every(n => !n.classList.contains("node--filtered")),
            buttonActive: filterBtn?.classList.contains("filter-button--active")
        };
    }""")

    assert after_show["allVisible"], "All client nodes should be visible after toggling filter back"
    assert after_show["buttonActive"], "Client filter button should be active again"


def test_filter_hides_edges_when_endpoint_filtered(
    authenticated_page: Page,
    entry_id: str,
    ha_auth_token: str,
) -> None:
    """Test that edges are hidden when either endpoint node is filtered."""
    page = authenticated_page

    page.goto(f"{HA_URL}/lovelace/e2e-test")
    page.wait_for_load_state("networkidle")
    page.wait_for_function(
        "customElements.get('unifi-network-map') !== undefined",
        timeout=10000,
    )

    _create_test_card(page, entry_id, ha_auth_token)
    page.wait_for_selector("#test-card .filter-bar", timeout=10000)

    # Count edges initially visible
    initial_edges = page.evaluate("""() => {
        const card = document.getElementById("test-card");
        const edges = card.querySelectorAll("path[data-edge]");
        return {
            total: edges.length,
            visible: Array.from(edges).filter(e => !e.classList.contains("edge--filtered")).length
        };
    }""")

    assert initial_edges["total"] > 0, "Should have edges in the map"
    assert initial_edges["visible"] == initial_edges["total"], (
        "All edges should be visible initially"
    )

    # Hide AP nodes - this should hide edges to the AP
    ap_filter = page.locator('#test-card .filter-button[data-filter-type="ap"]')
    ap_filter.click()
    page.wait_for_timeout(300)

    after_ap_filter = page.evaluate("""() => {
        const card = document.getElementById("test-card");
        const edges = card.querySelectorAll("path[data-edge]");
        const hiddenEdges = Array.from(edges).filter(e => e.classList.contains("edge--filtered"));
        return {
            total: edges.length,
            hidden: hiddenEdges.length,
            hiddenEdgeIds: hiddenEdges.map(e => e.getAttribute("data-edge"))
        };
    }""")

    assert after_ap_filter["hidden"] > 0, "Some edges should be hidden when AP is filtered"

    # Re-enable AP filter
    ap_filter.click()
    page.wait_for_timeout(300)

    after_restore = page.evaluate("""() => {
        const card = document.getElementById("test-card");
        const edges = card.querySelectorAll("path[data-edge]");
        return {
            visible: Array.from(edges).filter(e => !e.classList.contains("edge--filtered")).length,
            total: edges.length
        };
    }""")

    assert after_restore["visible"] == after_restore["total"], (
        "All edges should be visible after restoring filter"
    )


def test_filter_state_persists_across_selection(
    authenticated_page: Page,
    entry_id: str,
    ha_auth_token: str,
) -> None:
    """Test that filter state persists when selecting nodes."""
    page = authenticated_page

    page.goto(f"{HA_URL}/lovelace/e2e-test")
    page.wait_for_load_state("networkidle")
    page.wait_for_function(
        "customElements.get('unifi-network-map') !== undefined",
        timeout=10000,
    )

    _create_test_card(page, entry_id, ha_auth_token)
    page.wait_for_selector("#test-card .filter-bar", timeout=10000)

    # Hide clients
    client_filter = page.locator('#test-card .filter-button[data-filter-type="client"]')
    client_filter.click()
    page.wait_for_timeout(300)

    # Select a visible node (switch)
    node = _node_locator(page, "Office Switch")
    node.click()
    page.wait_for_timeout(500)

    # Verify filter state is preserved after selection
    result = page.evaluate("""() => {
        const card = document.getElementById("test-card");
        const clientNodes = card.querySelectorAll('[data-node-id="MacBook Pro"], [data-node-id="Desktop PC"], [data-node-id="iPhone"]');
        const filterBtn = card.querySelector('.filter-button[data-filter-type="client"]');
        const selectedNode = card.querySelector('[data-selected="true"]');
        return {
            clientsStillHidden: Array.from(clientNodes).every(n => n.classList.contains("node--filtered")),
            filterStillInactive: filterBtn?.classList.contains("filter-button--inactive"),
            hasSelection: !!selectedNode,
            selectedNodeId: selectedNode?.getAttribute("data-node-id")
        };
    }""")

    assert result["clientsStillHidden"], "Clients should remain hidden after selecting another node"
    assert result["filterStillInactive"], "Filter button should remain inactive"
    assert result["hasSelection"], "Should have a selected node"
    assert result["selectedNodeId"] == "Office Switch", "Office Switch should be selected"
