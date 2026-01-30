import {
  buildCacheKey,
  cacheKeysEqual,
  createAnnotationCache,
  invalidateAnnotationCache,
  markAnnotationsComplete,
  shouldSkipAnnotations,
} from "../card/data/annotation-cache";
import type { Edge } from "../card/core/types";

describe("annotation-cache", () => {
  describe("createAnnotationCache", () => {
    it("should create a fresh cache with no key and not annotated", () => {
      const cache = createAnnotationCache();
      expect(cache.lastKey).toBeNull();
      expect(cache.isAnnotated).toBe(false);
    });
  });

  describe("buildCacheKey", () => {
    it("should build a cache key from SVG content, node types, and edges", () => {
      const svgContent = "<svg>test</svg>";
      const nodeTypes = { Gateway: "gateway", Switch: "switch" };
      const edges: Edge[] = [{ left: "Gateway", right: "Switch", label: "eth0" }];

      const key = buildCacheKey(svgContent, nodeTypes, edges);

      expect(key.svgHash).toBeDefined();
      expect(key.nodeTypesHash).toBeDefined();
      expect(key.edgesHash).toBeDefined();
    });

    it("should produce the same hash for the same input", () => {
      const svgContent = "<svg>test</svg>";
      const nodeTypes = { Gateway: "gateway", Switch: "switch" };
      const edges: Edge[] = [{ left: "Gateway", right: "Switch", label: "eth0" }];

      const key1 = buildCacheKey(svgContent, nodeTypes, edges);
      const key2 = buildCacheKey(svgContent, nodeTypes, edges);

      expect(key1.svgHash).toBe(key2.svgHash);
      expect(key1.nodeTypesHash).toBe(key2.nodeTypesHash);
      expect(key1.edgesHash).toBe(key2.edgesHash);
    });

    it("should produce different hash for different SVG content", () => {
      const nodeTypes = { Gateway: "gateway" };
      const edges: Edge[] = [];

      const key1 = buildCacheKey("<svg>test1</svg>", nodeTypes, edges);
      const key2 = buildCacheKey("<svg>test2</svg>", nodeTypes, edges);

      expect(key1.svgHash).not.toBe(key2.svgHash);
    });

    it("should produce different hash for different node types", () => {
      const svgContent = "<svg>test</svg>";
      const edges: Edge[] = [];

      const key1 = buildCacheKey(svgContent, { Gateway: "gateway" }, edges);
      const key2 = buildCacheKey(svgContent, { Gateway: "gateway", Switch: "switch" }, edges);

      expect(key1.nodeTypesHash).not.toBe(key2.nodeTypesHash);
    });

    it("should produce different hash for different edges", () => {
      const svgContent = "<svg>test</svg>";
      const nodeTypes = { Gateway: "gateway", Switch: "switch" };

      const key1 = buildCacheKey(svgContent, nodeTypes, [
        { left: "Gateway", right: "Switch", label: "eth0" },
      ]);
      const key2 = buildCacheKey(svgContent, nodeTypes, [
        { left: "Gateway", right: "AP", label: "eth1" },
      ]);

      expect(key1.edgesHash).not.toBe(key2.edgesHash);
    });

    it("should handle undefined node types and edges", () => {
      const key = buildCacheKey("<svg>test</svg>", undefined, undefined);

      expect(key.svgHash).toBeDefined();
      expect(key.nodeTypesHash).toBeDefined();
      expect(key.edgesHash).toBeDefined();
    });
  });

  describe("cacheKeysEqual", () => {
    it("should return true for identical keys", () => {
      const key1 = buildCacheKey("<svg>test</svg>", { Gateway: "gateway" }, []);
      const key2 = buildCacheKey("<svg>test</svg>", { Gateway: "gateway" }, []);

      expect(cacheKeysEqual(key1, key2)).toBe(true);
    });

    it("should return false for different keys", () => {
      const key1 = buildCacheKey("<svg>test1</svg>", { Gateway: "gateway" }, []);
      const key2 = buildCacheKey("<svg>test2</svg>", { Gateway: "gateway" }, []);

      expect(cacheKeysEqual(key1, key2)).toBe(false);
    });

    it("should return false when first key is null", () => {
      const key = buildCacheKey("<svg>test</svg>", {}, []);
      expect(cacheKeysEqual(null, key)).toBe(false);
    });

    it("should return false when second key is null", () => {
      const key = buildCacheKey("<svg>test</svg>", {}, []);
      expect(cacheKeysEqual(key, null)).toBe(false);
    });

    it("should return false when both keys are null", () => {
      expect(cacheKeysEqual(null, null)).toBe(false);
    });
  });

  describe("shouldSkipAnnotations", () => {
    it("should return false for a fresh cache", () => {
      const cache = createAnnotationCache();
      const key = buildCacheKey("<svg>test</svg>", {}, []);

      expect(shouldSkipAnnotations(cache, key)).toBe(false);
    });

    it("should return false when cache is annotated but key differs", () => {
      const cache = createAnnotationCache();
      const key1 = buildCacheKey("<svg>test1</svg>", {}, []);
      markAnnotationsComplete(cache, key1);

      const key2 = buildCacheKey("<svg>test2</svg>", {}, []);
      expect(shouldSkipAnnotations(cache, key2)).toBe(false);
    });

    it("should return true when cache is annotated and key matches", () => {
      const cache = createAnnotationCache();
      const key = buildCacheKey("<svg>test</svg>", { Gateway: "gateway" }, []);
      markAnnotationsComplete(cache, key);

      const sameKey = buildCacheKey("<svg>test</svg>", { Gateway: "gateway" }, []);
      expect(shouldSkipAnnotations(cache, sameKey)).toBe(true);
    });
  });

  describe("markAnnotationsComplete", () => {
    it("should mark cache as annotated and store the key", () => {
      const cache = createAnnotationCache();
      const key = buildCacheKey("<svg>test</svg>", {}, []);

      markAnnotationsComplete(cache, key);

      expect(cache.isAnnotated).toBe(true);
      expect(cache.lastKey).toBe(key);
    });
  });

  describe("invalidateAnnotationCache", () => {
    it("should reset the cache to initial state", () => {
      const cache = createAnnotationCache();
      const key = buildCacheKey("<svg>test</svg>", {}, []);
      markAnnotationsComplete(cache, key);

      invalidateAnnotationCache(cache);

      expect(cache.isAnnotated).toBe(false);
      expect(cache.lastKey).toBeNull();
    });
  });

  describe("integration scenario", () => {
    it("should skip annotations on second call with same data", () => {
      const cache = createAnnotationCache();
      const svgContent = "<svg><g>Network Map</g></svg>";
      const nodeTypes = { Gateway: "gateway", Switch: "switch", AP: "ap" };
      const edges: Edge[] = [
        { left: "Gateway", right: "Switch", label: "eth0" },
        { left: "Switch", right: "AP", label: "eth1" },
      ];

      // First call - should not skip
      const key1 = buildCacheKey(svgContent, nodeTypes, edges);
      expect(shouldSkipAnnotations(cache, key1)).toBe(false);
      markAnnotationsComplete(cache, key1);

      // Second call with same data - should skip
      const key2 = buildCacheKey(svgContent, nodeTypes, edges);
      expect(shouldSkipAnnotations(cache, key2)).toBe(true);
    });

    it("should not skip annotations after SVG content changes", () => {
      const cache = createAnnotationCache();
      const nodeTypes = { Gateway: "gateway" };
      const edges: Edge[] = [];

      // First call
      const key1 = buildCacheKey("<svg>v1</svg>", nodeTypes, edges);
      markAnnotationsComplete(cache, key1);

      // Simulate SVG reload - invalidate cache
      invalidateAnnotationCache(cache);

      // Should not skip after invalidation
      const key2 = buildCacheKey("<svg>v2</svg>", nodeTypes, edges);
      expect(shouldSkipAnnotations(cache, key2)).toBe(false);
    });

    it("should not skip annotations when new nodes are added", () => {
      const cache = createAnnotationCache();
      const svgContent = "<svg>network</svg>";
      const edges: Edge[] = [];

      // First call with one node
      const key1 = buildCacheKey(svgContent, { Gateway: "gateway" }, edges);
      markAnnotationsComplete(cache, key1);

      // New node added - should not skip
      const key2 = buildCacheKey(svgContent, { Gateway: "gateway", Switch: "switch" }, edges);
      expect(shouldSkipAnnotations(cache, key2)).toBe(false);
    });
  });
});
