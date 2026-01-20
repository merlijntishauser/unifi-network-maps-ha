import { UnifiNetworkMapCard } from "./card/unifi-network-map-card";
import { UnifiNetworkMapEditor } from "./card/unifi-network-map-editor";

declare const __CARD_VERSION__: string;

const CARD_VERSION = __CARD_VERSION__;

customElements.define("unifi-network-map", UnifiNetworkMapCard);
customElements.define("unifi-network-map-editor", UnifiNetworkMapEditor);

// Register card in Lovelace card picker
(
  window as unknown as { customCards?: Array<{ type: string; name: string; description: string }> }
).customCards =
  (
    window as unknown as {
      customCards?: Array<{ type: string; name: string; description: string }>;
    }
  ).customCards || [];
(
  window as unknown as { customCards: Array<{ type: string; name: string; description: string }> }
).customCards.push({
  type: "unifi-network-map",
  name: "UniFi Network Map",
  description: "Displays your UniFi network topology as an interactive SVG map",
});

console.info(`unifi-network-map card loaded v${CARD_VERSION}`);
