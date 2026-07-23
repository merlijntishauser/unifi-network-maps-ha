import type { MapPayload } from "../core/types";

export function getNodeType(payload: MapPayload | undefined, nodeId: string): string {
  return payload?.node_types?.[nodeId] ?? "unknown";
}

/**
 * Since payload schema 2.0 node ids ARE MAC addresses, so the MAC of a known
 * node is its own id. This only checks that the node exists in the payload.
 */
export function nodeMacFromId(payload: MapPayload | undefined, nodeId: string): string | null {
  if (!payload?.node_types?.[nodeId]) return null;
  return nodeId;
}

export function getNodeModel(payload: MapPayload | undefined, nodeId: string): string | null {
  const details = payload?.device_details?.[nodeId];
  if (!details) return null;
  // Prefer model_name (friendly name) over model code
  return details.model_name ?? details.model ?? null;
}

export function getNodeEntityId(payload: MapPayload | undefined, nodeId: string): string | null {
  return (
    payload?.node_entities?.[nodeId] ??
    payload?.client_entities?.[nodeId] ??
    payload?.device_entities?.[nodeId] ??
    null
  );
}

export function getNodeIpFromPayload(
  payload: MapPayload | undefined,
  nodeName: string,
): string | null {
  const direct = getDirectNodeIp(payload, nodeName);
  if (direct) {
    return direct;
  }
  return getRelatedNodeIp(payload, nodeName);
}

function getDirectNodeIp(payload: MapPayload | undefined, nodeName: string): string | null {
  return payload?.client_ips?.[nodeName] ?? payload?.device_ips?.[nodeName] ?? null;
}

function getRelatedNodeIp(payload: MapPayload | undefined, nodeName: string): string | null {
  const related = payload?.related_entities?.[nodeName];
  if (!related) {
    return null;
  }
  return related.find((entity) => entity.ip)?.ip ?? null;
}
