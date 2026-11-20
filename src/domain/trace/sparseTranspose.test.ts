import { describe, expect, it } from 'vitest';
import defaultFrames from '../../test/fixtures/sparse-transpose-default-frames.json';
import edgeFrames from '../../test/fixtures/sparse-transpose-edge-frames.json';
import {
  sparseColumnCounts,
  sparseCpot,
  sparsePlacementOrder,
  sparseTranspose,
  sparseTransposeSnapshotSchema,
  type SparseTransposeSnapshot,
} from './sparseTransposeSchema';
import { buildSparseTransposeModel } from '../visualization/sparseTransposeModel';
import type { SparseTriplet } from './sparseTransposeSchema';

interface FixtureFrame {
  state: unknown;
  message: string;
  variables: unknown;
  lessonStepId: string;
  structure: unknown;
}

function snapshots(frames: FixtureFrame[]): SparseTransposeSnapshot[] {
  return frames.map((frame, index) => {
    const parsed = sparseTransposeSnapshotSchema.safeParse(frame.structure);
    expect(parsed.success, `frame ${index} (${frame.lessonStepId})`).toBe(true);
    return parsed.data as SparseTransposeSnapshot;
  });
}

const DEFAULT_TRIPLES: SparseTriplet[] = [
  { row: 0, col: 0, value: 3 },
  { row: 0, col: 2, value: 7 },
  { row: 1, col: 2, value: 5 },
  { row: 2, col: 1, value: 4 },
  { row: 3, col: 0, value: 6 },
  { row: 3, col: 2, value: 8 },
];

describe('MATRIX-01 sparse transpose trace', () => {
  it('validates every frame of the real Python preset', () => {
    const frames = defaultFrames as FixtureFrame[];
    const parsed = snapshots(frames);
    expect(parsed).toHaveLength(35);
    expect(parsed.map((snapshot) => snapshot.operation)).toEqual([
      'init',
      'count-start',
      ...Array.from({ length: 6 }, () => 'count-scan'),
      'count-complete',
      'cpot-start',
      ...Array.from({ length: 4 }, () => 'cpot-compute'),
      'cpot-complete',
      'place-start',
      ...DEFAULT_TRIPLES.flatMap(() => ['place-read', 'place-write', 'place-update']),
      'done',
    ]);
    expect(parsed[0].num).toEqual([0, 0, 0, 0, 0]);
    expect(parsed[8].num).toEqual([2, 1, 3, 0, 0]);
    expect(parsed[14].cpot).toEqual([0, 2, 3, 6, 6]);
    expect(parsed[14].cpotReady).toBe(5);
    expect(parsed.at(-1)?.result).toEqual([
      { row: 0, col: 0, value: 3 },
      { row: 0, col: 3, value: 6 },
      { row: 1, col: 2, value: 4 },
      { row: 2, col: 0, value: 7 },
      { row: 2, col: 1, value: 5 },
      { row: 2, col: 3, value: 8 },
    ]);
  });

  it('keeps rectangle, empty, single and dense-ish cases valid too', () => {
    const cases = edgeFrames as Record<string, FixtureFrame[]>;
    expect(Object.keys(cases)).toHaveLength(9);
    for (const [name, frames] of Object.entries(cases)) {
      const parsed = snapshots(frames);
      const first = parsed[0];
      const final = parsed.at(-1)!;
      expect(final.operation, name).toBe('done');
      expect(final.rows, name).toBe(first.rows);
      expect(final.cols, name).toBe(first.cols);
      expect(final.result.every((item) => item !== null), name).toBe(true);
      expect(final.result, name).toEqual(
        sparseTranspose(final.cols, final.triples),
      );
      expect(final.num, name).toEqual(sparseColumnCounts(final.cols, final.triples));
    }

    const empty = snapshots(cases.empty_zero_dims);
    expect(empty.at(-1)?.rows).toBe(0);
    expect(empty.at(-1)?.cols).toBe(0);
    expect(empty.at(-1)?.result).toEqual([]);

    const rectangle = snapshots(cases.rectangle_3x7);
    expect(rectangle.at(-1)?.rows).toBe(3);
    expect(rectangle.at(-1)?.cols).toBe(7);
    expect(rectangle.at(-1)?.result).toHaveLength(5);
  });

  it('computes num, cpot and placement order for the preset', () => {
    expect(sparseColumnCounts(5, DEFAULT_TRIPLES)).toEqual([2, 1, 3, 0, 0]);
    expect(sparseCpot([2, 1, 3, 0, 0])).toEqual([0, 2, 3, 6, 6]);
    expect(sparsePlacementOrder(5, DEFAULT_TRIPLES)).toEqual([0, 3, 4, 2, 1, 5]);
    expect(sparseTranspose(5, DEFAULT_TRIPLES)).toEqual([
      { row: 0, col: 0, value: 3 },
      { row: 0, col: 3, value: 6 },
      { row: 1, col: 2, value: 4 },
      { row: 2, col: 0, value: 7 },
      { row: 2, col: 1, value: 5 },
      { row: 2, col: 3, value: 8 },
    ]);
  });

  it('rejects a frame whose num does not match the real column counts', () => {
    const first = (defaultFrames as FixtureFrame[])[8].structure as SparseTransposeSnapshot;
    const broken = { ...first, num: [2, 1, 2, 0, 0] };
    expect(sparseTransposeSnapshotSchema.safeParse(broken).success).toBe(false);
  });

  it('keeps the visual model in sync with the placement frames', () => {
    const parsed = snapshots(defaultFrames as FixtureFrame[]);
    const countScan = parsed.find(
      (snapshot) => snapshot.operation === 'count-scan' && snapshot.sourceIndex === 1,
    )!;
    const countModel = buildSparseTransposeModel(countScan);
    expect(countModel.num).toEqual([1, 0, 1, 0, 0]);
    expect(countModel.sourceRows[1].tone).toBe('source');

    const read = parsed.find(
      (snapshot) => snapshot.operation === 'place-read' && snapshot.sourceIndex === 1,
    )!;
    const readModel = buildSparseTransposeModel(read);
    expect(readModel.targetIndex).toBe(3);
    expect(readModel.writtenCount).toBe(1);
    expect(readModel.originalCells.find((cell) => cell.row === 0 && cell.col === 2)).toMatchObject({
      tone: 'source',
      value: 7,
    });
    const pendingTarget = readModel.resultCells.find((cell) => cell.row === 2 && cell.col === 0)!;
    expect(pendingTarget).toMatchObject({ tone: 'target', pending: true, value: 0 });
    expect(readModel.resultRows[3]).toMatchObject({
      row: 2,
      col: 0,
      value: null,
      tone: 'target',
    });

    const write = parsed.find(
      (snapshot) => snapshot.operation === 'place-write' && snapshot.sourceIndex === 1,
    )!;
    const writeModel = buildSparseTransposeModel(write);
    expect(writeModel.targetIndex).toBe(3);
    expect(writeModel.writtenCount).toBe(2);
    expect(writeModel.resultCells.find((cell) => cell.row === 2 && cell.col === 0)).toMatchObject({
      tone: 'target',
      pending: false,
      value: 7,
    });
    expect(writeModel.resultRows[3]).toMatchObject({
      row: 2,
      col: 0,
      value: 7,
      tone: 'target',
    });

    const update = parsed.find(
      (snapshot) => snapshot.operation === 'place-update' && snapshot.sourceIndex === 1,
    )!;
    const updateModel = buildSparseTransposeModel(update);
    expect(updateModel.cpot[2]).toBe(4);
    expect(updateModel.aux[2]).toMatchObject({ col: 2, cpot: 4, active: true, updated: true });
  });

  it('maps the final model to the full transposed matrix', () => {
    const final = snapshots(defaultFrames as FixtureFrame[]).at(-1)!;
    const model = buildSparseTransposeModel(final);
    expect(model.rows).toBe(4);
    expect(model.cols).toBe(5);
    expect(model.resultCells).toHaveLength(20);
    expect(model.resultCells.filter((cell) => cell.tone === 'value')).toHaveLength(6);
    expect(model.resultCells.find((cell) => cell.row === 2 && cell.col === 0)?.value).toBe(7);
    expect(model.writtenCount).toBe(6);
  });
});
