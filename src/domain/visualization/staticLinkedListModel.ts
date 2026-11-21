import type { StaticLinkedSnapshot } from '../trace/schema';

/**
 * TEXTBOOK-02 pure model for the static linked list. The array and the logical
 * chain come from two recorded facts in the trace: slots/cursors, and the
 * `logical`/`freeList` chains the Python program actually walked. The model
 * never derives chain order from the visual array order.
 */

export interface StaticLinkedSlotModel {
  index: number;
  data: unknown;
  cursor: number | null;
  role: 'head' | 'live' | 'free-head' | 'free' | 'allocated' | 'idle';
  active: boolean;
  changed: boolean;
}

export interface StaticLinkedNodeModel {
  index: number;
  value: unknown;
  cursor: number | null;
}

export interface StaticLinkedListVisualModel {
  kind: 'static-linked-list';
  operation: StaticLinkedSnapshot['operation'];
  action: StaticLinkedSnapshot['action'];
  phase: StaticLinkedSnapshot['phase'];
  capacity: number;
  head: number | null;
  freeHead: number | null;
  slots: StaticLinkedSlotModel[];
  logical: StaticLinkedNodeModel[];
  freeList: StaticLinkedNodeModel[];
  activeIndex?: number;
  allocatedIndex?: number;
  predecessorIndex?: number | null;
  removedIndex?: number;
  removedValue?: unknown;
  visited: number[];
  change?: StaticLinkedSnapshot['change'];
  error?: string;
}

export function buildStaticLinkedListModel(
  snapshot: StaticLinkedSnapshot,
): StaticLinkedListVisualModel {
  const logicalSet = new Set(snapshot.logical);
  const freeSet = new Set(snapshot.freeList);
  const changedIndex = snapshot.change?.index;
  return {
    kind: 'static-linked-list',
    operation: snapshot.operation,
    action: snapshot.action,
    phase: snapshot.phase,
    capacity: snapshot.capacity,
    head: snapshot.head,
    freeHead: snapshot.freeHead,
    slots: snapshot.slots.map((slot) => ({
      index: slot.index,
      data: slot.data,
      cursor: slot.cursor,
      role:
        slot.index === snapshot.head ? 'head' :
        logicalSet.has(slot.index) ? 'live' :
        slot.index === snapshot.freeHead ? 'free-head' :
        freeSet.has(slot.index) ? 'free' :
        slot.data !== null ? 'allocated' : 'idle',
      active: snapshot.focusIndex === slot.index,
      changed: changedIndex === slot.index,
    })),
    logical: snapshot.logical.map((index) => ({
      index,
      value: snapshot.slots[index]?.data,
      cursor: snapshot.slots[index]?.cursor ?? null,
    })),
    freeList: snapshot.freeList.map((index) => ({
      index,
      value: snapshot.slots[index]?.data,
      cursor: snapshot.slots[index]?.cursor ?? null,
    })),
    ...(snapshot.focusIndex !== undefined ? { activeIndex: snapshot.focusIndex } : {}),
    ...(snapshot.allocatedIndex !== undefined ? { allocatedIndex: snapshot.allocatedIndex } : {}),
    ...(snapshot.predecessorIndex !== undefined ? { predecessorIndex: snapshot.predecessorIndex } : {}),
    ...(snapshot.removedIndex !== undefined ? { removedIndex: snapshot.removedIndex } : {}),
    ...(snapshot.removedValue !== undefined ? { removedValue: snapshot.removedValue } : {}),
    visited: snapshot.visited ?? [],
    ...(snapshot.change ? { change: snapshot.change } : {}),
    ...(snapshot.error ? { error: snapshot.error } : {}),
  };
}
