/**
 * G2 pure visual models for Prim and Kruskal.
 *
 * The models are a direct projection of one validated MST snapshot: node/edge
 * identity, weights, tree membership, heap contents and union-find rows all
 * come from the Trace. No frame diffing, no guessed state and no second
 * playhead lives here.
 */
import type { KruskalMstSnapshot, PrimMstSnapshot } from '../trace/schema';
import { layoutGraph, type GraphLayoutEdge } from './graphLayout';

export type PrimEdgeState = 'idle' | 'candidate' | 'current' | 'selected' | 'skipped';
export type KruskalEdgeState = 'idle' | 'current' | 'selected' | 'rejected';

export interface MstEdgeVisual extends GraphLayoutEdge {
  weight: number;
  current: boolean;
}

export interface PrimEdgeVisual extends MstEdgeVisual {
  state: PrimEdgeState;
}

export interface KruskalEdgeVisual extends MstEdgeVisual {
  state: KruskalEdgeState;
  /** 1-based position in the real sorted edge order; null before `sort`. */
  rank: number | null;
}

export interface PrimNodeVisual {
  id: string;
  label: string;
  x: number;
  y: number;
  inTree: boolean;
  inComponent: boolean;
  start: boolean;
  isNew: boolean;
}

export interface KruskalNodeVisual {
  id: string;
  label: string;
  x: number;
  y: number;
  rootId: string;
  groupIndex: number;
  endpoint: boolean;
}

export interface PrimFrontierVisual {
  id: string;
  edgeId: string;
  fromId: string;
  toId: string;
  weight: number;
  active: boolean;
  minimum: boolean;
}

export interface PrimVisualModel {
  kind: 'prim-mst';
  operation: PrimMstSnapshot['operation'];
  nodes: PrimNodeVisual[];
  edges: PrimEdgeVisual[];
  startNodeId: string | null;
  treeNodeIds: string[];
  componentNodeIds: string[];
  visitOrder: string[];
  selectedEdgeIds: string[];
  skippedEdgeIds: string[];
  currentEdgeId: string | null;
  currentEdge: { edgeId: string; fromId: string; toId: string; weight: number } | null;
  selectedEdge: PrimMstSnapshot['selectedEdge'];
  frontierItems: PrimFrontierVisual[];
  frontierAddedId: string | null;
  frontierRemovedId: string | null;
  componentIndex: number;
  componentCount: number;
  selectedCount: number;
  skippedCount: number;
  totalWeight: number;
  connected: boolean;
  forest: boolean;
  empty: boolean;
  done: boolean;
  label: string;
  width: number;
  height: number;
  nodeRadius: number;
}

export interface KruskalSortedEdge {
  edgeId: string;
  rank: number;
  fromId: string;
  toId: string;
  weight: number;
  state: KruskalEdgeState;
  current: boolean;
}

export interface KruskalComponentVisual {
  rootId: string;
  nodeIds: string[];
  index: number;
  size: number;
}

export interface KruskalParentRow {
  nodeId: string;
  parentId: string;
  rootId: string;
  rank: number;
  root: boolean;
}

export interface KruskalVisualModel {
  kind: 'kruskal-mst';
  operation: KruskalMstSnapshot['operation'];
  nodes: KruskalNodeVisual[];
  edges: KruskalEdgeVisual[];
  sortedEdges: KruskalSortedEdge[];
  sortedEdgeIds: string[];
  currentIndex: number;
  currentEdgeId: string | null;
  currentEdge: KruskalSortedEdge | null;
  selectedEdgeIds: string[];
  rejectedEdgeIds: string[];
  parent: KruskalParentRow[];
  components: KruskalComponentVisual[];
  componentCount: number;
  formsCycle: boolean;
  union: KruskalMstSnapshot['union'];
  totalWeight: number;
  selectedCount: number;
  rejectedCount: number;
  connected: boolean;
  forest: boolean;
  empty: boolean;
  done: boolean;
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

export function buildPrimVisualModel(snapshot: PrimMstSnapshot, emptyLabel: string): PrimVisualModel | null {
  if (snapshot.kind !== 'prim-mst') return null;
  const nodeIds = new Set<string>();
  for (const node of snapshot.nodes) {
    if (nodeIds.has(node.id)) return null;
    nodeIds.add(node.id);
  }
  for (const edge of snapshot.edges) {
    if (!nodeIds.has(edge.fromId) || !nodeIds.has(edge.toId) || edge.fromId === edge.toId) return null;
  }
  if (snapshot.startNodeId !== null && !nodeIds.has(snapshot.startNodeId)) return null;
  if (snapshot.treeNodeIds.some((id) => !nodeIds.has(id))) return null;
  if (snapshot.frontierItems.some((entry) => !nodeIds.has(entry.fromId) || !nodeIds.has(entry.toId))) return null;

  const layout = layoutGraph(snapshot.nodes, snapshot.edges);
  const positions = new Map(layout.nodes.map((node) => [node.id, node]));
  const edgeById = new Map(snapshot.edges.map((edge) => [edge.id, edge]));
  const tree = new Set(snapshot.treeNodeIds);
  const component = new Set(snapshot.componentNodeIds);
  const selected = new Set(snapshot.selectedEdgeIds);
  const skipped = new Set(snapshot.skippedEdgeIds);
  const frontierEdgeIds = new Set(snapshot.frontierItems.map((entry) => entry.edgeId));

  const nodes: PrimNodeVisual[] = snapshot.nodes.map((node) => {
    const position = positions.get(node.id);
    if (!position) return { id: node.id, label: valueText(node.value), x: 0, y: 0, inTree: false, inComponent: false, start: false, isNew: false };
    return {
      id: node.id,
      label: valueText(node.value),
      x: position.x,
      y: position.y,
      inTree: tree.has(node.id),
      inComponent: component.has(node.id),
      start: node.id === snapshot.startNodeId,
      isNew: node.id === snapshot.selectedEdge?.newNodeId,
    };
  });

  const edges: PrimEdgeVisual[] = layout.edges.map((edge) => {
    const real = edgeById.get(edge.id);
    let state: PrimEdgeState = 'idle';
    if (selected.has(edge.id)) state = 'selected';
    else if (skipped.has(edge.id)) state = 'skipped';
    else if (edge.id === snapshot.currentEdgeId) state = 'current';
    else if (frontierEdgeIds.has(edge.id)) state = 'candidate';
    return {
      ...edge,
      weight: real?.weight ?? 0,
      current: edge.id === snapshot.currentEdgeId,
      state,
    };
  });

  const frontierItems: PrimFrontierVisual[] = snapshot.frontierItems.map((entry, index) => ({
    ...entry,
    active: entry.id === snapshot.frontierAdded?.id,
    minimum: index === 0,
  }));

  const selectedEdge = snapshot.selectedEdge;
  const currentEdgeReal = snapshot.currentEdgeId ? edgeById.get(snapshot.currentEdgeId) : undefined;

  return {
    kind: 'prim-mst',
    operation: snapshot.operation,
    nodes,
    edges,
    startNodeId: snapshot.startNodeId,
    treeNodeIds: snapshot.treeNodeIds,
    componentNodeIds: snapshot.componentNodeIds,
    visitOrder: snapshot.visitOrder,
    selectedEdgeIds: snapshot.selectedEdgeIds,
    skippedEdgeIds: snapshot.skippedEdgeIds,
    currentEdgeId: snapshot.currentEdgeId,
    selectedEdge: selectedEdge
      ? {
          edgeId: selectedEdge.edgeId,
          fromId: selectedEdge.fromId,
          toId: selectedEdge.toId,
          weight: selectedEdge.weight,
          newNodeId: selectedEdge.newNodeId,
        }
      : null,
    currentEdge: currentEdgeReal
      ? {
          edgeId: currentEdgeReal.id,
          fromId: currentEdgeReal.fromId,
          toId: currentEdgeReal.toId,
          weight: currentEdgeReal.weight,
        }
      : null,
    frontierItems,
    frontierAddedId: snapshot.frontierAdded?.id ?? null,
    frontierRemovedId: snapshot.frontierRemoved?.id ?? null,
    componentIndex: snapshot.componentIndex,
    componentCount: snapshot.componentCount,
    selectedCount: snapshot.selectedEdgeIds.length,
    skippedCount: snapshot.skippedEdgeIds.length,
    totalWeight: snapshot.totalWeight,
    connected: snapshot.connected,
    forest: snapshot.forest,
    empty: snapshot.nodes.length === 0,
    done: snapshot.operation === 'done',
    label: snapshot.nodes.length === 0 ? emptyLabel : 'Prim',
    width: layout.width,
    height: layout.height,
    nodeRadius: layout.nodeRadius,
  };
}

export function buildKruskalVisualModel(
  snapshot: KruskalMstSnapshot,
  emptyLabel: string,
): KruskalVisualModel | null {
  if (snapshot.kind !== 'kruskal-mst') return null;
  const nodeIds = new Set<string>();
  for (const node of snapshot.nodes) {
    if (nodeIds.has(node.id)) return null;
    nodeIds.add(node.id);
  }
  for (const edge of snapshot.edges) {
    if (!nodeIds.has(edge.fromId) || !nodeIds.has(edge.toId) || edge.fromId === edge.toId) return null;
  }
  if (snapshot.parent.some((row) => !nodeIds.has(row.nodeId) || !nodeIds.has(row.parentId))) return null;
  if (snapshot.sortedEdgeIds.some((id) => !snapshot.edges.some((edge) => edge.id === id))) return null;

  const layout = layoutGraph(snapshot.nodes, snapshot.edges);
  const positions = new Map(layout.nodes.map((node) => [node.id, node]));
  const edgeById = new Map(snapshot.edges.map((edge) => [edge.id, edge]));
  const rowByNode = new Map(snapshot.parent.map((row) => [row.nodeId, row]));
  const selected = new Set(snapshot.selectedEdgeIds);
  const rejected = new Set(snapshot.rejectedEdgeIds);
  const sortedRank = new Map(snapshot.sortedEdgeIds.map((id, index) => [id, index + 1]));
  const componentIndexByRoot = new Map<string, number>();
  const rootOrder: string[] = [];
  for (const node of snapshot.nodes) {
    const root = rowByNode.get(node.id)?.rootId;
    if (root && !componentIndexByRoot.has(root)) {
      componentIndexByRoot.set(root, rootOrder.length);
      rootOrder.push(root);
    }
  }

  const nodes: KruskalNodeVisual[] = snapshot.nodes.map((node) => {
    const position = positions.get(node.id);
    const row = rowByNode.get(node.id);
    if (!position || !row) return { id: node.id, label: valueText(node.value), x: 0, y: 0, rootId: node.id, groupIndex: 0, endpoint: false };
    const endpoint = Boolean(
      snapshot.currentEdgeId &&
      edgeById.get(snapshot.currentEdgeId) &&
      [edgeById.get(snapshot.currentEdgeId)?.fromId, edgeById.get(snapshot.currentEdgeId)?.toId].includes(node.id),
    );
    return {
      id: node.id,
      label: valueText(node.value),
      x: position.x,
      y: position.y,
      rootId: row.rootId,
      groupIndex: componentIndexByRoot.get(row.rootId) ?? 0,
      endpoint,
    };
  });

  const edges: KruskalEdgeVisual[] = layout.edges.map((edge) => {
    const real = edgeById.get(edge.id);
    let state: KruskalEdgeState = 'idle';
    if (selected.has(edge.id)) state = 'selected';
    else if (rejected.has(edge.id)) state = 'rejected';
    else if (edge.id === snapshot.currentEdgeId) state = 'current';
    return {
      ...edge,
      weight: real?.weight ?? 0,
      current: edge.id === snapshot.currentEdgeId,
      state,
      rank: sortedRank.get(edge.id) ?? null,
    };
  });

  const sortedEdges: KruskalSortedEdge[] = snapshot.sortedEdgeIds
    .map((id, index) => {
      const edge = edgeById.get(id);
      if (!edge) return null;
      let state: KruskalEdgeState = 'idle';
      if (selected.has(id)) state = 'selected';
      else if (rejected.has(id)) state = 'rejected';
      else if (id === snapshot.currentEdgeId) state = 'current';
      return {
        edgeId: id,
        rank: index + 1,
        fromId: edge.fromId,
        toId: edge.toId,
        weight: edge.weight,
        state,
        current: id === snapshot.currentEdgeId,
      };
    })
    .filter((edge): edge is KruskalSortedEdge => edge !== null);

  const components: KruskalComponentVisual[] = [];
  for (const root of rootOrder) {
    const members = snapshot.parent.filter((row) => row.rootId === root).map((row) => row.nodeId);
    components.push({ rootId: root, nodeIds: members, index: components.length, size: members.length });
  }

  return {
    kind: 'kruskal-mst',
    operation: snapshot.operation,
    nodes,
    edges,
    sortedEdges,
    sortedEdgeIds: snapshot.sortedEdgeIds,
    currentIndex: snapshot.currentIndex,
    currentEdgeId: snapshot.currentEdgeId,
    currentEdge: sortedEdges.find((edge) => edge.current) ?? null,
    selectedEdgeIds: snapshot.selectedEdgeIds,
    rejectedEdgeIds: snapshot.rejectedEdgeIds,
    parent: snapshot.parent.map((row) => ({
      nodeId: row.nodeId,
      parentId: row.parentId,
      rootId: row.rootId,
      rank: row.rank,
      root: row.parentId === row.nodeId,
    })),
    components,
    componentCount: snapshot.componentCount,
    formsCycle: snapshot.formsCycle,
    union: snapshot.union,
    totalWeight: snapshot.totalWeight,
    selectedCount: snapshot.selectedEdgeIds.length,
    rejectedCount: snapshot.rejectedEdgeIds.length,
    connected: snapshot.connected,
    forest: snapshot.forest,
    empty: snapshot.nodes.length === 0,
    done: snapshot.operation === 'done',
    label: snapshot.nodes.length === 0 ? emptyLabel : 'Kruskal',
    width: layout.width,
    height: layout.height,
    nodeRadius: layout.nodeRadius,
  };
}
