import { createPortModalController, openPortModal, closePortModal } from "../card/ui/port-modal";
import type { MapPayload } from "../card/core/types";

describe("port-modal", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  const defaultParams = {
    controller: createPortModalController(),
    nodeName: "Switch1",
    theme: "dark" as const,
    getNodeTypeIcon: (type: string) => `[${type}]`,
    localize: (key: string, replacements?: Record<string, string | number>) => {
      if (replacements?.port !== undefined) return `Port ${replacements.port}`;
      return key;
    },
    onClose: jest.fn(),
    onDeviceClick: jest.fn(),
  };

  describe("createPortModalController", () => {
    it("returns empty controller", () => {
      const controller = createPortModalController();
      expect(controller.overlay).toBeNull();
      expect(controller.state).toBeNull();
    });
  });

  describe("openPortModal", () => {
    it("does nothing without payload", () => {
      const controller = createPortModalController();
      openPortModal({
        ...defaultParams,
        controller,
        payload: undefined,
      });
      expect(controller.overlay).toBeNull();
      expect(document.querySelector(".port-modal-overlay")).toBeNull();
    });

    it("does nothing when no ports found", () => {
      const controller = createPortModalController();
      const payload: MapPayload = {
        edges: [],
        node_types: { Switch1: "switch" },
      };
      openPortModal({
        ...defaultParams,
        controller,
        payload,
      });
      expect(controller.overlay).toBeNull();
    });

    it("creates modal with ports from device_ports", () => {
      const controller = createPortModalController();
      const payload: MapPayload = {
        edges: [],
        node_types: { Switch1: "switch" },
        device_ports: {
          Switch1: [
            {
              port: 1,
              name: "Port 1",
              speed: 1000,
              poe_enabled: true,
              poe_active: true,
              poe_power: 5.5,
            },
            {
              port: 2,
              name: "Port 2",
              speed: 100,
              poe_enabled: false,
              poe_active: false,
              poe_power: null,
            },
          ],
        },
      };
      openPortModal({
        ...defaultParams,
        controller,
        payload,
      });

      expect(controller.overlay).not.toBeNull();
      expect(document.querySelector(".port-modal")).not.toBeNull();
      expect(controller.state?.ports.length).toBe(2);
    });

    it("creates modal with ports from edges when device_ports not available", () => {
      const controller = createPortModalController();
      const payload: MapPayload = {
        edges: [{ left: "Switch1", right: "Client1", label: "Port 1", poe: true, speed: 1000 }],
        node_types: { Switch1: "switch", Client1: "client" },
      };
      openPortModal({
        ...defaultParams,
        controller,
        payload,
      });

      expect(controller.overlay).not.toBeNull();
      expect(controller.state?.ports.length).toBe(1);
      expect(controller.state?.ports[0].port).toBe(1);
      expect(controller.state?.ports[0].connectedDevice).toBe("Client1");
    });

    it("sets theme on overlay", () => {
      const controller = createPortModalController();
      const payload: MapPayload = {
        edges: [{ left: "Switch1", right: "AP1", label: "Port 8" }],
        node_types: { Switch1: "switch", AP1: "ap" },
      };
      openPortModal({
        ...defaultParams,
        controller,
        payload,
        theme: "unifi-dark",
      });

      expect(controller.overlay?.dataset.theme).toBe("unifi-dark");
    });

    it("renders node name in header", () => {
      const controller = createPortModalController();
      const payload: MapPayload = {
        edges: [{ left: "MySwitch", right: "Device", label: "Port 1" }],
        node_types: { MySwitch: "switch", Device: "client" },
      };
      openPortModal({
        ...defaultParams,
        controller,
        nodeName: "MySwitch",
        payload,
      });

      expect(controller.overlay?.innerHTML).toContain("MySwitch");
    });

    it("renders node type icon", () => {
      const controller = createPortModalController();
      const payload: MapPayload = {
        edges: [{ left: "Switch1", right: "Device", label: "Port 1" }],
        node_types: { Switch1: "gateway", Device: "client" },
      };
      openPortModal({
        ...defaultParams,
        controller,
        payload,
      });

      expect(controller.overlay?.innerHTML).toContain("[gateway]");
    });

    it("renders connected device info", () => {
      const controller = createPortModalController();
      const payload: MapPayload = {
        edges: [{ left: "Switch1", right: "AccessPoint", label: "Port 24" }],
        node_types: { Switch1: "switch", AccessPoint: "ap" },
      };
      openPortModal({
        ...defaultParams,
        controller,
        payload,
      });

      expect(controller.overlay?.innerHTML).toContain("AccessPoint");
      expect(controller.overlay?.innerHTML).toContain("[ap]");
      expect(controller.overlay?.innerHTML).toContain('data-device-name="AccessPoint"');
    });

    it("renders PoE badge with power", () => {
      const controller = createPortModalController();
      const payload: MapPayload = {
        edges: [],
        node_types: { Switch1: "switch" },
        device_ports: {
          Switch1: [
            {
              port: 1,
              name: "Port 1",
              speed: null,
              poe_enabled: true,
              poe_active: true,
              poe_power: 15.5,
            },
          ],
        },
      };
      openPortModal({
        ...defaultParams,
        controller,
        payload,
      });

      expect(controller.overlay?.innerHTML).toContain("15.5W");
    });

    it("renders PoE badge with milliwatts for small power", () => {
      const controller = createPortModalController();
      const payload: MapPayload = {
        edges: [],
        node_types: { Switch1: "switch" },
        device_ports: {
          Switch1: [
            {
              port: 1,
              name: "Port 1",
              speed: null,
              poe_enabled: true,
              poe_active: true,
              poe_power: 0.5,
            },
          ],
        },
      };
      openPortModal({
        ...defaultParams,
        controller,
        payload,
      });

      expect(controller.overlay?.innerHTML).toContain("500mW");
    });

    it("renders inactive PoE badge", () => {
      const controller = createPortModalController();
      const payload: MapPayload = {
        edges: [],
        node_types: { Switch1: "switch" },
        device_ports: {
          Switch1: [
            {
              port: 1,
              name: "Port 1",
              speed: null,
              poe_enabled: true,
              poe_active: false,
              poe_power: null,
            },
          ],
        },
      };
      openPortModal({
        ...defaultParams,
        controller,
        payload,
      });

      expect(controller.overlay?.innerHTML).toContain("badge--poe-inactive");
    });

    it("renders speed badge in Gbps", () => {
      const controller = createPortModalController();
      const payload: MapPayload = {
        edges: [],
        node_types: { Switch1: "switch" },
        device_ports: {
          Switch1: [
            {
              port: 1,
              name: "Port 1",
              speed: 2500,
              poe_enabled: false,
              poe_active: false,
              poe_power: null,
            },
          ],
        },
      };
      openPortModal({
        ...defaultParams,
        controller,
        payload,
      });

      expect(controller.overlay?.innerHTML).toContain("2.5G");
    });

    it("renders speed badge in Mbps", () => {
      const controller = createPortModalController();
      const payload: MapPayload = {
        edges: [],
        node_types: { Switch1: "switch" },
        device_ports: {
          Switch1: [
            {
              port: 1,
              name: "Port 1",
              speed: 100,
              poe_enabled: false,
              poe_active: false,
              poe_power: null,
            },
          ],
        },
      };
      openPortModal({
        ...defaultParams,
        controller,
        payload,
      });

      expect(controller.overlay?.innerHTML).toContain("100M");
    });

    it("renders empty port state", () => {
      const controller = createPortModalController();
      const payload: MapPayload = {
        edges: [],
        node_types: { Switch1: "switch" },
        device_ports: {
          Switch1: [
            {
              port: 1,
              name: "Port 1",
              speed: null,
              poe_enabled: false,
              poe_active: false,
              poe_power: null,
            },
          ],
        },
      };
      openPortModal({
        ...defaultParams,
        controller,
        payload,
      });

      expect(controller.overlay?.innerHTML).toContain("port-row--empty");
      expect(controller.overlay?.innerHTML).toContain("port_modal.empty");
    });

    it("calls onClose when clicking overlay background", () => {
      const controller = createPortModalController();
      const onClose = jest.fn();
      const payload: MapPayload = {
        edges: [{ left: "Switch1", right: "Device", label: "Port 1" }],
        node_types: { Switch1: "switch", Device: "client" },
      };
      openPortModal({
        ...defaultParams,
        controller,
        payload,
        onClose,
      });

      // Click on overlay (not modal content)
      controller.overlay?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(onClose).toHaveBeenCalled();
    });

    it("calls onClose when clicking close button", () => {
      const controller = createPortModalController();
      const onClose = jest.fn();
      const payload: MapPayload = {
        edges: [{ left: "Switch1", right: "Device", label: "Port 1" }],
        node_types: { Switch1: "switch", Device: "client" },
      };
      openPortModal({
        ...defaultParams,
        controller,
        payload,
        onClose,
      });

      const closeBtn = controller.overlay?.querySelector(".port-modal__close");
      closeBtn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(onClose).toHaveBeenCalled();
    });

    it("calls onDeviceClick when clicking device link", () => {
      const controller = createPortModalController();
      const onDeviceClick = jest.fn();
      const payload: MapPayload = {
        edges: [{ left: "Switch1", right: "AccessPoint", label: "Port 8" }],
        node_types: { Switch1: "switch", AccessPoint: "ap" },
      };
      openPortModal({
        ...defaultParams,
        controller,
        payload,
        onDeviceClick,
      });

      const deviceLink = controller.overlay?.querySelector('[data-device-name="AccessPoint"]');
      deviceLink?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(onDeviceClick).toHaveBeenCalledWith("AccessPoint");
    });

    it("handles edge label with <-> separator", () => {
      const controller = createPortModalController();
      const payload: MapPayload = {
        edges: [{ left: "Switch1", right: "Switch2", label: "Port 24 <-> Port 1" }],
        node_types: { Switch1: "switch", Switch2: "switch" },
      };
      openPortModal({
        ...defaultParams,
        controller,
        payload,
      });

      expect(controller.state?.ports.length).toBe(1);
      expect(controller.state?.ports[0].port).toBe(24); // Left side port
    });

    it("handles edges where device is on right side", () => {
      const controller = createPortModalController();
      const payload: MapPayload = {
        edges: [{ left: "Gateway", right: "Switch1", label: "Port 1 <-> Port 24" }],
        node_types: { Gateway: "gateway", Switch1: "switch" },
      };
      openPortModal({
        ...defaultParams,
        controller,
        payload,
      });

      expect(controller.state?.ports.length).toBe(1);
      expect(controller.state?.ports[0].port).toBe(24); // Right side port for Switch1
      expect(controller.state?.ports[0].connectedDevice).toBe("Gateway");
    });

    it("escapes HTML in device names", () => {
      const controller = createPortModalController();
      const badName = "Test<b>Bold</b>";
      const payload: MapPayload = {
        edges: [{ left: "Switch1", right: badName, label: "Port 1" }],
        node_types: { Switch1: "switch", [badName]: "client" },
      };
      openPortModal({
        ...defaultParams,
        controller,
        payload,
      });

      // Should escape < and > in the text content (innerHTML shows &lt;b&gt;)
      // The text content is escaped so literal < and > are shown, not interpreted as tags
      expect(controller.overlay?.innerHTML).toContain("&lt;b&gt;");
      // Verify there's no actual <b> element created by unescaped HTML
      expect(controller.overlay?.querySelector("b")).toBeNull();
    });
  });

  describe("closePortModal", () => {
    it("removes overlay from DOM", () => {
      const controller = createPortModalController();
      const payload: MapPayload = {
        edges: [{ left: "Switch1", right: "Device", label: "Port 1" }],
        node_types: { Switch1: "switch", Device: "client" },
      };
      openPortModal({
        ...defaultParams,
        controller,
        payload,
      });

      expect(document.querySelector(".port-modal-overlay")).not.toBeNull();

      closePortModal(controller);

      expect(document.querySelector(".port-modal-overlay")).toBeNull();
    });

    it("clears controller state", () => {
      const controller = createPortModalController();
      const payload: MapPayload = {
        edges: [{ left: "Switch1", right: "Device", label: "Port 1" }],
        node_types: { Switch1: "switch", Device: "client" },
      };
      openPortModal({
        ...defaultParams,
        controller,
        payload,
      });

      closePortModal(controller);

      expect(controller.overlay).toBeNull();
      expect(controller.state).toBeNull();
    });

    it("handles already closed controller", () => {
      const controller = createPortModalController();
      expect(() => closePortModal(controller)).not.toThrow();
    });
  });
});
