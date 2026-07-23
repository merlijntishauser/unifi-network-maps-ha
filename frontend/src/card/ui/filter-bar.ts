import type { DeviceType } from "../core/types";
import { CLIENT_SUBTYPES } from "../interaction/filter-state";

export function countDeviceTypes(nodeTypes: Record<string, string>): Record<DeviceType, number> {
  const counts: Record<DeviceType, number> = {
    gateway: 0,
    switch: 0,
    ap: 0,
    client: 0,
    other: 0,
  };

  for (const type of Object.values(nodeTypes)) {
    if (type === "gateway" || type === "switch" || type === "ap") {
      counts[type]++;
    } else if ((CLIENT_SUBTYPES as readonly string[]).includes(type)) {
      counts.client++;
    } else {
      counts.other++;
    }
  }

  return counts;
}
