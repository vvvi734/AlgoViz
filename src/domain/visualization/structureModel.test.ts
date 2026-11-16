import { describe, expect, it } from 'vitest';
import type { StructureSnapshot } from '../trace/schema';
import { buildVisualModel, isRenderableStructure } from './model';

const labels = {
  invalid: 'invalid',
  emptyStructure: 'empty',
  emptyStack: 'empty stack',
  emptyQueue: 'empty queue',
};

function snapshot(overrides: Partial<StructureSnapshot>): StructureSnapshot {
  return {
    kind: 'stack',
    operation: 'init',
    items: [],
    ...overrides,
  } as StructureSnapshot;
}

describe('Stack / Queue visual model mapping', () => {
  it('maps stack items bottom→top and marks the last item TOP', () => {
    const model = buildVisualModel(
      { type: 'stack', values: [3, 5, 8] },
      labels,
      snapshot({ operation: 'push', items: [{ id: 's1', value: 3 }, { id: 's2', value: 5 }, { id: 's3', value: 8 }], targetId: 's3' }),
    );
    expect(model.kind).toBe('stack');
    if (model.kind !== 'stack') return;
    expect(model.items.map((x) => x.value)).toEqual([3, 5, 8]);
    expect(model.items.map((x) => x.role)).toEqual(['member', 'member', 'top']);
    expect(model.items[2].state).toBe('entering');
    expect(model.empty).toBe(false);
  });

  it('keeps the popped value only in removed and never in current items', () => {
    const model = buildVisualModel(
      { type: 'stack', values: [3, 5] },
      labels,
      snapshot({
        operation: 'pop',
        items: [{ id: 's1', value: 3 }, { id: 's2', value: 5 }],
        targetId: 's3',
        removed: { id: 's3', value: 8 },
      }),
    );
    expect(model.kind).toBe('stack');
    if (model.kind !== 'stack') return;
    expect(model.items.map((x) => x.value)).toEqual([3, 5]);
    expect(model.removed?.value).toBe(8);
    expect(model.removed?.state).toBe('leaving');
  });

  it('maps queue items front→rear with FRONT and REAR roles', () => {
    const model = buildVisualModel(
      { type: 'queue', values: [3, 5, 8] },
      labels,
      snapshot({
        kind: 'queue',
        operation: 'front',
        items: [{ id: 'q1', value: 3 }, { id: 'q2', value: 5 }, { id: 'q3', value: 8 }],
        targetId: 'q1',
      }),
    );
    expect(model.kind).toBe('queue');
    if (model.kind !== 'queue') return;
    expect(model.items.map((x) => x.value)).toEqual([3, 5, 8]);
    expect(model.items.map((x) => x.role)).toEqual(['front', 'member', 'rear']);
    expect(model.items[0].active).toBe(true);
  });

  it('shows an empty container for an empty stack or queue', () => {
    const stack = buildVisualModel({ type: 'stack', values: [] }, labels, snapshot({ operation: 'init' }));
    expect(stack.kind).toBe('stack');
    if (stack.kind === 'stack') {
      expect(stack.empty).toBe(true);
      expect(stack.label).toBe('empty stack');
    }
    const queue = buildVisualModel(
      { type: 'queue', values: [] },
      labels,
      snapshot({ kind: 'queue', operation: 'init' }),
    );
    expect(queue.kind).toBe('queue');
    if (queue.kind === 'queue') expect(queue.label).toBe('empty queue');
  });

  it('falls back to legacy nodes when no structure semantics exist', () => {
    const model = buildVisualModel({ type: 'stack', values: [3, 5] }, labels);
    expect(model.kind).toBe('nodes');
    if (model.kind === 'nodes') expect(model.nodes.map((x) => x.value)).toEqual([3, 5]);
  });

  it('rejects kind mismatch, value-length mismatch and malformed semantics', () => {
    expect(buildVisualModel(
      { type: 'stack', values: [3] },
      labels,
      snapshot({ kind: 'queue', operation: 'enqueue', items: [{ id: 'q1', value: 3 }] }),
    ).kind).toBe('raw');
    expect(buildVisualModel(
      { type: 'stack', values: [3, 5] },
      labels,
      snapshot({ operation: 'push', items: [{ id: 's1', value: 3 }] }),
    ).kind).toBe('raw');
    expect(buildVisualModel(
      { type: 'stack', values: [3] },
      labels,
      snapshot({ operation: 'pop', items: [{ id: 's1', value: 3 }], targetId: 's1' }),
    ).kind).toBe('raw');
    expect(isRenderableStructure(null)).toBe(false);
    expect(isRenderableStructure({ kind: 'stack', operation: 'enqueue', items: [] })).toBe(false);
  });

  it('does not mutate the snapshot it renders', () => {
    const source = snapshot({
      operation: 'peek',
      items: [{ id: 's1', value: 3 }, { id: 's2', value: 5 }],
      targetId: 's2',
    });
    const before = JSON.stringify(source);
    buildVisualModel({ type: 'stack', values: [3, 5] }, labels, source);
    expect(JSON.stringify(source)).toBe(before);
  });
});
