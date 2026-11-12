import type { ConfigEntry, EditorElement } from "./test-helpers";
import { flushPromises, resetTestDom } from "./test-helpers";

type Form = HTMLElement & {
  schema?: Array<{ name: string; label: string; selector: { text?: unknown } }>;
  data?: Record<string, unknown>;
  computeHelper?: (schema: { name: string }) => string | undefined;
};

type CardConfigLike = Record<string, unknown>;

const ENTRIES: ConfigEntry[] = [
  { entry_id: "entry-1", title: "Site 1", domain: "unifi_network_map" },
];

async function renderEditor(config: CardConfigLike) {
  const element = document.createElement("unifi-network-map-editor") as EditorElement;
  element.setConfig(config);
  element.hass = { callWS: jest.fn().mockResolvedValue(ENTRIES) };
  await flushPromises();
  const configs: CardConfigLike[] = [];
  element.addEventListener("config-changed", (event) => {
    const next = (event as CustomEvent<{ config: CardConfigLike }>).detail.config;
    configs.push(next);
    element.setConfig(next); // what Home Assistant does after config-changed
  });
  const form = element.querySelector("ha-form") as Form;
  const type = (value: Record<string, unknown>) =>
    form.dispatchEvent(
      new CustomEvent("value-changed", { detail: { value: { ...form.data, ...value } } }),
    );
  return { form, configs, type };
}

function last(configs: CardConfigLike[]): CardConfigLike | undefined {
  return configs[configs.length - 1];
}

const BASE = { entry_id: "entry-1", theme: "unifi", svg_theme: "unifi", icon_set: "modern" };

describe("card editor network filter fields (#321)", () => {
  afterEach(resetTestDom);

  it("offers VLAN and SSID text fields with helper text", async () => {
    const { form } = await renderEditor(BASE);
    const fields = form.schema?.filter((entry) => entry.name.endsWith("_filter")) ?? [];

    expect(fields.map((entry) => entry.name)).toEqual(["vlan_filter", "ssid_filter"]);
    expect(fields.every((entry) => entry.selector.text !== undefined)).toBe(true);
    expect(fields.map((entry) => entry.label)).toEqual([
      "Only show VLANs (optional)",
      "Only show Wi-Fi networks (optional)",
    ]);
    expect(form.computeHelper?.({ name: "vlan_filter" })).toContain("VLAN IDs");
    expect(form.computeHelper?.({ name: "ssid_filter" })).toContain("SSID names");
    expect(form.computeHelper?.({ name: "theme" })).toBeUndefined();
  });

  it("stores comma-separated input as lists", async () => {
    const { configs, type } = await renderEditor(BASE);

    type({ vlan_filter: "20, 30", ssid_filter: "IoT, Guest WiFi" });

    expect(last(configs)?.vlan_filter).toEqual([20, 30]);
    expect(last(configs)?.ssid_filter).toEqual(["IoT", "Guest WiFi"]);
  });

  it("drops values that are not VLAN IDs", async () => {
    const { configs, type } = await renderEditor(BASE);

    type({ vlan_filter: "20, iot, 5000, 0" });

    expect(last(configs)?.vlan_filter).toEqual([20]);
  });

  it("removes the filter from the config when the field is cleared", async () => {
    const { configs, type } = await renderEditor({
      ...BASE,
      vlan_filter: [20],
      ssid_filter: ["IoT"],
    });

    type({ vlan_filter: "", ssid_filter: "" });

    expect(last(configs)).not.toHaveProperty("vlan_filter");
    expect(last(configs)).not.toHaveProperty("ssid_filter");
  });

  it("keeps what was typed while it still matches, so a trailing comma survives", async () => {
    const { form, type } = await renderEditor(BASE);

    type({ vlan_filter: "20," });

    expect(form.data?.vlan_filter).toBe("20,");
  });

  it("shows filters set in YAML, including a single value", async () => {
    const { form } = await renderEditor({
      ...BASE,
      vlan_filter: 20,
      ssid_filter: ["IoT", "Guest"],
    });

    expect(form.data?.vlan_filter).toBe("20");
    expect(form.data?.ssid_filter).toBe("IoT, Guest");
  });

  it("keeps the filters when another field changes", async () => {
    const { configs, type } = await renderEditor({ ...BASE, vlan_filter: [20] });

    type({ theme: "dark" });

    expect(last(configs)?.theme).toBe("dark");
    expect(last(configs)?.vlan_filter).toEqual([20]);
  });
});
