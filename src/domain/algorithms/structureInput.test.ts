import { describe, expect, it } from 'vitest';
import { defaultInputFor } from './examples';
import {
  buildGuidedInput,
  defaultGuidedScenario,
  guidedDraftFromInput,
  guidedExecutionLanguage,
  guidedRandomScenarios,
  randomGuidedDraft,
  type GuidedInputAlgorithm,
  type GuidedInputDraft,
} from './guidedInput';
import {
  STRUCTURE_GUIDED_INPUT_ALGORITHMS,
  STRUCTURE_LIMITS,
  isStructureGuidedInputAlgorithm,
  structureOperationSpecs,
  type StructureGuidedInputAlgorithm,
  type StructureOperationDraft,
} from './structureInput';

function row(
  id: string,
  op: string,
  fields: Partial<Pick<StructureOperationDraft, 'value' | 'index' | 'anchor'>> = {},
): StructureOperationDraft {
  return { id, op, value: '', index: '', anchor: '', ...fields };
}

function draft(
  values: string,
  rows: StructureOperationDraft[],
): GuidedInputDraft {
  return {
    values,
    nums: '',
    target: '',
    n: '',
    text: '',
    pattern: '',
    operations: '',
    rows,
    mode: 'inorder',
    command: '',
    symbols: '',
  };
}

function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

const STRUCTURES = [...STRUCTURE_GUIDED_INPUT_ALGORITHMS];

describe('INPUT-04 structured linear inputs', () => {
  it('registers exactly the six implemented structures as Python guided inputs', () => {
    expect(STRUCTURES).toEqual(['linked', 'doubly', 'circular', 'seqlist', 'stack', 'queue']);
    for (const id of STRUCTURES) {
      expect(isStructureGuidedInputAlgorithm(id)).toBe(true);
      expect(guidedExecutionLanguage(id, 'custom')).toBe('python');
      expect(guidedRandomScenarios(id).length).toBeGreaterThanOrEqual(3);
      expect(defaultGuidedScenario(id)).toBe(guidedRandomScenarios(id)[0]?.id);
    }
  });

  it('only exposes operations that the existing teaching programs implement', () => {
    const ops = (id: StructureGuidedInputAlgorithm) =>
      structureOperationSpecs(id).map((spec) => spec.op);
    expect(ops('linked')).toEqual(['insert_head', 'insert_tail', 'insert_after', 'delete', 'traverse']);
    expect(ops('doubly')).toEqual([
      'insert_head', 'insert_tail', 'insert_after', 'delete', 'delete_head',
      'delete_tail', 'traverse_forward', 'traverse_reverse', 'find',
    ]);
    expect(ops('circular')).toEqual([
      'insert_head', 'insert_tail', 'insert_after', 'delete', 'delete_head',
      'delete_tail', 'traverse_circle', 'find',
    ]);
    expect(ops('seqlist')).toEqual(['access', 'search', 'insert', 'delete', 'traverse']);
    expect(ops('stack')).toEqual(['push', 'pop', 'peek']);
    expect(ops('queue')).toEqual(['enqueue', 'dequeue', 'front']);
  });

  it('round-trips every official example into editable rows and a runnable input', () => {
    for (const id of STRUCTURES) {
      const official = defaultInputFor(id);
      const edit = guidedDraftFromInput(id, official);
      expect(edit.rows.length).toBeGreaterThan(0);
      const built = buildGuidedInput(id, edit);
      expect(built.ok).toBe(true);
      if (!built.ok) continue;
      if (id === 'seqlist') {
        expect(built.input).toMatchObject({
          capacity: STRUCTURE_LIMITS.SEQUENTIAL_CAPACITY,
          values: [10, 20, 30, 40, 50],
          operations: [['insert', 2, 25]],
        });
      } else if (id === 'stack' || id === 'queue') {
        expect(built.input).toEqual(official);
      } else {
        // Legacy official examples may carry an ignored argument on a
        // no-argument operation (for example ['delete_tail', 7]); the editor
        // intentionally reconstructs only arguments that the operation uses.
        expect((built.input as unknown[][]).map((operation) => operation[0])).toEqual(
          (official as unknown[][]).map((operation) => operation[0]),
        );
      }
    }
  });

  it('keeps sequential-list indices zero-based and preserves initial values', () => {
    const built = buildGuidedInput(
      'seqlist',
      draft('10, 20, 30, 40, 50', [
        row('r1', 'insert', { index: '0', value: '5' }),
        row('r2', 'delete', { index: '4' }),
        row('r3', 'search', { value: '30' }),
        row('r4', 'access', { index: '1' }),
        row('r5', 'traverse'),
      ]),
    );
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.input).toEqual({
      capacity: 8,
      values: [10, 20, 30, 40, 50],
      operations: [['insert', 0, 5], ['delete', 4], ['search', 30], ['access', 1], ['traverse']],
    });
  });

  it('rejects missing targets, bad positions, empty structures and capacity overflow', () => {
    const linkedDelete = buildGuidedInput('linked', draft('', [row('r1', 'delete', { value: '99' })]));
    expect(linkedDelete).toEqual({
      ok: false,
      error: { key: 'structureErrorEmpty', row: 1 },
    });

    const linkedDeleteMissing = buildGuidedInput(
      'linked',
      draft('', [
        row('r1', 'insert_head', { value: '1' }),
        row('r2', 'delete', { value: '99' }),
      ]),
    );
    expect(linkedDeleteMissing).toEqual({
      ok: false,
      error: { key: 'structureErrorMissing', row: 2 },
    });

    const linkedAnchor = buildGuidedInput(
      'linked',
      draft('', [row('r1', 'insert_after', { anchor: '99', value: '5' })]),
    );
    expect(linkedAnchor).toEqual({
      ok: false,
      error: { key: 'structureErrorAnchor', row: 1 },
    });

    const linkedLimit = buildGuidedInput(
      'linked',
      draft(
        '',
        Array.from({ length: STRUCTURE_LIMITS.MAX_ITEMS + 1 }, (_, index) =>
          row(`r${index + 1}`, 'insert_head', { value: String(index + 1) }),
        ),
      ),
    );
    expect(linkedLimit).toEqual({
      ok: false,
      error: {
        key: 'structureErrorItemLimit',
        row: STRUCTURE_LIMITS.MAX_ITEMS + 1,
        max: STRUCTURE_LIMITS.MAX_ITEMS,
      },
    });

    const seqPosition = buildGuidedInput(
      'seqlist',
      draft('10, 20, 30', [row('r1', 'insert', { index: '4', value: '5' })]),
    );
    expect(seqPosition).toEqual({
      ok: false,
      error: { key: 'structureErrorPosition', row: 1 },
    });

    const seqFull = buildGuidedInput(
      'seqlist',
      draft('1, 2, 3, 4, 5, 6, 7, 8', [row('r1', 'insert', { index: '0', value: '9' })]),
    );
    expect(seqFull).toEqual({
      ok: false,
      error: { key: 'structureErrorCapacity', row: 1, max: 8 },
    });

    expect(buildGuidedInput('stack', draft('', [row('r1', 'pop')]))).toEqual({
      ok: false,
      error: { key: 'structureErrorEmpty', row: 1 },
    });
    expect(buildGuidedInput('queue', draft('', [row('r1', 'front')]))).toEqual({
      ok: false,
      error: { key: 'structureErrorEmpty', row: 1 },
    });
    expect(buildGuidedInput('linked', draft('', [row('r1', 'insert_head')]))).toEqual({
      ok: false,
      error: { key: 'structureErrorValue', row: 1 },
    });
    expect(buildGuidedInput('linked', draft('', []))).toEqual({
      ok: false,
      error: { key: 'structureErrorNoOperations' },
    });
    expect(
      buildGuidedInput('seqlist', draft('1, 2, 3, 4, 5, 6, 7, 8, 9', [row('r1', 'traverse')])),
    ).toEqual({
      ok: false,
      error: { key: 'structureErrorInitialLength', max: 8 },
    });
  });

  it('generates only runnable sequences for every random scenario and seed', () => {
    for (const id of STRUCTURES) {
      for (const scenario of guidedRandomScenarios(id)) {
        for (let seed = 1; seed <= 20; seed += 1) {
          const randomDraft = randomGuidedDraft(id, scenario.id, seeded(seed));
          const built = buildGuidedInput(id, randomDraft);
          expect(built.ok, `${id}/${scenario.id}/${seed}`).toBe(true);
          expect(randomDraft.rows.length).toBeGreaterThan(0);
          expect(randomDraft.rows.length).toBeLessThanOrEqual(STRUCTURE_LIMITS.MAX_OPERATIONS);
        }
      }
    }
  });

  it('models legal capacity boundaries and clear-to-empty random cases', () => {
    const stackCapacity = randomGuidedDraft('stack', 'capacity', seeded(1));
    const stackBuilt = buildGuidedInput('stack', stackCapacity);
    expect(stackBuilt.ok).toBe(true);
    // The default array stack reserves exactly four slots; the capacity
    // scenario fills all of them, while linked storage may grow to ten.
    expect(stackCapacity.rows.filter((item) => item.op === 'push')).toHaveLength(
      STRUCTURE_LIMITS.STACK_CAPACITY,
    );

    const stackClear = randomGuidedDraft('stack', 'clear', seeded(2));
    expect(stackClear.rows.slice(-3).map((item) => item.op)).toEqual(['pop', 'pop', 'pop']);
    expect(buildGuidedInput('stack', stackClear).ok).toBe(true);

    const queueClear = randomGuidedDraft('queue', 'clear', seeded(3));
    expect(queueClear.rows.slice(-3).map((item) => item.op)).toEqual(['dequeue', 'dequeue', 'dequeue']);
    expect(buildGuidedInput('queue', queueClear).ok).toBe(true);

    const seqCapacity = randomGuidedDraft('seqlist', 'capacity', seeded(4));
    const seqBuilt = buildGuidedInput('seqlist', seqCapacity);
    expect(seqBuilt.ok).toBe(true);
    if (seqBuilt.ok) {
      expect((seqBuilt.input as { operations: unknown[] }).operations).toHaveLength(5);
    }
  });

  it('formats operation drafts with readable row ids for every supported structure', () => {
    for (const id of STRUCTURES) {
      const sample = guidedDraftFromInput(id, defaultInputFor(id));
      expect(sample.rows.map((item) => item.id)).toEqual(
        sample.rows.map((_, index) => `r${index + 1}`),
      );
    }
  });

  it('keeps guided algorithm ids typed for the UI without leaking unsupported ids', () => {
    const ids: GuidedInputAlgorithm[] = STRUCTURES;
    expect(ids).toHaveLength(6);
  });
});
