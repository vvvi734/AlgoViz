/**
 * G4 pure visual models for connected components and Kosaraju SCC.
 *
 * These functions only transform the current trace snapshot. They never
 * advance a frame, guess a group or depend on the wall clock, so the graph,
 * component tables, finish-order list and stack all describe the same frame.
 */
import type {
  ConnectedComponentsSnapshot,
  KosarajuSnapshot,
} from '../trace/schema';
import { layoutGraph, type GraphLayoutEdge, type GraphNodePositions } from './graphLayout';

/**
 * Kosaraju uses a dedicated eight-node teaching layout. The shared A–G positions
 * do not cover H, so without this the official graph fell back to a small circle
 * and wasted most of a desktop canvas. The coordinates stay fixed across every
 * frame, just like the other deterministic layouts.
 */
export const SCC_NODE_RADIUS = 30;

export const SCC_GRAPH_POSITIONS: GraphNodePositions = {
  A: { x: 290, y: 65 },
  B: { x: 115, y: 125 },
  C: { x: 420, y: 125 },
  D: { x: 150, y: 300 },
  E: { x: 320, y: 300 },
  F: { x: 505, y: 65 },
  G: { x: 535, y: 235 },
  H: { x: 445, y: 325 },
};

function kosarajuPositions(
  nodes: KosarajuSnapshot['nodes'],
): GraphNodePositions | undefined {
  const officialEight = nodes.length === 8 && nodes.every((node) => node.id in SCC_GRAPH_POSITIONS);
  return officialEight ? SCC_GRAPH_POSITIONS : undefined;
}

export type ComponentNodeState = 'undiscovered' | 'discovered' | 'visited' | 'finished' | 'assigned';

export interface ComponentGraphNodeVisual {
  id: string;
  label: string;
  x: number;
  y: number;
  state: ComponentNodeState;
  componentId: number | null;
  current: boolean;
  start: boolean;
  inFrontier: boolean;
  finishIndex: number | null;
}

export interface ComponentEdgeVisual extends GraphLayoutEdge {
  originalFromId: string;
  originalToId: string;
  active: boolean;
  reversed: boolean;
  directed: boolean;
  state: 'idle' | 'current' | 'reversed';
}

export interface ComponentGroupVisual {
  id: number;
  nodeIds: string[];
  complete: boolean;
  current: boolean;
}

export interface ComponentFrontierItemVisual {
  id: string;
  nodeId: string;
  label: string;
  added: boolean;
}

export interface ConnectedComponentsVisualModel {
  kind: 'connected-components';
  operation: ConnectedComponentsSnapshot['operation'];
  width: number;
  height: number;
  nodeRadius: number;
  nodes: ComponentGraphNodeVisual[];
  edges: ComponentEdgeVisual[];
  frontierKind: 'stack';
  frontierItems: ComponentFrontierItemVisual[];
  frontierAdded: ComponentFrontierItemVisual | null;
  frontierRemoved: ComponentFrontierItemVisual | null;
  currentComponentId: number | null;
  componentCount: number;
  components: ComponentGroupVisual[];
  discoveredIds: string[];
  visitedIds: string[];
  currentNodeId: string | null;
  currentEdgeId: string | null;
  neighborNodeId: string | null;
  startNodeId: string | null;
  done: boolean;
  empty: boolean;
}

export interface SccVisualModel {
  kind: 'kosaraju';
  operation: KosarajuSnapshot['operation'];
  phase: KosarajuSnapshot['phase'];
  reversed: boolean;
  width: number;
  height: number;
  nodeRadius: number;
  nodes: ComponentGraphNodeVisual[];
  edges: ComponentEdgeVisual[];
  frontierKind: 'stack';
  frontierItems: ComponentFrontierItemVisual[];
  frontierAdded: ComponentFrontierItemVisual | null;
  frontierRemoved: ComponentFrontierItemVisual | null;
  finishOrder: string[];
  secondPassOrder: string[];
  secondPassIndex: number | null;
  currentComponentId: number | null;
  componentCount: number;
  components: ComponentGroupVisual[];
  discoveredIds: string[];
  visitedIds: string[];
  currentNodeId: string | null;
  currentEdgeId: string | null;
  neighborNodeId: string | null;
  startNodeId: string | null;
  done: boolean;
  empty: boolean;
}

function componentOwner(components: Array<{ id: number; nodeIds: string[] }>): Map<string, number> {
  const owner = new Map<string, number>();
  for (const component of components) {
    for (const nodeId of component.nodeIds) owner.set(nodeId, component.id);
  }
  return owner;
}

function frontierItem(
  item: { id: string; nodeId: string },
  addedId: string | undefined,
): ComponentFrontierItemVisual {
  return {
    id: item.id,
    nodeId: item.nodeId,
    label: item.nodeId,
    added: item.id === addedId,
  };
}

function componentGroups(
  components: Array<{ id: number; nodeIds: string[]; complete: boolean }>,
  currentComponentId: number | null,
): ComponentGroupVisual[] {
  return components.map((component) => ({
    id: component.id,
    nodeIds: [...component.nodeIds],
    complete: component.complete,
    current: component.id === currentComponentId,
  }));
}

function componentEdges(
  layout: ReturnType<typeof layoutGraph>,
  snapshot: { currentEdgeId: string | null; directed: boolean; reversed?: boolean },
): ComponentEdgeVisual[] {
  return layout.edges.map((edge: GraphLayoutEdge) => {
    const reversed = snapshot.reversed === true;
    const displayFrom = reversed ? edge.toId : edge.fromId;
    const displayTo = reversed ? edge.fromId : edge.toId;
    const x1 = reversed ? edge.x2 : edge.x1;
    const y1 = reversed ? edge.y2 : edge.y1;
    const x2 = reversed ? edge.x1 : edge.x2;
    const y2 = reversed ? edge.y1 : edge.y2;
    return {
      ...edge,
      fromId: displayFrom,
      toId: displayTo,
      x1,
      y1,
      x2,
      y2,
      originalFromId: edge.fromId,
      originalToId: edge.toId,
      active: edge.id === snapshot.currentEdgeId,
      reversed,
      directed: snapshot.directed,
      state: edge.id === snapshot.currentEdgeId ? 'current' : reversed ? 'reversed' : 'idle',
    };
  });
}

export function buildConnectedComponentsVisualModel(
  snapshot: ConnectedComponentsSnapshot,
): ConnectedComponentsVisualModel {
  const layout = layoutGraph(snapshot.nodes, snapshot.edges);
  const owner = componentOwner(snapshot.components);
  const discovered = new Set(snapshot.discoveredIds);
  const visited = new Set(snapshot.visitedIds);
  const inStack = new Set(snapshot.frontierItems.map((item) => item.nodeId));
  const addedId = snapshot.frontierAdded?.id;
  const frontierAdded = snapshot.frontierAdded
    ? frontierItem(snapshot.frontierAdded, addedId)
    : null;
  const frontierRemoved = snapshot.frontierRemoved
    ? frontierItem(snapshot.frontierRemoved, undefined)
    : null;
  return {
    kind: 'connected-components',
    operation: snapshot.operation,
    width: layout.width,
    height: layout.height,
    nodeRadius: layout.nodeRadius,
    nodes: layout.nodes.map((node) => {
      const componentId = owner.get(node.id) ?? null;
      return {
        ...node,
        label: node.id,
        state: visited.has(node.id) ? 'visited' : discovered.has(node.id) ? 'discovered' : 'undiscovered',
        componentId,
        current: node.id === snapshot.currentNodeId,
        start: node.id === snapshot.startNodeId,
        inFrontier: inStack.has(node.id),
        finishIndex: null,
      };
    }),
    edges: componentEdges(layout, { currentEdgeId: snapshot.currentEdgeId, directed: false }),
    frontierKind: 'stack',
    frontierItems: snapshot.frontierItems.map((item) => frontierItem(item, addedId)),
    frontierAdded,
    frontierRemoved,
    currentComponentId: snapshot.currentComponentId,
    componentCount: snapshot.componentCount,
    components: componentGroups(snapshot.components, snapshot.currentComponentId),
    discoveredIds: snapshot.discoveredIds,
    visitedIds: snapshot.visitedIds,
    currentNodeId: snapshot.currentNodeId,
    currentEdgeId: snapshot.currentEdgeId,
    neighborNodeId: snapshot.neighborNodeId,
    startNodeId: snapshot.startNodeId,
    done: snapshot.operation === 'done',
    empty: snapshot.nodes.length === 0,
  };
}

export function buildKosarajuVisualModel(snapshot: KosarajuSnapshot): SccVisualModel {
  const layout = layoutGraph(
    snapshot.nodes,
    snapshot.edges,
    SCC_NODE_RADIUS,
    kosarajuPositions(snapshot.nodes),
  );
  const owner = componentOwner(snapshot.components);
  const discovered = new Set(snapshot.discoveredIds);
  const finished = new Set(snapshot.finishOrder);
  const finishIndex = new Map(snapshot.finishOrder.map((nodeId, index) => [nodeId, index + 1]));
  const inStack = new Set(snapshot.frontierItems.map((item) => item.nodeId));
  const addedId = snapshot.frontierAdded?.id;
  const frontierAdded = snapshot.frontierAdded
    ? frontierItem(snapshot.frontierAdded, addedId)
    : null;
  const frontierRemoved = snapshot.frontierRemoved
    ? frontierItem(snapshot.frontierRemoved, undefined)
    : null;
  return {
    kind: 'kosaraju',
    operation: snapshot.operation,
    phase: snapshot.phase,
    reversed: snapshot.reversed,
    width: layout.width,
    height: layout.height,
    nodeRadius: layout.nodeRadius,
    nodes: layout.nodes.map((node) => {
      const componentId = owner.get(node.id) ?? null;
      const state: ComponentNodeState = componentId !== null
        ? 'assigned'
        : finished.has(node.id)
          ? 'finished'
          : discovered.has(node.id)
            ? 'discovered'
            : 'undiscovered';
      return {
        ...node,
        label: node.id,
        state,
        componentId,
        current: node.id === snapshot.currentNodeId,
        start: node.id === snapshot.startNodeId,
        inFrontier: inStack.has(node.id),
        finishIndex: finishIndex.get(node.id) ?? null,
      };
    }),
    edges: componentEdges(layout, {
      currentEdgeId: snapshot.currentEdgeId,
      directed: true,
      reversed: snapshot.reversed,
    }),
    frontierKind: 'stack',
    frontierItems: snapshot.frontierItems.map((item) => frontierItem(item, addedId)),
    frontierAdded,
    frontierRemoved,
    finishOrder: snapshot.finishOrder,
    secondPassOrder: snapshot.secondPassOrder,
    secondPassIndex: snapshot.secondPassIndex,
    currentComponentId: snapshot.currentComponentId,
    componentCount: snapshot.componentCount,
    components: componentGroups(snapshot.components, snapshot.currentComponentId),
    discoveredIds: snapshot.discoveredIds,
    visitedIds: snapshot.visitedIds,
    currentNodeId: snapshot.currentNodeId,
    currentEdgeId: snapshot.currentEdgeId,
    neighborNodeId: snapshot.neighborNodeId,
    startNodeId: snapshot.startNodeId,
    done: snapshot.operation === 'done',
    empty: snapshot.nodes.length === 0,
  };
}

/** A defensive helper kept for tests that want the exact group set. */
export function componentGroupKeys(components: Array<{ nodeIds: string[] }>): string[] {
  return components.map((component) => [...component.nodeIds].sort().join(',')).sort();
}
