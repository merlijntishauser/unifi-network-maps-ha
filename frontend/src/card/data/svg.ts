import { escapeHtml } from "./sanitize";
import type { Edge } from "../core/types";
import type { IconName } from "../ui/icons";
import type { LocalizeFunc } from "../shared/localize";

export function annotateEdges(svg: SVGElement, edges: Edge[]): void {
  const edgesByKey = buildEdgeLookup(edges);
  const paths = svg.querySelectorAll("path[data-edge-left][data-edge-right]");
  paths.forEach((path) => {
    const left = path.getAttribute("data-edge-left");
    const right = path.getAttribute("data-edge-right");
    if (!left || !right) return;
    const edge = edgesByKey.get(edgeKey(left, right));
    if (!edge) return;
    path.setAttribute("data-edge", "true");
    ensureEdgeHitbox(path as SVGPathElement, edge);
  });
  annotateEdgeLabels(svg);
}

function annotateEdgeLabels(svg: SVGElement): void {
  // Annotate mermaid edge labels with data attributes for filtering
  const edgeLabels = svg.querySelectorAll(".edgeLabel");
  edgeLabels.forEach((label) => annotateElementWithEdge(label, svg));

  // Also annotate standalone PoE icons (⚡) and other edge-related text
  annotatePoeIcons(svg);
}

function annotateElementWithEdge(element: Element, svg: SVGElement): void {
  // Skip if already annotated
  if (element.hasAttribute("data-edge-left")) return;

  // Try to find the associated edge by examining the element's position/context
  const edgePath = findNearestEdgePath(element, svg);
  if (edgePath) {
    const left = edgePath.getAttribute("data-edge-left");
    const right = edgePath.getAttribute("data-edge-right");
    if (left && right) {
      element.setAttribute("data-edge-left", left);
      element.setAttribute("data-edge-right", right);
    }
  }
}

function annotatePoeIcons(svg: SVGElement): void {
  // Find all text elements that might be PoE icons
  const textElements = svg.querySelectorAll("text");
  for (const text of textElements) {
    const content = text.textContent?.trim() ?? "";
    // Check for lightning bolt emoji or "PoE" text
    if (content === "⚡" || content === "⚡️" || content.toLowerCase() === "poe") {
      annotateElementWithEdge(text, svg);
      // Also annotate parent group if present
      const parentGroup = text.closest("g");
      if (parentGroup && !parentGroup.hasAttribute("data-edge-left")) {
        const left = text.getAttribute("data-edge-left");
        const right = text.getAttribute("data-edge-right");
        if (left && right) {
          parentGroup.setAttribute("data-edge-left", left);
          parentGroup.setAttribute("data-edge-right", right);
        }
      }
    }
  }
}

function findNearestEdgePath(label: Element, svg: SVGElement): Element | null {
  return (
    findEdgePathInGroup(label) ??
    findEdgePathByLabelText(label, svg) ??
    findEdgePathByPosition(label, svg)
  );
}

function getLabelPosition(element: Element): { x: number; y: number } | null {
  // Try to get position from transform attribute on element or ancestors
  let current: Element | null = element;
  while (current && current.tagName !== "svg") {
    const transform = current.getAttribute("transform");
    if (transform) {
      const translateMatch = transform.match(/translate\s*\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/);
      if (translateMatch) {
        return { x: parseFloat(translateMatch[1]), y: parseFloat(translateMatch[2]) };
      }
    }
    current = current.parentElement;
  }

  // Try to get position from x/y attributes (common for text elements)
  const x = element.getAttribute("x");
  const y = element.getAttribute("y");
  if (x && y) {
    return { x: parseFloat(x), y: parseFloat(y) };
  }

  // Try getBBox if available (works in browser, not in JSDOM)
  try {
    const svgEl = element as SVGGraphicsElement;
    if (typeof svgEl.getBBox === "function") {
      const bbox = svgEl.getBBox();
      return { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 };
    }
  } catch {
    // getBBox not available
  }

  return null;
}

function findClosestEdgeByPosition(svg: SVGElement, pos: { x: number; y: number }): Element | null {
  const paths = svg.querySelectorAll("path[data-edge-left][data-edge-right]");
  let closest: Element | null = null;
  let minDist = Infinity;

  for (const path of paths) {
    const pathEl = path as SVGPathElement;
    try {
      const length = pathEl.getTotalLength();
      // Check multiple points along the path for better matching
      for (const ratio of [0.25, 0.5, 0.75]) {
        const point = pathEl.getPointAtLength(length * ratio);
        const dist = Math.hypot(point.x - pos.x, point.y - pos.y);
        if (dist < minDist) {
          minDist = dist;
          closest = path;
        }
      }
    } catch {
      // SVG method not available, skip
    }
  }

  // Only return if reasonably close (within 150px - edges can be long)
  return minDist < 150 ? closest : null;
}

function findEdgePathInGroup(label: Element): Element | null {
  const parentGroup = label.closest("g");
  if (!parentGroup) {
    return null;
  }
  const siblingPath = parentGroup.querySelector("path[data-edge-left][data-edge-right]");
  if (siblingPath) {
    return siblingPath;
  }
  const grandparent = parentGroup.parentElement;
  if (!grandparent) {
    return null;
  }
  return grandparent.querySelector("path[data-edge-left][data-edge-right]");
}

function findEdgePathByLabelText(label: Element, svg: SVGElement): Element | null {
  const labelText = label.textContent?.trim() ?? "";
  if (!labelText) {
    return null;
  }
  const paths = svg.querySelectorAll("path[data-edge-left][data-edge-right]");
  for (const path of paths) {
    const left = path.getAttribute("data-edge-left") ?? "";
    const right = path.getAttribute("data-edge-right") ?? "";
    if (labelText.includes(left) || labelText.includes(right)) {
      return path;
    }
  }
  return null;
}

function findEdgePathByPosition(label: Element, svg: SVGElement): Element | null {
  const labelTransform = getLabelPosition(label);
  if (!labelTransform) {
    return null;
  }
  return findClosestEdgeByPosition(svg, labelTransform);
}

export function findEdgeFromTarget(target: Element | null, edges: Edge[]): Edge | null {
  if (!target) return null;
  const edgePath = target.closest("path[data-edge], path[data-edge-hitbox]");
  if (!edgePath) return null;
  const left = edgePath.getAttribute("data-edge-left");
  const right = edgePath.getAttribute("data-edge-right");
  if (!left || !right) return null;
  const lookup = buildEdgeLookup(edges);
  return lookup.get(edgeKey(left, right)) ?? null;
}

export function renderEdgeTooltip(
  edge: Edge,
  getIcon: (name: IconName) => string,
  localize: LocalizeFunc,
): string {
  const connectionType = edge.wireless
    ? localize("edge_tooltip.wireless")
    : localize("edge_tooltip.wired");
  const icon = edge.wireless ? getIcon("edge-wireless") : getIcon("edge-wired");
  const rows: string[] = [];
  rows.push(
    `<div class="tooltip-edge__title">${escapeHtml(edge.left)} ↔ ${escapeHtml(edge.right)}</div>`,
  );
  rows.push(
    `<div class="tooltip-edge__row"><span class="tooltip-edge__icon">${icon}</span><span class="tooltip-edge__label">${connectionType}</span></div>`,
  );
  if (edge.label) {
    rows.push(
      `<div class="tooltip-edge__row"><span class="tooltip-edge__icon">${getIcon("edge-port")}</span><span class="tooltip-edge__label">${escapeHtml(edge.label)}</span></div>`,
    );
  }
  if (edge.poe) {
    rows.push(
      `<div class="tooltip-edge__row"><span class="tooltip-edge__icon">${getIcon("edge-poe")}</span><span class="tooltip-edge__label">${localize("edge_tooltip.poe")}</span></div>`,
    );
  }
  if (edge.speed) {
    rows.push(
      `<div class="tooltip-edge__row"><span class="tooltip-edge__icon">${getIcon("edge-speed")}</span><span class="tooltip-edge__label">${formatSpeed(edge.speed, localize)}</span></div>`,
    );
  }
  if (edge.channel) {
    rows.push(
      `<div class="tooltip-edge__row"><span class="tooltip-edge__icon">${getIcon("edge-channel")}</span><span class="tooltip-edge__label">${formatChannel(edge.channel, localize)}</span></div>`,
    );
  }
  return rows.join("");
}

function buildEdgeLookup(edges: Edge[]): Map<string, Edge> {
  const map = new Map<string, Edge>();
  edges.forEach((edge) => {
    map.set(edgeKey(edge.left, edge.right), edge);
  });
  return map;
}

function edgeKey(left: string, right: string): string {
  return [left.trim(), right.trim()].sort().join("|");
}

function ensureEdgeHitbox(path: SVGPathElement, edge: Edge): void {
  const next = path.nextElementSibling;
  if (next?.getAttribute("data-edge-hitbox") === "true") {
    return;
  }
  const hitbox = path.cloneNode(false) as SVGPathElement;
  hitbox.setAttribute("data-edge-hitbox", "true");
  hitbox.setAttribute("data-edge-left", edge.left);
  hitbox.setAttribute("data-edge-right", edge.right);
  hitbox.setAttribute("stroke", "transparent");
  hitbox.setAttribute("fill", "none");
  path.after(hitbox);
}

function formatSpeed(speedMbps: number, localize: LocalizeFunc): string {
  if (speedMbps >= 1000) {
    const gbps = (speedMbps / 1000).toFixed(1).replace(/\.0$/, "");
    return localize("edge_tooltip.speed_gbps", { speed: gbps });
  }
  return localize("edge_tooltip.speed_mbps", { speed: speedMbps });
}

function formatChannel(channel: number, localize: LocalizeFunc): string {
  const band = channelBand(channel, localize);
  const suffix = band ? ` (${band})` : "";
  return localize("edge_tooltip.channel", { channel, suffix });
}

function channelBand(channel: number, localize: LocalizeFunc): string | null {
  if (channel >= 1 && channel <= 14) {
    return localize("edge_tooltip.band_24");
  }
  if (channel >= 36 && channel <= 177) {
    return localize("edge_tooltip.band_5");
  }
  if (channel >= 1) {
    return localize("edge_tooltip.band_6");
  }
  return null;
}
