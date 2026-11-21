import { describe, expect, it } from 'vitest';
import {
  GRAPH_LIMITS,
  TRACE_SCHEMA_VERSION,
  graphSnapshotSchema,
  parseTraceDocument,
  type GraphSnapshot,
  type TraceEvent,
} from './schema';

function base(overrides: Partial<GraphSnapshot> = {}): GraphSnapshot {
  return {
    kind: 'graph',
    algorithm: 'bfs',
    operation: 'visit',
    nodes: [
      { id: 'A', value: 'A' },
      { id: 'B', value: 'B' },
      { id: 'C', value: 'C' },
      { id: 'D', value: 'D' },
    ],
    edges: [
      { id: 'e1', fromId: 'A', toId: 'B' },
      { id: 'e2', fromId: 'A', toId: 'C' },
    ],
    startNodeId: 'A',
    currentNodeId: 'A',
    currentEdgeId: null,
    neighborNodeId: null,
    discoveredIds: ['A', 'B', 'C'],
    visitedIds: ['A'],
    visitOrder: ['A'],
    frontierKind: 'queue',
    frontierItems: [
      { id: 'q2', nodeId: 'B' },
      { id: 'q3', nodeId: 'C' },
    ],
    frontierRemoved: null,
    ...overrides,
  };
}

function graphEvent(snapshot: unknown): TraceEvent {
  return {
    schemaVersion: TRACE_SCHEMA_VERSION,
    step: 0,
    eventType: 'step',
    visualType: 'graph',
    state: { type: 'graph' },
    message: 'graph frame',
    structure: snapshot as TraceEvent['structure'],
  };
}

describe('Stage 7E graph schema', () => {
  it('accepts a valid BFS snapshot with separate discovered, frontier and visited states', () => {
    const parsed = graphSnapshotSchema.safeParse(base());
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.discoveredIds).toEqual(['A', 'B', 'C']);
    expect(parsed.data.frontierItems.map((item) => item.nodeId)).toEqual(['B', 'C']);
    expect(parsed.data.visitedIds).toEqual(['A']);
  });

  it('keeps the optional INPUT-06 directed flag on a traversal frame', () => {
    const parsed = graphSnapshotSchema.safeParse(base({ directed: true }));
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.directed).toBe(true);
  });

  it('accepts a valid DFS stack snapshot', () => {
    const parsed = graphSnapshotSchema.safeParse(base({
      algorithm: 'dfs',
      operation: 'push',
      currentNodeId: 'A',
      currentEdgeId: 'e1',
      neighborNodeId: 'B',
      discoveredIds: ['A', 'B'],
      visitedIds: ['A'],
      visitOrder: ['A'],
      frontierKind: 'stack',
      frontierItems: [{ id: 's2', nodeId: 'B' }],
    }));
    expect(parsed.success).toBe(true);
  });

  it('accepts an empty graph init and done', () => {
    const empty = base({
      nodes: [],
      edges: [],
      startNodeId: null,
      currentNodeId: null,
      currentEdgeId: null,
      neighborNodeId: null,
      discoveredIds: [],
      visitedIds: [],
      visitOrder: [],
      frontierItems: [],
      frontierRemoved: null,
      operation: 'init',
    });
    expect(graphSnapshotSchema.safeParse(empty).success).toBe(true);
    expect(graphSnapshotSchema.safeParse({ ...empty, operation: 'done' }).success).toBe(true);
  });

  it('accepts a single-node graph', () => {
    const parsed = graphSnapshotSchema.safeParse(base({
      nodes: [{ id: 'A', value: 'A' }],
      edges: [],
      startNodeId: 'A',
      currentNodeId: 'A',
      operation: 'enqueue',
      discoveredIds: ['A'],
      visitedIds: [],
      visitOrder: [],
      frontierItems: [{ id: 'q1', nodeId: 'A' }],
    }));
    expect(parsed.success).toBe(true);
  });

  it('accepts an undirected cycle and a non-connected component', () => {
    const parsed = graphSnapshotSchema.safeParse(base({
      nodes: ['A', 'B', 'C', 'D'].map((id) => ({ id, value: id })),
      edges: [
        { id: 'e1', fromId: 'A', toId: 'B' },
        { id: 'e2', fromId: 'B', toId: 'C' },
        { id: 'e3', fromId: 'C', toId: 'A' },
        { id: 'e4', fromId: 'B', toId: 'D' },
      ],
      startNodeId: 'A',
      currentNodeId: 'A',
      discoveredIds: ['A'],
      visitedIds: ['A'],
      visitOrder: ['A'],
      frontierItems: [],
    }));
    expect(parsed.success).toBe(true);
  });

  it('rejects duplicate node ids', () => {
    const parsed = graphSnapshotSchema.safeParse(base({
      nodes: [{ id: 'A', value: 'A' }, { id: 'A', value: 'A2' }, { id: 'B', value: 'B' }],
      edges: [{ id: 'e1', fromId: 'A', toId: 'B' }],
    }));
    expect(parsed.success).toBe(false);
  });

  it('rejects duplicate edge ids and duplicate undirected pairs', () => {
    expect(graphSnapshotSchema.safeParse(base({
      edges: [
        { id: 'e1', fromId: 'A', toId: 'B' },
        { id: 'e1', fromId: 'A', toId: 'C' },
      ],
    })).success).toBe(false);
    expect(graphSnapshotSchema.safeParse(base({
      edges: [
        { id: 'e1', fromId: 'A', toId: 'B' },
        { id: 'e2', fromId: 'B', toId: 'A' },
      ],
    })).success).toBe(false);
  });

  it('rejects dangling endpoints, self-loops and an unknown start', () => {
    expect(graphSnapshotSchema.safeParse(base({
      edges: [{ id: 'e1', fromId: 'A', toId: 'Z' }],
    })).success).toBe(false);
    expect(graphSnapshotSchema.safeParse(base({
      edges: [{ id: 'e1', fromId: 'A', toId: 'A' }],
    })).success).toBe(false);
    expect(graphSnapshotSchema.safeParse(base({ startNodeId: 'Z' })).success).toBe(false);
  });

  it('rejects a current node outside the graph and an edge that does not touch it', () => {
    expect(graphSnapshotSchema.safeParse(base({ currentNodeId: 'Z' })).success).toBe(false);
    expect(graphSnapshotSchema.safeParse(base({
      currentNodeId: 'B',
      visitedIds: ['A', 'B'],
      visitOrder: ['A', 'B'],
      operation: 'visit',
      currentEdgeId: 'e2',
    })).success).toBe(false);
    expect(graphSnapshotSchema.safeParse(base({
      operation: 'inspect-edge',
      neighborNodeId: 'B',
      currentEdgeId: 'e404',
    })).success).toBe(false);
  });

  it('rejects duplicate discovered/visited ids and a visit order mismatch', () => {
    expect(graphSnapshotSchema.safeParse(base({ discoveredIds: ['A', 'A', 'B'] })).success).toBe(false);
    expect(graphSnapshotSchema.safeParse(base({ visitedIds: ['A', 'A'], visitOrder: ['A', 'A'] })).success).toBe(false);
    expect(graphSnapshotSchema.safeParse(base({ visitedIds: ['A'], visitOrder: ['B'] })).success).toBe(false);
  });

  it('rejects a visited node missing from discoveredIds', () => {
    expect(graphSnapshotSchema.safeParse(base({
      discoveredIds: ['A', 'B'],
      visitedIds: ['A', 'C'],
      visitOrder: ['A', 'C'],
    })).success).toBe(false);
  });

  it('rejects frontier nodes that do not exist or are already visited', () => {
    expect(graphSnapshotSchema.safeParse(base({
      frontierItems: [{ id: 'q1', nodeId: 'Z' }],
    })).success).toBe(false);
    expect(graphSnapshotSchema.safeParse(base({
      frontierItems: [{ id: 'q1', nodeId: 'A' }],
    })).success).toBe(false);
    expect(graphSnapshotSchema.safeParse(base({
      frontierItems: [
        { id: 'q2', nodeId: 'B' },
        { id: 'q3', nodeId: 'B' },
      ],
    })).success).toBe(false);
  });

  it('enforces queue for BFS and stack for DFS', () => {
    expect(graphSnapshotSchema.safeParse(base({ frontierKind: 'stack' })).success).toBe(false);
    expect(graphSnapshotSchema.safeParse(base({
      algorithm: 'dfs',
      operation: 'push',
      frontierKind: 'queue',
      frontierItems: [{ id: 's2', nodeId: 'B' }],
    })).success).toBe(false);
  });

  it('enforces operation vocabulary per algorithm', () => {
    expect(graphSnapshotSchema.safeParse(base({
      algorithm: 'bfs',
      operation: 'push',
      currentEdgeId: 'e1',
      neighborNodeId: 'B',
      frontierItems: [{ id: 's1', nodeId: 'A' }],
    })).success).toBe(false);
    expect(graphSnapshotSchema.safeParse(base({
      algorithm: 'dfs',
      operation: 'dequeue',
      frontierKind: 'stack',
    })).success).toBe(false);
  });

  it('requires dequeue/pop to record exactly the removed current element', () => {
    const parsed = graphSnapshotSchema.safeParse(base({
      operation: 'dequeue',
      currentNodeId: 'B',
      discoveredIds: ['A', 'B', 'C'],
      visitedIds: ['A'],
      visitOrder: ['A'],
      frontierItems: [{ id: 'q3', nodeId: 'C' }],
      frontierRemoved: { id: 'q2', nodeId: 'B' },
    }));
    expect(parsed.success).toBe(true);
    expect(graphSnapshotSchema.safeParse(base({
      operation: 'dequeue',
      currentNodeId: 'B',
      frontierItems: [{ id: 'q3', nodeId: 'C' }],
      frontierRemoved: { id: 'q4', nodeId: 'D' },
    })).success).toBe(false);
    expect(graphSnapshotSchema.safeParse(base({
      operation: 'dequeue',
      currentNodeId: 'B',
      frontierItems: [{ id: 'q3', nodeId: 'C' }],
      frontierRemoved: null,
    })).success).toBe(false);
  });

  it('requires visit to append the current node to visitedIds', () => {
    expect(graphSnapshotSchema.safeParse(base({
      operation: 'visit',
      currentNodeId: 'B',
      visitedIds: ['A'],
      visitOrder: ['A'],
    })).success).toBe(false);
  });

  it('requires inspect-edge/discover/skip to carry a real edge and neighbor', () => {
    expect(graphSnapshotSchema.safeParse(base({
      operation: 'inspect-edge',
      currentEdgeId: null,
      neighborNodeId: null,
    })).success).toBe(false);
    expect(graphSnapshotSchema.safeParse(base({
      operation: 'discover',
      currentEdgeId: 'e1',
      neighborNodeId: 'B',
      discoveredIds: ['A'],
    })).success).toBe(false);
    expect(graphSnapshotSchema.safeParse(base({
      operation: 'skip',
      currentEdgeId: 'e1',
      neighborNodeId: 'D',
      discoveredIds: ['A', 'B', 'C'],
    })).success).toBe(false);
  });

  it('enforces node and edge limits', () => {
    const nodes = Array.from({ length: GRAPH_LIMITS.MAX_NODES + 1 }, (_, index) => ({
      id: `N${index}`,
      value: `N${index}`,
    }));
    expect(graphSnapshotSchema.safeParse(base({
      nodes,
      edges: [],
      startNodeId: 'N0',
      currentNodeId: 'N0',
      discoveredIds: ['N0'],
      visitedIds: ['N0'],
      visitOrder: ['N0'],
      frontierItems: [],
    })).success).toBe(false);
    const edges = Array.from({ length: GRAPH_LIMITS.MAX_EDGES + 1 }, (_, index) => ({
      id: `e${index}`,
      fromId: 'A',
      toId: index % 2 ? 'B' : 'C',
    }));
    expect(graphSnapshotSchema.safeParse(base({ edges })).success).toBe(false);
  });

  it('keeps the old structure union compatible and rejects malformed graph frames safely', () => {
    const legacy = {
      schemaVersion: TRACE_SCHEMA_VERSION,
      step: 0,
      eventType: 'step',
      visualType: 'stack',
      state: { type: 'stack', values: [1, 2] },
      message: 'push',
      structure: { kind: 'stack', operation: 'push', items: [{ id: 's1', value: 1 }, { id: 's2', value: 2 }], targetId: 's2' },
    };
    expect(parseTraceDocument({ schemaVersion: TRACE_SCHEMA_VERSION, source: 's', events: [legacy] }).ok).toBe(true);
    expect(parseTraceDocument({ schemaVersion: TRACE_SCHEMA_VERSION, source: 's', events: [graphEvent(base())] }).ok).toBe(true);
    expect(parseTraceDocument({
      schemaVersion: TRACE_SCHEMA_VERSION,
      source: 's',
      events: [graphEvent(base({ currentNodeId: 'missing' }))],
    }).ok).toBe(false);
  });
});
