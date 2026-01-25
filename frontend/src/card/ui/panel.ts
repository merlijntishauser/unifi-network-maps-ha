import type {
  DeviceCounts,
  MapPayload,
  Neighbor,
  NodeStatus,
  StatusCounts,
  VlanInfo,
} from "../core/types";
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
  localize: (key: string, replacements?: Record<string, string | number>) => string;
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
        <div class="panel-empty__text">${helpers.localize("panel.loading")}</div>
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
      <div class="panel-header__title">${helpers.localize("panel.overview")}</div>
    </div>
    ${renderOverviewStatsGrid(nodes.length, edges.length, helpers)}
    ${renderOverviewStatusSection(statusCounts, helpers)}
    ${renderOverviewDeviceBreakdown(deviceCounts, helpers)}
    <div class="panel-hint">
      <span class="panel-hint__icon">${helpers.getIcon("hint")}</span>
      ${helpers.localize("panel.hint")}
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
        <div class="panel-empty__text">${helpers.localize("panel.no_data")}</div>
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
      <button type="button" class="panel-tab ${context.activeTab === "overview" ? "panel-tab--active" : ""}" data-tab="overview">${helpers.localize("panel.tabs.overview")}</button>
      <button type="button" class="panel-tab ${context.activeTab === "stats" ? "panel-tab--active" : ""}" data-tab="stats">${helpers.localize("panel.tabs.stats")}</button>
      <button type="button" class="panel-tab ${context.activeTab === "actions" ? "panel-tab--active" : ""}" data-tab="actions">${helpers.localize("panel.tabs.actions")}</button>
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
              ${n.poe ? `<span class="badge badge--poe">${helpers.localize("panel.badge.poe")}</span>` : ""}
              ${n.wireless ? `<span class="badge badge--wireless">${helpers.localize("panel.badge.wifi")}</span>` : ""}
              ${n.label ? `<span class="badge badge--port">${helpers.escapeHtml(n.label)}</span>` : ""}
            </span>
          </div>
        `,
        )
        .join("")
    : `<div class="panel-empty__text">${helpers.localize("panel.no_connections")}</div>`;

  const relatedEntitiesSection = renderRelatedEntitiesSection(context, name, helpers);
  const vlanSection = renderVlanSection(context, name, helpers);

  return `
    ${vlanSection}
    <div class="panel-section">
      <div class="panel-section__title">${helpers.localize("panel.connected_devices")}</div>
      <div class="neighbor-list">${neighborList}</div>
    </div>
    ${relatedEntitiesSection}
  `;
}

function renderVlanSection(context: PanelContext, name: string, helpers: PanelHelpers): string {
  const vlanInfo = getNodeVlanInfo(name, context.payload);
  if (!vlanInfo) {
    return "";
  }

  return `
    <div class="panel-section">
      <div class="panel-section__title">${helpers.localize("panel.network")}</div>
      <div class="stats-list">
        <div class="stats-row">
          <span class="stats-row__label">${helpers.localize("panel.vlan")}</span>
          <span class="stats-row__value">${helpers.escapeHtml(vlanInfo.name)}</span>
        </div>
        <div class="stats-row">
          <span class="stats-row__label">${helpers.localize("panel.vlan_id")}</span>
          <span class="stats-row__value">${vlanInfo.id}</span>
        </div>
      </div>
    </div>
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
      const stateLabel = normalizeStateLabel(entity.state, entity.domain, helpers.localize);

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
      <div class="panel-section__title">${helpers.localize("panel.entities")}</div>
      <div class="entity-list">${entityItems}</div>
    </div>
  `;
}

function normalizeStateLabel(
  state: string | null,
  domain: string,
  localize: (key: string) => string,
): string {
  if (!state) return localize("panel.status.unknown");
  const lower = state.toLowerCase();

  // Normalize device_tracker states to Online/Offline
  if (domain === "device_tracker") {
    if (lower === "home" || lower === "connected") return localize("panel.status.online");
    if (lower === "not_home" || lower === "disconnected") return localize("panel.status.offline");
  }

  // Capitalize first letter for other states
  return state.charAt(0).toUpperCase() + state.slice(1).replace(/_/g, " ");
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
  const vlanInfo = getNodeVlanInfo(name, context.payload);

  return `
    ${renderStatsLiveStatus(status, helpers)}
    ${renderStatsConnectionSection(nodeEdges, helpers)}
    ${renderStatsNetworkInfo(vlanInfo, helpers)}
    ${renderStatsDeviceInfo(mac, ip, helpers)}
  `;
}

function renderStatsLiveStatus(status: NodeStatus | undefined, helpers: PanelHelpers): string {
  if (!status) {
    return "";
  }
  return `
    <div class="panel-section">
      <div class="panel-section__title">${helpers.localize("panel.status.live")}</div>
      <div class="stats-list">
        <div class="stats-row">
          <span class="stats-row__label">${helpers.localize("panel.status.status")}</span>
          <span class="stats-row__value">${helpers.getStatusBadgeHtml(status.state)}</span>
        </div>
        <div class="stats-row">
          <span class="stats-row__label">${helpers.localize("panel.status.last_changed")}</span>
          <span class="stats-row__value">${helpers.formatLastChanged(status.last_changed)}</span>
        </div>
      </div>
    </div>
  `;
}

function renderStatsConnectionSection(
  nodeEdges: Array<{ wireless?: boolean | null; poe?: boolean | null }>,
  helpers: PanelHelpers,
): string {
  const wirelessCount = nodeEdges.filter((e) => e.wireless).length;
  const wiredCount = nodeEdges.length - wirelessCount;
  const poeCount = nodeEdges.filter((e) => e.poe).length;
  const poeRow =
    poeCount > 0
      ? `<div class="stats-row"><span class="stats-row__label">${helpers.localize("panel.stats.connection_poe")}</span><span class="stats-row__value">${poeCount}</span></div>`
      : "";

  return `
    <div class="panel-section">
      <div class="panel-section__title">${helpers.localize("panel.stats.connection")}</div>
      <div class="stats-list">
        <div class="stats-row">
          <span class="stats-row__label">${helpers.localize("panel.stats.total_connections")}</span>
          <span class="stats-row__value">${nodeEdges.length}</span>
        </div>
        <div class="stats-row">
          <span class="stats-row__label">${helpers.localize("panel.stats.wired")}</span>
          <span class="stats-row__value">${wiredCount}</span>
        </div>
        <div class="stats-row">
          <span class="stats-row__label">${helpers.localize("panel.stats.wireless")}</span>
          <span class="stats-row__value">${wirelessCount}</span>
        </div>
        ${poeRow}
      </div>
    </div>
  `;
}

function renderStatsNetworkInfo(vlanInfo: VlanInfo | null, helpers: PanelHelpers): string {
  if (!vlanInfo) {
    return "";
  }
  return `
    <div class="panel-section">
      <div class="panel-section__title">${helpers.localize("panel.network_info")}</div>
      <div class="stats-list">
        <div class="stats-row">
          <span class="stats-row__label">${helpers.localize("panel.network")}</span>
          <span class="stats-row__value">${helpers.escapeHtml(vlanInfo.name)}</span>
        </div>
        <div class="stats-row">
          <span class="stats-row__label">${helpers.localize("panel.vlan_id")}</span>
          <span class="stats-row__value">${vlanInfo.id}</span>
        </div>
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
        <span class="info-row__label">${helpers.localize("panel.stats.mac")}</span>
        <code class="info-row__value">${helpers.escapeHtml(mac)}</code>
      </div>
    `
    : "";
  const ipRow = ip
    ? `
      <div class="info-row">
        <span class="info-row__label">${helpers.localize("panel.stats.ip")}</span>
        <code class="info-row__value">${helpers.escapeHtml(ip)}</code>
      </div>
    `
    : "";
  return `
    <div class="panel-section">
      <div class="panel-section__title">${helpers.localize("panel.device_info")}</div>
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
      <div class="panel-section__title">${helpers.localize("panel.actions.title")}</div>
      <div class="actions-list">
        ${
          entityId
            ? `
            <button type="button" class="action-button" data-entity-id="${safeEntityId}">
              <span class="action-button__icon">${helpers.getIcon("action-details")}</span>
              <span class="action-button__text">${helpers.localize("panel.actions.view_entity")}</span>
            </button>
          `
            : `<div class="panel-empty__text">${helpers.localize("panel.actions.no_entity")}</div>`
        }
        ${
          hasPortInfo
            ? `
            <button type="button" class="action-button" data-action="view-ports" data-node-name="${safeName}">
              <span class="action-button__icon">${helpers.getIcon("action-ports")}</span>
              <span class="action-button__text">${helpers.localize("panel.actions.view_ports")}</span>
            </button>
          `
            : ""
        }
        ${
          mac
            ? `
            <button type="button" class="action-button" data-action="copy" data-copy-value="${safeMac}">
              <span class="action-button__icon">${helpers.getIcon("action-copy")}</span>
              <span class="action-button__text">${helpers.localize("panel.actions.copy_mac")}</span>
            </button>
          `
            : ""
        }
        ${
          ip
            ? `
            <button type="button" class="action-button" data-action="copy" data-copy-value="${safeIp}">
              <span class="action-button__icon">${helpers.getIcon("action-copy")}</span>
              <span class="action-button__text">${helpers.localize("panel.actions.copy_ip")}</span>
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
        <div class="panel-section__title">${helpers.localize("panel.actions.entity")}</div>
        <code class="entity-id">${safeEntityId}</code>
      </div>
    `
        : ""
    }
  `;
}

function renderOverviewStatsGrid(
  nodeCount: number,
  edgeCount: number,
  helpers: PanelHelpers,
): string {
  return `
    <div class="panel-stats-grid">
      <div class="stat-card">
        <div class="stat-card__value">${nodeCount}</div>
        <div class="stat-card__label">${helpers.localize("panel.overview.total_nodes")}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__value">${edgeCount}</div>
        <div class="stat-card__label">${helpers.localize("panel.overview.connections")}</div>
      </div>
    </div>
  `;
}

function renderOverviewStatusSection(counts: StatusCounts, helpers: PanelHelpers): string {
  if (!counts.hasStatus) {
    return "";
  }
  return `
    <div class="panel-section">
      <div class="panel-section__title">${helpers.localize("panel.status.live")}</div>
      <div class="device-list">
        <div class="device-row"><span class="status-dot status-dot--online"></span><span class="device-row__label">${helpers.localize("panel.status.online")}</span><span class="device-row__count">${counts.online}</span></div>
        <div class="device-row"><span class="status-dot status-dot--offline"></span><span class="device-row__label">${helpers.localize("panel.status.offline")}</span><span class="device-row__count">${counts.offline}</span></div>
      </div>
    </div>
  `;
}

function renderOverviewDeviceBreakdown(counts: DeviceCounts, helpers: PanelHelpers): string {
  const items: Array<{ key: keyof DeviceCounts; icon: string; label: string }> = [
    {
      key: "gateways",
      icon: helpers.getIcon("node-gateway"),
      label: helpers.localize("panel.device_type.gateways"),
    },
    {
      key: "switches",
      icon: helpers.getIcon("node-switch"),
      label: helpers.localize("panel.device_type.switches"),
    },
    {
      key: "aps",
      icon: helpers.getIcon("node-ap"),
      label: helpers.localize("panel.device_type.access_points"),
    },
    {
      key: "clients",
      icon: helpers.getIcon("node-client"),
      label: helpers.localize("panel.device_type.clients"),
    },
    {
      key: "other",
      icon: helpers.getIcon("node-other"),
      label: helpers.localize("panel.device_type.other"),
    },
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
      <div class="panel-section__title">${helpers.localize("panel.device_breakdown")}</div>
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

function getNodeVlanInfo(name: string, payload?: MapPayload): VlanInfo | null {
  if (!payload?.node_vlans || !payload?.vlan_info) {
    return null;
  }
  const vlanId = payload.node_vlans[name];
  if (vlanId === null || vlanId === undefined) {
    return null;
  }
  return payload.vlan_info[vlanId] ?? null;
}
