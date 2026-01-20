import { escapeHtml } from "./sanitize";
import type { Edge } from "../types";

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

export function renderEdgeTooltip(edge: Edge): string {
  const connectionType = edge.wireless ? "Wireless" : "Wired";
  const icon = edge.wireless ? "📶" : "🔗";
  const rows: string[] = [];
  rows.push(
    `<div class="tooltip-edge__title">${escapeHtml(edge.left)} ↔ ${escapeHtml(edge.right)}</div>`,
  );
  rows.push(
    `<div class="tooltip-edge__row"><span class="tooltip-edge__icon">${icon}</span><span class="tooltip-edge__label">${connectionType}</span></div>`,
  );
  if (edge.label) {
    rows.push(
      `<div class="tooltip-edge__row"><span class="tooltip-edge__icon">🔌</span><span class="tooltip-edge__label">${escapeHtml(edge.label)}</span></div>`,
    );
  }
  if (edge.poe) {
    rows.push(
      `<div class="tooltip-edge__row"><span class="tooltip-edge__icon">⚡</span><span class="tooltip-edge__label">PoE Powered</span></div>`,
    );
  }
  if (edge.speed) {
    rows.push(
      `<div class="tooltip-edge__row"><span class="tooltip-edge__icon">🚀</span><span class="tooltip-edge__label">${formatSpeed(edge.speed)}</span></div>`,
    );
  }
  if (edge.channel) {
    rows.push(
      `<div class="tooltip-edge__row"><span class="tooltip-edge__icon">📡</span><span class="tooltip-edge__label">${formatChannel(edge.channel)}</span></div>`,
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

function formatSpeed(speedMbps: number): string {
  if (speedMbps >= 1000) {
    const gbps = (speedMbps / 1000).toFixed(1).replace(/\.0$/, "");
    return `${gbps} Gbps`;
  }
  return `${speedMbps} Mbps`;
}

function formatChannel(channel: number): string {
  const band = channelBand(channel);
  const suffix = band ? ` (${band})` : "";
  return `Channel ${channel}${suffix}`;
}

function channelBand(channel: number): string | null {
  if (channel >= 1 && channel <= 14) {
    return "2.4GHz";
  }
  if (channel >= 36 && channel <= 177) {
    return "5GHz";
  }
  if (channel >= 1) {
    return "6GHz";
  }
  return null;
}
