type Hass = {
  auth?: {
    data?: {
      access_token?: string;
    };
  };
};

type MapPayload = {
  schema_version?: string;
  edges: Array<{
    left: string;
    right: string;
    label?: string | null;
    poe?: boolean | null;
    wireless?: boolean | null;
  }>;
  node_types: Record<string, string>;
  gateways?: string[];
};

class UnifiNetworkMapCard extends HTMLElement {
  setConfig(config: { svg_url: string; data_url?: string }) {
    this._config = config;
    this._render();
  }

  set hass(hass: Hass) {
    this._hass = hass;
    this._render();
  }

  connectedCallback() {
    this._render();
  }

  private _config?: { svg_url: string; data_url?: string };
  private _hass?: Hass;
  private _lastSvgUrl?: string;
  private _lastDataUrl?: string;
  private _svgContent?: string;
  private _payload?: MapPayload;
  private _error?: string;
  private _loading = false;
  private _dataLoading = false;
  private _panState = { x: 0, y: 0, scale: 1 };
  private _isPanning = false;
  private _panStart: { x: number; y: number } | null = null;
  private _panMoved = false;
  private _selectedNode?: string;

  private _render() {
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
      this._error = undefined;
    }

    const body = this._error
      ? `<div style="padding:16px;color:#b00020;">${this._error}</div>`
      : this._svgContent
        ? this._renderLayout()
        : `<div style="padding:16px;">Loading map...</div>`;

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

  private async _loadSvg() {
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
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      this._svgContent = await response.text();
      this._error = undefined;
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

  private async _loadPayload() {
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
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      this._payload = (await response.json()) as MapPayload;
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

  private _renderLayout() {
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

  private _renderPanelContent() {
    if (!this._payload) {
      return `<div>Waiting for device data...</div>`;
    }
    if (!this._selectedNode) {
      return this._renderOverview();
    }
    return this._renderNodeDetails(this._selectedNode);
  }

  private _renderOverview() {
    const nodes = Object.keys(this._payload?.node_types ?? {});
    const edges = this._payload?.edges ?? [];
    return `
      <div class="unifi-network-map__panel-title">Map Overview</div>
      <div>Nodes: ${nodes.length}</div>
      <div>Links: ${edges.length}</div>
      <div class="unifi-network-map__panel-hint">Click a node in the map to see details.</div>
    `;
  }

  private _renderNodeDetails(name: string) {
    const nodeType = this._payload?.node_types?.[name] ?? "unknown";
    const edges = this._payload?.edges ?? [];
    const neighbors = edges
      .filter((edge) => edge.left === name || edge.right === name)
      .map((edge) => (edge.left === name ? edge.right : edge.left));
    const uniqueNeighbors = Array.from(new Set(neighbors));
    const list = uniqueNeighbors.length
      ? `<ul>${uniqueNeighbors.map((item) => `<li>${item}</li>`).join("")}</ul>`
      : "<div>No linked nodes</div>";
    return `
      <div class="unifi-network-map__panel-title">${name}</div>
      <div>Type: ${nodeType}</div>
      <div class="unifi-network-map__panel-subtitle">Neighbors</div>
      ${list}
    `;
  }

  private _ensureStyles() {
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
      .unifi-network-map__tooltip { position: absolute; z-index: 2; background: rgba(0,0,0,0.8); color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 12px; pointer-events: none; }
      @media (max-width: 800px) {
        .unifi-network-map__layout { grid-template-columns: 1fr; }
      }
    `;
    this.appendChild(style);
  }

  private _wireInteractions() {
    const viewport = this.querySelector(".unifi-network-map__viewport") as HTMLElement | null;
    const svg = viewport?.querySelector("svg") as SVGElement | null;
    const tooltip = viewport?.querySelector(".unifi-network-map__tooltip") as HTMLElement | null;
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
    viewport.onpointerleave = () => this._hideTooltip(tooltip);
    viewport.onclick = (event) => this._onClick(event, tooltip);
  }

  private _wireControls(svg: SVGElement) {
    const zoomIn = this.querySelector('[data-action="zoom-in"]') as HTMLButtonElement | null;
    const zoomOut = this.querySelector('[data-action="zoom-out"]') as HTMLButtonElement | null;
    const reset = this.querySelector('[data-action="reset"]') as HTMLButtonElement | null;
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

  private _onWheel(event: WheelEvent, svg: SVGElement) {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    this._applyZoom(delta, svg);
  }

  private _onPointerDown(event: PointerEvent) {
    if (this._isControlTarget(event.target as Element | null)) {
      return;
    }
    this._isPanning = true;
    this._panMoved = false;
    this._panStart = { x: event.clientX - this._panState.x, y: event.clientY - this._panState.y };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  private _onPointerMove(event: PointerEvent, svg: SVGElement, tooltip: HTMLElement) {
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
    const label = this._inferNodeName(this._resolveEventTarget(event));
    if (!label) {
      this._hideTooltip(tooltip);
      return;
    }
    tooltip.hidden = false;
    tooltip.textContent = label;
    tooltip.style.transform = `translate(${event.offsetX + 12}px, ${event.offsetY + 12}px)`;
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
    const label = this._inferNodeName(this._resolveEventTarget(event));
    if (!label) {
      return;
    }
    this._selectedNode = label;
    this._hideTooltip(tooltip);
    this._render();
  }

  private _hideTooltip(tooltip: HTMLElement) {
    tooltip.hidden = true;
  }

  private _applyTransform(svg: SVGElement) {
    const { x, y, scale } = this._panState;
    svg.style.transformOrigin = "0 0";
    svg.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    svg.style.cursor = this._isPanning ? "grabbing" : "grab";
  }

  private _resolveEventTarget(event: MouseEvent | PointerEvent): Element | null {
    const target = event.target as Element | null;
    if (target && target !== event.currentTarget) {
      return target;
    }
    return document.elementFromPoint(event.clientX, event.clientY);
  }

  private _isControlTarget(target: Element | null): boolean {
    return Boolean(target?.closest(".unifi-network-map__controls"));
  }

  private _applyZoom(delta: number, svg: SVGElement) {
    const nextScale = Math.min(2.5, Math.max(0.5, this._panState.scale + delta));
    this._panState.scale = Number(nextScale.toFixed(2));
    this._applyTransform(svg);
  }

  private _resetPan(svg: SVGElement) {
    this._panState = { x: 0, y: 0, scale: 1 };
    this._applyTransform(svg);
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
}

customElements.define("unifi-network-map", UnifiNetworkMapCard);

console.info("unifi-network-map card loaded");
