import { describe, expect, it } from 'vitest';
import type { LinkedListSnapshot } from '../trace/schema';
import { buildVisualModel } from './model';
import { buildLinkedListModel, isRenderableLinkedList } from './linkedListModel';

const labels = {
  invalid: 'invalid',
  emptyStructure: 'empty',
  emptyStack: 'empty stack',
  emptyQueue: 'empty queue',
  emptyLinked: 'empty list',
};

function snapshot(overrides: Partial<LinkedListSnapshot> = {}): LinkedListSnapshot {
  return {
    kind: 'linked-list',
    operation: 'init',
    headId: null,
    nodes: [],
    ...overrides,
  } as LinkedListSnapshot;
}

function linkedModel(value: LinkedListSnapshot) {
  return buildVisualModel({ type: 'linked', values: [3, 5] }, labels, value);
}

describe('Stage 7C linked-list visual model', () => {
  it('derives the main chain from headId and nextId, never from node array order', () => {
    const model = linkedModel(snapshot({
      operation: 'visit',
      headId: 'n3',
      nodes: [
        { id: 'n1', value: 5, nextId: null },
        { id: 'n2', value: 8, nextId: 'n1' },
        { id: 'n3', value: 3, nextId: 'n2' },
      ],
      targetId: 'n3',
    }));
    expect(model.kind).toBe('linked-list');
    if (model.kind !== 'linked-list') return;
    expect(model.nodes.map((item) => item.id)).toEqual(['n3', 'n2', 'n1']);
    expect(model.nodes.map((item) => item.value)).toEqual([3, 8, 5]);
    expect(model.nodes[0].role).toBe('head');
    expect(model.nodes[2].role).toBe('tail');
    expect(model.nodes[0].active).toBe(true);
    expect(model.edges.map((edge) => [edge.fromId, edge.toId])).toEqual([
      ['n3', 'n2'],
      ['n2', 'n1'],
    ]);
  });

  it('shows a newly created node outside the main chain', () => {
    const model = linkedModel(snapshot({
      operation: 'create',
      headId: 'n1',
      nodes: [
        { id: 'n1', value: 3, nextId: 'n2' },
        { id: 'n2', value: 8, nextId: null },
        { id: 'n4', value: 6, nextId: null },
      ],
      targetId: 'n4',
    }));
    expect(model.kind).toBe('linked-list');
    if (model.kind !== 'linked-list') return;
    expect(model.nodes.map((item) => item.id)).toEqual(['n1', 'n2']);
    expect(model.detachedNodes.map((item) => item.id)).toEqual(['n4']);
    expect(model.detachedNodes[0].status).toBe('temporary');
    expect(model.detachedNodes[0].reachable).toBe(false);
  });

  it('changes the arrow only after the predecessor points at the new node', () => {
    const before = linkedModel(snapshot({
      operation: 'set-next',
      headId: 'n3',
      nodes: [
        { id: 'n3', value: 3, nextId: 'n2' },
        { id: 'n2', value: 8, nextId: null },
        { id: 'n4', value: 6, nextId: 'n2' },
      ],
      targetId: 'n4',
      change: { nodeId: 'n4', beforeNextId: null, afterNextId: 'n2' },
    }));
    if (before.kind !== 'linked-list') return;
    expect(before.nodes.map((item) => item.id)).toEqual(['n3', 'n2']);
    expect(before.detachedNodes[0].status).toBe('temporary');
    expect(before.edges.map((edge) => edge.toId)).toEqual(['n2']);

    const after = linkedModel(snapshot({
      operation: 'set-next',
      headId: 'n3',
      nodes: [
        { id: 'n3', value: 3, nextId: 'n4' },
        { id: 'n4', value: 6, nextId: 'n2' },
        { id: 'n2', value: 8, nextId: null },
      ],
      targetId: 'n3',
      change: { nodeId: 'n3', beforeNextId: 'n2', afterNextId: 'n4' },
    }));
    if (after.kind !== 'linked-list') return;
    expect(after.nodes.map((item) => item.id)).toEqual(['n3', 'n4', 'n2']);
    expect(after.edges.map((edge) => edge.toId)).toEqual(['n4', 'n2']);
    expect(after.edges[0].changed).toBe(true);
    expect(after.change).toEqual({ nodeId: 'n3', beforeNextId: 'n2', afterNextId: 'n4' });
  });

  it('removes the target from the reachable path and preserves it as detached', () => {
    const model = linkedModel(snapshot({
      operation: 'detach',
      headId: 'n3',
      nodes: [
        { id: 'n3', value: 3, nextId: 'n4' },
        { id: 'n4', value: 6, nextId: 'n1' },
        { id: 'n2', value: 8, nextId: null },
        { id: 'n1', value: 5, nextId: null },
      ],
      targetId: 'n2',
      change: { nodeId: 'n2', beforeNextId: 'n1', afterNextId: null },
    }));
    expect(model.kind).toBe('linked-list');
    if (model.kind !== 'linked-list') return;
    expect(model.nodes.map((item) => item.id)).toEqual(['n3', 'n4', 'n1']);
    expect(model.detachedNodes.map((item) => item.id)).toEqual(['n2']);
    expect(model.detachedNodes[0].status).toBe('detached');
    expect(model.detachedNodes[0].nextId).toBeNull();
    expect(model.nodes.every((item) => item.reachable)).toBe(true);
  });

  it('keeps equal values distinct by node id', () => {
    const model = linkedModel(snapshot({
      operation: 'visit',
      headId: 'n1',
      nodes: [
        { id: 'n1', value: 3, nextId: 'n2' },
        { id: 'n2', value: 3, nextId: null },
      ],
      targetId: 'n2',
    }));
    expect(model.kind).toBe('linked-list');
    if (model.kind !== 'linked-list') return;
    expect(model.nodes.map((item) => item.value)).toEqual([3, 3]);
    expect(model.nodes.map((item) => item.id)).toEqual(['n1', 'n2']);
    expect(model.nodes[1].active).toBe(true);
    expect(model.nodes[0].active).toBe(false);
  });

  it('renders an empty HEAD -> NULL state', () => {
    const model = linkedModel(snapshot({ operation: 'init' }));
    expect(model.kind).toBe('linked-list');
    if (model.kind !== 'linked-list') return;
    expect(model.nodes).toHaveLength(0);
    expect(model.detachedNodes).toHaveLength(0);
    expect(model.empty).toBe(true);
    expect(model.label).toBe('empty list');
  });

  it('returns null / raw for malformed model input without mutating the source', () => {
    expect(isRenderableLinkedList({
      kind: 'linked-list',
      operation: 'init',
      headId: 'missing',
      nodes: [],
    })).toBe(false);
    const bad: unknown = {
      kind: 'linked-list',
      operation: 'visit',
      headId: 'n1',
      nodes: [{ id: 'n1', value: 3, nextId: 'n1' }],
      targetId: 'n1',
    };
    expect(buildLinkedListModel(bad, 'empty')).toBeNull();
    expect(linkedModel(bad as LinkedListSnapshot).kind).toBe('raw');
    const source = snapshot({
      operation: 'set-next',
      headId: 'n1',
      nodes: [{ id: 'n1', value: 3, nextId: 'n2' }, { id: 'n2', value: 5, nextId: null }],
      targetId: 'n1',
      change: { nodeId: 'n1', beforeNextId: null, afterNextId: 'n2' },
    });
    const before = JSON.stringify(source);
    linkedModel(source);
    expect(JSON.stringify(source)).toBe(before);
  });

  it('falls back to the legacy linked nodes when no structure semantics exist', () => {
    const model = buildVisualModel({ type: 'linked', values: [3, 5] }, labels);
    expect(model.kind).toBe('nodes');
    if (model.kind === 'nodes') expect(model.nodes.map((item) => item.value)).toEqual([3, 5]);
  });
});
