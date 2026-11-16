import type { TraceState } from '../trace/types';
import type { AnyStructureSnapshot, StructureOperation, StructureSnapshot } from '../trace/schema';
import { buildBinaryTreeModel, type BinaryTreeVisualModel } from './binaryTreeModel';
import { buildLinkedListModel, type LinkedListVisualModel } from './linkedListModel';

/**
 * Pure mapping from a trace state to a renderable model. React components only
 * paint this model; no DOM access happens in the domain layer.
 */
export interface BarModel {
  value: unknown;
  index: number;
  height: number;
  focused: boolean;
  done: boolean;
  label: string;
}

export interface NodeModel {
  value: unknown;
  index: number;
  focused: boolean;
  sub: string;
  arrowAfter: boolean;
}

export interface GraphNodeModel {
  value: unknown;
  index: number;
  x: number;
  y: number;
  status: 'focus' | 'visited' | 'none';
}

export type StructureItemState = 'normal' | 'entering' | 'peeking' | 'leaving';

/** One element in a stack/queue snapshot. IDs come from the Trace, not the DOM. */
export interface StructureItemModel {
  id: string;
  value: unknown;
  index: number;
  /** Top for the stack's last item; front/rear for the queue's ends. */
  role: 'top' | 'front' | 'rear' | 'member';
  active: boolean;
  state: StructureItemState;
}

export type VisualModel =
  | { kind: 'empty'; text: string }
  | { kind: 'bars'; bars: BarModel[] }
  | { kind: 'nodes'; structure: 'stack' | 'queue' | 'linked'; nodes: NodeModel[] }
  | { kind: 'stack'; operation: StructureOperation; items: StructureItemModel[]; removed?: StructureItemModel; empty: boolean; label: string }
  | { kind: 'queue'; operation: StructureOperation; items: StructureItemModel[]; removed?: StructureItemModel; empty: boolean; label: string }
  | LinkedListVisualModel
  | BinaryTreeVisualModel
  | { kind: 'graph'; edges: Array<[number, number]>; nodes: GraphNodeModel[]; isTree: boolean }
  | { kind: 'raw'; text: string };

export interface VisualLabels {
  invalid: string;
  emptyStructure: string;
  emptyStack?: string;
  emptyQueue?: string;
  emptyLinked?: string;
  emptyTree?: string;
}

const TREE_COORDS: Array<[number, number]> = [
  [270, 38], [140, 117], [400, 117], [75, 200], [200, 200], [345, 200], [465, 200],
];
const GRAPH_COORDS: Array<[number, number]> = [
  [270, 34], [105, 110], [435, 110], [55, 230], [175, 230], [435, 230],
];
const TREE_EDGES: Array<[number, number]> = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]];
const GRAPH_EDGES: Array<[number, number]> = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [4, 5]];

function asFocusSet(state: TraceState): Set<number | string> {
  return new Set(Array.isArray(state.focus) ? state.focus : []);
}

const STACK_OPS: readonly StructureOperation[] = ['init', 'push', 'pop', 'peek', 'done'];
const QUEUE_OPS: readonly StructureOperation[] = ['init', 'enqueue', 'dequeue', 'front', 'done'];

/**
 * Defensive check for the model boundary. The schema already validates traces,
 * but model tests and future pack traces can call this directly; malformed
 * semantics must produce an explicit error, never a guessed animation.
 */
export function isRenderableStructure(value: unknown): value is StructureSnapshot {
  if (!value || typeof value !== 'object') return false;
  const snapshot = value as Partial<StructureSnapshot>;
  if (snapshot.kind !== 'stack' && snapshot.kind !== 'queue') return false;
  if (typeof snapshot.operation !== 'string') return false;
  const allowed = snapshot.kind === 'stack' ? STACK_OPS : QUEUE_OPS;
  if (!allowed.includes(snapshot.operation as StructureOperation)) return false;
  if (!Array.isArray(snapshot.items) || snapshot.items.length > 40) return false;
  const ids = new Set<string>();
  for (const item of snapshot.items) {
    if (!item || typeof item !== 'object') return false;
    if (typeof item.id !== 'string' || item.id.length === 0 || ids.has(item.id)) return false;
    ids.add(item.id);
    if (item.value === undefined) return false;
  }
  if (snapshot.removed !== undefined) {
    if (!snapshot.removed || typeof snapshot.removed.id !== 'string' || !snapshot.removed.id) return false;
    if (snapshot.removed.value === undefined) return false;
  }
  if (snapshot.targetId !== undefined && (typeof snapshot.targetId !== 'string' || !snapshot.targetId)) return false;
  if ((snapshot.operation === 'pop' || snapshot.operation === 'dequeue') && !snapshot.removed) return false;
  return true;
}

function buildStackModel(snapshot: StructureSnapshot, label: string): VisualModel {
  const items: StructureItemModel[] = snapshot.items.map((item, index) => ({
    id: item.id,
    value: item.value,
    index,
    role: index === snapshot.items.length - 1 ? 'top' : 'member',
    active: snapshot.operation === 'peek' && item.id === snapshot.targetId,
    state:
      snapshot.operation === 'push' && item.id === snapshot.targetId ? 'entering' :
      snapshot.operation === 'peek' && item.id === snapshot.targetId ? 'peeking' : 'normal',
  }));
  const removed = snapshot.removed
    ? ({
        id: snapshot.removed.id,
        value: snapshot.removed.value,
        index: -1,
        role: 'top',
        active: true,
        state: 'leaving',
      } satisfies StructureItemModel)
    : undefined;
  // A peek without a target falls back to the actual top: the operation is
  // explicit, the top is derived from the recorded order rather than invented.
  if (snapshot.operation === 'peek' && !snapshot.targetId && items.length) {
    items[items.length - 1].active = true;
  }
  return {
    kind: 'stack',
    operation: snapshot.operation,
    items,
    ...(removed ? { removed } : {}),
    empty: items.length === 0,
    label,
  };
}

function buildQueueModel(snapshot: StructureSnapshot, label: string): VisualModel {
  const items: StructureItemModel[] = snapshot.items.map((item, index) => ({
    id: item.id,
    value: item.value,
    index,
    role:
      index === 0 && index === snapshot.items.length - 1 ? 'front' :
      index === 0 ? 'front' :
      index === snapshot.items.length - 1 ? 'rear' : 'member',
    active:
      (snapshot.operation === 'front' || snapshot.operation === 'dequeue') && item.id === snapshot.targetId,
    state: snapshot.operation === 'enqueue' && item.id === snapshot.targetId ? 'entering' : 'normal',
  }));
  const removed = snapshot.removed
    ? ({
        id: snapshot.removed.id,
        value: snapshot.removed.value,
        index: -1,
        role: 'front',
        active: true,
        state: 'leaving',
      } satisfies StructureItemModel)
    : undefined;
  if (snapshot.operation === 'front' && !snapshot.targetId && items.length) items[0].active = true;
  return {
    kind: 'queue',
    operation: snapshot.operation,
    items,
    ...(removed ? { removed } : {}),
    empty: items.length === 0,
    label,
  };
}

function structureModel(
  state: TraceState,
  structure: StructureSnapshot,
  labels: VisualLabels,
): VisualModel | null {
  if (structure.kind !== state.type) return null;
  if (Array.isArray(state.values) && state.values.length !== structure.items.length) return null;
  return structure.kind === 'stack'
    ? buildStackModel(structure, labels.emptyStack ?? labels.emptyStructure)
    : buildQueueModel(structure, labels.emptyQueue ?? labels.emptyStructure);
}

export function buildVisualModel(
  state: unknown,
  labels: VisualLabels,
  structure?: AnyStructureSnapshot,
): VisualModel {
  if (!state || typeof state !== 'object') return { kind: 'empty', text: labels.invalid };
  const s = state as TraceState;
  const kind = s.type || 'array';
  const focus = asFocusSet(s);

  if (structure !== undefined && structure.kind === 'binary-tree') {
    if (kind !== 'tree') return { kind: 'raw', text: labels.invalid };
    const model = buildBinaryTreeModel(structure, labels.emptyTree ?? labels.emptyStructure);
    if (!model) return { kind: 'raw', text: labels.invalid };
    return model;
  }

  if (structure !== undefined && structure.kind === 'linked-list') {
    if (kind !== 'linked') return { kind: 'raw', text: labels.invalid };
    const model = buildLinkedListModel(structure, labels.emptyLinked ?? labels.emptyStructure);
    if (!model) return { kind: 'raw', text: labels.invalid };
    return model;
  }

  if (structure !== undefined && (kind === 'stack' || kind === 'queue')) {
    if (!isRenderableStructure(structure)) return { kind: 'raw', text: labels.invalid };
    const model = structureModel(s, structure, labels);
    if (!model) return { kind: 'raw', text: labels.invalid };
    return model;
  }

  if (kind === 'array') {
    const values = Array.isArray(s.values) ? s.values.slice(0, 60) : [];
    const nums = values.map((x) => Number(x) || 0);
    const max = Math.max(1, ...nums.map((x) => Math.abs(x)));
    return {
      kind: 'bars',
      bars: values.map((value, index) => ({
        value,
        index,
        label: String(index),
        height: Math.max(14, Math.round((Math.abs(nums[index]) / max) * 165)),
        focused: focus.has(index),
        done: Boolean(s.done),
      })),
    };
  }

  if (kind === 'stack' || kind === 'queue' || kind === 'linked') {
    const values = Array.isArray(s.values) ? s.values.slice(0, 40) : [];
    if (!values.length) return { kind: 'empty', text: labels.emptyStructure };
    return {
      kind: 'nodes',
      structure: kind,
      nodes: values.map((value, index) => ({
        value,
        index,
        focused: focus.has(index),
        sub:
          kind === 'stack' && index === values.length - 1 ? 'TOP' :
          kind === 'queue' && index === 0 ? 'FRONT' :
          kind === 'linked' && index === 0 ? 'HEAD' : '',
        arrowAfter: kind === 'linked' && index < values.length - 1,
      })),
    };
  }

  if (kind === 'graph' || kind === 'tree') {
    const isTree = kind === 'tree';
    const values: unknown[] = isTree
      ? (Array.isArray(s.values) ? s.values : [])
      : ['A', 'B', 'C', 'D', 'E', 'F'];
    const coords = isTree ? TREE_COORDS : GRAPH_COORDS;
    const edges = (isTree ? TREE_EDGES : GRAPH_EDGES).filter(
      ([i, j]) => !isTree || (values[i] != null && values[j] != null),
    );
    const visited = new Set(Array.isArray(s.visited) ? s.visited.map(String) : []);
    const nodes: GraphNodeModel[] = [];
    values.forEach((value, i) => {
      if (value == null) return;
      const key = isTree ? i : String(value);
      const status = focus.has(key) ? 'focus' : visited.has(String(key)) ? 'visited' : 'none';
      const [x, y] = coords[i % coords.length];
      nodes.push({ value, index: i, x, y, status });
    });
    return { kind: 'graph', edges, nodes, isTree };
  }

  return { kind: 'raw', text: JSON.stringify(s).slice(0, 1500) };
}

/** Slice of the execution log shown around the current frame (legacy window: -6 / +6). */
export function logWindow<T>(frames: T[], index: number): Array<{ item: T; index: number; current: boolean }> {
  const start = Math.max(0, index - 6);
  const end = Math.min(frames.length, index + 7);
  return frames.slice(start, end).map((item, offset) => {
    const absolute = start + offset;
    return { item, index: absolute, current: absolute === index };
  });
}
