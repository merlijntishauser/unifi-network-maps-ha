import {
  MAX_ZOOM_SCALE,
  MIN_PAN_MOVEMENT_THRESHOLD,
  MIN_ZOOM_SCALE,
  TOOLTIP_OFFSET_PX,
  ZOOM_INCREMENT,
} from "../shared/constants";
import { escapeHtml, sanitizeHtml, sanitizeSvg } from "../data/sanitize";
import { annotateEdges, renderEdgeTooltip } from "../data/svg";
import {
  annotateNodeIds,
  clearNodeSelection,
  findNodeElement,
  highlightSelectedNode,
  inferNodeName,
  markNodeSelected,
  removeSvgTitles,
  resolveNodeName,
} from "../interaction/node";
import {
  closeEntityModal,
  createEntityModalController,
  openEntityModal,
} from "../interaction/entity-modal-state";
import { closePortModal, createPortModalController, openPortModal } from "../ui/port-modal";
import { domainIcon, iconMarkup, nodeTypeIcon } from "../ui/icons";
import { renderPanelContent, renderTabContent } from "../ui/panel";
import { renderContextMenu } from "../ui/context-menu";
import { fetchWithAuth } from "../data/auth";
import { showToast } from "../shared/feedback";
import { loadPayload, loadSvg } from "../data/data";
import { subscribeMapUpdates } from "../data/websocket";
import { normalizeConfig, startPolling, stopPolling } from "./state";
import { createLocalize } from "../shared/localize";
import {
  closeContextMenu,
  createContextMenuController,
  openContextMenu,
} from "../interaction/context-menu-state";
import {
  clearSelectedNode,
  createSelectionState,
  handleMapClick,
  selectNode,
  setHoveredEdge,
  setHoveredNode,
} from "../interaction/selection";
import { createFilterState, normalizeDeviceType, toggleFilter } from "../interaction/filter-state";
import { countDeviceTypes } from "../ui/filter-bar";
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
} from "../interaction/viewport";
import { CARD_STYLES, GLOBAL_STYLES } from "../ui/styles";
import { assignVlanColors, generateVlanStyles } from "../ui/vlan-colors";
import type {
  CardConfig,
  DeviceType,
  DeviceTypeFilters,
  Edge,
  Hass,
  MapPayload,
  UnsubscribeFunc,
} from "./types";
import type { IconName } from "../ui/icons";

function normalizeCardHeight(value: CardConfig["card_height"]): string | null {
  if (value === undefined || value === null) return null;
  const raw = typeof value === "number" ? `${value}` : value.trim();
  if (!raw) return null;
  if (/^\d+(\.\d+)?$/.test(raw)) {
    return `${raw}px`;
  }
  return raw;
}

function parseCardHeightPx(value: CardConfig["card_height"]): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "number") return value;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d+(?:\.\d+)?)px$/);
  if (match) {
    return Number.parseFloat(match[1]);
  }
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return Number.parseFloat(trimmed);
  }
  return null;
}

export class UnifiNetworkMapCard extends HTMLElement {
  static getLayoutOptions() {
    return { grid_columns: 4, grid_rows: 3, grid_min_columns: 2, grid_min_rows: 2 };
  }

  getCardSize() {
    const heightPx = parseCardHeightPx(this._config?.card_height);
    if (heightPx) {
      return Math.max(1, Math.ceil(heightPx / 50));
    }
    return 4;
  }

  static getConfigElement() {
    return document.createElement("unifi-network-map-editor");
  }

  static getStubConfig() {
    return { entry_id: "", theme: "unifi" };
  }

  setConfig(config: CardConfig) {
    const prevEntryId = this._config?.entry_id;
    this._config = normalizeConfig(config);
    const nextEntryId = this._config?.entry_id;
    const entryChanged = prevEntryId !== nextEntryId;
    if (entryChanged) {
      this._stopWebSocketSubscription();
      this._stopStatusPolling();
      this._payload = undefined;
      this._lastDataUrl = undefined;
      if (this.isConnected) {
        void this._startWebSocketSubscription();
      }
    }
    this._render();
  }

  set hass(hass: Hass) {
    const hadHass = this._hass !== undefined;
    const prevToken = this._hass?.auth?.data?.access_token;
    const newToken = hass?.auth?.data?.access_token;
    this._hass = hass;
    this._localize = createLocalize(hass);

    // Only re-render when:
    // 1. hass is set for the first time (allows _loadSvg to check auth)
    // 2. auth token actually changed (e.g., undefined -> valid, or token refresh)
    // This prevents DOM replacement on every HA state update
    if (!hadHass || prevToken !== newToken) {
      this._render();
    }
  }

  connectedCallback() {
    this._render();
    this._startWebSocketSubscription();
  }

  disconnectedCallback() {
    this._stopWebSocketSubscription();
    this._stopStatusPolling();
    this._removeEntityModal();
    this._removeContextMenu();
    this._removePortModal();
  }

  private _startStatusPolling() {
    if (this._wsSubscribed) {
      return;
    }
    this._statusPollInterval = startPolling(this._statusPollInterval, 30000, () => {
      this._refreshPayload();
    });
  }

  private _stopStatusPolling() {
    this._statusPollInterval = stopPolling(this._statusPollInterval);
  }

  private async _startWebSocketSubscription() {
    if (!this._config?.entry_id || !this._hass) {
      this._startStatusPolling();
      return;
    }

    const entryId = this._config.entry_id;
    const subscriptionVersion = ++this._wsSubscriptionVersion;
    const result = await subscribeMapUpdates(this._hass, entryId, (payload) => {
      this._payload = payload;
      this._lastDataUrl = this._config?.data_url;
      this._render();
    });

    if (subscriptionVersion !== this._wsSubscriptionVersion || entryId !== this._config?.entry_id) {
      if (result.subscribed) {
        result.unsubscribe();
      }
      return;
    }

    if (result.subscribed) {
      this._wsSubscribed = true;
      this._wsUnsubscribe = result.unsubscribe;
      this._stopStatusPolling();
    } else {
      this._wsSubscribed = false;
      this._startStatusPolling();
    }
  }

  private _stopWebSocketSubscription() {
    this._wsSubscriptionVersion += 1;
    if (this._wsUnsubscribe) {
      this._wsUnsubscribe();
      this._wsUnsubscribe = undefined;
    }
    this._wsSubscribed = false;
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
  private _localize = createLocalize();
  private _showLoadingOverlay = false;
  private _loadingOverlayTimeout?: ReturnType<typeof setTimeout>;
  private _viewportState = createDefaultViewportState();
  private _selection = createSelectionState();
  private _svgAbortController?: AbortController;
  private _payloadAbortController?: AbortController;
  private _activeTab: "overview" | "stats" | "actions" = "overview";
  private _statusPollInterval?: number;
  private _entityModal = createEntityModalController();
  private _contextMenu = createContextMenuController();
  private _portModal = createPortModalController();
  private _filterState: DeviceTypeFilters = createFilterState();
  private _wsUnsubscribe?: UnsubscribeFunc;
  private _wsSubscribed = false;
  private _wsSubscriptionVersion = 0;
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
      this._setCardBody(
        `<div style="padding:16px;">${this._localize("card.error.missing_config")}</div>`,
        theme,
      );
      return;
    }

    if (!this._config.svg_url) {
      this._setCardBody(this._renderPreview(), theme);
      return;
    }

    const token = this._getAuthToken();
    if (token && this._error === "Missing auth token") {
      this._error = undefined;
    }

    const body = this._error
      ? this._renderError()
      : this._svgContent
        ? this._renderLayout()
        : this._renderLoading();

    this._setCardBody(body, theme);

    if (!token && this._error === "Missing auth token") {
      return;
    }
    this._ensureStyles();
    this._wireRetry();
    this._loadSvg();
    this._loadPayload();
    this._wireInteractions();
  }

  private _setCardBody(body: string, theme: string) {
    const card = document.createElement("ha-card");
    card.dataset.theme = theme;
    this._applyCardHeight(card);
    card.innerHTML = sanitizeHtml(body);
    this.replaceChildren(card);
  }

  private _applyCardHeight(card: HTMLElement) {
    if (this.closest("hui-card-edit-mode")) {
      this.style.height = "100%";
      card.style.height = "100%";
      return;
    }
    const height = normalizeCardHeight(this._config?.card_height);
    if (!height) {
      card.style.removeProperty("height");
      return;
    }
    card.style.height = height;
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
    const isRefresh = !!this._svgContent;
    if (!isRefresh) {
      this._showLoadingOverlay = true;
      this._render();
    } else {
      this._scheduleLoadingOverlay();
    }
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
    this._clearLoadingOverlay();
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
    const isRefresh = !!this._payload;
    if (!isRefresh) {
      this._scheduleLoadingOverlay();
    }
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
    this._clearLoadingOverlay();
    this._render();
  }

  private _scheduleLoadingOverlay(): void {
    if (this._loadingOverlayTimeout) return;
    this._loadingOverlayTimeout = setTimeout(() => {
      if (this._isLoading()) {
        this._showLoadingOverlay = true;
        this._render();
      }
    }, 2000);
  }

  private _clearLoadingOverlay(): void {
    if (this._loadingOverlayTimeout) {
      clearTimeout(this._loadingOverlayTimeout);
      this._loadingOverlayTimeout = undefined;
    }
    if (!this._isLoading()) {
      this._showLoadingOverlay = false;
    }
  }

  private _renderPreview(): string {
    return `
      <div class="unifi-network-map__preview">
        <img src="/unifi-network-map/card-preview.svg" alt="${this._localize("card.preview.alt")}" />
      </div>
    `;
  }

  private _renderLoading(): string {
    return `
      <div class="unifi-network-map__loading">
        <div class="unifi-network-map__spinner" role="progressbar" aria-label="${this._localize("card.loading.aria")}"></div>
        <div class="unifi-network-map__loading-text">${this._localize("card.loading.map")}</div>
      </div>
    `;
  }

  private _renderError(): string {
    return `
      <div class="unifi-network-map__error">
        <div class="unifi-network-map__error-text">${escapeHtml(this._formatErrorMessage(this._error))}</div>
        <button type="button" class="unifi-network-map__retry" data-action="retry">${this._localize("card.error.retry")}</button>
      </div>
    `;
  }

  private _formatErrorMessage(error?: string): string {
    if (!error) {
      return this._localize("card.error.unknown");
    }
    if (error === "Missing auth token") {
      return this._localize("card.error.missing_auth");
    }
    const svgMatch = error.match(/^Failed to load SVG \((.+)\)$/);
    if (svgMatch) {
      return this._localize("card.error.load_svg", { error: svgMatch[1] });
    }
    const payloadMatch = error.match(/^Failed to load payload \((.+)\)$/);
    if (payloadMatch) {
      return this._localize("card.error.load_payload", { error: payloadMatch[1] });
    }
    return error;
  }

  private _renderLayout(): string {
    const safeSvg = this._svgContent ? sanitizeSvg(this._svgContent) : "";
    return `
      <div class="unifi-network-map__layout">
        <div class="unifi-network-map__viewport">
          <div class="unifi-network-map__controls">
            <button type="button" data-action="zoom-in" title="${this._localize("card.controls.zoom_in")}">+</button>
            <button type="button" data-action="zoom-out" title="${this._localize("card.controls.zoom_out")}">-</button>
            <button type="button" data-action="reset" title="${this._localize("card.controls.reset_view")}">${this._localize("card.controls.reset")}</button>
          </div>
          ${this._renderLoadingOverlay()}
          ${safeSvg}
          <div class="unifi-network-map__status-layer"></div>
          <div class="unifi-network-map__tooltip" hidden></div>
          <div class="filter-bar-container"></div>
        </div>
        <div class="unifi-network-map__panel">
          ${this._renderPanelContent()}
        </div>
      </div>
    `;
  }

  private _injectFilterBar(viewport: HTMLElement): void {
    const container = viewport.querySelector(".filter-bar-container");
    if (!container) return;

    const nodeTypes = this._payload?.node_types ?? {};
    const counts = countDeviceTypes(nodeTypes);
    const theme = this._config?.theme ?? "dark";

    const labels: Record<DeviceType, string> = {
      gateway: this._localize("panel.device_type.gateways"),
      switch: this._localize("panel.device_type.switches"),
      ap: this._localize("panel.device_type.access_points"),
      client: this._localize("panel.device_type.clients"),
      other: this._localize("panel.device_type.other"),
    };

    const deviceTypes: DeviceType[] = ["gateway", "switch", "ap", "client", "other"];

    const filterBar = document.createElement("div");
    filterBar.className = "filter-bar";

    for (const type of deviceTypes) {
      const count = counts[type] ?? 0;
      const active = this._filterState[type];

      const button = document.createElement("button");
      button.type = "button";
      button.className = `filter-button ${active ? "filter-button--active" : "filter-button--inactive"}`;
      button.dataset.filterType = type;

      // Dynamic tooltip based on current state
      const titleKey = active ? "card.filter.hide" : "card.filter.show";
      button.title = this._localize(titleKey, { label: labels[type] });

      // Use nodeTypeIcon which returns heroicons for unifi themes, emojis otherwise
      const icon = nodeTypeIcon(type, theme);
      button.innerHTML = `<span class="filter-button__icon">${icon}</span><span class="filter-button__count">${count}</span>`;

      button.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._filterState = toggleFilter(this._filterState, type);
        this._updateFilterDisplay();
      };

      filterBar.appendChild(button);
    }

    container.innerHTML = "";
    container.appendChild(filterBar);
  }

  private _renderLoadingOverlay(): string {
    if (!this._showLoadingOverlay || !this._isLoading()) {
      return "";
    }
    return `
      <div class="unifi-network-map__loading-overlay">
        <div class="unifi-network-map__spinner"></div>
        <div class="unifi-network-map__loading-text">${this._localize("card.loading.refresh")}</div>
      </div>
    `;
  }

  private _isLoading(): boolean {
    return this._loading || this._dataLoading;
  }

  private _wireRetry() {
    const retryButton = this.querySelector('[data-action="retry"]') as HTMLButtonElement | null;
    if (!retryButton) return;
    retryButton.onclick = (event) => {
      event.preventDefault();
      this._retryLoad();
    };
  }

  private _retryLoad() {
    this._error = undefined;
    this._lastSvgUrl = undefined;
    this._lastDataUrl = undefined;
    this._svgAbortController?.abort();
    this._payloadAbortController?.abort();
    this._showLoadingOverlay = true;
    this._loadSvg();
    this._loadPayload();
    this._render();
  }

  private _updateSelectionOnly(): void {
    // Update panel content without replacing the entire DOM
    const panel = this.querySelector(".unifi-network-map__panel") as HTMLElement | null;

    if (panel) {
      panel.innerHTML = sanitizeHtml(this._renderPanelContent());
      panel.onclick = (event) => this._onPanelClick(event);
    }
    const svg = this.querySelector(".unifi-network-map__viewport svg") as SVGElement | null;
    if (svg) {
      this._highlightSelectedNode(svg);
    }
  }

  private _renderPanelContent(): string {
    return renderPanelContent(
      {
        payload: this._payload,
        selectedNode: this._selection.selectedNode,
        activeTab: this._activeTab,
      },
      this._panelHelpers(),
    );
  }

  private _renderTabContent(name: string): string {
    return renderTabContent(
      {
        payload: this._payload,
        selectedNode: this._selection.selectedNode,
        activeTab: this._activeTab,
      },
      name,
      this._panelHelpers(),
    );
  }

  private _panelHelpers() {
    const theme = this._config?.theme ?? "dark";
    return {
      escapeHtml,
      getNodeTypeIcon: (nodeType: string) => this._getNodeTypeIcon(nodeType),
      getIcon: (name: IconName) => this._getIcon(name),
      getDomainIcon: (domain: string) => domainIcon(domain, theme),
      getStatusBadgeHtml: (state: "online" | "offline" | "unknown") =>
        this._getStatusBadgeHtml(state),
      formatLastChanged: (value: string | null | undefined) => this._formatLastChanged(value),
      localize: this._localize,
    };
  }

  private _getNodeTypeIcon(nodeType: string): string {
    const theme = this._config?.theme ?? "dark";
    return nodeTypeIcon(nodeType, theme);
  }

  private _getIcon(name: IconName): string {
    const theme = this._config?.theme ?? "dark";
    return iconMarkup(name, theme);
  }

  private _getStatusBadgeHtml(state: "online" | "offline" | "unknown"): string {
    const labels: Record<string, string> = {
      online: this._localize("panel.status.online"),
      offline: this._localize("panel.status.offline"),
      unknown: this._localize("panel.status.unknown"),
    };
    return `<span class="status-badge status-badge--${state}">${labels[state]}</span>`;
  }

  private _formatLastChanged(isoString: string | null | undefined): string {
    if (!isoString) return this._localize("card.time.unknown");
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return this._localize("card.time.just_now");
      if (diffMin < 60) return this._localize("card.time.minutes_ago", { count: diffMin });
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return this._localize("card.time.hours_ago", { count: diffHours });
      const diffDays = Math.floor(diffHours / 24);
      return this._localize("card.time.days_ago", { count: diffDays });
    } catch {
      return this._localize("card.time.unknown");
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

  private _applyVlanColors(): void {
    this._removeVlanStyles();

    if (!this._payload?.node_vlans || !this._payload?.vlan_info) {
      return;
    }

    const theme = this._config?.theme ?? "dark";
    const colorMap = assignVlanColors(this._payload.vlan_info, theme);
    const css = generateVlanStyles(this._payload.node_vlans, colorMap);

    if (!css) {
      return;
    }

    const style = document.createElement("style");
    style.dataset.unifiNetworkMapVlan = "true";
    style.textContent = css;
    this.appendChild(style);
  }

  private _removeVlanStyles(): void {
    const existing = this.querySelector("style[data-unifi-network-map-vlan]");
    if (existing) {
      existing.remove();
    }
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
    annotateNodeIds(svg, Object.keys(this._payload?.node_types ?? {}));
    removeSvgTitles(svg);
    this._highlightSelectedNode(svg);
    this._annotateEdges(svg);
    this._wireControls(svg);

    bindViewportInteractions({
      viewport,
      svg,
      state: this._viewportState,
      options,
      handlers: createDefaultViewportHandlers(
        this._payload?.edges,
        (name) => this._getIcon(name),
        this._localize,
      ),
      callbacks,
      bindings: {
        tooltip,
        controls: viewport.querySelector(".unifi-network-map__controls") as HTMLElement | null,
      },
    });

    this._applyVlanColors();
    this._injectFilterBar(viewport);
    this._applyFilters(svg);

    if (panel) {
      panel.onclick = (event) => this._onPanelClick(event);
    }
  }

  private _updateFilterDisplay(): void {
    const viewport = this.querySelector(".unifi-network-map__viewport") as HTMLElement | null;
    const svg = viewport?.querySelector("svg") as SVGElement | null;

    if (svg) {
      this._applyFilters(svg);
    }

    if (viewport) {
      this._injectFilterBar(viewport);
    }
  }

  private _applyFilters(svg: SVGElement): void {
    const nodeTypes = this._payload?.node_types ?? {};
    const hiddenNodes = new Set<string>();

    for (const [nodeName, nodeType] of Object.entries(nodeTypes)) {
      const normalized = normalizeDeviceType(nodeType);
      const visible = this._filterState[normalized];
      const element = findNodeElement(svg, nodeName);

      if (element) {
        element.classList.toggle("node--filtered", !visible);
        if (!visible) {
          hiddenNodes.add(nodeName);
        }
      }
    }

    this._applyEdgeFilters(svg, hiddenNodes);
  }

  private _applyEdgeFilters(svg: SVGElement, hiddenNodes: Set<string>): void {
    const edgePaths = svg.querySelectorAll("path[data-edge-left][data-edge-right]");
    const filteredEdges = new Set<string>();

    for (const path of edgePaths) {
      const left = path.getAttribute("data-edge-left");
      const right = path.getAttribute("data-edge-right");
      if (!left || !right) continue;

      const shouldHide = hiddenNodes.has(left) || hiddenNodes.has(right);
      path.classList.toggle("edge--filtered", shouldHide);

      if (shouldHide) {
        filteredEdges.add(this._edgeKey(left, right));
      }

      // Also hide the hitbox if present
      const hitbox = path.nextElementSibling;
      if (hitbox?.getAttribute("data-edge-hitbox")) {
        hitbox.classList.toggle("edge--filtered", shouldHide);
      }
    }

    this._applyEdgeLabelFilters(svg, filteredEdges);
  }

  private _edgeKey(left: string, right: string): string {
    return [left.trim(), right.trim()].sort().join("|");
  }

  private _applyEdgeLabelFilters(svg: SVGElement, filteredEdges: Set<string>): void {
    // Filter edge labels that have data-edge-left/right attributes
    const labeledElements = svg.querySelectorAll("[data-edge-left][data-edge-right]:not(path)");
    for (const el of labeledElements) {
      const left = el.getAttribute("data-edge-left");
      const right = el.getAttribute("data-edge-right");
      if (!left || !right) continue;
      const shouldHide = filteredEdges.has(this._edgeKey(left, right));
      el.classList.toggle("edge--filtered", shouldHide);
    }

    // Filter mermaid edge labels (class="edgeLabel")
    const edgeLabels = svg.querySelectorAll(".edgeLabel");
    for (const label of edgeLabels) {
      const left = label.getAttribute("data-edge-left");
      const right = label.getAttribute("data-edge-right");
      if (left && right) {
        const shouldHide = filteredEdges.has(this._edgeKey(left, right));
        label.classList.toggle("edge--filtered", shouldHide);
      }
    }
  }

  private _onPanelClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (this._handleTabClick(target, event)) return;
    if (this._handleBackClick(target, event)) return;
    if (this._handleCopyClick(target, event)) return;
    if (this._handleViewPortsClick(target, event)) return;
    this._handleEntityClick(target, event);
  }

  private _handleViewPortsClick(target: HTMLElement, event: MouseEvent): boolean {
    const button = target.closest('[data-action="view-ports"]') as HTMLElement | null;
    if (!button) return false;

    event.preventDefault();
    const nodeName = button.getAttribute("data-node-name");
    if (nodeName) {
      this._showPortModal(nodeName);
    }
    return true;
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
    clearSelectedNode(this._selection);
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
          textEl.textContent = this._localize("toast.copied");
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
    if (this._selection.selectedNode) {
      this._showEntityModal(this._selection.selectedNode);
    }
    return true;
  }

  private _showEntityModal(nodeName: string): void {
    openEntityModal({
      controller: this._entityModal,
      nodeName,
      payload: this._payload,
      theme: this._config?.theme ?? "dark",
      getNodeTypeIcon: (nodeType: string) => this._getNodeTypeIcon(nodeType),
      formatLastChanged: (value: string | null | undefined) => this._formatLastChanged(value),
      localize: this._localize,
      onEntityDetails: (entityId) => this._openEntityDetails(entityId),
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
    closeEntityModal(this._entityModal);
  }

  private _showContextMenu(): void {
    if (!this._contextMenu.menu) {
      return;
    }

    openContextMenu({
      controller: this._contextMenu,
      menu: this._contextMenu.menu,
      renderMenu: (nodeName) => this._renderContextMenu(nodeName),
      onAction: (action, nodeName, mac, ip) =>
        this._handleContextMenuAction(action, nodeName, mac, ip),
    });
  }

  private _renderContextMenu(nodeName: string): string {
    return renderContextMenu({
      nodeName,
      payload: this._payload,
      theme: this._config?.theme ?? "dark",
      getNodeTypeIcon: (nodeType: string) => this._getNodeTypeIcon(nodeType),
      getIcon: (name) => this._getIcon(name),
      localize: this._localize,
    });
  }

  private _handleContextMenuAction(
    action: string,
    nodeName: string,
    mac: string | null,
    ip: string | null,
  ): void {
    switch (action) {
      case "details":
        this._removeContextMenu();
        this._showEntityModal(nodeName);
        break;

      case "copy-mac":
        if (mac) {
          navigator.clipboard.writeText(mac).then(() => {
            this._showCopyFeedback(this._localize("toast.copy_mac"));
          });
        }
        this._removeContextMenu();
        break;
      case "copy-ip":
        if (ip) {
          navigator.clipboard.writeText(ip).then(() => {
            this._showCopyFeedback(this._localize("toast.copy_ip"));
          });
        }
        this._removeContextMenu();
        break;

      case "restart":
        this._handleRestartDevice(nodeName);
        this._removeContextMenu();
        break;

      case "view-ports":
        this._removeContextMenu();
        this._showPortModal(nodeName);
        break;

      default:
        this._removeContextMenu();
    }
  }

  private _showPortModal(nodeName: string): void {
    openPortModal({
      controller: this._portModal,
      nodeName,
      payload: this._payload,
      theme: this._config?.theme ?? "dark",
      getNodeTypeIcon: (nodeType: string) => this._getNodeTypeIcon(nodeType),
      localize: this._localize,
      onClose: () => this._removePortModal(),
      onDeviceClick: (deviceName) => {
        this._removePortModal();
        selectNode(this._selection, deviceName);
        this._render();
      },
    });
  }

  private _removePortModal(): void {
    closePortModal(this._portModal);
  }

  private _showCopyFeedback(message: string): void {
    showToast(message, "success");
  }

  private _handleRestartDevice(nodeName: string): void {
    const entityId =
      this._payload?.node_entities?.[nodeName] ?? this._payload?.device_entities?.[nodeName];

    if (!entityId) {
      this._showActionError(this._localize("toast.no_entity"));
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

    this._showActionFeedback(this._localize("toast.restart_sent"));
  }

  private _showActionFeedback(message: string): void {
    showToast(message, "info");
  }

  private _showActionError(message: string): void {
    showToast(message, "error");
  }

  private _removeContextMenu(): void {
    closeContextMenu(this._contextMenu);
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
        selectNode(this._selection, nodeName);
        this._updateSelectionOnly();
      },
      onHoverEdge: (edge: Edge | null) => {
        setHoveredEdge(this._selection, edge);
      },
      onHoverNode: (nodeName: string | null) => {
        setHoveredNode(this._selection, nodeName);
      },
      onOpenContextMenu: (x: number, y: number, nodeName: string) => {
        this._removeContextMenu();
        this._contextMenu.menu = { nodeName, x, y };
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
      createDefaultViewportHandlers(
        this._payload?.edges,
        (name) => this._getIcon(name),
        this._localize,
      ),
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
    const selected = handleMapClick({
      event,
      state: this._selection,
      panMoved: this._viewportState.panMoved,
      isControlTarget: (target) => this._isControlTarget(target),
      resolveNodeName: (evt) => resolveNodeName(evt),
    });
    if (!selected) {
      return;
    }
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
    highlightSelectedNode(svg, this._selection.selectedNode);
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
    return renderEdgeTooltip(edge, (name) => this._getIcon(name), this._localize);
  }

  private _isControlTarget(target: Element | null): boolean {
    return Boolean(target?.closest(".unifi-network-map__controls"));
  }
}
