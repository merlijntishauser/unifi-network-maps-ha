import { renderContextMenu, parseContextMenuAction } from "../card/ui/context-menu";
import type { MapPayload } from "../card/core/types";

describe("context-menu", () => {
  const defaultOptions = {
    nodeId: "aa:bb:cc:dd:ee:ff",
    theme: "dark" as const,
    getNodeTypeIcon: (type: string) => `[${type}]`,
    getIcon: () => "[icon]",
    localize: (key: string) => key,
  };

  describe("renderContextMenu", () => {
    it("renders basic context menu structure", () => {
      const result = renderContextMenu(defaultOptions);
      expect(result).toContain('class="context-menu"');
      expect(result).toContain('data-theme="dark"');
      expect(result).toContain('data-context-node="aa:bb:cc:dd:ee:ff"');
      expect(result).toContain("aa:bb:cc:dd:ee:ff");
    });

    it("includes node type in header", () => {
      const result = renderContextMenu(defaultOptions);
      expect(result).toContain("unknown"); // Default type when no payload
    });

    it("renders with payload containing node type", () => {
      const payload: MapPayload = {
        edges: [],
        node_types: { "aa:bb:cc:dd:ee:ff": "switch" },
      };
      const result = renderContextMenu({ ...defaultOptions, payload });
      expect(result).toContain("[switch]"); // Icon
      expect(result).toContain("switch"); // Type in subtitle
    });

    it("renders model name when available", () => {
      const payload: MapPayload = {
        edges: [],
        node_types: { "aa:bb:cc:dd:ee:ff": "switch" },
        device_details: {
          "aa:bb:cc:dd:ee:ff": { model_name: "USW-24-POE", model: "USW24P" },
        },
      };
      const result = renderContextMenu({ ...defaultOptions, payload });
      expect(result).toContain("USW-24-POE");
    });

    it("renders details item when entity exists", () => {
      const payload: MapPayload = {
        edges: [],
        node_types: { "aa:bb:cc:dd:ee:ff": "switch" },
        node_entities: { "aa:bb:cc:dd:ee:ff": "device_tracker.switch" },
      };
      const result = renderContextMenu({ ...defaultOptions, payload });
      expect(result).toContain('data-context-action="details"');
      expect(result).toContain("context_menu.view_details");
    });

    it("renders copy MAC item when node exists in payload", () => {
      const payload: MapPayload = {
        edges: [],
        node_types: { "aa:bb:cc:dd:ee:ff": "switch" },
      };
      const result = renderContextMenu({ ...defaultOptions, payload });
      expect(result).toContain('data-context-action="copy-mac"');
      expect(result).toContain('data-mac="aa:bb:cc:dd:ee:ff"');
    });

    it("renders copy IP item when IP exists", () => {
      const payload: MapPayload = {
        edges: [],
        node_types: { "aa:bb:cc:dd:ee:ff": "client" },
        related_entities: {
          "aa:bb:cc:dd:ee:ff": [
            {
              entity_id: "device_tracker.test",
              domain: "device_tracker",
              state: "home",
              ip: "192.168.1.100",
            },
          ],
        },
      };
      const result = renderContextMenu({ ...defaultOptions, payload });
      expect(result).toContain('data-context-action="copy-ip"');
      expect(result).toContain('data-ip="192.168.1.100"');
    });

    it("renders view ports item for switch", () => {
      const payload: MapPayload = {
        edges: [],
        node_types: { "aa:bb:cc:dd:ee:ff": "switch" },
      };
      const result = renderContextMenu({ ...defaultOptions, payload });
      expect(result).toContain('data-context-action="view-ports"');
    });

    it("renders view ports item for gateway", () => {
      const payload: MapPayload = {
        edges: [],
        node_types: { "aa:bb:cc:dd:ee:ff": "gateway" },
      };
      const result = renderContextMenu({ ...defaultOptions, payload });
      expect(result).toContain('data-context-action="view-ports"');
    });

    it("does not render view ports item for client", () => {
      const payload: MapPayload = {
        edges: [],
        node_types: { "aa:bb:cc:dd:ee:ff": "client" },
      };
      const result = renderContextMenu({ ...defaultOptions, payload });
      expect(result).not.toContain('data-context-action="view-ports"');
    });

    it("renders restart item for devices", () => {
      const payload: MapPayload = {
        edges: [],
        node_types: { "aa:bb:cc:dd:ee:ff": "switch" },
        node_entities: { "aa:bb:cc:dd:ee:ff": "device_tracker.switch" },
      };
      const result = renderContextMenu({ ...defaultOptions, payload });
      expect(result).toContain('data-context-action="restart"');
    });

    it("disables restart when no entity", () => {
      const payload: MapPayload = {
        edges: [],
        node_types: { "aa:bb:cc:dd:ee:ff": "switch" },
      };
      const result = renderContextMenu({ ...defaultOptions, payload });
      expect(result).toContain('data-context-action="restart"');
      expect(result).toContain("disabled");
    });

    it("does not render restart for clients", () => {
      const payload: MapPayload = {
        edges: [],
        node_types: { "aa:bb:cc:dd:ee:ff": "client" },
      };
      const result = renderContextMenu({ ...defaultOptions, payload });
      expect(result).not.toContain('data-context-action="restart"');
    });

    it("renders divider when there are action items", () => {
      const payload: MapPayload = {
        edges: [],
        node_types: { "aa:bb:cc:dd:ee:ff": "switch" },
        node_entities: { "aa:bb:cc:dd:ee:ff": "device_tracker.switch" },
      };
      const result = renderContextMenu({ ...defaultOptions, payload });
      expect(result).toContain('class="context-menu__divider"');
    });

    it("renders display name from node_names", () => {
      const payload: MapPayload = {
        edges: [],
        node_types: { "aa:bb:cc:dd:ee:ff": "client" },
        node_names: { "aa:bb:cc:dd:ee:ff": "TestClient" },
      };
      const result = renderContextMenu({ ...defaultOptions, payload });
      expect(result).toContain("TestClient");
    });

    it("escapes HTML in node name", () => {
      const payload: MapPayload = {
        edges: [],
        node_types: { "aa:bb:cc:dd:ee:ff": "switch" },
        node_names: { "aa:bb:cc:dd:ee:ff": "<script>alert(1)</script>" },
      };
      const result = renderContextMenu({ ...defaultOptions, payload });
      expect(result).not.toContain("<script>");
      expect(result).toContain("&lt;script&gt;");
    });

    it("handles all theme variants", () => {
      for (const theme of ["dark", "light", "unifi", "unifi-dark"] as const) {
        const result = renderContextMenu({ ...defaultOptions, theme });
        expect(result).toContain(`data-theme="${theme}"`);
      }
    });
  });

  describe("parseContextMenuAction", () => {
    it("returns null for element without action", () => {
      const element = document.createElement("div");
      const result = parseContextMenuAction(element);
      expect(result).toBeNull();
    });

    it("returns null for disabled button", () => {
      const button = document.createElement("button");
      button.setAttribute("data-context-action", "restart");
      button.disabled = true;
      const result = parseContextMenuAction(button);
      expect(result).toBeNull();
    });

    it("parses details action", () => {
      const button = document.createElement("button");
      button.setAttribute("data-context-action", "details");
      const result = parseContextMenuAction(button);
      expect(result).toEqual({ action: "details", mac: null, ip: null });
    });

    it("parses copy-mac action with MAC", () => {
      const button = document.createElement("button");
      button.setAttribute("data-context-action", "copy-mac");
      button.setAttribute("data-mac", "aa:bb:cc:dd:ee:ff");
      const result = parseContextMenuAction(button);
      expect(result).toEqual({ action: "copy-mac", mac: "aa:bb:cc:dd:ee:ff", ip: null });
    });

    it("parses copy-ip action with IP", () => {
      const button = document.createElement("button");
      button.setAttribute("data-context-action", "copy-ip");
      button.setAttribute("data-ip", "192.168.1.1");
      const result = parseContextMenuAction(button);
      expect(result).toEqual({ action: "copy-ip", mac: null, ip: "192.168.1.1" });
    });

    it("parses restart action", () => {
      const button = document.createElement("button");
      button.setAttribute("data-context-action", "restart");
      const result = parseContextMenuAction(button);
      expect(result).toEqual({ action: "restart", mac: null, ip: null });
    });

    it("parses view-ports action", () => {
      const button = document.createElement("button");
      button.setAttribute("data-context-action", "view-ports");
      const result = parseContextMenuAction(button);
      expect(result).toEqual({ action: "view-ports", mac: null, ip: null });
    });

    it("returns unknown for invalid action", () => {
      const button = document.createElement("button");
      button.setAttribute("data-context-action", "invalid-action");
      const result = parseContextMenuAction(button);
      expect(result).toEqual({ action: "unknown", mac: null, ip: null });
    });

    it("finds action from child element", () => {
      const button = document.createElement("button");
      button.setAttribute("data-context-action", "details");
      const span = document.createElement("span");
      button.appendChild(span);
      const result = parseContextMenuAction(span);
      expect(result).toEqual({ action: "details", mac: null, ip: null });
    });
  });
});
