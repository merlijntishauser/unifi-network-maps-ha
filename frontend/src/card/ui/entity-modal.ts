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
): string {
  const domainIconMarkup = domainIcon(entity.domain, theme);
  const displayName = entity.friendly_name ?? entity.entity_id;
  const safeDisplayName = escapeHtml(displayName);
  const safeEntityId = escapeHtml(entity.entity_id);
  const state = entity.state ?? "unavailable";
  const stateClass = getStateBadgeClass(state);

  return `
    <div class="entity-modal__entity-item" data-modal-entity-id="${safeEntityId}">
      <span class="entity-modal__domain-icon">${domainIconMarkup}</span>
      <div class="entity-modal__entity-info">
        <span class="entity-modal__entity-name">${safeDisplayName}</span>
        <span class="entity-modal__entity-id">${safeEntityId}</span>
      </div>
      <div class="entity-modal__entity-state">
        <span class="entity-modal__state-badge ${stateClass}">${escapeHtml(state)}</span>
        <span class="entity-modal__arrow">›</span>
      </div>
    </div>
  `;
}

function getStateBadgeClass(state: string): string {
  if (state === "home" || state === "on") {
    return `entity-modal__state-badge--${state}`;
  }
  if (state === "not_home" || state === "off") {
    return `entity-modal__state-badge--${state}`;
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
    entityItems: relatedEntities.map((entity) => renderEntityItem(entity, context.theme)).join(""),
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
