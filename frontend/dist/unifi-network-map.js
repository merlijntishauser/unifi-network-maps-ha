// src/unifi-network-map.ts
var UnifiNetworkMapCard = class extends HTMLElement {
  constructor() {
    super(...arguments);
    this._loading = false;
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
    const body = this._error ? `<div style="padding:16px;color:#b00020;">${this._error}</div>` : this._svgContent ? `<div class="unifi-network-map__svg">${this._svgContent}</div>` : `<div style="padding:16px;">Loading map...</div>`;
    this.innerHTML = `
      <ha-card>
        ${body}
      </ha-card>
    `;
    if (!token && this._error === "Missing auth token") {
      return;
    }
    this._loadSvg();
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
};
customElements.define("unifi-network-map", UnifiNetworkMapCard);
console.info("unifi-network-map card loaded");
