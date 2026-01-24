import type { CardConfig, VlanInfo } from "../core/types";

/**
 * Colorblind-friendly palette with 10 distinct colors.
 * Each color has dark and light variants for theme compatibility.
 */
const VLAN_PALETTE = {
  dark: [
    "#60a5fa", // Blue
    "#4ade80", // Green
    "#fbbf24", // Amber
    "#f87171", // Red
    "#a78bfa", // Violet
    "#f472b6", // Pink
    "#22d3ee", // Cyan
    "#a3e635", // Lime
    "#fb923c", // Orange
    "#818cf8", // Indigo
  ],
  light: [
    "#2563eb", // Blue
    "#16a34a", // Green
    "#d97706", // Amber
    "#dc2626", // Red
    "#7c3aed", // Violet
    "#db2777", // Pink
    "#0891b2", // Cyan
    "#65a30d", // Lime
    "#ea580c", // Orange
    "#4f46e5", // Indigo
  ],
};

export type VlanColorMap = Record<number, string>;

/**
 * Determine if theme is light-based.
 */
function isLightTheme(theme: CardConfig["theme"]): boolean {
  return theme === "light" || theme === "unifi";
}

/**
 * Assign colors to VLANs based on theme.
 * Colors cycle if there are more than 10 VLANs.
 */
export function assignVlanColors(
  vlanInfo: Record<number, VlanInfo> | undefined,
  theme: CardConfig["theme"],
): VlanColorMap {
  if (!vlanInfo) {
    return {};
  }

  const palette = isLightTheme(theme) ? VLAN_PALETTE.light : VLAN_PALETTE.dark;
  const vlanIds = Object.keys(vlanInfo)
    .map(Number)
    .sort((a, b) => a - b);
  const colorMap: VlanColorMap = {};

  for (let i = 0; i < vlanIds.length; i++) {
    const vlanId = vlanIds[i];
    colorMap[vlanId] = palette[i % palette.length];
  }

  return colorMap;
}

/**
 * Generate CSS rules for VLAN node coloring.
 * Targets SVG nodes by their data-node-id attribute.
 * Only adds a colored stroke outline - does not modify fill to preserve original appearance.
 */
export function generateVlanStyles(
  nodeVlans: Record<string, number | null> | undefined,
  colorMap: VlanColorMap,
): string {
  if (!nodeVlans || Object.keys(colorMap).length === 0) {
    return "";
  }

  const rules: string[] = [];

  for (const [nodeName, vlanId] of Object.entries(nodeVlans)) {
    if (vlanId === null || !(vlanId in colorMap)) {
      continue;
    }

    const color = colorMap[vlanId];
    const escapedName = CSS.escape(nodeName);

    // Add a colored stroke outline to indicate VLAN membership
    // Do not modify fill to preserve the original node appearance
    rules.push(`
      .unifi-network-map__viewport svg [data-node-id="${escapedName}"] > rect,
      .unifi-network-map__viewport svg [data-node-id="${escapedName}"] > circle,
      .unifi-network-map__viewport svg [data-node-id="${escapedName}"] > polygon,
      .unifi-network-map__viewport svg [data-node-id="${escapedName}"] > ellipse,
      .unifi-network-map__viewport svg [data-node-id="${escapedName}"] > path:not([data-edge]) {
        stroke: ${color};
        stroke-width: 2px;
      }
    `);
  }

  return rules.join("\n");
}

/**
 * Get VLAN info for a specific node.
 */
export function getNodeVlanInfo(
  nodeName: string,
  nodeVlans: Record<string, number | null> | undefined,
  vlanInfo: Record<number, VlanInfo> | undefined,
): VlanInfo | null {
  if (!nodeVlans || !vlanInfo) {
    return null;
  }

  const vlanId = nodeVlans[nodeName];
  if (vlanId === null || vlanId === undefined) {
    return null;
  }

  return vlanInfo[vlanId] ?? null;
}
