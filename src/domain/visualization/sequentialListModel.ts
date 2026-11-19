import type {
  SequentialListAction,
  SequentialListChange,
  SequentialListError,
  SequentialListOperation,
  SequentialListPhase,
  SequentialListSnapshot,
} from '../trace/schema';

/**
 * Pure model for the L1B fixed-capacity sequential list. The physical slots
 * come from the validated snapshot; the model only derives display flags. A
 * slot with index >= length is free even when an intermediate frame still
 * holds a copied value there: it must never be labelled as a live element.
 */
export interface SequentialListSlotModel {
  index: number;
  value: unknown;
  occupied: boolean;
  free: boolean;
  /** Free slot that temporarily holds a real copied value in an intermediate frame. */
  temporary: boolean;
  focus: boolean;
  source: boolean;
  target: boolean;
  changed: boolean;
  checked: boolean;
  removed: boolean;
}

export interface SequentialListVisualModel {
  kind: 'sequential-list';
  operation: SequentialListOperation;
  action: SequentialListAction;
  phase: SequentialListPhase;
  capacity: number;
  length: number;
  slots: SequentialListSlotModel[];
  requestedIndex?: number;
  focusIndex?: number;
  sourceIndex?: number;
  targetIndex?: number;
  change?: SequentialListChange;
  searchValue?: unknown;
  result?: unknown;
  found?: boolean;
  foundIndex?: number;
  removedIndex?: number;
  removedValue?: unknown;
  error?: SequentialListError;
  preset?: string;
  checkedCount: number;
  empty: boolean;
  full: boolean;
}

export function buildSequentialListModel(snapshot: SequentialListSnapshot): SequentialListVisualModel {
  const checked = new Set(snapshot.checked ?? []);
  const changeIndex = snapshot.change?.index;
  const slots: SequentialListSlotModel[] = snapshot.slots.map((slot) => {
    const occupied = slot.index < snapshot.length;
    return {
      index: slot.index,
      value: slot.value,
      occupied,
      free: !occupied,
      temporary: !occupied && slot.value !== null,
      focus: snapshot.focusIndex === slot.index,
      source: snapshot.sourceIndex === slot.index,
      target: snapshot.targetIndex === slot.index,
      changed: changeIndex === slot.index,
      checked: checked.has(slot.index),
      removed: snapshot.action === 'save' && snapshot.removedIndex === slot.index,
    };
  });

  return {
    kind: 'sequential-list',
    operation: snapshot.operation,
    action: snapshot.action,
    phase: snapshot.phase,
    capacity: snapshot.capacity,
    length: snapshot.length,
    slots,
    ...(snapshot.requestedIndex !== undefined ? { requestedIndex: snapshot.requestedIndex } : {}),
    ...(snapshot.focusIndex !== undefined ? { focusIndex: snapshot.focusIndex } : {}),
    ...(snapshot.sourceIndex !== undefined ? { sourceIndex: snapshot.sourceIndex } : {}),
    ...(snapshot.targetIndex !== undefined ? { targetIndex: snapshot.targetIndex } : {}),
    ...(snapshot.change ? { change: snapshot.change } : {}),
    ...(snapshot.searchValue !== undefined ? { searchValue: snapshot.searchValue } : {}),
    ...(snapshot.result !== undefined ? { result: snapshot.result } : {}),
    ...(snapshot.found !== undefined ? { found: snapshot.found } : {}),
    ...(snapshot.foundIndex !== undefined ? { foundIndex: snapshot.foundIndex } : {}),
    ...(snapshot.removedIndex !== undefined ? { removedIndex: snapshot.removedIndex } : {}),
    ...(snapshot.removedValue !== undefined ? { removedValue: snapshot.removedValue } : {}),
    ...(snapshot.error ? { error: snapshot.error } : {}),
    ...(snapshot.preset ? { preset: snapshot.preset } : {}),
    checkedCount: checked.size,
    empty: snapshot.length === 0,
    full: snapshot.length === snapshot.capacity,
  };
}
