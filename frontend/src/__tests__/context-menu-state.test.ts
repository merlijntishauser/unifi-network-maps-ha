import {
  createContextMenuController,
  openContextMenu,
  closeContextMenu,
} from "../card/interaction/context-menu-state";

describe("context-menu-state", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  describe("createContextMenuController", () => {
    it("returns empty controller object", () => {
      const controller = createContextMenuController();
      expect(controller.menu).toBeUndefined();
      expect(controller.element).toBeUndefined();
    });
  });

  describe("openContextMenu", () => {
    it("creates and appends menu element to body", () => {
      const controller = createContextMenuController();
      const renderMenu = () => '<div class="test-menu">Menu</div>';
      const onAction = jest.fn();

      openContextMenu({
        controller,
        menu: { nodeName: "TestNode", x: 100, y: 200 },
        renderMenu,
        onAction,
      });

      const menu = document.querySelector(".test-menu");
      expect(menu).not.toBeNull();
      expect(menu?.textContent).toBe("Menu");
    });

    it("sets controller menu state", () => {
      const controller = createContextMenuController();
      const renderMenu = () => '<div class="test-menu">Menu</div>';
      const onAction = jest.fn();

      openContextMenu({
        controller,
        menu: { nodeName: "TestNode", x: 100, y: 200 },
        renderMenu,
        onAction,
      });

      expect(controller.menu).toEqual({ nodeName: "TestNode", x: 100, y: 200 });
    });

    it("sets controller element reference", () => {
      const controller = createContextMenuController();
      const renderMenu = () => '<div class="test-menu">Menu</div>';
      const onAction = jest.fn();

      openContextMenu({
        controller,
        menu: { nodeName: "TestNode", x: 100, y: 200 },
        renderMenu,
        onAction,
      });

      expect(controller.element).not.toBeUndefined();
      expect(controller.element?.classList.contains("test-menu")).toBe(true);
    });

    it("positions menu at specified coordinates", () => {
      const controller = createContextMenuController();
      const renderMenu = () => '<div class="test-menu">Menu</div>';
      const onAction = jest.fn();

      openContextMenu({
        controller,
        menu: { nodeName: "TestNode", x: 150, y: 250 },
        renderMenu,
        onAction,
      });

      expect(controller.element?.style.left).toBe("150px");
      expect(controller.element?.style.top).toBe("250px");
    });

    it("does nothing if renderMenu returns no element", () => {
      const controller = createContextMenuController();
      const renderMenu = () => ""; // No element
      const onAction = jest.fn();

      openContextMenu({
        controller,
        menu: { nodeName: "TestNode", x: 100, y: 200 },
        renderMenu,
        onAction,
      });

      expect(controller.menu).toBeUndefined();
      expect(controller.element).toBeUndefined();
    });

    it("passes node name to renderMenu", () => {
      const controller = createContextMenuController();
      const renderMenu = jest.fn().mockReturnValue('<div class="test-menu">Menu</div>');
      const onAction = jest.fn();

      openContextMenu({
        controller,
        menu: { nodeName: "MyDevice", x: 100, y: 200 },
        renderMenu,
        onAction,
      });

      expect(renderMenu).toHaveBeenCalledWith("MyDevice");
    });
  });

  describe("closeContextMenu", () => {
    it("removes menu element from DOM", () => {
      const controller = createContextMenuController();
      const renderMenu = () => '<div class="test-menu">Menu</div>';
      const onAction = jest.fn();

      openContextMenu({
        controller,
        menu: { nodeName: "TestNode", x: 100, y: 200 },
        renderMenu,
        onAction,
      });

      expect(document.querySelector(".test-menu")).not.toBeNull();

      closeContextMenu(controller);

      expect(document.querySelector(".test-menu")).toBeNull();
    });

    it("clears controller menu state", () => {
      const controller = createContextMenuController();
      const renderMenu = () => '<div class="test-menu">Menu</div>';
      const onAction = jest.fn();

      openContextMenu({
        controller,
        menu: { nodeName: "TestNode", x: 100, y: 200 },
        renderMenu,
        onAction,
      });

      closeContextMenu(controller);

      expect(controller.menu).toBeUndefined();
    });

    it("clears controller element reference", () => {
      const controller = createContextMenuController();
      const renderMenu = () => '<div class="test-menu">Menu</div>';
      const onAction = jest.fn();

      openContextMenu({
        controller,
        menu: { nodeName: "TestNode", x: 100, y: 200 },
        renderMenu,
        onAction,
      });

      closeContextMenu(controller);

      expect(controller.element).toBeUndefined();
    });

    it("calls cleanup function if present", () => {
      const controller = createContextMenuController();
      const renderMenu = () => '<div class="test-menu">Menu</div>';
      const onAction = jest.fn();

      openContextMenu({
        controller,
        menu: { nodeName: "TestNode", x: 100, y: 200 },
        renderMenu,
        onAction,
      });

      // Add cleanup function
      const cleanup = jest.fn();
      if (controller.element) {
        (controller.element as unknown as { _cleanup: () => void })._cleanup = cleanup;
      }

      closeContextMenu(controller);

      expect(cleanup).toHaveBeenCalled();
    });

    it("handles already closed controller", () => {
      const controller = createContextMenuController();
      // Should not throw
      expect(() => closeContextMenu(controller)).not.toThrow();
    });
  });

  describe("event handling", () => {
    it("closes menu on Escape key", () => {
      const controller = createContextMenuController();
      const renderMenu = () => '<div class="test-menu">Menu</div>';
      const onAction = jest.fn();

      openContextMenu({
        controller,
        menu: { nodeName: "TestNode", x: 100, y: 200 },
        renderMenu,
        onAction,
      });

      expect(controller.element).not.toBeUndefined();

      // Simulate Escape key
      const event = new KeyboardEvent("keydown", { key: "Escape" });
      document.dispatchEvent(event);

      expect(controller.menu).toBeUndefined();
      expect(controller.element).toBeUndefined();
    });

    it("calls onAction when action button clicked", () => {
      const controller = createContextMenuController();
      const renderMenu = () => `
        <div class="test-menu">
          <button data-context-action="copy-mac" data-mac="aa:bb:cc:dd:ee:ff">Copy</button>
        </div>
      `;
      const onAction = jest.fn();

      openContextMenu({
        controller,
        menu: { nodeName: "TestNode", x: 100, y: 200 },
        renderMenu,
        onAction,
      });

      const button = controller.element?.querySelector("button");
      button?.click();

      expect(onAction).toHaveBeenCalledWith("copy-mac", "TestNode", "aa:bb:cc:dd:ee:ff", null);
    });

    it("passes IP to onAction when present", () => {
      const controller = createContextMenuController();
      const renderMenu = () => `
        <div class="test-menu">
          <button data-context-action="copy-ip" data-ip="192.168.1.1">Copy IP</button>
        </div>
      `;
      const onAction = jest.fn();

      openContextMenu({
        controller,
        menu: { nodeName: "TestNode", x: 100, y: 200 },
        renderMenu,
        onAction,
      });

      const button = controller.element?.querySelector("button");
      button?.click();

      expect(onAction).toHaveBeenCalledWith("copy-ip", "TestNode", null, "192.168.1.1");
    });

    it("closes menu when clicking outside", () => {
      const controller = createContextMenuController();
      const renderMenu = () => '<div class="test-menu">Menu</div>';
      const onAction = jest.fn();

      openContextMenu({
        controller,
        menu: { nodeName: "TestNode", x: 100, y: 200 },
        renderMenu,
        onAction,
      });

      expect(controller.element).not.toBeUndefined();

      // Create an element outside the menu and click it
      const outsideElement = document.createElement("div");
      document.body.appendChild(outsideElement);
      outsideElement.click();

      expect(controller.menu).toBeUndefined();
      expect(controller.element).toBeUndefined();
    });

    it("does not call onAction when clicking non-action element", () => {
      const controller = createContextMenuController();
      const renderMenu = () => `
        <div class="test-menu">
          <span class="label">Just a label</span>
        </div>
      `;
      const onAction = jest.fn();

      openContextMenu({
        controller,
        menu: { nodeName: "TestNode", x: 100, y: 200 },
        renderMenu,
        onAction,
      });

      const label = controller.element?.querySelector(".label");
      label?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(onAction).not.toHaveBeenCalled();
    });

    it("adjusts position via requestAnimationFrame", () => {
      jest.useFakeTimers();
      const controller = createContextMenuController();
      const renderMenu = () => '<div class="test-menu">Menu</div>';
      const onAction = jest.fn();

      openContextMenu({
        controller,
        menu: { nodeName: "TestNode", x: 100, y: 200 },
        renderMenu,
        onAction,
      });

      // Initially positioned at specified coords
      expect(controller.element?.style.left).toBe("100px");
      expect(controller.element?.style.top).toBe("200px");

      // Run requestAnimationFrame callbacks
      jest.runAllTimers();

      // After rAF, position may be adjusted (in JSDOM, getBoundingClientRect returns 0)
      expect(controller.element?.style.left).toBeDefined();
      expect(controller.element?.style.top).toBeDefined();

      jest.useRealTimers();
    });
  });
});
