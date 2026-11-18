import { describe, expect, it } from 'vitest';
import rawDefault from '../../test/fixtures/avl-default-frames.json';
import rawEdge from '../../test/fixtures/avl-edge-frames.json';
import {
  avlSnapshotSchema,
  structureSchema,
  type AvlSnapshot,
} from './schema';
import { buildAvlModel } from '../visualization/avlModel';

type Frame = { structure: AvlSnapshot };
const defaults = rawDefault as unknown as Record<string, Frame[]>;
const edges = rawEdge as unknown as Record<string, Frame[]>;

function parse(frames: Frame[]): AvlSnapshot[] {
  return frames.map((frame) => {
    const typed = avlSnapshotSchema.safeParse(frame.structure);
    expect(typed.success, JSON.stringify(typed.error?.issues)).toBe(true);
    const union = structureSchema.safeParse(frame.structure);
    expect(union.success, JSON.stringify(union.error?.issues)).toBe(true);
    return frame.structure;
  });
}

function final(name: string): AvlSnapshot {
  return parse(defaults[name]!).at(-1)!;
}

function byId(snapshot: AvlSnapshot, id: string) {
  return snapshot.nodes.find((node) => node.id === id);
}

function inorderValues(snapshot: AvlSnapshot): number[] {
  return snapshot.inorderIds.map((id) => byId(snapshot, id)!.value);
}

function rotations(snapshot: AvlSnapshot[]) {
  return snapshot.filter((frame) => frame.operation === 'rotate-left' || frame.operation === 'rotate-right');
}

describe('T2 AVL real Python fixtures', () => {
  it('accepts every default and edge frame as a valid AVL snapshot', () => {
    for (const frames of Object.values(defaults)) parse(frames);
    for (const frames of Object.values(edges)) parse(frames);
    expect(Object.values(defaults).reduce((sum, frames) => sum + frames.length, 0)).toBe(142);
    expect(Object.values(edges).reduce((sum, frames) => sum + frames.length, 0)).toBe(34);
  });

  it('covers LL, RR, LR and RL with real before/after pointer changes', () => {
    const expected: Record<string, { case: string; total: number; frames: number }> = {
      'insert-ll': { case: 'LL', total: 1, frames: 2 },
      'insert-rr': { case: 'RR', total: 1, frames: 2 },
      'insert-lr': { case: 'LR', total: 2, frames: 4 },
      'insert-rl': { case: 'RL', total: 2, frames: 4 },
    };
    for (const [name, expectation] of Object.entries(expected)) {
      const all = parse(defaults[name]!);
      const rotateFrames = rotations(all);
      expect(rotateFrames, name).toHaveLength(expectation.frames);
      expect(new Set(rotateFrames.map((frame) => frame.rotationCase)), name).toEqual(new Set([expectation.case]));
      expect(new Set(rotateFrames.map((frame) => frame.rotationTotal)), name).toEqual(new Set([expectation.total]));
      expect(new Set(rotateFrames.map((frame) => frame.rotationStep)), name).toEqual(
        expectation.total === 2 ? new Set([1, 2]) : new Set([1]),
      );
      expect(rotateFrames.map((frame) => frame.rotationPhase)).toEqual(
        expectation.total === 2 ? ['before', 'after', 'before', 'after'] : ['before', 'after'],
      );

      for (const frame of rotateFrames) {
        const pivot = byId(frame, frame.pivotId!)!;
        const promoted = byId(frame, frame.promotedId!)!;
        if (frame.rotationPhase === 'before') {
          if (frame.operation === 'rotate-right') expect(pivot.leftId, name).toBe(promoted.id);
          if (frame.operation === 'rotate-left') expect(pivot.rightId, name).toBe(promoted.id);
        } else {
          if (frame.operation === 'rotate-right') expect(promoted.rightId, name).toBe(pivot.id);
          if (frame.operation === 'rotate-left') expect(promoted.leftId, name).toBe(pivot.id);
        }
      }
      expect(all.at(-1)!.result, name).toBe('inserted');
      expect(inorderValues(all.at(-1)!), name).toEqual([...inorderValues(all.at(-1)!)].sort((a, b) => a - b));
    }
  });

  it('keeps every stable id attached to the same value across all frames', () => {
    for (const frames of Object.values(defaults)) {
      const parsed = parse(frames);
      const first = parsed[0]!;
      const values = new Map(first.nodes.map((node) => [node.id, node.value]));
      for (const snapshot of parsed) {
        for (const node of snapshot.nodes) {
          if (values.has(node.id)) expect(node.value, `id ${node.id} changed value`).toBe(values.get(node.id));
          else values.set(node.id, node.value);
        }
      }
    }
  });

  it('updates real heights and balance factors from the actual attached children', () => {
    const all = parse(defaults['insert-lr']!);
    const before = all.find((frame) => frame.operation === 'imbalance')!;
    expect(before.rotationCase).toBe('LR');
    expect(Math.abs(byId(before, before.imbalanceId!)!.balance)).toBeGreaterThan(1);
    for (const frame of all) {
      for (const node of frame.nodes) {
        const leftHeight = node.leftId ? byId(frame, node.leftId)!.height : 0;
        const rightHeight = node.rightId ? byId(frame, node.rightId)!.height : 0;
        expect(node.height, `height ${node.id}`).toBe(1 + Math.max(leftHeight, rightHeight));
        expect(node.balance, `balance ${node.id}`).toBe(leftHeight - rightHeight);
      }
    }
  });

  it('deletes a leaf, a one-child node, a two-child root and a missing key', () => {
    const leaf = parse(defaults['delete-leaf']!);
    const leafFrame = leaf.find((frame) => frame.operation === 'delete-leaf')!;
    expect(leafFrame.deleteCase).toBe('leaf');
    expect(leafFrame.rootId).toBe('a1');
    expect(leaf.at(-1)!.rootId).toBe('a2');
    expect(leaf.at(-1)!.nodes.some((node) => node.value === 35)).toBe(false);

    const one = parse(defaults['delete-one']!);
    const oneFrame = one.find((frame) => frame.operation === 'delete-one')!;
    expect(oneFrame.deleteCase).toBe('one-child');
    expect(byId(oneFrame, oneFrame.removedNode!.replacementId!)!.value).toBe(35);
    expect(byId(oneFrame, oneFrame.removedNode!.replacementId!)!.id).toBe(oneFrame.removedNode!.replacementId);
    expect(one.at(-1)!.nodes.some((node) => node.value === 40)).toBe(false);

    const two = parse(defaults['delete-two']!);
    const found = two.find((frame) => frame.operation === 'successor-found')!;
    const transplant = two.find((frame) => frame.operation === 'transplant')!;
    expect(found.currentNodeId).toBe(found.successorId);
    expect(byId(transplant, transplant.successorId!)!.value).toBe(60);
    expect(transplant.rootId).toBe(transplant.successorId);
    expect(transplant.oldRootId).toBe('a1');
    expect(transplant.nodes.some((node) => node.id === 'a1')).toBe(false);
    expect(inorderValues(two.at(-1)!) ).toEqual([20, 30, 40, 60, 65, 70, 80]);

    const missing = parse(defaults['delete-missing']!);
    expect(missing.at(-1)!.result).toBe('missing');
    expect(missing.at(-1)!.nodes).toHaveLength(6);
  });

  it('rebalances multiple ancestors after one deterministic delete', () => {
    const all = parse(defaults['delete-cascade']!);
    const imbalances = all.filter((frame) => frame.operation === 'imbalance');
    const rotateFrames = rotations(all);
    expect(new Set(imbalances.map((frame) => frame.imbalanceId)).size).toBeGreaterThanOrEqual(2);
    expect(rotateFrames).toHaveLength(8);
    expect(rotateFrames.every((frame) => frame.rotationCase === 'LR')).toBe(true);
    expect(all.at(-1)!.result).toBe('deleted');
    expect(all.at(-1)!.nodes.every((node) => Math.abs(node.balance) <= 1)).toBe(true);
    expect(all.at(-1)!.nodes.some((node) => node.value === 12)).toBe(false);
  });

  it('handles empty, duplicate, missing and invalid-value inputs without fabricating nodes', () => {
    const emptyInsert = parse(edges['insert-empty']!);
    expect(emptyInsert.at(-1)!.rootId).toBe('a1');
    expect(emptyInsert.at(-1)!.nodes).toHaveLength(1);
    const duplicate = parse(edges['insert-duplicate']!);
    expect(duplicate.at(-1)!.result).toBe('duplicate');
    expect(duplicate.at(-1)!.nodes).toHaveLength(3);
    const emptyDelete = parse(edges['delete-empty']!);
    expect(emptyDelete.at(-1)!.result).toBe('missing');
    expect(emptyDelete.at(-1)!.nodes).toEqual([]);
    const rootLeaf = parse(edges['delete-root-leaf']!);
    expect(rootLeaf.at(-1)!.rootId).toBeNull();
    const rootOne = parse(edges['delete-root-one']!);
    expect(rootOne.at(-1)!.rootId).toBe('a2');
    const invalid = parse(edges['invalid-values']!);
    expect(invalid.at(-1)!.nodes).toHaveLength(3);
  });

  it('restores node ids, parent pointers and heights after backward scrubbing', () => {
    const all = parse(defaults['insert-rl']!);
    const afterFirst = all.find((frame) => frame.operation === 'rotate-right' && frame.rotationPhase === 'after')!;
    const model = buildAvlModel(afterFirst, 'empty')!;
    expect(model.kind).toBe('avl');
    expect(model.rotationCase).toBe('RL');
    expect(model.nodes.find((node) => node.id === model.promotedId)?.promoted).toBe(true);
    expect(model.nodes.find((node) => node.id === model.pivotId)?.pivot).toBe(true);
    // After a completed rotation the recorded imbalance id is historical metadata,
    // so the visual model must not keep painting the fixed node as still broken.
    expect(model.nodes.find((node) => node.id === model.imbalanceId)?.imbalance).toBe(false);
    expect(model.edges.some((edge) => edge.rotating)).toBe(true);

    const done = all.at(-1)!;
    const doneModel = buildAvlModel(done, 'empty')!;
    expect(doneModel.rootId).toBe(done.rootId);
    expect(doneModel.nodes.map((node) => node.id).sort()).toEqual(done.nodes.map((node) => node.id).sort());
    expect(doneModel.nodes.every((node) => Math.abs(node.balance) <= 1)).toBe(true);
  });

  it('rejects malformed snapshots instead of guessing a tree', () => {
    const base = final('insert-ll');
    const badHeight = {
      ...base,
      nodes: base.nodes.map((node) => node.id === base.rootId ? { ...node, height: 99 } : node),
    };
    expect(avlSnapshotSchema.safeParse(badHeight).success).toBe(false);
    const badBalance = {
      ...base,
      nodes: base.nodes.map((node) => node.id === base.rootId ? { ...node, balance: 99 } : node),
    };
    expect(avlSnapshotSchema.safeParse(badBalance).success).toBe(false);
    const badRoot = { ...base, rootId: 'missing' };
    expect(avlSnapshotSchema.safeParse(badRoot).success).toBe(false);
    const duplicateValue = {
      ...base,
      nodes: base.nodes.map((node) => node.id === 'a2' ? { ...node, value: 30 } : node),
    };
    expect(avlSnapshotSchema.safeParse(duplicateValue).success).toBe(false);
    const attachedRemoved = {
      ...base,
      removedNode: { id: base.rootId!, value: 30, parentId: null, side: null, role: 'target', replacementId: null },
    };
    expect(avlSnapshotSchema.safeParse(attachedRemoved).success).toBe(false);
  });
});
