import type { GcMode } from '../trace/gcSchema';
import type { GuidedInputError, GuidedRandomScenario } from './guidedInput';

/**
 * TEXTBOOK-08: editable object graph shared by Mark-Sweep and Compaction.
 * Roots and references use object ids only; addresses are assigned by the
 * program, so a student can never accidentally test a stale raw pointer.
 */
export const GARBAGE_COLLECTION_GUIDED_INPUT = 'garbage-collection' as const;
export type GarbageCollectionGuidedInputAlgorithm = typeof GARBAGE_COLLECTION_GUIDED_INPUT;

export interface GarbageObjectRow {
  id: string;
  objectId: string;
  size: string;
  refs: string;
}

export interface GarbageInputDraft {
  mode: GcMode;
  capacity: string;
  roots: string;
  objects: GarbageObjectRow[];
}

export const GARBAGE_LIMITS = {
  MIN_CAPACITY: 16,
  MAX_CAPACITY: 128,
  DEFAULT_CAPACITY: 96,
  MAX_OBJECTS: 8,
  MAX_REFS: 16,
  MAX_ROOTS: 4,
} as const;

export const GARBAGE_RANDOM_SCENARIOS: readonly GuidedRandomScenario[] = [
  { id: 'all-reachable', label: ['所有对象可达', 'All objects reachable'] },
  { id: 'partial', label: ['部分对象不可达', 'Some objects unreachable'] },
  { id: 'cycles', label: ['环形垃圾', 'Cyclic garbage'] },
  { id: 'multi-root', label: ['多个根集合', 'Multiple roots'] },
  { id: 'scattered', label: ['清除后分散空洞', 'Scattered holes'] },
  { id: 'compact', label: ['紧缩后连续空间', 'Compacted free space'] },
  { id: 'random', label: ['随机对象图', 'Random object graph'] },
];

function rowId(index: number): string {
  return `r${index + 1}`;
}

export function emptyGarbageDraft(): GarbageInputDraft {
  return {
    mode: 'mark-sweep',
    capacity: '96',
    roots: 'A',
    objects: [
      { id: 'r1', objectId: 'A', size: '12', refs: 'B, C' },
      { id: 'r2', objectId: 'E', size: '8', refs: 'F' },
      { id: 'r3', objectId: 'B', size: '10', refs: 'D' },
      { id: 'r4', objectId: 'F', size: '8', refs: 'E' },
      { id: 'r5', objectId: 'C', size: '8', refs: 'B' },
      { id: 'r6', objectId: 'G', size: '6', refs: '' },
      { id: 'r7', objectId: 'D', size: '12', refs: '' },
      { id: 'r8', objectId: 'H', size: '8', refs: 'A' },
    ],
  };
}

export function garbageDraftFromInput(input: unknown): GarbageInputDraft {
  if (typeof input !== 'object' || input === null) return emptyGarbageDraft();
  const raw = input as Record<string, unknown>;
  const mode: GcMode = raw.mode === 'compaction' ? 'compaction' : 'mark-sweep';
  const capacity = typeof raw.capacity === 'number' ? String(raw.capacity) : '96';
  const roots = Array.isArray(raw.roots) ? raw.roots.map(String).join(', ') : 'A';
  const objects = Array.isArray(raw.objects) ? raw.objects : [];
  const rows: GarbageObjectRow[] = [];
  objects.forEach((item, index) => {
    if (typeof item !== 'object' || item === null) return;
    const object = item as Record<string, unknown>;
    rows.push({
      id: rowId(index),
      objectId: typeof object.id === 'string' ? object.id : '',
      size: typeof object.size === 'number' ? String(object.size) : '',
      refs: Array.isArray(object.refs) ? object.refs.map(String).join(', ') : '',
    });
  });
  if (!rows.length) return emptyGarbageDraft();
  return { mode, capacity, roots, objects: rows };
}

export function nextGarbageRow(rows: GarbageObjectRow[]): GarbageObjectRow {
  const used = new Set(rows.map((row) => row.objectId));
  let code = 65;
  while (used.has(String.fromCharCode(code))) code += 1;
  let editorSequence = rows.length + 1;
  while (rows.some((row) => row.id === `r${editorSequence}`)) editorSequence += 1;
  return { id: `r${editorSequence}`, objectId: String.fromCharCode(code), size: '8', refs: '' };
}

function splitTokens(value: string): string[] {
  return value
    .split(/[,，\s]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function buildGarbageInput(draft: GarbageInputDraft):
  | { ok: true; input: unknown }
  | { ok: false; error: GuidedInputError } {
  const capacity = Number(draft.capacity);
  if (
    !Number.isInteger(capacity) ||
    capacity < GARBAGE_LIMITS.MIN_CAPACITY ||
    capacity > GARBAGE_LIMITS.MAX_CAPACITY
  ) {
    return { ok: false, error: { key: 'gcErrorCapacity' } };
  }
  if (!draft.objects.length || draft.objects.length > GARBAGE_LIMITS.MAX_OBJECTS) {
    return { ok: false, error: { key: 'gcErrorObjects', max: GARBAGE_LIMITS.MAX_OBJECTS } };
  }
  const ids = new Set<string>();
  const objects: Array<{ id: string; size: number; refs: string[] }> = [];
  let totalSize = 0;
  let totalRefs = 0;
  for (let index = 0; index < draft.objects.length; index += 1) {
    const row = draft.objects[index]!;
    const objectId = row.objectId.trim();
    if (!/^[A-Za-z0-9]{1,3}$/.test(objectId)) {
      return { ok: false, error: { key: 'gcErrorObjectId', row: index + 1 } };
    }
    if (ids.has(objectId)) {
      return { ok: false, error: { key: 'gcErrorObjectId', row: index + 1 } };
    }
    const size = Number(row.size);
    if (!Number.isInteger(size) || size <= 0) {
      return { ok: false, error: { key: 'gcErrorObjectSize', row: index + 1 } };
    }
    totalSize += size;
    if (totalSize > capacity) {
      return { ok: false, error: { key: 'gcErrorCapacity' } };
    }
    const refs = splitTokens(row.refs);
    totalRefs += refs.length;
    if (totalRefs > GARBAGE_LIMITS.MAX_REFS) {
      return { ok: false, error: { key: 'gcErrorRefs' } };
    }
    ids.add(objectId);
    objects.push({ id: objectId, size, refs });
  }
  for (let index = 0; index < objects.length; index += 1) {
    for (const target of objects[index]!.refs) {
      if (!ids.has(target)) {
        return { ok: false, error: { key: 'gcErrorRefs', row: index + 1 } };
      }
    }
  }
  const roots = splitTokens(draft.roots);
  if (roots.length > GARBAGE_LIMITS.MAX_ROOTS) {
    return { ok: false, error: { key: 'gcErrorRootLimit', max: GARBAGE_LIMITS.MAX_ROOTS } };
  }
  for (const root of roots) {
    if (!ids.has(root)) {
      return { ok: false, error: { key: 'gcErrorRoots' } };
    }
  }
  return { ok: true, input: { mode: draft.mode, capacity, roots, objects } };
}

function randomInt(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

function sizedObjects(
  definitions: Array<[id: string, refs: string]>,
  random: () => number,
): GarbageObjectRow[] {
  return definitions.map(([objectId, refs], index) => ({
    id: rowId(index),
    objectId,
    size: String(randomInt(random, 5, 10)),
    refs,
  }));
}

export function randomGarbageDraft(scenario: string, random: () => number = Math.random): GarbageInputDraft {
  if (scenario === 'all-reachable') {
    return {
      mode: 'mark-sweep',
      capacity: '80',
      roots: 'A',
      objects: sizedObjects(
        [
          ['A', 'B'],
          ['B', 'C'],
          ['C', 'D'],
          ['D', 'A'],
        ],
        random,
      ),
    };
  }
  if (scenario === 'cycles') {
    return {
      mode: 'mark-sweep',
      capacity: '96',
      roots: 'A',
      objects: sizedObjects(
        [
          ['A', 'B'],
          ['E', 'F'],
          ['B', 'A'],
          ['F', 'E'],
          ['G', 'E'],
          ['H', 'A'],
        ],
        random,
      ),
    };
  }
  if (scenario === 'multi-root') {
    return {
      mode: 'mark-sweep',
      capacity: '96',
      roots: 'A, C',
      objects: sizedObjects(
        [
          ['A', 'B'],
          ['E', 'F'],
          ['B', ''],
          ['F', 'E'],
          ['C', 'D'],
          ['D', ''],
          ['G', ''],
          ['H', 'C'],
        ],
        random,
      ),
    };
  }
  if (scenario === 'scattered') {
    return {
      mode: 'mark-sweep',
      capacity: '96',
      roots: 'A',
      objects: sizedObjects(
        [
          ['A', 'B, C'],
          ['E', 'F'],
          ['B', 'D'],
          ['F', 'E'],
          ['C', 'B'],
          ['G', ''],
          ['D', ''],
          ['H', 'A'],
        ],
        random,
      ),
    };
  }
  if (scenario === 'compact') {
    const draft = emptyGarbageDraft();
    return { ...draft, mode: 'compaction' };
  }
  if (scenario === 'partial') {
    return { ...emptyGarbageDraft(), mode: random() < 0.5 ? 'mark-sweep' : 'compaction' };
  }
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const definitions: Array<[string, string]> = letters.map((letter) => {
    const refs: string[] = [];
    const candidates = letters.filter((candidate) => candidate !== letter);
    const count = randomInt(random, 0, 2);
    for (let index = 0; index < count; index += 1) {
      const target = candidates[randomInt(random, 0, candidates.length - 1)]!;
      if (!refs.includes(target)) refs.push(target);
    }
    return [letter, refs.join(', ')];
  });
  const roots = definitions
    .filter(() => random() < 0.3)
    .slice(0, 3)
    .map(([id]) => id);
  return {
    mode: random() < 0.5 ? 'mark-sweep' : 'compaction',
    capacity: '96',
    roots: roots.length ? roots.join(', ') : 'A',
    objects: sizedObjects(definitions, random),
  };
}
