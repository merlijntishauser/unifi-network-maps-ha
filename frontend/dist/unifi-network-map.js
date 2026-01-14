// src/unifi-network-map.ts
var UnifiNetworkMapCard = class extends HTMLElement {
  constructor() {
    super(...arguments);
    this._loading = false;
    this._dataLoading = false;
    this._panState = { x: 0, y: 0, scale: 1 };
    this._isPanning = false;
    this._panStart = null;
  }
  setConfig(config) {
    this._config = config;
    this._render();
  }
  set hass(hass) {
    this._hass = hass;
    this._render();
  }
  connectedCallback() {
    this._render();
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
    const token = this._hass?.auth?.data?.access_token;
    if (token && this._error === "Missing auth token") {
      this._error = void 0;
    }
    const body = this._error ? `<div style="padding:16px;color:#b00020;">${this._error}</div>` : this._svgContent ? this._renderLayout() : `<div style="padding:16px;">Loading map...</div>`;
    this.innerHTML = `
      <ha-card>
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
    if (!this._config || !this._hass) {
      return;
    }
    if (this._loading || this._config.svg_url === this._lastSvgUrl) {
      return;
    }
    const token = this._hass.auth?.data?.access_token;
    if (!token) {
      this._error = "Missing auth token";
      this._render();
      return;
    }
    this._loading = true;
    try {
      const response = await fetch(this._config.svg_url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      this._svgContent = await response.text();
      this._error = void 0;
      this._lastSvgUrl = this._config.svg_url;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this._error = `Failed to load SVG (${message})`;
      this._lastSvgUrl = this._config.svg_url;
    } finally {
      this._loading = false;
      this._render();
    }
  }
  async _loadPayload() {
    if (!this._config || !this._config.data_url || !this._hass) {
      return;
    }
    if (this._dataLoading || this._config.data_url === this._lastDataUrl) {
      return;
    }
    const token = this._hass.auth?.data?.access_token;
    if (!token) {
      return;
    }
    this._dataLoading = true;
    try {
      const response = await fetch(this._config.data_url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      this._payload = await response.json();
      this._lastDataUrl = this._config.data_url;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this._error = `Failed to load payload (${message})`;
      this._lastDataUrl = this._config.data_url;
    } finally {
      this._dataLoading = false;
      this._render();
    }
  }
  _renderLayout() {
    return `
      <div class="unifi-network-map__layout">
        <div class="unifi-network-map__viewport">
          ${this._svgContent}
          <div class="unifi-network-map__tooltip" hidden></div>
        </div>
        <div class="unifi-network-map__panel">
          ${this._renderPanelContent()}
        </div>
      </div>
    `;
  }
  _renderPanelContent() {
    if (!this._payload) {
      return `<div>Waiting for device data...</div>`;
    }
    if (!this._selectedNode) {
      return this._renderOverview();
    }
    return this._renderNodeDetails(this._selectedNode);
  }
  _renderOverview() {
    const nodes = Object.keys(this._payload?.node_types ?? {});
    const edges = this._payload?.edges ?? [];
    return `
      <div class="unifi-network-map__panel-title">Map Overview</div>
      <div>Nodes: ${nodes.length}</div>
      <div>Links: ${edges.length}</div>
      <div class="unifi-network-map__panel-hint">Click a node in the map to see details.</div>
    `;
  }
  _renderNodeDetails(name) {
    const nodeType = this._payload?.node_types?.[name] ?? "unknown";
    const edges = this._payload?.edges ?? [];
    const neighbors = edges.filter((edge) => edge.left === name || edge.right === name).map((edge) => edge.left === name ? edge.right : edge.left);
    const uniqueNeighbors = Array.from(new Set(neighbors));
    const list = uniqueNeighbors.length ? `<ul>${uniqueNeighbors.map((item) => `<li>${item}</li>`).join("")}</ul>` : "<div>No linked nodes</div>";
    return `
      <div class="unifi-network-map__panel-title">${name}</div>
      <div>Type: ${nodeType}</div>
      <div class="unifi-network-map__panel-subtitle">Neighbors</div>
      ${list}
    `;
  }
  _ensureStyles() {
    if (this.querySelector("style[data-unifi-network-map]")) {
      return;
    }
    const style = document.createElement("style");
    style.dataset.unifiNetworkMap = "true";
    style.textContent = `
      .unifi-network-map__layout { display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 1fr); gap: 12px; }
      .unifi-network-map__viewport { position: relative; overflow: hidden; min-height: 300px; background: #0b1016; border-radius: 8px; touch-action: none; }
      .unifi-network-map__viewport svg { width: 100%; height: auto; display: block; }
      .unifi-network-map__panel { padding: 12px; background: #111827; color: #e5e7eb; border-radius: 8px; font-size: 14px; }
      .unifi-network-map__panel-title { font-weight: 600; margin-bottom: 8px; }
      .unifi-network-map__panel-subtitle { margin-top: 12px; font-weight: 600; }
      .unifi-network-map__panel-hint { margin-top: 8px; color: #9ca3af; font-size: 12px; }
      .unifi-network-map__tooltip { position: absolute; z-index: 2; background: rgba(0,0,0,0.8); color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 12px; pointer-events: none; }
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
    if (!viewport || !svg || !tooltip) {
      return;
    }
    this._ensureStyles();
    this._applyTransform(svg);
    viewport.onwheel = (event) => this._onWheel(event, svg);
    viewport.onpointerdown = (event) => this._onPointerDown(event);
    viewport.onpointermove = (event) => this._onPointerMove(event, svg, tooltip);
    viewport.onpointerup = () => this._onPointerUp();
    viewport.onpointerleave = () => this._hideTooltip(tooltip);
    viewport.onclick = (event) => this._onClick(event, tooltip);
  }
  _onWheel(event, svg) {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    const nextScale = Math.min(2.5, Math.max(0.5, this._panState.scale + delta));
    this._panState.scale = Number(nextScale.toFixed(2));
    this._applyTransform(svg);
  }
  _onPointerDown(event) {
    this._isPanning = true;
    this._panStart = { x: event.clientX - this._panState.x, y: event.clientY - this._panState.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  _onPointerMove(event, svg, tooltip) {
    if (this._isPanning && this._panStart) {
      this._panState.x = event.clientX - this._panStart.x;
      this._panState.y = event.clientY - this._panStart.y;
      this._applyTransform(svg);
      return;
    }
    const label = this._inferNodeName(event.target);
    if (!label) {
      this._hideTooltip(tooltip);
      return;
    }
    tooltip.hidden = false;
    tooltip.textContent = label;
    tooltip.style.transform = `translate(${event.offsetX + 12}px, ${event.offsetY + 12}px)`;
  }
  _onPointerUp() {
    this._isPanning = false;
    this._panStart = null;
  }
  _onClick(event, tooltip) {
    const label = this._inferNodeName(event.target);
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
  _inferNodeName(target) {
    if (!target) {
      return null;
    }
    const textNode = target.closest("text");
    if (textNode?.textContent) {
      return textNode.textContent.trim();
    }
    const ariaLabel = target.getAttribute("aria-label");
    if (ariaLabel) {
      return ariaLabel.trim();
    }
    const id = target.getAttribute("id");
    if (id) {
      return id.trim();
    }
    return null;
  }
};
customElements.define("unifi-network-map", UnifiNetworkMapCard);
console.info("unifi-network-map card loaded");
