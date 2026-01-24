import type { CardConfig } from "../core/types";

export type IconTheme = NonNullable<CardConfig["theme"]>;

export type IconName =
  | "network"
  | "hint"
  | "node-gateway"
  | "node-switch"
  | "node-ap"
  | "node-client"
  | "node-other"
  | "action-details"
  | "action-copy"
  | "menu-select"
  | "menu-details"
  | "menu-copy"
  | "menu-restart"
  | "edge-wired"
  | "edge-wireless"
  | "edge-port"
  | "edge-poe"
  | "edge-speed"
  | "edge-channel"
  | "domain-device_tracker"
  | "domain-switch"
  | "domain-sensor"
  | "domain-binary_sensor"
  | "domain-light"
  | "domain-button"
  | "domain-update"
  | "domain-image"
  | "domain-default";

const EMOJI_ICONS: Record<IconName, string> = {
  network: "📡",
  hint: "💡",
  "node-gateway": "🌐",
  "node-switch": "🔀",
  "node-ap": "📶",
  "node-client": "💻",
  "node-other": "📦",
  "action-details": "📊",
  "action-copy": "📋",
  "menu-select": "👆",
  "menu-details": "📊",
  "menu-copy": "📋",
  "menu-restart": "🔄",
  "edge-wired": "🔗",
  "edge-wireless": "📶",
  "edge-port": "🔌",
  "edge-poe": "⚡",
  "edge-speed": "🚀",
  "edge-channel": "📡",
  "domain-device_tracker": "📍",
  "domain-switch": "🔘",
  "domain-sensor": "📊",
  "domain-binary_sensor": "⚡",
  "domain-light": "💡",
  "domain-button": "🔲",
  "domain-update": "🔄",
  "domain-image": "🖼️",
  "domain-default": "📦",
};

const HERO_SVGS: Record<IconName, string> = {
  network: svg(
    ["M2.5 8.5a13 13 0 0119 0", "M5.5 11.5a9 9 0 0113 0", "M8.5 14.5a5 5 0 017 0"],
    [{ cx: 12, cy: 18, r: 1 }],
  ),
  hint: svg([
    "M12 3a6 6 0 00-3.6 10.8c.4.3.6.8.6 1.3V17a1 1 0 001 1h4a1 1 0 001-1v-1.9c0-.5.2-1 .6-1.3A6 6 0 0012 3z",
    "M9 20h6",
  ]),
  "node-gateway": svg(
    ["M3 12h18", "M12 3c-2.8 0-5 4-5 9s2.2 9 5 9 5-4 5-9-2.2-9-5-9z"],
    [{ cx: 12, cy: 12, r: 9 }],
  ),
  "node-switch": svg(["M7 7h10l-3-3m3 3-3 3", "M17 17H7l3-3m-3 3 3 3"]),
  "node-ap": svg(
    ["M4 9a11 11 0 0116 0", "M7 12a7 7 0 0110 0", "M10 15a3 3 0 014 0"],
    [{ cx: 12, cy: 18, r: 1 }],
  ),
  "node-client": svg(["M4 6h16v9H4z", "M10 19h4", "M12 15v4"]),
  "node-other": svg(["M12 3 4 7 12 11 20 7 12 3z", "M4 7v10l8 4 8-4V7", "M12 11v10"]),
  "action-details": svg(["M4 4h16v16H4z", "M8 16v-4", "M12 16v-7", "M16 16v-2"]),
  "action-copy": svg(["M8 4h8v3H8z", "M6 7h12v13H6z"]),
  "menu-select": svg(["M4 4l8 16 2-6 6-2-16-8z"]),
  "menu-details": svg(["M4 4h16v16H4z", "M8 16v-4", "M12 16v-7", "M16 16v-2"]),
  "menu-copy": svg(["M8 4h8v3H8z", "M6 7h12v13H6z"]),
  "menu-restart": svg(["M3 12a9 9 0 0115-6l2-2v6h-6l2-2a6 6 0 10 1 8"]),
  "edge-wired": svg(["M8 12a3 3 0 013-3h2", "M16 12a3 3 0 01-3 3h-2", "M10 12h4"]),
  "edge-wireless": svg(
    ["M4 9a11 11 0 0116 0", "M7 12a7 7 0 0110 0", "M10 15a3 3 0 014 0"],
    [{ cx: 12, cy: 18, r: 1 }],
  ),
  "edge-port": svg(["M9 7v4", "M15 7v4", "M7 11h10", "M12 11v7", "M9 18h6"]),
  "edge-poe": svg(["M13 2L6 14h5l-1 8 7-12h-5l1-8z"]),
  "edge-speed": svg(["M4 14l6-6 4 4 6-6", "M16 6h4v4"]),
  "edge-channel": svg(["M4 18v-2", "M8 18v-4", "M12 18v-6", "M16 18v-8", "M20 18v-10"]),
  "domain-device_tracker": svg(
    ["M12 21c4-5 6-8 6-11a6 6 0 10-12 0c0 3 2 6 6 11z"],
    [{ cx: 12, cy: 10, r: 2 }],
  ),
  "domain-switch": svg(["M5 12h14", "M8 12a3 3 0 100-6", "M16 12a3 3 0 110 6"]),
  "domain-sensor": svg(["M4 16h4v-4H4z", "M10 16h4V8h-4z", "M16 16h4v-7h-4z"]),
  "domain-binary_sensor": svg(["M13 2L6 14h5l-1 8 7-12h-5l1-8z"]),
  "domain-light": svg([
    "M12 3a6 6 0 00-3.6 10.8c.4.3.6.8.6 1.3V17a1 1 0 001 1h4a1 1 0 001-1v-1.9c0-.5.2-1 .6-1.3A6 6 0 0012 3z",
    "M9 20h6",
  ]),
  "domain-button": svg(["M6 6h12v12H6z"], [{ cx: 12, cy: 12, r: 2 }]),
  "domain-update": svg(["M3 12a9 9 0 0115-6l2-2v6h-6l2-2a6 6 0 10 1 8"]),
  "domain-image": svg(["M4 6h16v12H4z", "M8 14l3-3 3 3 3-4 3 4"], [{ cx: 9, cy: 10, r: 1.5 }]),
  "domain-default": svg(["M12 3 4 7 12 11 20 7 12 3z", "M4 7v10l8 4 8-4V7", "M12 11v10"]),
};

export function iconMarkup(name: IconName, theme: IconTheme): string {
  const isUnifi = theme === "unifi" || theme === "unifi-dark";
  if (!isUnifi) {
    return `<span class="unifi-icon unifi-icon--emoji" aria-hidden="true">${EMOJI_ICONS[name]}</span>`;
  }
  return `<span class="unifi-icon unifi-icon--hero" aria-hidden="true">${HERO_SVGS[name]}</span>`;
}

export function nodeTypeIcon(nodeType: string, theme: IconTheme): string {
  switch (nodeType) {
    case "gateway":
      return iconMarkup("node-gateway", theme);
    case "switch":
      return iconMarkup("node-switch", theme);
    case "ap":
      return iconMarkup("node-ap", theme);
    case "client":
      return iconMarkup("node-client", theme);
    default:
      return iconMarkup("node-other", theme);
  }
}

export function domainIcon(domain: string, theme: IconTheme): string {
  const nameMap: Record<string, IconName> = {
    device_tracker: "domain-device_tracker",
    switch: "domain-switch",
    sensor: "domain-sensor",
    binary_sensor: "domain-binary_sensor",
    light: "domain-light",
    button: "domain-button",
    update: "domain-update",
    image: "domain-image",
  };
  return iconMarkup(nameMap[domain] ?? "domain-default", theme);
}

function svg(paths: string[], circles: Array<{ cx: number; cy: number; r: number }> = []): string {
  const pathMarkup = paths.map((d) => `<path d="${d}"></path>`).join("");
  const circleMarkup = circles
    .map((circle) => `<circle cx="${circle.cx}" cy="${circle.cy}" r="${circle.r}"></circle>`)
    .join("");
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${pathMarkup}${circleMarkup}</svg>`;
}
