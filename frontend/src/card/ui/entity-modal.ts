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
  const safeName = escapeHtml(context.nodeName);
  const mac =
    context.payload?.client_macs?.[context.nodeName] ??
    context.payload?.device_macs?.[context.nodeName];
  const nodeType = context.payload?.node_types?.[context.nodeName] ?? "unknown";
  const status = context.payload?.node_status?.[context.nodeName];
  const relatedEntities = context.payload?.related_entities?.[context.nodeName] ?? [];
  const typeIcon = context.getNodeTypeIcon(nodeType);
  const infoRows = buildEntityInfoRows({
    mac,
    status,
    nodeType,
    relatedEntities,
    context,
  });
  const entityItems = relatedEntities
    .map((entity) => renderEntityItem(entity, context.theme))
    .join("");

  return `
    <div class="entity-modal-overlay" data-modal-overlay data-theme="${escapeHtml(context.theme)}">
      <div class="entity-modal">
        <div class="entity-modal__header">
          <div class="entity-modal__title">
            <span>${typeIcon}</span>
            <span>${safeName}</span>
          </div>
          <button type="button" class="entity-modal__close" data-action="close-modal">&times;</button>
        </div>
        <div class="entity-modal__body">
          <div class="entity-modal__section">
            <div class="entity-modal__section-title">${context.localize("entity_modal.device_info")}</div>
            <div class="entity-modal__info-grid">
              ${infoRows.join("")}
            </div>
          </div>
          ${renderRelatedEntitiesSection(relatedEntities, entityItems, context)}
        </div>
      </div>
    </div>
  `;
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
  status: NodeStatus | undefined;
  nodeType: string;
  relatedEntities: RelatedEntity[];
  context: EntityModalContext;
};

function buildEntityInfoRows(input: InfoRowsContext): string[] {
  const { mac, status, nodeType, relatedEntities, context } = input;
  const infoRows: string[] = [];
  pushIf(infoRows, renderMacRow(mac, context));
  pushIf(infoRows, renderIpRow(relatedEntities, context));
  pushIf(infoRows, renderStatusRow(status, context));
  pushIf(infoRows, renderLastChangedRow(status, context));
  infoRows.push(renderDeviceTypeRow(nodeType, context));
  return infoRows;
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
