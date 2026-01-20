import { escapeHtml } from "./sanitize";
import type { MapPayload } from "./types";

export type ContextMenuRenderOptions = {
  nodeName: string;
  payload?: MapPayload;
  theme: "dark" | "light";
  getNodeTypeIcon: (nodeType: string) => string;
};

export type ContextMenuAction = "select" | "details" | "copy-mac" | "restart" | "unknown";

export type ContextMenuActionResult = {
  action: ContextMenuAction;
  mac: string | null;
};

export function renderContextMenu(options: ContextMenuRenderOptions): string {
  const safeName = escapeHtml(options.nodeName);
  const nodeType = options.payload?.node_types?.[options.nodeName] ?? "unknown";
  const typeIcon = options.getNodeTypeIcon(nodeType);
  const mac =
    options.payload?.client_macs?.[options.nodeName] ??
    options.payload?.device_macs?.[options.nodeName];
  const entityId =
    options.payload?.node_entities?.[options.nodeName] ??
    options.payload?.client_entities?.[options.nodeName] ??
    options.payload?.device_entities?.[options.nodeName];
  const isDevice = nodeType !== "client";

  const items: string[] = [];

  items.push(`
    <button type="button" class="context-menu__item" data-context-action="select">
      <span class="context-menu__icon">👆</span>
      <span>Select</span>
    </button>
  `);

  if (entityId) {
    items.push(`
      <button type="button" class="context-menu__item" data-context-action="details">
        <span class="context-menu__icon">📊</span>
        <span>View Details</span>
      </button>
    `);
  }

  if (mac) {
    items.push(`
      <button type="button" class="context-menu__item" data-context-action="copy-mac" data-mac="${escapeHtml(mac)}">
        <span class="context-menu__icon">📋</span>
        <span>Copy MAC Address</span>
      </button>
    `);
  }

  items.push('<div class="context-menu__divider"></div>');

  if (isDevice) {
    items.push(`
      <button type="button" class="context-menu__item" data-context-action="restart" ${!entityId ? "disabled" : ""}>
        <span class="context-menu__icon">🔄</span>
        <span>Restart Device</span>
      </button>
    `);
  }

  return `
    <div class="context-menu" data-theme="${escapeHtml(options.theme)}" data-context-node="${safeName}">
      <div class="context-menu__header">
        <div class="context-menu__title">${typeIcon} ${safeName}</div>
        <div class="context-menu__type">${escapeHtml(nodeType)}</div>
      </div>
      ${items.join("")}
    </div>
  `;
}

export function parseContextMenuAction(target: HTMLElement): ContextMenuActionResult | null {
  const actionButton = target.closest("[data-context-action]") as HTMLButtonElement | null;
  if (!actionButton || actionButton.disabled) {
    return null;
  }
  const action = actionButton.getAttribute("data-context-action") ?? "unknown";
  const mac = actionButton.getAttribute("data-mac");
  return {
    action: isContextMenuAction(action) ? action : "unknown",
    mac,
  };
}

function isContextMenuAction(action: string): action is ContextMenuAction {
  return (
    action === "select" || action === "details" || action === "copy-mac" || action === "restart"
  );
}
