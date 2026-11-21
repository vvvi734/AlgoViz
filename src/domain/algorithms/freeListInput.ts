import type { FreeListPolicy } from '../trace/freeListSchema';
import type { GuidedInputError, GuidedRandomScenario } from './guidedInput';

/**
 * TEXTBOOK-08: structured operation draft for the free-space list course.
 * Students choose only alloc/free, a short block id and a byte count. No raw
 * pointer address is typed by hand, and every release is checked against the
 * blocks still allocated at that point.
 */
export const FREE_LIST_GUIDED_INPUT = 'free-list' as const;
export type FreeListGuidedInputAlgorithm = typeof FREE_LIST_GUIDED_INPUT;

export interface FreeListOperationRow {
  /** Editor row identity, never used by the algorithm. */
  id: string;
  op: 'alloc' | 'free';
  /** Student-visible block id, also the allocation label. */
  blockId: string;
  size: string;
}

export interface FreeListInputDraft {
  capacity: string;
  policy: FreeListPolicy;
  rows: FreeListOperationRow[];
}

export const FREE_LIST_LIMITS = {
  MIN_CAPACITY: 8,
  MAX_CAPACITY: 128,
  DEFAULT_CAPACITY: 64,
  MAX_OPERATIONS: 12,
} as const;

export const FREE_LIST_RANDOM_SCENARIOS: readonly GuidedRandomScenario[] = [
  {
    id: 'mixed',
    label: ['连续分配与释放', 'Allocate and release'],
  },
  {
    id: 'external-fragmentation',
    label: ['外部碎片导致失败', 'External fragmentation'],
  },
  {
    id: 'coalesce',
    label: ['释放相邻块并合并', 'Coalesce neighbours'],
  },
  {
    id: 'first-vs-best',
    label: ['首次适应与最佳适应对照', 'First Fit vs Best Fit'],
  },
];

function rowId(index: number): string {
  return `r${index + 1}`;
}

export function emptyFreeListDraft(): FreeListInputDraft {
  return {
    capacity: String(FREE_LIST_LIMITS.DEFAULT_CAPACITY),
    policy: 'first-fit',
    rows: [
      { id: 'r1', op: 'alloc', blockId: 'A', size: '12' },
      { id: 'r2', op: 'alloc', blockId: 'B', size: '16' },
      { id: 'r3', op: 'alloc', blockId: 'C', size: '10' },
    ],
  };
}

export function freeListDraftFromInput(input: unknown): FreeListInputDraft {
  if (typeof input !== 'object' || input === null) return emptyFreeListDraft();
  const raw = input as Record<string, unknown>;
  const capacity = typeof raw.capacity === 'number' ? String(raw.capacity) : String(FREE_LIST_LIMITS.DEFAULT_CAPACITY);
  const policy = raw.policy === 'best-fit' ? 'best-fit' : 'first-fit';
  const operations = Array.isArray(raw.operations) ? raw.operations : [];
  const rows: FreeListOperationRow[] = [];
  operations.forEach((item, index) => {
    if (typeof item !== 'object' || item === null) return;
    const operation = item as Record<string, unknown>;
    const op = operation.op === 'free' ? 'free' : 'alloc';
    const blockId = typeof operation.id === 'string' ? operation.id : '';
    const size = typeof operation.size === 'number' ? String(operation.size) : '';
    rows.push({ id: rowId(index), op, blockId, size });
  });
  if (!rows.length) return emptyFreeListDraft();
  return { capacity, policy, rows };
}

function nextRowId(rows: FreeListOperationRow[]): string {
  const used = new Set(rows.map((row) => row.id));
  let sequence = rows.length + 1;
  while (used.has(`r${sequence}`)) sequence += 1;
  return `r${sequence}`;
}

export function nextFreeListRow(rows: FreeListOperationRow[]): FreeListOperationRow {
  const used = new Set(rows.map((row) => row.blockId.trim().toUpperCase()));
  let code = 65;
  while (used.has(String.fromCharCode(code))) code += 1;
  return {
    id: nextRowId(rows),
    op: 'alloc',
    blockId: code <= 90 ? String.fromCharCode(code) : '',
    size: '8',
  };
}

export function buildFreeListInput(draft: FreeListInputDraft):
  | { ok: true; input: unknown }
  | { ok: false; error: GuidedInputError } {
  const capacity = Number(draft.capacity);
  if (!Number.isInteger(capacity) || capacity < FREE_LIST_LIMITS.MIN_CAPACITY || capacity > FREE_LIST_LIMITS.MAX_CAPACITY) {
    return { ok: false, error: { key: 'freeListErrorCapacity' } };
  }
  if (!draft.rows.length || draft.rows.length > FREE_LIST_LIMITS.MAX_OPERATIONS) {
    return { ok: false, error: { key: 'freeListErrorOperations', max: FREE_LIST_LIMITS.MAX_OPERATIONS } };
  }
  const usedIds = new Set<string>();
  const liveIds = new Set<string>();
  const operations: Array<{ op: 'alloc'; id: string; size: number } | { op: 'free'; id: string }> = [];
  for (let index = 0; index < draft.rows.length; index += 1) {
    const row = draft.rows[index]!;
    const blockId = row.blockId.trim();
    if (!/^[A-Za-z0-9]{1,3}$/.test(blockId)) {
      return { ok: false, error: { key: 'freeListErrorBlockId', row: index + 1 } };
    }
    if (row.op === 'alloc') {
      if (usedIds.has(blockId)) {
        return { ok: false, error: { key: 'freeListErrorBlockId', row: index + 1 } };
      }
      const size = Number(row.size);
      if (!Number.isInteger(size) || size <= 0 || size > capacity) {
        return { ok: false, error: { key: 'freeListErrorAllocationSize', row: index + 1 } };
      }
      usedIds.add(blockId);
      liveIds.add(blockId);
      operations.push({ op: 'alloc', id: blockId, size });
    } else {
      if (!liveIds.has(blockId)) {
        return { ok: false, error: { key: 'freeListErrorReleaseId', row: index + 1 } };
      }
      liveIds.delete(blockId);
      operations.push({ op: 'free', id: blockId });
    }
  }
  return { ok: true, input: { capacity, policy: draft.policy, operations } };
}

function randomInt(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

export function randomFreeListDraft(scenario: string, random: () => number = Math.random): FreeListInputDraft {
  if (scenario === 'external-fragmentation') {
    return {
      capacity: '40',
      policy: random() < 0.5 ? 'first-fit' : 'best-fit',
      rows: [
        { id: 'r1', op: 'alloc', blockId: 'A', size: '6' },
        { id: 'r2', op: 'alloc', blockId: 'B', size: '8' },
        { id: 'r3', op: 'alloc', blockId: 'C', size: '6' },
        { id: 'r4', op: 'alloc', blockId: 'D', size: '8' },
        { id: 'r5', op: 'free', blockId: 'A', size: '' },
        { id: 'r6', op: 'free', blockId: 'C', size: '' },
        { id: 'r7', op: 'alloc', blockId: 'E', size: '10' },
      ],
    };
  }
  if (scenario === 'coalesce') {
    return {
      capacity: '48',
      policy: random() < 0.5 ? 'first-fit' : 'best-fit',
      rows: [
        { id: 'r1', op: 'alloc', blockId: 'A', size: '8' },
        { id: 'r2', op: 'alloc', blockId: 'B', size: '8' },
        { id: 'r3', op: 'alloc', blockId: 'C', size: '8' },
        { id: 'r4', op: 'free', blockId: 'B', size: '' },
        { id: 'r5', op: 'free', blockId: 'A', size: '' },
        { id: 'r6', op: 'alloc', blockId: 'D', size: '14' },
      ],
    };
  }
  if (scenario === 'first-vs-best') {
    return {
      capacity: '64',
      policy: 'first-fit',
      rows: [
        { id: 'r1', op: 'alloc', blockId: 'A', size: '12' },
        { id: 'r2', op: 'alloc', blockId: 'B', size: '16' },
        { id: 'r3', op: 'alloc', blockId: 'C', size: '10' },
        { id: 'r4', op: 'alloc', blockId: 'D', size: '12' },
        { id: 'r5', op: 'alloc', blockId: 'E', size: '4' },
        { id: 'r6', op: 'free', blockId: 'B', size: '' },
        { id: 'r7', op: 'free', blockId: 'D', size: '' },
        { id: 'r8', op: 'alloc', blockId: 'F', size: '8' },
      ],
    };
  }
  const capacity = randomInt(random, 32, 64);
  const rows: FreeListOperationRow[] = [];
  const live: string[] = [];
  let sequence = 0;
  for (let index = 0; index < 8; index += 1) {
    sequence += 1;
    const id = String.fromCharCode(64 + sequence);
    if (live.length >= 3 && random() < 0.4) {
      const victim = live.splice(randomInt(random, 0, live.length - 1), 1)[0]!;
      rows.push({ id: rowId(index), op: 'free', blockId: victim, size: '' });
    } else {
      const size = randomInt(random, 4, 14);
      live.push(id);
      rows.push({ id: rowId(index), op: 'alloc', blockId: id, size: String(size) });
    }
  }
  if (!live.length) {
    rows.push({ id: rowId(rows.length), op: 'alloc', blockId: 'A', size: '8' });
  }
  return { capacity: String(capacity), policy: random() < 0.5 ? 'first-fit' : 'best-fit', rows };
}
