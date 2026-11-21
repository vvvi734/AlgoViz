import { describe, expect, it } from 'vitest';
import { SPARSE_TRANSPOSE_DEFAULT_INPUT } from './sparseTransposeExamples';
import {
  SPARSE_INPUT_LIMITS,
  SPARSE_RANDOM_SCENARIOS,
  buildSparseInput,
  emptySparseDraft,
  nextSparseTriplePosition,
  randomSparseDraft,
  sparseDraftFromInput,
  type SparseInputFields,
} from './sparseInput';
import { buildGuidedInput, guidedDraftFromInput, randomGuidedDraft } from './guidedInput';

function fields(overrides: Partial<SparseInputFields> = {}): SparseInputFields {
  return {
    rows: '3',
    cols: '4',
    triples: [
      { row: '0', col: '0', value: '5' },
      { row: '0', col: '3', value: '-2' },
      { row: '1', col: '2', value: '4' },
      { row: '2', col: '1', value: '7' },
    ],
    ...overrides,
  };
}

function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

describe('INPUT-07 sparse matrix input', () => {
  it('round-trips the official matrix into the exact Python object', () => {
    const draft = guidedDraftFromInput('sparse-transpose', SPARSE_TRANSPOSE_DEFAULT_INPUT);
    expect(draft.sparse?.rows).toBe('4');
    expect(draft.sparse?.cols).toBe('5');
    expect(draft.sparse?.triples).toHaveLength(6);
    const built = buildGuidedInput('sparse-transpose', draft);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.input).toEqual(SPARSE_TRANSPOSE_DEFAULT_INPUT);
  });

  it('accepts custom shape and signed non-zero triples in strict row-major order', () => {
    const built = buildSparseInput(fields());
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.input).toEqual({
      rows: 3,
      cols: 4,
      triples: [
        { row: 0, col: 0, value: 5 },
        { row: 0, col: 3, value: -2 },
        { row: 1, col: 2, value: 4 },
        { row: 2, col: 1, value: 7 },
      ],
    });
  });

  it('accepts an empty 0 × 0 matrix but rejects invalid shapes', () => {
    expect(buildSparseInput({ rows: '0', cols: '0', triples: [] }).ok).toBe(true);
    for (const [rows, cols] of [['', '4'], ['-1', '4'], ['11', '4'], ['3.5', '4']]) {
      const built = buildSparseInput({ rows: rows!, cols: cols!, triples: [] });
      expect(built.ok, `${rows}/${cols}`).toBe(false);
      if (!built.ok) expect(built.error).toMatchObject({ key: 'sparseErrorShape' });
    }
  });

  it('reports coordinates, value, duplicate and order errors against the exact triple row', () => {
    const cases: Array<[SparseInputFields, string, number]> = [
      [fields({ triples: [{ row: 'x', col: '0', value: '1' }] }), 'sparseErrorCoordinate', 1],
      [fields({ triples: [{ row: '3', col: '0', value: '1' }] }), 'sparseErrorRange', 1],
      [fields({ triples: [{ row: '0', col: '0', value: '0' }] }), 'sparseErrorValue', 1],
      [fields({ triples: [{ row: '0', col: '0', value: '1000' }] }), 'sparseErrorValueRange', 1],
      [
        fields({
          triples: [
            { row: '0', col: '0', value: '1' },
            { row: '0', col: '0', value: '2' },
          ],
        }),
        'sparseErrorDuplicate',
        2,
      ],
      [
        fields({
          triples: [
            { row: '0', col: '3', value: '1' },
            { row: '0', col: '1', value: '2' },
          ],
        }),
        'sparseErrorOrder',
        2,
      ],
      [
        fields({
          triples: [
            { row: '1', col: '2', value: '1' },
            { row: '0', col: '3', value: '2' },
          ],
        }),
        'sparseErrorOrder',
        2,
      ],
    ];
    for (const [draft, key, triple] of cases) {
      const built = buildSparseInput(draft);
      expect(built.ok).toBe(false);
      if (!built.ok) expect(built.error).toMatchObject({ key, triple });
    }
  });

  it('enforces the triple count limit', () => {
    const triples = Array.from({ length: SPARSE_INPUT_LIMITS.TRIPLES_MAX + 1 }, (_, index) => ({
      row: String(Math.floor(index / 10)),
      col: String(index % 10),
      value: '1',
    }));
    const built = buildSparseInput({ rows: '10', cols: '10', triples });
    expect(built.ok).toBe(false);
    if (!built.ok) expect(built.error).toMatchObject({ key: 'sparseErrorLimit', max: 24 });
  });

  it('keeps every random scenario legal and row-major for many seeds', () => {
    for (const scenario of SPARSE_RANDOM_SCENARIOS['sparse-transpose']) {
      for (let seed = 1; seed <= 24; seed += 1) {
        const draft = randomSparseDraft(scenario.id, seeded(seed));
        const built = buildSparseInput(draft);
        expect(built.ok, `${scenario.id}/${seed}`).toBe(true);
        if (!built.ok) continue;
        const input = built.input as {
          rows: number;
          cols: number;
          triples: Array<{ row: number; col: number; value: number }>;
        };
        expect(input.rows).toBeGreaterThan(0);
        expect(input.cols).toBeGreaterThan(0);
        expect(input.triples.length).toBeGreaterThan(0);
        if (scenario.id === 'wide') {
          expect(input.triples.every((triple) => triple.col < input.cols - 2)).toBe(true);
        }
      }
    }
    expect(SPARSE_RANDOM_SCENARIOS['sparse-transpose']).toHaveLength(3);
  });

  it('appends only a legal next row-major position', () => {
    const current = fields({
      triples: [
        { row: '0', col: '0', value: '1' },
        { row: '2', col: '3', value: '2' },
      ],
    });
    expect(nextSparseTriplePosition(current)).toBeNull();
    expect(nextSparseTriplePosition({ ...current, rows: '4' })).toEqual({ row: 3, col: 0 });
    expect(nextSparseTriplePosition({ rows: '1', cols: '2', triples: [] })).toEqual({ row: 0, col: 0 });
  });

  it('creates a sparse random draft through the shared guided factory', () => {
    const draft = randomGuidedDraft('sparse-transpose', 'typical', seeded(7));
    expect(draft.sparse?.triples.length).toBeGreaterThan(0);
    const built = buildGuidedInput('sparse-transpose', draft);
    expect(built.ok).toBe(true);
  });

  it('keeps the blank draft shape editable', () => {
    expect(emptySparseDraft()).toEqual({ rows: '4', cols: '5', triples: [] });
    expect(sparseDraftFromInput({ rows: 2, cols: 3, triples: [[1, 2, 4]] })).toEqual({
      rows: '2',
      cols: '3',
      triples: [{ row: '1', col: '2', value: '4' }],
    });
  });
});
