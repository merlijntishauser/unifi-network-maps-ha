import type { ConfigEntry, EditorElement } from "./test-helpers";
import { flushPromises, resetTestDom } from "./test-helpers";

describe("unifi-network-map editor", () => {
  afterEach(resetTestDom);

  it("renders without form when ha-form is unavailable", async () => {
    const element = document.createElement("unifi-network-map-editor") as EditorElement;
    const entries: ConfigEntry[] = [
      { entry_id: "entry-1", title: "Site 1", domain: "unifi_network_map" },
    ];
    element.hass = { callWS: jest.fn().mockResolvedValue(entries) };
    await flushPromises();
    const originalQuerySelector = element.querySelector.bind(element);
    element.querySelector = (() => null) as typeof element.querySelector;
    element.setConfig({ entry_id: "entry-1", theme: "dark" });
    element.querySelector = originalQuerySelector;
    const form = element.querySelector("ha-form");
    expect(form).not.toBeNull();
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

  it("auto-selects the first entry when entries are available", async () => {
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

  it("auto-selects the first entry when multiple entries exist", async () => {
    const element = document.createElement("unifi-network-map-editor") as EditorElement;
    const entries: ConfigEntry[] = [
      { entry_id: "entry-1", title: "Site 1", domain: "unifi_network_map" },
      { entry_id: "entry-2", title: "Site 2", domain: "unifi_network_map" },
    ];
    const callWS = jest.fn().mockResolvedValue(entries);
    const handler = jest.fn();
    element.addEventListener("config-changed", handler);
    element.hass = { callWS };
    await flushPromises();
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail;
    expect(detail.config.entry_id).toBe("entry-1");
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
    expect(detail.config.theme).toBe("unifi");
  });

  it("skips loading entries when hass callWS is missing", async () => {
    const element = document.createElement("unifi-network-map-editor") as EditorElement;
    element.hass = {};
    await flushPromises();
    element.setConfig({ entry_id: "", theme: "dark" });
    expect(element.innerHTML).toContain("No UniFi Network Map integrations found");
  });

  it("keeps config when entry and theme are unchanged", async () => {
    const element = document.createElement("unifi-network-map-editor") as EditorElement;
    element.setConfig({
      entry_id: "entry-1",
      theme: "unifi",
      svg_theme: "unifi",
      icon_set: "modern",
    });
    const callWS = jest
      .fn()
      .mockResolvedValue([{ entry_id: "entry-1", title: "Site", domain: "unifi_network_map" }]);
    element.hass = { callWS };
    await flushPromises();
    const handler = jest.fn();
    element.addEventListener("config-changed", handler);
    const form = element.querySelector("ha-form") as HTMLElement;
    form.dispatchEvent(
      new CustomEvent("value-changed", {
        detail: {
          value: {
            entry_id: "entry-1",
            theme: "unifi",
            svg_theme: "unifi",
            icon_set: "modern",
          },
        },
      }),
    );
    expect(handler).not.toHaveBeenCalled();
  });

  it("renders empty state when entries load fails", async () => {
    const element = document.createElement("unifi-network-map-editor") as EditorElement;
    element.hass = { callWS: jest.fn().mockRejectedValue(new Error("fail")) };
    await flushPromises();
    expect(element.innerHTML).toContain("No UniFi Network Map integrations found");
  });
});
