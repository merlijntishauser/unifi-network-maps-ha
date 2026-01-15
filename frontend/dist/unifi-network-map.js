// src/unifi-network-map.ts
var UnifiNetworkMapCard = class extends HTMLElement {
  constructor() {
    super(...arguments);
    this._loading = false;
    this._dataLoading = false;
    this._panState = { x: 0, y: 0, scale: 1 };
    this._isPanning = false;
    this._panStart = null;
    this._panMoved = false;
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
          <div class="unifi-network-map__controls">
            <button type="button" data-action="zoom-in" title="Zoom in">+</button>
            <button type="button" data-action="zoom-out" title="Zoom out">-</button>
            <button type="button" data-action="reset" title="Reset view">Reset</button>
          </div>
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
    if (this._selectedNode) {
      return this._renderNodeDetails(this._selectedNode);
    }
    if (!this._payload) {
      return `<div>Waiting for device data...</div>`;
    }
    return this._renderOverview();
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
    if (!this._payload) {
      return `
        <div class="unifi-network-map__panel-title">${name}</div>
        <div class="unifi-network-map__panel-hint">
          Provide <code>data_url</code> to show node details.
        </div>
      `;
    }
    const nodeType = this._payload.node_types?.[name] ?? "unknown";
    const edges = this._payload.edges ?? [];
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
      .unifi-network-map__controls { position: absolute; top: 8px; right: 8px; display: flex; gap: 6px; z-index: 3; }
      .unifi-network-map__controls button { background: rgba(15, 23, 42, 0.9); color: #e5e7eb; border: 1px solid #1f2937; border-radius: 6px; padding: 4px 8px; font-size: 12px; cursor: pointer; }
      .unifi-network-map__controls button:hover { background: rgba(30, 41, 59, 0.95); }
      .unifi-network-map__viewport svg text, .unifi-network-map__viewport svg g { cursor: pointer; }
      .unifi-network-map__panel { padding: 12px; background: #111827; color: #e5e7eb; border-radius: 8px; font-size: 14px; }
      .unifi-network-map__panel-title { font-weight: 600; margin-bottom: 8px; }
      .unifi-network-map__panel-subtitle { margin-top: 12px; font-weight: 600; }
      .unifi-network-map__panel-hint { margin-top: 8px; color: #9ca3af; font-size: 12px; }
      .unifi-network-map__tooltip { position: fixed; z-index: 2; background: rgba(0,0,0,0.8); color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 12px; pointer-events: none; }
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
  }
  _wireControls(svg) {
    const zoomIn = this.querySelector('[data-action="zoom-in"]');
    const zoomOut = this.querySelector('[data-action="zoom-out"]');
    const reset = this.querySelector('[data-action="reset"]');
    if (zoomIn) {
      zoomIn.onclick = (event) => {
        event.preventDefault();
        this._applyZoom(0.1, svg);
      };
    }
    if (zoomOut) {
      zoomOut.onclick = (event) => {
        event.preventDefault();
        this._applyZoom(-0.1, svg);
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
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
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
      if (Math.abs(nextX - this._panState.x) > 2 || Math.abs(nextY - this._panState.y) > 2) {
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
    tooltip.style.left = `${event.clientX + 12}px`;
    tooltip.style.top = `${event.clientY + 12}px`;
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
    const nextScale = Math.min(4, Math.max(0.5, this._panState.scale + delta));
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
customElements.define("unifi-network-map", UnifiNetworkMapCard);
console.info("unifi-network-map card loaded v0.0.1+verify-2026-01-15-2");
