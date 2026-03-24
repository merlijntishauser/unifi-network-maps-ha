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
    svg_theme?: "unifi" | "unifi-dark" | "minimal" | "minimal-dark" | "classic" | "classic-dark";
    icon_set?: "modern" | "isometric";
  }) => void;
};

export const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

export const makeSvg = (label = "aa:bb:cc:dd:ee:ff") =>
  `<svg viewBox="0 0 100 100" width="100" height="100"><g data-node-id="${label}"><text>${label}</text></g></svg>`;

export const samplePayload = () => ({
  edges: [
    {
      left: "aa:bb:cc:dd:ee:01",
      right: "11:22:33:44:55:66",
      label: "Port 1",
      wireless: false,
      poe: true,
    },
    {
      left: "11:22:33:44:55:66",
      right: "22:33:44:55:66:77",
      label: "Port 2",
      wireless: true,
      poe: false,
    },
  ],
  node_types: {
    "aa:bb:cc:dd:ee:01": "gateway",
    "11:22:33:44:55:66": "switch",
    "22:33:44:55:66:77": "ap",
  },
  node_names: {
    "aa:bb:cc:dd:ee:01": "Gateway",
    "11:22:33:44:55:66": "Switch",
    "22:33:44:55:66:77": "AP",
  },
  node_status: {
    "aa:bb:cc:dd:ee:01": {
      entity_id: "sensor.gateway",
      state: "online",
      last_changed: "2024-01-01T00:00:00Z",
    },
  },
  node_entities: { "aa:bb:cc:dd:ee:01": "sensor.gateway" },
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
