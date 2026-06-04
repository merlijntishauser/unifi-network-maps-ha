import { INTEGRATION_DOMAIN, getEntitySuggestion } from "../card/core/entity-suggestion";

function makeHass(
  entities: Record<string, { platform?: string; config_entry_id?: string | null }>,
) {
  return { entities };
}

describe("getEntitySuggestion", () => {
  it("returns null when hass is missing", () => {
    expect(getEntitySuggestion(undefined, "sensor.foo")).toBeNull();
  });

  it("returns null when entity is unknown", () => {
    const hass = makeHass({});
    expect(getEntitySuggestion(hass, "sensor.foo")).toBeNull();
  });

  it("returns null when entity belongs to another integration", () => {
    const hass = makeHass({
      "sensor.foo": { platform: "unifi", config_entry_id: "abc" },
    });
    expect(getEntitySuggestion(hass, "sensor.foo")).toBeNull();
  });

  it("returns null when entity has no config entry", () => {
    const hass = makeHass({
      "sensor.foo": { platform: INTEGRATION_DOMAIN, config_entry_id: null },
    });
    expect(getEntitySuggestion(hass, "sensor.foo")).toBeNull();
  });

  it("suggests the card configured with the entity's entry_id", () => {
    const hass = makeHass({
      "sensor.unifi_network_map_status": {
        platform: INTEGRATION_DOMAIN,
        config_entry_id: "entry-123",
      },
    });

    const suggestion = getEntitySuggestion(hass, "sensor.unifi_network_map_status");

    expect(suggestion).toEqual({
      config: {
        type: "custom:unifi-network-map",
        entry_id: "entry-123",
      },
    });
  });

  it("works for binary_sensor entities owned by the integration", () => {
    const hass = makeHass({
      "binary_sensor.living_room_ap": {
        platform: INTEGRATION_DOMAIN,
        config_entry_id: "entry-xyz",
      },
    });

    const suggestion = getEntitySuggestion(hass, "binary_sensor.living_room_ap");

    expect(suggestion?.config.entry_id).toBe("entry-xyz");
  });
});
