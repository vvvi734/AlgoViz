import { describe, expect, it } from 'vitest';
import rawDefault from '../../test/fixtures/bst-default-frames.json';
import rawEdge from '../../test/fixtures/bst-edge-frames.json';
import {
  bstSnapshotSchema,
  structureSchema,
  type BstSnapshot,
} from './schema';
import { buildBstModel } from '../visualization/bstModel';

type Frame = { structure: BstSnapshot };
const defaults = rawDefault as unknown as Record<string, Frame[]>;
const edges = rawEdge as unknown as Record<string, Frame[]>;

function parse(frames: Frame[]): BstSnapshot[] {
  return frames.map((frame) => {
    const union = structureSchema.safeParse(frame.structure);
    expect(union.success, JSON.stringify(union.error?.issues)).toBe(true);
    const typed = bstSnapshotSchema.safeParse(frame.structure);
    expect(typed.success, JSON.stringify(typed.error?.issues)).toBe(true);
    return frame.structure;
  });
}

function final(name: string): BstSnapshot {
  return parse(defaults[name]!).at(-1)!;
}

function valuesAt(snapshot: BstSnapshot, ids: string[]): number[] {
  const values = new Map(snapshot.nodes.map((node) => [node.id, node.value]));
  return ids.map((id) => values.get(id) as number);
}

function byValue(snapshot: BstSnapshot, value: number) {
  return snapshot.nodes.find((node) => node.value === value);
}

describe('T1 BST real Python fixtures', () => {
  it('accepts every default and edge frame as a valid BST snapshot', () => {
    for (const frames of Object.values(defaults)) parse(frames);
    for (const frames of Object.values(edges)) parse(frames);
    expect(Object.values(defaults).reduce((sum, frames) => sum + frames.length, 0)).toBe(53);
    expect(Object.values(edges).reduce((sum, frames) => sum + frames.length, 0)).toBe(44);
  });

  it('finds an existing key and records real comparisons plus a sorted in-order result', () => {
    const all = parse(defaults['find-success']!);
    const found = all.find((frame) => frame.operation === 'found')!;
    expect(found.result).toBe('found');
    expect(found.targetValue).toBe(40);
    expect(found.visitedIds).toHaveLength(3);
    expect(valuesAt(found, found.pathIds)).toEqual([50, 30, 40]);
    expect(valuesAt(found, found.inorderIds)).toEqual([20, 30, 40, 50, 60, 70, 80]);
    expect(all.at(-1)!.result).toBe('found');
  });

  it('reports a missing key without inventing a target node', () => {
    const all = parse(defaults['find-missing']!);
    const missing = all.find((frame) => frame.operation === 'not-found')!;
    expect(missing.result).toBe('not-found');
    expect(missing.targetNodeId).toBeNull();
    expect(missing.currentNodeId).not.toBeNull();
    expect(all.at(-1)!.result).toBe('not-found');
  });

  it('inserts a new stable-id node and updates the real parent link', () => {
    const all = parse(defaults['insert']!);
    const attach = all.find((frame) => frame.operation === 'attach')!;
    const parent = byValue(attach, 40)!;
    const inserted = byValue(attach, 35)!;
    expect(inserted.id).toBe('b8');
    expect(inserted.leftId).toBeNull();
    expect(inserted.rightId).toBeNull();
    expect(parent.leftId).toBe(inserted.id);
    expect(attach.parentId).toBe(parent.id);
    expect(attach.side).toBe('left');
    expect(attach.insertedId).toBe(inserted.id);
    expect(valuesAt(attach, attach.inorderIds)).toEqual([20, 30, 35, 40, 50, 60, 70, 80]);
    expect(final('insert').nodes.map((node) => node.id)).toContain('b8');
  });

  it('rejects duplicate insertion and leaves the tree untouched', () => {
    const all = parse(edges['insert-duplicate']!);
    const duplicate = all.find((frame) => frame.operation === 'duplicate')!;
    expect(duplicate.result).toBe('duplicate');
    expect(duplicate.nodes).toHaveLength(7);
    expect(duplicate.insertedId).toBeNull();
    expect(all.at(-1)!.result).toBe('duplicate');
    expect(valuesAt(all.at(-1)!, all.at(-1)!.inorderIds)).toEqual([20, 30, 40, 50, 60, 70, 80]);
  });

  it('deletes a leaf through the real parent pointer and reports the removed node', () => {
    const all = parse(defaults['delete-leaf']!);
    const leaf = all.find((frame) => frame.operation === 'delete-leaf')!;
    const parent = byValue(leaf, 30)!;
    expect(leaf.result).toBe('deleted');
    expect(leaf.deleteCase).toBe('leaf');
    expect(parent.leftId).toBeNull();
    expect(leaf.removedNode).toMatchObject({ value: 20, role: 'target', parentId: parent.id, side: 'left', replacementId: null });
    expect(valuesAt(leaf, leaf.inorderIds)).toEqual([30, 40, 50, 60, 70, 80]);
    expect(leaf.rootId).toBe('b1');
  });

  it('deletes a one-child node by reconnecting its child, including the stable replacement id', () => {
    const all = parse(defaults['delete-one']!);
    const one = all.find((frame) => frame.operation === 'delete-one')!;
    const parent = byValue(one, 70)!;
    const replacement = byValue(one, 65)!;
    expect(one.deleteCase).toBe('one-child');
    expect(one.removedNode).toMatchObject({ value: 60, parentId: parent.id, side: 'left' });
    expect(parent.leftId).toBe(replacement.id);
    expect(one.removedNode!.replacementId).toBe(replacement.id);
    expect(valuesAt(one, one.inorderIds)).toEqual([20, 30, 40, 50, 65, 70, 80]);
  });

  it('deletes a two-child root by transplanting the real in-order successor and keeping its id', () => {
    const all = parse(defaults['delete-two']!);
    const successorSearch = all.find((frame) => frame.operation === 'successor-search')!;
    const successorFound = all.find((frame) => frame.operation === 'successor-found')!;
    const detach = all.find((frame) => frame.operation === 'successor-detach')!;
    const transplant = all.find((frame) => frame.operation === 'transplant')!;
    const successor = byValue(transplant, 60)!;
    expect(successorSearch.successorId).toBe(successor.id);
    expect(successorFound.currentNodeId).toBe(successor.id);
    expect(detach.removedNode).toMatchObject({ value: 60, role: 'successor', parentId: 'b3', side: 'left', replacementId: 'b8' });
    expect(transplant.removedNode).toMatchObject({ value: 50, role: 'target', parentId: null, side: null, replacementId: successor.id });
    expect(transplant.oldRootId).toBe('b1');
    expect(transplant.rootId).toBe(successor.id);
    expect(successor.leftId).toBe('b2');
    expect(successor.rightId).toBe('b3');
    expect(byValue(transplant, 70)!.leftId).toBe('b8');
    expect(valuesAt(transplant, transplant.inorderIds)).toEqual([20, 30, 40, 60, 65, 70, 80]);
    expect(all.at(-1)!.result).toBe('deleted');
  });

  it('tracks root changes for leaf and one-child root deletions', () => {
    const leafRoot = parse(edges['delete-root-one']!);
    const one = leafRoot.find((frame) => frame.operation === 'delete-one')!;
    expect(one.oldRootId).toBe('b1');
    expect(one.rootId).toBe('b2');
    expect(one.removedNode).toMatchObject({ value: 50, parentId: null, side: null, replacementId: 'b2' });

    const twoRoot = parse(edges['delete-root-two']!);
    const transplant = twoRoot.find((frame) => frame.operation === 'transplant')!;
    expect(transplant.oldRootId).toBe('b1');
    expect(transplant.rootId).toBe('b6');
  });

  it('handles empty, single, missing-delete and empty-delete inputs', () => {
    const emptyFind = parse(edges['find-empty']!);
    expect(emptyFind.at(-1)!.nodes).toEqual([]);
    expect(emptyFind.at(-1)!.result).toBe('not-found');
    const single = parse(edges['find-single']!);
    expect(single.at(-1)!.nodes).toHaveLength(1);
    expect(single.at(-1)!.result).toBe('found');
    const insertEmpty = parse(edges['insert-empty']!);
    expect(insertEmpty.at(-1)!.rootId).toBe('b1');
    expect(insertEmpty.at(-1)!.nodes[0]!.value).toBe(7);
    const deleteEmpty = parse(edges['delete-empty']!);
    expect(deleteEmpty.at(-1)!.result).toBe('missing');
    expect(deleteEmpty.at(-1)!.nodes).toEqual([]);
    const deleteMissing = parse(edges['delete-missing']!);
    expect(deleteMissing.at(-1)!.result).toBe('missing');
    expect(deleteMissing.at(-1)!.nodes).toHaveLength(7);
  });

  it('keeps ids stable across every frame and every deletion case', () => {
    for (const frames of [defaults['delete-leaf']!, defaults['delete-one']!, defaults['delete-two']!]) {
      const parsed = parse(frames);
      const first = new Map(parsed[1]!.nodes.map((node) => [node.value, node.id]));
      for (const snapshot of parsed) {
        for (const node of snapshot.nodes) {
          if (first.has(node.value)) expect(node.id, `value ${node.value}`).toBe(first.get(node.value));
        }
      }
    }
  });

  it('builds visual flags from recorded fields, not positions, and restores them on jumps', () => {
    const all = parse(defaults['delete-two']!);
    const detach = all.find((frame) => frame.operation === 'successor-detach')!;
    const model = buildBstModel(detach, 'empty')!;
    expect(model.removed).toMatchObject({ value: 60, role: 'successor' });
    expect(model.nodes.find((node) => node.id === 'b1')?.active).toBe(true);
    expect(model.nodes.find((node) => node.id === 'b1')?.onPath).toBe(true);
    expect(model.nodes.some((node) => node.id === 'b6')).toBe(false);
    expect(model.edges.every((edge) => edge.fromId !== 'b6' && edge.toId !== 'b6')).toBe(true);

    const transplant = all.find((frame) => frame.operation === 'transplant')!;
    const transplantModel = buildBstModel(transplant, 'empty')!;
    expect(transplantModel.rootId).toBe('b6');
    expect(transplantModel.removed).toMatchObject({ value: 50, role: 'target' });
    expect(transplantModel.nodes.find((node) => node.id === 'b6')?.active).toBe(true);
    expect(transplantModel.nodes.find((node) => node.id === 'b6')?.role).toBe('root');
    expect(transplantModel.pathIds.at(-1)).toBe('b6');
  });

  it('rejects malformed snapshots instead of guessing a tree', () => {
    const base = final('find-success');
    const duplicateValue = {
      ...base,
      nodes: base.nodes.map((node) =>
        node.id === 'b5' ? { ...node, value: 30 } : node,
      ),
    };
    expect(bstSnapshotSchema.safeParse(duplicateValue).success).toBe(false);
    expect(bstSnapshotSchema.safeParse({ ...base, rootId: 'missing' }).success).toBe(false);
    expect(bstSnapshotSchema.safeParse({ ...base, inorderIds: [...base.inorderIds, 'b1'] }).success).toBe(false);
    expect(bstSnapshotSchema.safeParse({
      ...base,
      nodes: base.nodes.filter((node) => node.id !== 'b1'),
      rootId: 'b2',
    }).success).toBe(false);
  });

  it('rejects a removed node that is still attached and a replacement that is not', () => {
    const base = final('delete-leaf');
    expect(bstSnapshotSchema.safeParse({
      ...base,
      removedNode: { ...base.removedNode!, id: 'b1' },
    }).success).toBe(false);
    expect(bstSnapshotSchema.safeParse({
      ...base,
      removedNode: { ...base.removedNode!, replacementId: 'missing' },
      replacementId: 'missing',
    }).success).toBe(false);
  });
});
