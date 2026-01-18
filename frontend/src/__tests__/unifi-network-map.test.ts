import "../unifi-network-map";

type ConfigurableCard = HTMLElement & {
  setConfig: (config: {
    svg_url?: string;
    data_url?: string;
    entry_id?: string;
    theme?: "dark" | "light";
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

type ConfigEntry = {
  entry_id: string;
  title: string;
  domain: string;
};

type EditorElement = HTMLElement & {
  hass?: {
    callWS?: <T>(msg: Record<string, unknown>) => Promise<T>;
  };
  setConfig: (config: { entry_id?: string; theme?: "dark" | "light" }) => void;
};

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

const makeSvg = (label = "Node A") =>
  `<svg><g data-node-id="${label}"><text>${label}</text></g></svg>`;

const samplePayload = () => ({
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

if (!("CSS" in globalThis)) {
  (globalThis as { CSS?: { escape: (value: string) => string } }).CSS = {
    escape: (value: string) => value.replace(/"/g, '\\"'),
  };
}

describe("unifi-network-map card", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    delete (globalThis as { fetch?: unknown }).fetch;
    jest.useRealTimers();
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

  it("normalizes entry_id config into URLs", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    element.setConfig({ entry_id: "entry-1", theme: "light" });
    const config = (element as unknown as { _config?: { svg_url?: string; data_url?: string } })
      ._config;
    expect(config?.svg_url).toBe("/api/unifi_network_map/entry-1/svg?theme=light");
    expect(config?.data_url).toBe("/api/unifi_network_map/entry-1/payload");
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

  it("renders overview stats when payload loads", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(makeSvg("Gateway")),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(samplePayload()),
      });
    (globalThis as { fetch?: typeof fetch }).fetch = fetchMock;
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    element.hass = { auth: { data: { access_token: "token" } } };
    element.setConfig({ svg_url: "/map.svg", data_url: "/map.json" });
    await flushPromises();
    expect(element.innerHTML).toContain("Total Nodes");
    expect(element.innerHTML).toContain("Connections");
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

  it("selects a node on click and shows panel details", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    (element as unknown as { _svgContent?: string })._svgContent = makeSvg("Node A");
    (element as unknown as { _payload?: unknown })._payload = samplePayload();
    element.setConfig({ svg_url: "/map.svg" });
    const tooltip = element.querySelector(".unifi-network-map__tooltip") as HTMLElement;
    const svg = element.querySelector("svg") as SVGElement;
    const handler = element as unknown as {
      _onClick: (event: MouseEvent, tooltip: HTMLElement) => void;
    };
    const target = svg.querySelector("[data-node-id]") as Element;
    handler._onClick(
      {
        composedPath: () => [target],
        clientX: 0,
        clientY: 0,
      } as unknown as MouseEvent,
      tooltip,
    );
    expect(element.innerHTML).toContain("Node A");
  });

  it("renders node panel fallback when payload is missing", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as { _svgContent?: string; _selectedNode?: string };
    card._svgContent = makeSvg("Node A");
    card._selectedNode = "Node A";
    element.setConfig({ svg_url: "/map.svg" });
    expect(element.innerHTML).toContain("No data available");
  });

  it("renders stats and device info tab content", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _svgContent?: string;
      _payload?: unknown;
      _selectedNode?: string;
      _activeTab?: string;
    };
    card._svgContent = makeSvg("Gateway");
    card._payload = {
      edges: [{ left: "Gateway", right: "Switch", wireless: false, poe: true }],
      node_types: { Gateway: "gateway" },
      node_status: {
        Gateway: {
          entity_id: "sensor.gateway",
          state: "online",
          last_changed: new Date().toISOString(),
        },
      },
      device_macs: { Gateway: "aa:bb:cc:dd:ee:ff" },
    };
    card._selectedNode = "Gateway";
    card._activeTab = "stats";
    element.setConfig({ svg_url: "/map.svg" });
    expect(element.innerHTML).toContain("Live Status");
    expect(element.innerHTML).toContain("MAC Address");
  });

  it("renders actions tab when no entity is linked", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _svgContent?: string;
      _payload?: unknown;
      _selectedNode?: string;
      _activeTab?: string;
    };
    card._svgContent = makeSvg("Node A");
    card._payload = { edges: [], node_types: { "Node A": "client" } };
    card._selectedNode = "Node A";
    card._activeTab = "actions";
    element.setConfig({ svg_url: "/map.svg" });
    expect(element.innerHTML).toContain("No Home Assistant entity linked");
  });

  it("clamps zoom levels within bounds", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _applyZoom: (delta: number, svg: SVGElement) => void;
      _panState: { scale: number };
    };
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    card._applyZoom(10, svg);
    expect(card._panState.scale).toBe(4);
    card._applyZoom(-10, svg);
    expect(card._panState.scale).toBe(0.5);
  });

  it("updates pan state on pointer move", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _onPointerDown: (event: PointerEvent) => void;
      _onPointerMove: (event: PointerEvent, svg: SVGElement, tooltip: HTMLElement) => void;
      _panState: { x: number; y: number; scale: number };
      _panMoved: boolean;
    };
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const tooltip = document.createElement("div");
    const viewport = document.createElement("div");
    viewport.setPointerCapture = jest.fn();
    card._onPointerDown({
      clientX: 10,
      clientY: 20,
      pointerId: 1,
      target: viewport,
      currentTarget: viewport,
    } as unknown as PointerEvent);
    card._onPointerMove({ clientX: 30, clientY: 50 } as unknown as PointerEvent, svg, tooltip);
    expect(card._panState.x).toBe(20);
    expect(card._panState.y).toBe(30);
    expect(card._panMoved).toBe(true);
  });

  it("infers node names from aria labels", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _inferNodeName: (target: Element | null) => string | null;
    };
    const node = document.createElement("div");
    node.setAttribute("aria-label", "Switch A");
    expect(card._inferNodeName(node)).toBe("Switch A");
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

  it("handles actions tab copy button", async () => {
    jest.useFakeTimers();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _payload?: unknown;
      _svgContent?: string;
      _selectedNode?: string;
      _activeTab?: string;
      _onPanelClick: (event: MouseEvent) => void;
    };
    card._payload = samplePayload();
    card._svgContent = makeSvg("Node A");
    card._selectedNode = "Node A";
    card._activeTab = "actions";
    element.setConfig({ svg_url: "/map.svg" });
    const copyButton = element.querySelector('[data-action="copy"]') as HTMLElement;
    card._onPanelClick({
      target: copyButton,
      preventDefault: () => undefined,
    } as unknown as MouseEvent);
    await Promise.resolve();
    expect(copyButton.textContent).toContain("Copied!");
    jest.advanceTimersByTime(1500);
    expect(copyButton.textContent).toContain("Copy MAC Address");
    jest.useRealTimers();
  });

  it("renders overview status section when status data exists", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as { _svgContent?: string; _payload?: unknown };
    card._svgContent = makeSvg("Gateway");
    card._payload = {
      edges: [],
      node_types: { Gateway: "gateway" },
      node_status: { Gateway: { entity_id: "sensor.gateway", state: "online" } },
    };
    element.setConfig({ svg_url: "/map.svg" });
    expect(element.innerHTML).toContain("Live Status");
  });

  it("renders overview device breakdown including other types", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as { _svgContent?: string; _payload?: unknown };
    card._svgContent = makeSvg("Unknown");
    card._payload = {
      edges: [],
      node_types: { Unknown: "printer" },
      node_status: {},
    };
    element.setConfig({ svg_url: "/map.svg" });
    expect(element.innerHTML).toContain("Other");
  });

  it("switches tabs and renders stats content", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _svgContent?: string;
      _payload?: unknown;
      _selectedNode?: string;
      _activeTab?: string;
      _onPanelClick: (event: MouseEvent) => void;
    };
    card._svgContent = makeSvg("Gateway");
    card._payload = samplePayload();
    card._selectedNode = "Gateway";
    card._activeTab = "overview";
    element.setConfig({ svg_url: "/map.svg" });
    const statsTab = element.querySelector('[data-tab="stats"]') as HTMLElement;
    card._onPanelClick({
      target: statsTab,
      preventDefault: () => undefined,
    } as unknown as MouseEvent);
    expect(element.innerHTML).toContain("Connection Stats");
  });

  it("clears selection when back button is clicked", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _svgContent?: string;
      _payload?: unknown;
      _selectedNode?: string;
      _onPanelClick: (event: MouseEvent) => void;
    };
    card._svgContent = makeSvg("Gateway");
    card._payload = samplePayload();
    card._selectedNode = "Gateway";
    element.setConfig({ svg_url: "/map.svg" });
    const backButton = element.querySelector('[data-action="back"]') as HTMLElement;
    card._onPanelClick({
      target: backButton,
      preventDefault: () => undefined,
    } as unknown as MouseEvent);
    expect((card as { _selectedNode?: string })._selectedNode).toBeUndefined();
    expect(element.innerHTML).toContain("Network Overview");
  });

  it("dispatches hass-more-info event for entity button", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _svgContent?: string;
      _payload?: unknown;
      _selectedNode?: string;
      _activeTab?: string;
      _onPanelClick: (event: MouseEvent) => void;
    };
    card._svgContent = makeSvg("Gateway");
    card._payload = { ...samplePayload(), node_entities: { Gateway: "sensor.gateway" } };
    card._selectedNode = "Gateway";
    card._activeTab = "actions";
    element.setConfig({ svg_url: "/map.svg" });
    const handler = jest.fn();
    element.addEventListener("hass-more-info", handler);
    const entityButton = element.querySelector('[data-entity-id="sensor.gateway"]') as HTMLElement;
    card._onPanelClick({
      target: entityButton,
      preventDefault: () => undefined,
    } as unknown as MouseEvent);
    expect(handler).toHaveBeenCalled();
  });

  it("formats last changed timestamps", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as { _formatLastChanged: (value: string | null) => string };
    expect(card._formatLastChanged(null)).toBe("Unknown");
    expect(card._formatLastChanged("invalid")).toBe("NaNd ago");
    expect(card._formatLastChanged(new Date().toISOString())).toBe("Just now");
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
    expect(stub.theme).toBe("dark");
  });

  it("shows configuration prompt when svg_url is missing", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    element.setConfig({ theme: "dark" });
    expect(element.innerHTML).toContain("Select a UniFi Network Map instance");
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

  it("renders overview without status section when status is missing", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as { _svgContent?: string; _payload?: unknown };
    card._svgContent = makeSvg("Gateway");
    card._payload = { edges: [], node_types: { Gateway: "gateway" }, node_status: {} };
    element.setConfig({ svg_url: "/map.svg" });
    expect(element.innerHTML).not.toContain("Live Status");
  });

  it("renders empty neighbor list when node has no connections", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _svgContent?: string;
      _payload?: unknown;
      _selectedNode?: string;
      _activeTab?: string;
    };
    card._svgContent = makeSvg("Gateway");
    card._payload = { edges: [], node_types: { Gateway: "gateway" } };
    card._selectedNode = "Gateway";
    card._activeTab = "overview";
    element.setConfig({ svg_url: "/map.svg" });
    expect(element.innerHTML).toContain("No connections");
  });

  it("resolves node name from title element in svg", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as { _resolveNodeName: (event: MouseEvent) => string | null };
    const title = document.createElement("title");
    title.textContent = "Core Switch";
    const group = document.createElement("g");
    group.appendChild(title);
    const event = {
      composedPath: () => [title],
      clientX: 0,
      clientY: 0,
    } as unknown as MouseEvent;
    expect(card._resolveNodeName(event)).toBe("Core Switch");
  });

  it("marks selected elements on highlight", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _highlightSelectedNode: (svg: SVGElement) => void;
      _selectedNode?: string;
    };
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const node = document.createElementNS("http://www.w3.org/2000/svg", "g");
    node.setAttribute("data-node-id", "Node A");
    svg.appendChild(node);
    card._selectedNode = "Node A";
    card._highlightSelectedNode(svg);
    expect(node.getAttribute("data-selected")).toBe("true");
  });

  it("removes selection markers when clearing selection", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as { _clearNodeSelection: (svg: SVGElement) => void };
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("data-selected", "true");
    group.classList.add("node--selected");
    svg.appendChild(group);
    card._clearNodeSelection(svg);
    expect(group.hasAttribute("data-selected")).toBe(false);
    expect(group.classList.contains("node--selected")).toBe(false);
  });

  it("shows tooltip on hover when not panning", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _onPointerMove: (event: PointerEvent, svg: SVGElement, tooltip: HTMLElement) => void;
    };
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const tooltip = document.createElement("div");
    const node = document.createElement("div");
    node.setAttribute("data-node-id", "Hover Node");
    card._onPointerMove(
      {
        composedPath: () => [node],
        clientX: 10,
        clientY: 20,
      } as unknown as PointerEvent,
      svg,
      tooltip,
    );
    expect(tooltip.hidden).toBe(false);
    expect(tooltip.textContent).toBe("Hover Node");
  });

  it("ignores clicks while panning or on controls", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _onClick: (event: MouseEvent, tooltip: HTMLElement) => void;
      _panMoved: boolean;
      _selectedNode?: string;
    };
    const tooltip = document.createElement("div");
    const controls = document.createElement("div");
    controls.classList.add("unifi-network-map__controls");
    card._panMoved = true;
    card._onClick(
      { target: document.createElement("div"), composedPath: () => [] } as unknown as MouseEvent,
      tooltip,
    );
    card._panMoved = false;
    card._onClick({ target: controls, composedPath: () => [] } as unknown as MouseEvent, tooltip);
    expect(card._selectedNode).toBeUndefined();
  });

  it("wires zoom and reset controls", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as { _svgContent?: string; _selectedNode?: string };
    card._svgContent = makeSvg("Gateway");
    card._selectedNode = "Gateway";
    element.setConfig({ svg_url: "/map.svg" });
    const zoomIn = element.querySelector('[data-action="zoom-in"]') as HTMLButtonElement;
    const zoomOut = element.querySelector('[data-action="zoom-out"]') as HTMLButtonElement;
    const reset = element.querySelector('[data-action="reset"]') as HTMLButtonElement;
    const svg = element.querySelector("svg") as SVGElement;
    zoomIn.click();
    zoomOut.click();
    reset.click();
    expect(svg.style.transform).toContain("scale");
    expect((card as { _selectedNode?: string })._selectedNode).toBeUndefined();
  });

  it("applies cursor styles based on pan state", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _applyTransform: (svg: SVGElement) => void;
      _isPanning: boolean;
    };
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    card._isPanning = true;
    card._applyTransform(svg);
    expect(svg.style.cursor).toBe("grabbing");
    card._isPanning = false;
    card._applyTransform(svg);
    expect(svg.style.cursor).toBe("grab");
  });

  it("infers node name from id fallback", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _inferNodeName: (target: Element | null) => string | null;
    };
    const node = document.createElement("div");
    node.setAttribute("id", "switch-1");
    expect(card._inferNodeName(node)).toBe("switch-1");
  });
});

describe("unifi-network-map editor", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("auto-selects when only one entry is available", async () => {
    const element = document.createElement("unifi-network-map-editor") as EditorElement;
    const entries: ConfigEntry[] = [
      { entry_id: "only-entry", title: "UniFi", domain: "unifi_network_map" },
    ];
    const callWS = jest.fn().mockResolvedValue(entries);
    const handler = jest.fn();
    element.addEventListener("config-changed", handler);
    element.hass = { callWS };
    await flushPromises();
    expect(handler).toHaveBeenCalled();
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail;
    expect(detail.config.entry_id).toBe("only-entry");
  });

  it("renders a form schema with entry and theme selectors", async () => {
    const element = document.createElement("unifi-network-map-editor") as EditorElement;
    const entries: ConfigEntry[] = [
      { entry_id: "entry-1", title: "Site 1", domain: "unifi_network_map" },
      { entry_id: "entry-2", title: "Site 2", domain: "unifi_network_map" },
    ];
    element.setConfig({ entry_id: "entry-2", theme: "light" });
    element.hass = { callWS: jest.fn().mockResolvedValue(entries) };
    await flushPromises();
    const form = element.querySelector("ha-form") as HTMLElement & {
      schema?: Array<{ name: string; label: string }>;
      data?: { entry_id?: string; theme?: string };
    };
    expect(form.schema?.[0].label).toBe("UniFi Network Map Instance");
    expect(form.schema?.[1].label).toBe("Theme");
    expect(form.data?.entry_id).toBe("entry-2");
    expect(form.data?.theme).toBe("light");
  });

  it("normalizes theme values on change", async () => {
    const element = document.createElement("unifi-network-map-editor") as EditorElement;
    const callWS = jest
      .fn()
      .mockResolvedValue([{ entry_id: "entry-1", title: "Site", domain: "unifi_network_map" }]);
    element.setConfig({ entry_id: "entry-1", theme: "light" });
    element.hass = { callWS };
    await flushPromises();
    const handler = jest.fn();
    element.addEventListener("config-changed", handler);
    const form = element.querySelector("ha-form") as HTMLElement;
    form.dispatchEvent(
      new CustomEvent("value-changed", {
        detail: { value: { entry_id: "entry-1", theme: "invalid" } },
      }),
    );
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail;
    expect(detail.config.theme).toBe("dark");
  });

  it("renders empty state when entries load fails", async () => {
    const element = document.createElement("unifi-network-map-editor") as EditorElement;
    element.hass = { callWS: jest.fn().mockRejectedValue(new Error("fail")) };
    await flushPromises();
    expect(element.innerHTML).toContain("No UniFi Network Map integrations found");
  });
});
