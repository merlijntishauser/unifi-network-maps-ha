import {
  MAX_ZOOM_SCALE,
  MIN_PAN_MOVEMENT_THRESHOLD,
  MIN_ZOOM_SCALE,
  TOOLTIP_OFFSET_PX,
  ZOOM_INCREMENT,
} from "./constants";
import { escapeHtml, sanitizeHtml, sanitizeSvg } from "./sanitize";
import { annotateEdges, renderEdgeTooltip } from "./svg";
import {
  clearNodeSelection,
  findNodeElement,
  highlightSelectedNode,
  inferNodeName,
  markNodeSelected,
  resolveNodeName,
} from "./node";
import { renderEntityModal } from "./entity-modal";
import { renderPanelContent, renderTabContent } from "./panel";
import { parseContextMenuAction, renderContextMenu } from "./context-menu";
import { fetchWithAuth } from "./auth";
import { showToast } from "./feedback";
import { loadPayload, loadSvg } from "./data";
import { normalizeConfig, startPolling, stopPolling } from "./state";
import {
  applyTransform,
  applyZoom,
  bindViewportInteractions,
  createDefaultViewportHandlers,
  createDefaultViewportState,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel,
  resetPan,
} from "./viewport";
import { CARD_STYLES, GLOBAL_STYLES } from "./styles";
import type { CardConfig, ContextMenuState, Edge, Hass, MapPayload } from "./types";

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
    this._config = normalizeConfig(config);
    this._render();
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
    this._statusPollInterval = startPolling(this._statusPollInterval, 30000, () => {
      this._refreshPayload();
    });
  }

  private _stopStatusPolling() {
    this._statusPollInterval = stopPolling(this._statusPollInterval);
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
  private _viewportState = createDefaultViewportState();
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
  get _viewTransform() {
    return this._viewportState.viewTransform;
  }

  set _viewTransform(value: { x: number; y: number; scale: number }) {
    this._viewportState.viewTransform = value;
  }

  get _isPanning() {
    return this._viewportState.isPanning;
  }

  set _isPanning(value: boolean) {
    this._viewportState.isPanning = value;
  }

  get _panStart() {
    return this._viewportState.panStart;
  }

  set _panStart(value: { x: number; y: number } | null) {
    this._viewportState.panStart = value;
  }

  get _panMoved() {
    return this._viewportState.panMoved;
  }

  set _panMoved(value: boolean) {
    this._viewportState.panMoved = value;
  }

  get _activePointers() {
    return this._viewportState.activePointers;
  }

  set _activePointers(value: Map<number, { x: number; y: number }>) {
    this._viewportState.activePointers = value;
  }

  get _pinchStartDistance() {
    return this._viewportState.pinchStartDistance;
  }

  set _pinchStartDistance(value: number | null) {
    this._viewportState.pinchStartDistance = value;
  }

  get _pinchStartScale() {
    return this._viewportState.pinchStartScale;
  }

  set _pinchStartScale(value: number | null) {
    this._viewportState.pinchStartScale = value;
  }

  private _getAuthToken(): string | undefined {
    return this._hass?.auth?.data?.access_token;
  }

  private async _fetchWithAuth<T>(
    url: string,
    signal: AbortSignal,
    parseResponse: (response: Response) => Promise<T>,
  ): Promise<{ data: T } | { error: string } | { aborted: true }> {
    return fetchWithAuth(url, this._getAuthToken(), signal, parseResponse);
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
    const result = await loadSvg(
      this._fetchWithAuth.bind(this),
      currentUrl,
      this._svgAbortController.signal,
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
    const result = await loadPayload<MapPayload>(
      this._fetchWithAuth.bind(this),
      currentUrl,
      this._payloadAbortController.signal,
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
    const options = this._viewportOptions();
    const callbacks = this._viewportCallbacks();
    applyTransform(svg, this._viewportState.viewTransform, this._viewportState.isPanning);
    this._highlightSelectedNode(svg);
    this._annotateEdges(svg);
    this._wireControls(svg);

    bindViewportInteractions({
      viewport,
      svg,
      state: this._viewportState,
      options,
      handlers: createDefaultViewportHandlers(this._payload?.edges),
      callbacks,
      bindings: {
        tooltip,
        controls: viewport.querySelector(".unifi-network-map__controls") as HTMLElement | null,
      },
    });

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
    return renderEntityModal({
      nodeName,
      payload: this._payload,
      theme: this._config?.theme ?? "dark",
      getNodeTypeIcon: (nodeType: string) => this._getNodeTypeIcon(nodeType),
      formatLastChanged: (value: string | null | undefined) => this._formatLastChanged(value),
    });
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
    return renderContextMenu({
      nodeName,
      payload: this._payload,
      theme: this._config?.theme ?? "dark",
      getNodeTypeIcon: (nodeType: string) => this._getNodeTypeIcon(nodeType),
    });
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
      const result = parseContextMenuAction(target);

      if (result && this._contextMenu) {
        event.preventDefault();
        event.stopPropagation();
        this._handleContextMenuAction(result.action, this._contextMenu.nodeName, result.mac);
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
    showToast("MAC address copied!", "success");
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
    showToast(message, "info");
  }

  private _showActionError(message: string): void {
    showToast(message, "error");
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
    const options = this._viewportOptions();
    const callbacks = this._viewportCallbacks();
    if (zoomIn) {
      zoomIn.onclick = (event) => {
        event.preventDefault();
        applyZoom(svg, ZOOM_INCREMENT, this._viewportState, options, callbacks);
      };
    }
    if (zoomOut) {
      zoomOut.onclick = (event) => {
        event.preventDefault();
        applyZoom(svg, -ZOOM_INCREMENT, this._viewportState, options, callbacks);
      };
    }
    if (reset) {
      reset.onclick = (event) => {
        event.preventDefault();
        resetPan(svg, this._viewportState, callbacks);
        this._selectedNode = undefined;
        this._render();
      };
    }
  }

  private _viewportOptions() {
    return {
      minPanMovementThreshold: MIN_PAN_MOVEMENT_THRESHOLD,
      zoomIncrement: ZOOM_INCREMENT,
      minZoomScale: MIN_ZOOM_SCALE,
      maxZoomScale: MAX_ZOOM_SCALE,
      tooltipOffsetPx: TOOLTIP_OFFSET_PX,
    };
  }

  private _viewportCallbacks() {
    return {
      onNodeSelected: (nodeName: string) => {
        this._selectedNode = nodeName;
        this._render();
      },
      onHoverEdge: (edge: Edge | null) => {
        this._hoveredEdge = edge ?? undefined;
      },
      onHoverNode: (nodeName: string | null) => {
        this._hoveredNode = nodeName ?? undefined;
      },
      onOpenContextMenu: (x: number, y: number, nodeName: string) => {
        this._removeContextMenu();
        this._contextMenu = { nodeName, x, y };
        this._showContextMenu();
      },
      onUpdateTransform: (transform: { x: number; y: number; scale: number }) => {
        this._viewportState.viewTransform = transform;
      },
    };
  }

  private _applyTransform(svg: SVGElement) {
    applyTransform(svg, this._viewportState.viewTransform, this._viewportState.isPanning);
  }

  private _applyZoom(delta: number, svg: SVGElement) {
    applyZoom(svg, delta, this._viewportState, this._viewportOptions(), this._viewportCallbacks());
  }

  private _onWheel(event: WheelEvent, svg: SVGElement) {
    onWheel(event, svg, this._viewportState, this._viewportOptions(), this._viewportCallbacks());
  }

  private _onPointerDown(event: PointerEvent) {
    const controls = this.querySelector(".unifi-network-map__controls") as HTMLElement | null;
    onPointerDown(event, this._viewportState, controls);
  }

  private _onPointerMove(event: PointerEvent, svg: SVGElement, tooltip: HTMLElement) {
    onPointerMove(
      event,
      svg,
      this._viewportState,
      this._viewportOptions(),
      createDefaultViewportHandlers(this._payload?.edges),
      this._viewportCallbacks(),
      tooltip,
    );
  }

  private _onPointerUp(event: PointerEvent) {
    onPointerUp(event, this._viewportState);
  }

  private _hideTooltip(tooltip: HTMLElement) {
    tooltip.hidden = true;
    tooltip.classList.remove("unifi-network-map__tooltip--edge");
  }

  private _onClick(event: MouseEvent, tooltip: HTMLElement) {
    if (this._isControlTarget(event.target as Element | null)) {
      return;
    }
    if (this._viewportState.panMoved) {
      return;
    }
    const label = resolveNodeName(event) ?? this._hoveredNode;
    if (!label) {
      return;
    }
    this._selectedNode = label;
    this._hideTooltip(tooltip);
    this._render();
  }

  private _resolveNodeName(event: MouseEvent | PointerEvent): string | null {
    return resolveNodeName(event);
  }

  private _inferNodeName(target: Element | null): string | null {
    return inferNodeName(target);
  }

  private _findNodeElement(svg: SVGElement, nodeName: string): Element | null {
    return findNodeElement(svg, nodeName);
  }

  private _highlightSelectedNode(svg: SVGElement) {
    highlightSelectedNode(svg, this._selectedNode);
  }

  private _clearNodeSelection(svg: SVGElement) {
    clearNodeSelection(svg);
  }

  private _markNodeSelected(element: Element) {
    markNodeSelected(element);
  }

  private _annotateEdges(svg: SVGElement): void {
    if (!this._payload?.edges) return;
    annotateEdges(svg, this._payload.edges);
  }

  private _renderEdgeTooltip(edge: Edge): string {
    return renderEdgeTooltip(edge);
  }

  private _isControlTarget(target: Element | null): boolean {
    return Boolean(target?.closest(".unifi-network-map__controls"));
  }
}
