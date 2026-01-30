/**
 * SVG annotation caching module.
 *
 * Tracks when SVG annotations have been applied and skips re-annotation
 * when the underlying data (SVG content + payload) hasn't changed.
 */

import type { Edge } from "../core/types";

export interface AnnotationCacheKey {
  svgHash: string;
  nodeTypesHash: string;
  edgesHash: string;
}

export interface AnnotationCache {
  lastKey: AnnotationCacheKey | null;
  isAnnotated: boolean;
}

export function createAnnotationCache(): AnnotationCache {
  return {
    lastKey: null,
    isAnnotated: false,
  };
}

/**
 * Compute a simple hash for a string (for comparison, not cryptographic use).
 */
function hashString(str: string): string {
  let hash = 0;
  if (str.length === 0) return String(hash);
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return String(hash);
}

/**
 * Build a cache key from the input data.
 */
export function buildCacheKey(
  svgContent: string,
  nodeTypes: Record<string, string> | undefined,
  edges: Edge[] | undefined,
): AnnotationCacheKey {
  const nodeTypesStr = nodeTypes ? JSON.stringify(Object.keys(nodeTypes).sort()) : "";
  const edgesStr = edges ? JSON.stringify(edges.map((e) => `${e.left}-${e.right}`).sort()) : "";

  return {
    svgHash: hashString(svgContent),
    nodeTypesHash: hashString(nodeTypesStr),
    edgesHash: hashString(edgesStr),
  };
}

/**
 * Check if two cache keys are equal.
 */
export function cacheKeysEqual(
  a: AnnotationCacheKey | null,
  b: AnnotationCacheKey | null,
): boolean {
  if (a === null || b === null) return false;
  return (
    a.svgHash === b.svgHash && a.nodeTypesHash === b.nodeTypesHash && a.edgesHash === b.edgesHash
  );
}

/**
 * Check if annotations should be skipped based on cache state.
 */
export function shouldSkipAnnotations(
  cache: AnnotationCache,
  currentKey: AnnotationCacheKey,
): boolean {
  return cache.isAnnotated && cacheKeysEqual(cache.lastKey, currentKey);
}

/**
 * Mark annotations as complete and update the cache key.
 */
export function markAnnotationsComplete(cache: AnnotationCache, key: AnnotationCacheKey): void {
  cache.lastKey = key;
  cache.isAnnotated = true;
}

/**
 * Invalidate the cache (e.g., when SVG is reloaded).
 */
export function invalidateAnnotationCache(cache: AnnotationCache): void {
  cache.lastKey = null;
  cache.isAnnotated = false;
}
