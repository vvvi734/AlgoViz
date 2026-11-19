import { describe, expect, it } from 'vitest';
import rawOfficial from '../../test/fixtures/seqlist-official-frames.json';
import rawEdge from '../../test/fixtures/seqlist-edge-frames.json';
import { buildSequentialListModel } from '../visualization/sequentialListModel';
import {
  sequentialListSnapshotSchema,
  structureSchema,
  type SequentialListSnapshot,
} from './schema';
import type { TraceState } from './types';

type RawFrame = {
  state: TraceState;
  structure: unknown;
  lessonStepId: string;
  message: string;
  variables: Record<string, unknown>;
};
type Frame = RawFrame & { structure: SequentialListSnapshot };

const official = rawOfficial as unknown as Record<string, RawFrame[]>;
const edge = rawEdge as unknown as Record<string, RawFrame[]>;

function parse(frames: RawFrame[]): Frame[] {
  return frames.map((frame) => {
    const union = structureSchema.safeParse(frame.structure);
    expect(union.success, JSON.stringify(union.error?.issues)).toBe(true);
    const typed = sequentialListSnapshotSchema.safeParse(frame.structure);
    expect(typed.success, JSON.stringify(typed.error?.issues)).toBe(true);
    return { ...frame, structure: frame.structure as SequentialListSnapshot };
  });
}

function values(snapshot: SequentialListSnapshot): Array<unknown> {
  return snapshot.slots.map((slot) => slot.value);
}

describe('L1B sequential-list real Python fixtures', () => {
  it('accepts every official and edge frame through the shared structure union', () => {
    const officialFrames = Object.values(official).flatMap(parse);
    const edgeFrames = Object.values(edge).flatMap(parse);
    expect(officialFrames).toHaveLength(84);
    expect(edgeFrames).toHaveLength(89);
    for (const frame of [...officialFrames, ...edgeFrames]) {
      const snapshot = frame.structure;
      expect(snapshot.slots).toHaveLength(snapshot.capacity);
      expect(snapshot.length).toBeGreaterThanOrEqual(0);
      expect(snapshot.length).toBeLessThanOrEqual(snapshot.capacity);
      if (snapshot.phase === 'complete') {
        snapshot.slots.slice(0, snapshot.length).forEach((slot) => expect(slot.value).not.toBeNull());
        snapshot.slots.slice(snapshot.length).forEach((slot) => expect(slot.value).toBeNull());
      }
    }
  });

  it('keeps the default insert moves right from tail to index, then writes and updates length', () => {
    const frames = parse(official['insert-middle']);
    expect(frames).toHaveLength(8);
    const shifts = frames.filter((frame) => frame.structure.action === 'shift-right').map((frame) => frame.structure);
    expect(shifts.map((frame) => frame.sourceIndex)).toEqual([4, 3, 2]);
    expect(shifts.map((frame) => frame.targetIndex)).toEqual([5, 4, 3]);
    for (const frame of shifts) {
      expect(frame.phase).toBe('intermediate');
      expect(frame.change?.index).toBe(frame.targetIndex);
      expect(frame.change?.after).toBe(frame.slots[frame.targetIndex!].value);
    }
    const write = frames.find((frame) => frame.structure.action === 'write')!.structure;
    expect(write.targetIndex).toBe(2);
    expect(write.change).toMatchObject({ index: 2, after: 25 });
    const complete = frames[frames.length - 2].structure;
    expect(complete).toMatchObject({ operation: 'insert', phase: 'complete', length: 6 });
    expect(values(complete)).toEqual([10, 20, 25, 30, 40, 50, null, null]);
  });

  it('keeps the default delete moves left from index, clears the tail slot and updates length', () => {
    const frames = parse(official['delete-middle']);
    expect(frames).toHaveLength(9);
    const save = frames.find((frame) => frame.structure.action === 'save')!.structure;
    expect(save).toMatchObject({ removedIndex: 1, removedValue: 20 });
    const shifts = frames.filter((frame) => frame.structure.action === 'shift-left').map((frame) => frame.structure);
    expect(shifts.map((frame) => frame.sourceIndex)).toEqual([2, 3, 4]);
    expect(shifts.map((frame) => frame.targetIndex)).toEqual([1, 2, 3]);
    for (const frame of shifts) {
      expect(frame.phase).toBe('intermediate');
      expect(frame.change?.index).toBe(frame.targetIndex);
    }
    const clear = frames.find((frame) => frame.structure.action === 'clear')!.structure;
    expect(clear).toMatchObject({ targetIndex: 4, phase: 'intermediate' });
    expect(clear.change).toMatchObject({ index: 4, after: null });
    expect(clear.slots[4].value).toBeNull();
    const complete = frames[frames.length - 2].structure;
    expect(complete).toMatchObject({ operation: 'delete', phase: 'complete', length: 4 });
    expect(values(complete)).toEqual([10, 30, 40, 50, null, null, null, null]);
  });

  it('rejects full insertion, empty deletion and out-of-range access without changing data', () => {
    for (const name of ['full-insert', 'empty-delete', 'access-out']) {
      const frames = parse(official[name]);
      const initial = frames[0].structure.slots;
      const rejected = frames.filter((frame) => frame.structure.action === 'reject');
      expect(rejected).toHaveLength(1);
      expect(rejected[0].structure.phase).toBe('complete');
      expect(rejected[0].structure.slots).toEqual(initial);
    }
    expect(parse(official['full-insert']).at(-1)?.structure.error).toBe('capacity-full');
    expect(parse(official['empty-delete']).at(-1)?.structure.error).toBe('list-empty');
    expect(parse(official['access-out']).at(-1)?.structure.error).toBe('index-out-of-range');
  });

  it('never treats a free slot as a live element, even when an intermediate copy occupies it', () => {
    const frames = parse(official['insert-middle']);
    const shift = frames.find((frame) => frame.structure.action === 'shift-right')!.structure;
    expect(shift.length).toBe(5);
    expect(shift.slots[5].value).toBe(50);
    const model = buildSequentialListModel(shift);
    expect(model.slots[5].occupied).toBe(false);
    expect(model.slots[5].free).toBe(true);
    expect(model.slots[5].temporary).toBe(true);
    expect(model.slots.slice(0, 5).every((slot) => slot.occupied)).toBe(true);
    expect(model.slots.slice(5).every((slot) => !slot.occupied)).toBe(true);
  });

  it('recovers slots and length exactly when jumping backwards or skipping intermediate frames', () => {
    const frames = parse(official['delete-middle']).map((frame) => buildSequentialListModel(frame.structure));
    for (const index of [0, 3, 5, frames.length - 2, frames.length - 1]) {
      const model = frames[index];
      expect(model.length).toBe(model.slots.filter((slot) => slot.occupied).length);
      expect(model.capacity).toBe(model.slots.length);
    }
    expect(frames[0].length).toBe(5);
    expect(frames[3].length).toBe(5);
    expect(frames[5].length).toBe(5);
    expect(frames[frames.length - 2].length).toBe(4);
    expect(frames[frames.length - 1].length).toBe(4);
    expect(frames[frames.length - 2].slots[4].value).toBeNull();
  });

  it('handles duplicates, negative values, a single element and initial overflow', () => {
    const duplicate = parse(edge['negative-and-duplicate']);
    const hit = duplicate.find((frame) => frame.structure.found === true)!.structure;
    expect(hit).toMatchObject({ found: true, foundIndex: 1, result: 3 });

    const negative = parse(edge['negative-values']).at(-2)!.structure;
    expect(negative.length).toBe(6);
    expect(negative.slots[2].value).toBe(-9);

    const single = parse(edge['capacity-one']).at(-2)!.structure;
    expect(single.length).toBe(0);
    expect(single.slots.every((slot) => slot.value === null)).toBe(true);

    const overflow = parse(edge['initial-over-capacity']);
    const init = overflow[0].structure;
    const complete = overflow.at(-2)!.structure;
    expect(init).toMatchObject({ capacity: 3, length: 3 });
    expect(complete.slots).toEqual(init.slots);
    expect(complete.slots.every((slot) => slot.value !== null)).toBe(true);
  });

  it('produces a model whose derived flags follow every recorded action', () => {
    for (const name of ['access-middle', 'search-hit', 'insert-head', 'delete-tail', 'traverse', 'empty']) {
      for (const frame of parse(official[name])) {
        const model = buildSequentialListModel(frame.structure);
        expect(model.length).toBe(frame.structure.length);
        expect(model.capacity).toBe(frame.structure.capacity);
        expect(model.slots.filter((slot) => slot.occupied)).toHaveLength(frame.structure.length);
        expect(model.slots.some((slot) => slot.focus)).toBe(frame.structure.focusIndex !== undefined);
      }
    }
    const access = parse(official['access-middle']).map((frame) => buildSequentialListModel(frame.structure));
    expect(access[2].slots[2].focus).toBe(true);
    expect(access[0].slots[0].focus).toBe(true);
  });
});
