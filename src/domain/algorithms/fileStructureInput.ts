/**
 * TEXTBOOK-12 input contracts for indexed files, ISAM and inverted indexes.
 *
 * The editors accept simple record lines rather than a full database syntax.
 * Indexed-file and ISAM rows are `key, label`; inverted-index rows are
 * `R1: term, term`. Keywords are already segmented, so no tokenizer is implied.
 */
import type { GuidedInputDraft, GuidedInputError, GuidedRandomScenario } from './guidedInput';

export const FILE_STRUCTURE_GUIDED_INPUT_ALGORITHMS = [
  'file-index',
  'isam',
  'inverted-index',
] as const;
export type FileStructureGuidedInputAlgorithm =
  (typeof FILE_STRUCTURE_GUIDED_INPUT_ALGORITHMS)[number];

export const FILE_INDEX_ALGORITHM = 'file-index' as const;
export const ISAM_ALGORITHM = 'isam' as const;
export const INVERTED_INDEX_ALGORITHM = 'inverted-index' as const;

export interface FileStructureInputFields {
  records: string;
  indexKind: string;
  blockCapacity: string;
  targetKey: string;
  command: string;
  newLabel: string;
  queryTerms: string;
  queryMode: string;
}

export function isFileStructureGuidedInputAlgorithm(id: string): id is FileStructureGuidedInputAlgorithm {
  return (FILE_STRUCTURE_GUIDED_INPUT_ALGORITHMS as readonly string[]).includes(id);
}

export function isFileStructureAlgorithm(id: string): boolean {
  return id === FILE_INDEX_ALGORITHM || id === ISAM_ALGORITHM || id === INVERTED_INDEX_ALGORITHM;
}

const EMPTY_FILE: FileStructureInputFields = {
  records: '',
  indexKind: 'dense',
  blockCapacity: '3',
  targetKey: '',
  command: 'find',
  newLabel: '',
  queryTerms: '',
  queryMode: 'and',
};

const BASE_DRAFT = {
  values: '',
  nums: '',
  target: '',
  n: '',
  text: '',
  pattern: '',
  operations: '',
  rows: [],
  mode: '',
  command: '',
  symbols: '',
} satisfies GuidedInputDraft;

export function emptyFileDraft(id: FileStructureGuidedInputAlgorithm): GuidedInputDraft {
  if (id === FILE_INDEX_ALGORITHM) {
    return {
      ...BASE_DRAFT,
      file: {
        ...EMPTY_FILE,
        records: '101, A\n102, B\n103, C\n104, D\n105, E\n106, F\n107, G\n108, H',
        indexKind: 'dense',
        blockCapacity: '3',
        targetKey: '106',
      },
    };
  }
  if (id === ISAM_ALGORITHM) {
    return {
      ...BASE_DRAFT,
      file: {
        ...EMPTY_FILE,
        records: '101, A\n102, B\n103, C\n104, D\n106, F\n108, H',
        blockCapacity: '2',
        targetKey: '105',
        command: 'insert',
        newLabel: 'I',
      },
    };
  }
  return {
    ...BASE_DRAFT,
    file: {
      ...EMPTY_FILE,
      records: 'R1: 数据结构, 算法\nR2: 算法, 排序\nR3: 数据结构, 排序\nR4: 索引, 算法',
      queryTerms: '算法, 排序',
      queryMode: 'and',
    },
  };
}

export function fileDraftFromInput(
  id: FileStructureGuidedInputAlgorithm,
  input: unknown,
): GuidedInputDraft {
  const base = emptyFileDraft(id);
  if (!input || typeof input !== 'object') return base;
  const record = input as Record<string, unknown>;
  const existing = base.file ?? EMPTY_FILE;
  if (id === INVERTED_INDEX_ALGORITHM) {
    const rows = Array.isArray(record.records) ? record.records : [];
    const records = rows
      .filter((row): row is Record<string, unknown> => Boolean(row && typeof row === 'object'))
      .map((row) => `${String(row.id ?? '')}: ${Array.isArray(row.keywords) ? row.keywords.map(String).join(', ') : ''}`)
      .join('\n');
    const queryTerms = Array.isArray(record.queryTerms) ? record.queryTerms.map(String).join(', ') : existing.queryTerms;
    const queryMode = record.mode === 'or' ? 'or' : record.mode === 'and' ? 'and' : existing.queryMode;
    return { ...base, file: { ...existing, records: records || existing.records, queryTerms, queryMode } };
  }
  const rows = Array.isArray(record.records) ? record.records : [];
  const records = rows
    .filter((row): row is Record<string, unknown> => Boolean(row && typeof row === 'object'))
    .map((row) => `${String(row.key ?? '')}, ${String(row.label ?? '')}`)
    .join('\n');
  const indexKind = record.indexKind === 'sparse' ? 'sparse' : record.indexKind === 'dense' ? 'dense' : existing.indexKind;
  const blockCapacity = typeof record.blockCapacity === 'number'
    ? String(record.blockCapacity)
    : existing.blockCapacity;
  const targetKey = typeof record.targetKey === 'number' ? String(record.targetKey) : existing.targetKey;
  const command = record.command === 'insert' ? 'insert' : record.command === 'find' ? 'find' : existing.command;
  const newLabel = typeof record.newLabel === 'string' ? record.newLabel : existing.newLabel;
  return {
    ...base,
    file: { ...existing, records: records || existing.records, indexKind, blockCapacity, targetKey, command, newLabel },
  };
}

interface ParsedRecord {
  key: number;
  label: string;
}

function parseRecords(raw: string): ParsedRecord[] | null {
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 3 || lines.length > 18) return null;
  const records: ParsedRecord[] = [];
  for (const line of lines) {
    const parts = line.split(/[,，|]/).map((part) => part.trim()).filter(Boolean);
    if (parts.length < 2) return null;
    const key = Number(parts[0]);
    if (!Number.isSafeInteger(key) || key < 0 || key > 9999) return null;
    const label = parts.slice(1).join(' ');
    if (!label || label.length > 12) return null;
    records.push({ key, label });
  }
  return records;
}

interface ParsedInvertedRecord {
  id: string;
  keywords: string[];
}

function parseInvertedRecords(raw: string): ParsedInvertedRecord[] | null {
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2 || lines.length > 9) return null;
  const records: ParsedInvertedRecord[] = [];
  for (const line of lines) {
    const separator = line.indexOf(':');
    if (separator < 1) return null;
    const id = line.slice(0, separator).trim();
    if (!/^R[1-9]\d?$/.test(id)) return null;
    const keywords = line.slice(separator + 1).split(/[,，|]/).map((term) => term.trim()).filter(Boolean);
    if (keywords.length < 1 || keywords.length > 4) return null;
    if (keywords.some((term) => term.length > 16) || new Set(keywords).size !== keywords.length) return null;
    records.push({ id, keywords });
  }
  return records;
}

function parseInteger(raw: string): number | null {
  if (!/^\d+$/.test(raw.trim())) return null;
  const value = Number(raw.trim());
  return Number.isSafeInteger(value) ? value : null;
}

export function buildFileStructureInput(
  id: FileStructureGuidedInputAlgorithm,
  draft: GuidedInputDraft,
): { ok: true; input: unknown } | { ok: false; error: GuidedInputError } {
  const fields = draft.file;
  if (!fields) return { ok: false, error: { key: 'fileErrorRecords' } };
  if (id === INVERTED_INDEX_ALGORITHM) {
    const records = parseInvertedRecords(fields.records);
    if (!records) return { ok: false, error: { key: 'invertedErrorRecords' } };
    if (new Set(records.map((record) => record.id)).size !== records.length) {
      return { ok: false, error: { key: 'invertedErrorRecordRow' } };
    }
    const queryTerms = fields.queryTerms.split(/[,，|]/).map((term) => term.trim()).filter(Boolean);
    if (queryTerms.length < 1 || queryTerms.length > 4) return { ok: false, error: { key: 'invertedErrorQuery' } };
    if (queryTerms.some((term) => term.length > 16) || new Set(queryTerms).size !== queryTerms.length) {
      return { ok: false, error: { key: 'invertedErrorQuery' } };
    }
    const mode = fields.queryMode === 'or' ? 'or' : fields.queryMode === 'and' ? 'and' : null;
    if (!mode) return { ok: false, error: { key: 'invertedErrorMode' } };
    return {
      ok: true,
      input: {
        preset: 'custom',
        mode,
        queryTerms,
        records,
      },
    };
  }

  const records = parseRecords(fields.records);
  if (!records || records.length < (id === FILE_INDEX_ALGORITHM ? 3 : 4)) {
    return { ok: false, error: { key: 'fileErrorRecords' } };
  }
  if (new Set(records.map((record) => record.key)).size !== records.length) {
    return { ok: false, error: { key: 'fileErrorUniqueKey' } };
  }
  const targetKey = parseInteger(fields.targetKey);
  if (targetKey === null || targetKey > 9999) return { ok: false, error: { key: 'fileErrorTarget' } };
  const blockCapacity = parseInteger(fields.blockCapacity);
  if (blockCapacity === null || blockCapacity < 2 || blockCapacity > 4) {
    return { ok: false, error: { key: 'fileErrorCapacity' } };
  }

  if (id === FILE_INDEX_ALGORITHM) {
    const indexKind = fields.indexKind === 'sparse' ? 'sparse' : fields.indexKind === 'dense' ? 'dense' : null;
    if (!indexKind) return { ok: false, error: { key: 'fileErrorIndexKind' } };
    return {
      ok: true,
      input: {
        preset: 'custom',
        indexKind,
        blockCapacity,
        targetKey,
        records,
      },
    };
  }

  const command = fields.command === 'insert' ? 'insert' : fields.command === 'find' ? 'find' : null;
  if (!command) return { ok: false, error: { key: 'fileErrorCommand' } };
  if (command === 'insert') {
    if (records.some((record) => record.key === targetKey)) {
      return { ok: false, error: { key: 'fileErrorInsertKey' } };
    }
    if (!fields.newLabel.trim() || fields.newLabel.trim().length > 12) {
      return { ok: false, error: { key: 'fileErrorNewLabel' } };
    }
  }
  return {
    ok: true,
    input: {
      preset: 'custom',
      command,
      blockCapacity,
      targetKey,
      newLabel: fields.newLabel.trim() || 'N',
      records,
    },
  };
}

export function randomFileDraft(
  id: FileStructureGuidedInputAlgorithm,
  scenario: string,
): GuidedInputDraft {
  const base = emptyFileDraft(id);
  const fields = base.file!;
  if (id === INVERTED_INDEX_ALGORITHM) {
    const pool = scenario === 'no-match'
      ? ['算法', '数据结构', '排序', '索引']
      : ['算法', '数据结构', '排序', '索引', '图', '树'];
    const count = scenario === 'single-term' ? 2 : 4 + Math.floor(Math.random() * 3);
    const records = Array.from({ length: count }, (_, index) => {
      const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 2));
      if (scenario === 'shared-keyword' && (index === 0 || index === count - 1)) {
        shuffled[0] = '算法';
      }
      if (scenario === 'shared-keyword' && index === 0) {
        shuffled[1] = '排序';
      }
      return { id: `R${index + 1}`, keywords: [...new Set(shuffled)] };
    });
    let queryTerms: string[];
    if (scenario === 'missing-term') queryTerms = ['算法', '并行'];
    else if (scenario === 'no-match') queryTerms = ['图', '树'];
    else if (scenario === 'shared-keyword') queryTerms = ['算法'];
    else if (scenario === 'single-term') queryTerms = ['算法'];
    else if (scenario === 'or-query') queryTerms = ['算法', '排序'];
    else queryTerms = ['算法', '排序'];
    return {
      ...base,
      file: {
        ...fields,
        records: records.map((record) => `${record.id}: ${record.keywords.join(', ')}`).join('\n'),
        queryTerms: queryTerms.join(', '),
        queryMode: scenario === 'or-query' ? 'or' : 'and',
      },
    };
  }

  const blockCapacity = scenario === 'small-blocks' ? '2' : scenario === 'large-blocks' ? '4' : '3';
  let count = id === FILE_INDEX_ALGORITHM ? 8 : 8;
  if (id === ISAM_ALGORITHM && scenario === 'insert-main') count = Number(blockCapacity) * 2 + 1;
  const start = 101 + Math.floor(Math.random() * 20);
  const spacing = id === ISAM_ALGORITHM ? 2 : 1;
  const keys = Array.from({ length: count }, (_, index) => start + index * spacing);
  const labels = Array.from({ length: count }, (_, index) => String.fromCharCode(65 + (index % 26)));
  const records = keys.map((key, index) => ({ key, label: labels[index]! }));
  let targetKey = keys[Math.floor(keys.length / 2)]!;
  if (scenario.includes('miss')) targetKey = keys.at(-1)! + 1;
  if (id === ISAM_ALGORITHM && scenario === 'insert-overflow') {
    targetKey = keys[1]! + 1;
  }
  if (id === ISAM_ALGORITHM && scenario === 'insert-main') {
    targetKey = keys.at(-1)! + 1;
  }
  if (id === ISAM_ALGORITHM && scenario === 'find-hit') targetKey = keys[2]!;
  return {
    ...base,
    file: {
      ...fields,
      records: records.map((record) => `${record.key}, ${record.label}`).join('\n'),
      indexKind: scenario.includes('sparse') ? 'sparse' : 'dense',
      blockCapacity,
      targetKey: String(targetKey),
      command: id === ISAM_ALGORITHM && scenario.startsWith('insert') ? 'insert' : 'find',
      newLabel: 'N',
    },
  };
}

export const FILE_STRUCTURE_RANDOM_SCENARIOS: Record<
  FileStructureGuidedInputAlgorithm,
  readonly GuidedRandomScenario[]
> = {
  'file-index': [
    { id: 'dense-hit', label: ['稠密索引命中', 'Dense-index hit'] },
    { id: 'dense-miss', label: ['稠密索引失败', 'Dense-index miss'] },
    { id: 'sparse-hit', label: ['稀疏索引命中', 'Sparse-index hit'] },
    { id: 'sparse-miss', label: ['稀疏索引失败', 'Sparse-index miss'] },
    { id: 'small-blocks', label: ['小块容量', 'Small blocks'] },
    { id: 'large-blocks', label: ['大块容量', 'Large blocks'] },
  ],
  isam: [
    { id: 'find-hit', label: ['主区命中', 'Main-block hit'] },
    { id: 'find-miss', label: ['查找失败', 'Miss'] },
    { id: 'insert-main', label: ['插入主区', 'Insert into main'] },
    { id: 'insert-overflow', label: ['插入溢出区', 'Insert into overflow'] },
    { id: 'small-blocks', label: ['小块容量', 'Small blocks'] },
  ],
  'inverted-index': [
    { id: 'and-query', label: ['AND 交集', 'AND intersection'] },
    { id: 'or-query', label: ['OR 并集', 'OR union'] },
    { id: 'no-match', label: ['无匹配', 'No matches'] },
    { id: 'shared-keyword', label: ['共享关键字', 'Shared keyword'] },
    { id: 'missing-term', label: ['缺失关键字', 'Missing term'] },
  ],
};
