import type { ConfigurableCard } from "./test-helpers";
import { resetTestDom } from "./test-helpers";

const GW = "gw";
const CORE = "sw-core";
const EDGE_SW = "sw-edge";
const AP = "ap1";
const PHONE = "aa:aa:aa:aa:aa:01";
const LAPTOP = "aa:aa:aa:aa:aa:02";

const LINKS: Array<[string, string]> = [
  [GW, CORE],
  [CORE, AP],
  [CORE, EDGE_SW],
  [AP, PHONE],
  [EDGE_SW, LAPTOP],
];

function svg(): string {
  const nodes = [GW, CORE, EDGE_SW, AP, PHONE, LAPTOP]
    .map((id) => `<g data-node-id="${id}"><text>${id}</text></g>`)
    .join("");
  const paths = LINKS.map(
    ([left, right]) => `<path data-edge-left="${left}" data-edge-right="${right}" d="M0 0"></path>`,
  ).join("");
  return `<svg viewBox="0 0 100 100" width="100" height="100">${paths}${nodes}</svg>`;
}

function renderCard(filter: Record<string, unknown>): HTMLElement {
  const element = document.createElement("unifi-network-map") as ConfigurableCard;
  const card = element as unknown as { _svgContent?: string; _payload?: unknown };
  card._svgContent = svg();
  card._payload = {
    edges: LINKS.map(([left, right]) => ({ left, right })),
    node_types: {
      [GW]: "gateway",
      [CORE]: "switch",
      [EDGE_SW]: "switch",
      [AP]: "ap",
      [PHONE]: "phone",
      [LAPTOP]: "client",
    },
    node_vlans: { [PHONE]: 20, [LAPTOP]: 1 },
    node_ssids: { [PHONE]: "MyIoTWiFi" },
    node_status: {
      [CORE]: { entity_id: "binary_sensor.core", state: "online", last_changed: null },
      [EDGE_SW]: { entity_id: "binary_sensor.edge", state: "offline", last_changed: null },
    },
  };
  element.setConfig({ svg_url: "/map.svg", ...filter });
  document.body.appendChild(element);
  return element;
}

function hidden(element: HTMLElement, id: string): boolean {
  const node = element.querySelector(`[data-node-id="${id}"]`) as Element;
  return node.classList.contains("node--filtered");
}

function overviewTotal(element: HTMLElement): string | null {
  return element.querySelector(".panel-stats-compact__value")?.textContent ?? null;
}

function overviewRows(element: HTMLElement): Record<string, string> {
  const rows: Record<string, string> = {};
  for (const row of element.querySelectorAll(".unifi-network-map__panel .device-row")) {
    const label = row.querySelector(".device-row__label")?.textContent?.trim() ?? "";
    rows[label] = row.querySelector(".device-row__count")?.textContent?.trim() ?? "";
  }
  return rows;
}

function filterCount(element: HTMLElement, type: string): string | null {
  const button = element.querySelector(`button[data-filter-type="${type}"]`);
  return button?.querySelector(".filter-button__count")?.textContent ?? null;
}

describe("card vlan_filter / ssid_filter (#321)", () => {
  afterEach(resetTestDom);

  it("shows only the matching network and its path to the gateway", () => {
    const element = renderCard({ vlan_filter: [20] });

    expect([GW, CORE, AP, PHONE].map((id) => hidden(element, id))).toEqual([
      false,
      false,
      false,
      false,
    ]);
    expect(hidden(element, EDGE_SW)).toBe(true);
    expect(hidden(element, LAPTOP)).toBe(true);
  });

  it("hides links to hidden nodes", () => {
    const element = renderCard({ ssid_filter: "MyIoTWiFi" });
    const link = element.querySelector(
      `path[data-edge-left="${EDGE_SW}"][data-edge-right="${LAPTOP}"]`,
    );
    const kept = element.querySelector(`path[data-edge-left="${AP}"][data-edge-right="${PHONE}"]`);

    expect(link?.classList.contains("edge--filtered")).toBe(true);
    expect(kept?.classList.contains("edge--filtered")).toBe(false);
  });

  it("counts only the visible nodes in the filter bar", () => {
    const element = renderCard({ vlan_filter: [20] });

    expect(filterCount(element, "switch")).toBe("1");
    expect(filterCount(element, "client")).toBe("1");
  });

  it("shows the whole site without a network filter", () => {
    const element = renderCard({});

    expect([GW, CORE, EDGE_SW, AP, PHONE, LAPTOP].some((id) => hidden(element, id))).toBe(false);
    expect(filterCount(element, "switch")).toBe("2");
  });

  it("counts only the filtered network in the site overview", () => {
    const element = renderCard({ vlan_filter: [20] });
    const rows = overviewRows(element);

    expect(overviewTotal(element)).toBe("4");
    expect(rows.Switches).toBe("1");
    expect(rows.Clients).toBe("1");
    expect(rows.Online).toBe("1");
    expect(rows.Offline).toBe("0");
  });

  it("counts the whole site in the overview without a filter", () => {
    const element = renderCard({});
    const rows = overviewRows(element);

    expect(overviewTotal(element)).toBe("6");
    expect(rows.Switches).toBe("2");
    expect(rows.Offline).toBe("1");
  });
});
