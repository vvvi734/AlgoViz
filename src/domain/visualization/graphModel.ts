/**
 * Stage 7E pure graph visual model.
 *
 * Everything displayed — node identity, edge endpoints, current edge, the
 * discovered/visited split and the exact frontier order — is copied from ONE
 * GraphSnapshot. The model never reads `message`, never diffs frames and never
 * keeps a second playback index.
 */
import type {
  DijkstraOperation,
  GraphAlgorithm,
  GraphFrontierKind,
  GraphOperation,
  GraphSnapshot,
  WeightedGraphSnapshot,
} from '../trace/schema';
import {
  computeGraphViewBox,
  layoutGraph,
  type GraphLayoutEdge,
  type GraphViewBox,
} from './graphLayout';

export type GraphNodeVisualState = 'visited' | 'pending' | 'undiscovered' | 'settled';
export type GraphVisualAlgorithm = GraphAlgorithm | 'dijkstra';
export type GraphVisualOperation = GraphOperation | DijkstraOperation;
export type GraphVisualFrontierKind = GraphFrontierKind | 'priority-queue';

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
  /** Stage 7F only: current best distance (null = unreachable), previous and target. */
  distance?: number | null;
  previousId?: string | null;
  settled?: boolean;
  target?: boolean;
  onPath?: boolean;
}

export interface GraphVisualEdge extends GraphLayoutEdge {
  active: boolean;
  /** Stage 7F only: real edge weight and whether the edge is on the final path. */
  weight?: number;
  directed?: boolean;
  onPath?: boolean;
}

export interface GraphFrontierVisualItem {
  id: string;
  nodeId: string;
  label: string;
  /** Stage 7F priority-queue entry. */
  distance?: number;
  stale?: boolean;
}

export interface GraphRelaxVisualChange {
  nodeId: string;
  oldDistance: number | null;
  newDistance: number;
  oldPreviousId: string | null;
  newPreviousId: string;
}

export interface GraphVisualModel {
  kind: 'graph-traversal';
  algorithm: GraphVisualAlgorithm;
  operation: GraphVisualOperation;
  nodes: GraphVisualNode[];
  edges: GraphVisualEdge[];
  startNodeId: string | null;
  currentNodeId: string | null;
  currentEdgeId: string | null;
  neighborNodeId: string | null;
  discoveredIds: string[];
  visitedIds: string[];
  visitOrder: string[];
  frontierKind: GraphVisualFrontierKind;
  frontierItems: GraphFrontierVisualItem[];
  frontierRemoved?: GraphFrontierVisualItem;
  frontierAdded?: GraphFrontierVisualItem;
  empty: boolean;
  label: string;
  width: number;
  height: number;
  /** Tight SVG viewport derived from the same frame's node/edge geometry. */
  viewBox: GraphViewBox;
  nodeRadius: number;
  /** Stage 7F weighted-graph metadata; absent on every BFS/DFS model. */
  weighted?: boolean;
  directed?: boolean;
  targetNodeId?: string | null;
  relax?: GraphRelaxVisualChange;
  pathNodeIds?: string[];
  pathEdgeIds?: string[];
  pathDistance?: number | null;
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
    directed: snapshot.directed === true,
  }));
  const viewBox = computeGraphViewBox(nodes, edges, layout.nodeRadius);

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
    viewBox,
    nodeRadius: layout.nodeRadius,
    ...(snapshot.directed === true ? { directed: true } : {}),
  };
}

/**
 * Stage 7F Dijkstra model. Every distance, previous pointer, heap entry and
 * path edge is copied from the ONE weighted-graph frame. There is no second
 * animation state here; sorting the heap for display never changes the data.
 */
export function buildWeightedGraphVisualModel(
  snapshot: WeightedGraphSnapshot,
  emptyLabel: string,
): GraphVisualModel | null {
  if (snapshot.kind !== 'weighted-graph' || snapshot.algorithm !== 'dijkstra') return null;

  const nodeIds = new Set<string>();
  const nodeById = new Map<string, WeightedGraphSnapshot['nodes'][number]>();
  for (const node of snapshot.nodes) {
    if (nodeIds.has(node.id)) return null;
    nodeIds.add(node.id);
    nodeById.set(node.id, node);
  }

  const edgeIds = new Set<string>();
  const edgeById = new Map<string, WeightedGraphSnapshot['edges'][number]>();
  for (const edge of snapshot.edges) {
    if (
      edgeIds.has(edge.id) ||
      !nodeIds.has(edge.fromId) ||
      !nodeIds.has(edge.toId) ||
      edge.fromId === edge.toId ||
      !Number.isFinite(edge.weight) ||
      edge.weight < 0
    ) {
      return null;
    }
    edgeIds.add(edge.id);
    edgeById.set(edge.id, edge);
  }

  const distanceById = new Map<string, number | null>();
  for (const row of snapshot.distances) {
    if (!nodeIds.has(row.nodeId) || distanceById.has(row.nodeId)) return null;
    if (row.distance !== null && (!Number.isFinite(row.distance) || row.distance < 0)) return null;
    distanceById.set(row.nodeId, row.distance);
  }
  if (distanceById.size !== nodeIds.size) return null;

  const previousById = new Map<string, string | null>();
  for (const row of snapshot.previous) {
    if (!nodeIds.has(row.nodeId) || previousById.has(row.nodeId)) return null;
    if (row.previousId !== null && !nodeIds.has(row.previousId)) return null;
    previousById.set(row.nodeId, row.previousId);
  }
  if (previousById.size !== nodeIds.size) return null;

  const pathNodeIds = snapshot.pathNodeIds ?? [];
  const pathSet = new Set(pathNodeIds);
  const pathEdges: string[] = [];
  for (let index = 0; index + 1 < pathNodeIds.length; index += 1) {
    const from = pathNodeIds[index];
    const to = pathNodeIds[index + 1];
    const edge = snapshot.edges.find((candidate) =>
      snapshot.directed
        ? candidate.fromId === from && candidate.toId === to
        : (candidate.fromId === from && candidate.toId === to) ||
          (candidate.fromId === to && candidate.toId === from),
    );
    if (!edge) return null;
    pathEdges.push(edge.id);
  }

  const layout = layoutGraph(snapshot.nodes, snapshot.edges);
  const positions = new Map(layout.nodes.map((node) => [node.id, node]));
  const degree = new Map<string, number>();
  for (const edge of snapshot.edges) {
    degree.set(edge.fromId, (degree.get(edge.fromId) ?? 0) + 1);
    if (!snapshot.directed) degree.set(edge.toId, (degree.get(edge.toId) ?? 0) + 1);
  }

  const visited = new Set(snapshot.visitedIds);
  const discovered = new Set(snapshot.discoveredIds);
  const frontierNodes = new Set(snapshot.frontierItems.map((item) => item.nodeId));
  const nodes: GraphVisualNode[] = [];
  for (const node of snapshot.nodes) {
    const position = positions.get(node.id);
    if (!position) return null;
    const distance = distanceById.get(node.id);
    if (distance === undefined) return null;
    const settled = visited.has(node.id);
    const state: GraphNodeVisualState = settled ? 'settled' : discovered.has(node.id) ? 'pending' : 'undiscovered';
    const visitIndex = snapshot.visitedIds.indexOf(node.id);
    nodes.push({
      id: node.id,
      label: valueText(node.value),
      x: position.x,
      y: position.y,
      state,
      start: node.id === snapshot.startNodeId,
      isolated: (degree.get(node.id) ?? 0) === 0,
      visited: settled,
      visitIndex: visitIndex >= 0 ? visitIndex + 1 : null,
      inFrontier: frontierNodes.has(node.id),
      distance,
      previousId: previousById.get(node.id) ?? null,
      settled,
      target: node.id === snapshot.targetNodeId,
      onPath: pathSet.has(node.id),
    });
  }

  const edges: GraphVisualEdge[] = layout.edges.map((edge) => ({
    ...edge,
    active: edge.id === snapshot.currentEdgeId,
    weight: edgeById.get(edge.id)?.weight,
    directed: snapshot.directed,
    onPath: pathEdges.includes(edge.id),
  }));
  const viewBox = computeGraphViewBox(nodes, edges, layout.nodeRadius);

  const itemOf = (item: WeightedGraphSnapshot['frontierItems'][number]): GraphFrontierVisualItem => ({
    id: item.id,
    nodeId: item.nodeId,
    label: nodeById.get(item.nodeId)?.value === undefined
      ? item.nodeId
      : valueText(nodeById.get(item.nodeId)?.value),
    distance: item.distance,
    stale: item.stale,
  });

  // Display order is priority order. The raw heap array is not a teaching
  // order; sorting a COPY keeps the frame data unchanged.
  const frontierItems = snapshot.frontierItems
    .map(itemOf)
    .sort((a, b) =>
      (a.distance ?? 0) - (b.distance ?? 0) ||
      a.nodeId.localeCompare(b.nodeId) ||
      a.id.localeCompare(b.id),
    );
  const frontierRemoved = snapshot.frontierRemoved ? itemOf(snapshot.frontierRemoved) : undefined;
  const frontierAdded = snapshot.frontierAdded ? itemOf(snapshot.frontierAdded) : undefined;

  return {
    kind: 'graph-traversal',
    algorithm: 'dijkstra',
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
    frontierKind: 'priority-queue',
    frontierItems,
    ...(frontierRemoved ? { frontierRemoved } : {}),
    ...(frontierAdded ? { frontierAdded } : {}),
    empty: nodes.length === 0,
    label: emptyLabel,
    width: layout.width,
    height: layout.height,
    viewBox,
    nodeRadius: layout.nodeRadius,
    weighted: true,
    directed: snapshot.directed,
    targetNodeId: snapshot.targetNodeId,
    ...(snapshot.relax
      ? {
          relax: {
            nodeId: snapshot.relax.nodeId,
            oldDistance: snapshot.relax.oldDistance,
            newDistance: snapshot.relax.newDistance,
            oldPreviousId: snapshot.relax.oldPreviousId,
            newPreviousId: snapshot.relax.newPreviousId,
          },
        }
      : {}),
    pathNodeIds: [...pathNodeIds],
    pathEdgeIds: pathEdges,
    pathDistance: snapshot.pathDistance,
  };
}
