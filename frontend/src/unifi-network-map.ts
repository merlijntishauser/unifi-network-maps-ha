function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

import DOMPurify from "dompurify";

declare const __CARD_VERSION__: string;

const CARD_VERSION = __CARD_VERSION__;

function sanitizeSvg(svg: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, "image/svg+xml");
  const svgElement = doc.querySelector("svg");
  if (!svgElement) {
    return "";
  }
  const dangerousElements = svgElement.querySelectorAll("script, foreignObject");
  dangerousElements.forEach((el) => el.remove());
  const allElements = svgElement.querySelectorAll("*");
  const eventAttrs = /^on[a-z]+$/i;
  allElements.forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (eventAttrs.test(attr.name)) {
        el.removeAttribute(attr.name);
      }
      if (attr.value.toLowerCase().includes("javascript:")) {
        el.removeAttribute(attr.name);
      }
    });
  });
  return svgElement.outerHTML;
}

const DOMPURIFY_CONFIG = {
  USE_PROFILES: { html: true, svg: true, svgFilters: true },
  ADD_ATTR: [
    "data-node-id",
    "data-action",
    "data-tab",
    "data-edge",
    "data-edge-left",
    "data-edge-right",
  ],
};

function sanitizeHtml(markup: string): string {
  return DOMPurify.sanitize(markup, DOMPURIFY_CONFIG);
}

type Hass = {
  auth?: {
    data?: {
      access_token?: string;
    };
  };
  callWS?: <T>(msg: Record<string, unknown>) => Promise<T>;
};

type CardConfig = {
  type?: string;
  entry_id?: string;
  svg_url?: string;
  data_url?: string;
  theme?: "dark" | "light";
};

type ConfigEntry = {
  entry_id: string;
  title: string;
  domain: string;
};

type NodeStatus = {
  entity_id: string;
  state: "online" | "offline" | "unknown";
  last_changed?: string | null;
};

const DOMAIN = "unifi_network_map";

const MIN_PAN_MOVEMENT_THRESHOLD = 2;
const ZOOM_INCREMENT = 0.1;
const MIN_ZOOM_SCALE = 0.5;
const MAX_ZOOM_SCALE = 4;
const TOOLTIP_OFFSET_PX = 12;

const CARD_STYLES = `
  unifi-network-map { display: block; height: 100%; }
  unifi-network-map ha-card { display: flex; flex-direction: column; height: 100%; box-sizing: border-box; }
  .unifi-network-map__layout { display: grid; grid-template-columns: minmax(0, 2.5fr) minmax(280px, 1fr); gap: 12px; flex: 1; padding: 12px; }
  .unifi-network-map__viewport { position: relative; overflow: hidden; min-height: 300px; background: linear-gradient(135deg, #0b1016 0%, #111827 100%); border-radius: 12px; touch-action: none; }
  .unifi-network-map__viewport svg { width: 100%; height: auto; display: block; }
  .unifi-network-map__controls { position: absolute; top: 8px; right: 8px; display: flex; gap: 6px; z-index: 3; }
  .unifi-network-map__controls button { background: rgba(15, 23, 42, 0.9); color: #e5e7eb; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 6px 10px; font-size: 12px; cursor: pointer; backdrop-filter: blur(8px); transition: all 0.15s ease; }
  .unifi-network-map__controls button:hover { background: rgba(59, 130, 246, 0.3); border-color: rgba(59, 130, 246, 0.5); }
  .unifi-network-map__viewport svg text, .unifi-network-map__viewport svg g { cursor: pointer; }
  .unifi-network-map__viewport svg path[data-edge] { cursor: pointer; transition: stroke-width 0.15s ease, filter 0.15s ease; pointer-events: stroke; }
  .unifi-network-map__viewport svg path[data-edge-hitbox] { stroke: transparent; stroke-width: 14; fill: none; pointer-events: stroke; }
  .unifi-network-map__viewport svg path[data-edge]:hover { stroke-width: 4; filter: drop-shadow(0 0 4px currentColor); }
  .unifi-network-map__panel { padding: 0; background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%); color: #e5e7eb; border-radius: 12px; font-size: 13px; overflow: hidden; display: flex; flex-direction: column; }
  .unifi-network-map__tooltip { position: fixed; z-index: 2; background: rgba(15, 23, 42, 0.95); color: #fff; padding: 8px 12px; border-radius: 8px; font-size: 12px; pointer-events: none; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(8px); max-width: 280px; }
  .unifi-network-map__tooltip--edge { display: flex; flex-direction: column; gap: 4px; }
  .tooltip-edge__title { font-weight: 600; color: #f1f5f9; margin-bottom: 2px; }
  .tooltip-edge__row { display: flex; align-items: center; gap: 6px; color: #94a3b8; }
  .tooltip-edge__icon { font-size: 14px; width: 18px; text-align: center; }
  .tooltip-edge__label { color: #cbd5e1; }

  /* Panel Header */
  .panel-header { display: flex; align-items: center; gap: 12px; padding: 16px; background: rgba(0,0,0,0.2); border-bottom: 1px solid rgba(255,255,255,0.05); }
  .panel-header__back { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #94a3b8; padding: 6px 10px; cursor: pointer; font-size: 14px; transition: all 0.15s ease; }
  .panel-header__back:hover { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
  .panel-header__info { flex: 1; min-width: 0; }
  .panel-header__title { font-weight: 600; font-size: 15px; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .panel-header__badge { display: inline-flex; align-items: center; gap: 4px; margin-top: 4px; padding: 2px 8px; background: rgba(59, 130, 246, 0.15); color: #60a5fa; border-radius: 12px; font-size: 11px; text-transform: capitalize; }
  .panel-header__title-row { display: flex; align-items: center; gap: 8px; }

  /* Tabs */
  .panel-tabs { display: flex; padding: 0 16px; background: rgba(0,0,0,0.1); border-bottom: 1px solid rgba(255,255,255,0.05); }
  .panel-tab { flex: 1; padding: 10px 8px; background: none; border: none; border-bottom: 2px solid transparent; color: #64748b; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s ease; }
  .panel-tab:hover { color: #94a3b8; }
  .panel-tab--active { color: #60a5fa; border-bottom-color: #3b82f6; }
  .panel-tab-content { flex: 1; overflow-y: auto; padding: 16px; }

  /* Sections */
  .panel-section { margin-bottom: 16px; padding: 0 16px; }
  .panel-section__title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 8px; }

  /* Stats Grid */
  .panel-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 16px; }
  .stat-card { background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 10px; padding: 12px; text-align: center; }
  .stat-card__value { font-size: 24px; font-weight: 700; color: #60a5fa; }
  .stat-card__label { font-size: 11px; color: #94a3b8; margin-top: 2px; }

  /* Stats List */
  .stats-list { display: flex; flex-direction: column; gap: 2px; }
  .stats-row { display: flex; justify-content: space-between; padding: 8px 10px; background: rgba(255,255,255,0.03); border-radius: 6px; }
  .stats-row__label { color: #94a3b8; }
  .stats-row__value { font-weight: 600; color: #e2e8f0; }

  /* Device List */
  .device-list { display: flex; flex-direction: column; gap: 4px; }
  .device-row { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: rgba(255,255,255,0.03); border-radius: 8px; }
  .device-row__icon { font-size: 14px; }
  .device-row__label { flex: 1; color: #cbd5e1; }
  .device-row__count { font-weight: 600; color: #60a5fa; background: rgba(59, 130, 246, 0.15); padding: 2px 8px; border-radius: 10px; font-size: 12px; }

  /* Neighbor List */
  .neighbor-list { display: flex; flex-direction: column; gap: 6px; }
  .neighbor-item { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 10px; background: rgba(255,255,255,0.03); border-radius: 8px; transition: background 0.15s ease; }
  .neighbor-item:hover { background: rgba(255,255,255,0.06); }
  .neighbor-item__name { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #e2e8f0; font-size: 12px; }
  .neighbor-item__badges { display: flex; gap: 4px; flex-shrink: 0; }

  /* Badges */
  .badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 500; }
  .badge--wireless { background: rgba(168, 85, 247, 0.2); color: #c084fc; }
  .badge--poe { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
  .badge--port { background: rgba(255,255,255,0.1); color: #94a3b8; }

  /* Status Indicators */
  .status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .status-dot--online { background: #22c55e; box-shadow: 0 0 6px rgba(34, 197, 94, 0.5); animation: status-pulse 2s ease-in-out infinite; }
  .status-dot--offline { background: #ef4444; }
  .status-dot--unknown { background: #6b7280; }
  @keyframes status-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }

  /* Status Badges */
  .status-badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; }
  .status-badge--online { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
  .status-badge--offline { background: rgba(239, 68, 68, 0.2); color: #f87171; }
  .status-badge--unknown { background: rgba(107, 114, 128, 0.2); color: #9ca3af; }

  /* Status Layer */
  .unifi-network-map__status-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; }

  /* Info Row */
  .info-row { display: flex; flex-direction: column; gap: 4px; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px; }
  .info-row__label { font-size: 11px; color: #64748b; }
  .info-row__value { font-family: ui-monospace, monospace; font-size: 12px; color: #60a5fa; word-break: break-all; }

  /* Actions */
  .actions-list { display: flex; flex-direction: column; gap: 8px; }
  .action-button { display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #e2e8f0; font-size: 13px; cursor: pointer; transition: all 0.15s ease; text-align: left; }
  .action-button:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.15); }
  .action-button--primary { background: rgba(59, 130, 246, 0.15); border-color: rgba(59, 130, 246, 0.3); }
  .action-button--primary:hover { background: rgba(59, 130, 246, 0.25); border-color: rgba(59, 130, 246, 0.4); }
  .action-button__icon { font-size: 16px; }
  .action-button__text { flex: 1; }

  /* Entity ID */
  .entity-id { display: block; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 6px; font-family: ui-monospace, monospace; font-size: 11px; color: #60a5fa; word-break: break-all; }

  /* Empty State */
  .panel-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px 16px; text-align: center; }
  .panel-empty__icon { font-size: 32px; margin-bottom: 12px; opacity: 0.5; }
  .panel-empty__text { color: #64748b; font-size: 13px; }

  /* Hint */
  .panel-hint { display: flex; align-items: center; gap: 8px; padding: 12px; margin: 12px; background: rgba(59, 130, 246, 0.1); border-radius: 8px; color: #94a3b8; font-size: 12px; }
  .panel-hint__icon { font-size: 14px; }

  /* Selected node highlight */
  .unifi-network-map__viewport svg [data-selected="true"],
  .unifi-network-map__viewport svg .node--selected {
    filter: drop-shadow(0 0 8px #3b82f6) drop-shadow(0 0 16px rgba(59, 130, 246, 0.6));
  }
  .unifi-network-map__viewport svg [data-selected="true"] > *,
  .unifi-network-map__viewport svg .node--selected > * {
    stroke: #3b82f6 !important;
    stroke-width: 2px;
  }

  /* Light theme overrides */
  ha-card[data-theme="light"] .unifi-network-map__viewport { background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); }
  ha-card[data-theme="light"] .unifi-network-map__controls button { background: rgba(226, 232, 240, 0.9); color: #0f172a; border-color: rgba(148, 163, 184, 0.5); }
  ha-card[data-theme="light"] .unifi-network-map__panel { background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%); color: #0f172a; }
  ha-card[data-theme="light"] .panel-header { background: rgba(148, 163, 184, 0.15); border-bottom-color: rgba(148, 163, 184, 0.3); }
  ha-card[data-theme="light"] .panel-header__title { color: #0f172a; }
  ha-card[data-theme="light"] .panel-header__badge { background: rgba(59, 130, 246, 0.15); color: #1d4ed8; }
  ha-card[data-theme="light"] .panel-tab { color: #64748b; }
  ha-card[data-theme="light"] .panel-tab--active { color: #1d4ed8; border-bottom-color: #3b82f6; }
  ha-card[data-theme="light"] .panel-section__title { color: #475569; }
  ha-card[data-theme="light"] .stat-card__label { color: #64748b; }
  ha-card[data-theme="light"] .device-row { background: rgba(15, 23, 42, 0.04); }
  ha-card[data-theme="light"] .device-row__label { color: #0f172a; }
  ha-card[data-theme="light"] .device-row__count { color: #1d4ed8; }
  ha-card[data-theme="light"] .neighbor-item { background: rgba(15, 23, 42, 0.04); }
  ha-card[data-theme="light"] .neighbor-item__name { color: #0f172a; }
  ha-card[data-theme="light"] .stats-row { background: rgba(15, 23, 42, 0.04); }
  ha-card[data-theme="light"] .stats-row__label { color: #64748b; }
  ha-card[data-theme="light"] .stats-row__value { color: #0f172a; }
  ha-card[data-theme="light"] .info-row { background: rgba(15, 23, 42, 0.04); }
  ha-card[data-theme="light"] .info-row__label { color: #64748b; }
  ha-card[data-theme="light"] .info-row__value { color: #1d4ed8; }
  ha-card[data-theme="light"] .action-button { background: rgba(15, 23, 42, 0.04); border-color: rgba(148, 163, 184, 0.5); color: #0f172a; }
  ha-card[data-theme="light"] .action-button--primary { background: rgba(59, 130, 246, 0.15); border-color: rgba(59, 130, 246, 0.3); }
  ha-card[data-theme="light"] .entity-id { background: rgba(15, 23, 42, 0.06); color: #1d4ed8; }
  ha-card[data-theme="light"] .panel-empty__text { color: #64748b; }
  ha-card[data-theme="light"] .panel-hint { background: rgba(59, 130, 246, 0.08); color: #475569; }
  ha-card[data-theme="light"] .unifi-network-map__tooltip { background: rgba(15, 23, 42, 0.9); }
  ha-card[data-theme="light"] .status-badge--online { background: rgba(34, 197, 94, 0.15); color: #16a34a; }
  ha-card[data-theme="light"] .status-badge--offline { background: rgba(239, 68, 68, 0.15); color: #dc2626; }
  ha-card[data-theme="light"] .status-badge--unknown { background: rgba(107, 114, 128, 0.15); color: #6b7280; }

  @media (max-width: 800px) {
    .unifi-network-map__layout { grid-template-columns: 1fr; }
  }

  /* Entity Modal Styles */
  .entity-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }
  .entity-modal {
    background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
    border-radius: 16px;
    width: 90%;
    max-width: 480px;
    max-height: 85vh;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(148, 163, 184, 0.2);
  }
  .entity-modal__header {
    padding: 20px 24px;
    background: rgba(148, 163, 184, 0.1);
    border-bottom: 1px solid rgba(148, 163, 184, 0.2);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .entity-modal__title {
    font-size: 18px;
    font-weight: 600;
    color: #f8fafc;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .entity-modal__close {
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 24px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 8px;
    transition: all 0.2s;
  }
  .entity-modal__close:hover {
    background: rgba(148, 163, 184, 0.2);
    color: #f8fafc;
  }
  .entity-modal__body {
    padding: 20px 24px;
    overflow-y: auto;
    max-height: calc(85vh - 80px);
  }
  .entity-modal__section {
    margin-bottom: 20px;
  }
  .entity-modal__section:last-child {
    margin-bottom: 0;
  }
  .entity-modal__section-title {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #64748b;
    margin-bottom: 12px;
  }
  .entity-modal__info-grid {
    display: grid;
    gap: 8px;
  }
  .entity-modal__info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    background: rgba(30, 41, 59, 0.5);
    border-radius: 8px;
    border: 1px solid rgba(148, 163, 184, 0.1);
  }
  .entity-modal__info-label {
    color: #94a3b8;
    font-size: 13px;
  }
  .entity-modal__info-value {
    color: #f8fafc;
    font-size: 13px;
    font-weight: 500;
    font-family: monospace;
  }
  .entity-modal__entity-list {
    display: grid;
    gap: 8px;
  }
  .entity-modal__entity-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    background: rgba(30, 41, 59, 0.5);
    border-radius: 10px;
    border: 1px solid rgba(148, 163, 184, 0.1);
    cursor: pointer;
    transition: all 0.2s;
  }
  .entity-modal__entity-item:hover {
    background: rgba(59, 130, 246, 0.15);
    border-color: rgba(59, 130, 246, 0.3);
  }
  .entity-modal__entity-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    flex: 1;
  }
  .entity-modal__entity-name {
    color: #f8fafc;
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .entity-modal__entity-id {
    color: #64748b;
    font-size: 11px;
    font-family: monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .entity-modal__entity-state {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
  .entity-modal__state-badge {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }
  .entity-modal__state-badge--home,
  .entity-modal__state-badge--on {
    background: rgba(34, 197, 94, 0.2);
    color: #4ade80;
  }
  .entity-modal__state-badge--not_home,
  .entity-modal__state-badge--off {
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
  }
  .entity-modal__state-badge--default {
    background: rgba(148, 163, 184, 0.2);
    color: #94a3b8;
  }
  .entity-modal__domain-icon {
    font-size: 20px;
    flex-shrink: 0;
    margin-right: 12px;
  }
  .entity-modal__arrow {
    color: #64748b;
    margin-left: 8px;
  }

  /* Light theme modal */
  .entity-modal-overlay[data-theme="light"] .entity-modal {
    background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
  }
  .entity-modal-overlay[data-theme="light"] .entity-modal__header {
    background: rgba(148, 163, 184, 0.15);
    border-bottom-color: rgba(148, 163, 184, 0.3);
  }
  .entity-modal-overlay[data-theme="light"] .entity-modal__title { color: #0f172a; }
  .entity-modal-overlay[data-theme="light"] .entity-modal__close { color: #64748b; }
  .entity-modal-overlay[data-theme="light"] .entity-modal__close:hover { background: rgba(15, 23, 42, 0.1); color: #0f172a; }
  .entity-modal-overlay[data-theme="light"] .entity-modal__section-title { color: #475569; }
  .entity-modal-overlay[data-theme="light"] .entity-modal__info-row { background: rgba(15, 23, 42, 0.04); }
  .entity-modal-overlay[data-theme="light"] .entity-modal__info-label { color: #64748b; }
  .entity-modal-overlay[data-theme="light"] .entity-modal__info-value { color: #0f172a; }
  .entity-modal-overlay[data-theme="light"] .entity-modal__entity-item { background: rgba(15, 23, 42, 0.04); }
  .entity-modal-overlay[data-theme="light"] .entity-modal__entity-item:hover { background: rgba(59, 130, 246, 0.1); }
  .entity-modal-overlay[data-theme="light"] .entity-modal__entity-name { color: #0f172a; }
  .entity-modal-overlay[data-theme="light"] .entity-modal__entity-id { color: #64748b; }
  .entity-modal-overlay[data-theme="light"] .entity-modal__state-badge--home,
  .entity-modal-overlay[data-theme="light"] .entity-modal__state-badge--on { background: rgba(34, 197, 94, 0.15); color: #16a34a; }
  .entity-modal-overlay[data-theme="light"] .entity-modal__state-badge--not_home,
  .entity-modal-overlay[data-theme="light"] .entity-modal__state-badge--off { background: rgba(239, 68, 68, 0.15); color: #dc2626; }
  .entity-modal-overlay[data-theme="light"] .entity-modal__state-badge--default { background: rgba(107, 114, 128, 0.15); color: #6b7280; }

  /* Context Menu */
  .context-menu {
    position: fixed;
    z-index: 1001;
    background: rgba(15, 23, 42, 0.98);
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 12px;
    padding: 6px;
    min-width: 180px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(12px);
  }
  .context-menu__header {
    padding: 8px 12px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.1);
    margin-bottom: 4px;
  }
  .context-menu__title {
    font-size: 12px;
    font-weight: 600;
    color: #f1f5f9;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  }
  .context-menu__type {
    font-size: 10px;
    color: #64748b;
    margin-top: 2px;
    text-transform: capitalize;
  }
  .context-menu__item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 12px;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: #e2e8f0;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
  }
  .context-menu__item:hover {
    background: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
  }
  .context-menu__item:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .context-menu__item:disabled:hover {
    background: transparent;
    color: #e2e8f0;
  }
  .context-menu__icon {
    font-size: 14px;
    width: 20px;
    text-align: center;
  }
  .context-menu__divider {
    height: 1px;
    background: rgba(148, 163, 184, 0.1);
    margin: 4px 0;
  }
  .context-menu__item--danger:hover {
    background: rgba(239, 68, 68, 0.15);
    color: #f87171;
  }

  /* Light theme context menu */
  .context-menu[data-theme="light"] {
    background: rgba(255, 255, 255, 0.98);
    border-color: rgba(148, 163, 184, 0.3);
  }
  .context-menu[data-theme="light"] .context-menu__title { color: #0f172a; }
  .context-menu[data-theme="light"] .context-menu__type { color: #64748b; }
  .context-menu[data-theme="light"] .context-menu__item { color: #0f172a; }
  .context-menu[data-theme="light"] .context-menu__item:hover { background: rgba(59, 130, 246, 0.1); color: #1d4ed8; }
  .context-menu[data-theme="light"] .context-menu__item--danger:hover { background: rgba(239, 68, 68, 0.1); color: #dc2626; }
  .context-menu[data-theme="light"] .context-menu__divider { background: rgba(148, 163, 184, 0.2); }
`;

interface Edge {
  left: string;
  right: string;
  label?: string | null;
  poe?: boolean | null;
  wireless?: boolean | null;
  speed?: number | null;
  channel?: number | null;
}

interface Point {
  x: number;
  y: number;
}

interface ViewTransform {
  x: number;
  y: number;
  scale: number;
}

interface DeviceCounts {
  gateways: number;
  switches: number;
  aps: number;
  clients: number;
  other: number;
}

interface StatusCounts {
  online: number;
  offline: number;
  hasStatus: boolean;
}

interface Neighbor {
  name: string;
  label?: string | null;
  wireless?: boolean | null;
  poe?: boolean | null;
}

interface FormSchemaEntry {
  name: string;
  required?: boolean;
  selector: {
    select: {
      mode: string;
      options: Array<{ label: string; value: string }>;
    };
  };
  label: string;
}

interface RelatedEntity {
  entity_id: string;
  domain: string;
  state: string | null;
  last_changed?: string | null;
  ip?: string | null;
  friendly_name?: string | null;
}

interface ContextMenuState {
  nodeName: string;
  x: number;
  y: number;
}

interface MapPayload {
  schema_version?: string;
  edges: Edge[];
  node_types: Record<string, string>;
  gateways?: string[];
  client_entities?: Record<string, string>;
  device_entities?: Record<string, string>;
  node_entities?: Record<string, string>;
  node_status?: Record<string, NodeStatus>;
  client_macs?: Record<string, string>;
  device_macs?: Record<string, string>;
  related_entities?: Record<string, RelatedEntity[]>;
}

class UnifiNetworkMapCard extends HTMLElement {
  static getLayoutOptions() {
    return { grid_columns: 4, grid_rows: 3, grid_min_columns: 2, grid_min_rows: 2 };
  }

  static getConfigElement() {
    return document.createElement("unifi-network-map-editor");
  }

  static getStubConfig() {
    return { entry_id: "", theme: "dark" };
  }

  setConfig(config: CardConfig) {
    this._config = this._normalizeConfig(config);
    this._render();
  }

  private _normalizeConfig(config: CardConfig): CardConfig {
    if (config.entry_id) {
      const theme = config.theme ?? "dark";
      const themeSuffix = `?theme=${theme}`;
      return {
        entry_id: config.entry_id,
        theme,
        svg_url: `/api/${DOMAIN}/${config.entry_id}/svg${themeSuffix}`,
        data_url: `/api/${DOMAIN}/${config.entry_id}/payload`,
      };
    }
    return config;
  }

  set hass(hass: Hass) {
    this._hass = hass;
    this._render();
  }

  connectedCallback() {
    this._render();
    this._startStatusPolling();
  }

  disconnectedCallback() {
    this._stopStatusPolling();
    this._removeEntityModal();
    this._removeContextMenu();
  }

  private _startStatusPolling() {
    this._stopStatusPolling();
    this._statusPollInterval = window.setInterval(() => {
      this._refreshPayload();
    }, 30000);
  }

  private _stopStatusPolling() {
    if (this._statusPollInterval !== undefined) {
      window.clearInterval(this._statusPollInterval);
      this._statusPollInterval = undefined;
    }
  }

  private _refreshPayload() {
    this._lastDataUrl = undefined;
    this._loadPayload();
  }

  private _config?: CardConfig;
  private _hass?: Hass;
  private _lastSvgUrl?: string;
  private _lastDataUrl?: string;
  private _svgContent?: string;
  private _payload?: MapPayload;
  private _error?: string;
  private _loading = false;
  private _dataLoading = false;
  private _viewTransform: ViewTransform = { x: 0, y: 0, scale: 1 };
  private _isPanning = false;
  private _panStart: Point | null = null;
  private _panMoved = false;
  private _selectedNode?: string;
  private _hoveredNode?: string;
  private _hoveredEdge?: Edge;
  private _svgAbortController?: AbortController;
  private _payloadAbortController?: AbortController;
  private _activeTab: "overview" | "stats" | "actions" = "overview";
  private _statusPollInterval?: number;
  private _entityModalOverlay?: HTMLElement;
  private _contextMenu?: ContextMenuState;
  private _contextMenuElement?: HTMLElement;

  private _getAuthToken(): string | undefined {
    return this._hass?.auth?.data?.access_token;
  }

  private async _fetchWithAuth<T>(
    url: string,
    signal: AbortSignal,
    parseResponse: (response: Response) => Promise<T>,
  ): Promise<{ data: T } | { error: string } | { aborted: true }> {
    const token = this._getAuthToken();
    if (!token) {
      return { error: "Missing auth token" };
    }
    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return { data: await parseResponse(response) };
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return { aborted: true };
      }
      const message = err instanceof Error ? err.message : String(err);
      return { error: message };
    }
  }

  private _render() {
    const theme = this._config?.theme ?? "dark";
    if (!this._config) {
      this._setCardBody('<div style="padding:16px;">Missing configuration</div>', theme);
      return;
    }

    if (!this._config.svg_url) {
      this._setCardBody(
        '<div style="padding:16px;">Select a UniFi Network Map instance in the card settings.</div>',
        theme,
      );
      return;
    }

    const token = this._getAuthToken();
    if (token && this._error === "Missing auth token") {
      this._error = undefined;
    }

    const body = this._error
      ? `<div style="padding:16px;color:#b00020;">${escapeHtml(this._error)}</div>`
      : this._svgContent
        ? this._renderLayout()
        : `<div style="padding:16px;">Loading map...</div>`;

    this._setCardBody(body, theme);

    if (!token && this._error === "Missing auth token") {
      return;
    }
    this._ensureStyles();
    this._loadSvg();
    this._loadPayload();
    this._wireInteractions();
  }

  private _setCardBody(body: string, theme: string) {
    const card = document.createElement("ha-card");
    card.dataset.theme = theme;
    card.innerHTML = sanitizeHtml(body);
    this.replaceChildren(card);
  }

  private async _loadSvg() {
    if (!this._config?.svg_url || !this._hass) {
      return;
    }
    if (this._loading || this._config.svg_url === this._lastSvgUrl) {
      return;
    }
    if (!this._getAuthToken()) {
      this._error = "Missing auth token";
      this._render();
      return;
    }

    this._svgAbortController?.abort();
    this._svgAbortController = new AbortController();
    const currentUrl = this._config.svg_url;

    this._loading = true;
    const result = await this._fetchWithAuth(currentUrl, this._svgAbortController.signal, (r) =>
      r.text(),
    );

    if ("aborted" in result) {
      return;
    }
    if ("error" in result) {
      this._error = `Failed to load SVG (${result.error})`;
    } else {
      this._svgContent = result.data;
      this._error = undefined;
    }
    this._lastSvgUrl = currentUrl;
    this._loading = false;
    this._render();
  }

  private async _loadPayload() {
    if (!this._config?.data_url || !this._hass) {
      return;
    }
    if (this._dataLoading || this._config.data_url === this._lastDataUrl) {
      return;
    }
    if (!this._getAuthToken()) {
      return;
    }

    this._payloadAbortController?.abort();
    this._payloadAbortController = new AbortController();
    const currentUrl = this._config.data_url;

    this._dataLoading = true;
    const result = await this._fetchWithAuth<MapPayload>(
      currentUrl,
      this._payloadAbortController.signal,
      (r) => r.json(),
    );

    if ("aborted" in result) {
      return;
    }
    if ("error" in result) {
      this._error = `Failed to load payload (${result.error})`;
    } else {
      this._payload = result.data;
    }
    this._lastDataUrl = currentUrl;
    this._dataLoading = false;
    this._render();
  }

  private _renderLayout(): string {
    const safeSvg = this._svgContent ? sanitizeSvg(this._svgContent) : "";
    return `
      <div class="unifi-network-map__layout">
        <div class="unifi-network-map__viewport">
          <div class="unifi-network-map__controls">
            <button type="button" data-action="zoom-in" title="Zoom in">+</button>
            <button type="button" data-action="zoom-out" title="Zoom out">-</button>
            <button type="button" data-action="reset" title="Reset view">Reset</button>
          </div>
          ${safeSvg}
          <div class="unifi-network-map__status-layer"></div>
          <div class="unifi-network-map__tooltip" hidden></div>
        </div>
        <div class="unifi-network-map__panel">
          ${this._renderPanelContent()}
        </div>
      </div>
    `;
  }

  private _renderPanelContent(): string {
    if (!this._selectedNode) {
      return this._renderMapOverview();
    }
    return this._renderNodePanel(this._selectedNode);
  }

  private _renderMapOverview(): string {
    if (!this._payload) {
      return `
        <div class="panel-empty">
          <div class="panel-empty__icon">📡</div>
          <div class="panel-empty__text">Loading network data...</div>
        </div>
      `;
    }
    const nodes = Object.keys(this._payload.node_types ?? {});
    const edges = this._payload.edges ?? [];
    const nodeTypes = this._payload.node_types ?? {};
    const nodeStatus = this._payload.node_status ?? {};

    const deviceCounts = this._countDevicesByType(nodes, nodeTypes);
    const statusCounts = this._countNodeStatus(nodeStatus);

    return `
      <div class="panel-header">
        <div class="panel-header__title">Network Overview</div>
      </div>
      ${this._renderOverviewStatsGrid(nodes.length, edges.length)}
      ${this._renderOverviewStatusSection(statusCounts)}
      ${this._renderOverviewDeviceBreakdown(deviceCounts)}
      <div class="panel-hint">
        <span class="panel-hint__icon">💡</span>
        Click a node in the map to see details
      </div>
    `;
  }

  private _countDevicesByType(nodes: string[], nodeTypes: Record<string, string>): DeviceCounts {
    return {
      gateways: nodes.filter((n) => nodeTypes[n] === "gateway").length,
      switches: nodes.filter((n) => nodeTypes[n] === "switch").length,
      aps: nodes.filter((n) => nodeTypes[n] === "ap").length,
      clients: nodes.filter((n) => nodeTypes[n] === "client").length,
      other: nodes.filter((n) => !["gateway", "switch", "ap", "client"].includes(nodeTypes[n]))
        .length,
    };
  }

  private _countNodeStatus(nodeStatus: Record<string, NodeStatus>): StatusCounts {
    const values = Object.values(nodeStatus);
    return {
      online: values.filter((s) => s.state === "online").length,
      offline: values.filter((s) => s.state === "offline").length,
      hasStatus: values.length > 0,
    };
  }

  private _renderOverviewStatsGrid(nodeCount: number, edgeCount: number): string {
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

  private _renderOverviewStatusSection(counts: StatusCounts): string {
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

  private _renderOverviewDeviceBreakdown(counts: DeviceCounts): string {
    const items: Array<{ key: keyof DeviceCounts; icon: string; label: string }> = [
      { key: "gateways", icon: "🌐", label: "Gateways" },
      { key: "switches", icon: "🔀", label: "Switches" },
      { key: "aps", icon: "📶", label: "Access Points" },
      { key: "clients", icon: "💻", label: "Clients" },
      { key: "other", icon: "📦", label: "Other" },
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

  private _renderNodePanel(name: string): string {
    const safeName = escapeHtml(name);
    if (!this._payload) {
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

    const nodeType = this._payload.node_types?.[name] ?? "unknown";
    const typeIcon = this._getNodeTypeIcon(nodeType);
    const status = this._payload.node_status?.[name];
    const statusBadge = status ? this._getStatusBadgeHtml(status.state) : "";

    return `
      <div class="panel-header">
        <button type="button" class="panel-header__back" data-action="back">←</button>
        <div class="panel-header__info">
          <div class="panel-header__title-row">
            <span class="panel-header__title">${safeName}</span>
            ${statusBadge}
          </div>
          <div class="panel-header__badge">${typeIcon} ${escapeHtml(nodeType)}</div>
        </div>
      </div>
      <div class="panel-tabs">
        <button type="button" class="panel-tab ${this._activeTab === "overview" ? "panel-tab--active" : ""}" data-tab="overview">Overview</button>
        <button type="button" class="panel-tab ${this._activeTab === "stats" ? "panel-tab--active" : ""}" data-tab="stats">Stats</button>
        <button type="button" class="panel-tab ${this._activeTab === "actions" ? "panel-tab--active" : ""}" data-tab="actions">Actions</button>
      </div>
      <div class="panel-tab-content">
        ${this._renderTabContent(name)}
      </div>
    `;
  }

  private _getNodeTypeIcon(nodeType: string): string {
    switch (nodeType) {
      case "gateway":
        return "🌐";
      case "switch":
        return "🔀";
      case "ap":
        return "📶";
      case "client":
        return "💻";
      default:
        return "📦";
    }
  }

  private _getStatusBadgeHtml(state: "online" | "offline" | "unknown"): string {
    const labels: Record<string, string> = {
      online: "Online",
      offline: "Offline",
      unknown: "Unknown",
    };
    return `<span class="status-badge status-badge--${state}">${labels[state]}</span>`;
  }

  private _formatLastChanged(isoString: string | null | undefined): string {
    if (!isoString) return "Unknown";
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return "Just now";
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return "Unknown";
    }
  }

  private _renderTabContent(name: string): string {
    switch (this._activeTab) {
      case "overview":
        return this._renderOverviewTab(name);
      case "stats":
        return this._renderStatsTab(name);
      case "actions":
        return this._renderActionsTab(name);
      default:
        return "";
    }
  }

  private _renderOverviewTab(name: string): string {
    const edges = this._payload?.edges ?? [];
    const neighbors: Neighbor[] = edges
      .filter((edge) => edge.left === name || edge.right === name)
      .map((edge) => ({
        name: edge.left === name ? edge.right : edge.left,
        label: edge.label,
        wireless: edge.wireless,
        poe: edge.poe,
      }));
    const uniqueNeighbors: Neighbor[] = Array.from(
      new Map(neighbors.map((n) => [n.name, n])).values(),
    );

    const neighborList = uniqueNeighbors.length
      ? uniqueNeighbors
          .map(
            (n) => `
            <div class="neighbor-item">
              <span class="neighbor-item__name">${escapeHtml(n.name)}</span>
              <span class="neighbor-item__badges">
                ${n.wireless ? '<span class="badge badge--wireless">WiFi</span>' : ""}
                ${n.poe ? '<span class="badge badge--poe">PoE</span>' : ""}
                ${n.label ? `<span class="badge badge--port">${escapeHtml(n.label)}</span>` : ""}
              </span>
            </div>
          `,
          )
          .join("")
      : '<div class="panel-empty__text">No connections</div>';

    return `
      <div class="panel-section">
        <div class="panel-section__title">Connected Devices</div>
        <div class="neighbor-list">${neighborList}</div>
      </div>
    `;
  }

  private _renderStatsTab(name: string): string {
    const edges = this._payload?.edges ?? [];
    const nodeEdges = edges.filter((edge) => edge.left === name || edge.right === name);
    const mac = this._payload?.client_macs?.[name] ?? this._payload?.device_macs?.[name] ?? null;
    const status = this._payload?.node_status?.[name];

    return `
      ${this._renderStatsLiveStatus(status)}
      ${this._renderStatsConnectionSection(nodeEdges)}
      ${this._renderStatsDeviceInfo(mac)}
    `;
  }

  private _renderStatsLiveStatus(status: NodeStatus | undefined): string {
    if (!status) {
      return "";
    }
    return `
      <div class="panel-section">
        <div class="panel-section__title">Live Status</div>
        <div class="stats-list">
          <div class="stats-row">
            <span class="stats-row__label">Status</span>
            <span class="stats-row__value">${this._getStatusBadgeHtml(status.state)}</span>
          </div>
          <div class="stats-row">
            <span class="stats-row__label">Last Changed</span>
            <span class="stats-row__value">${this._formatLastChanged(status.last_changed)}</span>
          </div>
        </div>
      </div>
    `;
  }

  private _renderStatsConnectionSection(
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

  private _renderStatsDeviceInfo(mac: string | null): string {
    if (!mac) {
      return "";
    }
    return `
      <div class="panel-section">
        <div class="panel-section__title">Device Info</div>
        <div class="info-row">
          <span class="info-row__label">MAC Address</span>
          <code class="info-row__value">${escapeHtml(mac)}</code>
        </div>
      </div>
    `;
  }

  private _renderActionsTab(name: string): string {
    const entityId =
      this._payload?.node_entities?.[name] ??
      this._payload?.client_entities?.[name] ??
      this._payload?.device_entities?.[name];
    const mac = this._payload?.client_macs?.[name] ?? this._payload?.device_macs?.[name] ?? null;
    const safeEntityId = entityId ? escapeHtml(entityId) : "";
    const safeMac = mac ? escapeHtml(mac) : "";

    return `
      <div class="panel-section">
        <div class="panel-section__title">Quick Actions</div>
        <div class="actions-list">
          ${
            entityId
              ? `
              <button type="button" class="action-button action-button--primary" data-entity-id="${safeEntityId}">
                <span class="action-button__icon">📊</span>
                <span class="action-button__text">View Entity Details</span>
              </button>
            `
              : `<div class="panel-empty__text">No Home Assistant entity linked</div>`
          }
          ${
            mac
              ? `
              <button type="button" class="action-button" data-action="copy" data-copy-value="${safeMac}">
                <span class="action-button__icon">📋</span>
                <span class="action-button__text">Copy MAC Address</span>
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

  private _ensureStyles() {
    if (this.querySelector("style[data-unifi-network-map]")) {
      return;
    }
    const style = document.createElement("style");
    style.dataset.unifiNetworkMap = "true";
    style.textContent = CARD_STYLES;
    this.appendChild(style);
  }

  private _wireInteractions() {
    const viewport = this.querySelector(".unifi-network-map__viewport") as HTMLElement | null;
    const svg = viewport?.querySelector("svg") as SVGElement | null;
    const tooltip = viewport?.querySelector(".unifi-network-map__tooltip") as HTMLElement | null;
    const panel = this.querySelector(".unifi-network-map__panel") as HTMLElement | null;
    if (!viewport || !svg || !tooltip) {
      return;
    }
    this._ensureStyles();
    this._applyTransform(svg);
    this._highlightSelectedNode(svg);
    this._annotateEdges(svg);
    this._wireControls(svg);

    viewport.onwheel = (event) => this._onWheel(event, svg);
    viewport.onpointerdown = (event) => this._onPointerDown(event);
    viewport.onpointermove = (event) => this._onPointerMove(event, svg, tooltip);
    viewport.onpointerup = () => this._onPointerUp();
    viewport.onpointerleave = () => {
      this._hoveredNode = undefined;
      this._hoveredEdge = undefined;
      this._hideTooltip(tooltip);
    };
    viewport.onclick = (event) => this._onClick(event, tooltip);
    viewport.oncontextmenu = (event) => this._onContextMenu(event);

    if (panel) {
      panel.onclick = (event) => this._onPanelClick(event);
    }
  }

  private _onPanelClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (this._handleTabClick(target, event)) return;
    if (this._handleBackClick(target, event)) return;
    if (this._handleCopyClick(target, event)) return;
    this._handleEntityClick(target, event);
  }

  private _handleTabClick(target: HTMLElement, event: MouseEvent): boolean {
    const tab = target.closest("[data-tab]") as HTMLElement | null;
    if (!tab) return false;

    event.preventDefault();
    const tabName = tab.getAttribute("data-tab") as "overview" | "stats" | "actions";
    if (tabName && tabName !== this._activeTab) {
      this._activeTab = tabName;
      this._render();
    }
    return true;
  }

  private _handleBackClick(target: HTMLElement, event: MouseEvent): boolean {
    const backButton = target.closest('[data-action="back"]') as HTMLElement | null;
    if (!backButton) return false;

    event.preventDefault();
    this._selectedNode = undefined;
    this._activeTab = "overview";
    this._render();
    return true;
  }

  private _handleCopyClick(target: HTMLElement, event: MouseEvent): boolean {
    const copyButton = target.closest('[data-action="copy"]') as HTMLElement | null;
    if (!copyButton) return false;

    event.preventDefault();
    const value = copyButton.getAttribute("data-copy-value");
    if (value) {
      navigator.clipboard.writeText(value).then(() => {
        const textEl = copyButton.querySelector(".action-button__text");
        if (textEl) {
          const original = textEl.textContent;
          textEl.textContent = "Copied!";
          setTimeout(() => {
            textEl.textContent = original;
          }, 1500);
        }
      });
    }
    return true;
  }

  private _handleEntityClick(target: HTMLElement, event: MouseEvent): boolean {
    const entityButton = target.closest("[data-entity-id]") as HTMLElement | null;
    if (!entityButton) return false;

    event.preventDefault();
    if (this._selectedNode) {
      this._showEntityModal(this._selectedNode);
    }
    return true;
  }

  private _showEntityModal(nodeName: string): void {
    this._removeEntityModal();
    const modalHtml = this._renderEntityModal(nodeName);
    const container = document.createElement("div");
    container.innerHTML = modalHtml;
    const overlay = container.firstElementChild as HTMLElement;
    if (!overlay) return;

    document.body.appendChild(overlay);
    this._entityModalOverlay = overlay;
    this._wireEntityModalEvents(overlay);
  }

  private _renderEntityModal(nodeName: string): string {
    const safeName = escapeHtml(nodeName);
    const mac = this._payload?.client_macs?.[nodeName] ?? this._payload?.device_macs?.[nodeName];
    const nodeType = this._payload?.node_types?.[nodeName] ?? "unknown";
    const status = this._payload?.node_status?.[nodeName];
    const relatedEntities = this._payload?.related_entities?.[nodeName] ?? [];
    const typeIcon = this._getNodeTypeIcon(nodeType);

    const infoRows: string[] = [];

    if (mac) {
      infoRows.push(`
        <div class="entity-modal__info-row">
          <span class="entity-modal__info-label">MAC Address</span>
          <span class="entity-modal__info-value">${escapeHtml(mac)}</span>
        </div>
      `);
    }

    const ipEntity = relatedEntities.find((e) => e.ip);
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
          <span class="entity-modal__info-value">${this._formatLastChanged(status.last_changed)}</span>
        </div>
      `);
    }

    infoRows.push(`
      <div class="entity-modal__info-row">
        <span class="entity-modal__info-label">Device Type</span>
        <span class="entity-modal__info-value">${escapeHtml(nodeType)}</span>
      </div>
    `);

    const entityItems = relatedEntities.map((entity) => this._renderEntityItem(entity)).join("");

    const theme = this._config?.theme ?? "dark";
    return `
      <div class="entity-modal-overlay" data-modal-overlay data-theme="${escapeHtml(theme)}">
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

  private _renderEntityItem(entity: RelatedEntity): string {
    const domainIcon = this._getDomainIcon(entity.domain);
    const displayName = entity.friendly_name ?? entity.entity_id;
    const safeDisplayName = escapeHtml(displayName);
    const safeEntityId = escapeHtml(entity.entity_id);
    const state = entity.state ?? "unavailable";
    const stateClass = this._getStateBadgeClass(state);

    return `
      <div class="entity-modal__entity-item" data-modal-entity-id="${safeEntityId}">
        <span class="entity-modal__domain-icon">${domainIcon}</span>
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

  private _getDomainIcon(domain: string): string {
    const icons: Record<string, string> = {
      device_tracker: "📍",
      switch: "🔘",
      sensor: "📊",
      binary_sensor: "⚡",
      light: "💡",
      button: "🔲",
      update: "🔄",
      image: "🖼️",
    };
    return icons[domain] ?? "📦";
  }

  private _getStateBadgeClass(state: string): string {
    if (state === "home" || state === "on") {
      return `entity-modal__state-badge--${state}`;
    }
    if (state === "not_home" || state === "off") {
      return `entity-modal__state-badge--${state}`;
    }
    return "entity-modal__state-badge--default";
  }

  private _wireEntityModalEvents(overlay: HTMLElement): void {
    overlay.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;

      if (target.hasAttribute("data-modal-overlay")) {
        this._removeEntityModal();
        return;
      }

      const closeButton = target.closest('[data-action="close-modal"]');
      if (closeButton) {
        this._removeEntityModal();
        return;
      }

      const entityItem = target.closest("[data-modal-entity-id]") as HTMLElement | null;
      if (entityItem) {
        event.preventDefault();
        event.stopPropagation();
        const entityId = entityItem.getAttribute("data-modal-entity-id");
        if (entityId) {
          this._openEntityDetails(entityId);
        }
      }
    });
  }

  private _openEntityDetails(entityId: string): void {
    this._removeEntityModal();
    window.setTimeout(() => {
      this.dispatchEvent(
        new CustomEvent("hass-more-info", {
          bubbles: true,
          composed: true,
          detail: { entityId },
        }),
      );
    }, 0);
  }

  private _removeEntityModal(): void {
    if (this._entityModalOverlay) {
      this._entityModalOverlay.remove();
      this._entityModalOverlay = undefined;
    }
  }

  private _onContextMenu(event: MouseEvent): void {
    const nodeName = this._resolveNodeName(event);
    if (!nodeName) {
      return;
    }
    event.preventDefault();
    this._removeContextMenu();
    this._contextMenu = { nodeName, x: event.clientX, y: event.clientY };
    this._showContextMenu();
  }

  private _showContextMenu(): void {
    if (!this._contextMenu) return;

    const menuHtml = this._renderContextMenu(this._contextMenu.nodeName);
    const container = document.createElement("div");
    container.innerHTML = menuHtml;
    const menu = container.firstElementChild as HTMLElement;
    if (!menu) return;

    document.body.appendChild(menu);
    this._contextMenuElement = menu;

    this._positionContextMenu(menu, this._contextMenu.x, this._contextMenu.y);
    this._wireContextMenuEvents(menu);
  }

  private _renderContextMenu(nodeName: string): string {
    const safeName = escapeHtml(nodeName);
    const nodeType = this._payload?.node_types?.[nodeName] ?? "unknown";
    const typeIcon = this._getNodeTypeIcon(nodeType);
    const mac = this._payload?.client_macs?.[nodeName] ?? this._payload?.device_macs?.[nodeName];
    const entityId =
      this._payload?.node_entities?.[nodeName] ??
      this._payload?.client_entities?.[nodeName] ??
      this._payload?.device_entities?.[nodeName];
    const isDevice = nodeType !== "client";
    const isClient = nodeType === "client";
    const theme = this._config?.theme ?? "dark";

    const items: string[] = [];

    items.push(`
      <button type="button" class="context-menu__item" data-context-action="select">
        <span class="context-menu__icon">👆</span>
        <span>Select</span>
      </button>
    `);

    if (entityId) {
      items.push(`
        <button type="button" class="context-menu__item" data-context-action="details">
          <span class="context-menu__icon">📊</span>
          <span>View Details</span>
        </button>
      `);
    }

    if (mac) {
      items.push(`
        <button type="button" class="context-menu__item" data-context-action="copy-mac" data-mac="${escapeHtml(mac)}">
          <span class="context-menu__icon">📋</span>
          <span>Copy MAC Address</span>
        </button>
      `);
    }

    items.push('<div class="context-menu__divider"></div>');

    if (isDevice) {
      items.push(`
        <button type="button" class="context-menu__item" data-context-action="restart" ${!entityId ? "disabled" : ""}>
          <span class="context-menu__icon">🔄</span>
          <span>Restart Device</span>
        </button>
      `);
    }

    if (isClient) {
      items.push(`
        <button type="button" class="context-menu__item context-menu__item--danger" data-context-action="block" ${!entityId ? "disabled" : ""}>
          <span class="context-menu__icon">🚫</span>
          <span>Block Client</span>
        </button>
      `);
    }

    return `
      <div class="context-menu" data-theme="${escapeHtml(theme)}" data-context-node="${safeName}">
        <div class="context-menu__header">
          <div class="context-menu__title">${typeIcon} ${safeName}</div>
          <div class="context-menu__type">${escapeHtml(nodeType)}</div>
        </div>
        ${items.join("")}
      </div>
    `;
  }

  private _positionContextMenu(menu: HTMLElement, x: number, y: number): void {
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    requestAnimationFrame(() => {
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      if (rect.right > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 8;
      }
      if (rect.bottom > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 8;
      }
      if (adjustedX < 8) {
        adjustedX = 8;
      }
      if (adjustedY < 8) {
        adjustedY = 8;
      }

      menu.style.left = `${adjustedX}px`;
      menu.style.top = `${adjustedY}px`;
    });
  }

  private _wireContextMenuEvents(menu: HTMLElement): void {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const actionButton = target.closest("[data-context-action]") as HTMLButtonElement | null;

      if (actionButton && !actionButton.disabled) {
        event.preventDefault();
        event.stopPropagation();
        const action = actionButton.getAttribute("data-context-action");
        const mac = actionButton.getAttribute("data-mac");
        if (action && this._contextMenu) {
          this._handleContextMenuAction(action, this._contextMenu.nodeName, mac);
        }
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (!menu.contains(event.target as Node)) {
        this._removeContextMenu();
      }
    };

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        this._removeContextMenu();
      }
    };

    menu.addEventListener("click", handleClick);
    document.addEventListener("click", handleClickOutside, { once: true });
    document.addEventListener("keydown", handleKeydown);

    (menu as HTMLElement & { _cleanup?: () => void })._cleanup = () => {
      menu.removeEventListener("click", handleClick);
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleKeydown);
    };
  }

  private _handleContextMenuAction(action: string, nodeName: string, mac: string | null): void {
    switch (action) {
      case "select":
        this._selectedNode = nodeName;
        this._removeContextMenu();
        this._render();
        break;

      case "details":
        this._removeContextMenu();
        this._showEntityModal(nodeName);
        break;

      case "copy-mac":
        if (mac) {
          navigator.clipboard.writeText(mac).then(() => {
            this._showCopyFeedback();
          });
        }
        this._removeContextMenu();
        break;

      case "restart":
        this._handleRestartDevice(nodeName);
        this._removeContextMenu();
        break;

      case "block":
        this._handleBlockClient(nodeName);
        this._removeContextMenu();
        break;

      default:
        this._removeContextMenu();
    }
  }

  private _showCopyFeedback(): void {
    const feedback = document.createElement("div");
    feedback.textContent = "MAC address copied!";
    feedback.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(34, 197, 94, 0.9);
      color: white;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 1002;
      animation: fadeInOut 2s ease forwards;
    `;

    const style = document.createElement("style");
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
        15% { opacity: 1; transform: translateX(-50%) translateY(0); }
        85% { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
      }
    `;
    feedback.appendChild(style);
    document.body.appendChild(feedback);

    setTimeout(() => feedback.remove(), 2000);
  }

  private _handleRestartDevice(nodeName: string): void {
    const entityId =
      this._payload?.node_entities?.[nodeName] ?? this._payload?.device_entities?.[nodeName];

    if (!entityId) {
      this._showActionError("No entity found for this device");
      return;
    }

    this.dispatchEvent(
      new CustomEvent("hass-action", {
        bubbles: true,
        composed: true,
        detail: {
          action: "call-service",
          service: "button.press",
          target: { entity_id: entityId.replace(/\.[^.]+$/, ".restart") },
        },
      }),
    );

    this._showActionFeedback("Restart command sent");
  }

  private _handleBlockClient(nodeName: string): void {
    const entityId = this._payload?.client_entities?.[nodeName];

    if (!entityId) {
      this._showActionError("No entity found for this client");
      return;
    }

    this.dispatchEvent(
      new CustomEvent("hass-action", {
        bubbles: true,
        composed: true,
        detail: {
          action: "call-service",
          service: "switch.turn_off",
          target: { entity_id: entityId.replace(/\.[^.]+$/, ".block") },
        },
      }),
    );

    this._showActionFeedback("Block command sent");
  }

  private _showActionFeedback(message: string): void {
    const feedback = document.createElement("div");
    feedback.textContent = message;
    feedback.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(59, 130, 246, 0.9);
      color: white;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 1002;
      animation: fadeInOut 2s ease forwards;
    `;
    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 2000);
  }

  private _showActionError(message: string): void {
    const feedback = document.createElement("div");
    feedback.textContent = message;
    feedback.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(239, 68, 68, 0.9);
      color: white;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 1002;
      animation: fadeInOut 2s ease forwards;
    `;
    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 2000);
  }

  private _removeContextMenu(): void {
    if (this._contextMenuElement) {
      const cleanup = (this._contextMenuElement as HTMLElement & { _cleanup?: () => void })
        ._cleanup;
      if (cleanup) {
        cleanup();
      }
      this._contextMenuElement.remove();
      this._contextMenuElement = undefined;
    }
    this._contextMenu = undefined;
  }

  private _wireControls(svg: SVGElement) {
    const zoomIn = this.querySelector('[data-action="zoom-in"]') as HTMLButtonElement | null;
    const zoomOut = this.querySelector('[data-action="zoom-out"]') as HTMLButtonElement | null;
    const reset = this.querySelector('[data-action="reset"]') as HTMLButtonElement | null;
    if (zoomIn) {
      zoomIn.onclick = (event) => {
        event.preventDefault();
        this._applyZoom(ZOOM_INCREMENT, svg);
      };
    }
    if (zoomOut) {
      zoomOut.onclick = (event) => {
        event.preventDefault();
        this._applyZoom(-ZOOM_INCREMENT, svg);
      };
    }
    if (reset) {
      reset.onclick = (event) => {
        event.preventDefault();
        this._resetPan(svg);
      };
    }
  }

  private _onWheel(event: WheelEvent, svg: SVGElement) {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -ZOOM_INCREMENT : ZOOM_INCREMENT;
    this._applyZoom(delta, svg);
  }

  private _onPointerDown(event: PointerEvent) {
    if (this._isControlTarget(event.target as Element | null)) {
      return;
    }
    this._isPanning = true;
    this._panMoved = false;
    this._panStart = {
      x: event.clientX - this._viewTransform.x,
      y: event.clientY - this._viewTransform.y,
    };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  private _onPointerMove(event: PointerEvent, svg: SVGElement, tooltip: HTMLElement) {
    if (this._isPanning && this._panStart) {
      const nextX = event.clientX - this._panStart.x;
      const nextY = event.clientY - this._panStart.y;
      if (
        Math.abs(nextX - this._viewTransform.x) > MIN_PAN_MOVEMENT_THRESHOLD ||
        Math.abs(nextY - this._viewTransform.y) > MIN_PAN_MOVEMENT_THRESHOLD
      ) {
        this._panMoved = true;
      }
      this._viewTransform.x = nextX;
      this._viewTransform.y = nextY;
      this._applyTransform(svg);
      return;
    }
    const edge = this._findEdgeFromTarget(event.target as Element);
    if (edge) {
      this._hoveredEdge = edge;
      this._hoveredNode = undefined;
      tooltip.hidden = false;
      tooltip.classList.add("unifi-network-map__tooltip--edge");
      tooltip.innerHTML = this._renderEdgeTooltip(edge);
      tooltip.style.transform = "none";
      tooltip.style.left = `${event.clientX + TOOLTIP_OFFSET_PX}px`;
      tooltip.style.top = `${event.clientY + TOOLTIP_OFFSET_PX}px`;
      return;
    }
    this._hoveredEdge = undefined;
    const label = this._resolveNodeName(event);
    if (!label) {
      this._hoveredNode = undefined;
      this._hideTooltip(tooltip);
      return;
    }
    this._hoveredNode = label;
    tooltip.hidden = false;
    tooltip.classList.remove("unifi-network-map__tooltip--edge");
    tooltip.textContent = label;
    tooltip.style.transform = "none";
    tooltip.style.left = `${event.clientX + TOOLTIP_OFFSET_PX}px`;
    tooltip.style.top = `${event.clientY + TOOLTIP_OFFSET_PX}px`;
  }

  private _onPointerUp() {
    this._isPanning = false;
    this._panStart = null;
  }

  private _onClick(event: MouseEvent, tooltip: HTMLElement) {
    if (this._isControlTarget(event.target as Element | null)) {
      return;
    }
    if (this._panMoved) {
      return;
    }
    const label = this._resolveNodeName(event) ?? this._hoveredNode;
    if (!label) {
      return;
    }
    this._selectedNode = label;
    this._hideTooltip(tooltip);
    this._render();
  }

  private _hideTooltip(tooltip: HTMLElement) {
    tooltip.hidden = true;
    tooltip.classList.remove("unifi-network-map__tooltip--edge");
  }

  private _annotateEdges(svg: SVGElement): void {
    if (!this._payload?.edges) return;
    const paths = svg.querySelectorAll("path[stroke]:not([data-edge-hitbox])");
    const edges = this._payload.edges;
    paths.forEach((path, index) => {
      if (index < edges.length) {
        const edge = edges[index];
        path.setAttribute("data-edge", "true");
        path.setAttribute("data-edge-left", edge.left);
        path.setAttribute("data-edge-right", edge.right);
        this._ensureEdgeHitbox(path as SVGPathElement, edge);
      }
    });
  }

  private _findEdgeFromTarget(target: Element | null): Edge | null {
    if (!target || !this._payload?.edges) return null;
    const edgePath = target.closest("path[data-edge], path[data-edge-hitbox]");
    if (!edgePath) return null;
    const left = edgePath.getAttribute("data-edge-left");
    const right = edgePath.getAttribute("data-edge-right");
    if (!left || !right) return null;
    return this._payload.edges.find((e) => e.left === left && e.right === right) ?? null;
  }

  private _ensureEdgeHitbox(path: SVGPathElement, edge: Edge): void {
    const next = path.nextElementSibling;
    if (next?.getAttribute("data-edge-hitbox") === "true") {
      return;
    }
    const hitbox = path.cloneNode(false) as SVGPathElement;
    hitbox.setAttribute("data-edge-hitbox", "true");
    hitbox.setAttribute("data-edge-left", edge.left);
    hitbox.setAttribute("data-edge-right", edge.right);
    hitbox.setAttribute("stroke", "transparent");
    hitbox.setAttribute("fill", "none");
    path.after(hitbox);
  }

  private _renderEdgeTooltip(edge: Edge): string {
    const connectionType = edge.wireless ? "Wireless" : "Wired";
    const icon = edge.wireless ? "📶" : "🔗";
    const rows: string[] = [];
    rows.push(
      `<div class="tooltip-edge__title">${escapeHtml(edge.left)} ↔ ${escapeHtml(edge.right)}</div>`,
    );
    rows.push(
      `<div class="tooltip-edge__row"><span class="tooltip-edge__icon">${icon}</span><span class="tooltip-edge__label">${connectionType}</span></div>`,
    );
    if (edge.label) {
      rows.push(
        `<div class="tooltip-edge__row"><span class="tooltip-edge__icon">🔌</span><span class="tooltip-edge__label">${escapeHtml(edge.label)}</span></div>`,
      );
    }
    if (edge.poe) {
      rows.push(
        `<div class="tooltip-edge__row"><span class="tooltip-edge__icon">⚡</span><span class="tooltip-edge__label">PoE Powered</span></div>`,
      );
    }
    if (edge.speed) {
      rows.push(
        `<div class="tooltip-edge__row"><span class="tooltip-edge__icon">🚀</span><span class="tooltip-edge__label">${this._formatSpeed(edge.speed)}</span></div>`,
      );
    }
    if (edge.channel) {
      rows.push(
        `<div class="tooltip-edge__row"><span class="tooltip-edge__icon">📡</span><span class="tooltip-edge__label">${this._formatChannel(edge.channel)}</span></div>`,
      );
    }
    return rows.join("");
  }

  private _formatSpeed(speedMbps: number): string {
    if (speedMbps >= 1000) {
      const gbps = (speedMbps / 1000).toFixed(1).replace(/\.0$/, "");
      return `${gbps} Gbps`;
    }
    return `${speedMbps} Mbps`;
  }

  private _formatChannel(channel: number): string {
    const band = this._channelBand(channel);
    const suffix = band ? ` (${band})` : "";
    return `Channel ${channel}${suffix}`;
  }

  private _channelBand(channel: number): string | null {
    if (channel >= 1 && channel <= 14) {
      return "2.4GHz";
    }
    if (channel >= 36 && channel <= 177) {
      return "5GHz";
    }
    if (channel >= 1) {
      return "6GHz";
    }
    return null;
  }

  private _applyTransform(svg: SVGElement) {
    const { x, y, scale } = this._viewTransform;
    svg.style.transformOrigin = "0 0";
    svg.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    svg.style.cursor = this._isPanning ? "grabbing" : "grab";
  }

  private _resolveNodeName(event: MouseEvent | PointerEvent): string | null {
    const path = event.composedPath();
    for (const item of path) {
      if (item instanceof Element) {
        const nodeId = item.getAttribute("data-node-id");
        if (nodeId) {
          return nodeId.trim();
        }
        const aria = item.getAttribute("aria-label");
        if (aria) {
          return aria.trim();
        }
        if (item.tagName.toLowerCase() === "text" && item.textContent) {
          return item.textContent.trim();
        }
        if (item.tagName.toLowerCase() === "title" && item.textContent) {
          return item.textContent.trim();
        }
      }
    }
    const fallback = document.elementFromPoint(event.clientX, event.clientY);
    return this._inferNodeName(fallback);
  }

  private _isControlTarget(target: Element | null): boolean {
    return Boolean(target?.closest(".unifi-network-map__controls"));
  }

  private _applyZoom(delta: number, svg: SVGElement) {
    const nextScale = Math.min(
      MAX_ZOOM_SCALE,
      Math.max(MIN_ZOOM_SCALE, this._viewTransform.scale + delta),
    );
    this._viewTransform.scale = Number(nextScale.toFixed(2));
    this._applyTransform(svg);
  }

  private _resetPan(svg: SVGElement) {
    this._viewTransform = { x: 0, y: 0, scale: 1 };
    this._selectedNode = undefined;
    this._applyTransform(svg);
    this._render();
  }

  private _inferNodeName(target: Element | null): string | null {
    if (!target) {
      return null;
    }
    const node = target.closest("[data-node-id]") as Element | null;
    if (node?.getAttribute("data-node-id")) {
      return node.getAttribute("data-node-id")?.trim() ?? null;
    }
    const labelled = target.closest("[aria-label]") as Element | null;
    if (labelled?.getAttribute("aria-label")) {
      return labelled.getAttribute("aria-label")?.trim() ?? null;
    }
    const textNode = target.closest("text");
    if (textNode?.textContent) {
      return textNode.textContent.trim();
    }
    const group = target.closest("g");
    const title = group?.querySelector("title");
    if (title?.textContent) {
      return title.textContent.trim();
    }
    const groupText = group?.querySelector("text");
    if (groupText?.textContent) {
      return groupText.textContent.trim();
    }
    const idHolder = target.closest("[id]") as Element | null;
    if (idHolder?.getAttribute("id")) {
      return idHolder.getAttribute("id")?.trim() ?? null;
    }
    return null;
  }

  private _highlightSelectedNode(svg: SVGElement) {
    this._clearNodeSelection(svg);
    if (!this._selectedNode) {
      return;
    }
    const element = this._findNodeElement(svg, this._selectedNode);
    if (element) {
      this._markNodeSelected(element);
    }
  }

  private _clearNodeSelection(svg: SVGElement) {
    svg.querySelectorAll("[data-selected]").forEach((el) => {
      el.removeAttribute("data-selected");
    });
    svg.querySelectorAll(".node--selected").forEach((el) => {
      el.classList.remove("node--selected");
    });
  }

  private _findNodeElement(svg: SVGElement, nodeName: string): Element | null {
    return (
      this._findByDataNodeId(svg, nodeName) ??
      this._findByAriaLabel(svg, nodeName) ??
      this._findByTextContent(svg, nodeName) ??
      this._findByTitleElement(svg, nodeName)
    );
  }

  private _findByDataNodeId(svg: SVGElement, nodeName: string): Element | null {
    const el = svg.querySelector(`[data-node-id="${CSS.escape(nodeName)}"]`);
    return el ? (el.closest("g") ?? el) : null;
  }

  private _findByAriaLabel(svg: SVGElement, nodeName: string): Element | null {
    const el = svg.querySelector(`[aria-label="${CSS.escape(nodeName)}"]`);
    return el ? (el.closest("g") ?? el) : null;
  }

  private _findByTextContent(svg: SVGElement, nodeName: string): Element | null {
    for (const textEl of svg.querySelectorAll("text")) {
      if (textEl.textContent?.trim() === nodeName) {
        return textEl.closest("g") ?? textEl;
      }
    }
    return null;
  }

  private _findByTitleElement(svg: SVGElement, nodeName: string): Element | null {
    for (const titleEl of svg.querySelectorAll("title")) {
      if (titleEl.textContent?.trim() === nodeName) {
        return titleEl.closest("g");
      }
    }
    return null;
  }

  private _markNodeSelected(element: Element) {
    if (element.tagName.toLowerCase() === "g") {
      element.setAttribute("data-selected", "true");
    } else {
      element.classList.add("node--selected");
    }
  }
}

class UnifiNetworkMapEditor extends HTMLElement {
  private _config?: CardConfig;
  private _hass?: Hass;
  private _entries: ConfigEntry[] = [];
  private _form?: HTMLElement & { schema: unknown; data: Record<string, unknown> };
  private _boundOnChange = (event: Event) => this._onChange(event);

  set hass(hass: Hass) {
    this._hass = hass;
    this._loadEntries();
  }

  setConfig(config: CardConfig) {
    this._config = config;
    this._render();
  }

  private async _loadEntries() {
    if (!this._hass?.callWS) {
      return;
    }
    try {
      const entries = await this._hass.callWS<ConfigEntry[]>({
        type: "config_entries/get",
        domain: DOMAIN,
      });
      this._entries = entries;
      if (!this._config?.entry_id && this._entries.length === 1) {
        this._updateConfigEntry(this._entries[0].entry_id);
        return;
      }
      this._render();
    } catch {
      this._entries = [];
      this._render();
    }
  }

  private _render() {
    if (this._entries.length === 0) {
      this._renderNoEntries();
      return;
    }
    if (!this._form) {
      this._initializeForm();
      if (!this._form) {
        return;
      }
    }
    this._form.schema = this._buildFormSchema();
    this._form.data = {
      entry_id: this._config?.entry_id ?? "",
      theme: this._config?.theme ?? "dark",
    };
  }

  private _renderNoEntries() {
    this.innerHTML = `
      <div style="padding: 16px;">
        <p style="color: var(--secondary-text-color);">
          No UniFi Network Map integrations found. Please add one first.
        </p>
      </div>
    `;
    this._form = undefined;
  }

  private _initializeForm() {
    this.innerHTML = `
      <div style="padding: 16px;">
        <ha-form></ha-form>
      </div>
    `;
    const form = this.querySelector("ha-form") as
      | (HTMLElement & { schema: unknown; data: Record<string, unknown> })
      | null;
    if (!form) {
      return;
    }
    this._form = form;
    this._form.addEventListener("value-changed", this._boundOnChange);
  }

  private _buildFormSchema(): FormSchemaEntry[] {
    const entryOptions = this._entries.map((entry) => ({
      label: entry.title,
      value: entry.entry_id,
    }));
    return [
      {
        name: "entry_id",
        required: true,
        selector: { select: { mode: "dropdown", options: entryOptions } },
        label: "UniFi Network Map Instance",
      },
      {
        name: "theme",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { label: "Dark (default)", value: "dark" },
              { label: "Light", value: "light" },
            ],
          },
        },
        label: "Theme",
      },
    ];
  }

  private _onChange(e: Event) {
    const detail = (e as CustomEvent<{ value?: { entry_id?: string; theme?: string } }>).detail;
    const entryId = detail.value?.entry_id ?? this._config?.entry_id ?? "";
    const themeValue = detail.value?.theme ?? this._config?.theme ?? "dark";
    const theme = themeValue === "light" ? "light" : "dark";
    if (this._config?.entry_id === entryId && this._config?.theme === theme) {
      return;
    }
    this._updateConfig({ entry_id: entryId, theme });
  }

  private _updateConfigEntry(entryId: string) {
    const selectedTheme = this._config?.theme ?? "dark";
    this._updateConfig({ entry_id: entryId, theme: selectedTheme });
  }

  private _updateConfig(update: { entry_id: string; theme: "dark" | "light" }) {
    this._config = {
      ...this._config,
      type: "custom:unifi-network-map",
      entry_id: update.entry_id,
      theme: update.theme,
    };
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

customElements.define("unifi-network-map", UnifiNetworkMapCard);
customElements.define("unifi-network-map-editor", UnifiNetworkMapEditor);

// Register card in Lovelace card picker
(
  window as unknown as { customCards?: Array<{ type: string; name: string; description: string }> }
).customCards =
  (
    window as unknown as {
      customCards?: Array<{ type: string; name: string; description: string }>;
    }
  ).customCards || [];
(
  window as unknown as { customCards: Array<{ type: string; name: string; description: string }> }
).customCards.push({
  type: "unifi-network-map",
  name: "UniFi Network Map",
  description: "Displays your UniFi network topology as an interactive SVG map",
});

console.info(`unifi-network-map card loaded v${CARD_VERSION}`);
