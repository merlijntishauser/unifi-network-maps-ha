import type { Edge } from "../core/types";

export type SelectionState = {
  selectedNode?: string;
  hoveredNode?: string;
  hoveredEdge?: Edge;
};

export function createSelectionState(): SelectionState {
  return {};
}

export function selectNode(state: SelectionState, nodeName: string): void {
  state.selectedNode = nodeName;
}

export function clearSelectedNode(state: SelectionState): void {
  state.selectedNode = undefined;
}

export function setHoveredNode(state: SelectionState, nodeName: string | null): void {
  state.hoveredNode = nodeName ?? undefined;
}

export function setHoveredEdge(state: SelectionState, edge: Edge | null): void {
  state.hoveredEdge = edge ?? undefined;
}
