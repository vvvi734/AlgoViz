import type { TraceState } from '../trace/types';
import type {
  SortingAlgorithm,
  SortingOperation,
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
  | 'swap';

export interface SortingCellVisual {
  id: string;
  index: number;
  value: number;
  height: number;
  marks: SortingCellMark[];
}

export type SortingPhase = 'init' | 'compare' | 'candidate' | 'move' | 'place' | 'gap' | 'done';

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
    case 'done': return 'done';
    default: return 'init';
  }
}

function heightOf(value: number, maxAbs: number): number {
  return Math.max(14, Math.round((Math.abs(value) / maxAbs) * 165));
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
    return {
      id: element.id,
      index,
      value: element.value,
      height: heightOf(element.value, maxAbs),
      marks,
    };
  });

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
    cells,
    sortedCount: snapshot.sortedFrom,
    unsortedCount: snapshot.elements.length - snapshot.sortedFrom,
    empty: snapshot.elements.length === 0,
  };
}
