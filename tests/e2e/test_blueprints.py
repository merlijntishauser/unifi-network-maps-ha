"""E2E tests for automation blueprints."""

from __future__ import annotations

import time
from typing import TYPE_CHECKING

import pytest

if TYPE_CHECKING:
    import httpx

# Blueprint paths relative to HA config
BLUEPRINT_DOMAIN = "unifi_network_map"
BLUEPRINTS = [
    "device_offline_alert",
    "device_online_alert",
    "ap_overload_alert",
    "vlan_client_alert",
]


class TestBlueprintDiscovery:
    """Test that blueprints are discoverable by Home Assistant."""

    def test_blueprints_endpoint_accessible(
        self, ha_client: httpx.Client, docker_services: None
    ) -> None:
        """Verify the blueprints API endpoint is accessible."""
        response = ha_client.get("/api/config/automation/config/blueprints")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)

    def test_blueprints_are_discovered(
        self, ha_client: httpx.Client, docker_services: None
    ) -> None:
        """Verify our blueprints are discovered by Home Assistant."""
        response = ha_client.get("/api/config/automation/config/blueprints")
        assert response.status_code == 200
        blueprints = response.json()

        # Check each blueprint exists under our domain
        for blueprint_name in BLUEPRINTS:
            blueprint_path = f"{BLUEPRINT_DOMAIN}/{blueprint_name}"
            assert blueprint_path in blueprints, (
                f"Blueprint {blueprint_path} not found. Available: {list(blueprints.keys())}"
            )

    def test_blueprint_metadata(self, ha_client: httpx.Client, docker_services: None) -> None:
        """Verify blueprint metadata is correct."""
        response = ha_client.get("/api/config/automation/config/blueprints")
        assert response.status_code == 200
        blueprints = response.json()

        # Check device_offline_alert blueprint structure
        blueprint_path = f"{BLUEPRINT_DOMAIN}/device_offline_alert"
        if blueprint_path in blueprints:
            blueprint = blueprints[blueprint_path]
            metadata = blueprint.get("metadata", {})
            assert metadata.get("domain") == "automation"
            assert "name" in metadata
            assert "input" in metadata


class TestAutomationCreation:
    """Test creating automations from blueprints."""

    def test_create_automation_from_device_offline_blueprint(
        self,
        ha_client: httpx.Client,
        entry_id: str,
    ) -> None:
        """Create an automation from the device offline alert blueprint."""
        # Wait for entities to be created
        time.sleep(2)

        # Find a device binary sensor to use
        response = ha_client.get("/api/states")
        assert response.status_code == 200
        states = response.json()

        device_sensors = [
            s for s in states if s["entity_id"].startswith("binary_sensor.unifi_device_")
        ]

        if not device_sensors:
            pytest.skip("No device sensors found - integration may not have loaded")

        device_entity = device_sensors[0]["entity_id"]

        # Create automation from blueprint
        automation_config = {
            "alias": "E2E Test - Device Offline Alert",
            "use_blueprint": {
                "path": f"{BLUEPRINT_DOMAIN}/device_offline_alert",
                "input": {
                    "device_entity": device_entity,
                    "notify_service": "persistent_notification.create",
                    "offline_delay": 0,
                },
            },
        }

        response = ha_client.post(
            "/api/config/automation/config/e2e_test_device_offline",
            json=automation_config,
        )
        assert response.status_code == 200, f"Failed to create automation: {response.text}"

        # Verify automation was created
        response = ha_client.get("/api/config/automation/config/e2e_test_device_offline")
        assert response.status_code == 200

        # Clean up
        ha_client.delete("/api/config/automation/config/e2e_test_device_offline")

    def test_create_automation_from_device_online_blueprint(
        self,
        ha_client: httpx.Client,
        entry_id: str,
    ) -> None:
        """Create an automation from the device online alert blueprint."""
        time.sleep(2)

        response = ha_client.get("/api/states")
        assert response.status_code == 200
        states = response.json()

        device_sensors = [
            s for s in states if s["entity_id"].startswith("binary_sensor.unifi_device_")
        ]

        if not device_sensors:
            pytest.skip("No device sensors found")

        device_entity = device_sensors[0]["entity_id"]

        automation_config = {
            "alias": "E2E Test - Device Online Alert",
            "use_blueprint": {
                "path": f"{BLUEPRINT_DOMAIN}/device_online_alert",
                "input": {
                    "device_entity": device_entity,
                    "notify_service": "persistent_notification.create",
                },
            },
        }

        response = ha_client.post(
            "/api/config/automation/config/e2e_test_device_online",
            json=automation_config,
        )
        assert response.status_code == 200, f"Failed to create automation: {response.text}"

        # Clean up
        ha_client.delete("/api/config/automation/config/e2e_test_device_online")

    def test_create_automation_from_ap_overload_blueprint(
        self,
        ha_client: httpx.Client,
        entry_id: str,
    ) -> None:
        """Create an automation from the AP overload alert blueprint."""
        time.sleep(2)

        response = ha_client.get("/api/states")
        assert response.status_code == 200
        states = response.json()

        # Find an AP sensor (has clients_connected attribute)
        ap_sensors = [
            s
            for s in states
            if s["entity_id"].startswith("binary_sensor.unifi_device_")
            and s.get("attributes", {}).get("device_type") == "ap"
        ]

        if not ap_sensors:
            # Fall back to any device sensor for testing blueprint creation
            device_sensors = [
                s for s in states if s["entity_id"].startswith("binary_sensor.unifi_device_")
            ]
            if not device_sensors:
                pytest.skip("No device sensors found")
            ap_entity = device_sensors[0]["entity_id"]
        else:
            ap_entity = ap_sensors[0]["entity_id"]

        automation_config = {
            "alias": "E2E Test - AP Overload Alert",
            "use_blueprint": {
                "path": f"{BLUEPRINT_DOMAIN}/ap_overload_alert",
                "input": {
                    "ap_entity": ap_entity,
                    "max_clients": 30,
                    "notify_service": "persistent_notification.create",
                },
            },
        }

        response = ha_client.post(
            "/api/config/automation/config/e2e_test_ap_overload",
            json=automation_config,
        )
        assert response.status_code == 200, f"Failed to create automation: {response.text}"

        # Clean up
        ha_client.delete("/api/config/automation/config/e2e_test_ap_overload")

    def test_create_automation_from_vlan_client_blueprint(
        self,
        ha_client: httpx.Client,
        entry_id: str,
    ) -> None:
        """Create an automation from the VLAN client alert blueprint."""
        time.sleep(2)

        response = ha_client.get("/api/states")
        assert response.status_code == 200
        states = response.json()

        vlan_sensors = [s for s in states if s["entity_id"].startswith("sensor.unifi_vlan_")]

        if not vlan_sensors:
            pytest.skip("No VLAN sensors found")

        vlan_entity = vlan_sensors[0]["entity_id"]

        automation_config = {
            "alias": "E2E Test - VLAN Client Alert",
            "use_blueprint": {
                "path": f"{BLUEPRINT_DOMAIN}/vlan_client_alert",
                "input": {
                    "vlan_sensor": vlan_entity,
                    "max_clients": 50,
                    "notify_service": "persistent_notification.create",
                },
            },
        }

        response = ha_client.post(
            "/api/config/automation/config/e2e_test_vlan_client",
            json=automation_config,
        )
        assert response.status_code == 200, f"Failed to create automation: {response.text}"

        # Clean up
        ha_client.delete("/api/config/automation/config/e2e_test_vlan_client")


class TestAutomationTrigger:
    """Test that automations created from blueprints actually trigger."""

    def test_device_online_automation_triggers(
        self,
        ha_client: httpx.Client,
        entry_id: str,
    ) -> None:
        """Test that device online automation triggers when state changes."""
        time.sleep(2)

        # Find a device sensor
        response = ha_client.get("/api/states")
        assert response.status_code == 200
        states = response.json()

        device_sensors = [
            s for s in states if s["entity_id"].startswith("binary_sensor.unifi_device_")
        ]

        if not device_sensors:
            pytest.skip("No device sensors found")

        device_entity = device_sensors[0]["entity_id"]

        # Create automation that triggers on device coming online
        automation_config = {
            "alias": "E2E Test - Trigger Test",
            "use_blueprint": {
                "path": f"{BLUEPRINT_DOMAIN}/device_online_alert",
                "input": {
                    "device_entity": device_entity,
                    "notify_service": "persistent_notification.create",
                },
            },
        }

        response = ha_client.post(
            "/api/config/automation/config/e2e_test_trigger",
            json=automation_config,
        )
        assert response.status_code == 200

        # Reload automations to ensure it's active
        ha_client.post("/api/services/automation/reload")
        time.sleep(2)

        # Clear any existing notifications
        ha_client.post(
            "/api/services/persistent_notification/dismiss_all",
            json={},
        )
        time.sleep(1)

        # Simulate state change: off -> on
        # First set to off
        ha_client.post(
            "/api/states/" + device_entity,
            json={
                "state": "off",
                "attributes": device_sensors[0].get("attributes", {}),
            },
        )
        time.sleep(0.5)

        # Then set to on (this should trigger the automation)
        ha_client.post(
            "/api/states/" + device_entity,
            json={
                "state": "on",
                "attributes": device_sensors[0].get("attributes", {}),
            },
        )
        time.sleep(2)

        # Check for notification
        response = ha_client.get("/api/states")
        notifications = [
            s
            for s in response.json()
            if s["entity_id"].startswith("persistent_notification.")
            and "online" in s.get("attributes", {}).get("message", "").lower()
        ]

        # Clean up automation
        ha_client.delete("/api/config/automation/config/e2e_test_trigger")

        # Restore original state
        ha_client.post(
            "/api/states/" + device_entity,
            json={
                "state": device_sensors[0]["state"],
                "attributes": device_sensors[0].get("attributes", {}),
            },
        )

        # The automation should have triggered
        assert len(notifications) > 0, (
            "Expected notification from automation trigger. "
            "Check that blueprints are correctly installed."
        )
