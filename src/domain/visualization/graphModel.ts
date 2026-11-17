/**
 * Stage 7E pure graph visual model.
 *
 * Everything displayed — node identity, edge endpoints, current edge, the
 * discovered/visited split and the exact frontier order — is copied from ONE
 * GraphSnapshot. The model never reads `message`, never diffs frames and never
 * keeps a second playback index.
 */
import type { GraphAlgorithm, GraphFrontierKind, GraphOperation, GraphSnapshot } from '../trace/schema';
import { layoutGraph, type GraphLayoutEdge } from './graphLayout';

export type GraphNodeVisualState = 'visited' | 'pending' | 'undiscovered';

export interface GraphVisualNode {
  id: string;
  label: string;
  x: number;
  y: number;
  state: GraphNodeVisualState;
  start: boolean;
  isolated: boolean;
  visited: boolean;
  visitIndex: number | null;
  inFrontier: boolean;
}

export interface GraphVisualEdge extends GraphLayoutEdge {
  active: boolean;
}

export interface GraphFrontierVisualItem {
  id: string;
  nodeId: string;
  label: string;
}

export interface GraphVisualModel {
  kind: 'graph-traversal';
  algorithm: GraphAlgorithm;
  operation: GraphOperation;
  nodes: GraphVisualNode[];
  edges: GraphVisualEdge[];
  startNodeId: string | null;
  currentNodeId: string | null;
  currentEdgeId: string | null;
  neighborNodeId: string | null;
  discoveredIds: string[];
  visitedIds: string[];
  visitOrder: string[];
  frontierKind: GraphFrontierKind;
  frontierItems: GraphFrontierVisualItem[];
  frontierRemoved?: GraphFrontierVisualItem;
  empty: boolean;
  label: string;
  width: number;
  height: number;
  nodeRadius: number;
}

function valueText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === null) return 'null';
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

/**
 * Build the render model, or return `null` when the snapshot cannot be trusted.
 * The Trace schema already enforces these rules; this second gate protects
 * direct callers (packs, tests, future importers) from a half-valid frame.
 */
export function buildGraphVisualModel(
  snapshot: GraphSnapshot,
  emptyLabel: string,
): GraphVisualModel | null {
  if (snapshot.kind !== 'graph') return null;

  const nodeIds = new Set<string>();
  const nodeById = new Map<string, GraphSnapshot['nodes'][number]>();
  for (const node of snapshot.nodes) {
    if (nodeIds.has(node.id)) return null;
    nodeIds.add(node.id);
    nodeById.set(node.id, node);
  }

  const edgeIds = new Set<string>();
  for (const edge of snapshot.edges) {
    if (edgeIds.has(edge.id) || !nodeIds.has(edge.fromId) || !nodeIds.has(edge.toId) || edge.fromId === edge.toId) {
      return null;
    }
    edgeIds.add(edge.id);
  }

  for (const item of snapshot.frontierItems) {
    if (!nodeIds.has(item.nodeId)) return null;
  }
  if (snapshot.frontierRemoved && !nodeIds.has(snapshot.frontierRemoved.nodeId)) return null;
  if (snapshot.frontierKind !== (snapshot.algorithm === 'bfs' ? 'queue' : 'stack')) return null;

  const discovered = new Set(snapshot.discoveredIds);
  const visited = new Set(snapshot.visitedIds);
  const frontierNodes = new Set(snapshot.frontierItems.map((item) => item.nodeId));
  const layout = layoutGraph(snapshot.nodes, snapshot.edges);
  const positions = new Map(layout.nodes.map((node) => [node.id, node]));
  const degree = new Map<string, number>();
  for (const edge of snapshot.edges) {
    degree.set(edge.fromId, (degree.get(edge.fromId) ?? 0) + 1);
    degree.set(edge.toId, (degree.get(edge.toId) ?? 0) + 1);
  }

  const nodes: GraphVisualNode[] = [];
  for (const node of snapshot.nodes) {
    const position = positions.get(node.id);
    if (!position) return null;
    const state: GraphNodeVisualState =
      visited.has(node.id) ? 'visited' :
      discovered.has(node.id) ? 'pending' : 'undiscovered';
    const visitIndex = snapshot.visitedIds.indexOf(node.id);
    nodes.push({
      id: node.id,
      label: valueText(node.value),
      x: position.x,
      y: position.y,
      state,
      start: node.id === snapshot.startNodeId,
      isolated: (degree.get(node.id) ?? 0) === 0,
      visited: visited.has(node.id),
      visitIndex: visitIndex >= 0 ? visitIndex + 1 : null,
      inFrontier: frontierNodes.has(node.id),
    });
  }

  const edges: GraphVisualEdge[] = layout.edges.map((edge) => ({
    ...edge,
    active: edge.id === snapshot.currentEdgeId,
  }));

  const frontierItems: GraphFrontierVisualItem[] = snapshot.frontierItems.map((item) => ({
    id: item.id,
    nodeId: item.nodeId,
    label: nodeById.get(item.nodeId)?.value === undefined
      ? item.nodeId
      : valueText(nodeById.get(item.nodeId)?.value),
  }));

  const frontierRemoved = snapshot.frontierRemoved
    ? {
        id: snapshot.frontierRemoved.id,
        nodeId: snapshot.frontierRemoved.nodeId,
        label: nodeById.get(snapshot.frontierRemoved.nodeId)?.value === undefined
          ? snapshot.frontierRemoved.nodeId
          : valueText(nodeById.get(snapshot.frontierRemoved.nodeId)?.value),
      }
    : undefined;

  return {
    kind: 'graph-traversal',
    algorithm: snapshot.algorithm,
    operation: snapshot.operation,
    nodes,
    edges,
    startNodeId: snapshot.startNodeId,
    currentNodeId: snapshot.currentNodeId,
    currentEdgeId: snapshot.currentEdgeId,
    neighborNodeId: snapshot.neighborNodeId,
    discoveredIds: [...snapshot.discoveredIds],
    visitedIds: [...snapshot.visitedIds],
    visitOrder: [...snapshot.visitOrder],
    frontierKind: snapshot.frontierKind,
    frontierItems,
    ...(frontierRemoved ? { frontierRemoved } : {}),
    empty: nodes.length === 0,
    label: emptyLabel,
    width: layout.width,
    height: layout.height,
    nodeRadius: layout.nodeRadius,
  };
}
