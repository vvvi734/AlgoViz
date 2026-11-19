import { describe, expect, it } from 'vitest';
import rawDefault from '../../test/fixtures/sorting-default-frames.json';
import rawEdge from '../../test/fixtures/sorting-edge-frames.json';
import {
  sortingSnapshotSchema,
  structureSchema,
  type SortingSnapshot,
} from './schema';
import type { TraceState } from './types';
import { buildSortingModel } from '../visualization/sortingModel';

type Frame = { state: TraceState; structure: SortingSnapshot; lessonStepId: string };
const defaults = rawDefault as unknown as Record<string, Frame[]>;
const edges = rawEdge as unknown as Record<string, Record<string, Frame[]>>;

function parse(frames: Frame[]): SortingSnapshot[] {
  return frames.map((frame) => {
    const union = structureSchema.safeParse(frame.structure);
    expect(union.success, JSON.stringify(union.error?.issues)).toBe(true);
    const typed = sortingSnapshotSchema.safeParse(frame.structure);
    expect(typed.success, JSON.stringify(typed.error?.issues)).toBe(true);
    return frame.structure;
  });
}

function valuesOf(snapshot: SortingSnapshot): number[] {
  return snapshot.elements.map((element) => element.value);
}

function allFrames(): Frame[] {
  return [
    ...Object.values(defaults).flat(),
    ...Object.values(edges).flatMap((group) => Object.values(group).flat()),
  ];
}

function official(algorithm: 'selection' | 'insertion' | 'shell'): Frame[] {
  return defaults[algorithm]!;
}

describe('S1 sorting real Python fixtures', () => {
  it('accepts every default and edge frame as a sorting snapshot', () => {
    for (const frames of Object.values(defaults)) parse(frames);
    for (const group of Object.values(edges)) {
      for (const frames of Object.values(group)) parse(frames);
    }
    expect(Object.values(defaults).reduce((sum, frames) => sum + frames.length, 0)).toBe(143);
    expect(
      Object.values(edges).reduce(
        (sum, group) => sum + Object.values(group).reduce((inner, frames) => inner + frames.length, 0),
        0,
      ),
    ).toBe(578);
  });

  it('uses the official inputs and finishes every case ascending with the same multiset', () => {
    expect(valuesOf(parse(official('selection'))[0]!)).toEqual([6, 4, 9, 1, 7, 2]);
    expect(valuesOf(parse(official('insertion'))[0]!)).toEqual([7, 3, 5, 1, 9, 2]);
    expect(valuesOf(parse(official('shell'))[0]!)).toEqual([8, 3, 7, 4, 9, 2, 6, 1]);

    for (const frame of allFrames()) {
      const snapshot = frame.structure;
      const values = valuesOf(snapshot);
      expect(values).toEqual([...(frame.state.values as number[])]);
      const prefix = values.slice(0, snapshot.sortedFrom);
      expect(prefix).toEqual([...prefix].sort((a, b) => a - b));
      if (snapshot.operation === 'done') {
        expect(values).toEqual([...values].sort((a, b) => a - b));
        expect([...values].sort((a, b) => a - b)).toEqual([...values]);
      }
    }
  });

  it('selection swaps the real suffix minimum once per pass', () => {
    const frames = official('selection');
    const snapshots = parse(frames);
    const swaps = snapshots.filter((snapshot) => snapshot.operation === 'select-swap');
    expect(swaps).toHaveLength(6);
    expect(swaps.map((snapshot) => snapshot.round)).toEqual([1, 2, 3, 4, 5, 6]);
    for (let index = 0; index < snapshots.length; index += 1) {
      const snapshot = snapshots[index]!;
      if (snapshot.operation !== 'select-swap') continue;
      const before = valuesOf(snapshots[index - 1]!);
      const r = snapshot.round;
      const suffix = before.slice(r - 1);
      const minimum = Math.min(...suffix);
      expect(before[snapshot.candidate!]).toBe(minimum);
      expect(snapshot.sortedFrom).toBe(r);
      expect(valuesOf(snapshot).slice(0, r)).toEqual([...valuesOf(snapshot).slice(0, r)].sort((a, b) => a - b));
    }
    const done = [...snapshots].reverse().find((snapshot) => snapshot.operation === 'select-done')!;
    expect(done.sortedFrom).toBe(6);
  });

  it('insertion lifts the key, shifts only larger values right and restores the prefix', () => {
    const snapshots = parse(official('insertion'));
    for (let index = 0; index < snapshots.length; index += 1) {
      const snapshot = snapshots[index]!;
      if (snapshot.operation === 'insert-key') {
        expect(snapshot.key).not.toBeNull();
        expect(snapshot.key!.origin).toBe(snapshot.round);
        expect(valuesOf(snapshot)[snapshot.round]).toBe(snapshot.key!.value);
        expect(snapshot.sortedFrom).toBe(snapshot.round);
      }
      if (snapshot.operation === 'insert-shift') {
        const before = valuesOf(snapshots[index - 1]!);
        const after = valuesOf(snapshot);
        expect(after[snapshot.shifted!.to]).toBe(before[snapshot.shifted!.from]);
        expect(after[snapshot.shifted!.from]).toBe(before[snapshot.shifted!.from]);
      }
      if (snapshot.operation === 'insert-place') {
        expect(valuesOf(snapshot)[snapshot.insertedAt!]).toBe(snapshot.key!.value);
        const prefix = valuesOf(snapshot).slice(0, snapshot.sortedFrom);
        expect(prefix).toEqual([...prefix].sort((a, b) => a - b));
      }
    }
    const reversed = parse(edges.reverse.insertion!);
    const shifts = reversed.filter((snapshot) => snapshot.operation === 'insert-shift');
    expect(shifts.length).toBeGreaterThan(0);
  });

  it('shell halves the gap to 1, stays in lane and only gap=1 finishes the array', () => {
    const snapshots = parse(official('shell'));
    expect(snapshots[0]!.gapSequence).toEqual([4, 2, 1]);
    const changes = snapshots.filter((snapshot) => snapshot.operation === 'gap-change');
    expect(changes.map((snapshot) => snapshot.gap)).toEqual([4, 2, 1]);
    for (const snapshot of snapshots) {
      if (snapshot.algorithm !== 'shell') continue;
      expect(snapshot.gapSequence).toEqual([4, 2, 1]);
      if (snapshot.key) {
        expect(snapshot.lane).toBe(snapshot.key.origin % snapshot.gap!);
      }
      if (snapshot.operation === 'shell-shift') {
        expect(snapshot.shifted!.to - snapshot.shifted!.from).toBe(snapshot.gap);
      }
    }
    const gapDone = snapshots.filter((snapshot) => snapshot.operation === 'gap-done');
    expect(gapDone.map((snapshot) => snapshot.gap)).toEqual([4, 2, 1]);
    expect(gapDone[0]!.sortedFrom).toBe(0);
    expect(gapDone[2]!.sortedFrom).toBe(8);
    expect(valuesOf(gapDone[2]!)).toEqual([1, 2, 3, 4, 6, 7, 8, 9]);
  });
});

describe('S1 sorting visual model', () => {
  it('derives every frame from the real array and mark semantics', () => {
    for (const frame of allFrames()) {
      const snapshot = frame.structure;
      const model = buildSortingModel(snapshot, frame.state);
      expect(model, `${snapshot.algorithm}/${snapshot.operation}`).not.toBeNull();
      expect(model!.cells.map((cell) => cell.value)).toEqual(valuesOf(snapshot));
      expect(model!.sortedCount).toBe(snapshot.sortedFrom);
      expect(model!.unsortedCount).toBe(snapshot.elements.length - snapshot.sortedFrom);
      expect(model!.empty).toBe(snapshot.elements.length === 0);
      for (const cell of model!.cells) {
        expect(cell.height).toBeGreaterThanOrEqual(14);
        expect(cell.height).toBeLessThanOrEqual(165);
        expect(cell.marks.includes('sorted')).toBe(cell.index < snapshot.sortedFrom);
        expect(cell.marks.includes('candidate')).toBe(snapshot.candidate === cell.index);
        expect(cell.marks.includes('compare')).toBe(snapshot.compare === cell.index);
        expect(cell.marks.includes('key-origin')).toBe(
          snapshot.key?.origin === cell.index && !['insert-place', 'shell-place'].includes(snapshot.operation),
        );
        expect(cell.marks.includes('shift-source')).toBe(snapshot.shifted?.from === cell.index);
        expect(cell.marks.includes('shift-target')).toBe(snapshot.shifted?.to === cell.index);
        expect(cell.marks.includes('placed')).toBe(snapshot.insertedAt === cell.index);
      }
    }
  });

  it('rejects a state array that does not match the structural slots', () => {
    const frames = official('selection');
    const snapshot = frames[3]!.structure;
    const mismatched: TraceState = { ...frames[3]!.state, values: [...(frames[3]!.state.values as number[])].reverse() };
    expect(buildSortingModel(snapshot, mismatched)).toBeNull();
    expect(buildSortingModel(snapshot, { type: 'stack', values: [] })).toBeNull();
  });

  it('marks selection candidate, insertion key and shell lanes without hiding other bars', () => {
    const selectionFrames = official('selection');
    const candidateIndex = selectionFrames.findIndex(
      (frame) => frame.structure.operation === 'select-candidate' && frame.structure.candidate !== frame.structure.round - 1,
    );
    const candidateFrame = selectionFrames[candidateIndex]!;
    const selectionModel = buildSortingModel(candidateFrame.structure, candidateFrame.state)!;
    expect(selectionModel.cells[candidateFrame.structure.candidate!]!.marks).toContain('candidate');
    expect(selectionModel.cells.every((cell) => cell.height >= 14)).toBe(true);

    const insertionFrames = official('insertion');
    const keyIndex = insertionFrames.findIndex(
      (frame) => frame.structure.operation === 'insert-key' && frame.structure.key!.origin === 2,
    );
    const keyFrame = insertionFrames[keyIndex]!;
    const keyModel = buildSortingModel(keyFrame.structure, keyFrame.state)!;
    expect(keyModel.cells[2]!.marks).toContain('key-origin');

    const shellFrames = official('shell');
    const laneIndex = shellFrames.findIndex(
      (frame) => frame.structure.operation === 'shell-compare' && frame.structure.gap === 4,
    );
    const laneFrame = shellFrames[laneIndex]!;
    const shellModel = buildSortingModel(laneFrame.structure, laneFrame.state)!;
    const laneCells = shellModel.cells.filter((cell) => cell.marks.includes('lane'));
    expect(laneCells.map((cell) => cell.index)).toEqual([0, 4].filter((index) => index !== laneFrame.structure.compare));
    expect(laneCells.length).toBeGreaterThan(0);
  });

  it('reports an empty array instead of fabricating bars', () => {
    const frame = edges.empty.selection![0]!;
    const model = buildSortingModel(frame.structure, frame.state)!;
    expect(model.empty).toBe(true);
    expect(model.cells).toEqual([]);
    expect(model.sortedCount).toBe(0);
    expect(model.unsortedCount).toBe(0);
    const done = edges.empty.selection!.at(-1)!;
    expect(buildSortingModel(done.structure, done.state)!.result).toBe('empty');
  });
});
