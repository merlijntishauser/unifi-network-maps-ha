/**
 * Shared entity-state formatting used by the side panel and the entity modal.
 * Keeps the superset behavior of both former copies: sensor states get
 * timestamp/MAC/numeric handling including unit inference from the entity id.
 */

export type FormattedState = {
  display: string;
  normalized: string;
};

export const SIMPLE_STATES = ["on", "off", "home", "not_home", "unavailable", "unknown"];
export const ISO_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T/;
export const MAC_ADDRESS_PATTERN = /^([0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2}$/;
export const NUMERIC_PATTERN = /^-?\d+(\.\d+)?$/;

export function formatEntityState(params: {
  state: string | null | undefined;
  domain: string;
  entityId: string;
}): FormattedState {
  const state = params.state ?? "unavailable";
  const lowerState = state.toLowerCase();

  if (SIMPLE_STATES.includes(lowerState)) {
    return { display: capitalizeFirst(state), normalized: lowerState };
  }

  const sensorResult = formatSensorState(state, params.domain, params.entityId);
  if (sensorResult) return sensorResult;

  const domainResult = formatDomainSpecificState(state, params.domain);
  if (domainResult) return domainResult;

  return formatFallbackState(state);
}

function formatSensorState(state: string, domain: string, entityId: string): FormattedState | null {
  if (domain !== "sensor" && domain !== "binary_sensor") return null;

  if (ISO_TIMESTAMP_PATTERN.test(state)) {
    return { display: formatRelativeTime(state), normalized: "default" };
  }
  if (MAC_ADDRESS_PATTERN.test(state)) {
    return { display: state.substring(0, 8) + "…", normalized: "default" };
  }
  if (NUMERIC_PATTERN.test(state)) {
    return formatNumericState(state, entityId);
  }
  return null;
}

function formatNumericState(state: string, entityId: string): FormattedState {
  const num = parseFloat(state);
  const unit = inferUnitFromEntityId(entityId);

  if (Math.abs(num) >= 1000000) {
    return { display: formatLargeNumber(num) + unit, normalized: "default" };
  }

  // Format to reasonable precision
  const formatted = Number.isInteger(num) ? num.toString() : num.toFixed(1);
  return { display: formatted + unit, normalized: "default" };
}

const UNIT_PATTERNS: Array<{ patterns: string[]; unit: string; exclude?: string[] }> = [
  { patterns: ["utilization", "percent", "_pct"], unit: "%" },
  { patterns: ["temperature", "_temp"], unit: "°C" },
  { patterns: ["_power"], unit: " W", exclude: ["power_mode"] },
  { patterns: ["_voltage"], unit: " V" },
  { patterns: ["_current"], unit: " A", exclude: ["current_"] },
  { patterns: ["_speed", "bandwidth"], unit: " Mbps" },
  { patterns: ["_bytes", "_data"], unit: " B" },
  { patterns: ["uptime"], unit: " s" },
];

function inferUnitFromEntityId(entityId: string): string {
  const objectId = entityId.split(".")[1] ?? entityId;
  const lower = objectId.toLowerCase();

  for (const { patterns, unit, exclude } of UNIT_PATTERNS) {
    const matches = patterns.some((p) => lower.includes(p));
    const excluded = exclude?.some((e) => lower.includes(e)) ?? false;
    if (matches && !excluded) {
      return unit;
    }
  }

  return "";
}

function formatDomainSpecificState(state: string, domain: string): FormattedState | null {
  if (domain === "button") {
    return { display: "—", normalized: "default" };
  }
  if (domain === "update") {
    if (state === "off") return { display: "Up to date", normalized: "off" };
    if (state === "on") return { display: "Update", normalized: "on" };
  }
  return null;
}

function formatFallbackState(state: string): FormattedState {
  if (state.length > 12) {
    return { display: state.substring(0, 10) + "…", normalized: "default" };
  }
  return { display: capitalizeFirst(state), normalized: state.toLowerCase() };
}

export function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function formatRelativeTime(iso: string): string {
  try {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  } catch {
    return "—";
  }
}

export function formatLargeNumber(num: number): string {
  if (Math.abs(num) >= 1000000000) {
    return (num / 1000000000).toFixed(1) + "B";
  }
  if (Math.abs(num) >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (Math.abs(num) >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}
