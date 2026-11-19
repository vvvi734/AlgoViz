import { describe, expect, it } from 'vitest';
import rawDefault from '../../test/fixtures/hash-default-frames.json';
import rawEdge from '../../test/fixtures/hash-edge-frames.json';
import { buildHashModel } from '../visualization/hashModel';
import { hashSnapshotSchema, structureSchema, type HashSnapshot } from './schema';
import type { TraceState } from './types';

type Frame = { state: TraceState; structure: HashSnapshot; lessonStepId: string };
const defaults = rawDefault as unknown as Record<'hash-chain' | 'hash-probe', Frame[]>;
const edges = rawEdge as unknown as Record<'hash-chain' | 'hash-probe', Record<string, Frame[]>>;

function parse(frames: Frame[]): HashSnapshot[] {
  return frames.map((frame) => {
    const union = structureSchema.safeParse(frame.structure);
    expect(union.success, JSON.stringify(union.error?.issues)).toBe(true);
    const typed = hashSnapshotSchema.safeParse(frame.structure);
    expect(typed.success, JSON.stringify(typed.error?.issues)).toBe(true);
    return frame.structure;
  });
}

function edge(algorithm: 'hash-chain' | 'hash-probe', name: string): Frame[] {
  return edges[algorithm]![name]!;
}

function occupiedKeys(snapshot: HashSnapshot): number[] {
  return snapshot.slots.filter((slot) => slot.state === 'occupied').map((slot) => slot.key!);
}

function chainKeys(snapshot: HashSnapshot, bucket: number): number[] {
  const nodes = new Map(snapshot.nodes.map((node) => [node.id, node]));
  const keys: number[] = [];
  let id = snapshot.buckets[bucket]!.headId;
  while (id !== null) {
    const node = nodes.get(id);
    if (!node) break;
    keys.push(node.key);
    id = node.nextId;
  }
  return keys;
}

describe('F2 hash real Python fixtures', () => {
  it('accepts every default and edge frame as a hash snapshot', () => {
    parse(defaults['hash-chain']);
    parse(defaults['hash-probe']);
    for (const algorithm of ['hash-chain', 'hash-probe'] as const) {
      for (const frames of Object.values(edges[algorithm]!)) parse(frames);
    }
    expect(defaults['hash-chain']).toHaveLength(60);
    expect(defaults['hash-probe']).toHaveLength(182);
    const edgeCount = Object.values(edges)
      .flatMap((group) => Object.values(group))
      .reduce((sum, frames) => sum + frames.length, 0);
    expect(edgeCount).toBe(510);
  });

  it('chaining keeps 1/8/15 on bucket 1 and inserts each new node as the real head', () => {
    const frames = parse(defaults['hash-chain']);
    const afterThree = frames.find((snapshot) => snapshot.operation === 'insert' && snapshot.key === 15)!;
    expect(afterThree.hashIndex).toBe(1);
    expect(afterThree.bucketIndex).toBe(1);
    expect(chainKeys(afterThree, 1)).toEqual([15, 8, 1]);
    expect(afterThree.elementCount).toBe(3);
    expect(afterThree.nodes.map((node) => node.id)).toEqual(['n3', 'n2', 'n1']);
    expect(afterThree.nodes.find((node) => node.id === 'n3')!.nextId).toBe('n2');
    expect(afterThree.nodes.find((node) => node.id === 'n2')!.nextId).toBe('n1');
    expect(afterThree.nodes.find((node) => node.id === 'n1')!.nextId).toBeNull();

    const duplicate = frames.find((snapshot) => snapshot.operation === 'duplicate')!;
    expect(duplicate.key).toBe(8);
    expect(duplicate.currentNodeId).toBe('n2');
    expect(duplicate.elementCount).toBe(3);
    expect(duplicate.result).toBe('duplicate');
  });

  it('chaining deletes middle, tail and head nodes with real relinks and stable ids', () => {
    const frames = parse(defaults['hash-chain']);
    const middle = frames.find((snapshot) => snapshot.operation === 'delete-middle')!;
    expect(middle.key).toBe(8);
    expect(middle.previousNodeId).toBe('n3');
    expect(chainKeys(middle, 1)).toEqual([15, 1]);
    expect(middle.removed).toMatchObject({ kind: 'node', id: 'n2', key: 8, position: 'middle', nextId: 'n1' });
    expect(middle.nodes.some((node) => node.id === 'n2')).toBe(false);

    const tail = frames.find((snapshot) => snapshot.operation === 'delete-tail')!;
    expect(tail.key).toBe(1);
    expect(tail.previousNodeId).toBe('n3');
    expect(chainKeys(tail, 1)).toEqual([15]);
    expect(tail.removed).toMatchObject({ kind: 'node', id: 'n1', key: 1, position: 'tail', nextId: null });

    const head = frames.find((snapshot) => snapshot.operation === 'delete-head')!;
    expect(head.key).toBe(15);
    expect(head.bucketIndex).toBe(1);
    expect(chainKeys(head, 1)).toEqual([]);
    expect(head.removed).toMatchObject({ kind: 'node', id: 'n3', key: 15, position: 'head', nextId: null });

    const final = frames.at(-1)!;
    expect(final.operation).toBe('done');
    expect(chainKeys(final, 1)).toEqual([22]);
    expect(final.nodes.map((node) => node.id)).toEqual(['n4']);
    expect(final.elementCount).toBe(1);
  });

  it('probing keeps the standard sequence, reuses tombstones and wraps from slot 6 to slot 0', () => {
    const frames = parse(defaults['hash-probe']);
    expect(frames[0]!.tableSize).toBe(7);
    expect(frames[0]!.slots.every((slot) => slot.state === 'empty')).toBe(true);

    const full = frames.find((snapshot) => snapshot.operation === 'table-full')!;
    expect(full.key).toBe(31);
    expect(full.elementCount).toBe(7);
    expect(full.probePath).toEqual([3, 4, 5, 6, 0, 1, 2]);
    expect(full.result).toBe('full');
    expect(full.reason).toBe('full');
    expect(full.slots.every((slot) => slot.state === 'occupied')).toBe(true);

    const wrapInsert = frames.find((snapshot) => snapshot.operation === 'insert' && snapshot.key === 24)!;
    expect(wrapInsert.currentIndex).toBe(0);
    expect(wrapInsert.probePath).toEqual([3, 4, 5, 6, 0]);
    expect(wrapInsert.hashIndex).toBe(3);
    expect(wrapInsert.slots[0]!.key).toBe(24);

    const tombstone = frames.find((snapshot) => snapshot.operation === 'delete' && snapshot.key === 8)!;
    expect(tombstone.slots[2]!.state).toBe('deleted');
    expect(tombstone.slots[2]!.key).toBeNull();
    expect(tombstone.removed).toMatchObject({ kind: 'slot', index: 2, key: 8, id: 'e2' });

    const findAcrossTombstone = frames.find(
      (snapshot) => snapshot.operation === 'found' && snapshot.key === 15,
    )!;
    expect(findAcrossTombstone.currentIndex).toBe(3);
    expect(findAcrossTombstone.probePath).toEqual([1, 2, 3]);
    expect(findAcrossTombstone.result).toBe('found');

    const reuse = frames.find(
      (snapshot) => snapshot.operation === 'insert' && snapshot.key === 22 && snapshot.reusedDeleted,
    )!;
    expect(reuse.currentIndex).toBe(2);
    expect(reuse.slots[2]!.state).toBe('occupied');
    expect(reuse.slots[2]!.key).toBe(22);
    expect(reuse.elementCount).toBe(3);
  });

  it('probing never cuts a lookup at DELETED and reuses it only after scanning for duplicates', () => {
    const frames = parse(defaults['hash-probe']);
    const afterTwoDeletes = frames.find(
      (snapshot) => snapshot.operation === 'not-found' && snapshot.key === 31,
    )!;
    expect(afterTwoDeletes.probePath).toEqual([3, 4, 5, 6, 0, 1, 2]);
    expect(afterTwoDeletes.slots[3]!.state).toBe('deleted');
    expect(afterTwoDeletes.slots[0]!.state).toBe('deleted');
    expect(afterTwoDeletes.result).toBe('not-found');

    const reuse31 = frames.find(
      (snapshot) => snapshot.operation === 'insert' && snapshot.key === 31 && snapshot.reusedDeleted,
    )!;
    expect(reuse31.currentIndex).toBe(3);
    expect(reuse31.slots[3]!.state).toBe('occupied');
    expect(reuse31.elementCount).toBe(6);

    const reuse38 = frames.find(
      (snapshot) => snapshot.operation === 'insert' && snapshot.key === 38 && snapshot.reusedDeleted,
    )!;
    expect(reuse38.currentIndex).toBe(0);
    expect(reuse38.elementCount).toBe(7);

    const final = frames.at(-1)!;
    expect(final.operation).toBe('done');
    expect(final.slots.map((slot) => slot.state)).toEqual(Array(7).fill('occupied'));
    expect(occupiedKeys(final).sort((a, b) => a - b)).toEqual([1, 3, 10, 17, 22, 31, 38]);
  });

  it('probing duplicate, empty, single, negative, full and table-2 cases stay consistent', () => {
    const duplicate = parse(edge('hash-probe', 'duplicate'));
    expect(duplicate.map((snapshot) => snapshot.operation)).toContain('duplicate');
    expect(duplicate.at(-1)!.elementCount).toBe(0);

    const empty = parse(edge('hash-probe', 'empty'));
    expect(empty.map((snapshot) => snapshot.operation)).toEqual(['init', 'done']);
    expect(empty.at(-1)!.elementCount).toBe(0);

    const single = parse(edge('hash-probe', 'single'));
    expect(single.at(-2)!.operation).toBe('not-found');
    expect(single.at(-2)!.slots[5]!.state).toBe('deleted');

    const negative = parse(edge('hash-probe', 'negative'));
    for (const snapshot of negative) {
      if (snapshot.key !== null) {
        expect(snapshot.hashIndex).toBe(((snapshot.key % snapshot.tableSize) + snapshot.tableSize) % snapshot.tableSize);
        expect(snapshot.hashIndex).toBeGreaterThanOrEqual(0);
      }
    }

    const full = parse(edge('hash-probe', 'table2_full'));
    expect(full.some((snapshot) => snapshot.operation === 'table-full')).toBe(true);
    expect(full.at(-1)!.elementCount).toBe(1);

    const two = parse(edge('hash-probe', 'table2_full'));
    expect(two[0]!.tableSize).toBe(2);
    expect(two[0]!.slots).toHaveLength(2);
  });

  it('chaining edge cases cover empty, single, negative, table-2, long chain and failed deletes', () => {
    const empty = parse(edge('hash-chain', 'empty'));
    expect(empty.map((snapshot) => snapshot.operation)).toEqual(['init', 'done']);
    expect(empty.at(-1)!.nodes).toHaveLength(0);

    const single = parse(edge('hash-chain', 'single'));
    expect(single.at(-2)!.operation).toBe('not-found');
    expect(single.at(-2)!.nodes).toHaveLength(0);

    const negative = parse(edge('hash-chain', 'negative'));
    for (const snapshot of negative) {
      if (snapshot.key !== null) {
        expect(snapshot.hashIndex).toBe(((snapshot.key % snapshot.tableSize) + snapshot.tableSize) % snapshot.tableSize);
      }
    }

    const orders = parse(edge('hash-chain', 'delete_orders'));
    expect(orders.some((snapshot) => snapshot.operation === 'delete-tail')).toBe(true);
    expect(orders.some((snapshot) => snapshot.operation === 'delete-middle')).toBe(true);
    expect(orders.some((snapshot) => snapshot.operation === 'delete-head')).toBe(true);

    const longChain = parse(edge('hash-chain', 'long_chain'));
    const nodeIds = new Set(longChain.flatMap((snapshot) => snapshot.nodes.map((node) => node.id)));
    expect(nodeIds.size).toBeGreaterThanOrEqual(4);
    for (const snapshot of longChain) {
      const ids = new Set(snapshot.nodes.map((node) => node.id));
      expect(ids.size).toBe(snapshot.nodes.length);
      for (const node of snapshot.nodes) {
        if (node.nextId !== null) expect(ids.has(node.nextId)).toBe(true);
      }
    }

    const table2 = parse(edge('hash-chain', 'table2'));
    expect(table2[0]!.tableSize).toBe(2);
    expect(table2[0]!.buckets).toHaveLength(2);

    const missing = parse(edge('hash-chain', 'missing'));
    expect(missing.at(-2)!.operation).toBe('not-found');
    expect(missing.some((snapshot) => snapshot.operation === 'delete-missing')).toBe(true);
  });

  it('builds chaining and probing models from the same frame without inventing state', () => {
    const chainFrame = defaults['hash-chain'].find(
      (frame) => frame.structure.operation === 'duplicate' && frame.structure.key === 8,
    )!;
    const chain = buildHashModel(chainFrame.structure, chainFrame.state)!;
    expect(chain.kind).toBe('hash');
    expect(chain.buckets).toHaveLength(7);
    expect(chain.buckets[1]!.nodes.map((node) => node.key)).toEqual([15, 8, 1]);
    expect(chain.buckets[1]!.nodes.map((node) => node.nextId)).toEqual(['n2', 'n1', null]);
    expect(chain.buckets[1]!.nodes.map((node) => node.position)).toEqual(['head', 'middle', 'tail']);
    expect(chain.buckets[1]!.active).toBe(true);
    expect(chain.slots).toEqual([]);

    const probeFrame = defaults['hash-probe'].find(
      (frame) => frame.structure.operation === 'found' && frame.structure.key === 15,
    )!;
    const probe = buildHashModel(probeFrame.structure, probeFrame.state)!;
    expect(probe.slots).toHaveLength(7);
    expect(probe.slots[2]!.marks).toContain('deleted');
    expect(probe.slots[3]!.marks).toContain('current');
    expect(probe.slots[1]!.marks).toContain('probe');
    expect(probe.probePath).toEqual([1, 2, 3]);
    expect(probe.buckets).toEqual([]);
    expect(probe.loadFactor).toBeCloseTo(2 / 7, 9);
  });

  it('rejects fabricated hash states instead of painting a plausible lie', () => {
    const chaining = JSON.parse(JSON.stringify(defaults['hash-chain'][10]!.structure)) as HashSnapshot;
    chaining.hashIndex = 2;
    expect(hashSnapshotSchema.safeParse(chaining).success).toBe(false);

    const badNext = JSON.parse(JSON.stringify(defaults['hash-chain'].at(-1)!.structure)) as HashSnapshot;
    const node = badNext.nodes.find((item) => item.id === 'n4')!;
    node.nextId = 'n4';
    expect(hashSnapshotSchema.safeParse(badNext).success).toBe(false);

    const badDelete = JSON.parse(JSON.stringify(defaults['hash-chain'].find((frame) => frame.structure.operation === 'delete-head')!.structure)) as HashSnapshot;
    if (badDelete.removed?.kind === 'node') badDelete.buckets[1]!.headId = 'n3';
    expect(hashSnapshotSchema.safeParse(badDelete).success).toBe(false);

    const probing = JSON.parse(JSON.stringify(defaults['hash-probe'].find((frame) => frame.structure.operation === 'delete' && frame.structure.key === 8)!.structure)) as HashSnapshot;
    probing.slots[2]!.state = 'empty';
    expect(hashSnapshotSchema.safeParse(probing).success).toBe(false);

    const badPath = JSON.parse(JSON.stringify(defaults['hash-probe'].find((frame) => frame.structure.operation === 'found' && frame.structure.key === 15)!.structure)) as HashSnapshot;
    badPath.probePath = [1, 2, 4];
    expect(hashSnapshotSchema.safeParse(badPath).success).toBe(false);

    const fakeFull = JSON.parse(JSON.stringify(defaults['hash-probe'].find((frame) => frame.structure.operation === 'table-full')!.structure)) as HashSnapshot;
    fakeFull.elementCount = 6;
    fakeFull.loadFactor = 6 / 7;
    expect(hashSnapshotSchema.safeParse(fakeFull).success).toBe(false);

    const wrongCount = JSON.parse(JSON.stringify(defaults['hash-probe'].find((frame) => frame.structure.operation === 'delete' && frame.structure.key === 8)!.structure)) as HashSnapshot;
    wrongCount.loadFactor = 0.5;
    expect(hashSnapshotSchema.safeParse(wrongCount).success).toBe(false);
  });

  it('returns null instead of painting a stale array', () => {
    const frame = defaults['hash-chain'][0]!;
    const staleValues = [...((frame.state.values ?? []) as number[])];
    staleValues[0] = 999;
    const stale = { type: 'array', values: staleValues } as TraceState;
    expect(buildHashModel(frame.structure, stale)).toBeNull();
  });
});
