import "../unifi-network-map";

export type ConfigurableCard = HTMLElement & {
  setConfig: (config: {
    svg_url?: string;
    data_url?: string;
    entry_id?: string;
    theme?: "dark" | "light" | "unifi" | "unifi-dark";
    card_height?: string | number;
  }) => void;
  connectedCallback?: () => void;
  disconnectedCallback?: () => void;
  hass?: {
    auth?: {
      data?: {
        access_token?: string;
      };
    };
  };
};

export type ConfigEntry = {
  entry_id: string;
  title: string;
  domain: string;
};

export type EditorElement = HTMLElement & {
  hass?: {
    callWS?: <T>(msg: Record<string, unknown>) => Promise<T>;
  };
  setConfig: (config: {
    entry_id?: string;
    theme?: "dark" | "light" | "unifi" | "unifi-dark";
  }) => void;
};

export const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

export const makeSvg = (label = "Node A") =>
  `<svg viewBox="0 0 100 100" width="100" height="100"><g data-node-id="${label}"><text>${label}</text></g></svg>`;

export const samplePayload = () => ({
  edges: [
    { left: "Gateway", right: "Switch", label: "Port 1", wireless: false, poe: true },
    { left: "Switch", right: "AP", label: "Port 2", wireless: true, poe: false },
  ],
  node_types: { Gateway: "gateway", Switch: "switch", AP: "ap" },
  node_status: {
    Gateway: { entity_id: "sensor.gateway", state: "online", last_changed: "2024-01-01T00:00:00Z" },
  },
  client_macs: { "Node A": "aa:bb:cc:dd:ee:ff" },
  device_macs: { Switch: "11:22:33:44:55:66" },
  node_entities: { Gateway: "sensor.gateway" },
});

export const resetTestDom = () => {
  document.body.innerHTML = "";
  delete (globalThis as { fetch?: unknown }).fetch;
  jest.useRealTimers();
};

if (!("CSS" in globalThis)) {
  (globalThis as { CSS?: { escape: (value: string) => string } }).CSS = {
    escape: (value: string) => value.replace(/\\/g, "\\\\").replace(/"/g, '\\"'),
  };
}
