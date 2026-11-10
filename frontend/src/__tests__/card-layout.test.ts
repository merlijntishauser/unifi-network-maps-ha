import { normalizeConfig } from "../card/core/state";
import type { CardConfig } from "../card/core/types";
import { CARD_STYLES } from "../card/ui/styles";

describe("card layout responds to the card's own width (#315)", () => {
  it("makes ha-card a size container for the layout query", () => {
    expect(CARD_STYLES).toMatch(/unifi-network-map ha-card \{[^}]*container-type: inline-size/);
  });

  it("stacks the panel under the map below 800px of card width", () => {
    expect(CARD_STYLES).toMatch(
      /@container \(max-width: 800px\) \{\s*\.unifi-network-map__layout \{ grid-template-columns: 1fr; \}/,
    );
  });

  it("no longer switches the layout on viewport width", () => {
    expect(CARD_STYLES).not.toContain("@media (max-width: 800px)");
  });
});

describe("normalizeConfig keeps keys it does not own", () => {
  it("passes card_mod and other extra keys through", () => {
    const cardMod = { style: "ha-card { border: none; }" };
    const config = {
      type: "custom:unifi-network-map",
      entry_id: "abc",
      card_mod: cardMod,
    } as CardConfig;

    const normalized = normalizeConfig(config) as CardConfig & { card_mod?: unknown };

    expect(normalized.type).toBe("custom:unifi-network-map");
    expect(normalized.card_mod).toEqual(cardMod);
  });

  it("still derives the endpoint urls from the entry", () => {
    const normalized = normalizeConfig({ entry_id: "abc", svg_url: "/stale.svg" });

    expect(normalized.svg_url).toBe(
      "/api/unifi_network_map/abc/svg?theme=unifi&svg_theme=unifi&icon_set=modern",
    );
    expect(normalized.data_url).toBe("/api/unifi_network_map/abc/payload");
  });
});
