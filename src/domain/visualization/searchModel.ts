import type { TraceState } from '../trace/types';
import type {
  SearchAlgorithm,
  SearchOperation,
  SearchPhase,
  SearchRange,
  SearchSnapshot,
} from '../trace/schema';

export type SearchCellMark =
  | 'checked'
  | 'current'
  | 'pending'
  | 'found'
  | 'excluded'
  | 'range'
  | 'range-start'
  | 'range-end'
  | 'left'
  | 'right'
  | 'mid'
  | 'result';

export interface SearchCellVisual {
  id: string;
  index: number;
  value: number;
  height: number;
  marks: SearchCellMark[];
}

/**
 * Pure search model. Every visible state comes from the current search snapshot;
 * binary excluded cells are derived from the real [left, right] range, not from
 * a frame counter. A stale array becomes `null` instead of a plausible lie.
 */
export interface SearchVisualModel {
  kind: 'search';
  algorithm: SearchAlgorithm;
  operation: SearchOperation;
  phase: SearchPhase;
  cells: SearchCellVisual[];
  total: number;
  target: number;
  index: number | null;
  left: number | null;
  right: number | null;
  mid: number | null;
  range: SearchRange | null;
  checkedCount: number;
  excludedCount: number;
  remainingCount: number;
  result: number | null;
  found: boolean | null;
  reason: 'unsorted' | null;
}

function heightOf(value: number, maxAbs: number): number {
  return Math.max(14, Math.round((Math.abs(value) / maxAbs) * 165));
}

function inRange(index: number, range: SearchRange | null): boolean {
  return range !== null && index >= range.low && index <= range.high;
}

function cellMarks(snapshot: SearchSnapshot, index: number): SearchCellMark[] {
  const marks: SearchCellMark[] = [];
  const checked = snapshot.checked.includes(index);
  if (checked) marks.push('checked');

  if (snapshot.algorithm === 'linear') {
    if (snapshot.operation === 'found') {
      if (snapshot.result === index) marks.push('found');
    } else if (snapshot.index === index) {
      marks.push('current');
    } else if (!checked) {
      marks.push('pending');
    }
    return marks;
  }

  if (snapshot.operation === 'invalid') return marks;

  const reason = snapshot.range;
  const live = inRange(index, reason);
  if (live) {
    marks.push('range');
    if (reason?.low === index) marks.push('range-start');
    if (reason?.high === index) marks.push('range-end');
  } else if (reason !== null || snapshot.operation === 'binary-not-found') {
    marks.push('excluded');
  }

  if (snapshot.left === index || snapshot.right === index) {
    // A boundary marker is only meaningful while it points inside the array.
    if (index >= 0 && index < snapshot.elements.length) {
      if (snapshot.left === index) marks.push('left');
      if (snapshot.right === index) marks.push('right');
    }
  }
  if (live && snapshot.mid === index) marks.push('mid');
  if (snapshot.operation === 'binary-found' && snapshot.result === index) marks.push('found');
  if (live && snapshot.mid !== index && snapshot.operation !== 'binary-found') marks.push('pending');
  return marks;
}

export function buildSearchModel(
  snapshot: SearchSnapshot,
  state: TraceState,
): SearchVisualModel | null {
  if (state.type !== 'array' || !Array.isArray(state.values)) return null;
  if (state.values.length !== snapshot.elements.length) return null;
  for (let index = 0; index < snapshot.elements.length; index += 1) {
    if (state.values[index] !== snapshot.elements[index]!.value) return null;
  }

  const maxAbs = Math.max(1, ...snapshot.elements.map((element) => Math.abs(element.value)));
  const n = snapshot.elements.length;
  const cells: SearchCellVisual[] = snapshot.elements.map((element, index) => ({
    id: element.id,
    index,
    value: element.value,
    height: heightOf(element.value, maxAbs),
    marks: cellMarks(snapshot, index),
  }));

  let excludedCount = 0;
  if (snapshot.algorithm === 'binary') {
    if (snapshot.operation === 'binary-not-found') {
      excludedCount = n;
    } else if (snapshot.range !== null) {
      excludedCount = n - (snapshot.range.high - snapshot.range.low + 1);
    }
  }
  const remainingCount =
    snapshot.algorithm === 'binary'
      ? snapshot.operation === 'binary-not-found'
        ? 0
        : snapshot.range
          ? snapshot.range.high - snapshot.range.low + 1
          : 0
      : Math.max(0, n - snapshot.checked.length - (snapshot.index === null ? 0 : 1));

  return {
    kind: 'search',
    algorithm: snapshot.algorithm,
    operation: snapshot.operation,
    phase: snapshot.phase,
    cells,
    total: n,
    target: snapshot.target,
    index: snapshot.index,
    left: snapshot.left,
    right: snapshot.right,
    mid: snapshot.mid,
    range: snapshot.range,
    checkedCount: snapshot.checked.length,
    excludedCount,
    remainingCount,
    result: snapshot.result,
    found: snapshot.found,
    reason: snapshot.reason,
  };
}
