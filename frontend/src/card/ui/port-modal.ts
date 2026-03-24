import type { MapPayload, PortInfo, PortModalState } from "../core/types";
import type { IconTheme } from "./icons";

export type PortModalController = {
  overlay: HTMLElement | null;
  state: PortModalState | null;
};

export function createPortModalController(): PortModalController {
  return { overlay: null, state: null };
}

export function openPortModal(params: {
  controller: PortModalController;
  nodeId: string;
  payload: MapPayload | undefined;
  theme: IconTheme;
  getNodeTypeIcon: (nodeType: string) => string;
  localize: (key: string, replacements?: Record<string, string | number>) => string;
  onClose: () => void;
  onDeviceClick: (deviceName: string) => void;
}): void {
  const { controller, nodeId, payload, theme, getNodeTypeIcon, localize, onClose, onDeviceClick } =
    params;

  if (!payload) return;

  const nodeType = payload.node_types?.[nodeId] ?? "unknown";
  const ports = extractPortsForDevice(nodeId, payload);

  if (ports.length === 0) {
    return;
  }

  controller.state = { nodeId, nodeType, ports };

  const overlay = document.createElement("div");
  overlay.className = "port-modal-overlay";
  overlay.dataset.theme = theme;
  overlay.innerHTML = renderPortModal(controller.state, payload, theme, getNodeTypeIcon, localize);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closePortModal(controller);
      onClose();
    }
  });

  const closeBtn = overlay.querySelector(".port-modal__close");
  closeBtn?.addEventListener("click", () => {
    closePortModal(controller);
    onClose();
  });

  const deviceLinks = overlay.querySelectorAll("[data-device-name]");
  deviceLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const deviceName = (link as HTMLElement).dataset.deviceName;
      if (deviceName) {
        closePortModal(controller);
        onDeviceClick(deviceName);
      }
    });
  });

  document.body.appendChild(overlay);
  controller.overlay = overlay;
}

export function closePortModal(controller: PortModalController): void {
  if (controller.overlay) {
    controller.overlay.remove();
    controller.overlay = null;
  }
  controller.state = null;
}

type ConnectionInfo = { device: string; type: string; poe: boolean; speed: number | null };

function buildConnectionMap(nodeId: string, payload: MapPayload): Map<number, ConnectionInfo> {
  const edges = payload.edges ?? [];
  const nodeTypes = payload.node_types ?? {};
  const connectedEdges = edges.filter((e) => e.left === nodeId || e.right === nodeId);
  const connectionMap = new Map<number, ConnectionInfo>();

  for (const edge of connectedEdges) {
    const isLeft = edge.left === nodeId;
    const connectedDevice = isLeft ? edge.right : edge.left;
    const connectedDeviceType = nodeTypes[connectedDevice] ?? "unknown";
    const portNum = extractPortNumber(edge.label, isLeft);
    if (portNum !== null) {
      connectionMap.set(portNum, {
        device: connectedDevice,
        type: connectedDeviceType,
        poe: edge.poe ?? false,
        speed: edge.speed ?? null,
      });
    }
  }
  return connectionMap;
}

function extractPortsForDevice(nodeId: string, payload: MapPayload): PortInfo[] {
  const devicePorts = payload.device_ports?.[nodeId] ?? [];
  const connectionMap = buildConnectionMap(nodeId, payload);

  // Build port list from device_ports (includes all ports)
  if (devicePorts.length > 0) {
    return devicePorts.map((dp) => {
      const connection = connectionMap.get(dp.port);
      return {
        port: dp.port,
        connectedDevice: connection?.device ?? null,
        connectedDeviceType: connection?.type ?? null,
        poe: dp.poe_enabled,
        poeActive: dp.poe_active,
        poePower: dp.poe_power,
        speed: connection?.speed ?? dp.speed,
      };
    });
  }

  // Fallback: use only edge data (for older payloads without device_ports)
  return Array.from(connectionMap.entries())
    .map(([portNum, conn]) => ({
      port: portNum,
      connectedDevice: conn.device,
      connectedDeviceType: conn.type,
      poe: conn.poe,
      poeActive: conn.poe,
      poePower: null,
      speed: conn.speed,
    }))
    .sort((a, b) => a.port - b.port);
}

function extractPortNumber(label: string | null | undefined, isLeft: boolean): number | null {
  if (!label) return null;

  // Check if it's a complex label with " <-> " separator
  const parts = label.split(" <-> ");
  let side = label;
  if (parts.length === 2) {
    side = isLeft ? parts[0] : parts[1];
  }

  // Extract port number
  const match = side.match(/Port\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

function renderPortModal(
  state: PortModalState,
  payload: MapPayload | undefined,
  theme: IconTheme,
  getNodeTypeIcon: (nodeType: string) => string,
  localize: (key: string, replacements?: Record<string, string | number>) => string,
): string {
  const { nodeId, nodeType, ports } = state;
  const displayName = payload?.node_names?.[nodeId] ?? nodeId;
  const nodeIcon = getNodeTypeIcon(nodeType);

  const portRows = ports
    .map((port) => renderPortRow(port, payload, getNodeTypeIcon, localize))
    .join("");

  return `
    <div class="port-modal">
      <div class="port-modal__header">
        <div class="port-modal__title">
          <span class="port-modal__icon">${nodeIcon}</span>
          <span>${escapeHtml(displayName)}</span>
        </div>
        <button type="button" class="port-modal__close">&times;</button>
      </div>
      <div class="port-modal__subtitle">${localize("port_modal.title")}</div>
      <div class="port-modal__body">
        <div class="port-list">
          ${portRows || `<div class="port-modal__empty">${localize("port_modal.no_ports")}</div>`}
        </div>
      </div>
    </div>
  `;
}

function resolveConnectedDeviceName(port: PortInfo, payload: MapPayload | undefined): string {
  if (!port.connectedDevice) return "Empty";
  return payload?.node_names?.[port.connectedDevice] ?? port.connectedDevice;
}

function renderPoeBadge(port: PortInfo, localize: (key: string) => string): string {
  if (port.poeActive && port.poePower !== null && port.poePower > 0) {
    return `<span class="badge badge--poe">${formatPower(port.poePower)}</span>`;
  }
  if (port.poe) {
    return `<span class="badge badge--poe-inactive">${localize("panel.badge.poe")}</span>`;
  }
  return "";
}

function renderPortRow(
  port: PortInfo,
  payload: MapPayload | undefined,
  getNodeTypeIcon: (nodeType: string) => string,
  localize: (key: string, replacements?: Record<string, string | number>) => string,
): string {
  const deviceIcon = port.connectedDeviceType ? getNodeTypeIcon(port.connectedDeviceType) : "";
  const deviceName = resolveConnectedDeviceName(port, payload);
  const isConnected = port.connectedDevice !== null;
  const poeBadge = renderPoeBadge(port, localize);

  return `
    <div class="port-row ${isConnected ? "port-row--connected" : "port-row--empty"}">
      <span class="port-row__number">${localize("port_modal.port", { port: port.port })}</span>
      <div class="port-row__device">
        ${
          isConnected
            ? `
              <span class="port-row__device-icon">${deviceIcon}</span>
              <a href="#" class="port-row__device-name" data-device-name="${escapeAttr(port.connectedDevice!)}">${escapeHtml(deviceName)}</a>
            `
            : `<span class="port-row__empty">${localize("port_modal.empty")}</span>`
        }
      </div>
      <span class="port-row__badges">
        ${poeBadge}
        ${port.speed ? `<span class="badge badge--speed">${formatSpeed(port.speed)}</span>` : ""}
      </span>
    </div>
  `;
}

function formatSpeed(speed: number): string {
  if (speed >= 1000) {
    return `${speed / 1000}G`;
  }
  return `${speed}M`;
}

function formatPower(watts: number): string {
  if (watts < 1) {
    return `${(watts * 1000).toFixed(0)}mW`;
  }
  return `${watts.toFixed(1)}W`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(str: string): string {
  return str.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
