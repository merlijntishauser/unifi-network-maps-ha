export const CARD_STYLES = `
  unifi-network-map { display: block; }
  unifi-network-map ha-card { display: flex; flex-direction: column; box-sizing: border-box; }
  .unifi-network-map__layout { display: grid; grid-template-columns: minmax(0, 2.5fr) minmax(280px, 1fr); gap: 12px; padding: 12px; flex: 1; min-height: 0; height: 100%; }
  .unifi-network-map__viewport { position: relative; overflow: hidden; min-height: 300px; background: linear-gradient(135deg, #0b1016 0%, #111827 100%); border-radius: 12px; touch-action: none; contain: strict; isolation: isolate; height: 100%; }
  .unifi-network-map__viewport > svg { width: 100%; height: 100%; display: block; position: absolute; top: 0; left: 0; z-index: 0; }
  .unifi-network-map__viewport > svg, .unifi-network-map__viewport > svg * { pointer-events: bounding-box !important; }
  .unifi-icon { display: inline-flex; align-items: center; justify-content: center; line-height: 1; }
  .unifi-icon svg { width: 1em; height: 1em; stroke: currentColor; fill: none; }
  .unifi-network-map__controls { position: absolute; top: 8px; right: 8px; display: flex; gap: 6px; z-index: 3; }
  .unifi-network-map__controls button { background: rgba(15, 23, 42, 0.9); color: #e5e7eb; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 6px 10px; font-size: 12px; cursor: pointer; backdrop-filter: blur(8px); transition: all 0.15s ease; }
  .unifi-network-map__controls button:hover { background: rgba(59, 130, 246, 0.3); border-color: rgba(59, 130, 246, 0.5); }
  .unifi-network-map__viewport > svg text, .unifi-network-map__viewport > svg g { cursor: pointer; }
  .unifi-network-map__viewport > svg path[data-edge] { cursor: pointer; transition: stroke-width 0.15s ease, filter 0.15s ease; pointer-events: stroke; }
  .unifi-network-map__viewport > svg path[data-edge-hitbox] { stroke: transparent; stroke-width: 14; fill: none; pointer-events: stroke; }
  .unifi-network-map__viewport > svg path[data-edge]:hover { stroke-width: 4; filter: drop-shadow(0 0 4px currentColor); }

  /* Filter Bar */
  .filter-bar-container {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    z-index: 10;
    pointer-events: none;
  }
  .filter-bar {
    position: relative;
    bottom: 8px;
    z-index: 10;
    display: flex;
    gap: 4px;
    padding: 6px 8px;
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    backdrop-filter: blur(8px);
    pointer-events: auto;
  }
  .filter-button {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: #e5e7eb;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s ease;
    pointer-events: auto;
  }
  .filter-button:hover {
    background: rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.4);
  }
  .filter-button--active {
    background: rgba(59, 130, 246, 0.25);
    border-color: rgba(59, 130, 246, 0.5);
  }
  .filter-button--inactive {
    opacity: 0.5;
  }
  .filter-button--inactive:hover {
    opacity: 0.8;
  }
  .filter-button__icon {
    font-size: 14px;
    line-height: 1;
  }
  .filter-button__count {
    font-weight: 600;
    min-width: 16px;
    text-align: center;
  }

  /* Filtered nodes and edges */
  .unifi-network-map__viewport > svg .node--filtered,
  .unifi-network-map__viewport > svg .edge--filtered {
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
  }
  .unifi-network-map__panel { padding: 0; background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%); color: #e5e7eb; border-radius: 12px; font-size: 13px; overflow: hidden; display: flex; flex-direction: column; contain: strict; min-height: 0; height: 100%; }
  .unifi-network-map__tooltip { position: absolute; z-index: 2; background: rgba(15, 23, 42, 0.95); color: #fff; padding: 8px 12px; border-radius: 8px; font-size: 12px; pointer-events: none; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(8px); max-width: 280px; }
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
  .panel-tab-content { flex: 1; overflow-y: auto; padding: 16px; min-height: 0; }

  /* Sections */
  .panel-section { margin-bottom: 16px; padding: 0 16px; }
  .panel-section__title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 8px; }

  /* Stats Compact */
  .panel-stats-compact { display: flex; align-items: baseline; gap: 6px; padding: 8px 16px; }
  .panel-stats-compact__value { font-size: 18px; font-weight: 700; color: #60a5fa; }
  .panel-stats-compact__label { font-size: 12px; color: #94a3b8; }

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
  .neighbor-list--compact { gap: 4px; }
  .neighbor-item { display: flex; flex-direction: column; gap: 6px; padding: 10px 12px; background: rgba(255,255,255,0.03); border-radius: 8px; transition: background 0.15s ease; }
  .neighbor-item--compact { flex-direction: row; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 10px; }
  .neighbor-item:hover { background: rgba(255,255,255,0.06); }
  .neighbor-item__name { color: #e2e8f0; font-size: 13px; font-weight: 500; word-break: break-word; }
  .neighbor-item--compact .neighbor-item__name { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .neighbor-item__badges { display: flex; flex-wrap: wrap; gap: 4px; }
  .neighbor-item--compact .neighbor-item__badges { flex-shrink: 0; flex-wrap: nowrap; }
  .neighbor-item__name--link { text-decoration: none; cursor: pointer; transition: color 0.15s ease; }
  .neighbor-item__name--link:hover { color: #60a5fa; text-decoration: underline; }

  /* Entity List */
  .entity-list { display: flex; flex-direction: column; gap: 6px; }
  .entity-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: rgba(255,255,255,0.03); border-radius: 8px; transition: background 0.15s ease; cursor: pointer; }
  .entity-item:hover { background: rgba(255,255,255,0.06); }
  .entity-item__icon { font-size: 16px; flex-shrink: 0; }
  .entity-item__info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .entity-item__name { color: #e2e8f0; font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .entity-item__id { color: #64748b; font-size: 10px; font-family: ui-monospace, monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .entity-item__state { font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 10px; flex-shrink: 0; max-width: 90px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .entity-item__state--on { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
  .entity-item__state--off { background: rgba(107, 114, 128, 0.2); color: #9ca3af; }
  .entity-item__state--neutral { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
  .entity-item__state--unknown { background: rgba(107, 114, 128, 0.15); color: #6b7280; }

  /* Badges */
  .badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 500; }
  .badge--wireless { background: rgba(168, 85, 247, 0.2); color: #c084fc; }
  .badge--poe { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
  .badge--poe-inactive { background: rgba(148, 163, 184, 0.15); color: #64748b; }
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

  /* Loading + Error */
  .unifi-network-map__loading,
  .unifi-network-map__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 32px 16px;
    text-align: center;
    color: #e2e8f0;
  }
  .unifi-network-map__loading-text,
  .unifi-network-map__error-text {
    font-size: 13px;
    color: #cbd5e1;
  }
  .unifi-network-map__spinner {
    width: 28px;
    height: 28px;
    border-radius: 999px;
    border: 3px solid rgba(148, 163, 184, 0.3);
    border-top-color: #60a5fa;
    animation: unifi-spin 0.8s linear infinite;
  }
  .unifi-network-map__retry {
    background: rgba(59, 130, 246, 0.2);
    border: 1px solid rgba(59, 130, 246, 0.4);
    color: #e2e8f0;
    border-radius: 8px;
    padding: 8px 14px;
    font-size: 12px;
    cursor: pointer;
  }
  .unifi-network-map__retry:hover {
    background: rgba(59, 130, 246, 0.35);
  }
  .unifi-network-map__loading-overlay {
    position: absolute;
    top: 12px;
    left: 12px;
    right: 12px;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    color: #cbd5e1;
    z-index: 2;
    pointer-events: none;
    font-size: 12px;
  }
  @keyframes unifi-spin {
    to { transform: rotate(360deg); }
  }

  /* Preview */
  .unifi-network-map__preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 16px;
    gap: 12px;
    min-height: 200px;
  }
  .unifi-network-map__preview img {
    max-width: 100%;
    max-height: 200px;
    border-radius: 8px;
    opacity: 0.9;
  }
  .unifi-network-map__preview-text {
    font-size: 12px;
    color: #94a3b8;
    text-align: center;
  }

  /* Info Row */
  .info-row { display: flex; flex-direction: column; gap: 4px; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 8px; }
  .info-row:last-child { margin-bottom: 0; }
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
  .unifi-network-map__viewport > svg [data-selected="true"],
  .unifi-network-map__viewport > svg .node--selected {
    filter: none;
  }
  .unifi-network-map__viewport > svg [data-selected="true"] > *,
  .unifi-network-map__viewport > svg .node--selected > * {
    stroke: #3b82f6 !important;
    stroke-width: 2.5px;
    stroke-linejoin: round;
    stroke-linecap: round;
  }
  .unifi-network-map__viewport > svg [data-selected="true"] text,
  .unifi-network-map__viewport > svg .node--selected text {
    stroke: none !important;
    fill: #3b82f6 !important;
  }

  /* SVG theme viewport backgrounds - matches the SVG theme background colors */
  ha-card[data-svg-theme="unifi"] .unifi-network-map__viewport { background: #f9fafa; }
  ha-card[data-svg-theme="unifi-dark"] .unifi-network-map__viewport { background: #1c1e21; }
  ha-card[data-svg-theme="minimal"] .unifi-network-map__viewport { background: #fafafa; }
  ha-card[data-svg-theme="minimal-dark"] .unifi-network-map__viewport { background: #18181b; }
  ha-card[data-svg-theme="classic"] .unifi-network-map__viewport { background: #ffffff; }
  ha-card[data-svg-theme="classic-dark"] .unifi-network-map__viewport { background: #1a1a1a; }

  /* Light theme overrides */
  ha-card[data-theme="light"] .unifi-network-map__viewport { background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); }
  ha-card[data-theme="light"] .unifi-network-map__controls button { background: rgba(226, 232, 240, 0.9); color: #0f172a; border-color: rgba(148, 163, 184, 0.5); }
  ha-card[data-theme="light"] .unifi-network-map__retry { background: #3b82f6; border-color: #3b82f6; color: #ffffff; }
  ha-card[data-theme="light"] .unifi-network-map__retry:hover { background: #2563eb; }
  ha-card[data-theme="light"] .unifi-network-map__error-text { color: #0f172a; }
  ha-card[data-theme="light"] .unifi-network-map__panel { background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%); color: #0f172a; }
  ha-card[data-theme="light"] .panel-header { background: rgba(148, 163, 184, 0.15); border-bottom-color: rgba(148, 163, 184, 0.3); }
  ha-card[data-theme="light"] .panel-header__title { color: #0f172a; }
  ha-card[data-theme="light"] .panel-header__badge { background: rgba(59, 130, 246, 0.15); color: #1d4ed8; }
  ha-card[data-theme="light"] .panel-tab { color: #64748b; }
  ha-card[data-theme="light"] .panel-tab--active { color: #1d4ed8; border-bottom-color: #3b82f6; }
  ha-card[data-theme="light"] .panel-section__title { color: #475569; }
  ha-card[data-theme="light"] .panel-stats-compact__label { color: #64748b; }
  ha-card[data-theme="light"] .device-row { background: rgba(15, 23, 42, 0.04); }
  ha-card[data-theme="light"] .device-row__label { color: #0f172a; }
  ha-card[data-theme="light"] .device-row__count { color: #1d4ed8; }
  ha-card[data-theme="light"] .neighbor-item { background: rgba(15, 23, 42, 0.04); }
  ha-card[data-theme="light"] .neighbor-item__name { color: #0f172a; }
  ha-card[data-theme="light"] .neighbor-item__name--link:hover { color: #1d4ed8; }
  ha-card[data-theme="light"] .entity-item { background: rgba(15, 23, 42, 0.04); }
  ha-card[data-theme="light"] .entity-item__name { color: #0f172a; }
  ha-card[data-theme="light"] .entity-item__id { color: #64748b; }
  ha-card[data-theme="light"] .entity-item__state--on { background: rgba(34, 197, 94, 0.15); color: #16a34a; }
  ha-card[data-theme="light"] .entity-item__state--neutral { background: rgba(59, 130, 246, 0.1); color: #1d4ed8; }
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
  ha-card[data-theme="light"] .filter-bar { background: rgba(241, 245, 249, 0.95); border-color: rgba(148, 163, 184, 0.4); }
  ha-card[data-theme="light"] .filter-button { background: rgba(15, 23, 42, 0.05); border-color: rgba(148, 163, 184, 0.3); color: #0f172a; }
  ha-card[data-theme="light"] .filter-button:hover { background: rgba(59, 130, 246, 0.15); border-color: rgba(59, 130, 246, 0.4); }
  ha-card[data-theme="light"] .filter-button--active { background: rgba(59, 130, 246, 0.2); border-color: rgba(59, 130, 246, 0.5); }
  ha-card[data-theme="light"] .status-badge--online { background: rgba(34, 197, 94, 0.15); color: #16a34a; }
  ha-card[data-theme="light"] .status-badge--offline { background: rgba(239, 68, 68, 0.15); color: #dc2626; }
  ha-card[data-theme="light"] .status-badge--unknown { background: rgba(107, 114, 128, 0.15); color: #6b7280; }

  @media (max-width: 800px) {
    .unifi-network-map__layout { grid-template-columns: 1fr; }
  }

  /* UniFi theme - matches official UniFi Network application style */
  ha-card[data-theme="unifi"] { background: #f7f8fa; }
  ha-card[data-theme="unifi"] .unifi-network-map__viewport { background: #ffffff; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); }
  ha-card[data-theme="unifi"] .unifi-network-map__controls button { background: #ffffff; color: #374151; border: 1px solid #e5e7eb; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); }
  ha-card[data-theme="unifi"] .unifi-network-map__controls button:hover { background: #f3f4f6; border-color: #006fff; color: #006fff; }
  ha-card[data-theme="unifi"] .unifi-network-map__retry { background: #006fff; border-color: #006fff; color: #ffffff; }
  ha-card[data-theme="unifi"] .unifi-network-map__retry:hover { background: #0058cc; }
  ha-card[data-theme="unifi"] .unifi-network-map__error-text { color: #374151; }
  ha-card[data-theme="unifi"] .unifi-network-map__panel { background: #ffffff; color: #1a1a1a; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); }
  ha-card[data-theme="unifi"] .panel-header { background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
  ha-card[data-theme="unifi"] .panel-header__title { color: #1a1a1a; }
  ha-card[data-theme="unifi"] .panel-header__back { background: #ffffff; border-color: #e5e7eb; color: #6b7280; }
  ha-card[data-theme="unifi"] .panel-header__back:hover { background: #f3f4f6; border-color: #006fff; color: #006fff; }
  ha-card[data-theme="unifi"] .panel-header__badge { background: rgba(0, 111, 255, 0.1); color: #006fff; }
  ha-card[data-theme="unifi"] .panel-tabs { background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
  ha-card[data-theme="unifi"] .panel-tab { color: #6b7280; }
  ha-card[data-theme="unifi"] .panel-tab:hover { color: #374151; }
  ha-card[data-theme="unifi"] .panel-tab--active { color: #006fff; border-bottom-color: #006fff; }
  ha-card[data-theme="unifi"] .panel-section__title { color: #6b7280; }
  ha-card[data-theme="unifi"] .panel-stats-compact__value { color: #006fff; }
  ha-card[data-theme="unifi"] .panel-stats-compact__label { color: #6b7280; }
  ha-card[data-theme="unifi"] .stats-row { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; }
  ha-card[data-theme="unifi"] .stats-row__label { color: #6b7280; }
  ha-card[data-theme="unifi"] .stats-row__value { color: #1a1a1a; }
  ha-card[data-theme="unifi"] .device-row { background: #f9fafb; border: 1px solid #e5e7eb; }
  ha-card[data-theme="unifi"] .device-row__label { color: #1a1a1a; }
  ha-card[data-theme="unifi"] .device-row__count { color: #006fff; background: rgba(0, 111, 255, 0.1); }
  ha-card[data-theme="unifi"] .neighbor-item { background: #f9fafb; border: 1px solid #e5e7eb; }
  ha-card[data-theme="unifi"] .neighbor-item:hover { background: #f3f4f6; border-color: #006fff; }
  ha-card[data-theme="unifi"] .neighbor-item__name { color: #1a1a1a; }
  ha-card[data-theme="unifi"] .neighbor-item__name--link:hover { color: #006fff; }
  ha-card[data-theme="unifi"] .entity-item { background: #f9fafb; border: 1px solid #e5e7eb; }
  ha-card[data-theme="unifi"] .entity-item:hover { background: #f3f4f6; border-color: #006fff; }
  ha-card[data-theme="unifi"] .entity-item__name { color: #1a1a1a; }
  ha-card[data-theme="unifi"] .entity-item__id { color: #6b7280; }
  ha-card[data-theme="unifi"] .entity-item__state--on { background: rgba(0, 168, 107, 0.1); color: #00a86b; }
  ha-card[data-theme="unifi"] .entity-item__state--neutral { background: rgba(0, 111, 255, 0.1); color: #006fff; }
  ha-card[data-theme="unifi"] .info-row { background: #f9fafb; border: 1px solid #e5e7eb; }
  ha-card[data-theme="unifi"] .info-row__label { color: #6b7280; }
  ha-card[data-theme="unifi"] .info-row__value { color: #006fff; }
  ha-card[data-theme="unifi"] .action-button { background: #ffffff; border: 1px solid #e5e7eb; color: #374151; }
  ha-card[data-theme="unifi"] .action-button:hover { background: #f3f4f6; border-color: #006fff; color: #006fff; }
  ha-card[data-theme="unifi"] .action-button--primary { background: #006fff; border-color: #006fff; color: #ffffff; }
  ha-card[data-theme="unifi"] .action-button--primary:hover { background: #0058cc; }
  ha-card[data-theme="unifi"] .entity-id { background: #f3f4f6; color: #006fff; border: 1px solid #e5e7eb; }
  ha-card[data-theme="unifi"] .panel-empty__text { color: #6b7280; }
  ha-card[data-theme="unifi"] .panel-hint { background: rgba(0, 111, 255, 0.05); color: #374151; border: 1px solid rgba(0, 111, 255, 0.2); }
  ha-card[data-theme="unifi"] .unifi-network-map__tooltip { background: #1a1a1a; border: none; }
  ha-card[data-theme="unifi"] .status-badge--online { background: rgba(0, 168, 107, 0.1); color: #00a86b; }
  ha-card[data-theme="unifi"] .status-badge--offline { background: rgba(239, 68, 68, 0.1); color: #dc2626; }
  ha-card[data-theme="unifi"] .status-badge--unknown { background: rgba(107, 114, 128, 0.1); color: #6b7280; }
  ha-card[data-theme="unifi"] .status-dot--online { background: #00a86b; box-shadow: 0 0 6px rgba(0, 168, 107, 0.5); }
  ha-card[data-theme="unifi"] .badge--wireless { background: rgba(168, 85, 247, 0.1); color: #9333ea; }
  ha-card[data-theme="unifi"] .badge--poe { background: rgba(0, 168, 107, 0.1); color: #00a86b; }
  ha-card[data-theme="unifi"] .badge--poe-inactive { background: #f3f4f6; color: #9ca3af; }
  ha-card[data-theme="unifi"] .badge--port { background: #f3f4f6; color: #6b7280; border: 1px solid #e5e7eb; }
  ha-card[data-theme="unifi"] .unifi-network-map__viewport > svg [data-selected="true"] > *,
  ha-card[data-theme="unifi"] .unifi-network-map__viewport > svg .node--selected > * { stroke: #006fff !important; }
  ha-card[data-theme="unifi"] .unifi-network-map__viewport > svg [data-selected="true"] text,
  ha-card[data-theme="unifi"] .unifi-network-map__viewport > svg .node--selected text { stroke: none !important; fill: #006fff !important; }
  ha-card[data-theme="unifi"] .filter-bar { background: #ffffff; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); }
  ha-card[data-theme="unifi"] .filter-button { background: #f9fafb; border: 1px solid #e5e7eb; color: #374151; }
  ha-card[data-theme="unifi"] .filter-button:hover { background: #f3f4f6; border-color: #006fff; color: #006fff; }
  ha-card[data-theme="unifi"] .filter-button--active { background: rgba(0, 111, 255, 0.1); border-color: #006fff; color: #006fff; }

  /* UniFi Dark theme - dark mode version of UniFi style */
  ha-card[data-theme="unifi-dark"] { background: #0d0d0d; }
  ha-card[data-theme="unifi-dark"] .unifi-network-map__viewport { background: #1a1a1a; border: 1px solid #2a2a2a; }
  ha-card[data-theme="unifi-dark"] .unifi-network-map__controls button { background: #1a1a1a; color: #e5e5e5; border: 1px solid #2a2a2a; }
  ha-card[data-theme="unifi-dark"] .unifi-network-map__controls button:hover { background: #252525; border-color: #006fff; color: #006fff; }
  ha-card[data-theme="unifi-dark"] .unifi-network-map__panel { background: #1a1a1a; color: #e5e5e5; border: 1px solid #2a2a2a; }
  ha-card[data-theme="unifi-dark"] .panel-header { background: #151515; border-bottom: 1px solid #2a2a2a; }
  ha-card[data-theme="unifi-dark"] .panel-header__title { color: #ffffff; }
  ha-card[data-theme="unifi-dark"] .panel-header__back { background: #1a1a1a; border-color: #2a2a2a; color: #9ca3af; }
  ha-card[data-theme="unifi-dark"] .panel-header__back:hover { background: #252525; border-color: #006fff; color: #006fff; }
  ha-card[data-theme="unifi-dark"] .panel-header__badge { background: rgba(0, 111, 255, 0.15); color: #3b9eff; }
  ha-card[data-theme="unifi-dark"] .panel-tabs { background: #151515; border-bottom: 1px solid #2a2a2a; }
  ha-card[data-theme="unifi-dark"] .panel-tab { color: #9ca3af; }
  ha-card[data-theme="unifi-dark"] .panel-tab:hover { color: #e5e5e5; }
  ha-card[data-theme="unifi-dark"] .panel-tab--active { color: #3b9eff; border-bottom-color: #006fff; }
  ha-card[data-theme="unifi-dark"] .panel-section__title { color: #9ca3af; }
  ha-card[data-theme="unifi-dark"] .panel-stats-compact__value { color: #3b9eff; }
  ha-card[data-theme="unifi-dark"] .panel-stats-compact__label { color: #9ca3af; }
  ha-card[data-theme="unifi-dark"] .stats-row { background: #151515; border: 1px solid #2a2a2a; border-radius: 8px; }
  ha-card[data-theme="unifi-dark"] .stats-row__label { color: #9ca3af; }
  ha-card[data-theme="unifi-dark"] .stats-row__value { color: #e5e5e5; }
  ha-card[data-theme="unifi-dark"] .device-row { background: #151515; border: 1px solid #2a2a2a; }
  ha-card[data-theme="unifi-dark"] .device-row__label { color: #e5e5e5; }
  ha-card[data-theme="unifi-dark"] .device-row__count { color: #3b9eff; background: rgba(0, 111, 255, 0.15); }
  ha-card[data-theme="unifi-dark"] .neighbor-item { background: #151515; border: 1px solid #2a2a2a; }
  ha-card[data-theme="unifi-dark"] .neighbor-item:hover { background: #1f1f1f; border-color: #006fff; }
  ha-card[data-theme="unifi-dark"] .neighbor-item__name { color: #e5e5e5; }
  ha-card[data-theme="unifi-dark"] .neighbor-item__name--link:hover { color: #3b9eff; }
  ha-card[data-theme="unifi-dark"] .entity-item { background: #151515; border: 1px solid #2a2a2a; }
  ha-card[data-theme="unifi-dark"] .entity-item:hover { background: #1f1f1f; border-color: #006fff; }
  ha-card[data-theme="unifi-dark"] .entity-item__name { color: #e5e5e5; }
  ha-card[data-theme="unifi-dark"] .entity-item__id { color: #9ca3af; }
  ha-card[data-theme="unifi-dark"] .entity-item__state--on { background: rgba(0, 168, 107, 0.15); color: #00d68f; }
  ha-card[data-theme="unifi-dark"] .entity-item__state--neutral { background: rgba(0, 111, 255, 0.15); color: #3b9eff; }
  ha-card[data-theme="unifi-dark"] .info-row { background: #151515; border: 1px solid #2a2a2a; }
  ha-card[data-theme="unifi-dark"] .info-row__label { color: #9ca3af; }
  ha-card[data-theme="unifi-dark"] .info-row__value { color: #3b9eff; }
  ha-card[data-theme="unifi-dark"] .action-button { background: #1a1a1a; border: 1px solid #2a2a2a; color: #e5e5e5; }
  ha-card[data-theme="unifi-dark"] .action-button:hover { background: #252525; border-color: #006fff; color: #006fff; }
  ha-card[data-theme="unifi-dark"] .action-button--primary { background: #006fff; border-color: #006fff; color: #ffffff; }
  ha-card[data-theme="unifi-dark"] .action-button--primary:hover { background: #0058cc; }
  ha-card[data-theme="unifi-dark"] .entity-id { background: #151515; color: #3b9eff; border: 1px solid #2a2a2a; }
  ha-card[data-theme="unifi-dark"] .panel-empty__text { color: #9ca3af; }
  ha-card[data-theme="unifi-dark"] .panel-hint { background: rgba(0, 111, 255, 0.1); color: #e5e5e5; border: 1px solid rgba(0, 111, 255, 0.2); }
  ha-card[data-theme="unifi-dark"] .unifi-network-map__tooltip { background: #0d0d0d; border: 1px solid #2a2a2a; }
  ha-card[data-theme="unifi-dark"] .status-badge--online { background: rgba(0, 168, 107, 0.15); color: #00d68f; }
  ha-card[data-theme="unifi-dark"] .status-badge--offline { background: rgba(239, 68, 68, 0.15); color: #f87171; }
  ha-card[data-theme="unifi-dark"] .status-badge--unknown { background: rgba(156, 163, 175, 0.15); color: #9ca3af; }
  ha-card[data-theme="unifi-dark"] .status-dot--online { background: #00d68f; box-shadow: 0 0 6px rgba(0, 214, 143, 0.5); }
  ha-card[data-theme="unifi-dark"] .badge--wireless { background: rgba(168, 85, 247, 0.15); color: #c084fc; }
  ha-card[data-theme="unifi-dark"] .badge--poe { background: rgba(0, 168, 107, 0.15); color: #00d68f; }
  ha-card[data-theme="unifi-dark"] .badge--poe-inactive { background: #1f1f1f; color: #6b7280; }
  ha-card[data-theme="unifi-dark"] .badge--port { background: #1f1f1f; color: #9ca3af; border: 1px solid #2a2a2a; }
  ha-card[data-theme="unifi-dark"] .unifi-network-map__viewport > svg [data-selected="true"] > *,
  ha-card[data-theme="unifi-dark"] .unifi-network-map__viewport > svg .node--selected > * { stroke: #006fff !important; }
  ha-card[data-theme="unifi-dark"] .unifi-network-map__viewport > svg [data-selected="true"] text,
  ha-card[data-theme="unifi-dark"] .unifi-network-map__viewport > svg .node--selected text { stroke: none !important; fill: #3b9eff !important; }
  ha-card[data-theme="unifi-dark"] .filter-bar { background: #1a1a1a; border: 1px solid #2a2a2a; }
  ha-card[data-theme="unifi-dark"] .filter-button { background: #151515; border: 1px solid #2a2a2a; color: #e5e5e5; }
  ha-card[data-theme="unifi-dark"] .filter-button:hover { background: #252525; border-color: #006fff; color: #3b9eff; }
  ha-card[data-theme="unifi-dark"] .filter-button--active { background: rgba(0, 111, 255, 0.15); border-color: #006fff; color: #3b9eff; }

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
    overflow-x: hidden;
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
    padding-bottom: 28px;
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
    overflow: hidden;
    max-width: 100%;
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
    overflow: hidden;
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
    max-width: 100px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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

  /* UniFi theme entity modal */
  .entity-modal-overlay[data-theme="unifi"] .entity-modal { background: #ffffff; border: 1px solid #e5e7eb; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__header { background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__title { color: #1a1a1a; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__close { color: #6b7280; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__close:hover { background: #f3f4f6; color: #1a1a1a; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__section-title { color: #6b7280; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__info-row { background: #f9fafb; border: 1px solid #e5e7eb; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__info-label { color: #6b7280; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__info-value { color: #1a1a1a; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__entity-item { background: #f9fafb; border: 1px solid #e5e7eb; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__entity-item:hover { background: #f3f4f6; border-color: #006fff; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__entity-name { color: #1a1a1a; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__entity-id { color: #6b7280; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__state-badge--home,
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__state-badge--on { background: rgba(0, 168, 107, 0.1); color: #00a86b; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__state-badge--not_home,
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__state-badge--off { background: rgba(239, 68, 68, 0.1); color: #dc2626; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__state-badge--default { background: #f3f4f6; color: #6b7280; }

  /* UniFi theme context menu */
  .context-menu[data-theme="unifi"] { background: #ffffff; border: 1px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
  .context-menu[data-theme="unifi"] .context-menu__header { border-bottom: 1px solid #e5e7eb; }
  .context-menu[data-theme="unifi"] .context-menu__title { color: #1a1a1a; }
  .context-menu[data-theme="unifi"] .context-menu__type { color: #6b7280; }
  .context-menu[data-theme="unifi"] .context-menu__item { color: #374151; }
  .context-menu[data-theme="unifi"] .context-menu__item:hover { background: rgba(0, 111, 255, 0.1); color: #006fff; }
  .context-menu[data-theme="unifi"] .context-menu__item--danger:hover { background: rgba(239, 68, 68, 0.1); color: #dc2626; }
  .context-menu[data-theme="unifi"] .context-menu__divider { background: #e5e7eb; }

  /* UniFi Dark theme entity modal */
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal { background: #1a1a1a; border: 1px solid #2a2a2a; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__header { background: #151515; border-bottom: 1px solid #2a2a2a; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__title { color: #ffffff; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__close { color: #9ca3af; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__close:hover { background: #252525; color: #ffffff; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__section-title { color: #9ca3af; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__info-row { background: #151515; border: 1px solid #2a2a2a; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__info-label { color: #9ca3af; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__info-value { color: #e5e5e5; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__entity-item { background: #151515; border: 1px solid #2a2a2a; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__entity-item:hover { background: #1f1f1f; border-color: #006fff; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__entity-name { color: #e5e5e5; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__entity-id { color: #9ca3af; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__state-badge--home,
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__state-badge--on { background: rgba(0, 168, 107, 0.15); color: #00d68f; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__state-badge--not_home,
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__state-badge--off { background: rgba(239, 68, 68, 0.15); color: #f87171; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__state-badge--default { background: #1f1f1f; color: #9ca3af; }

  /* UniFi Dark theme context menu */
  .context-menu[data-theme="unifi-dark"] { background: #1a1a1a; border: 1px solid #2a2a2a; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); }
  .context-menu[data-theme="unifi-dark"] .context-menu__header { border-bottom: 1px solid #2a2a2a; }
  .context-menu[data-theme="unifi-dark"] .context-menu__title { color: #ffffff; }
  .context-menu[data-theme="unifi-dark"] .context-menu__type { color: #9ca3af; }
  .context-menu[data-theme="unifi-dark"] .context-menu__item { color: #e5e5e5; }
  .context-menu[data-theme="unifi-dark"] .context-menu__item:hover { background: rgba(0, 111, 255, 0.15); color: #3b9eff; }
  .context-menu[data-theme="unifi-dark"] .context-menu__item--danger:hover { background: rgba(239, 68, 68, 0.15); color: #f87171; }
  .context-menu[data-theme="unifi-dark"] .context-menu__divider { background: #2a2a2a; }
`;

export const GLOBAL_STYLES = `
  .unifi-icon { display: inline-flex; align-items: center; justify-content: center; line-height: 1; }
  .unifi-icon svg { width: 1em; height: 1em; stroke: currentColor; fill: none; }

  /* Entity Modal Styles (appended to document.body) */
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
    overflow-x: hidden;
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
    padding-bottom: 28px;
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
    overflow: hidden;
    max-width: 100%;
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
    overflow: hidden;
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
    max-width: 100px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
  .panel-empty__text {
    color: #64748b;
    font-size: 13px;
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

  /* Context Menu (appended to document.body) */
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

  /* UniFi theme entity modal (global) */
  .entity-modal-overlay[data-theme="unifi"] .entity-modal { background: #ffffff; border: 1px solid #e5e7eb; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__header { background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__title { color: #1a1a1a; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__close { color: #6b7280; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__close:hover { background: #f3f4f6; color: #1a1a1a; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__section-title { color: #6b7280; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__info-row { background: #f9fafb; border: 1px solid #e5e7eb; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__info-label { color: #6b7280; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__info-value { color: #1a1a1a; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__entity-item { background: #f9fafb; border: 1px solid #e5e7eb; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__entity-item:hover { background: #f3f4f6; border-color: #006fff; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__entity-name { color: #1a1a1a; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__entity-id { color: #6b7280; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__state-badge--home,
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__state-badge--on { background: rgba(0, 168, 107, 0.1); color: #00a86b; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__state-badge--not_home,
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__state-badge--off { background: rgba(239, 68, 68, 0.1); color: #dc2626; }
  .entity-modal-overlay[data-theme="unifi"] .entity-modal__state-badge--default { background: #f3f4f6; color: #6b7280; }

  /* UniFi theme context menu (global) */
  .context-menu[data-theme="unifi"] { background: #ffffff; border: 1px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
  .context-menu[data-theme="unifi"] .context-menu__header { border-bottom: 1px solid #e5e7eb; }
  .context-menu[data-theme="unifi"] .context-menu__title { color: #1a1a1a; }
  .context-menu[data-theme="unifi"] .context-menu__type { color: #6b7280; }
  .context-menu[data-theme="unifi"] .context-menu__item { color: #374151; }
  .context-menu[data-theme="unifi"] .context-menu__item:hover { background: rgba(0, 111, 255, 0.1); color: #006fff; }
  .context-menu[data-theme="unifi"] .context-menu__item--danger:hover { background: rgba(239, 68, 68, 0.1); color: #dc2626; }
  .context-menu[data-theme="unifi"] .context-menu__divider { background: #e5e7eb; }

  /* UniFi Dark theme entity modal (global) */
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal { background: #1a1a1a; border: 1px solid #2a2a2a; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__header { background: #151515; border-bottom: 1px solid #2a2a2a; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__title { color: #ffffff; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__close { color: #9ca3af; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__close:hover { background: #252525; color: #ffffff; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__section-title { color: #9ca3af; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__info-row { background: #151515; border: 1px solid #2a2a2a; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__info-label { color: #9ca3af; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__info-value { color: #e5e5e5; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__entity-item { background: #151515; border: 1px solid #2a2a2a; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__entity-item:hover { background: #1f1f1f; border-color: #006fff; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__entity-name { color: #e5e5e5; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__entity-id { color: #9ca3af; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__state-badge--home,
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__state-badge--on { background: rgba(0, 168, 107, 0.15); color: #00d68f; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__state-badge--not_home,
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__state-badge--off { background: rgba(239, 68, 68, 0.15); color: #f87171; }
  .entity-modal-overlay[data-theme="unifi-dark"] .entity-modal__state-badge--default { background: #1f1f1f; color: #9ca3af; }

  /* UniFi Dark theme context menu (global) */
  .context-menu[data-theme="unifi-dark"] { background: #1a1a1a; border: 1px solid #2a2a2a; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); }
  .context-menu[data-theme="unifi-dark"] .context-menu__header { border-bottom: 1px solid #2a2a2a; }
  .context-menu[data-theme="unifi-dark"] .context-menu__title { color: #ffffff; }
  .context-menu[data-theme="unifi-dark"] .context-menu__type { color: #9ca3af; }
  .context-menu[data-theme="unifi-dark"] .context-menu__item { color: #e5e5e5; }
  .context-menu[data-theme="unifi-dark"] .context-menu__item:hover { background: rgba(0, 111, 255, 0.15); color: #3b9eff; }
  .context-menu[data-theme="unifi-dark"] .context-menu__item--danger:hover { background: rgba(239, 68, 68, 0.15); color: #f87171; }
  .context-menu[data-theme="unifi-dark"] .context-menu__divider { background: #2a2a2a; }

  /* Toast feedback animation */
  @keyframes fadeInOut {
    0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
    15% { opacity: 1; transform: translateX(-50%) translateY(0); }
    85% { opacity: 1; transform: translateX(-50%) translateY(0); }
    100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
  }

  /* Port Modal Styles */
  .port-modal-overlay {
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
  .port-modal {
    background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
    border-radius: 16px;
    width: 90%;
    max-width: 520px;
    max-height: 85vh;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(148, 163, 184, 0.2);
  }
  .port-modal__header {
    padding: 20px 24px;
    background: rgba(148, 163, 184, 0.1);
    border-bottom: 1px solid rgba(148, 163, 184, 0.2);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .port-modal__title {
    font-size: 18px;
    font-weight: 600;
    color: #f8fafc;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .port-modal__icon { font-size: 20px; }
  .port-modal__close {
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 24px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 8px;
    transition: all 0.2s;
  }
  .port-modal__close:hover {
    background: rgba(148, 163, 184, 0.2);
    color: #f8fafc;
  }
  .port-modal__subtitle {
    padding: 12px 24px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #64748b;
    background: rgba(0, 0, 0, 0.2);
  }
  .port-modal__body {
    padding: 16px 24px;
    overflow-y: auto;
    max-height: calc(85vh - 140px);
  }
  .port-list { display: flex; flex-direction: column; gap: 8px; }
  .port-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    background: rgba(30, 41, 59, 0.5);
    border-radius: 10px;
    border: 1px solid rgba(148, 163, 184, 0.1);
  }
  .port-row--connected { }
  .port-row--empty { opacity: 0.5; }
  .port-row__number {
    font-weight: 600;
    font-size: 13px;
    color: #94a3b8;
    min-width: 60px;
  }
  .port-row__device {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .port-row__device-icon { font-size: 16px; flex-shrink: 0; }
  .port-row__device-name {
    color: #60a5fa;
    text-decoration: none;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .port-row__device-name:hover { text-decoration: underline; }
  .port-row__empty { color: #64748b; font-size: 13px; }
  .port-row__badges { display: flex; gap: 4px; flex-shrink: 0; }
  .port-modal__empty {
    text-align: center;
    color: #64748b;
    padding: 24px;
  }

  /* Port Modal - Light theme */
  .port-modal-overlay[data-theme="light"] .port-modal {
    background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
  }
  .port-modal-overlay[data-theme="light"] .port-modal__header {
    background: rgba(148, 163, 184, 0.15);
    border-bottom-color: rgba(148, 163, 184, 0.3);
  }
  .port-modal-overlay[data-theme="light"] .port-modal__title { color: #0f172a; }
  .port-modal-overlay[data-theme="light"] .port-modal__close { color: #64748b; }
  .port-modal-overlay[data-theme="light"] .port-modal__close:hover { background: rgba(15, 23, 42, 0.1); color: #0f172a; }
  .port-modal-overlay[data-theme="light"] .port-modal__subtitle { color: #475569; }
  .port-modal-overlay[data-theme="light"] .port-row { background: rgba(15, 23, 42, 0.04); }
  .port-modal-overlay[data-theme="light"] .port-row__number { color: #64748b; }
  .port-modal-overlay[data-theme="light"] .port-row__device-name { color: #1d4ed8; }
  .port-modal-overlay[data-theme="light"] .port-row__empty { color: #64748b; }

  /* Port Modal - UniFi theme */
  .port-modal-overlay[data-theme="unifi"] .port-modal { background: #ffffff; border: 1px solid #e5e7eb; }
  .port-modal-overlay[data-theme="unifi"] .port-modal__header { background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
  .port-modal-overlay[data-theme="unifi"] .port-modal__title { color: #1a1a1a; }
  .port-modal-overlay[data-theme="unifi"] .port-modal__close { color: #6b7280; }
  .port-modal-overlay[data-theme="unifi"] .port-modal__close:hover { background: #f3f4f6; color: #1a1a1a; }
  .port-modal-overlay[data-theme="unifi"] .port-modal__subtitle { color: #6b7280; background: #f9fafb; }
  .port-modal-overlay[data-theme="unifi"] .port-row { background: #f9fafb; border: 1px solid #e5e7eb; }
  .port-modal-overlay[data-theme="unifi"] .port-row__number { color: #6b7280; }
  .port-modal-overlay[data-theme="unifi"] .port-row__device-name { color: #006fff; }
  .port-modal-overlay[data-theme="unifi"] .port-row__empty { color: #6b7280; }

  /* Port Modal - UniFi Dark theme */
  .port-modal-overlay[data-theme="unifi-dark"] .port-modal { background: #1a1a1a; border: 1px solid #2a2a2a; }
  .port-modal-overlay[data-theme="unifi-dark"] .port-modal__header { background: #151515; border-bottom: 1px solid #2a2a2a; }
  .port-modal-overlay[data-theme="unifi-dark"] .port-modal__title { color: #ffffff; }
  .port-modal-overlay[data-theme="unifi-dark"] .port-modal__close { color: #9ca3af; }
  .port-modal-overlay[data-theme="unifi-dark"] .port-modal__close:hover { background: #252525; color: #ffffff; }
  .port-modal-overlay[data-theme="unifi-dark"] .port-modal__subtitle { color: #9ca3af; background: #151515; }
  .port-modal-overlay[data-theme="unifi-dark"] .port-row { background: #151515; border: 1px solid #2a2a2a; }
  .port-modal-overlay[data-theme="unifi-dark"] .port-row__number { color: #9ca3af; }
  .port-modal-overlay[data-theme="unifi-dark"] .port-row__device-name { color: #3b9eff; }
  .port-modal-overlay[data-theme="unifi-dark"] .port-row__empty { color: #9ca3af; }
`;
