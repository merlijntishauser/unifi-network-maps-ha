import {
  createEntityModalController,
  openEntityModal,
  closeEntityModal,
} from "../card/interaction/entity-modal-state";
import type { MapPayload } from "../card/core/types";

describe("entity-modal-state", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  const defaultParams = {
    controller: createEntityModalController(),
    nodeName: "TestDevice",
    theme: "dark" as const,
    getNodeTypeIcon: (type: string) => `[${type}]`,
    formatLastChanged: (value: string | null | undefined) => value ?? "Unknown",
    localize: (key: string) => key,
    onEntityDetails: jest.fn(),
  };

  describe("createEntityModalController", () => {
    it("returns empty controller", () => {
      const controller = createEntityModalController();
      expect(controller.overlay).toBeUndefined();
    });
  });

  describe("openEntityModal", () => {
    it("creates modal and adds to DOM", () => {
      const controller = createEntityModalController();
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
      };
      openEntityModal({
        ...defaultParams,
        controller,
        payload,
      });

      expect(controller.overlay).toBeDefined();
      expect(document.querySelector(".entity-modal-overlay")).not.toBeNull();
    });

    it("sets theme on overlay", () => {
      const controller = createEntityModalController();
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
      };
      openEntityModal({
        ...defaultParams,
        controller,
        payload,
        theme: "unifi-dark",
      });

      expect(controller.overlay?.getAttribute("data-theme")).toBe("unifi-dark");
    });

    it("closes previous modal before opening new one", () => {
      const controller = createEntityModalController();
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
      };

      // Open first modal
      openEntityModal({
        ...defaultParams,
        controller,
        payload,
        nodeName: "Device1",
      });
      const firstOverlay = controller.overlay;

      // Open second modal
      openEntityModal({
        ...defaultParams,
        controller,
        payload,
        nodeName: "Device2",
      });

      // First overlay should be removed
      expect(firstOverlay?.parentNode).toBeNull();
      expect(controller.overlay).not.toBe(firstOverlay);
    });

    it("calls onClose when clicking overlay background", () => {
      const controller = createEntityModalController();
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
      };
      openEntityModal({
        ...defaultParams,
        controller,
        payload,
      });

      // Click on overlay (the element with data-modal-overlay)
      const overlay = controller.overlay!;
      const event = new MouseEvent("click", { bubbles: true });
      Object.defineProperty(event, "target", { value: overlay });
      overlay.dispatchEvent(event);

      expect(controller.overlay).toBeUndefined();
    });

    it("calls onClose when clicking close button", () => {
      const controller = createEntityModalController();
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
      };
      openEntityModal({
        ...defaultParams,
        controller,
        payload,
      });

      const closeBtn = controller.overlay?.querySelector(
        '[data-action="close-modal"]',
      ) as HTMLElement;
      closeBtn?.click();

      expect(controller.overlay).toBeUndefined();
    });

    it("calls onEntityDetails when clicking entity item", () => {
      const controller = createEntityModalController();
      const onEntityDetails = jest.fn();
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
        related_entities: {
          TestDevice: [{ entity_id: "sensor.test", domain: "sensor", state: "on" }],
        },
      };
      openEntityModal({
        ...defaultParams,
        controller,
        payload,
        onEntityDetails,
      });

      const entityItem = controller.overlay?.querySelector(
        '[data-modal-entity-id="sensor.test"]',
      ) as HTMLElement;
      entityItem?.click();

      expect(onEntityDetails).toHaveBeenCalledWith("sensor.test");
    });

    it("handles click on child of entity item", () => {
      const controller = createEntityModalController();
      const onEntityDetails = jest.fn();
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
        related_entities: {
          TestDevice: [{ entity_id: "sensor.test", domain: "sensor", state: "on" }],
        },
      };
      openEntityModal({
        ...defaultParams,
        controller,
        payload,
        onEntityDetails,
      });

      // Click on a child element inside the entity item
      const entityItem = controller.overlay?.querySelector('[data-modal-entity-id="sensor.test"]');
      const childSpan = entityItem?.querySelector("span");
      childSpan?.click();

      expect(onEntityDetails).toHaveBeenCalledWith("sensor.test");
    });
  });

  describe("closeEntityModal", () => {
    it("removes overlay from DOM", () => {
      const controller = createEntityModalController();
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
      };
      openEntityModal({
        ...defaultParams,
        controller,
        payload,
      });

      expect(document.querySelector(".entity-modal-overlay")).not.toBeNull();

      closeEntityModal(controller);

      expect(document.querySelector(".entity-modal-overlay")).toBeNull();
    });

    it("clears controller overlay", () => {
      const controller = createEntityModalController();
      const payload: MapPayload = {
        edges: [],
        node_types: { TestDevice: "switch" },
      };
      openEntityModal({
        ...defaultParams,
        controller,
        payload,
      });

      closeEntityModal(controller);

      expect(controller.overlay).toBeUndefined();
    });

    it("handles already closed controller", () => {
      const controller = createEntityModalController();
      expect(() => closeEntityModal(controller)).not.toThrow();
    });
  });
});
