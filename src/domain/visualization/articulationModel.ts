/**
 * TEXTBOOK-07 pure model for the articulation-point trace.
 *
 * The model reads only the current validated snapshot: disc/low tables, DFS
 * stack, tree/back/bridge edge sets and the cut-vertex set. It never replays
 * prior frames or infers an edge class from colour alone.
 */
import type { ArticulationSnapshot } from '../trace/schema';
import { layoutGraph, type GraphLayoutEdge, type GraphNodePositions } from './graphLayout';

export const ARTICULATION_NODE_RADIUS = 26;

/** Official A–H teaching graph: two triangles joined by bridge C–D, plus G–H. */
export const ARTICULATION_GRAPH_POSITIONS: GraphNodePositions = {
  A: { x: 170, y: 80 },
  B: { x: 75, y: 170 },
  C: { x: 260, y: 180 },
  D: { x: 405, y: 180 },
  E: { x: 535, y: 80 },
  F: { x: 535, y: 200 },
  G: { x: 95, y: 305 },
  H: { x: 240, y: 315 },
};

export type ArticulationNodeState = 'undiscovered' | 'discovered' | 'finished';

export interface ArticulationNodeVisual {
  id: string;
  label: string;
  x: number;
  y: number;
  state: ArticulationNodeState;
  disc: number;
  low: number;
  parentId: string | null;
  root: boolean;
  cut: boolean;
  current: boolean;
  onStack: boolean;
}

export interface ArticulationEdgeVisual extends GraphLayoutEdge {
  tree: boolean;
  back: boolean;
  bridge: boolean;
  active: boolean;
  state: 'idle' | 'tree' | 'back' | 'bridge';
}

export interface ArticulationFrontierItemVisual {
  id: string;
  nodeId: string;
  label: string;
  added: boolean;
}

export interface ArticulationVisualModel {
  kind: 'articulation';
  operation: ArticulationSnapshot['operation'];
  decision: ArticulationSnapshot['decision'];
  width: number;
  height: number;
  nodeRadius: number;
  nodes: ArticulationNodeVisual[];
  edges: ArticulationEdgeVisual[];
  frontierItems: ArticulationFrontierItemVisual[];
  frontierAdded: ArticulationFrontierItemVisual | null;
  frontierRemoved: ArticulationFrontierItemVisual | null;
  currentNodeId: string | null;
  currentEdgeId: string | null;
  neighborNodeId: string | null;
  rootId: string | null;
  rootChildCount: number;
  discOrder: string[];
  articulationIds: string[];
  bridgeIds: string[];
  done: boolean;
  empty: boolean;
}

function officialPositions(nodes: ArticulationSnapshot['nodes']): GraphNodePositions | undefined {
  return nodes.length === 8 && nodes.every((node) => node.id in ARTICULATION_GRAPH_POSITIONS)
    ? ARTICULATION_GRAPH_POSITIONS
    : undefined;
}

function frontierItem(
  item: { id: string; nodeId: string },
  addedId: string | undefined,
): ArticulationFrontierItemVisual {
  return {
    id: item.id,
    nodeId: item.nodeId,
    label: item.nodeId,
    added: item.id === addedId,
  };
}

export function buildArticulationVisualModel(
  snapshot: ArticulationSnapshot,
): ArticulationVisualModel {
  const layout = layoutGraph(
    snapshot.nodes,
    snapshot.edges,
    ARTICULATION_NODE_RADIUS,
    officialPositions(snapshot.nodes),
  );
  const disc = new Map(snapshot.disc.map((record) => [record.nodeId, record.value]));
  const low = new Map(snapshot.low.map((record) => [record.nodeId, record.value]));
  const parents = new Map(snapshot.parents.map((record) => [record.nodeId, record.parentId]));
  const tree = new Set(snapshot.treeEdgeIds);
  const back = new Set(snapshot.backEdgeIds);
  const bridges = new Set(snapshot.bridgeIds);
  const cuts = new Set(snapshot.articulationIds);
  const onStack = new Set(snapshot.frontierItems.map((item) => item.nodeId));
  const addedId = snapshot.frontierAdded?.id;
  const frontierAdded = snapshot.frontierAdded
    ? frontierItem(snapshot.frontierAdded, addedId)
    : null;
  const frontierRemoved = snapshot.frontierRemoved
    ? frontierItem(snapshot.frontierRemoved, undefined)
    : null;

  const edges: ArticulationEdgeVisual[] = layout.edges.map((edge) => {
    const isTree = tree.has(edge.id);
    const isBack = back.has(edge.id);
    const isBridge = bridges.has(edge.id);
    return {
      ...edge,
      tree: isTree,
      back: isBack,
      bridge: isBridge,
      active: edge.id === snapshot.currentEdgeId,
      state: isBridge ? 'bridge' : isBack ? 'back' : isTree ? 'tree' : 'idle',
    };
  });

  return {
    kind: 'articulation',
    operation: snapshot.operation,
    decision: snapshot.decision,
    width: layout.width,
    height: layout.height,
    nodeRadius: layout.nodeRadius,
    nodes: layout.nodes.map((node) => {
      const discValue = disc.get(node.id) ?? 0;
      const lowValue = low.get(node.id) ?? 0;
      const state: ArticulationNodeState =
        discValue === 0 ? 'undiscovered' : onStack.has(node.id) ? 'discovered' : 'finished';
      return {
        ...node,
        label: node.id,
        state,
        disc: discValue,
        low: lowValue,
        parentId: parents.get(node.id) ?? null,
        root: node.id === snapshot.rootId,
        cut: cuts.has(node.id),
        current: node.id === snapshot.currentNodeId,
        onStack: onStack.has(node.id),
      };
    }),
    edges,
    frontierItems: snapshot.frontierItems.map((item) => frontierItem(item, addedId)),
    frontierAdded,
    frontierRemoved,
    currentNodeId: snapshot.currentNodeId,
    currentEdgeId: snapshot.currentEdgeId,
    neighborNodeId: snapshot.neighborNodeId,
    rootId: snapshot.rootId,
    rootChildCount: snapshot.rootChildCount,
    discOrder: snapshot.dfsOrder,
    articulationIds: snapshot.articulationIds,
    bridgeIds: snapshot.bridgeIds,
    done: snapshot.operation === 'done',
    empty: snapshot.nodes.length === 0,
  };
}
