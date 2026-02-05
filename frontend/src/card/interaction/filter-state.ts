import type { DeviceType, DeviceTypeFilters } from "../core/types";

/**
 * Client subtypes from unifi-network-maps 1.5.0.
 * These are all filtered together under the "client" filter button.
 */
export const CLIENT_SUBTYPES = [
  "client",
  "camera",
  "tv",
  "phone",
  "printer",
  "nas",
  "speaker",
  "game_console",
  "iot",
  "client_cluster",
] as const;

export function createFilterState(): DeviceTypeFilters {
  return {
    gateway: true,
    switch: true,
    ap: true,
    client: true,
    other: true,
  };
}

export function toggleFilter(state: DeviceTypeFilters, type: DeviceType): DeviceTypeFilters {
  return {
    ...state,
    [type]: !state[type],
  };
}

export function enableFilter(state: DeviceTypeFilters, type: DeviceType): DeviceTypeFilters {
  if (state[type]) {
    return state;
  }
  return {
    ...state,
    [type]: true,
  };
}

export function normalizeDeviceType(type: string): DeviceType {
  if (type === "gateway" || type === "switch" || type === "ap") {
    return type;
  }
  if ((CLIENT_SUBTYPES as readonly string[]).includes(type)) {
    return "client";
  }
  return "other";
}
