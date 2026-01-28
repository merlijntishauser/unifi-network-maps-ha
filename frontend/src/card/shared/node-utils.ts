import type { MapPayload } from "../core/types";

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
