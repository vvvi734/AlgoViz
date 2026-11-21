import type { GuidedInputError, GuidedRandomScenario } from './guidedInput';

/**
 * TEXTBOOK-08: operation draft for the buddy-system course.
 * Capacity is a power of two between 8 and 128. Requests may be any positive
 * size; the executable program rounds each one up to a power-of-two block level
 * and reports the resulting internal fragmentation.
 */
export const BUDDY_GUIDED_INPUT = 'buddy-system' as const;
export type BuddyGuidedInputAlgorithm = typeof BUDDY_GUIDED_INPUT;

export interface BuddyOperationRow {
  id: string;
  op: 'alloc' | 'free';
  blockId: string;
  size: string;
}

export interface BuddyInputDraft {
  capacity: string;
  rows: BuddyOperationRow[];
}

export const BUDDY_LIMITS = {
  MIN_CAPACITY: 8,
  MAX_CAPACITY: 128,
  DEFAULT_CAPACITY: 32,
  MAX_OPERATIONS: 12,
} as const;

export const BUDDY_RANDOM_SCENARIOS: readonly GuidedRandomScenario[] = [
  { id: 'repeated-split', label: ['一次分配多次分裂', 'Repeated splits'] },
  { id: 'buddy-busy', label: ['相邻但不是伙伴', 'Adjacent but not buddies'] },
  { id: 'merge-one', label: ['释放后合并一层', 'Merge one level'] },
  { id: 'merge-multi', label: ['连续向上合并', 'Repeated upward merge'] },
  { id: 'insufficient', label: ['内存不足', 'Allocation failure'] },
];

function rowId(index: number): string {
  return `r${index + 1}`;
}

export function emptyBuddyDraft(): BuddyInputDraft {
  return {
    capacity: '32',
    rows: [
      { id: 'r1', op: 'alloc', blockId: 'A', size: '3' },
      { id: 'r2', op: 'alloc', blockId: 'B', size: '5' },
      { id: 'r3', op: 'alloc', blockId: 'C', size: '2' },
    ],
  };
}

export function buddyDraftFromInput(input: unknown): BuddyInputDraft {
  if (typeof input !== 'object' || input === null) return emptyBuddyDraft();
  const raw = input as Record<string, unknown>;
  const capacity = typeof raw.capacity === 'number' ? String(raw.capacity) : '32';
  const operations = Array.isArray(raw.operations) ? raw.operations : [];
  const rows: BuddyOperationRow[] = [];
  operations.forEach((item, index) => {
    if (typeof item !== 'object' || item === null) return;
    const operation = item as Record<string, unknown>;
    rows.push({
      id: rowId(index),
      op: operation.op === 'free' ? 'free' : 'alloc',
      blockId: typeof operation.id === 'string' ? operation.id : '',
      size: typeof operation.size === 'number' ? String(operation.size) : '',
    });
  });
  if (!rows.length) return emptyBuddyDraft();
  return { capacity, rows };
}

export function nextBuddyRow(rows: BuddyOperationRow[]): BuddyOperationRow {
  const used = new Set(rows.map((row) => row.id));
  let editorSequence = rows.length + 1;
  while (used.has(`r${editorSequence}`)) editorSequence += 1;
  const usedBlockIds = new Set(rows.map((row) => row.blockId.trim().toUpperCase()));
  let code = 65;
  while (usedBlockIds.has(String.fromCharCode(code))) code += 1;
  return {
    id: `r${editorSequence}`,
    op: 'alloc',
    blockId: code <= 90 ? String.fromCharCode(code) : '',
    size: '4',
  };
}

export function buildBuddyInput(draft: BuddyInputDraft):
  | { ok: true; input: unknown }
  | { ok: false; error: GuidedInputError } {
  const capacity = Number(draft.capacity);
  if (
    !Number.isInteger(capacity) ||
    capacity < BUDDY_LIMITS.MIN_CAPACITY ||
    capacity > BUDDY_LIMITS.MAX_CAPACITY ||
    (capacity & (capacity - 1)) !== 0
  ) {
    return { ok: false, error: { key: 'buddyErrorCapacity' } };
  }
  if (!draft.rows.length || draft.rows.length > BUDDY_LIMITS.MAX_OPERATIONS) {
    return { ok: false, error: { key: 'buddyErrorOperations', max: BUDDY_LIMITS.MAX_OPERATIONS } };
  }
  const usedIds = new Set<string>();
  const liveIds = new Set<string>();
  const operations: Array<{ op: 'alloc'; id: string; size: number } | { op: 'free'; id: string }> = [];
  for (let index = 0; index < draft.rows.length; index += 1) {
    const row = draft.rows[index]!;
    const blockId = row.blockId.trim();
    if (!/^[A-Za-z0-9]{1,3}$/.test(blockId)) {
      return { ok: false, error: { key: 'buddyErrorBlockId', row: index + 1 } };
    }
    if (row.op === 'alloc') {
      if (usedIds.has(blockId)) {
        return { ok: false, error: { key: 'buddyErrorBlockId', row: index + 1 } };
      }
      const size = Number(row.size);
      if (!Number.isInteger(size) || size <= 0 || size > capacity) {
        return { ok: false, error: { key: 'buddyErrorSize', row: index + 1 } };
      }
      usedIds.add(blockId);
      liveIds.add(blockId);
      operations.push({ op: 'alloc', id: blockId, size });
    } else {
      if (!liveIds.has(blockId)) {
        return { ok: false, error: { key: 'buddyErrorReleaseId', row: index + 1 } };
      }
      liveIds.delete(blockId);
      operations.push({ op: 'free', id: blockId });
    }
  }
  return { ok: true, input: { capacity, operations } };
}

export function randomBuddyDraft(scenario: string, _random: () => number = Math.random): BuddyInputDraft {
  if (scenario === 'buddy-busy') {
    return {
      capacity: '32',
      rows: [
        { id: 'r1', op: 'alloc', blockId: 'A', size: '4' },
        { id: 'r2', op: 'alloc', blockId: 'B', size: '8' },
        { id: 'r3', op: 'alloc', blockId: 'C', size: '4' },
        { id: 'r4', op: 'free', blockId: 'B', size: '' },
        { id: 'r5', op: 'free', blockId: 'A', size: '' },
        { id: 'r6', op: 'free', blockId: 'C', size: '' },
      ],
    };
  }
  if (scenario === 'merge-one') {
    return {
      capacity: '32',
      rows: [
        { id: 'r1', op: 'alloc', blockId: 'A', size: '4' },
        { id: 'r2', op: 'alloc', blockId: 'B', size: '4' },
        { id: 'r3', op: 'free', blockId: 'A', size: '' },
        { id: 'r4', op: 'free', blockId: 'B', size: '' },
      ],
    };
  }
  if (scenario === 'merge-multi') {
    return {
      capacity: '32',
      rows: [
        { id: 'r1', op: 'alloc', blockId: 'A', size: '2' },
        { id: 'r2', op: 'free', blockId: 'A', size: '' },
      ],
    };
  }
  if (scenario === 'insufficient') {
    return {
      capacity: '16',
      rows: [
        { id: 'r1', op: 'alloc', blockId: 'A', size: '8' },
        { id: 'r2', op: 'alloc', blockId: 'B', size: '8' },
        { id: 'r3', op: 'alloc', blockId: 'C', size: '8' },
      ],
    };
  }
  return {
    capacity: '32',
    rows: [
      { id: 'r1', op: 'alloc', blockId: 'A', size: '3' },
      { id: 'r2', op: 'alloc', blockId: 'B', size: '5' },
      { id: 'r3', op: 'alloc', blockId: 'C', size: '2' },
      { id: 'r4', op: 'free', blockId: 'B', size: '' },
      { id: 'r5', op: 'free', blockId: 'C', size: '' },
    ],
  };
}
