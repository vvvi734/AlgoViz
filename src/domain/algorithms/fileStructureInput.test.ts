import { describe, expect, it } from 'vitest';
import {
  FILE_STRUCTURE_RANDOM_SCENARIOS,
  buildFileStructureInput,
  emptyFileDraft,
  fileDraftFromInput,
  randomFileDraft,
} from './fileStructureInput';

type BuiltInput = {
  indexKind?: string;
  blockCapacity?: number;
  targetKey?: number;
  command?: string;
  newLabel?: string;
  mode?: string;
  queryTerms?: string[];
  records: Array<Record<string, unknown>>;
};

function build(id: 'file-index' | 'isam' | 'inverted-index', draft: ReturnType<typeof emptyFileDraft>) {
  return buildFileStructureInput(id, draft);
}

describe('TEXTBOOK-12 file-structure input', () => {
  it('accepts the official defaults for all three algorithms', () => {
    for (const id of ['file-index', 'isam', 'inverted-index'] as const) {
      const result = build(id, emptyFileDraft(id));
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      const input = result.input as BuiltInput;
      expect(input.records.length).toBeGreaterThanOrEqual(2);
      if (id === 'inverted-index') {
        expect(input.queryTerms).toEqual(['算法', '排序']);
        expect(input.mode).toBe('and');
      } else {
        expect(input.blockCapacity).toBeGreaterThanOrEqual(2);
        expect(input.blockCapacity).toBeLessThanOrEqual(4);
        expect(typeof input.targetKey).toBe('number');
      }
    }
  });

  it('rejects duplicate keys, invalid targets and capacities for the indexed file', () => {
    const draft = emptyFileDraft('file-index');
    draft.file = { ...draft.file!, records: '101, A\n101, B\n103, C', targetKey: '102' };
    const duplicate = build('file-index', draft);
    expect(duplicate.ok).toBe(false);
    if (!duplicate.ok) expect(duplicate.error.key).toBe('fileErrorUniqueKey');

    draft.file = { ...draft.file!, records: '101, A\n102, B\n103, C', targetKey: 'x' };
    const target = build('file-index', draft);
    expect(target.ok).toBe(false);
    if (!target.ok) expect(target.error.key).toBe('fileErrorTarget');

    draft.file = { ...draft.file!, targetKey: '102', blockCapacity: '5' };
    const capacity = build('file-index', draft);
    expect(capacity.ok).toBe(false);
    if (!capacity.ok) expect(capacity.error.key).toBe('fileErrorCapacity');
  });

  it('keeps sparse/dense routing and an ISAM insert distinct', () => {
    const indexDraft = emptyFileDraft('file-index');
    indexDraft.file = { ...indexDraft.file!, indexKind: 'sparse', blockCapacity: '2', targetKey: '106' };
    const index = build('file-index', indexDraft);
    expect(index.ok).toBe(true);
    if (index.ok) {
      const input = index.input as BuiltInput;
      expect(input.indexKind).toBe('sparse');
      expect(input.blockCapacity).toBe(2);
    }

    const isamDraft = emptyFileDraft('isam');
    isamDraft.file = { ...isamDraft.file!, targetKey: '105', newLabel: 'I', command: 'insert' };
    const isam = build('isam', isamDraft);
    expect(isam.ok).toBe(true);
    if (isam.ok) {
      const input = isam.input as BuiltInput;
      expect(input.command).toBe('insert');
      expect(input.newLabel).toBe('I');
      expect(input.records.some((record) => record.key === 105)).toBe(false);
    }

    isamDraft.file = { ...isamDraft.file!, targetKey: '101' };
    const duplicate = build('isam', isamDraft);
    expect(duplicate.ok).toBe(false);
    if (!duplicate.ok) expect(duplicate.error.key).toBe('fileErrorInsertKey');
  });

  it('rejects malformed inverted records and duplicate query terms', () => {
    const draft = emptyFileDraft('inverted-index');
    draft.file = {
      ...draft.file!,
      records: 'R1: 算法\nR1: 排序\nR2: 数据结构',
    };
    const duplicateRow = build('inverted-index', draft);
    expect(duplicateRow.ok).toBe(false);
    if (!duplicateRow.ok) expect(duplicateRow.error.key).toBe('invertedErrorRecordRow');

    draft.file = {
      ...draft.file!,
      records: 'R1: 算法, 算法\nR2: 排序',
    };
    const duplicateTerm = build('inverted-index', draft);
    expect(duplicateTerm.ok).toBe(false);
    if (!duplicateTerm.ok) expect(duplicateTerm.error.key).toBe('invertedErrorRecords');

    draft.file = {
      ...draft.file!,
      records: 'R1: 算法, 排序\nR2: 数据结构',
      queryTerms: '算法, 算法',
    };
    const duplicateQuery = build('inverted-index', draft);
    expect(duplicateQuery.ok).toBe(false);
    if (!duplicateQuery.ok) expect(duplicateQuery.error.key).toBe('invertedErrorQuery');
  });

  it('round-trips record IDs and keywords through the input draft', () => {
    const draft = emptyFileDraft('inverted-index');
    draft.file = {
      ...draft.file!,
      queryTerms: '算法, 排序',
      records: 'R1: 数据结构, 算法\nR2: 算法, 排序\nR3: 索引',
    };
    const result = build('inverted-index', draft);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const roundTrip = fileDraftFromInput('inverted-index', result.input);
    expect(roundTrip.file?.records).toBe(draft.file?.records);
    expect(roundTrip.file?.queryTerms).toBe('算法, 排序');
  });

  it('generates buildable random scenarios, including a guaranteed no-match AND query', () => {
    for (const [id, scenarios] of Object.entries(FILE_STRUCTURE_RANDOM_SCENARIOS) as Array<
      ['file-index' | 'isam' | 'inverted-index', typeof FILE_STRUCTURE_RANDOM_SCENARIOS['file-index']]
    >) {
      for (const scenario of scenarios) {
        for (let attempt = 0; attempt < 8; attempt += 1) {
          const draft = randomFileDraft(id, scenario.id);
          const result = build(id, draft);
          expect(result.ok, `${id}/${scenario.id}`).toBe(true);
          if (id === 'inverted-index' && scenario.id === 'no-match') {
            expect(draft.file?.records).not.toContain('图');
            expect(draft.file?.records).not.toContain('树');
          }
        }
      }
    }
  });
});
