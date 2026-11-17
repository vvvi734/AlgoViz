/**
 * G1 pure visual models for Floyd-Warshall and Bellman-Ford.
 *
 * The models copy every value from a single real Trace snapshot. They never
 * inspect messages, diff adjacent frames or maintain a second playback state.
 */
import type { BellmanFordSnapshot, FloydWarshallSnapshot } from '../trace/schema';
import { layoutGraph } from './graphLayout';

export interface ShortestPathNodeVisual {
  id: string;
  label: string;
  x: number;
  y: number;
  start: boolean;
  target: boolean;
  onPath: boolean;
  /** Floyd only: current roles k/i/j. */
  role: 'k' | 'i' | 'j' | null;
  /** Bellman-Ford only. */
  distance?: number | null;
  current?: boolean;
  neighbor?: boolean;
  cycle?: boolean;
}

export interface ShortestPathEdgeVisual {
  id: string;
  fromId: string;
  toId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  weight: number;
  directed: boolean;
  active: boolean;
  onPath: boolean;
}

export interface FloydMatrixCellVisual {
  rowNodeId: string;
  columnNodeId: string;
  value: number | null;
  previousId: string | null;
  current: boolean;
  diagonal: boolean;
  oldValue: number | null;
  newValue: number | null;
  updated: boolean;
}

export interface FloydMatrixRowVisual {
  rowNodeId: string;
  currentRow: boolean;
  cells: FloydMatrixCellVisual[];
}

export interface FloydVisualModel {
  kind: 'floyd-matrix';
  algorithm: 'floyd-warshall';
  operation: FloydWarshallSnapshot['operation'];
  nodes: ShortestPathNodeVisual[];
  edges: ShortestPathEdgeVisual[];
  width: number;
  height: number;
  nodeRadius: number;
  directed: boolean;
  empty: boolean;
  label: string;
  startNodeId: string | null;
  targetNodeId: string | null;
  kNodeId: string | null;
  iNodeId: string | null;
  jNodeId: string | null;
  rows: FloydMatrixRowVisual[];
  compare: {
    iNodeId: string;
    jNodeId: string;
    kNodeId: string;
    throughIK: number | null;
    throughKJ: number | null;
    candidate: number | null;
    oldDistance: number | null;
    newDistance: number | null;
    updated: boolean;
  } | null;
  negativeCycle: { hasCycle: boolean; nodeIds: string[] } | null;
  pathNodeIds: string[];
  pathDistance: number | null;
}

export interface BellmanDistanceRowVisual {
  nodeId: string;
  distance: number | null;
  previousId: string | null;
  updated: boolean;
  current: boolean;
  neighbor: boolean;
  cycle: boolean;
}

export interface BellmanVisualModel {
  kind: 'bellman-table';
  algorithm: 'bellman-ford';
  operation: BellmanFordSnapshot['operation'];
  nodes: ShortestPathNodeVisual[];
  edges: ShortestPathEdgeVisual[];
  width: number;
  height: number;
  nodeRadius: number;
  directed: boolean;
  empty: boolean;
  label: string;
  startNodeId: string | null;
  targetNodeId: string | null;
  round: number;
  maxRounds: number;
  currentEdgeId: string | null;
  currentNodeId: string | null;
  neighborNodeId: string | null;
  distances: BellmanDistanceRowVisual[];
  relax: BellmanFordSnapshot['relax'];
  updatedInRound: boolean;
  earlyExit: boolean;
  negativeCycle: { hasCycle: boolean; nodeIds: string[] } | null;
  pathNodeIds: string[];
  pathDistance: number | null;
}

function label(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

function pathEdgeKey(fromId: string, toId: string): string {
  return `${fromId}\u0000${toId}`;
}

function buildNodes(
  snapshot: FloydWarshallSnapshot | BellmanFordSnapshot,
  onPath: Set<string>,
): ShortestPathNodeVisual[] {
  const layout = layoutGraph(snapshot.nodes, snapshot.edges);
  return layout.nodes.map((node) => ({
    id: node.id,
    label: label(snapshot.nodes.find((item) => item.id === node.id)?.value ?? node.id),
    x: node.x,
    y: node.y,
    start: node.id === snapshot.startNodeId,
    target: node.id === snapshot.targetNodeId,
    onPath: onPath.has(node.id),
    role: null,
  }));
}

function buildEdges(
  snapshot: FloydWarshallSnapshot | BellmanFordSnapshot,
  onPath: Set<string>,
  activeKeys: Set<string>,
): ShortestPathEdgeVisual[] {
  const layout = layoutGraph(snapshot.nodes, snapshot.edges);
  return layout.edges.map((edge) => {
    const real = snapshot.edges.find((item) => item.id === edge.id);
    return {
      id: edge.id,
      fromId: edge.fromId,
      toId: edge.toId,
      x1: edge.x1,
      y1: edge.y1,
      x2: edge.x2,
      y2: edge.y2,
      weight: real?.weight ?? 0,
      directed: snapshot.directed,
      active: activeKeys.has(pathEdgeKey(edge.fromId, edge.toId)),
      onPath: onPath.has(edge.fromId) && onPath.has(edge.toId),
    };
  });
}

function geometry(snapshot: FloydWarshallSnapshot | BellmanFordSnapshot) {
  const layout = layoutGraph(snapshot.nodes, snapshot.edges);
  return { width: layout.width, height: layout.height, nodeRadius: layout.nodeRadius };
}

function isOnPath(pathNodeIds: string[]): Set<string> {
  return new Set(pathNodeIds);
}

/**
 * Build the Floyd matrix model. `k` is the current outer-loop intermediate
 * node; i/j are the current row/column. The matrix keeps every cell so the
 * learner can see one update in the context of the whole table.
 */
export function buildFloydVisualModel(
  snapshot: FloydWarshallSnapshot,
  emptyLabel: string,
): FloydVisualModel | null {
  if (snapshot.kind !== 'floyd-warshall') return null;
  const pathNodeIds = snapshot.pathNodeIds ?? [];
  const onPath = isOnPath(pathNodeIds);
  const nodes = buildNodes(snapshot, onPath).map((node) => ({
    ...node,
    role: node.id === snapshot.kNodeId ? 'k' as const
      : node.id === snapshot.iNodeId ? 'i' as const
      : node.id === snapshot.jNodeId ? 'j' as const
      : null,
  }));
  const activeKeys = new Set<string>();
  if (snapshot.compare) {
    activeKeys.add(pathEdgeKey(snapshot.compare.iNodeId, snapshot.compare.kNodeId));
    activeKeys.add(pathEdgeKey(snapshot.compare.kNodeId, snapshot.compare.jNodeId));
  }
  const cells = new Map<string, { value: number | null; previousId: string | null }>();
  snapshot.distances.forEach((cell) => cells.set(`${cell.fromId}\u0000${cell.toId}`, {
    value: cell.distance,
    previousId: null,
  }));
  snapshot.previous.forEach((cell) => {
    const existing = cells.get(`${cell.fromId}\u0000${cell.toId}`);
    if (existing) existing.previousId = cell.previousId;
  });
  const rows: FloydMatrixRowVisual[] = snapshot.nodes.map((rowNode) => ({
    rowNodeId: rowNode.id,
    currentRow: rowNode.id === snapshot.iNodeId,
    cells: snapshot.nodes.map((columnNode) => {
      const current = rowNode.id === snapshot.iNodeId && columnNode.id === snapshot.jNodeId;
      const cell = cells.get(`${rowNode.id}\u0000${columnNode.id}`);
      const compare = snapshot.compare;
      return {
        rowNodeId: rowNode.id,
        columnNodeId: columnNode.id,
        value: cell?.value ?? null,
        previousId: cell?.previousId ?? null,
        current,
        diagonal: rowNode.id === columnNode.id,
        oldValue: current && compare ? compare.oldDistance : null,
        newValue: current && compare ? compare.newDistance : null,
        updated: Boolean(current && compare?.updated),
      };
    }),
  }));
  return {
    kind: 'floyd-matrix',
    algorithm: 'floyd-warshall',
    operation: snapshot.operation,
    nodes,
    edges: buildEdges(snapshot, onPath, activeKeys),
    ...geometry(snapshot),
    directed: snapshot.directed,
    empty: snapshot.nodes.length === 0,
    label: emptyLabel,
    startNodeId: snapshot.startNodeId,
    targetNodeId: snapshot.targetNodeId,
    kNodeId: snapshot.kNodeId,
    iNodeId: snapshot.iNodeId,
    jNodeId: snapshot.jNodeId,
    rows,
    compare: snapshot.compare ? { ...snapshot.compare } : null,
    negativeCycle: snapshot.negativeCycle,
    pathNodeIds,
    pathDistance: snapshot.pathDistance,
  };
}

/**
 * Build the Bellman-Ford table model. The distance rows are already in node
 * order; `previous` points at the real predecessor, not a message-derived hint.
 */
export function buildBellmanVisualModel(
  snapshot: BellmanFordSnapshot,
  emptyLabel: string,
): BellmanVisualModel | null {
  if (snapshot.kind !== 'bellman-ford') return null;
  const pathNodeIds = snapshot.pathNodeIds ?? [];
  const onPath = isOnPath(pathNodeIds);
  const cycle = new Set(snapshot.negativeCycle?.nodeIds ?? []);
  const distances = new Map(snapshot.distances.map((cell) => [cell.toId, cell.distance]));
  const previous = new Map(snapshot.previous.map((cell) => [cell.toId, cell.previousId]));
  const activeKeys = new Set<string>();
  const currentEdge = snapshot.edges.find((edge) => edge.id === snapshot.currentEdgeId);
  if (currentEdge) activeKeys.add(pathEdgeKey(currentEdge.fromId, currentEdge.toId));
  const nodes = buildNodes(snapshot, onPath).map((node) => ({
    ...node,
    distance: distances.get(node.id) ?? null,
    current: node.id === snapshot.currentNodeId,
    neighbor: node.id === snapshot.neighborNodeId,
    cycle: cycle.has(node.id),
  }));
  const rows: BellmanDistanceRowVisual[] = snapshot.nodes.map((node) => ({
    nodeId: node.id,
    distance: distances.get(node.id) ?? null,
    previousId: previous.get(node.id) ?? null,
    updated: Boolean(snapshot.relax && snapshot.relax.nodeId === node.id),
    current: node.id === snapshot.currentNodeId,
    neighbor: node.id === snapshot.neighborNodeId,
    cycle: cycle.has(node.id),
  }));
  return {
    kind: 'bellman-table',
    algorithm: 'bellman-ford',
    operation: snapshot.operation,
    nodes,
    edges: buildEdges(snapshot, onPath, activeKeys),
    ...geometry(snapshot),
    directed: snapshot.directed,
    empty: snapshot.nodes.length === 0,
    label: emptyLabel,
    startNodeId: snapshot.startNodeId,
    targetNodeId: snapshot.targetNodeId,
    round: snapshot.round,
    maxRounds: snapshot.maxRounds,
    currentEdgeId: snapshot.currentEdgeId,
    currentNodeId: snapshot.currentNodeId,
    neighborNodeId: snapshot.neighborNodeId,
    distances: rows,
    relax: snapshot.relax,
    updatedInRound: snapshot.updatedInRound,
    earlyExit: snapshot.earlyExit,
    negativeCycle: snapshot.negativeCycle,
    pathNodeIds,
    pathDistance: snapshot.pathDistance,
  };
}
