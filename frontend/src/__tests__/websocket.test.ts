import { subscribeMapUpdates } from "../card/data/websocket";
import type { Hass, MapPayload } from "../card/core/types";

describe("websocket", () => {
  describe("subscribeMapUpdates", () => {
    it("returns not subscribed when connection is undefined", async () => {
      const hass = { connection: undefined } as unknown as Hass;
      const onUpdate = jest.fn();

      const result = await subscribeMapUpdates(hass, "entry123", onUpdate);

      expect(result.subscribed).toBe(false);
      if (!result.subscribed) {
        expect(result.reason).toBe("WebSocket not available");
      }
    });

    it("returns not subscribed when subscribeMessage is undefined", async () => {
      const hass = { connection: {} } as unknown as Hass;
      const onUpdate = jest.fn();

      const result = await subscribeMapUpdates(hass, "entry123", onUpdate);

      expect(result.subscribed).toBe(false);
      if (!result.subscribed) {
        expect(result.reason).toBe("WebSocket not available");
      }
    });

    it("returns subscribed with unsubscribe function on success", async () => {
      const mockUnsubscribe = jest.fn();
      const mockSubscribeMessage = jest.fn().mockResolvedValue(mockUnsubscribe);
      const hass = {
        connection: { subscribeMessage: mockSubscribeMessage },
      } as unknown as Hass;
      const onUpdate = jest.fn();

      const result = await subscribeMapUpdates(hass, "entry123", onUpdate);

      expect(result.subscribed).toBe(true);
      if (result.subscribed) {
        expect(result.unsubscribe).toBe(mockUnsubscribe);
      }
      expect(mockSubscribeMessage).toHaveBeenCalledWith(
        expect.any(Function),
        { type: "unifi_network_map/subscribe", entry_id: "entry123" },
        { resubscribe: true },
      );
    });

    it("calls onUpdate with payload when message received", async () => {
      let messageCallback: ((msg: { payload: MapPayload }) => void) | undefined;
      const mockSubscribeMessage = jest.fn().mockImplementation((callback) => {
        messageCallback = callback;
        return Promise.resolve(jest.fn());
      });
      const hass = {
        connection: { subscribeMessage: mockSubscribeMessage },
      } as unknown as Hass;
      const onUpdate = jest.fn();

      await subscribeMapUpdates(hass, "entry123", onUpdate);

      const testPayload: MapPayload = { edges: [], node_types: { test: "switch" } };
      messageCallback?.({ payload: testPayload });

      expect(onUpdate).toHaveBeenCalledWith(testPayload);
    });

    it("returns error reason when subscription fails with Error", async () => {
      const mockSubscribeMessage = jest.fn().mockRejectedValue(new Error("Connection lost"));
      const hass = {
        connection: { subscribeMessage: mockSubscribeMessage },
      } as unknown as Hass;
      const onUpdate = jest.fn();

      const result = await subscribeMapUpdates(hass, "entry123", onUpdate);

      expect(result.subscribed).toBe(false);
      if (!result.subscribed) {
        expect(result.reason).toBe("Connection lost");
      }
    });

    it("returns generic error when subscription fails with non-Error", async () => {
      const mockSubscribeMessage = jest.fn().mockRejectedValue("string error");
      const hass = {
        connection: { subscribeMessage: mockSubscribeMessage },
      } as unknown as Hass;
      const onUpdate = jest.fn();

      const result = await subscribeMapUpdates(hass, "entry123", onUpdate);

      expect(result.subscribed).toBe(false);
      if (!result.subscribed) {
        expect(result.reason).toBe("Subscription failed");
      }
    });
  });
});
