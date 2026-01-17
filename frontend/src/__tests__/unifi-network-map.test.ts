import "../unifi-network-map";

type ConfigurableCard = HTMLElement & {
  setConfig: (config: { svg_url: string; data_url?: string }) => void;
  connectedCallback?: () => void;
  hass?: {
    auth?: {
      data?: {
        access_token?: string;
      };
    };
  };
};

describe("unifi-network-map card", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    delete (globalThis as { fetch?: unknown }).fetch;
  });

  it("renders a missing config message", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    document.body.appendChild(element);
    element.connectedCallback?.();
    expect(element.innerHTML).toContain("Missing configuration");
  });

  it("loads the svg with an auth header", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve("<svg></svg>"),
    });
    (globalThis as { fetch?: typeof fetch }).fetch = fetchMock;
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    element.hass = { auth: { data: { access_token: "token" } } };
    element.setConfig({ svg_url: "/map.svg" });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fetchMock).toHaveBeenCalledWith(
      "/map.svg",
      expect.objectContaining({
        headers: { Authorization: "Bearer token" },
      }),
    );
    expect(element.innerHTML).toContain("<svg");
  });

  it("loads payload when data_url is provided", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve("<svg></svg>"),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ edges: [], node_types: {} }),
      });
    (globalThis as { fetch?: typeof fetch }).fetch = fetchMock;
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    element.hass = { auth: { data: { access_token: "token" } } };
    element.setConfig({ svg_url: "/map.svg", data_url: "/map.json" });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fetchMock).toHaveBeenCalledWith(
      "/map.json",
      expect.objectContaining({
        headers: { Authorization: "Bearer token" },
      }),
    );
  });

  it("reports missing auth token", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    element.setConfig({ svg_url: "/map.svg" });
    element.hass = {};
    expect(element.innerHTML).toContain("Missing auth token");
  });
});
