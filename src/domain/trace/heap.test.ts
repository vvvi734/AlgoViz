import { describe, expect, it } from 'vitest';
import rawDefault from '../../test/fixtures/heap-default-frames.json';
import rawEdge from '../../test/fixtures/heap-edge-frames.json';
import {
  maxHeapSnapshotSchema,
  structureSchema,
  type MaxHeapSnapshot,
} from './schema';
import { layoutCompleteHeap } from '../visualization/heapLayout';
import { buildHeapModel } from '../visualization/heapModel';

type Frame = { structure: MaxHeapSnapshot };
const defaults = rawDefault as unknown as Record<string, Frame[]>;
const edges = rawEdge as unknown as Record<string, Frame[]>;

function parse(frames: Frame[]): MaxHeapSnapshot[] {
  return frames.map((frame) => {
    const union = structureSchema.safeParse(frame.structure);
    expect(union.success, JSON.stringify(union.error?.issues)).toBe(true);
    const typed = maxHeapSnapshotSchema.safeParse(frame.structure);
    expect(typed.success, JSON.stringify(typed.error?.issues)).toBe(true);
    return frame.structure;
  });
}

function snapshot(name: string): MaxHeapSnapshot[] {
  return parse(defaults[name]!);
}

function values(snapshotValue: MaxHeapSnapshot): number[] {
  return snapshotValue.elements.map((element) => element.value);
}

function slotOf(snapshotValue: MaxHeapSnapshot, id: string): number {
  return snapshotValue.elements.find((element) => element.id === id)!.slot;
}

function heapOrdered(valuesToCheck: number[]): boolean {
  for (let parent = 0; parent < valuesToCheck.length; parent += 1) {
    for (const child of [2 * parent + 1, 2 * parent + 2]) {
      if (child < valuesToCheck.length && valuesToCheck[parent] < valuesToCheck[child]) return false;
    }
  }
  return true;
}

describe('T3 max-heap real Python fixtures', () => {
  it('accepts every default and edge frame as a max-heap snapshot', () => {
    for (const frames of Object.values(defaults)) parse(frames);
    for (const frames of Object.values(edges)) parse(frames);
    expect(Object.values(defaults).reduce((sum, frames) => sum + frames.length, 0)).toBe(79);
    expect(Object.values(edges).reduce((sum, frames) => sum + frames.length, 0)).toBe(62);
  });

  it('builds a real max heap from the last non-leaf and reports result = built', () => {
    const all = snapshot('build');
    const start = all.find((frame) => frame.operation === 'build-start')!;
    expect(start.totalSize).toBe(7);
    expect(start.heapSize).toBe(7);
    expect(start.activeId).toBeNull();
    expect(start.pathIds).toEqual([]);
    const final = all.at(-1)!;
    expect(final.result).toBe('built');
    expect(values(final)).toEqual([9, 7, 9, 4, 5, 2, 1]);
    expect(heapOrdered(values(final))).toBe(true);
    expect(all.filter((frame) => frame.operation === 'heapify-node').map((frame) => frame.activeId)).toEqual([
      'h3', 'h2', 'h1',
    ]);
  });

  it('pushes 10 to the tail and sifts it to the root without renaming the element', () => {
    const all = snapshot('push');
    const append = all.find((frame) => frame.operation === 'push-append')!;
    expect(append.totalSize).toBe(7);
    expect(append.heapSize).toBe(7);
    expect(append.addedId).toBe('h7');
    expect(append.activeId).toBe('h7');
    expect(slotOf(append, 'h7')).toBe(6);
    expect(values(append)).toEqual([9, 8, 6, 3, 7, 2, 10]);
    const final = all.at(-1)!;
    expect(final.result).toBe('pushed');
    expect(values(final)).toEqual([10, 8, 9, 3, 7, 2, 6]);
    expect(slotOf(final, 'h7')).toBe(0);
    expect(final.rootId).toBe('h7');
    expect(heapOrdered(values(final))).toBe(true);
  });

  it('extracts the real maximum, moves the tail to the root and restores the heap', () => {
    const all = snapshot('extract');
    const select = all.find((frame) => frame.operation === 'extract-select')!;
    expect(select.activeId).toBe('h1');
    expect(values(select)).toEqual([9, 8, 6, 3, 7, 2, 5]);
    const replace = all.find((frame) => frame.operation === 'replace-root')!;
    expect(replace.removed).toMatchObject({ id: 'h1', value: 9, slot: 0 });
    expect(replace.replacement).toMatchObject({ id: 'h7', fromSlot: 6, toSlot: 0 });
    expect(replace.totalSize).toBe(6);
    expect(replace.heapSize).toBe(6);
    expect(replace.rootId).toBe('h7');
    expect(replace.elements.some((element) => element.id === 'h1')).toBe(false);
    const final = all.at(-1)!;
    expect(final.result).toBe('extracted');
    expect(final.removed).toMatchObject({ value: 9 });
    expect(values(final)).toEqual([8, 7, 6, 3, 5, 2]);
    expect(heapOrdered(values(final))).toBe(true);
  });

  it('sorts in place, grows an ascending suffix and never reshapes a surviving slot', () => {
    const all = snapshot('sort');
    const buildDone = all.find((frame) => frame.operation === 'build-done')!;
    expect(heapOrdered(values(buildDone))).toBe(true);
    const swaps = all.filter((frame) => frame.operation === 'swap-to-end');
    expect(swaps).toHaveLength(6);
    let previousHeapSize = buildDone.heapSize;
    for (const frame of swaps) {
      expect(frame.heapSize).toBe(previousHeapSize - 1);
      expect(frame.sortedFrom).toBe(frame.heapSize);
      const secondSlot = frame.elements.find((element) => element.id === frame.swap!.secondId)!.slot;
      expect(secondSlot).toBe(frame.heapSize);
      const suffix = values(frame).slice(frame.sortedFrom!);
      expect(suffix).toEqual([...suffix].sort((a, b) => a - b));
      previousHeapSize = frame.heapSize;
    }
    const final = all.at(-1)!;
    expect(final.result).toBe('sorted');
    expect(final.heapSize).toBe(0);
    expect(final.sortedFrom).toBe(0);
    expect(values(final)).toEqual([1, 2, 3, 5, 6, 9, 9]);
    expect(new Set(values(final))).toEqual(new Set([1, 2, 3, 5, 6, 9]));
  });

  it('keeps stable ids attached to elements rather than slots across swaps', () => {
    const all = snapshot('sort');
    const swap = all.find((frame) => frame.operation === 'swap' || frame.operation === 'swap-to-end')!;
    const firstId = swap.swap!.firstId;
    const secondId = swap.swap!.secondId;
    const before = all[all.indexOf(swap) - 1];
    const beforeFirst = before.elements.find((element) => element.id === firstId)!;
    const beforeSecond = before.elements.find((element) => element.id === secondId)!;
    const afterFirst = swap.elements.find((element) => element.id === firstId)!;
    const afterSecond = swap.elements.find((element) => element.id === secondId)!;
    expect(afterFirst.value).toBe(beforeFirst.value);
    expect(afterSecond.value).toBe(beforeSecond.value);
    expect(afterFirst.slot).toBe(beforeSecond.slot);
    expect(afterSecond.slot).toBe(beforeFirst.slot);
    expect(new Set(swap.elements.map((element) => element.id))).toEqual(new Set(before.elements.map((element) => element.id)));
  });

  it('handles empty, single and duplicate heaps without inventing elements', () => {
    for (const name of ['build-empty', 'extract-empty', 'sort-empty']) {
      const all = parse(edges[name]!);
      const final = all.at(-1)!;
      expect(final.elements).toHaveLength(0);
      expect(final.rootId).toBeNull();
      expect(final.activeId).toBeNull();
      expect(final.pathIds).toEqual([]);
    }
    const singleBuild = parse(edges['build-single']!).at(-1)!;
    expect(singleBuild.elements).toHaveLength(1);
    expect(singleBuild.rootId).toBe('h1');
    expect(singleBuild.result).toBe('built');
    const singleExtract = parse(edges['extract-single']!);
    expect(singleExtract.find((frame) => frame.operation === 'extract-select')!.rootId).toBe('h1');
    expect(singleExtract.at(-1)!.removed).toMatchObject({ value: 7 });
    const duplicates = parse(edges['sort-duplicate']!).at(-1)!;
    expect(values(duplicates)).toEqual([4, 5, 5, 5]);
    expect(duplicates.elements.map((element) => element.id)).toEqual(['h3', 'h2', 'h4', 'h1']);
  });

  it('rejects snapshots that break slot, root, suffix or swap invariants', () => {
    const base = snapshot('sort').at(-1)!;
    const badSlot = {
      ...base,
      elements: base.elements.map((element, index) => ({ ...element, slot: index === 0 ? 1 : element.slot })),
    };
    expect(maxHeapSnapshotSchema.safeParse(badSlot).success).toBe(false);
    const badRoot = { ...base, rootId: 'h999' };
    expect(maxHeapSnapshotSchema.safeParse(badRoot).success).toBe(false);
    const badSuffix = { ...base, sortedFrom: 1, heapSize: 2 };
    expect(maxHeapSnapshotSchema.safeParse(badSuffix).success).toBe(false);
    const swap = snapshot('sort').find((frame) => frame.operation === 'swap-to-end')!;
    const badSwap = { ...swap, sortedFrom: swap.heapSize + 1 };
    expect(maxHeapSnapshotSchema.safeParse(badSwap).success).toBe(false);
    const init = snapshot('build').find((frame) => frame.operation === 'init')!;
    const badInit = { ...init, swap: { firstId: 'h1', secondId: 'h2' } };
    expect(maxHeapSnapshotSchema.safeParse(badInit).success).toBe(false);
  });
});

describe('T3 heap layout and pure model', () => {
  it('places a seven-node tree in a compact, fixed viewBox', () => {
    const layout = layoutCompleteHeap(7);
    expect(layout.width).toBe(280);
    expect(layout.height).toBe(274);
    expect(layout.radius).toBe(28);
    expect(layout.nodes).toHaveLength(7);
    expect(layout.edges).toHaveLength(6);
    const root = layout.nodes[0];
    expect(root.x).toBe(140);
    expect(root.y).toBe(43);
    expect(layout.nodes[5].x).toBe(175);
    expect(layout.nodes[5].y).toBe(231);
  });

  it('reuses exactly the same node coordinates for every frame of the same total size', () => {
    const all = snapshot('sort');
    const layouts = all.map((frame) => layoutCompleteHeap(frame.totalSize));
    expect(layouts.every((layout) => layout.width === layouts[0].width && layout.height === layouts[0].height)).toBe(true);
    for (const layout of layouts) {
      expect(layout.nodes.map((node) => [node.slot, node.x, node.y])).toEqual(
        layouts[0].nodes.map((node) => [node.slot, node.x, node.y]),
      );
    }
  });

  it('derives the tree and the array from the same slots on every real frame', () => {
    for (const frame of [...Object.values(defaults).flat(), ...Object.values(edges).flat()]) {
      const model = buildHeapModel(frame.structure, 'empty heap');
      expect(model).not.toBeNull();
      expect(model!.nodes).toHaveLength(frame.structure.heapSize);
      for (const node of model!.nodes) {
        expect(node.slot).toBeLessThan(frame.structure.heapSize);
        expect(model!.slots[node.slot]).toMatchObject({ id: node.id, value: node.value, slot: node.slot });
      }
      for (const edge of model!.edges) {
        expect(edge.parentSlot).toBeLessThan(edge.childSlot);
        expect(edge.childSlot).toBeLessThan(frame.structure.heapSize);
        expect(model!.nodes.some((node) => node.slot === edge.parentSlot)).toBe(true);
        expect(model!.nodes.some((node) => node.slot === edge.childSlot)).toBe(true);
      }
      expect(model!.slots).toHaveLength(frame.structure.totalSize);
      expect(model!.slots.filter((slot) => slot.sorted)).toHaveLength(
        frame.structure.sortedFrom === null ? 0 : frame.structure.totalSize - frame.structure.sortedFrom,
      );
    }
  });

  it('builds a model whose tree uses only active slots and whose array keeps the sorted suffix', () => {
    const all = snapshot('sort');
    const swap = all.find((frame) => frame.operation === 'swap-to-end')!;
    const model = buildHeapModel(swap, 'empty heap');
    expect(model).not.toBeNull();
    expect(model!.nodes).toHaveLength(swap.heapSize);
    expect(model!.edges.every((edge) => edge.childSlot < swap.heapSize)).toBe(true);
    expect(model!.slots).toHaveLength(swap.totalSize);
    expect(model!.slots.filter((slot) => slot.sorted)).toHaveLength(swap.totalSize - swap.heapSize);
    expect(model!.sortedSuffix).toEqual(values(swap).slice(swap.heapSize));
    expect(model!.wide).toBe(false);
    expect(model!.layoutWidth).toBe(280);
    expect(model!.layoutHeight).toBe(274);
  });

  it('returns the same model when rewinding and jumping, with no hidden state', () => {
    const all = snapshot('sort');
    const at = (index: number) => buildHeapModel(all[index]!, 'empty heap');
    const first = at(10);
    const back = at(9);
    const jump = at(10);
    expect(jump).toEqual(first);
    expect(back).not.toEqual(first);
  });
});
