// src/unifi-network-map.ts
function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function sanitizeSvg(svg) {
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
var DOMAIN = "unifi_network_map";
var MIN_PAN_MOVEMENT_THRESHOLD = 2;
var ZOOM_INCREMENT = 0.1;
var MIN_ZOOM_SCALE = 0.5;
var MAX_ZOOM_SCALE = 4;
var TOOLTIP_OFFSET_PX = 12;
var UnifiNetworkMapCard = class extends HTMLElement {
  constructor() {
    super(...arguments);
    this._loading = false;
    this._dataLoading = false;
    this._panState = { x: 0, y: 0, scale: 1 };
    this._isPanning = false;
    this._panStart = null;
    this._panMoved = false;
    this._activeTab = "overview";
  }
  static getLayoutOptions() {
    return { grid_columns: 4, grid_rows: 3, grid_min_columns: 2, grid_min_rows: 2 };
  }
  static getConfigElement() {
    return document.createElement("unifi-network-map-editor");
  }
  static getStubConfig() {
    return { entry_id: "", theme: "dark" };
  }
  setConfig(config) {
    this._config = this._normalizeConfig(config);
    this._render();
  }
  _normalizeConfig(config) {
    if (config.entry_id) {
      const theme = config.theme ?? "dark";
      const themeSuffix = `?theme=${theme}`;
      return {
        entry_id: config.entry_id,
        theme,
        svg_url: `/api/${DOMAIN}/${config.entry_id}/svg${themeSuffix}`,
        data_url: `/api/${DOMAIN}/${config.entry_id}/payload`
      };
    }
    return config;
  }
  set hass(hass) {
    this._hass = hass;
    this._render();
  }
  connectedCallback() {
    this._render();
    this._startStatusPolling();
  }
  disconnectedCallback() {
    this._stopStatusPolling();
  }
  _startStatusPolling() {
    this._stopStatusPolling();
    this._statusPollInterval = window.setInterval(() => {
      this._refreshPayload();
    }, 3e4);
  }
  _stopStatusPolling() {
    if (this._statusPollInterval !== void 0) {
      window.clearInterval(this._statusPollInterval);
      this._statusPollInterval = void 0;
    }
  }
  _refreshPayload() {
    this._lastDataUrl = void 0;
    this._loadPayload();
  }
  _getAuthToken() {
    return this._hass?.auth?.data?.access_token;
  }
  async _fetchWithAuth(url, signal, parseResponse) {
    const token = this._getAuthToken();
    if (!token) {
      return { error: "Missing auth token" };
    }
    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal
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
  _render() {
    if (!this._config) {
      this.innerHTML = `
        <ha-card>
          <div style="padding:16px;">Missing configuration</div>
        </ha-card>
      `;
      return;
    }
    if (!this._config.svg_url) {
      this.innerHTML = `
        <ha-card>
          <div style="padding:16px;">Select a UniFi Network Map instance in the card settings.</div>
        </ha-card>
      `;
      return;
    }
    const token = this._getAuthToken();
    if (token && this._error === "Missing auth token") {
      this._error = void 0;
    }
    const body = this._error ? `<div style="padding:16px;color:#b00020;">${escapeHtml(this._error)}</div>` : this._svgContent ? this._renderLayout() : `<div style="padding:16px;">Loading map...</div>`;
    const theme = this._config.theme ?? "dark";
    this.innerHTML = `
      <ha-card data-theme="${theme}">
        ${body}
      </ha-card>
    `;
    if (!token && this._error === "Missing auth token") {
      return;
    }
    this._ensureStyles();
    this._loadSvg();
    this._loadPayload();
    this._wireInteractions();
  }
  async _loadSvg() {
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
    const result = await this._fetchWithAuth(
      currentUrl,
      this._svgAbortController.signal,
      (r) => r.text()
    );
    if ("aborted" in result) {
      return;
    }
    if ("error" in result) {
      this._error = `Failed to load SVG (${result.error})`;
    } else {
      this._svgContent = result.data;
      this._error = void 0;
    }
    this._lastSvgUrl = currentUrl;
    this._loading = false;
    this._render();
  }
  async _loadPayload() {
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
    const result = await this._fetchWithAuth(
      currentUrl,
      this._payloadAbortController.signal,
      (r) => r.json()
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
  _renderLayout() {
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
  _renderPanelContent() {
    if (!this._selectedNode) {
      return this._renderMapOverview();
    }
    return this._renderNodePanel(this._selectedNode);
  }
  _renderMapOverview() {
    if (!this._payload) {
      return `
        <div class="panel-empty">
          <div class="panel-empty__icon">\u{1F4E1}</div>
          <div class="panel-empty__text">Loading network data...</div>
        </div>
      `;
    }
    const nodes = Object.keys(this._payload.node_types ?? {});
    const edges = this._payload.edges ?? [];
    const nodeTypes = this._payload.node_types ?? {};
    const nodeStatus = this._payload.node_status ?? {};
    const gateways = nodes.filter((n) => nodeTypes[n] === "gateway").length;
    const switches = nodes.filter((n) => nodeTypes[n] === "switch").length;
    const aps = nodes.filter((n) => nodeTypes[n] === "ap").length;
    const clients = nodes.filter((n) => nodeTypes[n] === "client").length;
    const other = nodes.length - gateways - switches - aps - clients;
    const statusValues = Object.values(nodeStatus);
    const onlineCount = statusValues.filter((s) => s.state === "online").length;
    const offlineCount = statusValues.filter((s) => s.state === "offline").length;
    const hasStatus = statusValues.length > 0;
    return `
      <div class="panel-header">
        <div class="panel-header__title">Network Overview</div>
      </div>
      <div class="panel-stats-grid">
        <div class="stat-card">
          <div class="stat-card__value">${nodes.length}</div>
          <div class="stat-card__label">Total Nodes</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__value">${edges.length}</div>
          <div class="stat-card__label">Connections</div>
        </div>
      </div>
      ${hasStatus ? `
      <div class="panel-section">
        <div class="panel-section__title">Live Status</div>
        <div class="device-list">
          <div class="device-row"><span class="status-dot status-dot--online"></span><span class="device-row__label">Online</span><span class="device-row__count">${onlineCount}</span></div>
          <div class="device-row"><span class="status-dot status-dot--offline"></span><span class="device-row__label">Offline</span><span class="device-row__count">${offlineCount}</span></div>
        </div>
      </div>
      ` : ""}
      <div class="panel-section">
        <div class="panel-section__title">Device Breakdown</div>
        <div class="device-list">
          ${gateways > 0 ? `<div class="device-row"><span class="device-row__icon">\u{1F310}</span><span class="device-row__label">Gateways</span><span class="device-row__count">${gateways}</span></div>` : ""}
          ${switches > 0 ? `<div class="device-row"><span class="device-row__icon">\u{1F500}</span><span class="device-row__label">Switches</span><span class="device-row__count">${switches}</span></div>` : ""}
          ${aps > 0 ? `<div class="device-row"><span class="device-row__icon">\u{1F4F6}</span><span class="device-row__label">Access Points</span><span class="device-row__count">${aps}</span></div>` : ""}
          ${clients > 0 ? `<div class="device-row"><span class="device-row__icon">\u{1F4BB}</span><span class="device-row__label">Clients</span><span class="device-row__count">${clients}</span></div>` : ""}
          ${other > 0 ? `<div class="device-row"><span class="device-row__icon">\u{1F4E6}</span><span class="device-row__label">Other</span><span class="device-row__count">${other}</span></div>` : ""}
        </div>
      </div>
      <div class="panel-hint">
        <span class="panel-hint__icon">\u{1F4A1}</span>
        Click a node in the map to see details
      </div>
    `;
  }
  _renderNodePanel(name) {
    const safeName = escapeHtml(name);
    if (!this._payload) {
      return `
        <div class="panel-header">
          <button type="button" class="panel-header__back" data-action="back">\u2190</button>
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
        <button type="button" class="panel-header__back" data-action="back">\u2190</button>
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
  _getNodeTypeIcon(nodeType) {
    switch (nodeType) {
      case "gateway":
        return "\u{1F310}";
      case "switch":
        return "\u{1F500}";
      case "ap":
        return "\u{1F4F6}";
      case "client":
        return "\u{1F4BB}";
      default:
        return "\u{1F4E6}";
    }
  }
  _getStatusBadgeHtml(state) {
    const labels = {
      online: "Online",
      offline: "Offline",
      unknown: "Unknown"
    };
    return `<span class="status-badge status-badge--${state}">${labels[state]}</span>`;
  }
  _formatLastChanged(isoString) {
    if (!isoString) return "Unknown";
    try {
      const date = new Date(isoString);
      const now = /* @__PURE__ */ new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 6e4);
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
  _renderTabContent(name) {
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
  _renderOverviewTab(name) {
    const edges = this._payload?.edges ?? [];
    const neighbors = edges.filter((edge) => edge.left === name || edge.right === name).map((edge) => ({
      name: edge.left === name ? edge.right : edge.left,
      label: edge.label,
      wireless: edge.wireless,
      poe: edge.poe
    }));
    const uniqueNeighbors = Array.from(new Map(neighbors.map((n) => [n.name, n])).values());
    const neighborList = uniqueNeighbors.length ? uniqueNeighbors.map(
      (n) => `
            <div class="neighbor-item">
              <span class="neighbor-item__name">${escapeHtml(n.name)}</span>
              <span class="neighbor-item__badges">
                ${n.wireless ? '<span class="badge badge--wireless">WiFi</span>' : ""}
                ${n.poe ? '<span class="badge badge--poe">PoE</span>' : ""}
                ${n.label ? `<span class="badge badge--port">${escapeHtml(n.label)}</span>` : ""}
              </span>
            </div>
          `
    ).join("") : '<div class="panel-empty__text">No connections</div>';
    return `
      <div class="panel-section">
        <div class="panel-section__title">Connected Devices</div>
        <div class="neighbor-list">${neighborList}</div>
      </div>
    `;
  }
  _renderStatsTab(name) {
    const edges = this._payload?.edges ?? [];
    const nodeEdges = edges.filter((edge) => edge.left === name || edge.right === name);
    const wirelessCount = nodeEdges.filter((e) => e.wireless).length;
    const wiredCount = nodeEdges.length - wirelessCount;
    const poeCount = nodeEdges.filter((e) => e.poe).length;
    const mac = this._payload?.client_macs?.[name] ?? this._payload?.device_macs?.[name] ?? null;
    const status = this._payload?.node_status?.[name];
    return `
      ${status ? `
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
      ` : ""}
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
          ${poeCount > 0 ? `<div class="stats-row"><span class="stats-row__label">PoE Powered</span><span class="stats-row__value">${poeCount}</span></div>` : ""}
        </div>
      </div>
      ${mac ? `
        <div class="panel-section">
          <div class="panel-section__title">Device Info</div>
          <div class="info-row">
            <span class="info-row__label">MAC Address</span>
            <code class="info-row__value">${escapeHtml(mac)}</code>
          </div>
        </div>
      ` : ""}
    `;
  }
  _renderActionsTab(name) {
    const entityId = this._payload?.node_entities?.[name] ?? this._payload?.client_entities?.[name] ?? this._payload?.device_entities?.[name];
    const mac = this._payload?.client_macs?.[name] ?? this._payload?.device_macs?.[name] ?? null;
    const safeEntityId = entityId ? escapeHtml(entityId) : "";
    const safeMac = mac ? escapeHtml(mac) : "";
    return `
      <div class="panel-section">
        <div class="panel-section__title">Quick Actions</div>
        <div class="actions-list">
          ${entityId ? `
              <button type="button" class="action-button action-button--primary" data-entity-id="${safeEntityId}">
                <span class="action-button__icon">\u{1F4CA}</span>
                <span class="action-button__text">View Entity Details</span>
              </button>
            ` : `<div class="panel-empty__text">No Home Assistant entity linked</div>`}
          ${mac ? `
              <button type="button" class="action-button" data-action="copy" data-copy-value="${safeMac}">
                <span class="action-button__icon">\u{1F4CB}</span>
                <span class="action-button__text">Copy MAC Address</span>
              </button>
            ` : ""}
        </div>
      </div>
      ${entityId ? `
        <div class="panel-section">
          <div class="panel-section__title">Entity</div>
          <code class="entity-id">${safeEntityId}</code>
        </div>
      ` : ""}
    `;
  }
  _ensureStyles() {
    if (this.querySelector("style[data-unifi-network-map]")) {
      return;
    }
    const style = document.createElement("style");
    style.dataset.unifiNetworkMap = "true";
    style.textContent = `
      unifi-network-map { display: block; height: 100%; }
      unifi-network-map ha-card { display: flex; flex-direction: column; height: 100%; box-sizing: border-box; }
      .unifi-network-map__layout { display: grid; grid-template-columns: minmax(0, 2.5fr) minmax(280px, 1fr); gap: 12px; flex: 1; padding: 12px; }
      .unifi-network-map__viewport { position: relative; overflow: hidden; min-height: 300px; background: linear-gradient(135deg, #0b1016 0%, #111827 100%); border-radius: 12px; touch-action: none; }
      .unifi-network-map__viewport svg { width: 100%; height: auto; display: block; }
      .unifi-network-map__controls { position: absolute; top: 8px; right: 8px; display: flex; gap: 6px; z-index: 3; }
      .unifi-network-map__controls button { background: rgba(15, 23, 42, 0.9); color: #e5e7eb; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 6px 10px; font-size: 12px; cursor: pointer; backdrop-filter: blur(8px); transition: all 0.15s ease; }
      .unifi-network-map__controls button:hover { background: rgba(59, 130, 246, 0.3); border-color: rgba(59, 130, 246, 0.5); }
      .unifi-network-map__viewport svg text, .unifi-network-map__viewport svg g { cursor: pointer; }
      .unifi-network-map__panel { padding: 0; background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%); color: #e5e7eb; border-radius: 12px; font-size: 13px; overflow: hidden; display: flex; flex-direction: column; }
      .unifi-network-map__tooltip { position: fixed; z-index: 2; background: rgba(15, 23, 42, 0.95); color: #fff; padding: 6px 10px; border-radius: 6px; font-size: 12px; pointer-events: none; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(8px); }

      /* Panel Header */
      .panel-header { display: flex; align-items: center; gap: 12px; padding: 16px; background: rgba(0,0,0,0.2); border-bottom: 1px solid rgba(255,255,255,0.05); }
      .panel-header__back { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #94a3b8; padding: 6px 10px; cursor: pointer; font-size: 14px; transition: all 0.15s ease; }
      .panel-header__back:hover { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
      .panel-header__info { flex: 1; min-width: 0; }
      .panel-header__title { font-weight: 600; font-size: 15px; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .panel-header__badge { display: inline-flex; align-items: center; gap: 4px; margin-top: 4px; padding: 2px 8px; background: rgba(59, 130, 246, 0.15); color: #60a5fa; border-radius: 12px; font-size: 11px; text-transform: capitalize; }

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

      /* Panel Header Title Row */
      .panel-header__title-row { display: flex; align-items: center; gap: 8px; }

      /* Stats List */
      .stats-list { display: flex; flex-direction: column; gap: 2px; }
      .stats-row { display: flex; justify-content: space-between; padding: 8px 10px; background: rgba(255,255,255,0.03); border-radius: 6px; }
      .stats-row__label { color: #94a3b8; }
      .stats-row__value { font-weight: 600; color: #e2e8f0; }

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
    `;
    this.appendChild(style);
  }
  _wireInteractions() {
    const viewport = this.querySelector(".unifi-network-map__viewport");
    const svg = viewport?.querySelector("svg");
    const tooltip = viewport?.querySelector(".unifi-network-map__tooltip");
    const panel = this.querySelector(".unifi-network-map__panel");
    if (!viewport || !svg || !tooltip) {
      return;
    }
    this._ensureStyles();
    this._applyTransform(svg);
    this._wireControls(svg);
    viewport.onwheel = (event) => this._onWheel(event, svg);
    viewport.onpointerdown = (event) => this._onPointerDown(event);
    viewport.onpointermove = (event) => this._onPointerMove(event, svg, tooltip);
    viewport.onpointerup = () => this._onPointerUp();
    viewport.onpointerleave = () => {
      this._hoveredNode = void 0;
      this._hideTooltip(tooltip);
    };
    viewport.onclick = (event) => this._onClick(event, tooltip);
    if (panel) {
      panel.onclick = (event) => this._onPanelClick(event);
    }
  }
  _onPanelClick(event) {
    const target = event.target;
    const tab = target.closest("[data-tab]");
    if (tab) {
      event.preventDefault();
      const tabName = tab.getAttribute("data-tab");
      if (tabName && tabName !== this._activeTab) {
        this._activeTab = tabName;
        this._render();
      }
      return;
    }
    const backButton = target.closest('[data-action="back"]');
    if (backButton) {
      event.preventDefault();
      this._selectedNode = void 0;
      this._activeTab = "overview";
      this._render();
      return;
    }
    const copyButton = target.closest('[data-action="copy"]');
    if (copyButton) {
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
      return;
    }
    const entityButton = target.closest("[data-entity-id]");
    if (entityButton) {
      event.preventDefault();
      const entityId = entityButton.getAttribute("data-entity-id");
      if (entityId) {
        this.dispatchEvent(
          new CustomEvent("hass-more-info", {
            bubbles: true,
            composed: true,
            detail: { entityId }
          })
        );
      }
      return;
    }
  }
  _wireControls(svg) {
    const zoomIn = this.querySelector('[data-action="zoom-in"]');
    const zoomOut = this.querySelector('[data-action="zoom-out"]');
    const reset = this.querySelector('[data-action="reset"]');
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
  _onWheel(event, svg) {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -ZOOM_INCREMENT : ZOOM_INCREMENT;
    this._applyZoom(delta, svg);
  }
  _onPointerDown(event) {
    if (this._isControlTarget(event.target)) {
      return;
    }
    this._isPanning = true;
    this._panMoved = false;
    this._panStart = { x: event.clientX - this._panState.x, y: event.clientY - this._panState.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  _onPointerMove(event, svg, tooltip) {
    if (this._isPanning && this._panStart) {
      const nextX = event.clientX - this._panStart.x;
      const nextY = event.clientY - this._panStart.y;
      if (Math.abs(nextX - this._panState.x) > MIN_PAN_MOVEMENT_THRESHOLD || Math.abs(nextY - this._panState.y) > MIN_PAN_MOVEMENT_THRESHOLD) {
        this._panMoved = true;
      }
      this._panState.x = nextX;
      this._panState.y = nextY;
      this._applyTransform(svg);
      return;
    }
    const label = this._resolveNodeName(event);
    if (!label) {
      this._hoveredNode = void 0;
      this._hideTooltip(tooltip);
      return;
    }
    this._hoveredNode = label;
    tooltip.hidden = false;
    tooltip.textContent = label;
    tooltip.style.transform = "none";
    tooltip.style.left = `${event.clientX + TOOLTIP_OFFSET_PX}px`;
    tooltip.style.top = `${event.clientY + TOOLTIP_OFFSET_PX}px`;
  }
  _onPointerUp() {
    this._isPanning = false;
    this._panStart = null;
  }
  _onClick(event, tooltip) {
    if (this._isControlTarget(event.target)) {
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
  _hideTooltip(tooltip) {
    tooltip.hidden = true;
  }
  _applyTransform(svg) {
    const { x, y, scale } = this._panState;
    svg.style.transformOrigin = "0 0";
    svg.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    svg.style.cursor = this._isPanning ? "grabbing" : "grab";
  }
  _resolveNodeName(event) {
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
  _isControlTarget(target) {
    return Boolean(target?.closest(".unifi-network-map__controls"));
  }
  _applyZoom(delta, svg) {
    const nextScale = Math.min(
      MAX_ZOOM_SCALE,
      Math.max(MIN_ZOOM_SCALE, this._panState.scale + delta)
    );
    this._panState.scale = Number(nextScale.toFixed(2));
    this._applyTransform(svg);
  }
  _resetPan(svg) {
    this._panState = { x: 0, y: 0, scale: 1 };
    this._selectedNode = void 0;
    this._applyTransform(svg);
    this._render();
  }
  _inferNodeName(target) {
    if (!target) {
      return null;
    }
    const node = target.closest("[data-node-id]");
    if (node?.getAttribute("data-node-id")) {
      return node.getAttribute("data-node-id")?.trim() ?? null;
    }
    const labelled = target.closest("[aria-label]");
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
    const idHolder = target.closest("[id]");
    if (idHolder?.getAttribute("id")) {
      return idHolder.getAttribute("id")?.trim() ?? null;
    }
    return null;
  }
};
var UnifiNetworkMapEditor = class extends HTMLElement {
  constructor() {
    super(...arguments);
    this._entries = [];
    this._boundOnChange = (event) => this._onChange(event);
  }
  set hass(hass) {
    this._hass = hass;
    this._loadEntries();
  }
  setConfig(config) {
    this._config = config;
    this._render();
  }
  async _loadEntries() {
    if (!this._hass?.callWS) {
      return;
    }
    try {
      const entries = await this._hass.callWS({
        type: "config_entries/get",
        domain: DOMAIN
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
  _render() {
    const noEntries = this._entries.length === 0;
    if (noEntries) {
      this.innerHTML = `
        <div style="padding: 16px;">
          <p style="color: var(--secondary-text-color);">
            No UniFi Network Map integrations found. Please add one first.
          </p>
        </div>
      `;
      this._form = void 0;
      return;
    }
    if (!this._form) {
      this.innerHTML = `
        <div style="padding: 16px;">
          <ha-form></ha-form>
        </div>
      `;
      const form = this.querySelector("ha-form");
      if (!form) {
        return;
      }
      this._form = form;
      this._form.addEventListener("value-changed", this._boundOnChange);
    }
    const entryOptions = this._entries.map((entry) => ({
      label: entry.title,
      value: entry.entry_id
    }));
    this._form.schema = [
      {
        name: "entry_id",
        required: true,
        selector: {
          select: {
            mode: "dropdown",
            options: entryOptions
          }
        },
        label: "UniFi Network Map Instance"
      },
      {
        name: "theme",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { label: "Dark (default)", value: "dark" },
              { label: "Light", value: "light" }
            ]
          }
        },
        label: "Theme"
      }
    ];
    this._form.data = {
      entry_id: this._config?.entry_id ?? "",
      theme: this._config?.theme ?? "dark"
    };
  }
  _onChange(e) {
    const detail = e.detail;
    const entryId = detail.value?.entry_id ?? this._config?.entry_id ?? "";
    const themeValue = detail.value?.theme ?? this._config?.theme ?? "dark";
    const theme = themeValue === "light" ? "light" : "dark";
    if (this._config?.entry_id === entryId && this._config?.theme === theme) {
      return;
    }
    this._updateConfig({ entry_id: entryId, theme });
  }
  _updateConfigEntry(entryId) {
    const selectedTheme = this._config?.theme ?? "dark";
    this._updateConfig({ entry_id: entryId, theme: selectedTheme });
  }
  _updateConfig(update) {
    this._config = {
      ...this._config,
      type: "custom:unifi-network-map",
      entry_id: update.entry_id,
      theme: update.theme
    };
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true
      })
    );
  }
};
customElements.define("unifi-network-map", UnifiNetworkMapCard);
customElements.define("unifi-network-map-editor", UnifiNetworkMapEditor);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "unifi-network-map",
  name: "UniFi Network Map",
  description: "Displays your UniFi network topology as an interactive SVG map"
});
console.info("unifi-network-map card loaded v0.0.2");
