import { escapeHtml } from "../data/sanitize";
import type { MapPayload } from "../core/types";

export type ContextMenuRenderOptions = {
  nodeName: string;
  payload?: MapPayload;
  theme: "dark" | "light" | "unifi" | "unifi-dark";
  getNodeTypeIcon: (nodeType: string) => string;
  getIcon: (
    name: "menu-details" | "menu-copy" | "menu-copy-ip" | "menu-restart" | "menu-ports",
  ) => string;
  localize: (key: string, replacements?: Record<string, string | number>) => string;
};

export type ContextMenuAction =
  | "details"
  | "copy-mac"
  | "copy-ip"
  | "restart"
  | "view-ports"
  | "unknown";

export type ContextMenuActionResult = {
  action: ContextMenuAction;
  mac: string | null;
  ip: string | null;
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
  const ip =
    options.payload?.client_ips?.[options.nodeName] ??
    options.payload?.device_ips?.[options.nodeName] ??
    options.payload?.related_entities?.[options.nodeName]?.find((entity) => entity.ip)?.ip ??
    null;

  const items: string[] = [];

  if (entityId) {
    items.push(`
      <button type="button" class="context-menu__item" data-context-action="details">
        <span class="context-menu__icon">${options.getIcon("menu-details")}</span>
        <span>${options.localize("context_menu.view_details")}</span>
      </button>
    `);
  }

  if (mac) {
    items.push(`
      <button type="button" class="context-menu__item" data-context-action="copy-mac" data-mac="${escapeHtml(mac)}">
        <span class="context-menu__icon">${options.getIcon("menu-copy")}</span>
        <span>${options.localize("context_menu.copy_mac")}</span>
      </button>
    `);
  }
  if (ip) {
    items.push(`
      <button type="button" class="context-menu__item" data-context-action="copy-ip" data-ip="${escapeHtml(ip)}">
        <span class="context-menu__icon">${options.getIcon("menu-copy-ip")}</span>
        <span>${options.localize("context_menu.copy_ip")}</span>
      </button>
    `);
  }

  // Add "View Ports" for switches and gateways
  const hasPortInfo = nodeType === "switch" || nodeType === "gateway";
  if (hasPortInfo) {
    items.push(`
      <button type="button" class="context-menu__item" data-context-action="view-ports">
        <span class="context-menu__icon">${options.getIcon("menu-ports")}</span>
        <span>${options.localize("context_menu.view_ports")}</span>
      </button>
    `);
  }

  if (items.length > 0) {
    items.push('<div class="context-menu__divider"></div>');
  }

  if (isDevice) {
    items.push(`
      <button type="button" class="context-menu__item" data-context-action="restart" ${!entityId ? "disabled" : ""}>
        <span class="context-menu__icon">${options.getIcon("menu-restart")}</span>
        <span>${options.localize("context_menu.restart")}</span>
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
  const ip = actionButton.getAttribute("data-ip");
  return {
    action: isContextMenuAction(action) ? action : "unknown",
    mac,
    ip,
  };
}

function isContextMenuAction(action: string): action is ContextMenuAction {
  return (
    action === "details" ||
    action === "copy-mac" ||
    action === "copy-ip" ||
    action === "restart" ||
    action === "view-ports"
  );
}
