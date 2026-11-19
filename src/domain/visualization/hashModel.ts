import type { TraceState } from '../trace/types';
import type {
  HashAlgorithm,
  HashBucket,
  HashComparison,
  HashNode,
  HashOperation,
  HashPhase,
  HashResult,
  HashSnapshot,
  HashSlot,
  HashSlotState,
} from '../trace/schema';

export type HashNodeStatus = 'normal' | 'current' | 'previous' | 'found' | 'inserted' | 'duplicate';
export type HashNodePosition = 'only' | 'head' | 'middle' | 'tail';

export interface HashNodeVisual {
  id: string;
  key: number;
  nextId: string | null;
  position: HashNodePosition;
  status: HashNodeStatus;
}

export interface HashBucketVisual {
  index: number;
  headId: string | null;
  nodes: HashNodeVisual[];
  active: boolean;
}

export type HashSlotMark = 'empty' | 'occupied' | 'deleted' | 'current' | 'probe' | 'reused';

export interface HashSlotVisual {
  index: number;
  state: HashSlotState;
  key: number | null;
  id: string | null;
  marks: HashSlotMark[];
}

export interface HashRemovedVisual {
  id: string;
  key: number;
  position?: 'head' | 'middle' | 'tail';
  index?: number;
}

/**
 * Hash-table visual model. Chaining and probing intentionally share one model
 * but render different canvases: bucket rows with real next pointers vs.
 * tri-state slots with a real probe path.
 */
export interface HashVisualModel {
  kind: 'hash';
  algorithm: HashAlgorithm;
  operation: HashOperation;
  phase: HashPhase;
  tableSize: number;
  key: number | null;
  hashIndex: number | null;
  bucketIndex: number | null;
  currentNodeId: string | null;
  currentIndex: number | null;
  comparison: HashComparison | null;
  conflict: boolean | null;
  probePath: number[];
  reusedDeleted: boolean;
  result: HashResult | null;
  found: boolean | null;
  elementCount: number;
  loadFactor: number;
  empty: boolean;
  buckets: HashBucketVisual[];
  slots: HashSlotVisual[];
  removed: HashRemovedVisual | null;
}

function nodePosition(index: number, length: number): HashNodePosition {
  if (length === 1) return 'only';
  if (index === 0) return 'head';
  if (index === length - 1) return 'tail';
  return 'middle';
}

function buildBuckets(snapshot: HashSnapshot): HashBucketVisual[] {
  const nodes = new Map<string, HashNode>();
  snapshot.nodes.forEach((node) => nodes.set(node.id, node));
  return snapshot.buckets.map((bucket: HashBucket) => {
    const chain: HashNodeVisual[] = [];
    const seen = new Set<string>();
    let id = bucket.headId;
    while (id !== null && !seen.has(id)) {
      const node = nodes.get(id);
      if (!node) break;
      seen.add(id);
      let status: HashNodeStatus = 'normal';
      if (snapshot.currentNodeId === node.id) {
        status = snapshot.operation === 'insert'
          ? 'inserted'
          : snapshot.operation === 'duplicate'
            ? 'duplicate'
            : snapshot.operation === 'found'
              ? 'found'
              : 'current';
      } else if (snapshot.previousNodeId === node.id) {
        status = 'previous';
      }
      chain.push({
        id: node.id,
        key: node.key,
        nextId: node.nextId,
        position: 'only',
        status,
      });
      id = node.nextId;
    }
    for (let index = 0; index < chain.length; index += 1) {
      chain[index]!.position = nodePosition(index, chain.length);
    }
    return {
      index: bucket.index,
      headId: bucket.headId,
      nodes: chain,
      active: snapshot.bucketIndex === bucket.index,
    };
  });
}

function buildSlots(snapshot: HashSnapshot): HashSlotVisual[] {
  const path = new Set(snapshot.probePath);
  return snapshot.slots.map((slot: HashSlot) => {
    const marks: HashSlotMark[] = [slot.state];
    if (path.has(slot.index)) marks.push('probe');
    if (snapshot.currentIndex === slot.index) marks.push('current');
    if (snapshot.reusedDeleted && snapshot.currentIndex === slot.index && slot.state === 'occupied') {
      marks.push('reused');
    }
    return { index: slot.index, state: slot.state, key: slot.key, id: slot.id, marks };
  });
}

function buildRemoved(snapshot: HashSnapshot): HashRemovedVisual | null {
  const removed = snapshot.removed;
  if (removed === null) return null;
  if (removed.kind === 'node') {
    return { id: removed.id, key: removed.key, position: removed.position };
  }
  return { id: removed.id, key: removed.key, index: removed.index };
}

/**
 * Pure hash model. The renderer never invents a chain, a tombstone or a probe
 * step: every node / slot / path entry comes from the current Python snapshot.
 */
export function buildHashModel(snapshot: HashSnapshot, state: TraceState): HashVisualModel | null {
  if (state.type !== 'array' || !Array.isArray(state.values)) return null;
  if (snapshot.tableSize < 2 || snapshot.tableSize > 17) return null;
  if (snapshot.algorithm === 'chaining' && snapshot.buckets.length !== snapshot.tableSize) return null;
  if (snapshot.algorithm === 'probing' && snapshot.slots.length !== snapshot.tableSize) return null;

  const buckets = snapshot.algorithm === 'chaining' ? buildBuckets(snapshot) : [];
  const slots = snapshot.algorithm === 'probing' ? buildSlots(snapshot) : [];
  const visibleValues = snapshot.algorithm === 'chaining'
    ? buckets.flatMap((bucket) => bucket.nodes.map((node) => node.key))
    : slots.map((slot) => (slot.state === 'occupied' ? slot.key : null));
  if (
    state.values.length !== visibleValues.length ||
    !state.values.every((value, index) => Object.is(value, visibleValues[index]))
  ) {
    return null;
  }

  return {
    kind: 'hash',
    algorithm: snapshot.algorithm,
    operation: snapshot.operation,
    phase: snapshot.phase,
    tableSize: snapshot.tableSize,
    key: snapshot.key,
    hashIndex: snapshot.hashIndex,
    bucketIndex: snapshot.bucketIndex,
    currentNodeId: snapshot.currentNodeId,
    currentIndex: snapshot.currentIndex,
    comparison: snapshot.comparison,
    conflict: snapshot.conflict,
    probePath: snapshot.probePath,
    reusedDeleted: snapshot.reusedDeleted,
    result: snapshot.result,
    found: snapshot.found,
    elementCount: snapshot.elementCount,
    loadFactor: snapshot.loadFactor,
    empty: snapshot.elementCount === 0,
    buckets,
    slots,
    removed: buildRemoved(snapshot),
  };
}
