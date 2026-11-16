import { describe, expect, it } from 'vitest';
import {
  linkedListSnapshotSchema,
  parseTraceDocument,
  structureSchema,
  structureSnapshotSchema,
} from './schema';
import { framesToTraceDocument } from './adapter';

function node(id: string, value: unknown, nextId: string | null) {
  return { id, value, nextId };
}

function chain() {
  return {
    kind: 'linked-list' as const,
    operation: 'visit' as const,
    headId: 'n1',
    nodes: [node('n1', 3, 'n2'), node('n2', 5, null)],
    targetId: 'n1',
  };
}

describe('Stage 7C linked-list Trace schema', () => {
  it('accepts an empty HEAD -> NULL snapshot', () => {
    const parsed = linkedListSnapshotSchema.parse({
      kind: 'linked-list',
      operation: 'init',
      headId: null,
      nodes: [],
    });
    expect(parsed.headId).toBeNull();
    expect(parsed.nodes).toHaveLength(0);
  });

  it('accepts a chain ordered by nextId, with a same-value node distinguished by id', () => {
    const parsed = linkedListSnapshotSchema.parse({
      kind: 'linked-list',
      operation: 'visit',
      headId: 'n1',
      nodes: [node('n1', 3, 'n2'), node('n2', 3, 'n3'), node('n3', 5, null)],
      targetId: 'n2',
    });
    expect(parsed.nodes.map((item) => item.id)).toEqual(['n1', 'n2', 'n3']);
    const duplicateValues = parsed.nodes.filter((item) => item.value === 3);
    expect(duplicateValues.map((item) => item.id)).toEqual(['n1', 'n2']);
  });

  it('accepts a newly created but unreachable node', () => {
    const parsed = linkedListSnapshotSchema.parse({
      kind: 'linked-list',
      operation: 'create',
      headId: 'n1',
      nodes: [node('n1', 3, null), node('n4', 6, null)],
      targetId: 'n4',
    });
    expect(parsed.nodes).toHaveLength(2);
    expect(parsed.headId).toBe('n1');
  });

  it('accepts a real set-next change and a detach with next = null', () => {
    const setNext = linkedListSnapshotSchema.parse({
      kind: 'linked-list',
      operation: 'set-next',
      headId: 'n1',
      nodes: [node('n1', 3, 'n2'), node('n2', 5, null)],
      targetId: 'n1',
      change: { nodeId: 'n1', beforeNextId: null, afterNextId: 'n2' },
    });
    expect(setNext.change?.afterNextId).toBe('n2');
    const detach = linkedListSnapshotSchema.parse({
      kind: 'linked-list',
      operation: 'detach',
      headId: 'n1',
      nodes: [node('n1', 3, null), node('n2', 5, null)],
      targetId: 'n2',
      change: { nodeId: 'n2', beforeNextId: null, afterNextId: null },
    });
    expect(detach.operation).toBe('detach');
  });

  it('rejects duplicate ids, dangling references and an invalid head', () => {
    expect(linkedListSnapshotSchema.safeParse({
      kind: 'linked-list',
      operation: 'init',
      headId: null,
      nodes: [node('n1', 3, null), node('n1', 5, null)],
    }).success).toBe(false);
    expect(linkedListSnapshotSchema.safeParse({
      kind: 'linked-list',
      operation: 'init',
      headId: null,
      nodes: [node('n1', 3, 'missing')],
    }).success).toBe(false);
    expect(linkedListSnapshotSchema.safeParse({
      kind: 'linked-list',
      operation: 'init',
      headId: 'missing',
      nodes: [node('n1', 3, null)],
    }).success).toBe(false);
    expect(linkedListSnapshotSchema.safeParse({
      kind: 'linked-list',
      operation: 'visit',
      headId: 'n1',
      nodes: [node('n1', 3, null)],
      targetId: 'missing',
    }).success).toBe(false);
  });

  it('rejects a cycle, including one among detached nodes', () => {
    expect(linkedListSnapshotSchema.safeParse({
      kind: 'linked-list',
      operation: 'init',
      headId: 'n1',
      nodes: [node('n1', 3, 'n2'), node('n2', 5, 'n1')],
    }).success).toBe(false);
    expect(linkedListSnapshotSchema.safeParse({
      kind: 'linked-list',
      operation: 'create',
      headId: 'n1',
      nodes: [
        node('n1', 3, null),
        node('n2', 5, 'n3'),
        node('n3', 8, 'n2'),
      ],
      targetId: 'n2',
    }).success).toBe(false);
  });

  it('rejects an inconsistent change and a missing change for set-next', () => {
    expect(linkedListSnapshotSchema.safeParse({
      kind: 'linked-list',
      operation: 'set-next',
      headId: 'n1',
      nodes: [node('n1', 3, 'n2'), node('n2', 5, null)],
      targetId: 'n1',
      change: { nodeId: 'n1', beforeNextId: null, afterNextId: null },
    }).success).toBe(false);
    expect(linkedListSnapshotSchema.safeParse({
      kind: 'linked-list',
      operation: 'set-next',
      headId: 'n1',
      nodes: [node('n1', 3, 'n2'), node('n2', 5, null)],
      targetId: 'n1',
    }).success).toBe(false);
  });

  it('rejects more than 40 nodes', () => {
    const nodes = Array.from({ length: 41 }, (_, index) =>
      node(`n${index}`, index, index === 40 ? null : `n${index + 1}`),
    );
    expect(linkedListSnapshotSchema.safeParse({
      kind: 'linked-list',
      operation: 'init',
      headId: 'n0',
      nodes,
    }).success).toBe(false);
  });

  it('keeps the Stage 7B stack/queue schema and accepts both protocol branches', () => {
    expect(structureSnapshotSchema.safeParse({
      kind: 'stack',
      operation: 'push',
      items: [{ id: 's1', value: 3 }],
      targetId: 's1',
    }).success).toBe(true);
    expect(structureSchema.safeParse(chain()).success).toBe(true);
    expect(structureSchema.safeParse({
      kind: 'queue',
      operation: 'enqueue',
      items: [{ id: 'q1', value: 3 }],
      targetId: 'q1',
    }).success).toBe(true);
  });

  it('adapts a linked frame and drops a malformed structure payload', () => {
    const doc = parseTraceDocument(framesToTraceDocument([
      {
        state: { type: 'linked', values: [3, 5] },
        message: 'visit 3',
        structure: chain(),
      },
      {
        state: { type: 'linked', values: [3, 5] },
        message: 'bad head',
        structure: { kind: 'linked-list', operation: 'visit', headId: 'missing', nodes: [], targetId: 'missing' },
      },
    ], 'linked source'));
    expect(doc.ok).toBe(true);
    if (!doc.ok) return;
    expect(doc.document.events[0].structure?.kind).toBe('linked-list');
    expect(doc.document.events[1].structure).toBeUndefined();
    expect(doc.document.events[1].state.type).toBe('linked');
  });
});
