import type { CardConfig, MapPayload } from "../card/core/types";
import { networkVisibleNodes, parseNetworkFilter } from "../card/interaction/network-filter";

// gateway -> core switch -> { ap1 -> phone (VLAN 20, IoT WiFi), laptop (VLAN 1, wired) }
//                        -> edge switch -> printer (VLAN 1)
const GW = "gw";
const CORE = "sw-core";
const EDGE_SW = "sw-edge";
const AP = "ap1";
const PHONE = "aa:aa:aa:aa:aa:01";
const LAPTOP = "aa:aa:aa:aa:aa:02";
const PRINTER = "aa:aa:aa:aa:aa:03";

const payload = {
  edges: [
    { left: GW, right: CORE },
    { left: CORE, right: AP },
    { left: CORE, right: EDGE_SW },
    { left: AP, right: PHONE, wireless: true },
    { left: CORE, right: LAPTOP },
    { left: EDGE_SW, right: PRINTER },
  ],
  node_types: {
    [GW]: "gateway",
    [CORE]: "switch",
    [EDGE_SW]: "switch",
    [AP]: "ap",
    [PHONE]: "phone",
    [LAPTOP]: "client",
    [PRINTER]: "printer",
    cluster: "client_cluster",
  },
  node_vlans: { [PHONE]: 20, [LAPTOP]: 1, [PRINTER]: 1 },
  node_ssids: { [PHONE]: "MyIoTWiFi" },
} as MapPayload;

function config(extra: Record<string, unknown>): CardConfig {
  return { entry_id: "abc", ...extra } as CardConfig;
}

describe("parseNetworkFilter", () => {
  it("is inactive without vlan_filter or ssid_filter", () => {
    expect(parseNetworkFilter(config({}))).toBeNull();
    expect(parseNetworkFilter(config({ vlan_filter: [], ssid_filter: [] }))).toBeNull();
  });

  it("accepts a single value or a list, and numeric strings for VLANs", () => {
    expect(parseNetworkFilter(config({ vlan_filter: 20 }))).toEqual({
      vlans: new Set([20]),
      ssids: new Set(),
    });
    expect(
      parseNetworkFilter(config({ vlan_filter: ["20", 30], ssid_filter: "MyIoTWiFi" })),
    ).toEqual({
      vlans: new Set([20, 30]),
      ssids: new Set(["MyIoTWiFi"]),
    });
  });

  it("ignores values that are not VLAN IDs or SSID names", () => {
    expect(parseNetworkFilter(config({ vlan_filter: ["iot", 4095.5, -1, null] }))).toBeNull();
    expect(parseNetworkFilter(config({ ssid_filter: [42, "  "] }))).toBeNull();
  });
});

describe("networkVisibleNodes", () => {
  it("keeps matching clients and the infrastructure path to the gateway", () => {
    const visible = networkVisibleNodes(payload, { vlans: new Set([20]), ssids: new Set() });
    expect([...visible].sort()).toEqual([PHONE, AP, GW, CORE].sort());
  });

  it("hides switches and APs with no matching client behind them", () => {
    const visible = networkVisibleNodes(payload, { vlans: new Set([20]), ssids: new Set() });
    expect(visible.has(EDGE_SW)).toBe(false);
    expect(visible.has(LAPTOP)).toBe(false);
  });

  it("matches wired and wireless clients on a VLAN", () => {
    const visible = networkVisibleNodes(payload, { vlans: new Set([1]), ssids: new Set() });
    expect(visible.has(LAPTOP)).toBe(true);
    expect(visible.has(PRINTER)).toBe(true);
    expect(visible.has(EDGE_SW)).toBe(true);
    expect(visible.has(AP)).toBe(false);
  });

  it("matches by SSID", () => {
    const visible = networkVisibleNodes(payload, {
      vlans: new Set(),
      ssids: new Set(["MyIoTWiFi"]),
    });
    expect(visible.has(PHONE)).toBe(true);
    expect(visible.has(LAPTOP)).toBe(false);
  });

  it("matches a client on either the VLAN or the SSID", () => {
    const visible = networkVisibleNodes(payload, {
      vlans: new Set([1]),
      ssids: new Set(["MyIoTWiFi"]),
    });
    expect([PHONE, LAPTOP, PRINTER].every((id) => visible.has(id))).toBe(true);
  });

  it("hides grouped client nodes, which have no per-client network", () => {
    const visible = networkVisibleNodes(payload, { vlans: new Set([1]), ssids: new Set() });
    expect(visible.has("cluster")).toBe(false);
  });

  it("keeps the gateway even when nothing matches", () => {
    const visible = networkVisibleNodes(payload, { vlans: new Set([99]), ssids: new Set() });
    expect([...visible]).toEqual([GW]);
  });
});
