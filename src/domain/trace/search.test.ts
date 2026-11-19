import { describe, expect, it } from 'vitest';
import rawDefault from '../../test/fixtures/search-default-frames.json';
import rawEdge from '../../test/fixtures/search-edge-frames.json';
import { buildSearchModel } from '../visualization/searchModel';
import {
  searchSnapshotSchema,
  structureSchema,
  type SearchSnapshot,
} from './schema';
import type { TraceState } from './types';

type Frame = { state: TraceState; structure: SearchSnapshot; lessonStepId: string };
const defaults = rawDefault as unknown as Record<'linear' | 'binary', Frame[]>;
const edges = rawEdge as unknown as Record<'linear' | 'binary', Record<string, Frame[]>>;

function parse(frames: Frame[]): SearchSnapshot[] {
  return frames.map((frame) => {
    const union = structureSchema.safeParse(frame.structure);
    expect(union.success, JSON.stringify(union.error?.issues)).toBe(true);
    const typed = searchSnapshotSchema.safeParse(frame.structure);
    expect(typed.success, JSON.stringify(typed.error?.issues)).toBe(true);
    return frame.structure;
  });
}

function valuesOf(snapshot: SearchSnapshot): number[] {
  return snapshot.elements.map((element) => element.value);
}

function edge(algorithm: 'linear' | 'binary', name: string): Frame[] {
  return edges[algorithm]![name]!;
}

describe('F1 search real Python fixtures', () => {
  it('accepts every default and edge frame as a search snapshot', () => {
    parse(defaults.linear);
    parse(defaults.binary);
    for (const algorithm of ['linear', 'binary'] as const) {
      for (const frames of Object.values(edges[algorithm]!)) parse(frames);
    }
    expect(defaults.linear).toHaveLength(12);
    expect(defaults.binary).toHaveLength(10);
    const edgeCount = Object.values(edges)
      .flatMap((group) => Object.values(group))
      .reduce((sum, frames) => sum + frames.length, 0);
    expect(edgeCount).toBe(121);
  });

  it('linear search scans left to right, stops at the first match and returns its index', () => {
    const frames = parse(defaults.linear);
    expect(valuesOf(frames[0]!)).toEqual([6, 3, 9, 2, 7, 4]);
    expect(frames.map((snapshot) => snapshot.operation)).toEqual([
      'init',
      'scan-start',
      'scan-compare',
      'scan-next',
      'scan-compare',
      'scan-next',
      'scan-compare',
      'scan-next',
      'scan-compare',
      'scan-next',
      'scan-compare',
      'found',
    ]);
    const found = frames.at(-1)!;
    expect(found.result).toBe(4);
    expect(found.found).toBe(true);
    expect(found.index).toBe(4);
    expect(found.checked).toEqual([0, 1, 2, 3]);
    expect(valuesOf(found)[found.result!]).toBe(found.target);

    for (const snapshot of frames) {
      expect(snapshot.left).toBeNull();
      expect(snapshot.right).toBeNull();
      expect(snapshot.mid).toBeNull();
      expect(snapshot.range).toBeNull();
      if (snapshot.index !== null) {
        expect(snapshot.checked).toEqual([...Array(snapshot.index).keys()]);
      }
    }
  });

  it('linear search returns the first duplicate and reports failure after every slot', () => {
    const duplicate = parse(edge('linear', 'duplicates'));
    expect(duplicate.at(-1)!.operation).toBe('found');
    expect(duplicate.at(-1)!.result).toBe(0);
    expect(duplicate.at(-1)!.checked).toEqual([]);

    const missing = parse(edge('linear', 'missing'));
    expect(missing.at(-1)!.operation).toBe('not-found');
    expect(missing.at(-1)!.result).toBe(-1);
    expect(missing.at(-1)!.found).toBe(false);
    expect(missing.at(-1)!.checked).toEqual([0, 1, 2, 3, 4, 5]);

    const empty = parse(edge('linear', 'empty'));
    expect(empty.map((snapshot) => snapshot.operation)).toEqual(['init', 'not-found']);
    expect(empty.at(-1)!.checked).toEqual([]);

    for (const name of ['success_first', 'success_last', 'single_hit', 'single_miss', 'negative', 'middle', 'two_missing']) {
      parse(edge('linear', name));
    }
  });

  it('binary search derives every range from the real left/right boundaries', () => {
    const frames = parse(defaults.binary);
    expect(valuesOf(frames[0]!)).toEqual([1, 3, 5, 7, 9, 11, 13]);
    expect(frames[0]!.operation).toBe('binary-init');
    expect([frames[0]!.left, frames[0]!.right]).toEqual([0, 6]);
    expect(frames[0]!.range).toEqual({ low: 0, high: 6 });
    expect(frames[1]!.operation).toBe('binary-mid');

    const inRange = (snapshot: SearchSnapshot): { low: number; high: number } | null =>
      snapshot.left !== null && snapshot.right !== null && snapshot.left <= snapshot.right
        ? { low: snapshot.left, high: snapshot.right }
        : null;

    for (const [index, snapshot] of frames.entries()) {
      expect(snapshot.range).toEqual(inRange(snapshot));
      if (snapshot.operation === 'binary-mid' || snapshot.operation === 'binary-compare' || snapshot.operation === 'binary-found') {
        expect(snapshot.mid).toBe(Math.floor((snapshot.left! + snapshot.right!) / 2));
        expect(snapshot.mid! >= snapshot.left!).toBe(true);
        expect(snapshot.mid! <= snapshot.right!).toBe(true);
      }
      if (snapshot.operation === 'binary-exclude-left') {
        const previous = frames[index - 1]!;
        expect(previous.operation).toBe('binary-compare');
        expect(valuesOf(snapshot)[snapshot.mid!]).toBeLessThan(snapshot.target);
        expect(snapshot.left).toBe(snapshot.mid! + 1);
        expect(snapshot.right).toBe(previous.right);
      }
      if (snapshot.operation === 'binary-exclude-right') {
        const previous = frames[index - 1]!;
        expect(previous.operation).toBe('binary-compare');
        expect(valuesOf(snapshot)[snapshot.mid!]).toBeGreaterThan(snapshot.target);
        expect(snapshot.right).toBe(snapshot.mid! - 1);
        expect(snapshot.left).toBe(previous.left);
      }
    }

    const found = frames.at(-1)!;
    expect(found.operation).toBe('binary-found');
    expect(found.result).toBe(4);
    expect(found.index).toBe(4);
    expect(valuesOf(found)[found.result!]).toBe(found.target);
    expect(found.checked).toEqual([]);
  });

  it('binary search excludes only halves that cannot contain the target', () => {
    for (const name of Object.keys(edges.binary!)) {
      if (name === 'unsorted') continue;
      const frames = parse(edge('binary', name));
      for (const snapshot of frames) {
        if (snapshot.operation === 'binary-exclude-left') {
          const values = valuesOf(snapshot);
          expect(values.slice(0, snapshot.mid! + 1).every((value) => value < snapshot.target)).toBe(true);
        }
        if (snapshot.operation === 'binary-exclude-right') {
          const values = valuesOf(snapshot);
          expect(values.slice(snapshot.mid!).every((value) => value > snapshot.target)).toBe(true);
        }
      }
    }
  });

  it('binary search ends with left > right on failure and never drops the last candidate', () => {
    for (const name of ['missing', 'single_miss', 'two_missing']) {
      const frames = parse(edge('binary', name));
      const final = frames.at(-1)!;
      expect(final.operation).toBe('binary-not-found');
      expect(final.left).toBe(final.right! + 1);
      expect(final.range).toBeNull();
      expect(final.result).toBe(-1);
      expect(final.found).toBe(false);
    }
    const single = parse(edge('binary', 'single_hit'));
    expect(single.map((snapshot) => snapshot.operation)).toEqual([
      'binary-init',
      'binary-mid',
      'binary-compare',
      'binary-found',
    ]);
    expect(single.at(-1)!.result).toBe(0);
  });

  it('binary search returns any valid duplicate index and refuses unsorted input', () => {
    const duplicate = parse(edge('binary', 'duplicates'));
    expect(duplicate.at(-1)!.operation).toBe('binary-found');
    const result = duplicate.at(-1)!.result!;
    expect([0, 1, 2]).toContain(result);
    expect(valuesOf(duplicate.at(-1)!)[result]).toBe(2);

    const unsorted = parse(edge('binary', 'unsorted'));
    expect(unsorted).toHaveLength(1);
    expect(unsorted[0]!.operation).toBe('invalid');
    expect(unsorted[0]!.reason).toBe('unsorted');
    expect(unsorted[0]!.left).toBeNull();
    expect(unsorted[0]!.right).toBeNull();
    expect(unsorted[0]!.range).toBeNull();
    expect(unsorted[0]!.result).toBeNull();
    expect(buildSearchModel(unsorted[0]!, edge('binary', 'unsorted')[0]!.state)?.excludedCount).toBe(0);
  });

  it('builds independent scan marks and range/exclusion marks from the same frame', () => {
    const linearFrames = parse(defaults.linear);
    const compareIndex = linearFrames.findIndex(
      (snapshot) => snapshot.operation === 'scan-compare' && snapshot.index === 2,
    );
    const compareModel = buildSearchModel(linearFrames[compareIndex]!, defaults.linear[compareIndex]!.state)!;
    expect(compareModel.cells[0]!.marks).toContain('checked');
    expect(compareModel.cells[2]!.marks).toContain('current');
    expect(compareModel.cells[3]!.marks).toContain('pending');
    expect(compareModel.checkedCount).toBe(2);

    const binaryFrames = parse(defaults.binary);
    const midIndex = binaryFrames.findIndex((snapshot) => snapshot.operation === 'binary-mid');
    const midModel = buildSearchModel(binaryFrames[midIndex]!, defaults.binary[midIndex]!.state)!;
    expect(midModel.cells[midModel.mid!]!.marks).toContain('mid');
    expect(midModel.cells[midModel.left!]!.marks).toContain('left');
    expect(midModel.cells[midModel.right!]!.marks).toContain('right');
    expect(midModel.excludedCount).toBe(0);

    const excludeIndex = binaryFrames.findIndex((snapshot) => snapshot.operation === 'binary-exclude-left');
    const excludeModel = buildSearchModel(binaryFrames[excludeIndex]!, defaults.binary[excludeIndex]!.state)!;
    expect(excludeModel.excludedCount).toBeGreaterThan(0);
    expect(excludeModel.cells.some((cell) => cell.marks.includes('excluded'))).toBe(true);
    expect(excludeModel.cells.some((cell) => cell.marks.includes('range'))).toBe(true);
    expect(excludeModel.remainingCount).toBe(
      (binaryFrames[excludeIndex]!.range?.high ?? 0) - (binaryFrames[excludeIndex]!.range?.low ?? 0) + 1,
    );
  });

  it('rejects fabricated search states instead of rendering a plausible lie', () => {
    const linearFound = JSON.parse(JSON.stringify(defaults.linear.at(-1)!.structure)) as SearchSnapshot;
    linearFound.left = 0;
    expect(searchSnapshotSchema.safeParse(linearFound).success).toBe(false);

    const linearMismatch = JSON.parse(JSON.stringify(defaults.linear.at(-1)!.structure)) as SearchSnapshot;
    linearMismatch.result = 3;
    expect(searchSnapshotSchema.safeParse(linearMismatch).success).toBe(false);

    const linearPartialFailure = JSON.parse(JSON.stringify(edge('linear', 'missing').at(-1)!.structure)) as SearchSnapshot;
    linearPartialFailure.checked = [0, 1, 2];
    expect(searchSnapshotSchema.safeParse(linearPartialFailure).success).toBe(false);

    const binaryUnsorted = JSON.parse(JSON.stringify(edge('binary', 'unsorted')[0]!.structure)) as SearchSnapshot;
    binaryUnsorted.operation = 'binary-init';
    binaryUnsorted.phase = 'init';
    binaryUnsorted.reason = null;
    binaryUnsorted.left = 0;
    binaryUnsorted.right = 2;
    binaryUnsorted.range = { low: 0, high: 2 };
    expect(searchSnapshotSchema.safeParse(binaryUnsorted).success).toBe(false);

    const binaryMid = JSON.parse(JSON.stringify(defaults.binary[1]!.structure)) as SearchSnapshot;
    binaryMid.mid = 4;
    expect(searchSnapshotSchema.safeParse(binaryMid).success).toBe(false);

    const binaryCompare = JSON.parse(JSON.stringify(defaults.binary[2]!.structure)) as SearchSnapshot;
    binaryCompare.comparison = 'greater';
    expect(searchSnapshotSchema.safeParse(binaryCompare).success).toBe(false);

    const excludeLeft = JSON.parse(JSON.stringify(defaults.binary.find((frame) => frame.structure.operation === 'binary-exclude-left')!.structure)) as SearchSnapshot;
    excludeLeft.left = excludeLeft.mid;
    expect(searchSnapshotSchema.safeParse(excludeLeft).success).toBe(false);

    const failed = JSON.parse(JSON.stringify(edge('binary', 'missing').at(-1)!.structure)) as SearchSnapshot;
    failed.right = failed.left!;
    failed.range = { low: failed.left!, high: failed.right! };
    expect(searchSnapshotSchema.safeParse(failed).success).toBe(false);
  });

  it('returns null instead of painting a stale array', () => {
    const frame = defaults.linear[0]!;
    const staleValues = [...((frame.state.values ?? []) as number[])];
    staleValues[0] = 999;
    const stale = { type: 'array', values: staleValues } as TraceState;
    expect(buildSearchModel(frame.structure, stale)).toBeNull();
  });
});
