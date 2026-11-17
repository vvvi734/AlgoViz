import { describe, expect, it } from 'vitest';
import type { GraphSnapshot } from '../trace/schema';
import { buildGraphVisualModel } from './graphModel';
import { buildVisualModel } from './model';

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
      { id: 'e3', fromId: 'B', toId: 'D' },
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

describe('Stage 7E graph visual model', () => {
  it('derives current, pending, visited and undiscovered nodes from one snapshot', () => {
    const model = buildGraphVisualModel(base(), 'empty graph');
    expect(model).not.toBeNull();
    if (!model) return;
    expect(model.nodes.find((node) => node.id === 'A')?.state).toBe('visited');
    expect(model.nodes.find((node) => node.id === 'B')?.state).toBe('pending');
    expect(model.nodes.find((node) => node.id === 'C')?.state).toBe('pending');
    expect(model.nodes.find((node) => node.id === 'D')?.state).toBe('undiscovered');
    expect(model.nodes.find((node) => node.id === 'A')?.visitIndex).toBe(1);
    expect(model.nodes.find((node) => node.id === 'A')?.visited).toBe(true);
    expect(model.nodes.find((node) => node.id === 'B')?.visited).toBe(false);
    expect(model.nodes.find((node) => node.id === 'A')?.start).toBe(true);
  });

  it('keeps the real frontier order and node ids', () => {
    const model = buildGraphVisualModel(base(), 'empty graph');
    expect(model?.frontierKind).toBe('queue');
    expect(model?.frontierItems.map((item) => item.nodeId)).toEqual(['B', 'C']);
    expect(model?.frontierItems.map((item) => item.label)).toEqual(['B', 'C']);
  });

  it('marks exactly the recorded current edge as active', () => {
    const model = buildGraphVisualModel(base({
      operation: 'inspect-edge',
      currentEdgeId: 'e2',
      neighborNodeId: 'C',
    }), 'empty graph');
    expect(model?.edges.filter((edge) => edge.active).map((edge) => edge.id)).toEqual(['e2']);
    expect(model?.edges.find((edge) => edge.id === 'e2')?.fromId).toBe('A');
  });

  it('shows the removed frontier element at dequeue without inventing text', () => {
    const model = buildGraphVisualModel(base({
      operation: 'dequeue',
      currentNodeId: 'B',
      discoveredIds: ['A', 'B', 'C'],
      visitedIds: ['A'],
      visitOrder: ['A'],
      frontierItems: [{ id: 'q3', nodeId: 'C' }],
      frontierRemoved: { id: 'q2', nodeId: 'B' },
    }), 'empty graph');
    expect(model?.frontierRemoved).toEqual({ id: 'q2', nodeId: 'B', label: 'B' });
    expect(model?.frontierItems.map((item) => item.nodeId)).toEqual(['C']);
  });

  it('uses the same node coordinates while visited/frontier state changes', () => {
    const before = buildGraphVisualModel(base(), 'empty graph');
    const after = buildGraphVisualModel(base({
      currentNodeId: 'B',
      discoveredIds: ['A', 'B', 'C', 'D'],
      visitedIds: ['A', 'B'],
      visitOrder: ['A', 'B'],
      frontierItems: [{ id: 'q3', nodeId: 'C' }],
    }), 'empty graph');
    expect(after?.nodes.map((node) => ({ id: node.id, x: node.x, y: node.y })))
      .toEqual(before?.nodes.map((node) => ({ id: node.id, x: node.x, y: node.y })));
  });

  it('renders an empty graph without nodes or edges', () => {
    const empty = base({
      nodes: [],
      edges: [],
      startNodeId: null,
      currentNodeId: null,
      discoveredIds: [],
      visitedIds: [],
      visitOrder: [],
      frontierItems: [],
      operation: 'init',
    });
    const model = buildGraphVisualModel(empty, 'empty graph');
    expect(model?.empty).toBe(true);
    expect(model?.nodes).toEqual([]);
    expect(model?.edges).toEqual([]);
    expect(model?.label).toBe('empty graph');
  });

  it('routes a validated graph structure through buildVisualModel', () => {
    const visual = buildVisualModel({ type: 'graph' }, {
      invalid: 'invalid',
      emptyStructure: 'empty',
      emptyGraph: 'empty graph',
    }, base());
    expect(visual.kind).toBe('graph-traversal');
    if (visual.kind !== 'graph-traversal') return;
    expect(visual.nodes).toHaveLength(4);
    expect(visual.frontierItems).toHaveLength(2);
  });

  it('returns an explicit invalid raw model when state and structure disagree', () => {
    const visual = buildVisualModel({ type: 'array', values: [1] }, {
      invalid: 'invalid',
      emptyStructure: 'empty',
      emptyGraph: 'empty graph',
    }, base());
    expect(visual).toEqual({ kind: 'raw', text: 'invalid' });
  });

  it('refuses malformed direct snapshots instead of guessing', () => {
    expect(buildGraphVisualModel(base({
      nodes: [{ id: 'A', value: 'A' }, { id: 'A', value: 'A2' }],
    }), 'empty')).toBeNull();
    expect(buildGraphVisualModel(base({
      edges: [{ id: 'e1', fromId: 'A', toId: 'Z' }],
    }), 'empty')).toBeNull();
    expect(buildGraphVisualModel(base({
      frontierKind: 'stack',
    }), 'empty')).toBeNull();
    expect(buildGraphVisualModel(base({
      frontierItems: [{ id: 'q9', nodeId: 'Z' }],
    }), 'empty')).toBeNull();
  });
});
