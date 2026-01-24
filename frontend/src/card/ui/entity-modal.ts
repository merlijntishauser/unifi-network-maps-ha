import { escapeHtml } from "../data/sanitize";
import { domainIcon } from "./icons";
import type { MapPayload, RelatedEntity } from "../core/types";

export type EntityModalContext = {
  nodeName: string;
  payload?: MapPayload;
  theme: "dark" | "light" | "unifi" | "unifi-dark";
  getNodeTypeIcon: (nodeType: string) => string;
  formatLastChanged: (value: string | null | undefined) => string;
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

  const infoRows: string[] = [];

  if (mac) {
    infoRows.push(`
      <div class="entity-modal__info-row">
        <span class="entity-modal__info-label">MAC Address</span>
        <span class="entity-modal__info-value">${escapeHtml(mac)}</span>
      </div>
    `);
  }

  const ipEntity = relatedEntities.find((entity) => entity.ip);
  if (ipEntity?.ip) {
    infoRows.push(`
      <div class="entity-modal__info-row">
        <span class="entity-modal__info-label">IP Address</span>
        <span class="entity-modal__info-value">${escapeHtml(ipEntity.ip)}</span>
      </div>
    `);
  }

  if (status?.state) {
    const stateDisplay =
      status.state === "online" ? "Online" : status.state === "offline" ? "Offline" : "Unknown";
    infoRows.push(`
      <div class="entity-modal__info-row">
        <span class="entity-modal__info-label">Status</span>
        <span class="entity-modal__info-value">${stateDisplay}</span>
      </div>
    `);
  }

  if (status?.last_changed) {
    infoRows.push(`
      <div class="entity-modal__info-row">
        <span class="entity-modal__info-label">Last Changed</span>
        <span class="entity-modal__info-value">${context.formatLastChanged(status.last_changed)}</span>
      </div>
    `);
  }

  infoRows.push(`
    <div class="entity-modal__info-row">
      <span class="entity-modal__info-label">Device Type</span>
      <span class="entity-modal__info-value">${escapeHtml(nodeType)}</span>
    </div>
  `);

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
            <div class="entity-modal__section-title">Device Information</div>
            <div class="entity-modal__info-grid">
              ${infoRows.join("")}
            </div>
          </div>
          ${
            relatedEntities.length > 0
              ? `
            <div class="entity-modal__section">
              <div class="entity-modal__section-title">Related Entities (${relatedEntities.length})</div>
              <div class="entity-modal__entity-list">
                ${entityItems}
              </div>
            </div>
          `
              : `
            <div class="entity-modal__section">
              <div class="entity-modal__section-title">Related Entities</div>
              <div class="panel-empty__text">No Home Assistant entities found for this device</div>
            </div>
          `
          }
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
