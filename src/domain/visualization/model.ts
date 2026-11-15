import type { TraceState } from '../trace/types';

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

export type VisualModel =
  | { kind: 'empty'; text: string }
  | { kind: 'bars'; bars: BarModel[] }
  | { kind: 'nodes'; structure: 'stack' | 'queue' | 'linked'; nodes: NodeModel[] }
  | { kind: 'graph'; edges: Array<[number, number]>; nodes: GraphNodeModel[]; isTree: boolean }
  | { kind: 'raw'; text: string };

export interface VisualLabels {
  invalid: string;
  emptyStructure: string;
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

export function buildVisualModel(state: unknown, labels: VisualLabels): VisualModel {
  if (!state || typeof state !== 'object') return { kind: 'empty', text: labels.invalid };
  const s = state as TraceState;
  const kind = s.type || 'array';
  const focus = asFocusSet(s);

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
