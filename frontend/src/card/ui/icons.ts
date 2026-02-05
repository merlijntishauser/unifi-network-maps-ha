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
  | "node-camera"
  | "node-tv"
  | "node-phone"
  | "node-printer"
  | "node-nas"
  | "node-speaker"
  | "node-game_console"
  | "node-iot"
  | "node-client_cluster"
  | "action-details"
  | "action-copy"
  | "action-ports"
  | "menu-details"
  | "menu-copy"
  | "menu-copy-ip"
  | "menu-restart"
  | "menu-ports"
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
  "node-camera": "📷",
  "node-tv": "📺",
  "node-phone": "📱",
  "node-printer": "🖨️",
  "node-nas": "💾",
  "node-speaker": "🔊",
  "node-game_console": "🎮",
  "node-iot": "🔌",
  "node-client_cluster": "👥",
  "action-details": "📊",
  "action-copy": "📋",
  "action-ports": "🔌",
  "menu-details": "📊",
  "menu-copy": "📋",
  "menu-copy-ip": "📄",
  "menu-restart": "🔄",
  "menu-ports": "🔌",
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
  "node-camera": svg(
    ["M3 9a2 2 0 012-2h1l1-2h10l1 2h1a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"],
    [{ cx: 12, cy: 13, r: 3 }],
  ),
  "node-tv": svg(["M4 7h16v10H4z", "M9 21l3-4 3 4"]),
  "node-phone": svg([
    "M7 2h10a1 1 0 011 1v18a1 1 0 01-1 1H7a1 1 0 01-1-1V3a1 1 0 011-1z",
    "M11 18h2",
  ]),
  "node-printer": svg([
    "M6 9V2h12v7",
    "M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2",
    "M6 14h12v8H6z",
  ]),
  "node-nas": svg(["M4 5h16v14H4z", "M4 9h16", "M4 13h16", "M7 11h1", "M7 15h1"]),
  "node-speaker": svg(
    ["M6 5h12v14a2 2 0 01-2 2H8a2 2 0 01-2-2V5z", "M6 5a2 2 0 012-2h8a2 2 0 012 2"],
    [{ cx: 12, cy: 14, r: 3 }],
  ),
  "node-game_console": svg([
    "M6 11h4m-2-2v4",
    "M15 13h.01",
    "M18 11h.01",
    "M4 8h16a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4a2 2 0 012-2z",
  ]),
  "node-iot": svg(
    [
      "M12 2v6",
      "M12 22v-6",
      "M4.93 4.93l4.24 4.24",
      "M14.83 14.83l4.24 4.24",
      "M2 12h6",
      "M16 12h6",
      "M4.93 19.07l4.24-4.24",
      "M14.83 9.17l4.24-4.24",
    ],
    [{ cx: 12, cy: 12, r: 2 }],
  ),
  "node-client_cluster": svg(
    ["M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2", "M22 21v-2a4 4 0 00-3-3.87"],
    [
      { cx: 9, cy: 7, r: 4 },
      { cx: 19, cy: 7, r: 3 },
    ],
  ),
  "action-details": svg(["M4 4h16v16H4z", "M8 16v-4", "M12 16v-7", "M16 16v-2"]),
  "action-copy": svg(["M8 4h8v3H8z", "M6 7h12v13H6z"]),
  "action-ports": svg([
    "M5 5h4v4H5z",
    "M15 5h4v4h-4z",
    "M5 15h4v4H5z",
    "M15 15h4v4h-4z",
    "M9 7h6",
    "M9 17h6",
    "M7 9v6",
    "M17 9v6",
  ]),
  "menu-details": svg(["M4 4h16v16H4z", "M8 16v-4", "M12 16v-7", "M16 16v-2"]),
  "menu-copy": svg(["M8 4h8v3H8z", "M6 7h12v13H6z"]),
  "menu-copy-ip": svg(["M4 10h16", "M4 14h16", "M8 6h8", "M8 18h8"]),
  "menu-restart": svg(["M3 12a9 9 0 0115-6l2-2v6h-6l2-2a6 6 0 10 1 8"]),
  "menu-ports": svg([
    "M5 5h4v4H5z",
    "M15 5h4v4h-4z",
    "M5 15h4v4H5z",
    "M15 15h4v4h-4z",
    "M9 7h6",
    "M9 17h6",
    "M7 9v6",
    "M17 9v6",
  ]),
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

const NODE_TYPE_ICONS: Record<string, IconName> = {
  gateway: "node-gateway",
  switch: "node-switch",
  ap: "node-ap",
  client: "node-client",
  camera: "node-camera",
  tv: "node-tv",
  phone: "node-phone",
  printer: "node-printer",
  nas: "node-nas",
  speaker: "node-speaker",
  game_console: "node-game_console",
  iot: "node-iot",
  client_cluster: "node-client_cluster",
};

export function nodeTypeIcon(nodeType: string, theme: IconTheme): string {
  return iconMarkup(NODE_TYPE_ICONS[nodeType] ?? "node-other", theme);
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
  return `<svg viewBox="0 0 24 24" width="16" height="16" style="width:16px;height:16px;display:inline-block;vertical-align:middle;" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${pathMarkup}${circleMarkup}</svg>`;
}
