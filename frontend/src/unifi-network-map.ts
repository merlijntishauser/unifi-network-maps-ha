class UnifiNetworkMapCard extends HTMLElement {
  setConfig(config: { svg_url: string; data_url: string }) {
    this._config = config;
  }

  connectedCallback() {
    this.innerHTML = `
      <ha-card>
        <div style="padding:16px;">UniFi Network Map (stub)</div>
      </ha-card>
    `;
  }

  private _config?: { svg_url: string; data_url: string };
}

customElements.define("unifi-network-map", UnifiNetworkMapCard);

console.info("unifi-network-map card loaded");
