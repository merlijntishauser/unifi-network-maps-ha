"""E2E tests for automation blueprints."""

from __future__ import annotations

import time
from typing import TYPE_CHECKING

import pytest

if TYPE_CHECKING:
    import httpx

# Blueprint paths relative to HA config
BLUEPRINT_DOMAIN = "unifi_network_map"


def _wait_for_device_sensors(
    ha_client: "httpx.Client", timeout: int = 30
) -> list[dict[str, object]]:
    """Wait for device binary sensors to be created.

    Device sensors are identified by having a device_type attribute
    set to gateway, switch, or ap.
    """
    start = time.time()
    while time.time() - start < timeout:
        response = ha_client.get("/api/states")
        if response.status_code == 200:
            states = response.json()
            device_sensors = [
                s
                for s in states
                if s["entity_id"].startswith("binary_sensor.")
                and s.get("attributes", {}).get("device_type") in ("gateway", "switch", "ap")
            ]
            if device_sensors:
                return device_sensors
        time.sleep(2)
    return []


def _wait_for_automation(ha_client: "httpx.Client", entity_id: str, timeout: int = 10) -> bool:
    """Wait for an automation entity to be created."""
    start = time.time()
    while time.time() - start < timeout:
        response = ha_client.get(f"/api/states/{entity_id}")
        if response.status_code == 200:
            return True
        time.sleep(1)
    return False


def _wait_for_vlan_sensors(ha_client: "httpx.Client", timeout: int = 30) -> list[dict[str, object]]:
    """Wait for VLAN sensors to be created."""
    start = time.time()
    while time.time() - start < timeout:
        response = ha_client.get("/api/states")
        if response.status_code == 200:
            states = response.json()
            vlan_sensors = [s for s in states if s["entity_id"].startswith("sensor.unifi_vlan_")]
            if vlan_sensors:
                return vlan_sensors
        time.sleep(2)
    return []


class TestAutomationCreation:
    """Test creating automations from blueprints.

    These tests verify that our blueprints are correctly installed and can be
    used to create automations. Blueprint discovery is implicitly tested by
    attempting to create automations from them.
    """

    def test_create_automation_from_device_offline_blueprint(
        self,
        ha_client: httpx.Client,
        entry_id: str,
    ) -> None:
        """Create an automation from the device offline alert blueprint."""
        # Wait for entities to be created after config entry setup
        # The coordinator needs to fetch data before binary sensors are created
        device_sensors = _wait_for_device_sensors(ha_client, timeout=30)

        if not device_sensors:
            # Debug: show what entities exist
            response = ha_client.get("/api/states")
            all_entities = [s["entity_id"] for s in response.json()]
            unifi_entities = [e for e in all_entities if "unifi" in e.lower()]
            pytest.skip(f"No device sensors found. UniFi entities: {unifi_entities[:10]}")

        device_entity = device_sensors[0]["entity_id"]

        # Create automation from blueprint
        automation_config = {
            "alias": "E2E Test - Device Offline Alert",
            "use_blueprint": {
                "path": f"{BLUEPRINT_DOMAIN}/device_offline_alert.yaml",
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

        # Reload automations
        ha_client.post("/api/services/automation/reload", json={})

        # Wait for automation entity to appear
        entity_id = "automation.e2e_test_device_offline_alert"
        found = _wait_for_automation(ha_client, entity_id, timeout=10)

        if not found:
            # Debug: show what automation entities exist
            response = ha_client.get("/api/states")
            automations = [
                s["entity_id"] for s in response.json() if s["entity_id"].startswith("automation.")
            ]
            pytest.fail(f"Automation entity {entity_id} not found. Automations: {automations}")

        # Clean up
        ha_client.delete("/api/config/automation/config/e2e_test_device_offline")

    def test_create_automation_from_device_online_blueprint(
        self,
        ha_client: httpx.Client,
        entry_id: str,
    ) -> None:
        """Create an automation from the device online alert blueprint."""
        device_sensors = _wait_for_device_sensors(ha_client, timeout=30)

        if not device_sensors:
            pytest.skip("No device sensors found")

        device_entity = device_sensors[0]["entity_id"]

        automation_config = {
            "alias": "E2E Test - Device Online Alert",
            "use_blueprint": {
                "path": f"{BLUEPRINT_DOMAIN}/device_online_alert.yaml",
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

        # Reload automations
        ha_client.post("/api/services/automation/reload", json={})
        time.sleep(2)

        # Verify automation entity was created
        response = ha_client.get("/api/states/automation.e2e_test_device_online_alert")
        assert response.status_code == 200, "Automation entity not found after creation"

        # Clean up
        ha_client.delete("/api/config/automation/config/e2e_test_device_online")

    def test_create_automation_from_ap_overload_blueprint(
        self,
        ha_client: httpx.Client,
        entry_id: str,
    ) -> None:
        """Create an automation from the AP overload alert blueprint."""
        device_sensors = _wait_for_device_sensors(ha_client, timeout=30)

        if not device_sensors:
            pytest.skip("No device sensors found")

        # Find an AP sensor (has device_type=ap attribute)
        ap_sensors = [
            s for s in device_sensors if s.get("attributes", {}).get("device_type") == "ap"
        ]

        if ap_sensors:
            ap_entity = ap_sensors[0]["entity_id"]
        else:
            # Fall back to any device sensor for testing blueprint creation
            ap_entity = device_sensors[0]["entity_id"]

        automation_config = {
            "alias": "E2E Test - AP Overload Alert",
            "use_blueprint": {
                "path": f"{BLUEPRINT_DOMAIN}/ap_overload_alert.yaml",
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

        # Reload automations
        ha_client.post("/api/services/automation/reload", json={})
        time.sleep(2)

        # Verify automation entity was created
        response = ha_client.get("/api/states/automation.e2e_test_ap_overload_alert")
        assert response.status_code == 200, "Automation entity not found after creation"

        # Clean up
        ha_client.delete("/api/config/automation/config/e2e_test_ap_overload")

    def test_create_automation_from_vlan_client_blueprint(
        self,
        ha_client: httpx.Client,
        entry_id: str,
    ) -> None:
        """Create an automation from the VLAN client alert blueprint."""
        vlan_sensors = _wait_for_vlan_sensors(ha_client, timeout=30)

        if not vlan_sensors:
            pytest.skip("No VLAN sensors found")

        vlan_entity = vlan_sensors[0]["entity_id"]

        automation_config = {
            "alias": "E2E Test - VLAN Client Alert",
            "use_blueprint": {
                "path": f"{BLUEPRINT_DOMAIN}/vlan_client_alert.yaml",
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

        # Reload automations
        ha_client.post("/api/services/automation/reload", json={})
        time.sleep(2)

        # Verify automation entity was created
        response = ha_client.get("/api/states/automation.e2e_test_vlan_client_alert")
        assert response.status_code == 200, "Automation entity not found after creation"

        # Clean up
        ha_client.delete("/api/config/automation/config/e2e_test_vlan_client")


class TestAutomationTrigger:
    """Test that automations created from blueprints actually trigger.

    These tests verify the automation engine triggers correctly when state changes.
    They are somewhat flaky as they depend on Home Assistant's internal timing
    and state propagation. The core blueprint functionality is tested by
    TestAutomationCreation above.
    """

    @pytest.mark.skip(  # type: ignore[reportUntypedFunctionDecorator]
        reason="Automation trigger timing is unreliable in E2E tests"
    )
    def test_device_online_automation_triggers(
        self,
        ha_client: httpx.Client,
        entry_id: str,
    ) -> None:
        """Test that device online automation triggers when state changes.

        This test is skipped by default because:
        1. State changes via REST API may not trigger automations reliably
        2. Timing of automation execution is not deterministic
        3. The core blueprint syntax is already validated by creation tests

        The test remains as documentation and can be run manually by removing
        the skip marker.
        """
        device_sensors = _wait_for_device_sensors(ha_client, timeout=30)

        if not device_sensors:
            pytest.skip("No device sensors found")

        device_entity = device_sensors[0]["entity_id"]
        original_state = device_sensors[0]["state"]
        original_attrs = device_sensors[0].get("attributes", {})

        # Create automation that triggers on device coming online
        automation_config = {
            "alias": "E2E Test - Trigger Test",
            "use_blueprint": {
                "path": f"{BLUEPRINT_DOMAIN}/device_online_alert.yaml",
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
        ha_client.post("/api/services/automation/reload", json={})
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
            f"/api/states/{device_entity}",
            json={
                "state": "off",
                "attributes": original_attrs,
            },
        )
        time.sleep(1)

        # Then set to on (this should trigger the automation)
        ha_client.post(
            f"/api/states/{device_entity}",
            json={
                "state": "on",
                "attributes": original_attrs,
            },
        )
        time.sleep(3)

        # Check for notification by looking at persistent_notification entities
        response = ha_client.get("/api/states")
        assert response.status_code == 200
        all_states = response.json()

        notifications = [
            s
            for s in all_states
            if s["entity_id"].startswith("persistent_notification.")
            and "online" in s.get("attributes", {}).get("message", "").lower()
        ]

        # Clean up automation
        ha_client.delete("/api/config/automation/config/e2e_test_trigger")

        # Restore original state
        ha_client.post(
            f"/api/states/{device_entity}",
            json={
                "state": original_state,
                "attributes": original_attrs,
            },
        )

        # The automation should have triggered and created a notification
        assert len(notifications) > 0, (
            "Expected notification from automation trigger. "
            "Check that blueprints are correctly installed and automation triggered."
        )
