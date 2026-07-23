import {
  clearNodeSelection,
  findNodeElement,
  highlightSelectedNode,
  inferNodeName,
  markNodeSelected,
  resolveNodeId,
} from "../card/interaction/node";
import {
  applyTransform,
  applyZoom,
  createDefaultViewportState,
  onClick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel,
} from "../card/interaction/viewport";
import type { ViewportCallbacks, ViewportHandlers } from "../card/interaction/viewport";
import {
  MAX_ZOOM_SCALE,
  MIN_PAN_MOVEMENT_THRESHOLD,
  MIN_ZOOM_SCALE,
  TOOLTIP_OFFSET_PX,
  ZOOM_INCREMENT,
} from "../card/shared/constants";
import type { ConfigurableCard } from "./test-helpers";
import { makeSvg, resetTestDom } from "./test-helpers";

const viewportOptions = () => ({
  minPanMovementThreshold: MIN_PAN_MOVEMENT_THRESHOLD,
  zoomIncrement: ZOOM_INCREMENT,
  minZoomScale: MIN_ZOOM_SCALE,
  maxZoomScale: MAX_ZOOM_SCALE,
  tooltipOffsetPx: TOOLTIP_OFFSET_PX,
});

const spyCallbacks = (): ViewportCallbacks => ({
  onNodeSelected: jest.fn(),
  onHoverEdge: jest.fn(),
  onHoverNode: jest.fn(),
  onOpenContextMenu: jest.fn(),
  onUpdateTransform: jest.fn(),
});

const nodeHandlers = (): ViewportHandlers => ({
  resolveNodeId: (event) => resolveNodeId(event),
  findEdge: () => null,
  renderEdgeTooltip: () => "",
});

describe("unifi-network-map card interaction", () => {
  afterEach(resetTestDom);

  it("prefers an ancestor data-node-id over label text content", () => {
    // Upstream SVGs put data-node-id (the MAC) on the group; the visible
    // <text> label holds the display name, which is not a payload key.
    const group = document.createElement("g");
    group.setAttribute("data-node-id", "aa:bb:cc:dd:ee:ff");
    const text = document.createElement("text");
    text.textContent = "Office AP";
    group.appendChild(text);
    const event = {
      composedPath: () => [text, group],
      clientX: 0,
      clientY: 0,
    } as unknown as MouseEvent;
    expect(resolveNodeId(event)).toBe("aa:bb:cc:dd:ee:ff");
  });

  it("restart action targets the node's restart button entity", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _payload?: unknown;
      _handleRestartDevice: (nodeId: string) => void;
    };
    card._payload = {
      edges: [],
      node_types: {},
      node_entities: { "aa:bb:cc:dd:ee:ff": "device_tracker.office_ap" },
      related_entities: {
        "aa:bb:cc:dd:ee:ff": [
          { entity_id: "device_tracker.office_ap", domain: "device_tracker", state: "home" },
          { entity_id: "button.office_ap_restart", domain: "button", state: null },
        ],
      },
    };
    const events: CustomEvent[] = [];
    element.addEventListener("hass-action", (event) => events.push(event as CustomEvent));

    card._handleRestartDevice("aa:bb:cc:dd:ee:ff");

    expect(events).toHaveLength(1);
    const detail = events[0].detail as { target: { entity_id: string } };
    expect(detail.target.entity_id).toBe("button.office_ap_restart");
  });

  it("restart action does nothing when the node has no restart button", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _payload?: unknown;
      _handleRestartDevice: (nodeId: string) => void;
    };
    card._payload = {
      edges: [],
      node_types: {},
      node_entities: { "aa:bb:cc:dd:ee:ff": "device_tracker.office_ap" },
      related_entities: {
        "aa:bb:cc:dd:ee:ff": [
          { entity_id: "device_tracker.office_ap", domain: "device_tracker", state: "home" },
        ],
      },
    };
    const events: CustomEvent[] = [];
    element.addEventListener("hass-action", (event) => events.push(event as CustomEvent));

    card._handleRestartDevice("aa:bb:cc:dd:ee:ff");

    expect(events).toHaveLength(0);
  });

  it("resolves node name from text element in event path", () => {
    const text = document.createElement("text");
    text.textContent = "Path Text";
    const event = {
      composedPath: () => [text],
      clientX: 0,
      clientY: 0,
    } as unknown as MouseEvent;
    expect(resolveNodeId(event)).toBe("Path Text");
  });

  it("infers node name from group text", () => {
    const group = document.createElement("g");
    const text = document.createElement("text");
    text.textContent = "Group Text";
    group.appendChild(text);
    expect(inferNodeName(group)).toBe("Group Text");
  });

  it("ignores clicks while panning or on controls", () => {
    const state = createDefaultViewportState();
    const callbacks = spyCallbacks();
    const tooltip = document.createElement("div");
    const controls = document.createElement("div");
    controls.classList.add("unifi-network-map__controls");
    state.panMoved = true;
    onClick(
      { target: document.createElement("div"), composedPath: () => [] } as unknown as MouseEvent,
      state,
      nodeHandlers(),
      callbacks,
      tooltip,
    );
    state.panMoved = false;
    onClick(
      { target: controls, composedPath: () => [] } as unknown as MouseEvent,
      state,
      nodeHandlers(),
      callbacks,
      tooltip,
    );
    expect(callbacks.onNodeSelected).not.toHaveBeenCalled();
  });

  it("infers node name from id fallback", () => {
    const node = document.createElement("div");
    node.setAttribute("id", "switch-1");
    expect(inferNodeName(node)).toBe("switch-1");
  });
});

describe("unifi-network-map viewport and node helpers", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("marks selected elements on highlight", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const node = document.createElementNS("http://www.w3.org/2000/svg", "g");
    node.setAttribute("data-node-id", "aa:bb:cc:dd:ee:ff");
    svg.appendChild(node);
    highlightSelectedNode(svg, "aa:bb:cc:dd:ee:ff");
    expect(node.getAttribute("data-selected")).toBe("true");
  });

  it("shows tooltip on hover when not panning", () => {
    const state = createDefaultViewportState();
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const tooltip = document.createElement("div");
    const node = document.createElement("div");
    node.setAttribute("data-node-id", "aa:bb:cc:dd:ee:ff");
    onPointerMove(
      {
        composedPath: () => [node],
        clientX: 10,
        clientY: 20,
      } as unknown as PointerEvent,
      svg,
      state,
      viewportOptions(),
      nodeHandlers(),
      spyCallbacks(),
      tooltip,
    );
    expect(tooltip.hidden).toBe(false);
    expect(tooltip.textContent).toBe("aa:bb:cc:dd:ee:ff");
  });

  it("keeps tooltip hidden when hover target has no label", () => {
    const state = createDefaultViewportState();
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const tooltip = document.createElement("div");
    tooltip.hidden = false;
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => null;
    onPointerMove(
      { composedPath: () => [], clientX: 0, clientY: 0 } as unknown as PointerEvent,
      svg,
      state,
      viewportOptions(),
      nodeHandlers(),
      spyCallbacks(),
      tooltip,
    );
    document.elementFromPoint = originalElementFromPoint;
    expect(tooltip.hidden).toBe(true);
  });

  it("falls back to inferNodeName when resolve path has no match", () => {
    const target = document.createElement("div");
    target.setAttribute("data-node-id", "aa:bb:cc:dd:ee:ff");
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => target;
    const event = {
      composedPath: () => [],
      clientX: 0,
      clientY: 0,
    } as unknown as MouseEvent;
    expect(resolveNodeId(event)).toBe("aa:bb:cc:dd:ee:ff");
    document.elementFromPoint = originalElementFromPoint;
  });

  it("returns null when findNodeElement has no matches", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    expect(findNodeElement(svg, "Missing")).toBeNull();
  });

  it("marks selected elements for non-g tags", () => {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    markNodeSelected(rect);
    expect(rect.classList.contains("node--selected")).toBe(true);
  });

  it("infers node name from text element", () => {
    const text = document.createElement("text");
    text.textContent = "Text Node";
    expect(inferNodeName(text)).toBe("Text Node");
  });

  it("updates zoom based on wheel direction", () => {
    const state = createDefaultViewportState();
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const options = viewportOptions();
    const callbacks = spyCallbacks();
    onWheel(
      { deltaY: 1, preventDefault: () => undefined } as unknown as WheelEvent,
      svg,
      state,
      options,
      callbacks,
    );
    expect(state.viewTransform.scale).toBeLessThan(1);
    onWheel(
      { deltaY: -1, preventDefault: () => undefined } as unknown as WheelEvent,
      svg,
      state,
      options,
      callbacks,
    );
    expect(state.viewTransform.scale).toBeGreaterThan(0.5);
  });

  it("infers node names from aria labels", () => {
    const node = document.createElement("div");
    node.setAttribute("aria-label", "Switch A");
    expect(inferNodeName(node)).toBe("Switch A");
  });

  it("handles pointer up reset state", () => {
    const state = createDefaultViewportState();
    state.isPanning = true;
    state.panStart = { x: 1, y: 1 };
    state.activePointers = new Map([[1, { x: 10, y: 20 }]]);
    onPointerUp({ pointerId: 1 } as PointerEvent, state);
    expect(state.isPanning).toBe(false);
    expect(state.panStart).toBeNull();
    expect(state.activePointers.size).toBe(0);
  });

  it("returns early when clicking with no resolved node", () => {
    const state = createDefaultViewportState();
    const callbacks = spyCallbacks();
    const tooltip = document.createElement("div");
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => null;
    onClick(
      { composedPath: () => [], clientX: 0, clientY: 0 } as unknown as MouseEvent,
      state,
      nodeHandlers(),
      callbacks,
      tooltip,
    );
    document.elementFromPoint = originalElementFromPoint;
    expect(callbacks.onNodeSelected).not.toHaveBeenCalled();
  });

  it("finds node element by aria label and title", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const ariaGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    ariaGroup.setAttribute("aria-label", "Node B");
    svg.appendChild(ariaGroup);
    const titleGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
    title.textContent = "Node C";
    titleGroup.appendChild(title);
    svg.appendChild(titleGroup);
    expect(findNodeElement(svg, "Node B")).toBe(ariaGroup);
    expect(findNodeElement(svg, "Node C")).toBe(titleGroup);
  });

  it("ignores pointer down on control targets", () => {
    const state = createDefaultViewportState();
    const controls = document.createElement("div");
    controls.classList.add("unifi-network-map__controls");
    onPointerDown({ target: controls } as unknown as PointerEvent, state, null);
    expect(state.isPanning).toBe(false);
  });

  it("resolves node name from title element in event path", () => {
    const title = document.createElement("title");
    title.textContent = "Title Path";
    const event = {
      composedPath: () => [title],
      clientX: 0,
      clientY: 0,
    } as unknown as MouseEvent;
    expect(resolveNodeId(event)).toBe("Title Path");
  });

  it("returns null when infer node name has no matches", () => {
    expect(inferNodeName(null)).toBeNull();
    const empty = document.createElement("div");
    expect(inferNodeName(empty)).toBeNull();
  });

  it("finds node element by text content", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.textContent = "Node D";
    svg.appendChild(text);
    expect(findNodeElement(svg, "Node D")).toBe(text);
  });

  it("removes selection markers when clearing selection", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("data-selected", "true");
    group.classList.add("node--selected");
    svg.appendChild(group);
    clearNodeSelection(svg);
    expect(group.hasAttribute("data-selected")).toBe(false);
    expect(group.classList.contains("node--selected")).toBe(false);
  });

  it("handles pinch-to-zoom gesture", () => {
    const state = createDefaultViewportState();
    const options = viewportOptions();
    const callbacks = spyCallbacks();
    const handlers = nodeHandlers();
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const tooltip = document.createElement("div");
    const viewport = document.createElement("div");
    viewport.setPointerCapture = jest.fn();

    // Start with two fingers at distance 100
    onPointerDown(
      {
        pointerId: 1,
        clientX: 0,
        clientY: 0,
        target: viewport,
        currentTarget: viewport,
      } as unknown as PointerEvent,
      state,
      null,
    );
    onPointerDown(
      {
        pointerId: 2,
        clientX: 100,
        clientY: 0,
        target: viewport,
        currentTarget: viewport,
      } as unknown as PointerEvent,
      state,
      null,
    );

    expect(state.activePointers.size).toBe(2);
    expect(state.pinchStartDistance).toBe(100);
    expect(state.pinchStartScale).toBe(1);

    // Move fingers apart to distance 200 (2x zoom)
    onPointerMove(
      { pointerId: 1, clientX: 0, clientY: 0, target: viewport } as unknown as PointerEvent,
      svg,
      state,
      options,
      handlers,
      callbacks,
      tooltip,
    );
    onPointerMove(
      { pointerId: 2, clientX: 200, clientY: 0, target: viewport } as unknown as PointerEvent,
      svg,
      state,
      options,
      handlers,
      callbacks,
      tooltip,
    );

    expect(state.viewTransform.scale).toBe(2);
  });

  it("handles missing panel while wiring interactions", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    element.innerHTML = `
      <div class="unifi-network-map__viewport">
        <svg></svg>
        <div class="unifi-network-map__tooltip" hidden></div>
      </div>
    `;
    const card = element as unknown as { _wireInteractions: () => void };
    card._wireInteractions();
    expect(element.querySelector(".unifi-network-map__tooltip")).not.toBeNull();
  });

  it("infers node name from group title", () => {
    const group = document.createElement("g");
    const title = document.createElement("title");
    title.textContent = "Title Node";
    group.appendChild(title);
    expect(inferNodeName(group)).toBe("Title Node");
  });

  it("wires zoom and reset controls", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _svgContent?: string;
      _selection?: { selectedNode?: string };
    };
    card._svgContent = makeSvg("aa:bb:cc:dd:ee:01");
    card._selection = { selectedNode: "aa:bb:cc:dd:ee:01" };
    element.setConfig({ svg_url: "/map.svg" });
    const zoomIn = element.querySelector('[data-action="zoom-in"]') as HTMLButtonElement;
    const zoomOut = element.querySelector('[data-action="zoom-out"]') as HTMLButtonElement;
    const reset = element.querySelector('[data-action="reset"]') as HTMLButtonElement;
    const svg = element.querySelector("svg") as SVGElement;
    zoomIn.click();
    zoomOut.click();
    reset.click();
    expect(svg.getAttribute("viewBox")).toBe("0 0 100 100");
    // Reset only resets view, not selection
    expect(card._selection?.selectedNode).toBe("aa:bb:cc:dd:ee:01");
  });

  it("updates pan state on pointer move", () => {
    const state = createDefaultViewportState();
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const tooltip = document.createElement("div");
    const viewport = document.createElement("div");
    viewport.setPointerCapture = jest.fn();
    onPointerDown(
      {
        clientX: 10,
        clientY: 20,
        pointerId: 1,
        target: viewport,
        currentTarget: viewport,
      } as unknown as PointerEvent,
      state,
      null,
    );
    onPointerMove(
      { clientX: 30, clientY: 50 } as unknown as PointerEvent,
      svg,
      state,
      viewportOptions(),
      nodeHandlers(),
      spyCallbacks(),
      tooltip,
    );
    expect(state.viewTransform.x).toBe(20);
    expect(state.viewTransform.y).toBe(30);
    expect(state.panMoved).toBe(true);
  });

  it("applies cursor styles based on pan state", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    applyTransform(svg, { x: 0, y: 0, scale: 1 }, true);
    expect(svg.style.cursor).toBe("grabbing");
    applyTransform(svg, { x: 0, y: 0, scale: 1 }, false);
    expect(svg.style.cursor).toBe("grab");
  });

  it("clamps zoom levels within bounds", () => {
    const state = createDefaultViewportState();
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const options = viewportOptions();
    const callbacks = spyCallbacks();
    applyZoom(svg, 10, state, options, callbacks);
    expect(state.viewTransform.scale).toBe(5);
    applyZoom(svg, -10, state, options, callbacks);
    expect(state.viewTransform.scale).toBe(0.5);
  });

  it("resolves node name from title element in svg", () => {
    const title = document.createElement("title");
    title.textContent = "Core Switch";
    const group = document.createElement("g");
    group.appendChild(title);
    const event = {
      composedPath: () => [title],
      clientX: 0,
      clientY: 0,
    } as unknown as MouseEvent;
    expect(resolveNodeId(event)).toBe("Core Switch");
  });
});

describe("filter bar", () => {
  afterEach(resetTestDom);

  it("counts device types correctly", () => {
    const { countDeviceTypes } = require("../card/ui/filter-bar");

    const nodeTypes = {
      GW: "gateway",
      SW1: "switch",
      SW2: "switch",
      AP1: "ap",
      AP2: "ap",
      AP3: "ap",
      Client: "client",
      Unknown: "unknown_type",
    };

    const counts = countDeviceTypes(nodeTypes);

    expect(counts.gateway).toBe(1);
    expect(counts.switch).toBe(2);
    expect(counts.ap).toBe(3);
    expect(counts.client).toBe(1);
    expect(counts.other).toBe(1);
  });

  it("toggles filter state", () => {
    const { createFilterState, toggleFilter } = require("../card/interaction/filter-state");

    const initial = createFilterState();
    expect(initial.client).toBe(true);

    const toggled = toggleFilter(initial, "client");
    expect(toggled.client).toBe(false);
    expect(toggled.gateway).toBe(true);

    const toggledBack = toggleFilter(toggled, "client");
    expect(toggledBack.client).toBe(true);
  });

  it("normalizes device types", () => {
    const { normalizeDeviceType } = require("../card/interaction/filter-state");

    expect(normalizeDeviceType("gateway")).toBe("gateway");
    expect(normalizeDeviceType("switch")).toBe("switch");
    expect(normalizeDeviceType("ap")).toBe("ap");
    expect(normalizeDeviceType("client")).toBe("client");
    expect(normalizeDeviceType("unknown")).toBe("other");
    expect(normalizeDeviceType("random_type")).toBe("other");
  });

  it("uses emoji icons for dark theme", () => {
    const { nodeTypeIcon } = require("../card/ui/icons");

    const icon = nodeTypeIcon("gateway", "dark");
    expect(icon).toContain("unifi-icon--emoji");
    expect(icon).toContain("🌐");
    expect(icon).not.toContain("<svg");
  });

  it("uses emoji icons for light theme", () => {
    const { nodeTypeIcon } = require("../card/ui/icons");

    const icon = nodeTypeIcon("switch", "light");
    expect(icon).toContain("unifi-icon--emoji");
    expect(icon).toContain("🔀");
    expect(icon).not.toContain("<svg");
  });

  it("uses SVG heroicons for unifi theme", () => {
    const { nodeTypeIcon } = require("../card/ui/icons");

    const icon = nodeTypeIcon("gateway", "unifi");
    expect(icon).toContain("unifi-icon--hero");
    expect(icon).toContain("<svg");
    expect(icon).toContain("viewBox");
    expect(icon).not.toContain("🌐");
  });

  it("uses SVG heroicons for unifi-dark theme", () => {
    const { nodeTypeIcon } = require("../card/ui/icons");

    const icon = nodeTypeIcon("ap", "unifi-dark");
    expect(icon).toContain("unifi-icon--hero");
    expect(icon).toContain("<svg");
    expect(icon).toContain("viewBox");
    expect(icon).not.toContain("📶");
  });
});
