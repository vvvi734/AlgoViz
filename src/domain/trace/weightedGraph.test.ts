import { describe, expect, it } from 'vitest';
import { framesToTraceDocument } from './adapter';
import {
  GRAPH_LIMITS,
  TRACE_SCHEMA_VERSION,
  parseTraceDocument,
  weightedGraphSnapshotSchema,
  type TraceEvent,
  type WeightedGraphSnapshot,
} from './schema';
import fixture from '../../test/fixtures/dijkstra-default-frames.json';
import type { RawTraceFrame } from './types';

const NODES = [{ id: 'A', value: 'A' }, { id: 'B', value: 'B' }, { id: 'C', value: 'C' }];
const EDGES = [
  { id: 'e1', fromId: 'A', toId: 'B', weight: 1 },
  { id: 'e2', fromId: 'A', toId: 'C', weight: 5 },
  { id: 'e3', fromId: 'B', toId: 'C', weight: 1 },
];

function base(overrides: Partial<WeightedGraphSnapshot> = {}): WeightedGraphSnapshot {
  return {
    kind: 'weighted-graph',
    algorithm: 'dijkstra',
    operation: 'done',
    nodes: NODES,
    edges: EDGES,
    directed: false,
    startNodeId: 'A',
    targetNodeId: 'C',
    currentNodeId: null,
    currentEdgeId: null,
    neighborNodeId: null,
    discoveredIds: ['A', 'B', 'C'],
    visitedIds: ['A', 'B', 'C'],
    visitOrder: ['A', 'B', 'C'],
    distances: [
      { nodeId: 'A', distance: 0 },
      { nodeId: 'B', distance: 1 },
      { nodeId: 'C', distance: 2 },
    ],
    previous: [
      { nodeId: 'A', previousId: null },
      { nodeId: 'B', previousId: 'A' },
      { nodeId: 'C', previousId: 'B' },
    ],
    frontierKind: 'priority-queue',
    frontierItems: [],
    frontierRemoved: null,
    frontierAdded: null,
    relax: null,
    pathNodeIds: ['A', 'B', 'C'],
    pathDistance: 2,
    ...overrides,
  };
}

function event(snapshot: unknown): TraceEvent {
  return {
    schemaVersion: TRACE_SCHEMA_VERSION,
    step: 0,
    eventType: 'step',
    visualType: 'graph',
    state: { type: 'graph' },
    message: 'dijkstra frame',
    structure: snapshot as TraceEvent['structure'],
  };
}

describe('Stage 7F weighted graph / Dijkstra schema', () => {
  it('accepts a finished Dijkstra snapshot with a real previous chain', () => {
    const parsed = weightedGraphSnapshotSchema.safeParse(base());
    expect(parsed.success).toBe(true);
  });

  it('accepts a settle frame with the current node already in visitedIds', () => {
    const parsed = weightedGraphSnapshotSchema.safeParse(base({
      operation: 'settle',
      currentNodeId: 'C',
      pathNodeIds: [],
      pathDistance: null,
    }));
    expect(parsed.success).toBe(true);
  });

  it('accepts fresh and stale duplicate heap entries for the same node', () => {
    const parsed = weightedGraphSnapshotSchema.safeParse(base({
      operation: 'stale',
      currentNodeId: 'B',
      visitedIds: ['A'],
      visitOrder: ['A'],
      distances: [
        { nodeId: 'A', distance: 0 },
        { nodeId: 'B', distance: 1 },
        { nodeId: 'C', distance: 5 },
      ],
      previous: [
        { nodeId: 'A', previousId: null },
        { nodeId: 'B', previousId: 'A' },
        { nodeId: 'C', previousId: 'A' },
      ],
      frontierItems: [
        { id: 'p3', nodeId: 'C', distance: 5, stale: false },
        { id: 'p2', nodeId: 'C', distance: 7, stale: true },
      ],
      frontierRemoved: { id: 'p1', nodeId: 'B', distance: 3, stale: true },
      pathNodeIds: [],
      pathDistance: null,
    }));
    expect(parsed.success).toBe(true);
  });

  it('accepts an empty graph only for init/done with empty state', () => {
    const empty = base({
      operation: 'init',
      nodes: [],
      edges: [],
      startNodeId: null,
      targetNodeId: null,
      currentNodeId: null,
      discoveredIds: [],
      visitedIds: [],
      visitOrder: [],
      distances: [],
      previous: [],
      frontierItems: [],
      pathNodeIds: [],
      pathDistance: null,
    });
    expect(weightedGraphSnapshotSchema.safeParse(empty).success).toBe(true);
    expect(weightedGraphSnapshotSchema.safeParse({ ...empty, operation: 'done' }).success).toBe(true);
    expect(weightedGraphSnapshotSchema.safeParse({ ...empty, operation: 'settle' }).success).toBe(false);
    expect(weightedGraphSnapshotSchema.safeParse({ ...empty, startNodeId: 'A' }).success).toBe(false);
  });

  it('accepts a directed graph and a single-node start=target', () => {
    expect(weightedGraphSnapshotSchema.safeParse(base({
      directed: true,
      edges: [{ id: 'e1', fromId: 'A', toId: 'B', weight: 1 }],
      nodes: [{ id: 'A', value: 'A' }, { id: 'B', value: 'B' }],
      targetNodeId: 'B',
      distances: [
        { nodeId: 'A', distance: 0 },
        { nodeId: 'B', distance: 1 },
      ],
      previous: [
        { nodeId: 'A', previousId: null },
        { nodeId: 'B', previousId: 'A' },
      ],
      discoveredIds: ['A', 'B'],
      visitedIds: ['A', 'B'],
      visitOrder: ['A', 'B'],
      pathNodeIds: ['A', 'B'],
      pathDistance: 1,
    })).success).toBe(true);

    expect(weightedGraphSnapshotSchema.safeParse(base({
      nodes: [{ id: 'A', value: 'A' }],
      edges: [],
      startNodeId: 'A',
      targetNodeId: 'A',
      discoveredIds: ['A'],
      visitedIds: ['A'],
      visitOrder: ['A'],
      distances: [{ nodeId: 'A', distance: 0 }],
      previous: [{ nodeId: 'A', previousId: null }],
      pathNodeIds: ['A'],
      pathDistance: 0,
    })).success).toBe(true);
  });

  it('accepts an unreachable target with path [] and distance null', () => {
    const parsed = weightedGraphSnapshotSchema.safeParse(base({
      targetNodeId: 'C',
      distances: [
        { nodeId: 'A', distance: 0 },
        { nodeId: 'B', distance: 1 },
        { nodeId: 'C', distance: null },
      ],
      previous: [
        { nodeId: 'A', previousId: null },
        { nodeId: 'B', previousId: 'A' },
        { nodeId: 'C', previousId: null },
      ],
      discoveredIds: ['A', 'B', 'C'],
      visitedIds: ['A', 'B'],
      visitOrder: ['A', 'B'],
      pathNodeIds: [],
      pathDistance: null,
    }));
    expect(parsed.success).toBe(true);
  });

  it('rejects negative and non-finite weights', () => {
    expect(weightedGraphSnapshotSchema.safeParse(base({
      edges: [{ id: 'e1', fromId: 'A', toId: 'B', weight: -1 }],
    })).success).toBe(false);
    expect(weightedGraphSnapshotSchema.safeParse(base({
      edges: [{ id: 'e1', fromId: 'A', toId: 'B', weight: Number.POSITIVE_INFINITY }],
    })).success).toBe(false);
  });

  it('rejects duplicate ids, dangling endpoints, self-loops and duplicate undirected pairs', () => {
    expect(weightedGraphSnapshotSchema.safeParse(base({
      nodes: [{ id: 'A', value: 'A' }, { id: 'A', value: 'A2' }],
    })).success).toBe(false);
    expect(weightedGraphSnapshotSchema.safeParse(base({
      edges: [
        { id: 'e1', fromId: 'A', toId: 'B', weight: 1 },
        { id: 'e1', fromId: 'B', toId: 'C', weight: 2 },
      ],
    })).success).toBe(false);
    expect(weightedGraphSnapshotSchema.safeParse(base({
      edges: [{ id: 'e1', fromId: 'A', toId: 'Z', weight: 1 }],
    })).success).toBe(false);
    expect(weightedGraphSnapshotSchema.safeParse(base({
      edges: [{ id: 'e1', fromId: 'A', toId: 'A', weight: 1 }],
    })).success).toBe(false);
    expect(weightedGraphSnapshotSchema.safeParse(base({
      edges: [
        { id: 'e1', fromId: 'A', toId: 'B', weight: 1 },
        { id: 'e2', fromId: 'B', toId: 'A', weight: 2 },
      ],
    })).success).toBe(false);
    expect(weightedGraphSnapshotSchema.safeParse(base({
      directed: true,
      edges: [
        { id: 'e1', fromId: 'A', toId: 'B', weight: 1 },
        { id: 'e2', fromId: 'A', toId: 'B', weight: 2 },
      ],
    })).success).toBe(false);
  });

  it('rejects a distance/previous table that does not cover every node', () => {
    expect(weightedGraphSnapshotSchema.safeParse(base({
      distances: [{ nodeId: 'A', distance: 0 }, { nodeId: 'B', distance: 1 }],
    })).success).toBe(false);
    expect(weightedGraphSnapshotSchema.safeParse(base({
      previous: [{ nodeId: 'A', previousId: null }, { nodeId: 'B', previousId: 'A' }],
    })).success).toBe(false);
    expect(weightedGraphSnapshotSchema.safeParse(base({
      previous: [
        { nodeId: 'A', previousId: null },
        { nodeId: 'B', previousId: 'C' },
        { nodeId: 'C', previousId: 'B' },
      ],
    })).success).toBe(false);
    expect(weightedGraphSnapshotSchema.safeParse(base({
      distances: [
        { nodeId: 'A', distance: 3 },
        { nodeId: 'B', distance: 1 },
        { nodeId: 'C', distance: 2 },
      ],
    })).success).toBe(false);
  });

  it('rejects a fresh heap entry with a stale distance or a settled node', () => {
    expect(weightedGraphSnapshotSchema.safeParse(base({
      operation: 'settle',
      currentNodeId: 'C',
      frontierItems: [{ id: 'p1', nodeId: 'B', distance: 4, stale: false }],
      pathNodeIds: [],
      pathDistance: null,
    })).success).toBe(false);
    expect(weightedGraphSnapshotSchema.safeParse(base({
      operation: 'settle',
      currentNodeId: 'C',
      frontierItems: [{ id: 'p1', nodeId: 'C', distance: 2, stale: false }],
      pathNodeIds: [],
      pathDistance: null,
    })).success).toBe(false);
  });

  it('rejects a relax that does not strictly improve and set previous=current', () => {
    const relax = {
      nodeId: 'C',
      oldDistance: 1,
      newDistance: 3,
      oldPreviousId: 'A',
      newPreviousId: 'B',
    };
    expect(weightedGraphSnapshotSchema.safeParse(base({
      operation: 'relax',
      currentNodeId: 'B',
      visitedIds: ['A', 'B'],
      visitOrder: ['A', 'B'],
      currentEdgeId: 'e3',
      neighborNodeId: 'C',
      relax,
      pathNodeIds: [],
      pathDistance: null,
    })).success).toBe(false);
    expect(weightedGraphSnapshotSchema.safeParse(base({
      operation: 'relax',
      currentNodeId: 'B',
      visitedIds: ['A', 'B'],
      visitOrder: ['A', 'B'],
      currentEdgeId: 'e3',
      neighborNodeId: 'C',
      relax: { ...relax, newDistance: 2, oldDistance: 5, newPreviousId: 'B' },
      pathNodeIds: [],
      pathDistance: null,
      frontierAdded: { id: 'p1', nodeId: 'C', distance: 2, stale: false },
      frontierItems: [{ id: 'p1', nodeId: 'C', distance: 2, stale: false }],
    })).success).toBe(true);
  });

  it('rejects a final path with a missing edge or a mismatched total', () => {
    expect(weightedGraphSnapshotSchema.safeParse(base({
      pathNodeIds: ['A', 'C'],
      pathDistance: 5,
    })).success).toBe(false);
    expect(weightedGraphSnapshotSchema.safeParse(base({
      pathDistance: 3,
    })).success).toBe(false);
    expect(weightedGraphSnapshotSchema.safeParse(base({
      pathNodeIds: ['B', 'C'],
    })).success).toBe(false);
  });

  it('rejects a non-terminal frame that leaks a final path', () => {
    expect(weightedGraphSnapshotSchema.safeParse(base({
      operation: 'settle',
      currentNodeId: 'C',
      pathNodeIds: ['A', 'B', 'C'],
      pathDistance: 2,
    })).success).toBe(false);
  });

  it('enforces the node, edge and priority-queue caps', () => {
    const tooManyNodes = Array.from({ length: GRAPH_LIMITS.MAX_NODES + 1 }, (_, index) => ({ id: `N${index}`, value: index }));
    expect(weightedGraphSnapshotSchema.safeParse(base({ nodes: tooManyNodes })).success).toBe(false);
    const tooManyEdges = Array.from({ length: GRAPH_LIMITS.MAX_EDGES + 1 }, (_, index) => ({
      id: `e${index}`,
      fromId: 'A',
      toId: 'B',
      weight: 1,
    }));
    expect(weightedGraphSnapshotSchema.safeParse(base({ edges: tooManyEdges })).success).toBe(false);
    const tooManyEntries = Array.from({ length: GRAPH_LIMITS.MAX_PRIORITY_QUEUE + 1 }, (_, index) => ({
      id: `p${index}`,
      nodeId: 'A',
      distance: 0,
      stale: true,
    }));
    expect(weightedGraphSnapshotSchema.safeParse(base({
      operation: 'settle',
      currentNodeId: 'A',
      visitedIds: ['A'],
      visitOrder: ['A'],
      discoveredIds: ['A'],
      distances: [
        { nodeId: 'A', distance: 0 },
        { nodeId: 'B', distance: null },
        { nodeId: 'C', distance: null },
      ],
      previous: [
        { nodeId: 'A', previousId: null },
        { nodeId: 'B', previousId: null },
        { nodeId: 'C', previousId: null },
      ],
      frontierItems: tooManyEntries,
      pathNodeIds: [],
      pathDistance: null,
    })).success).toBe(false);
  });

  it('keeps the BFS/DFS graph union compatible', () => {
    expect(event(base()).structure).toBeDefined();
    expect(parseTraceDocument({
      schemaVersion: TRACE_SCHEMA_VERSION,
      events: [event(base())],
    }).ok).toBe(true);
  });

  it('accepts every frame produced by the real Python heapq program', () => {
    const document = framesToTraceDocument((fixture as unknown as { frames: RawTraceFrame[] }).frames);
    expect(document.events.length).toBe(46);
    expect(document.events.every((item) => item.structure?.kind === 'weighted-graph')).toBe(true);
    const parsed = parseTraceDocument(document);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const final = parsed.document.events[parsed.document.events.length - 1];
    expect(final.structure?.kind).toBe('weighted-graph');
    if (final.structure?.kind !== 'weighted-graph') return;
    expect(final.structure.operation).toBe('done');
    expect(final.structure.pathNodeIds).toEqual(['A', 'B', 'E', 'F', 'G']);
    expect(final.structure.pathDistance).toBe(7);
    expect(final.structure.frontierItems).toEqual([]);
    const staleFrames = parsed.document.events.filter(
      (item) => item.structure?.kind === 'weighted-graph' && item.structure.operation === 'stale',
    );
    expect(staleFrames.length).toBe(1);
  });
});
