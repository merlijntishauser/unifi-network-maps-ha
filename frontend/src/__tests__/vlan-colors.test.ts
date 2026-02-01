import { assignVlanColors, generateVlanStyles, getNodeVlanInfo } from "../card/ui/vlan-colors";
import type { VlanInfo } from "../card/core/types";

// Polyfill CSS.escape for JSDOM
if (typeof CSS === "undefined" || !CSS.escape) {
  (global as unknown as { CSS: { escape: (s: string) => string } }).CSS = {
    escape: (str: string) => str.replace(/([^\w-])/g, "\\$1"),
  };
}

describe("vlan-colors", () => {
  describe("assignVlanColors", () => {
    it("returns empty object for undefined vlanInfo", () => {
      const result = assignVlanColors(undefined, "dark");
      expect(result).toEqual({});
    });

    it("assigns colors from dark palette for dark theme", () => {
      const vlanInfo: Record<number, VlanInfo> = {
        10: { id: 10, name: "Default" },
        20: { id: 20, name: "Guest" },
      };
      const result = assignVlanColors(vlanInfo, "dark");
      expect(result[10]).toBe("#60a5fa"); // First dark color
      expect(result[20]).toBe("#4ade80"); // Second dark color
    });

    it("assigns colors from light palette for light theme", () => {
      const vlanInfo: Record<number, VlanInfo> = {
        10: { id: 10, name: "Default" },
      };
      const result = assignVlanColors(vlanInfo, "light");
      expect(result[10]).toBe("#2563eb"); // First light color
    });

    it("uses light palette for unifi theme", () => {
      const vlanInfo: Record<number, VlanInfo> = {
        10: { id: 10, name: "Default" },
      };
      const result = assignVlanColors(vlanInfo, "unifi");
      expect(result[10]).toBe("#2563eb"); // First light color
    });

    it("uses dark palette for unifi-dark theme", () => {
      const vlanInfo: Record<number, VlanInfo> = {
        10: { id: 10, name: "Default" },
      };
      const result = assignVlanColors(vlanInfo, "unifi-dark");
      expect(result[10]).toBe("#60a5fa"); // First dark color
    });

    it("sorts VLANs by ID", () => {
      const vlanInfo: Record<number, VlanInfo> = {
        30: { id: 30, name: "IoT" },
        10: { id: 10, name: "Default" },
        20: { id: 20, name: "Guest" },
      };
      const result = assignVlanColors(vlanInfo, "dark");
      // Should be sorted: 10, 20, 30
      expect(result[10]).toBe("#60a5fa"); // First
      expect(result[20]).toBe("#4ade80"); // Second
      expect(result[30]).toBe("#fbbf24"); // Third
    });

    it("cycles colors for more than 10 VLANs", () => {
      const vlanInfo: Record<number, VlanInfo> = {};
      for (let i = 1; i <= 12; i++) {
        vlanInfo[i] = { id: i, name: `VLAN ${i}` };
      }
      const result = assignVlanColors(vlanInfo, "dark");
      expect(result[1]).toBe("#60a5fa"); // First color
      expect(result[11]).toBe("#60a5fa"); // Cycles back to first
      expect(result[12]).toBe("#4ade80"); // Second color
    });
  });

  describe("generateVlanStyles", () => {
    it("returns empty string for undefined nodeVlans", () => {
      const colorMap = { 10: "#60a5fa" };
      const result = generateVlanStyles(undefined, colorMap);
      expect(result).toBe("");
    });

    it("returns empty string for empty colorMap", () => {
      const nodeVlans = { Client1: 10 };
      const result = generateVlanStyles(nodeVlans, {});
      expect(result).toBe("");
    });

    it("generates CSS rules for nodes with VLAN colors", () => {
      const nodeVlans: Record<string, number | null> = {
        Client1: 10,
        Client2: 20,
      };
      const colorMap = { 10: "#60a5fa", 20: "#4ade80" };
      const result = generateVlanStyles(nodeVlans, colorMap);
      expect(result).toContain('data-node-id="Client1"');
      expect(result).toContain("stroke: #60a5fa");
      expect(result).toContain('data-node-id="Client2"');
      expect(result).toContain("stroke: #4ade80");
    });

    it("skips nodes with null VLAN", () => {
      const nodeVlans: Record<string, number | null> = {
        Client1: 10,
        Client2: null,
      };
      const colorMap = { 10: "#60a5fa" };
      const result = generateVlanStyles(nodeVlans, colorMap);
      expect(result).toContain('data-node-id="Client1"');
      expect(result).not.toContain('data-node-id="Client2"');
    });

    it("skips nodes with unknown VLAN ID", () => {
      const nodeVlans: Record<string, number | null> = {
        Client1: 10,
        Client2: 99, // Not in colorMap
      };
      const colorMap = { 10: "#60a5fa" };
      const result = generateVlanStyles(nodeVlans, colorMap);
      expect(result).toContain('data-node-id="Client1"');
      expect(result).not.toContain('data-node-id="Client2"');
    });

    it("escapes special characters in node names", () => {
      const nodeVlans: Record<string, number | null> = {
        "Client.Name": 10,
      };
      const colorMap = { 10: "#60a5fa" };
      const result = generateVlanStyles(nodeVlans, colorMap);
      // CSS.escape should handle the dot
      expect(result).toContain("stroke: #60a5fa");
    });
  });

  describe("getNodeVlanInfo", () => {
    it("returns null for undefined nodeVlans", () => {
      const vlanInfo: Record<number, VlanInfo> = {
        10: { id: 10, name: "Default" },
      };
      const result = getNodeVlanInfo("Client1", undefined, vlanInfo);
      expect(result).toBeNull();
    });

    it("returns null for undefined vlanInfo", () => {
      const nodeVlans: Record<string, number | null> = { Client1: 10 };
      const result = getNodeVlanInfo("Client1", nodeVlans, undefined);
      expect(result).toBeNull();
    });

    it("returns null for node with null VLAN", () => {
      const nodeVlans: Record<string, number | null> = { Client1: null };
      const vlanInfo: Record<number, VlanInfo> = {
        10: { id: 10, name: "Default" },
      };
      const result = getNodeVlanInfo("Client1", nodeVlans, vlanInfo);
      expect(result).toBeNull();
    });

    it("returns null for node not in nodeVlans", () => {
      const nodeVlans: Record<string, number | null> = { Client1: 10 };
      const vlanInfo: Record<number, VlanInfo> = {
        10: { id: 10, name: "Default" },
      };
      const result = getNodeVlanInfo("Client2", nodeVlans, vlanInfo);
      expect(result).toBeNull();
    });

    it("returns null for VLAN not in vlanInfo", () => {
      const nodeVlans: Record<string, number | null> = { Client1: 99 };
      const vlanInfo: Record<number, VlanInfo> = {
        10: { id: 10, name: "Default" },
      };
      const result = getNodeVlanInfo("Client1", nodeVlans, vlanInfo);
      expect(result).toBeNull();
    });

    it("returns VlanInfo for valid node", () => {
      const nodeVlans: Record<string, number | null> = { Client1: 10 };
      const expectedInfo: VlanInfo = { id: 10, name: "Default" };
      const vlanInfo: Record<number, VlanInfo> = { 10: expectedInfo };
      const result = getNodeVlanInfo("Client1", nodeVlans, vlanInfo);
      expect(result).toEqual(expectedInfo);
    });
  });
});
