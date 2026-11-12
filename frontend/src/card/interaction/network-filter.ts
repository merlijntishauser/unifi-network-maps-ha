import type { CardConfig, Edge, MapPayload } from "../core/types";
import { normalizeDeviceType } from "./filter-state";

/** Per-card network filter from `vlan_filter` / `ssid_filter` (#321). */
export type NetworkFilter = {
  vlans: Set<number>;
  ssids: Set<string>;
};

/** Returns null when the card config sets no usable network filter. */
export function parseNetworkFilter(config: CardConfig): NetworkFilter | null {
  const vlans = new Set(parseVlanIds(config.vlan_filter));
  const ssids = new Set(parseSsids(config.ssid_filter));
  return vlans.size > 0 || ssids.size > 0 ? { vlans, ssids } : null;
}

/** Valid VLAN IDs (1-4094) from a single value or a list; anything else is dropped. */
export function parseVlanIds(value: unknown): number[] {
  return toList(value)
    .map(toVlanId)
    .filter((id): id is number => id !== null);
}

/** Non-empty, trimmed SSID names from a single value or a list. */
export function parseSsids(value: unknown): string[] {
  return toList(value)
    .filter((item): item is string => typeof item === "string" && item.trim() !== "")
    .map((item) => item.trim());
}

/**
 * Nodes that stay visible under a network filter: the matching clients and
 * every node on their path to a gateway, plus the gateways themselves.
 */
export function networkVisibleNodes(payload: MapPayload, filter: NetworkFilter): Set<string> {
  const nodeTypes = payload.node_types ?? {};
  const gateways = Object.keys(nodeTypes).filter((id) => nodeTypes[id] === "gateway");
  const matches = matchingClients(payload, filter);
  if (gateways.length === 0) {
    return new Set([...infrastructureNodes(nodeTypes), ...matches]);
  }
  const parents = parentsTowardGateways(payload.edges ?? [], nodeTypes, gateways);
  const visible = new Set(gateways);
  for (const client of matches) {
    addPathToGateway(client, parents, visible);
  }
  return visible;
}

function toList(value: unknown): unknown[] {
  if (value === undefined || value === null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function toVlanId(value: unknown): number | null {
  const id = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return typeof id === "number" && Number.isInteger(id) && id >= 1 && id <= 4094 ? id : null;
}

function isClient(type: string | undefined): boolean {
  return type !== undefined && normalizeDeviceType(type) === "client";
}

function infrastructureNodes(nodeTypes: Record<string, string>): string[] {
  return Object.keys(nodeTypes).filter((id) => !isClient(nodeTypes[id]));
}

function matchingClients(payload: MapPayload, filter: NetworkFilter): string[] {
  const nodeTypes = payload.node_types ?? {};
  const vlans = payload.node_vlans ?? {};
  const ssids = payload.node_ssids ?? {};
  return Object.keys(nodeTypes).filter((id) => {
    if (!isClient(nodeTypes[id])) {
      return false;
    }
    const vlan = vlans[id];
    const ssid = ssids[id];
    return (vlan != null && filter.vlans.has(vlan)) || (ssid != null && filter.ssids.has(ssid));
  });
}

/** Breadth-first from the gateways; clients are leaves and never relay a path. */
function parentsTowardGateways(
  edges: Edge[],
  nodeTypes: Record<string, string>,
  gateways: string[],
): Map<string, string> {
  const neighbors = buildNeighbors(edges);
  const parents = new Map<string, string>();
  const seen = new Set(gateways);
  const queue = [...gateways];
  while (queue.length > 0) {
    const node = queue.shift() as string;
    if (isClient(nodeTypes[node])) {
      continue;
    }
    for (const next of neighbors.get(node) ?? []) {
      if (!seen.has(next)) {
        seen.add(next);
        parents.set(next, node);
        queue.push(next);
      }
    }
  }
  return parents;
}

function buildNeighbors(edges: Edge[]): Map<string, string[]> {
  const neighbors = new Map<string, string[]>();
  const link = (from: string, to: string) => {
    const list = neighbors.get(from);
    if (list) {
      list.push(to);
    } else {
      neighbors.set(from, [to]);
    }
  };
  for (const edge of edges) {
    link(edge.left, edge.right);
    link(edge.right, edge.left);
  }
  return neighbors;
}

function addPathToGateway(node: string, parents: Map<string, string>, visible: Set<string>): void {
  let current: string | undefined = node;
  while (current !== undefined && !visible.has(current)) {
    visible.add(current);
    current = parents.get(current);
  }
}
