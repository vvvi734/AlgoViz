import { describe, expect, it } from 'vitest';
import defaultFrames from '../../test/fixtures/sorting-s2-default-frames.json';
import edgeFrames from '../../test/fixtures/sorting-s2-edge-frames.json';
import { sortingSnapshotSchema, type SortingSnapshot } from '../trace/schema';
import { buildSortingModel } from './sortingModel';
import type { TraceState } from '../trace/types';

type FixtureFrame = {
  state: TraceState;
  message: string;
  variables: Record<string, unknown>;
  lessonStepId: string;
  structure: SortingSnapshot;
};

const defaults = defaultFrames as unknown as Record<'quick' | 'merge', FixtureFrame[]>;
const edges = edgeFrames as unknown as Record<string, Record<'quick' | 'merge', FixtureFrame[]>>;

function parsed(frames: FixtureFrame[]): SortingSnapshot[] {
  return frames.map((frame) => sortingSnapshotSchema.parse(frame.structure));
}

function valuesOf(snapshot: SortingSnapshot): number[] {
  return snapshot.elements.map((element) => element.value);
}

describe('S2 quick/merge real CPython fixtures', () => {
  it('validates every quick and merge snapshot and builds the shared sorting model', () => {
    for (const [algorithm, frames] of Object.entries(defaults)) {
      for (const frame of frames) {
        const snapshot = sortingSnapshotSchema.parse(frame.structure);
        const model = buildSortingModel(snapshot, frame.state);
        expect(model, `${algorithm}/${frame.lessonStepId}`).not.toBeNull();
        expect(model?.algorithm).toBe(algorithm);
        expect(model?.cells.map((cell) => cell.value)).toEqual(valuesOf(snapshot));
      }
    }
  });

  it('keeps every edge-case frame valid, sorted and multiset-preserving', () => {
    for (const [caseName, algorithms] of Object.entries(edges)) {
      for (const [algorithm, frames] of Object.entries(algorithms)) {
        const snapshots = parsed(frames);
        const final = snapshots.at(-1)!;
        const input = frames[0]!.state.values as number[];
        expect(final.operation).toBe('done');
        expect(valuesOf(final)).toEqual([...input].sort((a, b) => a - b));
        expect(valuesOf(final)).toHaveLength(input.length);
        expect(new Set(final.finalized).size).toBe(input.length);
        expect(caseName).toBeTruthy();
        expect(algorithm).toMatch(/quick|merge/);
      }
    }
  });

  it('shows Lomuto invariants on every placed pivot', () => {
    for (const frames of Object.values(edges)) {
      for (const source of frames.quick) {
        const frame = sortingSnapshotSchema.parse(source.structure);
        if (frame.operation !== 'quick-place' || frame.range === null || frame.pivot === null) continue;
        const values = valuesOf(frame);
        const pivot = values[frame.pivot]!;
        const left = values.slice(frame.range.low, frame.pivot);
        const right = values.slice(frame.pivot + 1, frame.range.high + 1);
        expect(left.every((value) => value <= pivot), source.message).toBe(true);
        expect(right.every((value) => value > pivot), source.message).toBe(true);
        expect(frame.finalized).toContain(frame.pivot);
      }
    }
  });

  it('keeps merge buffer values, sources and write-back slots real', () => {
    for (const frames of Object.values(edges)) {
      const snapshots = parsed(frames.merge);
      for (const frame of snapshots) {
        if (frame.operation === 'merge-write' || frame.operation === 'merge-copy') {
          expect(frame.bufferWrite).not.toBeNull();
          const write = frame.bufferWrite!;
          expect(frame.buffer[write.index]).toBe(write.value);
          expect(valuesOf(frame)[write.source]).toBe(write.value);
          expect(write.index).toBe(frame.buffer.length - 1);
        }
        if (frame.operation === 'merge-writeback') {
          expect(frame.writeAt).not.toBeNull();
          expect(frame.range).not.toBeNull();
          const offset = frame.writeAt! - frame.range!.low;
          expect(frame.buffer[offset]).toBe(valuesOf(frame)[frame.writeAt!]);
          expect(frame.buffer).toHaveLength(frame.range!.high - frame.range!.low + 1);
        }
      }
    }
  });

  it('does not regress S1 prefix semantics when the S2 fields are defaulted', () => {
    for (const snapshot of parsed(defaults.quick).slice(0, 1)) {
      expect(snapshot.range).toBeNull();
      expect(snapshot.finalized).toEqual([]);
      expect(snapshot.buffer).toEqual([]);
    }
  });

  it('keeps every S2 capture under the existing frame budget', () => {
    for (const frames of Object.values(defaults)) expect(frames.length).toBeLessThanOrEqual(500);
    for (const algorithms of Object.values(edges)) {
      expect(algorithms.quick.length).toBeLessThanOrEqual(500);
      expect(algorithms.merge.length).toBeLessThanOrEqual(500);
    }
  });
});
