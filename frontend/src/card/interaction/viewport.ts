import type { Edge, Point, ViewTransform } from "../core/types";
import { findEdgeFromTarget, renderEdgeTooltip } from "../data/svg";
import { resolveNodeName } from "./node";

export type ViewportState = {
  viewTransform: ViewTransform;
  isPanning: boolean;
  panStart: Point | null;
  panMoved: boolean;
  activePointers: Map<number, Point>;
  pinchStartDistance: number | null;
  pinchStartScale: number | null;
};

export type ViewportOptions = {
  minPanMovementThreshold: number;
  zoomIncrement: number;
  minZoomScale: number;
  maxZoomScale: number;
  tooltipOffsetPx: number;
};

export type ViewportHandlers = {
  resolveNodeName: (event: MouseEvent | PointerEvent) => string | null;
  findEdge: (target: Element | null) => Edge | null;
  renderEdgeTooltip: (edge: Edge) => string;
};

export type ViewportCallbacks = {
  onNodeSelected: (nodeName: string) => void;
  onHoverEdge: (edge: Edge | null) => void;
  onHoverNode: (nodeName: string | null) => void;
  onOpenContextMenu: (x: number, y: number, nodeName: string) => void;
  onUpdateTransform: (transform: ViewTransform) => void;
};

export type ViewportBindings = {
  tooltip: HTMLElement;
  controls: HTMLElement | null;
};

export function bindViewportInteractions(params: {
  viewport: HTMLElement;
  svg: SVGElement;
  state: ViewportState;
  options: ViewportOptions;
  handlers: ViewportHandlers;
  callbacks: ViewportCallbacks;
  bindings: ViewportBindings;
}): void {
  const { viewport, svg, state, options, handlers, callbacks, bindings } = params;

  viewport.onwheel = (event) => onWheel(event, svg, state, options, callbacks);
  viewport.onpointerdown = (event) => onPointerDown(event, state, bindings.controls);
  viewport.onpointermove = (event) =>
    onPointerMove(event, svg, state, options, handlers, callbacks, bindings.tooltip);
  viewport.onpointerup = (event) => onPointerUp(event, state);
  viewport.onpointercancel = (event) => onPointerUp(event, state);
  viewport.onpointerleave = () => {
    callbacks.onHoverEdge(null);
    callbacks.onHoverNode(null);
    hideTooltip(bindings.tooltip);
  };
  viewport.onclick = (event) => onClick(event, state, handlers, callbacks, bindings.tooltip);
  viewport.oncontextmenu = (event) => onContextMenu(event, state, handlers, callbacks);
}

export function applyTransform(
  svg: SVGElement,
  transform: ViewTransform,
  isPanning: boolean,
): void {
  svg.style.transformOrigin = "0 0";
  svg.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`;
  svg.style.cursor = isPanning ? "grabbing" : "grab";
}

export function applyZoom(
  svg: SVGElement,
  delta: number,
  state: ViewportState,
  options: ViewportOptions,
  callbacks: ViewportCallbacks,
): void {
  const nextScale = Math.min(
    options.maxZoomScale,
    Math.max(options.minZoomScale, state.viewTransform.scale + delta),
  );
  state.viewTransform.scale = Number(nextScale.toFixed(2));
  callbacks.onUpdateTransform(state.viewTransform);
  applyTransform(svg, state.viewTransform, state.isPanning);
}

export function resetPan(
  svg: SVGElement,
  state: ViewportState,
  callbacks: ViewportCallbacks,
): void {
  state.viewTransform = { x: 0, y: 0, scale: 1 };
  callbacks.onUpdateTransform(state.viewTransform);
  applyTransform(svg, state.viewTransform, state.isPanning);
}

export function onWheel(
  event: WheelEvent,
  svg: SVGElement,
  state: ViewportState,
  options: ViewportOptions,
  callbacks: ViewportCallbacks,
): void {
  event.preventDefault();
  const delta = event.deltaY > 0 ? -options.zoomIncrement : options.zoomIncrement;
  applyZoom(svg, delta, state, options, callbacks);
}

export function onPointerDown(
  event: PointerEvent,
  state: ViewportState,
  controls: HTMLElement | null,
): void {
  if (isControlTarget(event.target as Element | null, controls)) {
    return;
  }
  state.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);

  if (state.activePointers.size === 2) {
    const [p1, p2] = Array.from(state.activePointers.values());
    state.pinchStartDistance = getDistance(p1, p2);
    state.pinchStartScale = state.viewTransform.scale;
    state.isPanning = false;
    state.panStart = null;
  } else if (state.activePointers.size === 1) {
    state.isPanning = true;
    state.panMoved = false;
    state.panStart = {
      x: event.clientX - state.viewTransform.x,
      y: event.clientY - state.viewTransform.y,
    };
  }
}

export function onPointerMove(
  event: PointerEvent,
  svg: SVGElement,
  state: ViewportState,
  options: ViewportOptions,
  handlers: ViewportHandlers,
  callbacks: ViewportCallbacks,
  tooltip: HTMLElement,
): void {
  if (state.activePointers.has(event.pointerId)) {
    state.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  }

  if (
    state.activePointers.size === 2 &&
    state.pinchStartDistance !== null &&
    state.pinchStartScale !== null
  ) {
    const [p1, p2] = Array.from(state.activePointers.values());
    const currentDistance = getDistance(p1, p2);
    const scaleFactor = currentDistance / state.pinchStartDistance;
    const newScale = Math.min(
      options.maxZoomScale,
      Math.max(options.minZoomScale, state.pinchStartScale * scaleFactor),
    );
    state.viewTransform.scale = Number(newScale.toFixed(2));
    state.panMoved = true;
    callbacks.onUpdateTransform(state.viewTransform);
    applyTransform(svg, state.viewTransform, state.isPanning);
    return;
  }

  if (state.isPanning && state.panStart) {
    const nextX = event.clientX - state.panStart.x;
    const nextY = event.clientY - state.panStart.y;
    if (
      Math.abs(nextX - state.viewTransform.x) > options.minPanMovementThreshold ||
      Math.abs(nextY - state.viewTransform.y) > options.minPanMovementThreshold
    ) {
      state.panMoved = true;
    }
    state.viewTransform.x = nextX;
    state.viewTransform.y = nextY;
    callbacks.onUpdateTransform(state.viewTransform);
    applyTransform(svg, state.viewTransform, state.isPanning);
    return;
  }

  const edge = handlers.findEdge(event.target as Element);
  if (edge) {
    callbacks.onHoverEdge(edge);
    callbacks.onHoverNode(null);
    tooltip.hidden = false;
    tooltip.classList.add("unifi-network-map__tooltip--edge");
    tooltip.innerHTML = handlers.renderEdgeTooltip(edge);
    tooltip.style.transform = "none";
    tooltip.style.left = `${event.clientX + options.tooltipOffsetPx}px`;
    tooltip.style.top = `${event.clientY + options.tooltipOffsetPx}px`;
    return;
  }

  callbacks.onHoverEdge(null);
  const label = handlers.resolveNodeName(event);
  if (!label) {
    callbacks.onHoverNode(null);
    hideTooltip(tooltip);
    return;
  }

  callbacks.onHoverNode(label);
  tooltip.hidden = false;
  tooltip.classList.remove("unifi-network-map__tooltip--edge");
  tooltip.textContent = label;
  tooltip.style.transform = "none";
  tooltip.style.left = `${event.clientX + options.tooltipOffsetPx}px`;
  tooltip.style.top = `${event.clientY + options.tooltipOffsetPx}px`;
}

export function onPointerUp(event: PointerEvent, state: ViewportState): void {
  state.activePointers.delete(event.pointerId);

  if (state.activePointers.size < 2) {
    state.pinchStartDistance = null;
    state.pinchStartScale = null;
  }

  if (state.activePointers.size === 0) {
    state.isPanning = false;
    state.panStart = null;
  }
}

export function onClick(
  event: MouseEvent,
  state: ViewportState,
  handlers: ViewportHandlers,
  callbacks: ViewportCallbacks,
  tooltip: HTMLElement,
): void {
  if (isControlTarget(event.target as Element | null, null)) {
    return;
  }
  if (state.panMoved) {
    return;
  }
  const label = handlers.resolveNodeName(event);
  if (!label) {
    return;
  }
  callbacks.onNodeSelected(label);
  hideTooltip(tooltip);
}

function onContextMenu(
  event: MouseEvent,
  state: ViewportState,
  handlers: ViewportHandlers,
  callbacks: ViewportCallbacks,
): void {
  const nodeName = handlers.resolveNodeName(event);
  if (!nodeName) {
    return;
  }
  event.preventDefault();
  callbacks.onOpenContextMenu(event.clientX, event.clientY, nodeName);
}

function hideTooltip(tooltip: HTMLElement): void {
  tooltip.hidden = true;
  tooltip.classList.remove("unifi-network-map__tooltip--edge");
}

function isControlTarget(target: Element | null, controls: HTMLElement | null): boolean {
  if (!controls) {
    return Boolean(target?.closest(".unifi-network-map__controls"));
  }
  return (
    controls.contains(target as Node) || Boolean(target?.closest(".unifi-network-map__controls"))
  );
}

function getDistance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function createDefaultViewportState(): ViewportState {
  return {
    viewTransform: { x: 0, y: 0, scale: 1 },
    isPanning: false,
    panStart: null,
    panMoved: false,
    activePointers: new Map(),
    pinchStartDistance: null,
    pinchStartScale: null,
  };
}

export function createDefaultViewportHandlers(edges: Edge[] | undefined): ViewportHandlers {
  return {
    resolveNodeName: (event) => resolveNodeName(event),
    findEdge: (target) => (edges ? findEdgeFromTarget(target, edges) : null),
    renderEdgeTooltip: (edge) => renderEdgeTooltip(edge),
  };
}
