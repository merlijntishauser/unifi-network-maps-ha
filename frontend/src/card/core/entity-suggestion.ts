// Implements the HA 2026.6+ `getEntitySuggestion` hook so the card
// appears under the Community section of the card picker when a user
// selects any entity our integration owns. See:
// https://developers.home-assistant.io/blog/2026/05/27/custom-card-suggestions/

export const INTEGRATION_DOMAIN = "unifi_network_map";
const CARD_TYPE = "custom:unifi-network-map";

// Shape of the entries in `hass.entities` that we rely on. The HA
// frontend exposes more fields; we only need these two.
type EntityRegistryEntry = {
  platform?: string;
  config_entry_id?: string | null;
};

type HassWithEntities = {
  entities?: Record<string, EntityRegistryEntry | undefined>;
};

export type CardSuggestion = {
  config: Record<string, unknown>;
  label?: string;
};

export function getEntitySuggestion(hass: unknown, entityId: string): CardSuggestion | null {
  const entity = (hass as HassWithEntities | undefined)?.entities?.[entityId];
  if (!entity || entity.platform !== INTEGRATION_DOMAIN) {
    return null;
  }
  const entryId = entity.config_entry_id;
  if (!entryId) {
    return null;
  }
  return {
    config: {
      type: CARD_TYPE,
      entry_id: entryId,
    },
  };
}
