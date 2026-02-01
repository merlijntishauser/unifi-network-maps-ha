import { escapeHtml } from "../data/sanitize";
import type { MapPayload } from "../core/types";
import { getNodeIpFromPayload } from "../shared/node-utils";

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
  const data = buildContextMenuData(options);
  const items = buildContextMenuItems(data, options);
  const subtitle = data.model ? escapeHtml(data.model) : escapeHtml(data.nodeType);

  return `
    <div class="context-menu" data-theme="${escapeHtml(options.theme)}" data-context-node="${data.safeName}">
      <div class="context-menu__header">
        <div class="context-menu__title">${data.typeIcon} ${data.safeName}</div>
        <div class="context-menu__type">${subtitle}</div>
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

type ContextMenuData = {
  safeName: string;
  nodeType: string;
  typeIcon: string;
  mac: string | null;
  ip: string | null;
  model: string | null;
  entityId: string | null;
  isDevice: boolean;
  hasPortInfo: boolean;
};

function buildContextMenuData(options: ContextMenuRenderOptions): ContextMenuData {
  const nodeType = getNodeType(options.payload, options.nodeName);
  const mac = getNodeMac(options.payload, options.nodeName);
  const entityId = getNodeEntityId(options.payload, options.nodeName);
  const ip = getNodeIp(options.payload, options.nodeName);
  const model = getNodeModel(options.payload, options.nodeName);
  return {
    safeName: escapeHtml(options.nodeName),
    nodeType,
    typeIcon: options.getNodeTypeIcon(nodeType),
    mac,
    ip,
    model,
    entityId,
    isDevice: nodeType !== "client",
    hasPortInfo: nodeType === "switch" || nodeType === "gateway",
  };
}

function buildContextMenuItems(data: ContextMenuData, options: ContextMenuRenderOptions): string[] {
  const items: string[] = [];
  pushIf(items, renderDetailsItem(data, options));
  pushIf(items, renderCopyMacItem(data, options));
  pushIf(items, renderCopyIpItem(data, options));
  pushIf(items, renderPortsItem(data, options));
  if (items.length > 0) {
    items.push('<div class="context-menu__divider"></div>');
  }
  pushIf(items, renderRestartItem(data, options));
  return items;
}

function renderDetailsItem(
  data: ContextMenuData,
  options: ContextMenuRenderOptions,
): string | null {
  if (!data.entityId) {
    return null;
  }
  return `
    <button type="button" class="context-menu__item" data-context-action="details">
      <span class="context-menu__icon">${options.getIcon("menu-details")}</span>
      <span>${options.localize("context_menu.view_details")}</span>
    </button>
  `;
}

function renderCopyMacItem(
  data: ContextMenuData,
  options: ContextMenuRenderOptions,
): string | null {
  if (!data.mac) {
    return null;
  }
  return `
    <button type="button" class="context-menu__item" data-context-action="copy-mac" data-mac="${escapeHtml(data.mac)}">
      <span class="context-menu__icon">${options.getIcon("menu-copy")}</span>
      <span>${options.localize("context_menu.copy_mac")}</span>
    </button>
  `;
}

function renderCopyIpItem(data: ContextMenuData, options: ContextMenuRenderOptions): string | null {
  if (!data.ip) {
    return null;
  }
  return `
    <button type="button" class="context-menu__item" data-context-action="copy-ip" data-ip="${escapeHtml(data.ip)}">
      <span class="context-menu__icon">${options.getIcon("menu-copy-ip")}</span>
      <span>${options.localize("context_menu.copy_ip")}</span>
    </button>
  `;
}

function renderPortsItem(data: ContextMenuData, options: ContextMenuRenderOptions): string | null {
  if (!data.hasPortInfo) {
    return null;
  }
  return `
    <button type="button" class="context-menu__item" data-context-action="view-ports">
      <span class="context-menu__icon">${options.getIcon("menu-ports")}</span>
      <span>${options.localize("context_menu.view_ports")}</span>
    </button>
  `;
}

function renderRestartItem(
  data: ContextMenuData,
  options: ContextMenuRenderOptions,
): string | null {
  if (!data.isDevice) {
    return null;
  }
  return `
    <button type="button" class="context-menu__item" data-context-action="restart" ${!data.entityId ? "disabled" : ""}>
      <span class="context-menu__icon">${options.getIcon("menu-restart")}</span>
      <span>${options.localize("context_menu.restart")}</span>
    </button>
  `;
}

function pushIf(items: string[], value: string | null): void {
  if (value) {
    items.push(value);
  }
}

function getNodeType(payload: MapPayload | undefined, nodeName: string): string {
  return payload?.node_types?.[nodeName] ?? "unknown";
}

function getNodeMac(payload: MapPayload | undefined, nodeName: string): string | null {
  return payload?.client_macs?.[nodeName] ?? payload?.device_macs?.[nodeName] ?? null;
}

function getNodeEntityId(payload: MapPayload | undefined, nodeName: string): string | null {
  return (
    payload?.node_entities?.[nodeName] ??
    payload?.client_entities?.[nodeName] ??
    payload?.device_entities?.[nodeName] ??
    null
  );
}

function getNodeIp(payload: MapPayload | undefined, nodeName: string): string | null {
  return getNodeIpFromPayload(payload, nodeName);
}

function getNodeModel(payload: MapPayload | undefined, nodeName: string): string | null {
  const details = payload?.device_details?.[nodeName];
  if (!details) return null;
  // Prefer model_name (friendly name) over model code
  return details.model_name ?? details.model ?? null;
}
