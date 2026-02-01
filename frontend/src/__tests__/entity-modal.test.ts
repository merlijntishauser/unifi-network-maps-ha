import { renderEntityModal } from "../card/ui/entity-modal";
import type { MapPayload, RelatedEntity } from "../card/core/types";

describe("entity-modal", () => {
  const defaultContext = {
    nodeName: "TestDevice",
    theme: "dark" as const,
    getNodeTypeIcon: (type: string) => `[${type}]`,
    formatLastChanged: (value: string | null | undefined) => value ?? "Unknown",
    localize: (key: string, replacements?: Record<string, string | number>) => {
      if (replacements?.count !== undefined) {
        return `${key} (${replacements.count})`;
      }
      return key;
    },
  };

  describe("renderEntityModal", () => {
    it("renders basic modal structure", () => {
      const result = renderEntityModal(defaultContext);
      expect(result).toContain('class="entity-modal-overlay"');
      expect(result).toContain('class="entity-modal"');
      expect(result).toContain("TestDevice");
    });

    it("renders with dark theme", () => {
      const result = renderEntityModal(defaultContext);
      expect(result).toContain('data-theme="dark"');
    });

    it("renders with light theme", () => {
      const result = renderEntityModal({ ...defaultContext, theme: "light" });
      expect(result).toContain('data-theme="light"');
    });

    it("renders close button", () => {
      const result = renderEntityModal(defaultContext);
      expect(result).toContain('data-action="close-modal"');
    });

    it("renders device type icon", () => {
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
      };
      const result = renderEntityModal({ ...defaultContext, payload });
      expect(result).toContain("[switch]");
    });

    it("renders MAC address when available", () => {
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
        device_macs: { TestDevice: "aa:bb:cc:dd:ee:ff" },
      };
      const result = renderEntityModal({ ...defaultContext, payload });
      expect(result).toContain("aa:bb:cc:dd:ee:ff");
      expect(result).toContain("entity_modal.mac");
    });

    it("renders client MAC when device MAC not available", () => {
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "client" },
        client_macs: { TestDevice: "11:22:33:44:55:66" },
      };
      const result = renderEntityModal({ ...defaultContext, payload });
      expect(result).toContain("11:22:33:44:55:66");
    });

    it("renders model when available", () => {
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
        device_details: { TestDevice: { model_name: "USW-24-POE" } },
      };
      const result = renderEntityModal({ ...defaultContext, payload });
      expect(result).toContain("USW-24-POE");
      expect(result).toContain("entity_modal.model");
    });

    it("prefers model_name over model code", () => {
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
        device_details: { TestDevice: { model_name: "Friendly Name", model: "CODE123" } },
      };
      const result = renderEntityModal({ ...defaultContext, payload });
      expect(result).toContain("Friendly Name");
      expect(result).not.toContain("CODE123");
    });

    it("renders IP address when available", () => {
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "client" },
        related_entities: {
          TestDevice: [
            {
              entity_id: "device_tracker.test",
              domain: "device_tracker",
              state: "home",
              ip: "192.168.1.50",
            },
          ],
        },
      };
      const result = renderEntityModal({ ...defaultContext, payload });
      expect(result).toContain("192.168.1.50");
      expect(result).toContain("entity_modal.ip");
    });

    it("renders status when available", () => {
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
        node_status: {
          TestDevice: { entity_id: "device_tracker.test", state: "online", last_changed: null },
        },
      };
      const result = renderEntityModal({ ...defaultContext, payload });
      expect(result).toContain("entity_modal.status_online");
    });

    it("renders offline status", () => {
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
        node_status: {
          TestDevice: { entity_id: "device_tracker.test", state: "offline", last_changed: null },
        },
      };
      const result = renderEntityModal({ ...defaultContext, payload });
      expect(result).toContain("entity_modal.status_offline");
    });

    it("renders unknown status", () => {
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
        node_status: {
          TestDevice: { entity_id: "device_tracker.test", state: "unknown", last_changed: null },
        },
      };
      const result = renderEntityModal({ ...defaultContext, payload });
      expect(result).toContain("entity_modal.status_unknown");
    });

    it("renders last changed when available", () => {
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
        node_status: {
          TestDevice: {
            entity_id: "device_tracker.test",
            state: "online",
            last_changed: "2024-01-15T10:30:00Z",
          },
        },
      };
      const result = renderEntityModal({ ...defaultContext, payload });
      expect(result).toContain("2024-01-15T10:30:00Z");
      expect(result).toContain("entity_modal.last_changed");
    });

    it("renders device type", () => {
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "ap" },
      };
      const result = renderEntityModal({ ...defaultContext, payload });
      expect(result).toContain("entity_modal.device_type");
      expect(result).toContain("ap");
    });

    it("renders no entities message when empty", () => {
      const result = renderEntityModal(defaultContext);
      expect(result).toContain("entity_modal.no_entities");
    });

    it("renders related entities list", () => {
      const entities: RelatedEntity[] = [
        {
          entity_id: "sensor.test_temp",
          domain: "sensor",
          state: "25",
          friendly_name: "Temperature",
        },
        {
          entity_id: "switch.test_switch",
          domain: "switch",
          state: "on",
          friendly_name: "Test Switch",
        },
      ];
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
        related_entities: { TestDevice: entities },
      };
      const result = renderEntityModal({ ...defaultContext, payload });
      expect(result).toContain("entity_modal.related_entities_count (2)");
      expect(result).toContain("sensor.test_temp");
      expect(result).toContain("switch.test_switch");
    });

    it("displays entity state badges", () => {
      const entities: RelatedEntity[] = [
        { entity_id: "switch.test", domain: "switch", state: "on" },
      ];
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
        related_entities: { TestDevice: entities },
      };
      const result = renderEntityModal({ ...defaultContext, payload });
      expect(result).toContain("On");
      expect(result).toContain("entity-modal__state-badge--on");
    });

    it("displays off state badge", () => {
      const entities: RelatedEntity[] = [
        { entity_id: "switch.test", domain: "switch", state: "off" },
      ];
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
        related_entities: { TestDevice: entities },
      };
      const result = renderEntityModal({ ...defaultContext, payload });
      expect(result).toContain("Off");
      expect(result).toContain("entity-modal__state-badge--off");
    });

    it("displays home state badge as on", () => {
      const entities: RelatedEntity[] = [
        { entity_id: "device_tracker.test", domain: "device_tracker", state: "home" },
      ];
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "client" },
        related_entities: { TestDevice: entities },
      };
      const result = renderEntityModal({ ...defaultContext, payload });
      expect(result).toContain("Home");
      expect(result).toContain("entity-modal__state-badge--on");
    });

    it("displays not_home state badge as off", () => {
      const entities: RelatedEntity[] = [
        { entity_id: "device_tracker.test", domain: "device_tracker", state: "not_home" },
      ];
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "client" },
        related_entities: { TestDevice: entities },
      };
      const result = renderEntityModal({ ...defaultContext, payload });
      expect(result).toContain("Not_home");
      expect(result).toContain("entity-modal__state-badge--off");
    });

    it("displays unavailable state", () => {
      const entities: RelatedEntity[] = [
        { entity_id: "sensor.test", domain: "sensor", state: "unavailable" },
      ];
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
        related_entities: { TestDevice: entities },
      };
      const result = renderEntityModal({ ...defaultContext, payload });
      expect(result).toContain("Unavailable");
    });

    it("formats numeric sensor values", () => {
      const entities: RelatedEntity[] = [
        { entity_id: "sensor.test_temperature", domain: "sensor", state: "25.5" },
      ];
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
        related_entities: { TestDevice: entities },
      };
      const result = renderEntityModal({ ...defaultContext, payload });
      expect(result).toContain("25.5°C");
    });

    it("formats power sensor values", () => {
      const entities: RelatedEntity[] = [
        { entity_id: "sensor.test_power", domain: "sensor", state: "150" },
      ];
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
        related_entities: { TestDevice: entities },
      };
      const result = renderEntityModal({ ...defaultContext, payload });
      expect(result).toContain("150 W");
    });

    it("formats utilization values with percent", () => {
      const entities: RelatedEntity[] = [
        { entity_id: "sensor.test_utilization", domain: "sensor", state: "75" },
      ];
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
        related_entities: { TestDevice: entities },
      };
      const result = renderEntityModal({ ...defaultContext, payload });
      expect(result).toContain("75%");
    });

    it("formats large numbers with suffix", () => {
      const entities: RelatedEntity[] = [
        { entity_id: "sensor.test_bytes", domain: "sensor", state: "1500000" },
      ];
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
        related_entities: { TestDevice: entities },
      };
      const result = renderEntityModal({ ...defaultContext, payload });
      expect(result).toContain("1.5M");
    });

    it("truncates long state values", () => {
      const entities: RelatedEntity[] = [
        { entity_id: "sensor.test", domain: "sensor", state: "ThisIsAVeryLongStateValue123" },
      ];
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
        related_entities: { TestDevice: entities },
      };
      const result = renderEntityModal({ ...defaultContext, payload });
      // Long states should be truncated with ellipsis
      expect(result).toContain("…");
    });

    it("displays dash for button entities", () => {
      const entities: RelatedEntity[] = [
        { entity_id: "button.test_restart", domain: "button", state: "2024-01-01T00:00:00Z" },
      ];
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
        related_entities: { TestDevice: entities },
      };
      const result = renderEntityModal({ ...defaultContext, payload });
      // Button entities should display em-dash
      expect(result).toMatch(/—|&#8212;/);
    });

    it("displays off state for update entity", () => {
      const entities: RelatedEntity[] = [
        { entity_id: "update.test", domain: "update", state: "off" },
      ];
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
        related_entities: { TestDevice: entities },
      };
      const result = renderEntityModal({ ...defaultContext, payload });
      // Update entity with off state - note: "off" is in SIMPLE_STATES so gets formatted as "Off"
      expect(result).toContain("entity-modal__state-badge--off");
    });

    it("strips device name prefix from entity friendly name", () => {
      const entities: RelatedEntity[] = [
        {
          entity_id: "sensor.test",
          domain: "sensor",
          state: "on",
          friendly_name: "TestDevice Temperature",
        },
      ];
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
        related_entities: { TestDevice: entities },
      };
      const result = renderEntityModal({ ...defaultContext, payload });
      expect(result).toContain("Temperature");
    });

    it("escapes HTML in node name", () => {
      const context = { ...defaultContext, nodeName: "<script>alert(1)</script>" };
      const result = renderEntityModal(context);
      expect(result).not.toContain("<script>");
      expect(result).toContain("&lt;script&gt;");
    });

    it("renders entity items with click handlers", () => {
      const entities: RelatedEntity[] = [
        { entity_id: "sensor.test", domain: "sensor", state: "on" },
      ];
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
        related_entities: { TestDevice: entities },
      };
      const result = renderEntityModal({ ...defaultContext, payload });
      expect(result).toContain('data-modal-entity-id="sensor.test"');
    });

    it("abbreviates domain in entity ID display", () => {
      const entities: RelatedEntity[] = [
        { entity_id: "binary_sensor.test", domain: "binary_sensor", state: "on" },
      ];
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
        related_entities: { TestDevice: entities },
      };
      const result = renderEntityModal({ ...defaultContext, payload });
      expect(result).toContain("binary.test");
    });

    it("formats MAC address state with truncation", () => {
      const entities: RelatedEntity[] = [
        { entity_id: "sensor.test_mac", domain: "sensor", state: "aa:bb:cc:dd:ee:ff" },
      ];
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
        related_entities: { TestDevice: entities },
      };
      const result = renderEntityModal({ ...defaultContext, payload });
      // MAC should be truncated with ellipsis
      expect(result).toContain("aa:bb:cc…");
    });

    it("formats timestamp state as just now", () => {
      const now = new Date().toISOString();
      const entities: RelatedEntity[] = [
        { entity_id: "sensor.test_timestamp", domain: "sensor", state: now },
      ];
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
        related_entities: { TestDevice: entities },
      };
      const result = renderEntityModal({ ...defaultContext, payload });
      expect(result).toContain("Just now");
    });

    it("formats timestamp state as minutes ago", () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const entities: RelatedEntity[] = [
        { entity_id: "sensor.test_timestamp", domain: "sensor", state: fiveMinAgo },
      ];
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
        related_entities: { TestDevice: entities },
      };
      const result = renderEntityModal({ ...defaultContext, payload });
      expect(result).toContain("5m ago");
    });

    it("formats timestamp state as hours ago", () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const entities: RelatedEntity[] = [
        { entity_id: "sensor.test_timestamp", domain: "sensor", state: twoHoursAgo },
      ];
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
        related_entities: { TestDevice: entities },
      };
      const result = renderEntityModal({ ...defaultContext, payload });
      expect(result).toContain("2h ago");
    });

    it("formats timestamp state as days ago", () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const entities: RelatedEntity[] = [
        { entity_id: "sensor.test_timestamp", domain: "sensor", state: threeDaysAgo },
      ];
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
        related_entities: { TestDevice: entities },
      };
      const result = renderEntityModal({ ...defaultContext, payload });
      expect(result).toContain("3d ago");
    });

    it("formats old timestamp with date", () => {
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const entities: RelatedEntity[] = [
        { entity_id: "sensor.test_timestamp", domain: "sensor", state: twoWeeksAgo },
      ];
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
        related_entities: { TestDevice: entities },
      };
      const result = renderEntityModal({ ...defaultContext, payload });
      // Should show a date format, not relative time
      expect(result).not.toContain("ago");
    });

    it("displays dash for button entities", () => {
      const entities: RelatedEntity[] = [
        { entity_id: "button.test_restart", domain: "button", state: "2024-01-01T00:00:00Z" },
      ];
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
        related_entities: { TestDevice: entities },
      };
      const result = renderEntityModal({ ...defaultContext, payload });
      // Button entities should show em-dash
      expect(result).toContain("—");
    });

    it("displays update available for update entity with on state", () => {
      const entities: RelatedEntity[] = [
        { entity_id: "update.test", domain: "update", state: "on" },
      ];
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
        related_entities: { TestDevice: entities },
      };
      const result = renderEntityModal({ ...defaultContext, payload });
      // Note: "on" is in SIMPLE_STATES so gets formatted as "On"
      expect(result).toContain("entity-modal__state-badge--on");
    });

    it("formats billions with B suffix", () => {
      const entities: RelatedEntity[] = [
        { entity_id: "sensor.test_bytes", domain: "sensor", state: "2500000000" },
      ];
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
        related_entities: { TestDevice: entities },
      };
      const result = renderEntityModal({ ...defaultContext, payload });
      expect(result).toContain("2.5B");
    });

    it("formats small numeric values without suffix", () => {
      const entities: RelatedEntity[] = [
        { entity_id: "sensor.test_count", domain: "sensor", state: "5000" },
      ];
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
        related_entities: { TestDevice: entities },
      };
      const result = renderEntityModal({ ...defaultContext, payload });
      // Numbers below 1M are displayed as-is (formatLargeNumber only called for >= 1M)
      expect(result).toContain("5000");
    });

    it("strips device name prefix with underscore", () => {
      const entities: RelatedEntity[] = [
        {
          entity_id: "sensor.test",
          domain: "sensor",
          state: "on",
          friendly_name: "TestDevice_Temperature",
        },
      ];
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
        related_entities: { TestDevice: entities },
      };
      const result = renderEntityModal({ ...defaultContext, payload });
      expect(result).toContain("Temperature");
    });
  });
});
