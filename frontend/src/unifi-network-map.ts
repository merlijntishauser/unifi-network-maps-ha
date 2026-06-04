import { getEntitySuggestion, INTEGRATION_DOMAIN } from "./card/core/entity-suggestion";
import { UnifiNetworkMapCard } from "./card/core/unifi-network-map-card";
import { UnifiNetworkMapEditor } from "./card/core/unifi-network-map-editor";

declare const __CARD_VERSION__: string;

const CARD_VERSION = __CARD_VERSION__;

customElements.define("unifi-network-map", UnifiNetworkMapCard);
customElements.define("unifi-network-map-editor", UnifiNetworkMapEditor);

// Register card in Lovelace card picker.
// `getEntitySuggestion` opts in to HA 2026.6+ Community suggestions:
// when the user picks any entity belonging to our integration in the
// card picker, this card appears under the Community section.
interface CardSuggestion {
  config: Record<string, unknown>;
  label?: string;
}
interface CustomCardInfo {
  type: string;
  name: string;
  description: string;
  preview?: boolean;
  documentationURL?: string;
  getEntitySuggestion?: (
    hass: unknown,
    entityId: string,
  ) => CardSuggestion | CardSuggestion[] | null;
}

(window as unknown as { customCards?: CustomCardInfo[] }).customCards =
  (window as unknown as { customCards?: CustomCardInfo[] }).customCards || [];
(window as unknown as { customCards: CustomCardInfo[] }).customCards.push({
  type: "unifi-network-map",
  name: "UniFi Network Map",
  description: "Displays your UniFi network topology as an interactive SVG map",
  preview: true,
  documentationURL: "https://github.com/merlijntishauser/unifi-network-maps",
  getEntitySuggestion,
});

console.info(`unifi-network-map card loaded v${CARD_VERSION} (domain=${INTEGRATION_DOMAIN})`);
