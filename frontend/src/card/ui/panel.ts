import type {
  DeviceCounts,
  MapPayload,
  Neighbor,
  NodeStatus,
  StatusCounts,
  VlanInfo,
  VpnTunnel,
} from "../core/types";
import type { IconName } from "./icons";
import {
  getNodeEntityId,
  getNodeIpFromPayload,
  getNodeModel,
  getNodeType,
  nodeMacFromId,
} from "../shared/node-utils";
import { formatEntityState } from "../shared/entity-state";
import { extractPortInfo, portSortNumber } from "../shared/port-label";
import { CLIENT_SUBTYPES } from "../interaction/filter-state";

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
  const nodeTypes = context.payload.node_types ?? {};
  const nodeStatus = context.payload.node_status ?? {};

  const deviceCounts = countDevicesByType(nodes, nodeTypes);
  const statusCounts = countNodeStatus(nodeStatus);

  return `
    <div class="panel-header">
      <div class="panel-header__title">${helpers.localize("panel.overview")}</div>
    </div>
    ${renderNodeCount(nodes.length, helpers)}
    ${renderOverviewStatusSection(statusCounts, helpers)}
    ${renderOverviewDeviceBreakdown(deviceCounts, helpers)}
    <div class="panel-hint">
      <span class="panel-hint__icon">${helpers.getIcon("hint")}</span>
      ${helpers.localize("panel.hint")}
    </div>
  `;
}

function renderNodePanel(context: PanelContext, name: string, helpers: PanelHelpers): string {
  const safeName = helpers.escapeHtml(getDisplayName(context.payload, name));
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
      const portInfo = extractPortInfo(edge.label, isLeft);
      return {
        name: neighborName,
        label: portInfo,
        portNumber: portSortNumber(portInfo),
        wireless: edge.wireless,
        poe: edge.poe,
      };
    });
  const uniqueNeighbors: Neighbor[] = Array.from(
    new Map(neighbors.map((n) => [n.name, n])).values(),
  );

  // Sort by port number (ascending), wireless connections last
  const sortedNeighbors = sortNeighborsByPort(uniqueNeighbors);

  const nodeNames = context.payload?.node_names ?? {};
  const neighborList = sortedNeighbors.length
    ? sortedNeighbors.map((n) => renderNeighborItem(n, nodeNames, helpers)).join("")
    : `<div class="panel-empty__text">${helpers.localize("panel.no_connections")}</div>`;

  const relatedEntitiesSection = renderRelatedEntitiesSection(context, name, helpers);
  const vlanSection = renderVlanSection(context, name, helpers);
  const vpnSection = renderVpnTunnelsSection(context, name, helpers);

  return `
    ${vlanSection}
    ${vpnSection}
    <div class="panel-section">
      <div class="panel-section__title">${helpers.localize("panel.connected_devices")}</div>
      <div class="neighbor-list neighbor-list--compact">${neighborList}</div>
    </div>
    ${relatedEntitiesSection}
  `;
}

function sortNeighborsByPort(neighbors: Neighbor[]): Neighbor[] {
  return [...neighbors].sort((a, b) => {
    // Wireless connections go last
    if (a.wireless && !b.wireless) return 1;
    if (!a.wireless && b.wireless) return -1;
    // Sort by port number
    return (a.portNumber ?? 999) - (b.portNumber ?? 999);
  });
}

function renderNeighborItem(
  n: Neighbor,
  nodeNames: Record<string, string>,
  helpers: PanelHelpers,
): string {
  const badges: string[] = [];
  if (n.label) badges.push(`<span class="badge badge--port">${helpers.escapeHtml(n.label)}</span>`);
  if (n.poe)
    badges.push(`<span class="badge badge--poe">${helpers.localize("panel.badge.poe")}</span>`);
  if (n.wireless)
    badges.push(
      `<span class="badge badge--wireless">${helpers.localize("panel.badge.wifi")}</span>`,
    );

  const displayName = nodeNames[n.name] ?? n.name;
  const safeDisplayName = helpers.escapeHtml(displayName);
  const safeId = helpers.escapeHtml(n.name);
  return `
    <div class="neighbor-item neighbor-item--compact">
      <a href="#" class="neighbor-item__name neighbor-item__name--link" data-navigate-device="${safeId}">${safeDisplayName}</a>
      <span class="neighbor-item__badges">${badges.join("")}</span>
    </div>
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

function renderVpnTunnelsSection(
  context: PanelContext,
  name: string,
  helpers: PanelHelpers,
): string {
  const nodeType = context.payload?.node_types?.[name];
  if (nodeType !== "gateway") return "";

  const tunnels = getNodeVpnTunnels(name, context.payload);
  if (tunnels.length === 0) return "";

  const tunnelRows = tunnels
    .map((t) => {
      const statusClass = t.up ? "badge--online" : "badge--offline";
      const statusLabel = t.up
        ? helpers.localize("panel.vpn.status_up")
        : helpers.localize("panel.vpn.status_down");
      const safeName = helpers.escapeHtml(t.name);
      const safeType = helpers.escapeHtml(t.vpn_type);
      const subnets = t.remote_subnets.map((s) => helpers.escapeHtml(s)).join(", ");
      const ifnameRow = t.ifname
        ? `<div class="stats-row"><span class="stats-row__label">${helpers.localize("panel.vpn.interface")}</span><span class="stats-row__value"><code>${helpers.escapeHtml(t.ifname)}</code></span></div>`
        : "";
      const subnetsRow = subnets
        ? `<div class="stats-row"><span class="stats-row__label">${helpers.localize("panel.vpn.remote_subnets")}</span><span class="stats-row__value">${subnets}</span></div>`
        : "";
      return `
        <div class="vpn-tunnel">
          <div class="stats-row">
            <span class="stats-row__label">${safeName}</span>
            <span class="badge ${statusClass}">${statusLabel}</span>
          </div>
          <div class="stats-row">
            <span class="stats-row__label">${helpers.localize("panel.vpn.type")}</span>
            <span class="stats-row__value">${safeType}</span>
          </div>
          ${ifnameRow}
          ${subnetsRow}
        </div>
      `;
    })
    .join("");

  return `
    <div class="panel-section">
      <div class="panel-section__title">${helpers.localize("panel.vpn_tunnels")}</div>
      <div class="stats-list">${tunnelRows}</div>
    </div>
  `;
}

function getNodeVpnTunnels(name: string, payload?: MapPayload): VpnTunnel[] {
  if (!payload?.vpn_tunnels) return [];
  const mac = name.toLowerCase();
  return payload.vpn_tunnels.filter((t) => !t.gateway_mac || t.gateway_mac.toLowerCase() === mac);
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
      const stateLabel = normalizeStateLabel(
        entity.state,
        entity.domain,
        entity.entity_id,
        helpers.localize,
      );
      const safeDisplayName = helpers.escapeHtml(displayName);
      const safeEntityId = helpers.escapeHtml(entity.entity_id);

      return `
        <div class="entity-item" data-entity-id="${safeEntityId}">
          <span class="entity-item__icon">${icon}</span>
          <div class="entity-item__info">
            <span class="entity-item__name" title="${safeDisplayName}">${safeDisplayName}</span>
            <span class="entity-item__id" title="${safeEntityId}">${safeEntityId}</span>
          </div>
          <span class="entity-item__state ${stateClass}" title="${helpers.escapeHtml(entity.state ?? "")}">${helpers.escapeHtml(stateLabel)}</span>
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
  entityId: string,
  localize: (key: string) => string,
): string {
  if (!state) return localize("panel.status.unknown");

  const trackerLabel = formatDeviceTrackerState(state, domain, localize);
  if (trackerLabel) return trackerLabel;

  return formatEntityState({ state, domain, entityId }).display;
}

function formatDeviceTrackerState(
  state: string,
  domain: string,
  localize: (key: string) => string,
): string | null {
  if (domain !== "device_tracker") return null;
  const lower = state.toLowerCase();
  if (lower === "home" || lower === "connected") return localize("panel.status.online");
  if (lower === "not_home" || lower === "disconnected") return localize("panel.status.offline");
  return null;
}

function getEntityStateClass(state: string | null): string {
  if (!state) return "entity-item__state--unknown";
  const onStates = ["on", "home", "connected", "online", "true"];
  const offStates = ["off", "not_home", "disconnected", "offline", "false", "unavailable"];
  if (onStates.includes(state.toLowerCase())) return "entity-item__state--on";
  if (offStates.includes(state.toLowerCase())) return "entity-item__state--off";
  return "entity-item__state--neutral";
}

function renderStatsTab(context: PanelContext, name: string, helpers: PanelHelpers): string {
  const data = getStatsTabData(context, name);
  return `
    ${renderStatsLiveStatus(data.status, helpers)}
    ${renderStatsConnectionSection(data.nodeEdges, data.nodeType, data.apWirelessClients, helpers)}
    ${renderStatsNetworkInfo(data.vlanInfo, helpers)}
    ${renderStatsDeviceInfo(data.mac, data.ip, data.model, helpers)}
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
  nodeType: string | undefined,
  apWirelessClients: number | undefined,
  helpers: PanelHelpers,
): string {
  const wiredCount = nodeEdges.filter((e) => !e.wireless).length;
  const poeCount = nodeEdges.filter((e) => e.poe).length;
  const poeRow =
    poeCount > 0
      ? `<div class="stats-row"><span class="stats-row__label">${helpers.localize("panel.stats.connection_poe")}</span><span class="stats-row__value">${poeCount}</span></div>`
      : "";

  // For APs, show wireless client count from ap_client_counts (always available)
  const isAp = nodeType === "ap" || nodeType === "access_point";
  const wirelessClientsRow =
    isAp && apWirelessClients !== undefined
      ? `<div class="stats-row"><span class="stats-row__label">${helpers.localize("panel.stats.wireless_clients")}</span><span class="stats-row__value">${apWirelessClients}</span></div>`
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
        ${poeRow}
        ${wirelessClientsRow}
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
  model: string | null,
  helpers: PanelHelpers,
): string {
  if (!mac && !ip && !model) {
    return "";
  }
  const modelRow = model
    ? `
      <div class="info-row">
        <span class="info-row__label">${helpers.localize("panel.stats.model")}</span>
        <span class="info-row__value">${helpers.escapeHtml(model)}</span>
      </div>
    `
    : "";
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
      ${modelRow}
      ${macRow}
      ${ipRow}
    </div>
  `;
}

function renderActionsTab(context: PanelContext, name: string, helpers: PanelHelpers): string {
  const data = getActionsTabData(context, name, helpers);
  const actionItems = buildActionItems(data, helpers);
  return `
    <div class="panel-section">
      <div class="panel-section__title">${helpers.localize("panel.actions.title")}</div>
      <div class="actions-list">
        ${actionItems.join("")}
      </div>
    </div>
    ${renderEntityIdSection(data, helpers)}
  `;
}

type StatsTabData = {
  nodeEdges: Array<{ wireless?: boolean | null; poe?: boolean | null }>;
  mac: string | null;
  ip: string | null;
  model: string | null;
  status: NodeStatus | undefined;
  vlanInfo: VlanInfo | null;
  nodeType: string | undefined;
  apWirelessClients: number | undefined;
};

function getStatsTabData(context: PanelContext, name: string): StatsTabData {
  const edges = context.payload?.edges ?? [];
  return {
    nodeEdges: edges.filter((edge) => edge.left === name || edge.right === name),
    mac: nodeMacFromId(context.payload, name), // node ids are MACs
    ip: getNodeIpFromPayload(context.payload, name),
    model: getNodeModel(context.payload, name),
    status: context.payload?.node_status?.[name],
    vlanInfo: getNodeVlanInfo(name, context.payload),
    nodeType: getNodeType(context.payload, name),
    apWirelessClients: context.payload?.ap_client_counts?.[name],
  };
}

type ActionsTabData = {
  entityId: string | null;
  hasPortInfo: boolean;
  safeEntityId: string;
  safeMac: string;
  safeIp: string;
  safeName: string;
};

function getActionsTabData(
  context: PanelContext,
  name: string,
  helpers: PanelHelpers,
): ActionsTabData {
  const entityId = getNodeEntityId(context.payload, name);
  const mac = nodeMacFromId(context.payload, name); // node ids are MACs
  const ip = getNodeIpFromPayload(context.payload, name);
  const nodeType = getNodeType(context.payload, name);
  return {
    entityId,
    hasPortInfo: nodeType === "switch" || nodeType === "gateway",
    safeEntityId: entityId ? helpers.escapeHtml(entityId) : "",
    safeMac: mac ? helpers.escapeHtml(mac) : "",
    safeIp: ip ? helpers.escapeHtml(ip) : "",
    safeName: helpers.escapeHtml(name), // name is a MAC, used as node identifier
  };
}

function buildActionItems(data: ActionsTabData, helpers: PanelHelpers): string[] {
  const items: string[] = [];
  pushIf(items, renderEntityAction(data, helpers));
  pushIf(items, renderPortsAction(data, helpers));
  pushIf(items, renderCopyAction("copy_mac", data.safeMac, helpers));
  pushIf(items, renderCopyAction("copy_ip", data.safeIp, helpers));
  return items;
}

function renderEntityAction(data: ActionsTabData, helpers: PanelHelpers): string {
  if (!data.entityId) {
    return `<div class="panel-empty__text">${helpers.localize("panel.actions.no_entity")}</div>`;
  }
  return `
    <button type="button" class="action-button" data-entity-id="${data.safeEntityId}">
      <span class="action-button__icon">${helpers.getIcon("action-details")}</span>
      <span class="action-button__text">${helpers.localize("panel.actions.view_entity")}</span>
    </button>
  `;
}

function renderPortsAction(data: ActionsTabData, helpers: PanelHelpers): string | null {
  if (!data.hasPortInfo) {
    return null;
  }
  return `
    <button type="button" class="action-button" data-action="view-ports" data-node-name="${data.safeName}">
      <span class="action-button__icon">${helpers.getIcon("action-ports")}</span>
      <span class="action-button__text">${helpers.localize("panel.actions.view_ports")}</span>
    </button>
  `;
}

function renderCopyAction(
  labelKey: "copy_mac" | "copy_ip",
  value: string,
  helpers: PanelHelpers,
): string | null {
  if (!value) {
    return null;
  }
  return `
    <button type="button" class="action-button" data-action="copy" data-copy-value="${value}">
      <span class="action-button__icon">${helpers.getIcon("action-copy")}</span>
      <span class="action-button__text">${helpers.localize(`panel.actions.${labelKey}`)}</span>
    </button>
  `;
}

function renderEntityIdSection(data: ActionsTabData, helpers: PanelHelpers): string {
  if (!data.entityId) {
    return "";
  }
  return `
    <div class="panel-section">
      <div class="panel-section__title">${helpers.localize("panel.actions.entity")}</div>
      <code class="entity-id">${data.safeEntityId}</code>
    </div>
  `;
}

function pushIf(items: string[], value: string | null): void {
  if (value) {
    items.push(value);
  }
}

function getDisplayName(payload: PanelContext["payload"], nodeId: string): string {
  return payload?.node_names?.[nodeId] ?? nodeId;
}

function renderNodeCount(nodeCount: number, helpers: PanelHelpers): string {
  return `
    <div class="panel-stats-compact">
      <span class="panel-stats-compact__value">${nodeCount}</span>
      <span class="panel-stats-compact__label">${helpers.localize("panel.overview.total_nodes")}</span>
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

function isClientType(type: string): boolean {
  return (CLIENT_SUBTYPES as readonly string[]).includes(type);
}

function countDevicesByType(nodes: string[], nodeTypes: Record<string, string>): DeviceCounts {
  return {
    gateways: nodes.filter((n) => nodeTypes[n] === "gateway").length,
    switches: nodes.filter((n) => nodeTypes[n] === "switch").length,
    aps: nodes.filter((n) => nodeTypes[n] === "ap").length,
    clients: nodes.filter((n) => isClientType(nodeTypes[n])).length,
    other: nodes.filter(
      (n) => !["gateway", "switch", "ap"].includes(nodeTypes[n]) && !isClientType(nodeTypes[n]),
    ).length,
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
