import {
  DOMAIN,
  MAX_ZOOM_SCALE,
  MIN_PAN_MOVEMENT_THRESHOLD,
  MIN_ZOOM_SCALE,
  TOOLTIP_OFFSET_PX,
  ZOOM_INCREMENT,
} from "./constants";
import { escapeHtml, sanitizeHtml, sanitizeSvg } from "./sanitize";
import { annotateEdges, findEdgeFromTarget, renderEdgeTooltip } from "./svg";
import { renderPanelContent, renderTabContent } from "./panel";
import { CARD_STYLES, GLOBAL_STYLES } from "./styles";
import type {
  CardConfig,
  ContextMenuState,
  Edge,
  Hass,
  MapPayload,
  Point,
  RelatedEntity,
  ViewTransform,
} from "./types";

export class UnifiNetworkMapCard extends HTMLElement {
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
  private _activePointers: Map<number, Point> = new Map();
  private _pinchStartDistance: number | null = null;
  private _pinchStartScale: number | null = null;
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
    return renderPanelContent(
      {
        payload: this._payload,
        selectedNode: this._selectedNode,
        activeTab: this._activeTab,
      },
      this._panelHelpers(),
    );
  }

  private _renderTabContent(name: string): string {
    return renderTabContent(
      {
        payload: this._payload,
        selectedNode: this._selectedNode,
        activeTab: this._activeTab,
      },
      name,
      this._panelHelpers(),
    );
  }

  private _panelHelpers() {
    return {
      escapeHtml,
      getNodeTypeIcon: (nodeType: string) => this._getNodeTypeIcon(nodeType),
      getStatusBadgeHtml: (state: "online" | "offline" | "unknown") =>
        this._getStatusBadgeHtml(state),
      formatLastChanged: (value: string | null | undefined) => this._formatLastChanged(value),
    };
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

  private _ensureStyles() {
    if (this.querySelector("style[data-unifi-network-map]")) {
      return;
    }
    const style = document.createElement("style");
    style.dataset.unifiNetworkMap = "true";
    style.textContent = CARD_STYLES;
    this.appendChild(style);
    this._ensureGlobalStyles();
  }

  private _ensureGlobalStyles() {
    if (document.head.querySelector("style[data-unifi-network-map-global]")) {
      return;
    }
    const style = document.createElement("style");
    style.dataset.unifiNetworkMapGlobal = "true";
    style.textContent = GLOBAL_STYLES;
    document.head.appendChild(style);
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
    viewport.onpointerup = (event) => this._onPointerUp(event);
    viewport.onpointercancel = (event) => this._onPointerUp(event);
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
    const nodeName = this._resolveNodeName(event) ?? this._hoveredNode;
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
    this._activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);

    if (this._activePointers.size === 2) {
      // Start pinch gesture
      const [p1, p2] = Array.from(this._activePointers.values());
      this._pinchStartDistance = this._getDistance(p1, p2);
      this._pinchStartScale = this._viewTransform.scale;
      this._isPanning = false;
      this._panStart = null;
    } else if (this._activePointers.size === 1) {
      // Single finger pan
      this._isPanning = true;
      this._panMoved = false;
      this._panStart = {
        x: event.clientX - this._viewTransform.x,
        y: event.clientY - this._viewTransform.y,
      };
    }
  }

  private _getDistance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private _getMidpoint(p1: Point, p2: Point): Point {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };
  }

  private _onPointerMove(event: PointerEvent, svg: SVGElement, tooltip: HTMLElement) {
    // Update pointer position in tracking map
    if (this._activePointers.has(event.pointerId)) {
      this._activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }

    // Handle pinch-to-zoom with two fingers
    if (
      this._activePointers.size === 2 &&
      this._pinchStartDistance !== null &&
      this._pinchStartScale !== null
    ) {
      const [p1, p2] = Array.from(this._activePointers.values());
      const currentDistance = this._getDistance(p1, p2);
      const scaleFactor = currentDistance / this._pinchStartDistance;
      const newScale = Math.min(
        MAX_ZOOM_SCALE,
        Math.max(MIN_ZOOM_SCALE, this._pinchStartScale * scaleFactor),
      );
      this._viewTransform.scale = Number(newScale.toFixed(2));
      this._panMoved = true;
      this._applyTransform(svg);
      return;
    }

    // Handle single finger pan
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

    // Handle hover tooltips (only when not actively panning/pinching)
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

  private _onPointerUp(event: PointerEvent) {
    this._activePointers.delete(event.pointerId);

    // Reset pinch state when we drop below 2 pointers
    if (this._activePointers.size < 2) {
      this._pinchStartDistance = null;
      this._pinchStartScale = null;
    }

    // Reset pan state when all pointers are released
    if (this._activePointers.size === 0) {
      this._isPanning = false;
      this._panStart = null;
    }
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
    annotateEdges(svg, this._payload.edges);
  }

  private _findEdgeFromTarget(target: Element | null): Edge | null {
    if (!this._payload?.edges) return null;
    return findEdgeFromTarget(target, this._payload.edges);
  }

  private _renderEdgeTooltip(edge: Edge): string {
    return renderEdgeTooltip(edge);
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
