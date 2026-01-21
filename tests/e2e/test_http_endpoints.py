"""Tests for HTTP API endpoints."""

from __future__ import annotations

import json
from typing import TYPE_CHECKING

import pytest

if TYPE_CHECKING:
    import httpx

pytestmark = pytest.mark.usefixtures("docker_services")


class TestSvgEndpoint:
    """Tests for the SVG endpoint."""

    def test_svg_endpoint_returns_svg(
        self,
        ha_client: httpx.Client,
        entry_id: str,
    ) -> None:
        """Verify SVG endpoint returns valid SVG content."""
        response = ha_client.get(f"/api/unifi_network_map/{entry_id}/svg")

        assert response.status_code == 200
        assert "image/svg+xml" in response.headers.get("content-type", "")

        content = response.text
        assert content.startswith("<?xml") or content.startswith("<svg"), (
            "Response doesn't appear to be SVG"
        )
        assert "</svg>" in content, "SVG not properly closed"

    def test_svg_endpoint_contains_network_elements(
        self,
        ha_client: httpx.Client,
        entry_id: str,
    ) -> None:
        """Verify SVG contains expected network topology elements."""
        response = ha_client.get(f"/api/unifi_network_map/{entry_id}/svg")
        response.raise_for_status()

        content = response.text

        # Should contain device nodes from our mock topology
        # At minimum, check for SVG group elements that would contain nodes
        assert "<g" in content, "SVG should contain group elements"

    def test_svg_endpoint_requires_auth(self, entry_id: str) -> None:
        """Verify SVG endpoint requires authentication."""
        import os

        import httpx

        ha_url = os.environ.get("HA_URL", "http://localhost:28123")

        with httpx.Client(base_url=ha_url, timeout=10) as client:
            response = client.get(f"/api/unifi_network_map/{entry_id}/svg")
            assert response.status_code == 401

    def test_svg_endpoint_invalid_entry_returns_404(
        self,
        ha_client: httpx.Client,
    ) -> None:
        """Verify invalid entry ID returns 404."""
        response = ha_client.get("/api/unifi_network_map/invalid_entry_id/svg")
        assert response.status_code == 404


class TestPayloadEndpoint:
    """Tests for the payload endpoint."""

    def test_payload_endpoint_returns_json(
        self,
        ha_client: httpx.Client,
        entry_id: str,
    ) -> None:
        """Verify payload endpoint returns valid JSON."""
        response = ha_client.get(f"/api/unifi_network_map/{entry_id}/payload")

        assert response.status_code == 200
        assert "application/json" in response.headers.get("content-type", "")

        # Should be valid JSON
        data = response.json()
        assert isinstance(data, dict)

    def test_payload_contains_devices(
        self,
        ha_client: httpx.Client,
        entry_id: str,
    ) -> None:
        """Verify payload contains device information."""
        response = ha_client.get(f"/api/unifi_network_map/{entry_id}/payload")
        response.raise_for_status()

        data = response.json()

        # Check for expected structure based on the integration
        # The payload should contain topology information
        assert "devices" in data or "nodes" in data or len(data) > 0, (
            f"Payload appears empty or missing expected keys: {list(data.keys())}"
        )

    def test_payload_contains_mock_devices(
        self,
        ha_client: httpx.Client,
        entry_id: str,
    ) -> None:
        """Verify payload contains devices from mock UniFi server."""
        response = ha_client.get(f"/api/unifi_network_map/{entry_id}/payload")
        response.raise_for_status()

        data = response.json()
        payload_str = json.dumps(data)

        # Our mock topology has these devices
        expected_names = ["UDM Pro", "Office Switch", "Living Room AP"]

        found = [name for name in expected_names if name in payload_str]
        assert len(found) > 0, (
            f"Expected to find some of {expected_names} in payload. "
            f"Payload keys: {list(data.keys())}"
        )

    def test_payload_endpoint_requires_auth(self, entry_id: str) -> None:
        """Verify payload endpoint requires authentication."""
        import os

        import httpx

        ha_url = os.environ.get("HA_URL", "http://localhost:28123")

        with httpx.Client(base_url=ha_url, timeout=10) as client:
            response = client.get(f"/api/unifi_network_map/{entry_id}/payload")
            assert response.status_code == 401

    def test_payload_endpoint_invalid_entry_returns_404(
        self,
        ha_client: httpx.Client,
    ) -> None:
        """Verify invalid entry ID returns 404."""
        response = ha_client.get("/api/unifi_network_map/invalid_entry_id/payload")
        assert response.status_code == 404


class TestConfigEntryManagement:
    """Tests for config entry API operations."""

    def test_can_list_config_entries(
        self,
        ha_client: httpx.Client,
        entry_id: str,
    ) -> None:
        """Verify config entries can be listed."""
        response = ha_client.get("/api/config/config_entries/entry")
        response.raise_for_status()

        entries = response.json()
        our_entries = [e for e in entries if e.get("domain") == "unifi_network_map"]

        assert len(our_entries) > 0
        assert any(e["entry_id"] == entry_id for e in our_entries)

    def test_can_get_entry_diagnostics(
        self,
        ha_client: httpx.Client,
        entry_id: str,
    ) -> None:
        """Verify diagnostics endpoint works."""
        response = ha_client.get(
            f"/api/diagnostics/config_entry/{entry_id}",
        )

        # Diagnostics might not be available in all setups
        if response.status_code == 404:
            pytest.skip("Diagnostics not available")

        response.raise_for_status()
        data = response.json()
        assert "config_entry" in data or "data" in data
