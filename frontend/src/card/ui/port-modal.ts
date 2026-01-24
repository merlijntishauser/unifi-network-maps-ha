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
  nodeName: string;
  payload: MapPayload | undefined;
  theme: IconTheme;
  getNodeTypeIcon: (nodeType: string) => string;
  onClose: () => void;
  onDeviceClick: (deviceName: string) => void;
}): void {
  const { controller, nodeName, payload, theme, getNodeTypeIcon, onClose, onDeviceClick } = params;

  if (!payload) return;

  const nodeType = payload.node_types?.[nodeName] ?? "unknown";
  const ports = extractPortsForDevice(nodeName, payload);

  if (ports.length === 0) {
    return;
  }

  controller.state = { nodeName, nodeType, ports };

  const overlay = document.createElement("div");
  overlay.className = "port-modal-overlay";
  overlay.dataset.theme = theme;
  overlay.innerHTML = renderPortModal(controller.state, theme, getNodeTypeIcon);

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

function extractPortsForDevice(nodeName: string, payload: MapPayload): PortInfo[] {
  const edges = payload.edges ?? [];
  const nodeTypes = payload.node_types ?? {};

  const connectedEdges = edges.filter((e) => e.left === nodeName || e.right === nodeName);

  const portMap = new Map<number, PortInfo>();

  for (const edge of connectedEdges) {
    const isLeft = edge.left === nodeName;
    const connectedDevice = isLeft ? edge.right : edge.left;
    const connectedDeviceType = nodeTypes[connectedDevice] ?? "unknown";

    // Extract port number from label
    const portNum = extractPortNumber(edge.label, isLeft);
    if (portNum === null) continue;

    portMap.set(portNum, {
      port: portNum,
      connectedDevice,
      connectedDeviceType,
      poe: edge.poe ?? false,
      speed: edge.speed ?? null,
    });
  }

  // Sort by port number
  return Array.from(portMap.values()).sort((a, b) => a.port - b.port);
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
  theme: IconTheme,
  getNodeTypeIcon: (nodeType: string) => string,
): string {
  const { nodeName, nodeType, ports } = state;
  const nodeIcon = getNodeTypeIcon(nodeType);

  const portRows = ports
    .map((port) => {
      const deviceIcon = port.connectedDeviceType ? getNodeTypeIcon(port.connectedDeviceType) : "";
      const deviceName = port.connectedDevice ?? "Empty";
      const isConnected = port.connectedDevice !== null;

      return `
        <div class="port-row ${isConnected ? "port-row--connected" : "port-row--empty"}">
          <span class="port-row__number">Port ${port.port}</span>
          <div class="port-row__device">
            ${
              isConnected
                ? `
                  <span class="port-row__device-icon">${deviceIcon}</span>
                  <a href="#" class="port-row__device-name" data-device-name="${escapeAttr(port.connectedDevice!)}">${escapeHtml(deviceName)}</a>
                `
                : `<span class="port-row__empty">—</span>`
            }
          </div>
          <span class="port-row__badges">
            ${port.poe ? '<span class="badge badge--poe">PoE</span>' : ""}
            ${port.speed ? `<span class="badge badge--speed">${formatSpeed(port.speed)}</span>` : ""}
          </span>
        </div>
      `;
    })
    .join("");

  return `
    <div class="port-modal">
      <div class="port-modal__header">
        <div class="port-modal__title">
          <span class="port-modal__icon">${nodeIcon}</span>
          <span>${escapeHtml(nodeName)}</span>
        </div>
        <button type="button" class="port-modal__close">&times;</button>
      </div>
      <div class="port-modal__subtitle">Port Overview</div>
      <div class="port-modal__body">
        <div class="port-list">
          ${portRows || '<div class="port-modal__empty">No port information available</div>'}
        </div>
      </div>
    </div>
  `;
}

function formatSpeed(speed: number): string {
  if (speed >= 1000) {
    return `${speed / 1000}G`;
  }
  return `${speed}M`;
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
