import type { ConfigurableCard } from "./test-helpers";
import { flushPromises, makeSvg, resetTestDom, samplePayload } from "./test-helpers";

describe("unifi-network-map card panel", () => {
  afterEach(resetTestDom);

  it("renders overview without status section when status is missing", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as { _svgContent?: string; _payload?: unknown };
    card._svgContent = makeSvg("Gateway");
    card._payload = { edges: [], node_types: { Gateway: "gateway" }, node_status: {} };
    element.setConfig({ svg_url: "/map.svg" });
    expect(element.innerHTML).not.toContain("Live Status");
  });

  it("renders overview stats when payload loads", async () => {
    const fetchMock = jest.fn().mockImplementation((url: string) =>
      Promise.resolve({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            url.includes(".json") ? JSON.stringify(samplePayload()) : makeSvg("Gateway"),
          ),
        json: () => Promise.resolve(samplePayload()),
        headers: { get: () => null },
      }),
    );
    (globalThis as { fetch?: typeof fetch }).fetch = fetchMock;
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    element.hass = { auth: { data: { access_token: "token" } } };
    element.setConfig({ svg_url: "/map.svg", data_url: "/map.json" });
    await flushPromises();
    expect(element.innerHTML).toContain("Total Nodes");
  });

  it("formats last changed timestamps", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as { _formatLastChanged: (value: string | null) => string };
    expect(card._formatLastChanged(null)).toBe("Unknown");
    expect(card._formatLastChanged("invalid")).toBe("NaNd ago");
    expect(card._formatLastChanged(new Date().toISOString())).toBe("Just now");
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(card._formatLastChanged(twoHoursAgo)).toContain("h ago");
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(card._formatLastChanged(twoDaysAgo)).toContain("d ago");
  });

  it("shows live status badge in node panel", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _svgContent?: string;
      _payload?: unknown;
      _selection?: { selectedNode?: string };
    };
    card._svgContent = makeSvg("Gateway");
    card._payload = {
      edges: [],
      node_types: { Gateway: "gateway" },
      node_status: { Gateway: { entity_id: "sensor.gateway", state: "offline" } },
    };
    card._selection = { selectedNode: "Gateway" };
    element.setConfig({ svg_url: "/map.svg" });
    expect(element.innerHTML).toContain("Offline");
  });

  it("shows entity modal and dispatches hass-more-info on entity click", () => {
    jest.useFakeTimers();
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _svgContent?: string;
      _payload?: unknown;
      _selection?: { selectedNode?: string };
      _activeTab?: string;
      _onPanelClick: (event: MouseEvent) => void;
    };
    card._svgContent = makeSvg("Gateway");
    card._payload = {
      ...samplePayload(),
      node_entities: { Gateway: "sensor.gateway" },
      related_entities: {
        Gateway: [{ entity_id: "sensor.gateway", domain: "sensor", state: "on" }],
      },
    };
    card._selection = { selectedNode: "Gateway" };
    card._activeTab = "actions";
    element.setConfig({ svg_url: "/map.svg" });

    // Click entity button to show modal
    const entityButton = element.querySelector('[data-entity-id="sensor.gateway"]') as HTMLElement;
    card._onPanelClick({
      target: entityButton,
      preventDefault: () => undefined,
    } as unknown as MouseEvent);

    // Verify modal is shown
    const modal = document.querySelector(".entity-modal-overlay");
    expect(modal).not.toBeNull();
    expect(modal?.textContent).toContain("Device Information");

    // Click entity item in modal to dispatch hass-more-info
    const handler = jest.fn();
    element.addEventListener("hass-more-info", handler);
    const entityItem = document.querySelector(
      '[data-modal-entity-id="sensor.gateway"]',
    ) as HTMLElement;
    entityItem?.click();
    expect(document.querySelector(".entity-modal-overlay")).toBeNull();
    expect(handler).not.toHaveBeenCalled();
    jest.runAllTimers();
    expect(handler).toHaveBeenCalled();
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
      _selection?: { selectedNode?: string };
      _activeTab?: string;
      _onPanelClick: (event: MouseEvent) => void;
    };
    card._payload = samplePayload();
    card._svgContent = makeSvg("Node A");
    card._selection = { selectedNode: "Node A" };
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

  it("clears selection when back button is clicked", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _svgContent?: string;
      _payload?: unknown;
      _selection?: { selectedNode?: string };
      _onPanelClick: (event: MouseEvent) => void;
    };
    card._svgContent = makeSvg("Gateway");
    card._payload = samplePayload();
    card._selection = { selectedNode: "Gateway" };
    element.setConfig({ svg_url: "/map.svg" });
    const backButton = element.querySelector('[data-action="back"]') as HTMLElement;
    card._onPanelClick({
      target: backButton,
      preventDefault: () => undefined,
    } as unknown as MouseEvent);
    expect(card._selection?.selectedNode).toBeUndefined();
    expect(element.innerHTML).toContain("Network Overview");
  });

  it("renders actions tab when no entity is linked", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _svgContent?: string;
      _payload?: unknown;
      _selection?: { selectedNode?: string };
      _activeTab?: string;
    };
    card._svgContent = makeSvg("Node A");
    card._payload = { edges: [], node_types: { "Node A": "client" } };
    card._selection = { selectedNode: "Node A" };
    card._activeTab = "actions";
    element.setConfig({ svg_url: "/map.svg" });
    expect(element.innerHTML).toContain("No Home Assistant entity linked");
  });

  it("renders empty neighbor list when node has no connections", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _svgContent?: string;
      _payload?: unknown;
      _selection?: { selectedNode?: string };
      _activeTab?: string;
    };
    card._svgContent = makeSvg("Gateway");
    card._payload = { edges: [], node_types: { Gateway: "gateway" } };
    card._selection = { selectedNode: "Gateway" };
    card._activeTab = "overview";
    element.setConfig({ svg_url: "/map.svg" });
    expect(element.innerHTML).toContain("No connections");
  });

  it("renders overview neighbor badges for wireless, poe, and label", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _svgContent?: string;
      _payload?: unknown;
      _selection?: { selectedNode?: string };
      _activeTab?: string;
    };
    card._svgContent = makeSvg("Gateway");
    card._payload = {
      edges: [{ left: "Gateway", right: "AP", label: "Port 1", wireless: true, poe: true }],
      node_types: { Gateway: "gateway", AP: "ap" },
      node_status: {},
    };
    card._selection = { selectedNode: "Gateway" };
    card._activeTab = "overview";
    element.setConfig({ svg_url: "/map.svg" });
    expect(element.innerHTML).toContain("WiFi");
    expect(element.innerHTML).toContain("PoE");
    expect(element.innerHTML).toContain("Port 1");
  });

  it("returns default tab content for unknown tab", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _renderTabContent: (name: string) => string;
      _activeTab: "overview" | "stats" | "actions" | "other";
    };
    card._activeTab = "other";
    expect(card._renderTabContent("Node A")).toBe("");
  });

  it("renders node panel fallback when payload is missing", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _svgContent?: string;
      _selection?: { selectedNode?: string };
    };
    card._svgContent = makeSvg("Node A");
    card._selection = { selectedNode: "Node A" };
    element.setConfig({ svg_url: "/map.svg" });
    expect(element.innerHTML).toContain("No data available");
  });

  it("renders stats and device info tab content", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _svgContent?: string;
      _payload?: unknown;
      _selection?: { selectedNode?: string };
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
    card._selection = { selectedNode: "Gateway" };
    card._activeTab = "stats";
    element.setConfig({ svg_url: "/map.svg" });
    expect(element.innerHTML).toContain("Live Status");
    expect(element.innerHTML).toContain("MAC Address");
  });

  it("omits stats live status when status is missing", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _svgContent?: string;
      _payload?: unknown;
      _selection?: { selectedNode?: string };
      _activeTab?: string;
    };
    card._svgContent = makeSvg("Gateway");
    card._payload = {
      edges: [],
      node_types: { Gateway: "gateway" },
      node_status: {},
      device_macs: { Gateway: "aa:bb:cc:dd:ee:ff" },
    };
    card._selection = { selectedNode: "Gateway" };
    card._activeTab = "stats";
    element.setConfig({ svg_url: "/map.svg" });
    expect(element.innerHTML).not.toContain("Live Status</div>");
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

  it("returns node type icons for common types", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as { _getNodeTypeIcon: (type: string) => string };
    expect(card._getNodeTypeIcon("gateway")).toContain("🌐");
    expect(card._getNodeTypeIcon("switch")).toContain("🔀");
    expect(card._getNodeTypeIcon("ap")).toContain("📶");
    expect(card._getNodeTypeIcon("client")).toContain("💻");
    expect(card._getNodeTypeIcon("unknown")).toContain("📦");
  });

  it("switches tabs and renders stats content", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _svgContent?: string;
      _payload?: unknown;
      _selection?: { selectedNode?: string };
      _activeTab?: string;
      _onPanelClick: (event: MouseEvent) => void;
    };
    card._svgContent = makeSvg("Gateway");
    card._payload = samplePayload();
    card._selection = { selectedNode: "Gateway" };
    card._activeTab = "overview";
    element.setConfig({ svg_url: "/map.svg" });
    const statsTab = element.querySelector('[data-tab="stats"]') as HTMLElement;
    card._onPanelClick({
      target: statsTab,
      preventDefault: () => undefined,
    } as unknown as MouseEvent);
    expect(element.innerHTML).toContain("Connection Stats");
  });

  it("keeps entity modal open across hass re-renders", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    const card = element as unknown as {
      _svgContent?: string;
      _payload?: unknown;
      _selection?: { selectedNode?: string };
      _activeTab?: string;
      _showEntityModal: (nodeName: string) => void;
    };
    card._svgContent = makeSvg("Gateway");
    card._payload = {
      ...samplePayload(),
      node_entities: { Gateway: "sensor.gateway" },
      related_entities: {
        Gateway: [{ entity_id: "sensor.gateway", domain: "sensor", state: "on" }],
      },
    };
    card._selection = { selectedNode: "Gateway" };
    card._activeTab = "actions";
    element.setConfig({ svg_url: "/map.svg" });

    card._showEntityModal("Gateway");
    expect(document.querySelector(".entity-modal-overlay")).not.toBeNull();

    element.hass = { auth: { data: { access_token: "token" } } };
    expect(document.querySelector(".entity-modal-overlay")).not.toBeNull();
  });
});
