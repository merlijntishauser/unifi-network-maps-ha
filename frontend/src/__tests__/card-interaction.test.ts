import type { ConfigurableCard } from "./test-helpers";
import { makeSvg, resetTestDom } from "./test-helpers";

describe("unifi-network-map card interaction", () => {
  afterEach(resetTestDom);

  it("resolves node name from text element in event path", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as { _resolveNodeName: (event: MouseEvent) => string | null };
    const text = document.createElement("text");
    text.textContent = "Path Text";
    const event = {
      composedPath: () => [text],
      clientX: 0,
      clientY: 0,
    } as unknown as MouseEvent;
    expect(card._resolveNodeName(event)).toBe("Path Text");
  });

  it("infers node name from group text", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _inferNodeName: (target: Element | null) => string | null;
    };
    const group = document.createElement("g");
    const text = document.createElement("text");
    text.textContent = "Group Text";
    group.appendChild(text);
    expect(card._inferNodeName(group)).toBe("Group Text");
  });

  it("adds a hitbox path for edge hover", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _payload?: unknown;
      _annotateEdges: (svg: SVGElement) => void;
    };
    card._payload = { edges: [{ left: "A", right: "B" }], node_types: {} };
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("stroke", "#000");
    path.setAttribute("d", "M0 0 L10 10");
    path.setAttribute("data-edge-left", "A");
    path.setAttribute("data-edge-right", "B");
    svg.appendChild(path);
    card._annotateEdges(svg);

    const hitbox = svg.querySelector('path[data-edge-hitbox="true"]');
    expect(hitbox).not.toBeNull();
    expect(hitbox?.getAttribute("data-edge-left")).toBe("A");
    expect(hitbox?.getAttribute("data-edge-right")).toBe("B");
  });

  it("ignores clicks while panning or on controls", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _onClick: (event: MouseEvent, tooltip: HTMLElement) => void;
      _panMoved: boolean;
      _selection?: { selectedNode?: string };
    };
    const tooltip = document.createElement("div");
    const controls = document.createElement("div");
    controls.classList.add("unifi-network-map__controls");
    card._panMoved = true;
    card._onClick(
      { target: document.createElement("div"), composedPath: () => [] } as unknown as MouseEvent,
      tooltip,
    );
    card._panMoved = false;
    card._onClick({ target: controls, composedPath: () => [] } as unknown as MouseEvent, tooltip);
    expect(card._selection?.selectedNode).toBeUndefined();
  });

  it("infers node name from id fallback", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _inferNodeName: (target: Element | null) => string | null;
    };
    const node = document.createElement("div");
    node.setAttribute("id", "switch-1");
    expect(card._inferNodeName(node)).toBe("switch-1");
  });
});

describe("unifi-network-map editor", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("marks selected elements on highlight", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _highlightSelectedNode: (svg: SVGElement) => void;
      _selection?: { selectedNode?: string };
    };
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const node = document.createElementNS("http://www.w3.org/2000/svg", "g");
    node.setAttribute("data-node-id", "Node A");
    svg.appendChild(node);
    card._selection = { selectedNode: "Node A" };
    card._highlightSelectedNode(svg);
    expect(node.getAttribute("data-selected")).toBe("true");
  });

  it("shows tooltip on hover when not panning", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _onPointerMove: (event: PointerEvent, svg: SVGElement, tooltip: HTMLElement) => void;
    };
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const tooltip = document.createElement("div");
    const node = document.createElement("div");
    node.setAttribute("data-node-id", "Hover Node");
    card._onPointerMove(
      {
        composedPath: () => [node],
        clientX: 10,
        clientY: 20,
      } as unknown as PointerEvent,
      svg,
      tooltip,
    );
    expect(tooltip.hidden).toBe(false);
    expect(tooltip.textContent).toBe("Hover Node");
  });

  it("keeps tooltip hidden when hover target has no label", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _onPointerMove: (event: PointerEvent, svg: SVGElement, tooltip: HTMLElement) => void;
    };
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const tooltip = document.createElement("div");
    tooltip.hidden = false;
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => null;
    card._onPointerMove(
      { composedPath: () => [], clientX: 0, clientY: 0 } as unknown as PointerEvent,
      svg,
      tooltip,
    );
    document.elementFromPoint = originalElementFromPoint;
    expect(tooltip.hidden).toBe(true);
  });

  it("falls back to inferNodeName when resolve path has no match", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as { _resolveNodeName: (event: MouseEvent) => string | null };
    const target = document.createElement("div");
    target.setAttribute("data-node-id", "Fallback Node");
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => target;
    const event = {
      composedPath: () => [],
      clientX: 0,
      clientY: 0,
    } as unknown as MouseEvent;
    expect(card._resolveNodeName(event)).toBe("Fallback Node");
    document.elementFromPoint = originalElementFromPoint;
  });

  it("returns null when findNodeElement has no matches", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _findNodeElement: (svg: SVGElement, name: string) => Element | null;
    };
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    expect(card._findNodeElement(svg, "Missing")).toBeNull();
  });

  it("marks selected elements for non-g tags", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as { _markNodeSelected: (el: Element) => void };
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    card._markNodeSelected(rect);
    expect(rect.classList.contains("node--selected")).toBe(true);
  });

  it("infers node name from text element", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _inferNodeName: (target: Element | null) => string | null;
    };
    const text = document.createElement("text");
    text.textContent = "Text Node";
    expect(card._inferNodeName(text)).toBe("Text Node");
  });

  it("updates zoom based on wheel direction", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _onWheel: (event: WheelEvent, svg: SVGElement) => void;
      _viewTransform: { scale: number };
    };
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    card._onWheel({ deltaY: 1, preventDefault: () => undefined } as unknown as WheelEvent, svg);
    expect(card._viewTransform.scale).toBeLessThan(1);
    card._onWheel({ deltaY: -1, preventDefault: () => undefined } as unknown as WheelEvent, svg);
    expect(card._viewTransform.scale).toBeGreaterThan(0.5);
  });

  it("infers node names from aria labels", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _inferNodeName: (target: Element | null) => string | null;
    };
    const node = document.createElement("div");
    node.setAttribute("aria-label", "Switch A");
    expect(card._inferNodeName(node)).toBe("Switch A");
  });

  it("handles pointer up reset state", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _onPointerUp: (event: { pointerId: number }) => void;
      _isPanning: boolean;
      _panStart: object | null;
      _activePointers: Map<number, { x: number; y: number }>;
    };
    card._isPanning = true;
    card._panStart = { x: 1, y: 1 };
    card._activePointers = new Map([[1, { x: 10, y: 20 }]]);
    card._onPointerUp({ pointerId: 1 });
    expect(card._isPanning).toBe(false);
    expect(card._panStart).toBeNull();
    expect(card._activePointers.size).toBe(0);
  });

  it("returns early when clicking with no resolved node", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _onClick: (event: MouseEvent, tooltip: HTMLElement) => void;
      _selection?: { selectedNode?: string };
    };
    const tooltip = document.createElement("div");
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => null;
    card._onClick(
      { composedPath: () => [], clientX: 0, clientY: 0 } as unknown as MouseEvent,
      tooltip,
    );
    document.elementFromPoint = originalElementFromPoint;
    expect(card._selection?.selectedNode).toBeUndefined();
  });

  it("finds node element by aria label and title", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _findNodeElement: (svg: SVGElement, name: string) => Element | null;
    };
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const ariaGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    ariaGroup.setAttribute("aria-label", "Node B");
    svg.appendChild(ariaGroup);
    const titleGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
    title.textContent = "Node C";
    titleGroup.appendChild(title);
    svg.appendChild(titleGroup);
    expect(card._findNodeElement(svg, "Node B")).toBe(ariaGroup);
    expect(card._findNodeElement(svg, "Node C")).toBe(titleGroup);
  });

  it("ignores pointer down on control targets", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _onPointerDown: (event: PointerEvent) => void;
      _isPanning: boolean;
    };
    const controls = document.createElement("div");
    controls.classList.add("unifi-network-map__controls");
    card._onPointerDown({ target: controls } as unknown as PointerEvent);
    expect(card._isPanning).toBe(false);
  });

  it("formats edge tooltip with speed and channel", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _renderEdgeTooltip: (edge: {
        left: string;
        right: string;
        wireless?: boolean | null;
        speed?: number | null;
        channel?: number | null;
      }) => string;
    };
    const html = card._renderEdgeTooltip({
      left: "AP",
      right: "Switch",
      wireless: true,
      speed: 1000,
      channel: 36,
    });
    expect(html).toContain("1 Gbps");
    expect(html).toContain("Channel 36 (5GHz)");
  });

  it("resolves node name from title element in event path", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as { _resolveNodeName: (event: MouseEvent) => string | null };
    const title = document.createElement("title");
    title.textContent = "Title Path";
    const event = {
      composedPath: () => [title],
      clientX: 0,
      clientY: 0,
    } as unknown as MouseEvent;
    expect(card._resolveNodeName(event)).toBe("Title Path");
  });

  it("returns null when infer node name has no matches", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _inferNodeName: (target: Element | null) => string | null;
    };
    expect(card._inferNodeName(null)).toBeNull();
    const empty = document.createElement("div");
    expect(card._inferNodeName(empty)).toBeNull();
  });

  it("finds node element by text content", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _findNodeElement: (svg: SVGElement, name: string) => Element | null;
    };
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.textContent = "Node D";
    svg.appendChild(text);
    expect(card._findNodeElement(svg, "Node D")).toBe(text);
  });

  it("removes selection markers when clearing selection", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as { _clearNodeSelection: (svg: SVGElement) => void };
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("data-selected", "true");
    group.classList.add("node--selected");
    svg.appendChild(group);
    card._clearNodeSelection(svg);
    expect(group.hasAttribute("data-selected")).toBe(false);
    expect(group.classList.contains("node--selected")).toBe(false);
  });

  it("handles pinch-to-zoom gesture", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _onPointerDown: (event: {
        pointerId: number;
        clientX: number;
        clientY: number;
        target: Element;
        currentTarget: HTMLElement;
      }) => void;
      _onPointerMove: (
        event: { pointerId: number; clientX: number; clientY: number; target: Element },
        svg: SVGElement,
        tooltip: HTMLElement,
      ) => void;
      _viewTransform: { x: number; y: number; scale: number };
      _activePointers: Map<number, { x: number; y: number }>;
      _pinchStartDistance: number | null;
      _pinchStartScale: number | null;
    };
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const tooltip = document.createElement("div");
    const viewport = document.createElement("div");
    viewport.setPointerCapture = jest.fn();

    // Start with two fingers at distance 100
    card._onPointerDown({
      pointerId: 1,
      clientX: 0,
      clientY: 0,
      target: viewport,
      currentTarget: viewport,
    });
    card._onPointerDown({
      pointerId: 2,
      clientX: 100,
      clientY: 0,
      target: viewport,
      currentTarget: viewport,
    });

    expect(card._activePointers.size).toBe(2);
    expect(card._pinchStartDistance).toBe(100);
    expect(card._pinchStartScale).toBe(1);

    // Move fingers apart to distance 200 (2x zoom)
    card._onPointerMove({ pointerId: 1, clientX: 0, clientY: 0, target: viewport }, svg, tooltip);
    card._onPointerMove({ pointerId: 2, clientX: 200, clientY: 0, target: viewport }, svg, tooltip);

    expect(card._viewTransform.scale).toBe(2);
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
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _inferNodeName: (target: Element | null) => string | null;
    };
    const group = document.createElement("g");
    const title = document.createElement("title");
    title.textContent = "Title Node";
    group.appendChild(title);
    expect(card._inferNodeName(group)).toBe("Title Node");
  });

  it("wires zoom and reset controls", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _svgContent?: string;
      _selection?: { selectedNode?: string };
    };
    card._svgContent = makeSvg("Gateway");
    card._selection = { selectedNode: "Gateway" };
    element.setConfig({ svg_url: "/map.svg" });
    const zoomIn = element.querySelector('[data-action="zoom-in"]') as HTMLButtonElement;
    const zoomOut = element.querySelector('[data-action="zoom-out"]') as HTMLButtonElement;
    const reset = element.querySelector('[data-action="reset"]') as HTMLButtonElement;
    const svg = element.querySelector("svg") as SVGElement;
    zoomIn.click();
    zoomOut.click();
    reset.click();
    expect(svg.getAttribute("viewBox")).toBe("0 0 100 100");
    expect(card._selection?.selectedNode).toBeUndefined();
  });

  it("updates pan state on pointer move", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _onPointerDown: (event: PointerEvent) => void;
      _onPointerMove: (event: PointerEvent, svg: SVGElement, tooltip: HTMLElement) => void;
      _viewTransform: { x: number; y: number; scale: number };
      _panMoved: boolean;
    };
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const tooltip = document.createElement("div");
    const viewport = document.createElement("div");
    viewport.setPointerCapture = jest.fn();
    card._onPointerDown({
      clientX: 10,
      clientY: 20,
      pointerId: 1,
      target: viewport,
      currentTarget: viewport,
    } as unknown as PointerEvent);
    card._onPointerMove({ clientX: 30, clientY: 50 } as unknown as PointerEvent, svg, tooltip);
    expect(card._viewTransform.x).toBe(20);
    expect(card._viewTransform.y).toBe(30);
    expect(card._panMoved).toBe(true);
  });

  it("applies cursor styles based on pan state", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _applyTransform: (svg: SVGElement) => void;
      _isPanning: boolean;
    };
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    card._isPanning = true;
    card._applyTransform(svg);
    expect(svg.style.cursor).toBe("grabbing");
    card._isPanning = false;
    card._applyTransform(svg);
    expect(svg.style.cursor).toBe("grab");
  });

  it("clamps zoom levels within bounds", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _applyZoom: (delta: number, svg: SVGElement) => void;
      _viewTransform: { scale: number };
    };
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    card._applyZoom(10, svg);
    expect(card._viewTransform.scale).toBe(4);
    card._applyZoom(-10, svg);
    expect(card._viewTransform.scale).toBe(0.5);
  });

  it("resolves node name from title element in svg", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as { _resolveNodeName: (event: MouseEvent) => string | null };
    const title = document.createElement("title");
    title.textContent = "Core Switch";
    const group = document.createElement("g");
    group.appendChild(title);
    const event = {
      composedPath: () => [title],
      clientX: 0,
      clientY: 0,
    } as unknown as MouseEvent;
    expect(card._resolveNodeName(event)).toBe("Core Switch");
  });
});
