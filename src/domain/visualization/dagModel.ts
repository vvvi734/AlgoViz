/**
 * G3 pure visual models for Kahn topological sort and AOE critical path.
 *
 * Both models are a direct projection of ONE validated snapshot. Layout is
 * deterministic and topology-driven: sources sit on the left, successors move
 * right by longest-path level, so the same graph never moves between frames.
 * No frame diffing, no second playhead and no message parsing lives here.
 */
import type { CriticalPathSnapshot, TopologicalSortSnapshot } from '../trace/schema';
import {
  GRAPH_LAYOUT_HEIGHT,
  GRAPH_LAYOUT_WIDTH,
  GRAPH_NODE_RADIUS,
  layoutGraph,
  type GraphLayoutEdge,
} from './graphLayout';

export type TopologicalEdgeState = 'idle' | 'current' | 'removed';
export type CriticalEdgeState = 'idle' | 'current' | 'critical' | 'slack' | 'path';

export interface DagNodeVisual {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface DagLayout {
  width: number;
  height: number;
  nodeRadius: number;
  nodes: DagNodeVisual[];
  edges: GraphLayoutEdge[];
}

interface DagInputEdge {
  id: string;
  fromId: string;
  toId: string;
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
 * Layered DAG layout. Kahn's order is used only to assign longest-path levels;
 * every coordinate is a pure function of the graph, not of the current frame.
 * A cyclic graph falls back to the shared circular layout so cycle frames still
 * render without inventing a topological order.
 */
export function layoutDag(nodes: Array<{ id: string; value?: unknown }>, edges: DagInputEdge[]): DagLayout {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const indegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();
  nodes.forEach((node) => {
    indegree.set(node.id, 0);
    adjacency.set(node.id, []);
  });
  const validEdges = edges.filter((edge) => nodeIds.has(edge.fromId) && nodeIds.has(edge.toId) && edge.fromId !== edge.toId);
  validEdges.forEach((edge) => {
    indegree.set(edge.toId, (indegree.get(edge.toId) ?? 0) + 1);
    adjacency.get(edge.fromId)?.push(edge.toId);
  });
  const queue = nodes.filter((node) => (indegree.get(node.id) ?? 0) === 0).map((node) => node.id);
  const topo: string[] = [];
  while (queue.length) {
    const current = queue.shift();
    if (current === undefined) break;
    topo.push(current);
    for (const next of adjacency.get(current) ?? []) {
      const remaining = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, remaining);
      if (remaining === 0) queue.push(next);
    }
  }
  if (topo.length !== nodes.length) {
    const fallback = layoutGraph(nodes, edges);
    return {
      width: fallback.width,
      height: fallback.height,
      nodeRadius: fallback.nodeRadius,
      nodes: fallback.nodes.map((node) => ({
        id: node.id,
        label: valueText(nodes.find((candidate) => candidate.id === node.id)?.value ?? node.id),
        x: node.x,
        y: node.y,
      })),
      edges: fallback.edges,
    };
  }

  const level = new Map<string, number>();
  nodes.forEach((node) => level.set(node.id, 0));
  for (const id of topo) {
    for (const next of adjacency.get(id) ?? []) {
      level.set(next, Math.max(level.get(next) ?? 0, (level.get(id) ?? 0) + 1));
    }
  }
  const maxLevel = Math.max(0, ...Array.from(level.values()));
  const groups = new Map<number, string[]>();
  nodes.forEach((node) => {
    const bucket = level.get(node.id) ?? 0;
    const list = groups.get(bucket) ?? [];
    list.push(node.id);
    groups.set(bucket, list);
  });

  const left = 54;
  const right = GRAPH_LAYOUT_WIDTH - 54;
  const xFor = (bucket: number): number => (maxLevel === 0 ? GRAPH_LAYOUT_WIDTH / 2 : left + (right - left) * (bucket / maxLevel));
  const nodesVisual: DagNodeVisual[] = [];
  for (const node of nodes) {
    const bucket = level.get(node.id) ?? 0;
    const list = groups.get(bucket) ?? [node.id];
    const index = list.indexOf(node.id);
    const count = list.length;
    const availableTop = 54;
    const availableBottom = GRAPH_LAYOUT_HEIGHT - 54;
    const y = count === 1
      ? GRAPH_LAYOUT_HEIGHT / 2
      : availableTop + ((availableBottom - availableTop) * index) / (count - 1);
    nodesVisual.push({
      id: node.id,
      label: valueText(node.value ?? node.id),
      x: Math.round(xFor(bucket)),
      y: Math.round(y),
    });
  }
  const byId = new Map(nodesVisual.map((node) => [node.id, node]));
  const trim = (from: DagNodeVisual, to: DagNodeVisual): { x1: number; y1: number; x2: number; y2: number } => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy);
    if (length < 1) return { x1: from.x, y1: from.y, x2: to.x, y2: to.y };
    const trimBy = Math.min(GRAPH_NODE_RADIUS + 3, length / 2 - 1);
    const ux = dx / length;
    const uy = dy / length;
    return {
      x1: Math.round(from.x + ux * trimBy),
      y1: Math.round(from.y + uy * trimBy),
      x2: Math.round(to.x - ux * trimBy),
      y2: Math.round(to.y - uy * trimBy),
    };
  };
  const edgeVisual: GraphLayoutEdge[] = validEdges.flatMap((edge) => {
    const from = byId.get(edge.fromId);
    const to = byId.get(edge.toId);
    if (!from || !to) return [];
    return [{ id: edge.id, fromId: edge.fromId, toId: edge.toId, ...trim(from, to) }];
  });
  return {
    width: GRAPH_LAYOUT_WIDTH,
    height: GRAPH_LAYOUT_HEIGHT,
    nodeRadius: GRAPH_NODE_RADIUS,
    nodes: nodesVisual,
    edges: edgeVisual,
  };
}

export interface TopologicalNodeVisual extends DagNodeVisual {
  indegree: number;
  inQueue: boolean;
  processed: boolean;
  current: boolean;
  cycle: boolean;
  source: boolean;
  sink: boolean;
}

export interface TopologicalEdgeVisual extends GraphLayoutEdge {
  state: TopologicalEdgeState;
  current: boolean;
  removed: boolean;
  neighbor: boolean;
}

export interface TopologicalQueueVisual {
  id: string;
  nodeId: string;
  label: string;
  added: boolean;
  removed: boolean;
}

export interface TopologicalVisualModel {
  kind: 'topological-sort';
  operation: TopologicalSortSnapshot['operation'];
  nodes: TopologicalNodeVisual[];
  edges: TopologicalEdgeVisual[];
  queue: TopologicalQueueVisual[];
  queueAdded: TopologicalQueueVisual | null;
  queueRemoved: TopologicalQueueVisual | null;
  currentNodeId: string | null;
  currentEdgeId: string | null;
  neighborNodeId: string | null;
  indegreeChange: TopologicalSortSnapshot['indegreeChange'];
  indegreeRows: TopologicalSortSnapshot['indegree'];
  removedEdgeIds: string[];
  topologicalOrder: string[];
  hasCycle: boolean;
  cycleNodeIds: string[];
  empty: boolean;
  done: boolean;
  label: string;
  width: number;
  height: number;
  nodeRadius: number;
}

export function buildTopologicalVisualModel(snapshot: TopologicalSortSnapshot, emptyLabel: string): TopologicalVisualModel | null {
  if (snapshot.kind !== 'topological-sort') return null;
  const ids = new Set(snapshot.nodes.map((node) => node.id));
  if (ids.size !== snapshot.nodes.length) return null;
  for (const edge of snapshot.edges) {
    if (!ids.has(edge.fromId) || !ids.has(edge.toId) || edge.fromId === edge.toId) return null;
  }
  const layout = layoutDag(snapshot.nodes, snapshot.edges);
  const positions = new Map(layout.nodes.map((node) => [node.id, node]));
  const indegree = new Map(snapshot.indegree.map((row) => [row.nodeId, row.indegree]));
  const queueIds = new Map(snapshot.queue.map((item) => [item.nodeId, item.id]));
  const processed = new Set(snapshot.topologicalOrder);
  const removed = new Set(snapshot.removedEdgeIds);
  const cycle = new Set(snapshot.cycleNodeIds);
  const outgoing = new Set<string>();
  const incoming = new Set<string>();
  snapshot.edges.forEach((edge) => {
    outgoing.add(edge.fromId);
    incoming.add(edge.toId);
  });
  const nodes: TopologicalNodeVisual[] = snapshot.nodes.map((node) => {
    const position = positions.get(node.id);
    return {
      id: node.id,
      label: valueText(node.value),
      x: position?.x ?? 0,
      y: position?.y ?? 0,
      indegree: indegree.get(node.id) ?? 0,
      inQueue: queueIds.has(node.id),
      processed: processed.has(node.id),
      current: snapshot.currentNodeId === node.id,
      cycle: cycle.has(node.id),
      source: !incoming.has(node.id),
      sink: !outgoing.has(node.id),
    };
  });
  const edges: TopologicalEdgeVisual[] = layout.edges.map((edge) => {
    const isCurrent = edge.id === snapshot.currentEdgeId;
    const isRemoved = removed.has(edge.id);
    return {
      ...edge,
      state: isCurrent ? 'current' : isRemoved ? 'removed' : 'idle',
      current: isCurrent,
      removed: isRemoved,
      neighbor: snapshot.neighborNodeId !== null && edge.toId === snapshot.neighborNodeId,
    };
  });
  const queue = snapshot.queue.map((item) => ({
    id: item.id,
    nodeId: item.nodeId,
    label: snapshot.nodes.find((node) => node.id === item.nodeId)?.value !== undefined
      ? valueText(snapshot.nodes.find((node) => node.id === item.nodeId)?.value)
      : item.nodeId,
    added: snapshot.queueAdded?.id === item.id,
    removed: false,
  }));
  const queueAdded = snapshot.queueAdded
    ? queue.find((item) => item.id === snapshot.queueAdded?.id) ?? {
        id: snapshot.queueAdded.id,
        nodeId: snapshot.queueAdded.nodeId,
        label: valueText(snapshot.nodes.find((node) => node.id === snapshot.queueAdded?.nodeId)?.value ?? snapshot.queueAdded.nodeId),
        added: true,
        removed: false,
      }
    : null;
  const queueRemoved = snapshot.queueRemoved
    ? {
        id: snapshot.queueRemoved.id,
        nodeId: snapshot.queueRemoved.nodeId,
        label: valueText(snapshot.nodes.find((node) => node.id === snapshot.queueRemoved?.nodeId)?.value ?? snapshot.queueRemoved.nodeId),
        added: false,
        removed: true,
      }
    : null;

  return {
    kind: 'topological-sort',
    operation: snapshot.operation,
    nodes,
    edges,
    queue,
    queueAdded,
    queueRemoved,
    currentNodeId: snapshot.currentNodeId,
    currentEdgeId: snapshot.currentEdgeId,
    neighborNodeId: snapshot.neighborNodeId,
    indegreeChange: snapshot.indegreeChange,
    indegreeRows: snapshot.indegree,
    removedEdgeIds: snapshot.removedEdgeIds,
    topologicalOrder: snapshot.topologicalOrder,
    hasCycle: snapshot.hasCycle,
    cycleNodeIds: snapshot.cycleNodeIds,
    empty: nodes.length === 0,
    done: snapshot.operation === 'done',
    label: emptyLabel,
    width: layout.width,
    height: layout.height,
    nodeRadius: layout.nodeRadius,
  };
}

export interface CriticalNodeVisual extends DagNodeVisual {
  ve: number | null;
  vl: number | null;
  inTopo: boolean;
  current: boolean;
  source: boolean;
  sink: boolean;
  cycle: boolean;
}

export interface CriticalActivityVisual {
  edgeId: string;
  fromId: string;
  toId: string;
  duration: number;
  e: number | null;
  l: number | null;
  slack: number | null;
  critical: boolean;
  current: boolean;
}

export interface CriticalEdgeVisual extends GraphLayoutEdge {
  duration: number;
  state: CriticalEdgeState;
  current: boolean;
  critical: boolean;
  onPath: boolean;
  activity: CriticalActivityVisual | null;
}

export interface CriticalVisualModel {
  kind: 'critical-path';
  operation: CriticalPathSnapshot['operation'];
  phase: CriticalPathSnapshot['phase'];
  nodes: CriticalNodeVisual[];
  edges: CriticalEdgeVisual[];
  activities: CriticalActivityVisual[];
  topologicalOrder: string[];
  sourceNodeIds: string[];
  sinkNodeIds: string[];
  currentNodeId: string | null;
  currentEdgeId: string | null;
  timeChange: CriticalPathSnapshot['timeChange'];
  activityChange: CriticalPathSnapshot['activityChange'];
  criticalEdgeIds: string[];
  criticalPaths: string[][];
  projectDuration: number | null;
  hasCycle: boolean;
  cycleNodeIds: string[];
  empty: boolean;
  done: boolean;
  label: string;
  width: number;
  height: number;
  nodeRadius: number;
}

export function buildCriticalVisualModel(snapshot: CriticalPathSnapshot, emptyLabel: string): CriticalVisualModel | null {
  if (snapshot.kind !== 'critical-path') return null;
  const ids = new Set(snapshot.nodes.map((node) => node.id));
  if (ids.size !== snapshot.nodes.length) return null;
  for (const edge of snapshot.edges) {
    if (!ids.has(edge.fromId) || !ids.has(edge.toId) || edge.fromId === edge.toId) return null;
    if (!Number.isFinite(edge.duration) || edge.duration < 0) return null;
  }
  const layout = layoutDag(snapshot.nodes, snapshot.edges);
  const positions = new Map(layout.nodes.map((node) => [node.id, node]));
  const veRows = new Map(snapshot.veRows.map((row) => [row.nodeId, row.time]));
  const vlRows = new Map(snapshot.vlRows.map((row) => [row.nodeId, row.time]));
  const topo = new Set(snapshot.topologicalOrder);
  const sources = new Set(snapshot.sourceNodeIds);
  const sinks = new Set(snapshot.sinkNodeIds);
  const cycle = new Set(snapshot.cycleNodeIds);
  const pathEdges = new Set<string>();
  snapshot.criticalPaths.forEach((path) => {
    for (let index = 0; index + 1 < path.length; index += 1) {
      const edge = snapshot.edges.find((candidate) => candidate.fromId === path[index] && candidate.toId === path[index + 1]);
      if (edge) pathEdges.add(edge.id);
    }
  });
  const activities: CriticalActivityVisual[] = snapshot.activities.map((row) => ({
    ...row,
    current: row.edgeId === snapshot.currentEdgeId,
  }));
  const activityByEdge = new Map(activities.map((row) => [row.edgeId, row]));
  const nodes: CriticalNodeVisual[] = snapshot.nodes.map((node) => {
    const position = positions.get(node.id);
    return {
      id: node.id,
      label: valueText(node.value),
      x: position?.x ?? 0,
      y: position?.y ?? 0,
      ve: veRows.get(node.id) ?? null,
      vl: vlRows.get(node.id) ?? null,
      inTopo: topo.has(node.id),
      current: snapshot.currentNodeId === node.id,
      source: sources.has(node.id),
      sink: sinks.has(node.id),
      cycle: cycle.has(node.id),
    };
  });
  const criticalIds = new Set(snapshot.criticalEdgeIds);
  const edges: CriticalEdgeVisual[] = layout.edges.map((edge) => {
    const activity = activityByEdge.get(edge.id) ?? null;
    const isCurrent = edge.id === snapshot.currentEdgeId;
    const isPath = pathEdges.has(edge.id);
    const state: CriticalEdgeState = isCurrent
      ? 'current'
      : isPath
        ? 'path'
        : criticalIds.has(edge.id)
          ? 'critical'
          : activity && activity.slack !== null
            ? 'slack'
            : 'idle';
    return {
      ...edge,
      duration: snapshot.edges.find((candidate) => candidate.id === edge.id)?.duration ?? 0,
      state,
      current: isCurrent,
      critical: criticalIds.has(edge.id),
      onPath: isPath,
      activity,
    };
  });

  return {
    kind: 'critical-path',
    operation: snapshot.operation,
    phase: snapshot.phase,
    nodes,
    edges,
    activities,
    topologicalOrder: snapshot.topologicalOrder,
    sourceNodeIds: snapshot.sourceNodeIds,
    sinkNodeIds: snapshot.sinkNodeIds,
    currentNodeId: snapshot.currentNodeId,
    currentEdgeId: snapshot.currentEdgeId,
    timeChange: snapshot.timeChange,
    activityChange: snapshot.activityChange,
    criticalEdgeIds: snapshot.criticalEdgeIds,
    criticalPaths: snapshot.criticalPaths,
    projectDuration: snapshot.projectDuration,
    hasCycle: snapshot.hasCycle,
    cycleNodeIds: snapshot.cycleNodeIds,
    empty: nodes.length === 0,
    done: snapshot.operation === 'done',
    label: emptyLabel,
    width: layout.width,
    height: layout.height,
    nodeRadius: layout.nodeRadius,
  };
}
