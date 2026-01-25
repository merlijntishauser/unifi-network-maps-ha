import type { Hass, MapPayload, UnsubscribeFunc } from "../core/types";

export type SubscribeResult =
  | { subscribed: true; unsubscribe: UnsubscribeFunc }
  | { subscribed: false; reason: string };

type MapUpdateMessage = {
  payload: MapPayload;
};

export async function subscribeMapUpdates(
  hass: Hass,
  entryId: string,
  onUpdate: (payload: MapPayload) => void,
): Promise<SubscribeResult> {
  if (!hass.connection?.subscribeMessage) {
    return { subscribed: false, reason: "WebSocket not available" };
  }

  try {
    const unsubscribe = await hass.connection.subscribeMessage<MapUpdateMessage>(
      (msg) => onUpdate(msg.payload),
      { type: "unifi_network_map/subscribe", entry_id: entryId },
      { resubscribe: true },
    );

    return { subscribed: true, unsubscribe };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Subscription failed";
    return { subscribed: false, reason };
  }
}
