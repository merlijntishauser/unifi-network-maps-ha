import type { ConfigurableCard } from "./test-helpers";
import { flushPromises, makeSvg, resetTestDom } from "./test-helpers";

describe("unifi-network-map card core", () => {
  afterEach(resetTestDom);

  it("clears missing auth error once token is available", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as { _error?: string; _config?: { svg_url?: string } };
    card._error = "Missing auth token";
    card._config = { svg_url: "/map.svg" };
    element.hass = { auth: { data: { access_token: "token" } } };
    element.setConfig({ svg_url: "/map.svg" });
    expect(card._error).toBeUndefined();
  });

  it("sanitizes svg content before rendering", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    (element as unknown as { _svgContent?: string })._svgContent =
      '<svg><script>alert(1)</script><g onload="alert(1)"></g></svg>';
    element.setConfig({ svg_url: "/map.svg" });
    expect(element.innerHTML).toContain("<svg");
    expect(element.innerHTML).not.toContain("<script");
    expect(element.innerHTML).not.toContain("onload");
  });

  it("sanitizes svg without an svg root", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    (element as unknown as { _svgContent?: string })._svgContent = "<div>no svg</div>";
    element.setConfig({ svg_url: "/map.svg" });
    expect(element.innerHTML).not.toContain("<svg");
  });

  it("returns aborted state on fetch abort", async () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _fetchWithAuth: (
        url: string,
        signal: AbortSignal,
        parseResponse: (response: Response) => Promise<string>,
      ) => Promise<{ data: string } | { error: string } | { aborted: true }>;
      _hass?: { auth?: { data?: { access_token?: string } } };
    };
    card._hass = { auth: { data: { access_token: "token" } } };
    const fetchMock = jest.fn().mockRejectedValue(new DOMException("Aborted", "AbortError"));
    (globalThis as { fetch?: typeof fetch }).fetch = fetchMock;
    const controller = new AbortController();
    const result = await card._fetchWithAuth("/map.svg", controller.signal, async () => "");
    expect(result).toEqual({ aborted: true });
  });

  it("escapes error output in the card body", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _config?: { svg_url?: string };
      _error?: string;
      _render: () => void;
    };
    card._config = { svg_url: "/map.svg" };
    card._error = "<bad>";
    card._render();
    expect(element.innerHTML).toContain("&lt;bad&gt;");
  });

  it("starts and stops polling on connect lifecycle", () => {
    jest.useFakeTimers();
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _refreshPayload: () => void;
      _statusPollInterval?: number;
    };
    const refreshSpy = jest.spyOn(card, "_refreshPayload");
    element.connectedCallback?.();
    jest.advanceTimersByTime(30000);
    expect(refreshSpy).toHaveBeenCalled();
    element.disconnectedCallback?.();
    expect(card._statusPollInterval).toBeUndefined();
    jest.useRealTimers();
  });

  it("returns error when fetch throws non-Error", async () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _fetchWithAuth: (
        url: string,
        signal: AbortSignal,
        parseResponse: (response: Response) => Promise<string>,
      ) => Promise<{ error: string }>;
      _hass?: { auth?: { data?: { access_token?: string } } };
    };
    card._hass = { auth: { data: { access_token: "token" } } };
    (globalThis as { fetch?: typeof fetch }).fetch = jest.fn().mockRejectedValue("boom");
    const controller = new AbortController();
    const result = await card._fetchWithAuth("/map.svg", controller.signal, async () => "");
    expect(result).toEqual({ error: "boom" });
  });

  it("handles aborted svg and payload fetches", async () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _config?: { svg_url?: string; data_url?: string };
      _hass?: { auth?: { data?: { access_token?: string } } };
      _fetchWithAuth: () => Promise<{ aborted: true }>;
      _loadSvg: () => Promise<void>;
      _loadPayload: () => Promise<void>;
      _loading: boolean;
      _dataLoading: boolean;
    };
    card._config = { svg_url: "/map.svg", data_url: "/map.json" };
    card._hass = { auth: { data: { access_token: "token" } } };
    card._fetchWithAuth = jest.fn().mockResolvedValue({ aborted: true });
    await card._loadSvg();
    await card._loadPayload();
    expect(card._loading).toBe(true);
    expect(card._dataLoading).toBe(true);
  });

  it("shows configuration prompt when svg_url is missing", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    element.setConfig({ theme: "dark" });
    expect(element.innerHTML).toContain("card-preview.svg");
  });

  it("strips javascript: URLs from svg attributes", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    (element as unknown as { _svgContent?: string })._svgContent =
      '<svg><a href="javascript:alert(1)">bad</a></svg>';
    element.setConfig({ svg_url: "/map.svg" });
    expect(element.innerHTML).not.toContain("javascript:");
  });

  it("loads payload when data_url is provided", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve("<svg></svg>"),
        headers: { get: () => null },
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

  it("resubscribes websocket when entry_id changes", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve("<svg></svg>"),
      json: () => Promise.resolve({ edges: [], node_types: {} }),
      headers: { get: () => null },
    });
    (globalThis as { fetch?: typeof fetch }).fetch = fetchMock;

    const unsubscribeFirst = jest.fn();
    const unsubscribeSecond = jest.fn();
    const subscribeMessage = jest
      .fn()
      .mockResolvedValueOnce(unsubscribeFirst)
      .mockResolvedValueOnce(unsubscribeSecond);

    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    document.body.appendChild(element);
    element.hass = {
      auth: { data: { access_token: "token" } },
      connection: { subscribeMessage },
    } as ConfigurableCard["hass"] & { connection: { subscribeMessage: typeof subscribeMessage } };

    element.setConfig({ entry_id: "entry-1" });
    element.connectedCallback?.();
    await flushPromises();

    element.setConfig({ entry_id: "entry-2" });
    await flushPromises();
    await flushPromises();

    expect(subscribeMessage).toHaveBeenCalledWith(
      expect.any(Function),
      { type: "unifi_network_map/subscribe", entry_id: "entry-1" },
      { resubscribe: true },
    );
    expect(subscribeMessage).toHaveBeenCalledWith(
      expect.any(Function),
      { type: "unifi_network_map/subscribe", entry_id: "entry-2" },
      { resubscribe: true },
    );
    expect(unsubscribeFirst).toHaveBeenCalledTimes(1);
  });

  it("skips payload loading when auth token is missing", async () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _config?: { data_url?: string };
      _hass?: unknown;
      _loadPayload: () => Promise<void>;
      _dataLoading: boolean;
    };
    card._config = { data_url: "/map.json" };
    card._hass = {};
    await card._loadPayload();
    expect(card._dataLoading).toBe(false);
  });

  it("renders a missing config message", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    document.body.appendChild(element);
    element.connectedCallback?.();
    expect(element.innerHTML).toContain("Missing configuration");
  });

  it("reports missing auth token", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    element.setConfig({ svg_url: "/map.svg" });
    element.hass = {};
    expect(element.innerHTML).toContain("Missing auth token");
  });

  it("renders payload error state", async () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _loadPayload: () => Promise<void>;
      _error?: string;
      _svgContent?: string;
      _config?: { svg_url?: string; data_url?: string };
      _hass?: { auth?: { data?: { access_token?: string } } };
    };
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    });
    (globalThis as { fetch?: typeof fetch }).fetch = fetchMock;
    card._hass = { auth: { data: { access_token: "token" } } };
    card._svgContent = makeSvg("Gateway");
    card._config = { svg_url: "/map.svg", data_url: "/map.json" };
    await card._loadPayload();
    expect(card._error).toBe("Failed to load payload (HTTP 500)");
  });

  it("loads the svg with an auth header", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve("<svg></svg>"),
      headers: { get: () => null },
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

  it("renders SVG fetch error state", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve(""),
    });
    (globalThis as { fetch?: typeof fetch }).fetch = fetchMock;
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    element.hass = { auth: { data: { access_token: "token" } } };
    element.setConfig({ svg_url: "/map.svg" });
    await flushPromises();
    expect(element.innerHTML).toContain("Failed to load SVG (HTTP 500)");
  });

  it("exposes layout and editor helpers", () => {
    const cardClass = customElements.get("unifi-network-map") as typeof HTMLElement & {
      getLayoutOptions: () => { grid_columns: number };
      getConfigElement: () => HTMLElement;
      getStubConfig: () => { entry_id: string; theme: string };
    };
    const layout = cardClass.getLayoutOptions();
    const editor = cardClass.getConfigElement();
    const stub = cardClass.getStubConfig();
    expect(layout.grid_columns).toBe(4);
    expect(editor.tagName.toLowerCase()).toBe("unifi-network-map-editor");
    expect(stub.theme).toBe("unifi");
  });

  it("defaults to unifi theme when entry_id config has no theme", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    element.setConfig({ entry_id: "entry-2" });
    const config = (element as unknown as { _config?: { svg_url?: string } })._config;
    expect(config?.svg_url).toBe(
      "/api/unifi_network_map/entry-2/svg?theme=unifi&svg_theme=unifi&icon_set=modern",
    );
  });

  it("normalizes entry_id config into URLs", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    element.setConfig({ entry_id: "entry-1", theme: "light" });
    const config = (element as unknown as { _config?: { svg_url?: string; data_url?: string } })
      ._config;
    expect(config?.svg_url).toBe(
      "/api/unifi_network_map/entry-1/svg?theme=light&svg_theme=unifi&icon_set=modern",
    );
    expect(config?.data_url).toBe("/api/unifi_network_map/entry-1/payload");
  });

  it("returns missing auth error from fetch helper", async () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _fetchWithAuth: (
        url: string,
        signal: AbortSignal,
        parseResponse: (response: Response) => Promise<string>,
      ) => Promise<{ data: string } | { error: string }>;
    };
    const controller = new AbortController();
    const result = await card._fetchWithAuth("/map.svg", controller.signal, async () => "");
    expect(result).toEqual({ error: "Missing auth token" });
  });

  it("sets missing auth error when loading svg without token", async () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _config?: { svg_url?: string };
      _hass?: unknown;
      _loadSvg: () => Promise<void>;
      _error?: string;
    };
    card._config = { svg_url: "/map.svg" };
    card._hass = {};
    await card._loadSvg();
    expect(card._error).toBe("Missing auth token");
  });
});
