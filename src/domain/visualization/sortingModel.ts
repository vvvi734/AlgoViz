import type { TraceState } from '../trace/types';
import type {
  SortingAlgorithm,
  SortingBufferWrite,
  SortingOperation,
  SortingRange,
  SortingSnapshot,
} from '../trace/schema';

export type SortingCellMark =
  | 'sorted'
  | 'candidate'
  | 'compare'
  | 'key-origin'
  | 'shift-source'
  | 'shift-target'
  | 'placed'
  | 'lane'
  | 'swap'
  | 'range'
  | 'range-start'
  | 'range-end'
  | 'pivot'
  | 'final'
  | 'merged'
  | 'left'
  | 'right'
  | 'buffer-source'
  | 'write-target';

export interface SortingCellVisual {
  id: string;
  index: number;
  value: number;
  height: number;
  marks: SortingCellMark[];
}

export type SortingPhase =
  | 'init'
  | 'range'
  | 'compare'
  | 'candidate'
  | 'move'
  | 'place'
  | 'gap'
  | 'split'
  | 'merge'
  | 'buffer'
  | 'writeback'
  | 'done';

export interface SortingVisualModel {
  kind: 'sorting';
  algorithm: SortingAlgorithm;
  operation: SortingOperation;
  phase: SortingPhase;
  round: number;
  sortedFrom: number;
  total: number;
  candidate: number | null;
  compare: number | null;
  key: { value: number; origin: number } | null;
  gap: number | null;
  gapSequence: number[];
  lane: number | null;
  shifted: { from: number; to: number } | null;
  swapped: [number, number] | null;
  insertedAt: number | null;
  result: 'sorted' | 'empty' | null;
  range: SortingRange | null;
  pivot: number | null;
  boundary: number | null;
  split: number | null;
  left: number | null;
  right: number | null;
  buffer: number[];
  bufferWrite: SortingBufferWrite | null;
  writeAt: number | null;
  finalized: number[];
  mergedRanges: SortingRange[];
  cells: SortingCellVisual[];
  sortedCount: number;
  unsortedCount: number;
  empty: boolean;
}

function phaseOf(operation: SortingOperation): SortingPhase {
  switch (operation) {
    case 'init': return 'init';
    case 'select-start': return 'compare';
    case 'select-compare': return 'compare';
    case 'select-candidate': return 'candidate';
    case 'select-swap': return 'move';
    case 'select-done': return 'place';
    case 'insert-key': return 'compare';
    case 'insert-compare': return 'compare';
    case 'insert-shift': return 'move';
    case 'insert-place': return 'place';
    case 'gap-change': return 'gap';
    case 'shell-compare': return 'compare';
    case 'shell-shift': return 'move';
    case 'shell-place': return 'place';
    case 'gap-done': return 'gap';
    case 'quick-range': return 'range';
    case 'quick-compare': return 'compare';
    case 'quick-swap': return 'move';
    case 'quick-place': return 'place';
    case 'quick-return': return 'place';
    case 'merge-range': return 'split';
    case 'merge-split': return 'split';
    case 'merge-return': return 'place';
    case 'merge-start': return 'merge';
    case 'merge-compare': return 'compare';
    case 'merge-write': return 'buffer';
    case 'merge-copy': return 'buffer';
    case 'merge-writeback': return 'writeback';
    case 'merge-range-done': return 'place';
    case 'done': return 'done';
    default: return 'init';
  }
}

function heightOf(value: number, maxAbs: number): number {
  return Math.max(14, Math.round((Math.abs(value) / maxAbs) * 165));
}

function inRange(index: number, range: SortingRange | null): boolean {
  return range !== null && index >= range.low && index <= range.high;
}

/**
 * Pure sorting model. It accepts only a snapshot whose `elements` match the
 * frame's real `state.values`; a stale or mismatched array becomes `null`
 * instead of a visually plausible lie.
 */
export function buildSortingModel(
  snapshot: SortingSnapshot,
  state: TraceState,
): SortingVisualModel | null {
  if (state.type !== 'array' || !Array.isArray(state.values)) return null;
  if (state.values.length !== snapshot.elements.length) return null;
  for (let index = 0; index < snapshot.elements.length; index += 1) {
    if (state.values[index] !== snapshot.elements[index]!.value) return null;
  }

  const maxAbs = Math.max(1, ...snapshot.elements.map((element) => Math.abs(element.value)));
  // S1 snapshots predate the S2 fields. Normalize missing optional metadata
  // here as well as in the schema so callers that construct a typed snapshot
  // directly still get the same visible state as a parsed trace.
  const range = snapshot.range ?? null;
  const pivot = snapshot.pivot ?? null;
  const boundary = snapshot.boundary ?? null;
  const split = snapshot.split ?? null;
  const left = snapshot.left ?? null;
  const right = snapshot.right ?? null;
  const buffer = snapshot.buffer ?? [];
  const bufferWrite = snapshot.bufferWrite ?? null;
  const writeAt = snapshot.writeAt ?? null;
  const finalized = snapshot.finalized ?? [];
  const mergedRanges = snapshot.mergedRanges ?? [];
  const cells: SortingCellVisual[] = snapshot.elements.map((element, index) => {
    const marks: SortingCellMark[] = [];
    if (index < snapshot.sortedFrom) marks.push('sorted');
    if (snapshot.candidate === index) marks.push('candidate');
    if (snapshot.compare === index) marks.push('compare');
    if (snapshot.swapped && snapshot.swapped.includes(index)) marks.push('swap');
    if (snapshot.key?.origin === index && snapshot.operation !== 'insert-place' && snapshot.operation !== 'shell-place') {
      marks.push('key-origin');
    }
    if (snapshot.shifted?.from === index) marks.push('shift-source');
    if (snapshot.shifted?.to === index) marks.push('shift-target');
    if (snapshot.insertedAt === index) marks.push('placed');
    if (
      snapshot.algorithm === 'shell' &&
      snapshot.gap !== null &&
      snapshot.lane !== null &&
      index % snapshot.gap === snapshot.lane &&
      index !== snapshot.compare &&
      index !== snapshot.insertedAt
    ) {
      marks.push('lane');
    }
    if (inRange(index, range)) {
      marks.push('range');
      if (range?.low === index) marks.push('range-start');
      if (range?.high === index) marks.push('range-end');
    }
    if (pivot === index) marks.push('pivot');
    if (finalized.includes(index)) marks.push('final');
    if (mergedRanges.some((merged) => inRange(index, merged))) marks.push('merged');
    if (left === index) marks.push('left');
    if (right === index) marks.push('right');
    if (bufferWrite?.source === index) marks.push('buffer-source');
    if (writeAt === index) marks.push('write-target');
    return {
      id: element.id,
      index,
      value: element.value,
      height: heightOf(element.value, maxAbs),
      marks,
    };
  });

  let sortedCount = snapshot.sortedFrom;
  if (snapshot.algorithm === 'quick') {
    sortedCount = finalized.length;
  } else if (snapshot.algorithm === 'merge') {
    const covered = new Set<number>();
    for (const merged of mergedRanges) {
      for (let index = merged.low; index <= merged.high; index += 1) covered.add(index);
    }
    sortedCount = covered.size;
  }

  return {
    kind: 'sorting',
    algorithm: snapshot.algorithm,
    operation: snapshot.operation,
    phase: phaseOf(snapshot.operation),
    round: snapshot.round,
    sortedFrom: snapshot.sortedFrom,
    total: snapshot.elements.length,
    candidate: snapshot.candidate,
    compare: snapshot.compare,
    key: snapshot.key,
    gap: snapshot.gap,
    gapSequence: [...snapshot.gapSequence],
    lane: snapshot.lane,
    shifted: snapshot.shifted,
    swapped: snapshot.swapped,
    insertedAt: snapshot.insertedAt,
    result: snapshot.result,
    range,
    pivot,
    boundary,
    split,
    left,
    right,
    buffer: [...buffer],
    bufferWrite,
    writeAt,
    finalized: [...finalized],
    mergedRanges: mergedRanges.map((merged) => ({ ...merged })),
    cells,
    sortedCount,
    unsortedCount: snapshot.elements.length - sortedCount,
    empty: snapshot.elements.length === 0,
  };
}
