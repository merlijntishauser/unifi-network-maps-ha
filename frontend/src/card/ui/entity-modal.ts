import { escapeHtml } from "../data/sanitize";
import { domainIcon } from "./icons";
import type { MapPayload, RelatedEntity, NodeStatus } from "../core/types";

export type EntityModalContext = {
  nodeName: string;
  payload?: MapPayload;
  theme: "dark" | "light" | "unifi" | "unifi-dark";
  getNodeTypeIcon: (nodeType: string) => string;
  formatLastChanged: (value: string | null | undefined) => string;
  localize: (key: string, replacements?: Record<string, string | number>) => string;
};

export function renderEntityModal(context: EntityModalContext): string {
  const data = buildEntityModalData(context);
  return renderEntityModalMarkup(data, context);
}

function renderEntityItem(
  entity: RelatedEntity,
  theme: "dark" | "light" | "unifi" | "unifi-dark",
  nodeName: string,
): string {
  const domainIconMarkup = domainIcon(entity.domain, theme);
  const displayName = getCompactDisplayName(entity, nodeName);
  const safeDisplayName = escapeHtml(displayName);
  const safeEntityId = escapeHtml(entity.entity_id);
  const compactEntityId = getCompactEntityId(entity.entity_id);
  const formattedState = formatEntityState(entity);
  const stateClass = getStateBadgeClass(formattedState.normalized);

  return `
    <div class="entity-modal__entity-item" data-modal-entity-id="${safeEntityId}">
      <span class="entity-modal__domain-icon">${domainIconMarkup}</span>
      <div class="entity-modal__entity-info">
        <span class="entity-modal__entity-name" title="${safeDisplayName}">${safeDisplayName}</span>
        <span class="entity-modal__entity-id" title="${safeEntityId}">${escapeHtml(compactEntityId)}</span>
      </div>
      <div class="entity-modal__entity-state">
        <span class="entity-modal__state-badge ${stateClass}">${escapeHtml(formattedState.display)}</span>
        <span class="entity-modal__arrow">›</span>
      </div>
    </div>
  `;
}

function getCompactDisplayName(entity: RelatedEntity, nodeName: string): string {
  const fullName = entity.friendly_name ?? entity.entity_id;

  // Try to strip the device name prefix if present
  const lowerName = fullName.toLowerCase();
  const lowerNodeName = nodeName.toLowerCase();

  if (lowerName.startsWith(lowerNodeName + " ")) {
    const stripped = fullName.substring(nodeName.length + 1).trim();
    if (stripped.length > 0) {
      return capitalizeFirst(stripped);
    }
  }

  // Try common variations (with underscore or hyphen)
  const normalizedNode = nodeName.replace(/[\s_-]+/g, " ").toLowerCase();
  const normalizedFull = fullName.replace(/[\s_-]+/g, " ").toLowerCase();

  if (normalizedFull.startsWith(normalizedNode + " ")) {
    const prefixLen = normalizedNode.length + 1;
    const stripped = fullName
      .replace(/[\s_-]+/g, " ")
      .substring(prefixLen)
      .trim();
    if (stripped.length > 0) {
      return capitalizeFirst(stripped);
    }
  }

  return fullName;
}

function getCompactEntityId(entityId: string): string {
  // Show domain abbreviation + object_id
  const parts = entityId.split(".");
  if (parts.length !== 2) return entityId;

  const domain = parts[0];
  const objectId = parts[1];

  // Abbreviate common domains
  const domainAbbr: Record<string, string> = {
    sensor: "sensor",
    binary_sensor: "binary",
    device_tracker: "tracker",
    switch: "switch",
    button: "button",
    update: "update",
    number: "number",
    select: "select",
  };

  const abbr = domainAbbr[domain] ?? domain;
  return `${abbr}.${objectId}`;
}

type FormattedState = {
  display: string;
  normalized: string;
};

const SIMPLE_STATES = ["on", "off", "home", "not_home", "unavailable", "unknown"];
const ISO_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T/;
const MAC_ADDRESS_PATTERN = /^([0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2}$/;
const NUMERIC_PATTERN = /^-?\d+(\.\d+)?$/;

function formatEntityState(entity: RelatedEntity): FormattedState {
  const state = entity.state ?? "unavailable";
  const domain = entity.domain ?? "";
  const lowerState = state.toLowerCase();

  if (SIMPLE_STATES.includes(lowerState)) {
    return { display: capitalizeFirst(state), normalized: lowerState };
  }

  const sensorResult = formatSensorState(state, domain, entity.entity_id);
  if (sensorResult) return sensorResult;

  const domainResult = formatDomainSpecificState(state, domain);
  if (domainResult) return domainResult;

  return formatFallbackState(state);
}

function formatSensorState(state: string, domain: string, entityId: string): FormattedState | null {
  if (domain !== "sensor" && domain !== "binary_sensor") return null;

  if (ISO_TIMESTAMP_PATTERN.test(state)) {
    return { display: formatTimestamp(state), normalized: "default" };
  }
  if (MAC_ADDRESS_PATTERN.test(state)) {
    return { display: state.substring(0, 8) + "…", normalized: "default" };
  }
  if (NUMERIC_PATTERN.test(state)) {
    return formatNumericState(state, entityId);
  }
  return null;
}

function formatNumericState(state: string, entityId: string): FormattedState {
  const num = parseFloat(state);
  const unit = inferUnitFromEntityId(entityId);

  if (Math.abs(num) >= 1000000) {
    return { display: formatLargeNumber(num) + unit, normalized: "default" };
  }

  // Format to reasonable precision
  const formatted = Number.isInteger(num) ? num.toString() : num.toFixed(1);
  return { display: formatted + unit, normalized: "default" };
}

const UNIT_PATTERNS: Array<{ patterns: string[]; unit: string; exclude?: string[] }> = [
  { patterns: ["utilization", "percent", "_pct"], unit: "%" },
  { patterns: ["temperature", "_temp"], unit: "°C" },
  { patterns: ["_power"], unit: " W", exclude: ["power_mode"] },
  { patterns: ["_voltage"], unit: " V" },
  { patterns: ["_current"], unit: " A", exclude: ["current_"] },
  { patterns: ["_speed", "bandwidth"], unit: " Mbps" },
  { patterns: ["_bytes", "_data"], unit: " B" },
  { patterns: ["uptime"], unit: " s" },
];

function inferUnitFromEntityId(entityId: string): string {
  const objectId = entityId.split(".")[1] ?? entityId;
  const lower = objectId.toLowerCase();

  for (const { patterns, unit, exclude } of UNIT_PATTERNS) {
    const matches = patterns.some((p) => lower.includes(p));
    const excluded = exclude?.some((e) => lower.includes(e)) ?? false;
    if (matches && !excluded) {
      return unit;
    }
  }

  return "";
}

function formatDomainSpecificState(state: string, domain: string): FormattedState | null {
  if (domain === "button") {
    return { display: "—", normalized: "default" };
  }
  if (domain === "update") {
    if (state === "off") return { display: "Up to date", normalized: "off" };
    if (state === "on") return { display: "Update", normalized: "on" };
  }
  return null;
}

function formatFallbackState(state: string): FormattedState {
  if (state.length > 12) {
    return { display: state.substring(0, 10) + "…", normalized: "default" };
  }
  return { display: capitalizeFirst(state), normalized: state.toLowerCase() };
}

function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function formatTimestamp(iso: string): string {
  try {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  } catch {
    return "—";
  }
}

function formatLargeNumber(num: number): string {
  if (Math.abs(num) >= 1000000000) {
    return (num / 1000000000).toFixed(1) + "B";
  }
  if (Math.abs(num) >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (Math.abs(num) >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

function getStateBadgeClass(state: string): string {
  if (state === "home" || state === "on" || state === "connected") {
    return "entity-modal__state-badge--on";
  }
  if (state === "not_home" || state === "off" || state === "disconnected") {
    return "entity-modal__state-badge--off";
  }
  return "entity-modal__state-badge--default";
}

type InfoRowsContext = {
  mac: string | undefined;
  model: string | undefined;
  status: NodeStatus | undefined;
  nodeType: string;
  relatedEntities: RelatedEntity[];
  context: EntityModalContext;
};

type EntityModalData = {
  safeName: string;
  nodeType: string;
  status: NodeStatus | undefined;
  relatedEntities: RelatedEntity[];
  typeIcon: string;
  infoRows: string[];
  entityItems: string;
  theme: EntityModalContext["theme"];
};

function buildEntityModalData(context: EntityModalContext): EntityModalData {
  const nodeName = context.nodeName;
  const mac = getNodeMac(context.payload, nodeName);
  const model = getNodeModel(context.payload, nodeName);
  const nodeType = getNodeType(context.payload, nodeName);
  const status = context.payload?.node_status?.[nodeName];
  const relatedEntities = context.payload?.related_entities?.[nodeName] ?? [];
  return {
    safeName: escapeHtml(nodeName),
    nodeType,
    status,
    relatedEntities,
    typeIcon: context.getNodeTypeIcon(nodeType),
    infoRows: buildEntityInfoRows({ mac, model, status, nodeType, relatedEntities, context }),
    entityItems: relatedEntities
      .map((entity) => renderEntityItem(entity, context.theme, nodeName))
      .join(""),
    theme: context.theme,
  };
}

function renderEntityModalMarkup(data: EntityModalData, context: EntityModalContext): string {
  return `
    <div class="entity-modal-overlay" data-modal-overlay data-theme="${escapeHtml(data.theme)}">
      <div class="entity-modal">
        <div class="entity-modal__header">
          <div class="entity-modal__title">
            <span>${data.typeIcon}</span>
            <span>${data.safeName}</span>
          </div>
          <button type="button" class="entity-modal__close" data-action="close-modal">&times;</button>
        </div>
        <div class="entity-modal__body">
          <div class="entity-modal__section">
            <div class="entity-modal__section-title">${context.localize("entity_modal.device_info")}</div>
            <div class="entity-modal__info-grid">
              ${data.infoRows.join("")}
            </div>
          </div>
          ${renderRelatedEntitiesSection(data.relatedEntities, data.entityItems, context)}
        </div>
      </div>
    </div>
  `;
}

function buildEntityInfoRows(input: InfoRowsContext): string[] {
  const { mac, model, status, nodeType, relatedEntities, context } = input;
  const infoRows: string[] = [];
  pushIf(infoRows, renderModelRow(model, context));
  pushIf(infoRows, renderMacRow(mac, context));
  pushIf(infoRows, renderIpRow(relatedEntities, context));
  pushIf(infoRows, renderStatusRow(status, context));
  pushIf(infoRows, renderLastChangedRow(status, context));
  infoRows.push(renderDeviceTypeRow(nodeType, context));
  return infoRows;
}

function getNodeMac(payload: MapPayload | undefined, nodeName: string): string | undefined {
  return payload?.client_macs?.[nodeName] ?? payload?.device_macs?.[nodeName];
}

function getNodeType(payload: MapPayload | undefined, nodeName: string): string {
  return payload?.node_types?.[nodeName] ?? "unknown";
}

function getNodeModel(payload: MapPayload | undefined, nodeName: string): string | undefined {
  const details = payload?.device_details?.[nodeName];
  if (!details) return undefined;
  // Prefer model_name (friendly name) over model code
  return details.model_name ?? details.model ?? undefined;
}

function renderModelRow(model: string | undefined, context: EntityModalContext): string | null {
  if (!model) {
    return null;
  }
  return `
    <div class="entity-modal__info-row">
      <span class="entity-modal__info-label">${context.localize("entity_modal.model")}</span>
      <span class="entity-modal__info-value">${escapeHtml(model)}</span>
    </div>
  `;
}

function renderMacRow(mac: string | undefined, context: EntityModalContext): string | null {
  if (!mac) {
    return null;
  }
  return `
    <div class="entity-modal__info-row">
      <span class="entity-modal__info-label">${context.localize("entity_modal.mac")}</span>
      <span class="entity-modal__info-value">${escapeHtml(mac)}</span>
    </div>
  `;
}

function renderIpRow(relatedEntities: RelatedEntity[], context: EntityModalContext): string | null {
  const ipEntity = relatedEntities.find((entity) => entity.ip);
  if (!ipEntity?.ip) {
    return null;
  }
  return `
    <div class="entity-modal__info-row">
      <span class="entity-modal__info-label">${context.localize("entity_modal.ip")}</span>
      <span class="entity-modal__info-value">${escapeHtml(ipEntity.ip)}</span>
    </div>
  `;
}

function renderStatusRow(
  status: NodeStatus | undefined,
  context: EntityModalContext,
): string | null {
  if (!status?.state) {
    return null;
  }
  return `
    <div class="entity-modal__info-row">
      <span class="entity-modal__info-label">${context.localize("entity_modal.status")}</span>
      <span class="entity-modal__info-value">${getStatusLabel(status.state, context)}</span>
    </div>
  `;
}

function renderLastChangedRow(
  status: NodeStatus | undefined,
  context: EntityModalContext,
): string | null {
  if (!status?.last_changed) {
    return null;
  }
  return `
    <div class="entity-modal__info-row">
      <span class="entity-modal__info-label">${context.localize("entity_modal.last_changed")}</span>
      <span class="entity-modal__info-value">${context.formatLastChanged(status.last_changed)}</span>
    </div>
  `;
}

function renderDeviceTypeRow(nodeType: string, context: EntityModalContext): string {
  return `
    <div class="entity-modal__info-row">
      <span class="entity-modal__info-label">${context.localize("entity_modal.device_type")}</span>
      <span class="entity-modal__info-value">${escapeHtml(nodeType)}</span>
    </div>
  `;
}

function getStatusLabel(state: string, context: EntityModalContext): string {
  if (state === "online") {
    return context.localize("entity_modal.status_online");
  }
  if (state === "offline") {
    return context.localize("entity_modal.status_offline");
  }
  return context.localize("entity_modal.status_unknown");
}

function renderRelatedEntitiesSection(
  relatedEntities: RelatedEntity[],
  entityItems: string,
  context: EntityModalContext,
): string {
  if (!relatedEntities.length) {
    return `
      <div class="entity-modal__section">
        <div class="entity-modal__section-title">${context.localize("entity_modal.related_entities")}</div>
        <div class="panel-empty__text">${context.localize("entity_modal.no_entities")}</div>
      </div>
    `;
  }
  return `
    <div class="entity-modal__section">
      <div class="entity-modal__section-title">${context.localize("entity_modal.related_entities_count", { count: relatedEntities.length })}</div>
      <div class="entity-modal__entity-list">
        ${entityItems}
      </div>
    </div>
  `;
}

function pushIf(items: string[], value: string | null): void {
  if (value) {
    items.push(value);
  }
}
