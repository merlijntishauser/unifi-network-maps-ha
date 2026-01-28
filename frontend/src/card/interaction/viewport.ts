import type { Edge, Point, ViewBox, ViewTransform } from "../core/types";
import type { IconName } from "../ui/icons";
import { findEdgeFromTarget, renderEdgeTooltip } from "../data/svg";
import type { LocalizeFunc } from "../shared/localize";
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

const BASE_VIEWBOXES = new WeakMap<SVGElement, ViewBox>();

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
  svg.style.cursor = isPanning ? "grabbing" : "grab";
  svg.style.transform = "none";

  const baseViewBox = getBaseViewBox(svg);
  if (!baseViewBox) {
    return;
  }

  const viewportSize = getViewportSize(svg);
  const viewBox = computeViewBox(transform, baseViewBox, viewportSize);
  setViewBox(svg, viewBox);
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
  updateActivePointer(state, event);
  if (handlePinchZoom(svg, state, options, callbacks)) {
    return;
  }
  if (handlePan(svg, state, event, options, callbacks)) {
    return;
  }
  handleHover(event, options, handlers, callbacks, tooltip);
}

function updateActivePointer(state: ViewportState, event: PointerEvent): void {
  if (state.activePointers.has(event.pointerId)) {
    state.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  }
}

function handlePinchZoom(
  svg: SVGElement,
  state: ViewportState,
  options: ViewportOptions,
  callbacks: ViewportCallbacks,
): boolean {
  if (
    state.activePointers.size !== 2 ||
    state.pinchStartDistance === null ||
    state.pinchStartScale === null
  ) {
    return false;
  }
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
  return true;
}

function handlePan(
  svg: SVGElement,
  state: ViewportState,
  event: PointerEvent,
  options: ViewportOptions,
  callbacks: ViewportCallbacks,
): boolean {
  if (!state.isPanning || !state.panStart) {
    return false;
  }
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
  return true;
}

function handleHover(
  event: PointerEvent,
  options: ViewportOptions,
  handlers: ViewportHandlers,
  callbacks: ViewportCallbacks,
  tooltip: HTMLElement,
): void {
  const edge = handlers.findEdge(event.target as Element);
  if (edge) {
    showEdgeTooltip(edge, event, options, handlers, callbacks, tooltip);
    return;
  }

  callbacks.onHoverEdge(null);
  const label = handlers.resolveNodeName(event);
  if (!label) {
    callbacks.onHoverNode(null);
    hideTooltip(tooltip);
    return;
  }
  showNodeTooltip(label, event, options, callbacks, tooltip);
}

function showEdgeTooltip(
  edge: Edge,
  event: PointerEvent,
  options: ViewportOptions,
  handlers: ViewportHandlers,
  callbacks: ViewportCallbacks,
  tooltip: HTMLElement,
): void {
  callbacks.onHoverEdge(edge);
  callbacks.onHoverNode(null);
  tooltip.hidden = false;
  tooltip.classList.add("unifi-network-map__tooltip--edge");
  tooltip.innerHTML = handlers.renderEdgeTooltip(edge);
  tooltip.style.transform = "none";
  positionTooltip(tooltip, event, options.tooltipOffsetPx);
}

function showNodeTooltip(
  label: string,
  event: PointerEvent,
  options: ViewportOptions,
  callbacks: ViewportCallbacks,
  tooltip: HTMLElement,
): void {
  callbacks.onHoverNode(label);
  tooltip.hidden = false;
  tooltip.classList.remove("unifi-network-map__tooltip--edge");
  tooltip.textContent = label;
  tooltip.style.transform = "none";
  positionTooltip(tooltip, event, options.tooltipOffsetPx);
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

  // First try normal resolution via composedPath
  let label = handlers.resolveNodeName(event);

  // If that fails (e.g., due to shadow DOM or slotted content issues),
  // manually find the SVG element at the click coordinates
  if (!label) {
    const viewport =
      (event.currentTarget as HTMLElement) ||
      (event.target as HTMLElement)?.closest(".unifi-network-map__viewport");
    const svg = viewport?.querySelector("svg");
    if (svg) {
      label = findNodeAtPoint(svg, event.clientX, event.clientY);
    }
  }

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
  // First try normal resolution via composedPath
  let nodeName = handlers.resolveNodeName(event);

  // If that fails, manually find the SVG element at the click coordinates
  if (!nodeName) {
    const viewport =
      (event.currentTarget as HTMLElement) ||
      (event.target as HTMLElement)?.closest(".unifi-network-map__viewport");
    const svg = viewport?.querySelector("svg");
    if (svg) {
      nodeName = findNodeAtPoint(svg, event.clientX, event.clientY);
    }
  }

  if (!nodeName) {
    return;
  }
  event.preventDefault();
  callbacks.onOpenContextMenu(event.clientX, event.clientY, nodeName);
}

function findNodeAtPoint(svg: SVGElement, clientX: number, clientY: number): string | null {
  const nodes = svg.querySelectorAll("[data-node-id]");
  for (const node of nodes) {
    const rect = node.getBoundingClientRect();
    if (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    ) {
      return node.getAttribute("data-node-id");
    }
  }
  return null;
}

function hideTooltip(tooltip: HTMLElement): void {
  tooltip.hidden = true;
  tooltip.classList.remove("unifi-network-map__tooltip--edge");
}

function positionTooltip(tooltip: HTMLElement, event: PointerEvent, offset: number): void {
  const viewport =
    (event.currentTarget as HTMLElement | null) ?? tooltip.closest(".unifi-network-map__viewport");
  const viewportRect = viewport?.getBoundingClientRect();
  if (!viewportRect) {
    tooltip.style.left = `${event.clientX + offset}px`;
    tooltip.style.top = `${event.clientY + offset}px`;
    return;
  }

  // Calculate cursor position relative to viewport
  const cursorX = event.clientX - viewportRect.left;
  const cursorY = event.clientY - viewportRect.top;

  // Initial position (to the right and below cursor)
  let left = cursorX + offset;
  let top = cursorY + offset;

  // Get tooltip dimensions (need to briefly show it to measure)
  const tooltipRect = tooltip.getBoundingClientRect();
  const tooltipWidth = tooltipRect.width || 150; // fallback width
  const tooltipHeight = tooltipRect.height || 40; // fallback height

  // Check right boundary - flip to left of cursor if needed
  if (left + tooltipWidth > viewportRect.width) {
    left = cursorX - tooltipWidth - offset;
  }

  // Check bottom boundary - flip to above cursor if needed
  if (top + tooltipHeight > viewportRect.height) {
    top = cursorY - tooltipHeight - offset;
  }

  // Ensure tooltip doesn't go off left edge
  if (left < 0) {
    left = offset;
  }

  // Ensure tooltip doesn't go off top edge
  if (top < 0) {
    top = offset;
  }

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function isControlTarget(target: Element | null, controls: HTMLElement | null): boolean {
  // Skip processing for control buttons and filter bar
  if (target?.closest(".filter-bar") || target?.closest(".filter-bar-container")) {
    return true;
  }
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

function getBaseViewBox(svg: SVGElement): ViewBox | null {
  const cached = BASE_VIEWBOXES.get(svg);
  if (cached) return cached;

  const fromAttribute = parseViewBox(svg.getAttribute("viewBox"));
  const base = fromAttribute ?? buildFallbackViewBox(svg);
  if (!base) return null;

  BASE_VIEWBOXES.set(svg, base);
  if (!fromAttribute) {
    setViewBox(svg, base);
  }
  return base;
}

function parseViewBox(value: string | null): ViewBox | null {
  if (!value) return null;
  const parts = value
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return null;
  }
  return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
}

function buildFallbackViewBox(svg: SVGElement): ViewBox | null {
  return viewBoxFromSizeAttributes(svg) ?? viewBoxFromBoundingBox(svg) ?? viewBoxFromRect(svg);
}

function viewBoxFromSizeAttributes(svg: SVGElement): ViewBox | null {
  const width = readNumericAttribute(svg, "width");
  const height = readNumericAttribute(svg, "height");
  if (!width || !height) return null;
  return { x: 0, y: 0, width, height };
}

function readNumericAttribute(svg: SVGElement, name: string): number | null {
  const value = svg.getAttribute(name);
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function viewBoxFromBoundingBox(svg: SVGElement): ViewBox | null {
  try {
    const bbox = (svg as SVGGraphicsElement).getBBox();
    if (!bbox.width || !bbox.height) return null;
    return { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height };
  } catch {
    return null;
  }
}

function viewBoxFromRect(svg: SVGElement): ViewBox | null {
  const rect = svg.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  return { x: 0, y: 0, width: rect.width, height: rect.height };
}

function getViewportSize(svg: SVGElement): { width: number; height: number } {
  const rect = svg.getBoundingClientRect();
  return { width: rect.width, height: rect.height };
}

function computeViewBox(
  transform: ViewTransform,
  base: ViewBox,
  viewportSize: { width: number; height: number },
): ViewBox {
  const scale = transform.scale || 1;
  const width = base.width / scale;
  const height = base.height / scale;
  const xOffset = panOffset(transform.x, base.width, viewportSize.width, scale);
  const yOffset = panOffset(transform.y, base.height, viewportSize.height, scale);
  return { x: base.x - xOffset, y: base.y - yOffset, width, height };
}

function panOffset(panPx: number, baseSize: number, viewportSize: number, scale: number): number {
  if (!viewportSize || !scale) return 0;
  return (panPx * baseSize) / (viewportSize * scale);
}

function setViewBox(svg: SVGElement, viewBox: ViewBox): void {
  const values = [viewBox.x, viewBox.y, viewBox.width, viewBox.height].map((value) =>
    Number(value.toFixed(2)),
  );
  svg.setAttribute("viewBox", values.join(" "));
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

export function createDefaultViewportHandlers(
  edges: Edge[] | undefined,
  getIcon: (name: IconName) => string,
  localize: LocalizeFunc,
): ViewportHandlers {
  return {
    resolveNodeName: (event) => resolveNodeName(event),
    findEdge: (target) => (edges ? findEdgeFromTarget(target, edges) : null),
    renderEdgeTooltip: (edge) => renderEdgeTooltip(edge, getIcon, localize),
  };
}
