import type { DeviceType, DeviceTypeFilters } from "../core/types";

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
  switch (type) {
    case "gateway":
    case "switch":
    case "ap":
    case "client":
      return type;
    default:
      return "other";
  }
}
