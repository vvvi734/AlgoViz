import { describe, expect, it } from 'vitest';
import { parseTraceDocument, structureSnapshotSchema } from './schema';

function item(id: string, value: unknown) {
  return { id, value };
}

describe('Trace Event Schema v1 — optional structure semantics', () => {
  it('keeps legacy documents without structure valid', () => {
    const doc = parseTraceDocument({
      schemaVersion: 1,
      events: [{
        schemaVersion: 1,
        step: 0,
        eventType: 'step',
        visualType: 'array',
        state: { type: 'array', values: [3, 1] },
        message: 'legacy',
      }],
    });
    if (!doc.ok) throw new Error(doc.errors.join(', '));
    expect(doc.document.events).toHaveLength(1);
    expect(doc.document.events[0].structure).toBeUndefined();
  });

  it('accepts a valid stack push snapshot', () => {
    const parsed = structureSnapshotSchema.parse({
      kind: 'stack',
      operation: 'push',
      items: [item('s1', 3), item('s2', 5)],
      targetId: 's2',
    });
    expect(parsed.items.map((x) => x.id)).toEqual(['s1', 's2']);
  });

  it('accepts a valid queue dequeue snapshot with removed element', () => {
    const parsed = structureSnapshotSchema.parse({
      kind: 'queue',
      operation: 'dequeue',
      items: [item('q2', 5), item('q3', 8)],
      targetId: 'q1',
      removed: item('q1', 3),
    });
    expect(parsed.removed?.value).toBe(3);
  });

  it('rejects a stack operation on a queue snapshot', () => {
    const result = structureSnapshotSchema.safeParse({
      kind: 'queue',
      operation: 'push',
      items: [item('q1', 3)],
    });
    expect(result.success).toBe(false);
  });

  it('requires removed for pop and dequeue', () => {
    for (const kind of ['stack', 'queue'] as const) {
      const result = structureSnapshotSchema.safeParse({
        kind,
        operation: kind === 'stack' ? 'pop' : 'dequeue',
        items: [item('x1', 3)],
      });
      expect(result.success).toBe(false);
    }
  });

  it('requires targetId to match the removed element', () => {
    const result = structureSnapshotSchema.safeParse({
      kind: 'stack',
      operation: 'pop',
      items: [item('s1', 3)],
      targetId: 's1',
      removed: item('s2', 5),
    });
    expect(result.success).toBe(false);
  });

  it('rejects duplicate element ids and oversized containers', () => {
    expect(structureSnapshotSchema.safeParse({
      kind: 'stack',
      operation: 'push',
      items: [item('s1', 3), item('s1', 5)],
    }).success).toBe(false);
    expect(structureSnapshotSchema.safeParse({
      kind: 'stack',
      operation: 'init',
      items: Array.from({ length: 41 }, (_, i) => item(`s${i}`, i)),
    }).success).toBe(false);
  });
});
