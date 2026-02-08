import { annotateEdges, findEdgeFromTarget, renderEdgeTooltip } from "../card/data/svg";
import type { Edge } from "../card/core/types";

function createSvg(): SVGSVGElement {
  return document.createElementNS("http://www.w3.org/2000/svg", "svg");
}

function createPath(left: string, right: string): SVGPathElement {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("data-edge-left", left);
  path.setAttribute("data-edge-right", right);
  path.setAttribute("d", "M0 0 L100 100");
  return path;
}

describe("svg", () => {
  describe("annotateEdges", () => {
    it("adds data-edge attribute to matching paths", () => {
      const svg = createSvg();
      const path = createPath("A", "B");
      svg.appendChild(path);

      const edges: Edge[] = [{ left: "A", right: "B" }];
      annotateEdges(svg, edges);

      expect(path.getAttribute("data-edge")).toBe("true");
    });

    it("creates hitbox for edge paths", () => {
      const svg = createSvg();
      const path = createPath("A", "B");
      svg.appendChild(path);

      const edges: Edge[] = [{ left: "A", right: "B" }];
      annotateEdges(svg, edges);

      const hitbox = svg.querySelector('path[data-edge-hitbox="true"]');
      expect(hitbox).not.toBeNull();
      expect(hitbox?.getAttribute("data-edge-left")).toBe("A");
      expect(hitbox?.getAttribute("data-edge-right")).toBe("B");
    });

    it("does not annotate paths without matching edges", () => {
      const svg = createSvg();
      const path = createPath("A", "B");
      svg.appendChild(path);

      const edges: Edge[] = [{ left: "X", right: "Y" }];
      annotateEdges(svg, edges);

      expect(path.getAttribute("data-edge")).toBeNull();
    });

    it("matches edges regardless of left/right order", () => {
      const svg = createSvg();
      const path = createPath("B", "A"); // Reversed
      svg.appendChild(path);

      const edges: Edge[] = [{ left: "A", right: "B" }];
      annotateEdges(svg, edges);

      expect(path.getAttribute("data-edge")).toBe("true");
    });

    it("checks for existing hitbox as next sibling", () => {
      const svg = createSvg();
      const path = createPath("A", "B");
      // Pre-create a hitbox as the next sibling
      // Note: Don't set data-edge-left/right to avoid it being processed as an edge
      const existingHitbox = document.createElementNS("http://www.w3.org/2000/svg", "path");
      existingHitbox.setAttribute("data-edge-hitbox", "true");
      existingHitbox.setAttribute("d", "M0 0 L100 100");
      svg.appendChild(path);
      svg.appendChild(existingHitbox); // Append after path (making it next sibling)

      const edges: Edge[] = [{ left: "A", right: "B" }];
      annotateEdges(svg, edges);

      const hitboxes = svg.querySelectorAll('path[data-edge-hitbox="true"]');
      // Should still be 1 because the existing hitbox is the next sibling
      expect(hitboxes.length).toBe(1);
    });

    it("skips paths without left attribute", () => {
      const svg = createSvg();
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("data-edge-right", "B");
      svg.appendChild(path);

      const edges: Edge[] = [{ left: "A", right: "B" }];
      annotateEdges(svg, edges);

      expect(path.getAttribute("data-edge")).toBeNull();
    });

    it("annotates edge labels", () => {
      const svg = createSvg();
      const path = createPath("A", "B");
      const label = document.createElementNS("http://www.w3.org/2000/svg", "g");
      label.classList.add("edgeLabel");
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.textContent = "Port 1";
      label.appendChild(text);
      // Put label and path in same group
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.appendChild(path);
      group.appendChild(label);
      svg.appendChild(group);

      const edges: Edge[] = [{ left: "A", right: "B" }];
      annotateEdges(svg, edges);

      // Label should have edge attributes copied from sibling path
      expect(label.getAttribute("data-edge-left")).toBe("A");
      expect(label.getAttribute("data-edge-right")).toBe("B");
    });

    it("annotates PoE icons", () => {
      const svg = createSvg();
      const path = createPath("A", "B");
      const poeText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      poeText.textContent = "⚡";
      // Put in same group
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.appendChild(path);
      group.appendChild(poeText);
      svg.appendChild(group);

      const edges: Edge[] = [{ left: "A", right: "B" }];
      annotateEdges(svg, edges);

      expect(poeText.getAttribute("data-edge-left")).toBe("A");
      expect(poeText.getAttribute("data-edge-right")).toBe("B");
    });

    it("annotates PoE bolt use elements", () => {
      const svg = createSvg();
      const path = createPath("A", "B");
      const poeUse = document.createElementNS("http://www.w3.org/2000/svg", "use");
      poeUse.setAttribute("href", "#poe-bolt");
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.appendChild(path);
      group.appendChild(poeUse);
      svg.appendChild(group);

      const edges: Edge[] = [{ left: "A", right: "B" }];
      annotateEdges(svg, edges);

      expect(poeUse.getAttribute("data-edge-left")).toBe("A");
      expect(poeUse.getAttribute("data-edge-right")).toBe("B");
    });

    it("annotates iso-poe-bolt use elements", () => {
      const svg = createSvg();
      const path = createPath("A", "B");
      const poeUse = document.createElementNS("http://www.w3.org/2000/svg", "use");
      poeUse.setAttribute("href", "#iso-poe-bolt");
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.appendChild(path);
      group.appendChild(poeUse);
      svg.appendChild(group);

      const edges: Edge[] = [{ left: "A", right: "B" }];
      annotateEdges(svg, edges);

      expect(poeUse.getAttribute("data-edge-left")).toBe("A");
      expect(poeUse.getAttribute("data-edge-right")).toBe("B");
    });

    it("handles PoE text with POE label", () => {
      const svg = createSvg();
      const path = createPath("A", "B");
      const poeText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      poeText.textContent = "poe";
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.appendChild(path);
      group.appendChild(poeText);
      svg.appendChild(group);

      const edges: Edge[] = [{ left: "A", right: "B" }];
      annotateEdges(svg, edges);

      expect(poeText.getAttribute("data-edge-left")).toBe("A");
    });

    it("skips empty PoE text elements", () => {
      const svg = createSvg();
      const path = createPath("A", "B");
      const emptyText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      emptyText.textContent = "";
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.appendChild(path);
      group.appendChild(emptyText);
      svg.appendChild(group);

      const edges: Edge[] = [{ left: "A", right: "B" }];
      annotateEdges(svg, edges);

      // Empty text should not be annotated
      expect(emptyText.hasAttribute("data-edge-left")).toBe(false);
    });

    it("skips label already having data-edge-left", () => {
      const svg = createSvg();
      const path = createPath("A", "B");
      const label = document.createElementNS("http://www.w3.org/2000/svg", "g");
      label.classList.add("edgeLabel");
      label.setAttribute("data-edge-left", "existing");
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.appendChild(path);
      group.appendChild(label);
      svg.appendChild(group);

      const edges: Edge[] = [{ left: "A", right: "B" }];
      annotateEdges(svg, edges);

      // Should keep existing attribute
      expect(label.getAttribute("data-edge-left")).toBe("existing");
    });

    it("handles edgeLabel in same group as path", () => {
      const svg = createSvg();
      const path = createPath("A", "B");
      // Put path and label in the same parent group
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.appendChild(path);
      const label = document.createElementNS("http://www.w3.org/2000/svg", "g");
      label.classList.add("edgeLabel");
      group.appendChild(label);
      svg.appendChild(group);

      const edges: Edge[] = [{ left: "A", right: "B" }];
      annotateEdges(svg, edges);

      // Label should be annotated since path is in the same group
      expect(label.getAttribute("data-edge-left")).toBe("A");
      expect(label.getAttribute("data-edge-right")).toBe("B");
    });

    it("handles label without matching path in group", () => {
      const svg = createSvg();
      // Path with different endpoints than the label expects
      const path = createPath("X", "Y");
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.appendChild(path);
      const label = document.createElementNS("http://www.w3.org/2000/svg", "g");
      label.classList.add("edgeLabel");
      label.textContent = "A to B"; // Label text doesn't match any edge
      group.appendChild(label);
      svg.appendChild(group);

      const edges: Edge[] = [{ left: "X", right: "Y" }];
      annotateEdges(svg, edges);

      // Label won't get annotations since path has X-Y but label text references A-B
      // However, findEdgePathInGroup will still find the path in the same group
      expect(label.getAttribute("data-edge-left")).toBe("X");
      expect(label.getAttribute("data-edge-right")).toBe("Y");
    });
  });

  describe("findEdgeFromTarget", () => {
    it("returns null for null target", () => {
      const edges: Edge[] = [{ left: "A", right: "B" }];
      const result = findEdgeFromTarget(null, edges);
      expect(result).toBeNull();
    });

    it("returns null when target is not an edge", () => {
      const div = document.createElement("div");
      const edges: Edge[] = [{ left: "A", right: "B" }];
      const result = findEdgeFromTarget(div, edges);
      expect(result).toBeNull();
    });

    it("finds edge from path with data-edge attribute", () => {
      const path = createPath("A", "B");
      path.setAttribute("data-edge", "true");

      const edges: Edge[] = [
        { left: "A", right: "B", speed: 1000 },
        { left: "X", right: "Y" },
      ];
      const result = findEdgeFromTarget(path, edges);

      expect(result).toEqual({ left: "A", right: "B", speed: 1000 });
    });

    it("finds edge from hitbox path", () => {
      const hitbox = createPath("A", "B");
      hitbox.setAttribute("data-edge-hitbox", "true");

      const edges: Edge[] = [{ left: "A", right: "B", poe: true }];
      const result = findEdgeFromTarget(hitbox, edges);

      expect(result).toEqual({ left: "A", right: "B", poe: true });
    });

    it("finds edge from child element", () => {
      const path = createPath("A", "B");
      path.setAttribute("data-edge", "true");
      const child = document.createElementNS("http://www.w3.org/2000/svg", "text");
      path.appendChild(child);

      const edges: Edge[] = [{ left: "A", right: "B" }];
      const result = findEdgeFromTarget(child, edges);

      expect(result).toEqual({ left: "A", right: "B" });
    });

    it("returns null when edge not in edges array", () => {
      const path = createPath("A", "B");
      path.setAttribute("data-edge", "true");

      const edges: Edge[] = [{ left: "X", right: "Y" }];
      const result = findEdgeFromTarget(path, edges);

      expect(result).toBeNull();
    });
  });

  describe("renderEdgeTooltip", () => {
    const mockGetIcon = (name: string) => `[${name}]`;
    const mockLocalize = (key: string, replacements?: Record<string, string | number>) => {
      // Return the key plus any suffix if present
      if (replacements?.suffix !== undefined) {
        return `${key}${replacements.suffix}`;
      }
      if (replacements) {
        let result = key;
        for (const [k, v] of Object.entries(replacements)) {
          result = result.replace(`{${k}}`, String(v));
        }
        return result;
      }
      return key;
    };

    it("renders basic wired edge", () => {
      const edge: Edge = { left: "A", right: "B", wireless: false };
      const result = renderEdgeTooltip(edge, mockGetIcon, mockLocalize);

      expect(result).toContain("A ↔ B");
      expect(result).toContain("[edge-wired]");
      expect(result).toContain("edge_tooltip.wired");
    });

    it("renders wireless edge", () => {
      const edge: Edge = { left: "A", right: "B", wireless: true };
      const result = renderEdgeTooltip(edge, mockGetIcon, mockLocalize);

      expect(result).toContain("[edge-wireless]");
      expect(result).toContain("edge_tooltip.wireless");
    });

    it("renders edge with label", () => {
      const edge: Edge = { left: "A", right: "B", label: "Port 1" };
      const result = renderEdgeTooltip(edge, mockGetIcon, mockLocalize);

      expect(result).toContain("Port 1");
      expect(result).toContain("[edge-port]");
    });

    it("renders edge with PoE", () => {
      const edge: Edge = { left: "A", right: "B", poe: true };
      const result = renderEdgeTooltip(edge, mockGetIcon, mockLocalize);

      expect(result).toContain("[edge-poe]");
      expect(result).toContain("edge_tooltip.poe");
    });

    it("renders edge with speed in Mbps", () => {
      const edge: Edge = { left: "A", right: "B", speed: 100 };
      const result = renderEdgeTooltip(edge, mockGetIcon, mockLocalize);

      expect(result).toContain("[edge-speed]");
      expect(result).toContain("edge_tooltip.speed_mbps");
    });

    it("renders edge with speed in Gbps", () => {
      const edge: Edge = { left: "A", right: "B", speed: 1000 };
      const result = renderEdgeTooltip(edge, mockGetIcon, mockLocalize);

      expect(result).toContain("edge_tooltip.speed_gbps");
    });

    it("renders edge with 2.4GHz channel", () => {
      const edge: Edge = { left: "A", right: "B", channel: 6, wireless: true };
      const result = renderEdgeTooltip(edge, mockGetIcon, mockLocalize);

      expect(result).toContain("[edge-channel]");
      expect(result).toContain("edge_tooltip.band_24");
    });

    it("renders edge with 5GHz channel", () => {
      const edge: Edge = { left: "A", right: "B", channel: 36, wireless: true };
      const result = renderEdgeTooltip(edge, mockGetIcon, mockLocalize);

      expect(result).toContain("edge_tooltip.band_5");
    });

    it("renders edge with 6GHz channel", () => {
      const edge: Edge = { left: "A", right: "B", channel: 200, wireless: true };
      const result = renderEdgeTooltip(edge, mockGetIcon, mockLocalize);

      expect(result).toContain("edge_tooltip.band_6");
    });

    it("escapes HTML in edge names", () => {
      const edge: Edge = { left: "<script>", right: "B" };
      const result = renderEdgeTooltip(edge, mockGetIcon, mockLocalize);

      expect(result).not.toContain("<script>");
      expect(result).toContain("&lt;script&gt;");
    });

    it("renders all attributes together", () => {
      const edge: Edge = {
        left: "Switch",
        right: "AP",
        wireless: false,
        label: "Port 8",
        poe: true,
        speed: 1000,
      };
      const result = renderEdgeTooltip(edge, mockGetIcon, mockLocalize);

      expect(result).toContain("Switch ↔ AP");
      expect(result).toContain("Port 8");
      expect(result).toContain("edge_tooltip.poe");
      expect(result).toContain("edge_tooltip.speed_gbps");
    });
  });
});
