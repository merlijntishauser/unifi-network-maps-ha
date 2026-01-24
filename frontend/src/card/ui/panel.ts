import type { DeviceCounts, MapPayload, Neighbor, NodeStatus, StatusCounts } from "../core/types";
import type { IconName } from "./icons";

export type PanelContext = {
  payload?: MapPayload;
  selectedNode?: string;
  activeTab: "overview" | "stats" | "actions";
};

export type PanelHelpers = {
  escapeHtml: (value: string) => string;
  getNodeTypeIcon: (nodeType: string) => string;
  getStatusBadgeHtml: (state: "online" | "offline" | "unknown") => string;
  formatLastChanged: (value: string | null | undefined) => string;
  getIcon: (name: IconName) => string;
  getDomainIcon: (domain: string) => string;
};

export function renderPanelContent(context: PanelContext, helpers: PanelHelpers): string {
  if (!context.selectedNode) {
    return renderMapOverview(context, helpers);
  }
  return renderNodePanel(context, context.selectedNode, helpers);
}

function renderMapOverview(context: PanelContext, helpers: PanelHelpers): string {
  if (!context.payload) {
    return `
      <div class="panel-empty">
        <div class="panel-empty__icon">${helpers.getIcon("network")}</div>
        <div class="panel-empty__text">Loading network data...</div>
      </div>
    `;
  }
  const nodes = Object.keys(context.payload.node_types ?? {});
  const edges = context.payload.edges ?? [];
  const nodeTypes = context.payload.node_types ?? {};
  const nodeStatus = context.payload.node_status ?? {};

  const deviceCounts = countDevicesByType(nodes, nodeTypes);
  const statusCounts = countNodeStatus(nodeStatus);

  return `
    <div class="panel-header">
      <div class="panel-header__title">Network Overview</div>
    </div>
    ${renderOverviewStatsGrid(nodes.length, edges.length)}
    ${renderOverviewStatusSection(statusCounts)}
    ${renderOverviewDeviceBreakdown(deviceCounts, helpers)}
    <div class="panel-hint">
      <span class="panel-hint__icon">${helpers.getIcon("hint")}</span>
      Click a node in the map to see details
    </div>
  `;
}

function renderNodePanel(context: PanelContext, name: string, helpers: PanelHelpers): string {
  const safeName = helpers.escapeHtml(name);
  if (!context.payload) {
    return `
      <div class="panel-header">
        <button type="button" class="panel-header__back" data-action="back">←</button>
        <div class="panel-header__title">${safeName}</div>
      </div>
      <div class="panel-empty">
        <div class="panel-empty__text">No data available</div>
      </div>
    `;
  }

  const nodeType = context.payload.node_types?.[name] ?? "unknown";
  const typeIcon = helpers.getNodeTypeIcon(nodeType);
  const status = context.payload.node_status?.[name];
  const statusBadge = status ? helpers.getStatusBadgeHtml(status.state) : "";

  return `
    <div class="panel-header">
      <button type="button" class="panel-header__back" data-action="back">←</button>
      <div class="panel-header__info">
        <div class="panel-header__title-row">
          <span class="panel-header__title">${safeName}</span>
          ${statusBadge}
        </div>
        <div class="panel-header__badge">${typeIcon} ${helpers.escapeHtml(nodeType)}</div>
      </div>
    </div>
    <div class="panel-tabs">
      <button type="button" class="panel-tab ${context.activeTab === "overview" ? "panel-tab--active" : ""}" data-tab="overview">Overview</button>
      <button type="button" class="panel-tab ${context.activeTab === "stats" ? "panel-tab--active" : ""}" data-tab="stats">Stats</button>
      <button type="button" class="panel-tab ${context.activeTab === "actions" ? "panel-tab--active" : ""}" data-tab="actions">Actions</button>
    </div>
    <div class="panel-tab-content">
      ${renderTabContent(context, name, helpers)}
    </div>
  `;
}

export function renderTabContent(
  context: PanelContext,
  name: string,
  helpers: PanelHelpers,
): string {
  switch (context.activeTab) {
    case "overview":
      return renderOverviewTab(context, name, helpers);
    case "stats":
      return renderStatsTab(context, name, helpers);
    case "actions":
      return renderActionsTab(context, name, helpers);
    default:
      return "";
  }
}

function renderOverviewTab(context: PanelContext, name: string, helpers: PanelHelpers): string {
  const edges = context.payload?.edges ?? [];
  const neighbors: Neighbor[] = edges
    .filter((edge) => edge.left === name || edge.right === name)
    .map((edge) => {
      const isLeft = edge.left === name;
      const neighborName = isLeft ? edge.right : edge.left;
      // Extract just the port number from the label (e.g., "Port 4" from "Switch: Port 4 <-> Device")
      const portInfo = extractPortInfo(edge.label, isLeft);
      return {
        name: neighborName,
        label: portInfo,
        wireless: edge.wireless,
        poe: edge.poe,
      };
    });
  const uniqueNeighbors: Neighbor[] = Array.from(
    new Map(neighbors.map((n) => [n.name, n])).values(),
  );

  const neighborList = uniqueNeighbors.length
    ? uniqueNeighbors
        .map(
          (n) => `
          <div class="neighbor-item">
            <span class="neighbor-item__name">${helpers.escapeHtml(n.name)}</span>
            <span class="neighbor-item__badges">
              ${n.poe ? '<span class="badge badge--poe">PoE</span>' : ""}
              ${n.wireless ? '<span class="badge badge--wireless">WiFi</span>' : ""}
              ${n.label ? `<span class="badge badge--port">${helpers.escapeHtml(n.label)}</span>` : ""}
            </span>
          </div>
        `,
        )
        .join("")
    : '<div class="panel-empty__text">No connections</div>';

  const relatedEntitiesSection = renderRelatedEntitiesSection(context, name, helpers);

  return `
    <div class="panel-section">
      <div class="panel-section__title">Connected Devices</div>
      <div class="neighbor-list">${neighborList}</div>
    </div>
    ${relatedEntitiesSection}
  `;
}

function renderRelatedEntitiesSection(
  context: PanelContext,
  name: string,
  helpers: PanelHelpers,
): string {
  const relatedEntities = context.payload?.related_entities?.[name] ?? [];
  if (relatedEntities.length === 0) {
    return "";
  }

  const entityItems = relatedEntities
    .map((entity) => {
      const icon = helpers.getDomainIcon(entity.domain);
      const displayName = entity.friendly_name ?? entity.entity_id;
      const stateClass = getEntityStateClass(entity.state);
      const stateLabel = entity.state ?? "unknown";

      return `
        <div class="entity-item" data-entity-id="${helpers.escapeHtml(entity.entity_id)}">
          <span class="entity-item__icon">${icon}</span>
          <div class="entity-item__info">
            <span class="entity-item__name">${helpers.escapeHtml(displayName)}</span>
            <span class="entity-item__id">${helpers.escapeHtml(entity.entity_id)}</span>
          </div>
          <span class="entity-item__state ${stateClass}">${helpers.escapeHtml(stateLabel)}</span>
        </div>
      `;
    })
    .join("");

  return `
    <div class="panel-section">
      <div class="panel-section__title">Home Assistant Entities</div>
      <div class="entity-list">${entityItems}</div>
    </div>
  `;
}

function getEntityStateClass(state: string | null): string {
  if (!state) return "entity-item__state--unknown";
  const onStates = ["on", "home", "connected", "online", "true"];
  const offStates = ["off", "not_home", "disconnected", "offline", "false", "unavailable"];
  if (onStates.includes(state.toLowerCase())) return "entity-item__state--on";
  if (offStates.includes(state.toLowerCase())) return "entity-item__state--off";
  return "entity-item__state--neutral";
}

function extractPortInfo(label: string | null | undefined, isLeft: boolean): string | null {
  if (!label) return null;

  // Check if it's a complex label with " <-> " separator
  const parts = label.split(" <-> ");
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

function renderStatsTab(context: PanelContext, name: string, helpers: PanelHelpers): string {
  const edges = context.payload?.edges ?? [];
  const nodeEdges = edges.filter((edge) => edge.left === name || edge.right === name);
  const mac = context.payload?.client_macs?.[name] ?? context.payload?.device_macs?.[name] ?? null;
  const ip =
    context.payload?.client_ips?.[name] ??
    context.payload?.device_ips?.[name] ??
    context.payload?.related_entities?.[name]?.find((e) => e.ip)?.ip ??
    null;
  const status = context.payload?.node_status?.[name];

  return `
    ${renderStatsLiveStatus(status, helpers)}
    ${renderStatsConnectionSection(nodeEdges)}
    ${renderStatsDeviceInfo(mac, ip, helpers)}
  `;
}

function renderStatsLiveStatus(status: NodeStatus | undefined, helpers: PanelHelpers): string {
  if (!status) {
    return "";
  }
  return `
    <div class="panel-section">
      <div class="panel-section__title">Live Status</div>
      <div class="stats-list">
        <div class="stats-row">
          <span class="stats-row__label">Status</span>
          <span class="stats-row__value">${helpers.getStatusBadgeHtml(status.state)}</span>
        </div>
        <div class="stats-row">
          <span class="stats-row__label">Last Changed</span>
          <span class="stats-row__value">${helpers.formatLastChanged(status.last_changed)}</span>
        </div>
      </div>
    </div>
  `;
}

function renderStatsConnectionSection(
  nodeEdges: Array<{ wireless?: boolean | null; poe?: boolean | null }>,
): string {
  const wirelessCount = nodeEdges.filter((e) => e.wireless).length;
  const wiredCount = nodeEdges.length - wirelessCount;
  const poeCount = nodeEdges.filter((e) => e.poe).length;
  const poeRow =
    poeCount > 0
      ? `<div class="stats-row"><span class="stats-row__label">PoE Powered</span><span class="stats-row__value">${poeCount}</span></div>`
      : "";

  return `
    <div class="panel-section">
      <div class="panel-section__title">Connection Stats</div>
      <div class="stats-list">
        <div class="stats-row">
          <span class="stats-row__label">Total Connections</span>
          <span class="stats-row__value">${nodeEdges.length}</span>
        </div>
        <div class="stats-row">
          <span class="stats-row__label">Wired</span>
          <span class="stats-row__value">${wiredCount}</span>
        </div>
        <div class="stats-row">
          <span class="stats-row__label">Wireless</span>
          <span class="stats-row__value">${wirelessCount}</span>
        </div>
        ${poeRow}
      </div>
    </div>
  `;
}

function renderStatsDeviceInfo(
  mac: string | null,
  ip: string | null,
  helpers: PanelHelpers,
): string {
  if (!mac && !ip) {
    return "";
  }
  const macRow = mac
    ? `
      <div class="info-row">
        <span class="info-row__label">MAC Address</span>
        <code class="info-row__value">${helpers.escapeHtml(mac)}</code>
      </div>
    `
    : "";
  const ipRow = ip
    ? `
      <div class="info-row">
        <span class="info-row__label">IP Address</span>
        <code class="info-row__value">${helpers.escapeHtml(ip)}</code>
      </div>
    `
    : "";
  return `
    <div class="panel-section">
      <div class="panel-section__title">Device Info</div>
      ${macRow}
      ${ipRow}
    </div>
  `;
}

function renderActionsTab(context: PanelContext, name: string, helpers: PanelHelpers): string {
  const entityId =
    context.payload?.node_entities?.[name] ??
    context.payload?.client_entities?.[name] ??
    context.payload?.device_entities?.[name];
  const mac = context.payload?.client_macs?.[name] ?? context.payload?.device_macs?.[name] ?? null;
  const ip =
    context.payload?.client_ips?.[name] ??
    context.payload?.device_ips?.[name] ??
    context.payload?.related_entities?.[name]?.find((e) => e.ip)?.ip ??
    null;
  const nodeType = context.payload?.node_types?.[name] ?? "unknown";
  const hasPortInfo = nodeType === "switch" || nodeType === "gateway";
  const safeEntityId = entityId ? helpers.escapeHtml(entityId) : "";
  const safeMac = mac ? helpers.escapeHtml(mac) : "";
  const safeIp = ip ? helpers.escapeHtml(ip) : "";
  const safeName = helpers.escapeHtml(name);

  return `
    <div class="panel-section">
      <div class="panel-section__title">Quick Actions</div>
      <div class="actions-list">
        ${
          entityId
            ? `
            <button type="button" class="action-button action-button--primary" data-entity-id="${safeEntityId}">
              <span class="action-button__icon">${helpers.getIcon("action-details")}</span>
              <span class="action-button__text">View Entity Details</span>
            </button>
          `
            : `<div class="panel-empty__text">No Home Assistant entity linked</div>`
        }
        ${
          hasPortInfo
            ? `
            <button type="button" class="action-button" data-action="view-ports" data-node-name="${safeName}">
              <span class="action-button__icon">${helpers.getIcon("action-ports")}</span>
              <span class="action-button__text">View Port Overview</span>
            </button>
          `
            : ""
        }
        ${
          mac
            ? `
            <button type="button" class="action-button" data-action="copy" data-copy-value="${safeMac}">
              <span class="action-button__icon">${helpers.getIcon("action-copy")}</span>
              <span class="action-button__text">Copy MAC Address</span>
            </button>
          `
            : ""
        }
        ${
          ip
            ? `
            <button type="button" class="action-button" data-action="copy" data-copy-value="${safeIp}">
              <span class="action-button__icon">${helpers.getIcon("action-copy")}</span>
              <span class="action-button__text">Copy IP Address</span>
            </button>
          `
            : ""
        }
      </div>
    </div>
    ${
      entityId
        ? `
      <div class="panel-section">
        <div class="panel-section__title">Entity</div>
        <code class="entity-id">${safeEntityId}</code>
      </div>
    `
        : ""
    }
  `;
}

function renderOverviewStatsGrid(nodeCount: number, edgeCount: number): string {
  return `
    <div class="panel-stats-grid">
      <div class="stat-card">
        <div class="stat-card__value">${nodeCount}</div>
        <div class="stat-card__label">Total Nodes</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__value">${edgeCount}</div>
        <div class="stat-card__label">Connections</div>
      </div>
    </div>
  `;
}

function renderOverviewStatusSection(counts: StatusCounts): string {
  if (!counts.hasStatus) {
    return "";
  }
  return `
    <div class="panel-section">
      <div class="panel-section__title">Live Status</div>
      <div class="device-list">
        <div class="device-row"><span class="status-dot status-dot--online"></span><span class="device-row__label">Online</span><span class="device-row__count">${counts.online}</span></div>
        <div class="device-row"><span class="status-dot status-dot--offline"></span><span class="device-row__label">Offline</span><span class="device-row__count">${counts.offline}</span></div>
      </div>
    </div>
  `;
}

function renderOverviewDeviceBreakdown(counts: DeviceCounts, helpers: PanelHelpers): string {
  const items: Array<{ key: keyof DeviceCounts; icon: string; label: string }> = [
    { key: "gateways", icon: helpers.getIcon("node-gateway"), label: "Gateways" },
    { key: "switches", icon: helpers.getIcon("node-switch"), label: "Switches" },
    { key: "aps", icon: helpers.getIcon("node-ap"), label: "Access Points" },
    { key: "clients", icon: helpers.getIcon("node-client"), label: "Clients" },
    { key: "other", icon: helpers.getIcon("node-other"), label: "Other" },
  ];
  const rows = items
    .filter((item) => counts[item.key] > 0)
    .map(
      (item) =>
        `<div class="device-row"><span class="device-row__icon">${item.icon}</span><span class="device-row__label">${item.label}</span><span class="device-row__count">${counts[item.key]}</span></div>`,
    )
    .join("");
  return `
    <div class="panel-section">
      <div class="panel-section__title">Device Breakdown</div>
      <div class="device-list">${rows}</div>
    </div>
  `;
}

function countDevicesByType(nodes: string[], nodeTypes: Record<string, string>): DeviceCounts {
  return {
    gateways: nodes.filter((n) => nodeTypes[n] === "gateway").length,
    switches: nodes.filter((n) => nodeTypes[n] === "switch").length,
    aps: nodes.filter((n) => nodeTypes[n] === "ap").length,
    clients: nodes.filter((n) => nodeTypes[n] === "client").length,
    other: nodes.filter((n) => !["gateway", "switch", "ap", "client"].includes(nodeTypes[n]))
      .length,
  };
}

function countNodeStatus(nodeStatus: Record<string, NodeStatus>): StatusCounts {
  const values = Object.values(nodeStatus);
  return {
    online: values.filter((s) => s.state === "online").length,
    offline: values.filter((s) => s.state === "offline").length,
    hasStatus: values.length > 0,
  };
}
