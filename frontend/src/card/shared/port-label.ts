/**
 * Parsing helpers for edge port labels. Labels come in two shapes:
 * a two-sided "Port A <-> Port B" label or a single "Port N" label.
 */

const PORT_LABEL_SEPARATOR = " <-> ";

/**
 * Extracts the "Port N" fragment for one side of an edge label.
 * Falls back to the raw label when no port fragment is found in a
 * single-sided label.
 */
export function extractPortInfo(label: string | null | undefined, isLeft: boolean): string | null {
  if (!label) return null;

  // Check if it's a complex label with " <-> " separator
  const parts = label.split(PORT_LABEL_SEPARATOR);
  if (parts.length === 2) {
    const side = isLeft ? parts[0] : parts[1];
    // Extract just "Port X" from "DeviceName: Port X"
    const portMatch = side.match(/Port\s*\d+/i);
    return portMatch ? portMatch[0] : null;
  }

  // Simple label - just return as-is if it looks like a port
  if (label.match(/^Port\s*\d+$/i)) {
    return label;
  }

  // Try to extract port info from any format
  const portMatch = label.match(/Port\s*\d+/i);
  return portMatch ? portMatch[0] : label;
}

/** Extracts the numeric port for one side of an edge label, or null. */
export function extractPortNumber(
  label: string | null | undefined,
  isLeft: boolean,
): number | null {
  if (!label) return null;

  // Check if it's a complex label with " <-> " separator
  const parts = label.split(PORT_LABEL_SEPARATOR);
  let side = label;
  if (parts.length === 2) {
    side = isLeft ? parts[0] : parts[1];
  }

  // Extract port number
  const match = side.match(/Port\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Sort key for an already-extracted port info string: the first digit run,
 * or 999 so portless entries sort last.
 */
export function portSortNumber(portInfo: string | null): number {
  if (!portInfo) return 999;
  const match = portInfo.match(/\d+/);
  return match ? parseInt(match[0], 10) : 999;
}
