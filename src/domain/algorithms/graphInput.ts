/**
 * INPUT-06: one shared graph-input contract for every existing graph lesson.
 *
 * The UI edits ordinary node and edge tables. This module owns the rules that
 * turn those tables into the exact object each existing Python program already
 * consumes, so custom and random runs use the same executor and trace pipeline
 * as the official examples. It never invents frames and never silently repairs
 * an invalid edge.
 */
export const GRAPH_GUIDED_INPUT_ALGORITHMS = [
  'bfs',
  'dfs',
  'components',
  'scc',
  'dijkstra',
  'floyd-warshall',
  'bellman-ford',
  'prim',
  'kruskal',
  'topological',
  'critical-path',
] as const;

export type GraphGuidedInputAlgorithm = (typeof GRAPH_GUIDED_INPUT_ALGORITHMS)[number];

export type GraphDirectionMode = 'optional' | 'directed' | 'undirected';
export type GraphWeightKind = 'none' | 'nonnegative' | 'signed' | 'duration';

export interface GraphAlgorithmSpec {
  id: GraphGuidedInputAlgorithm;
  /** `optional` renders a toggle; the other values are fixed by the algorithm. */
  direction: GraphDirectionMode;
  weighted: boolean;
  weightKind: GraphWeightKind;
  weightLabel: 'weight' | 'duration';
  needsStart: boolean;
  needsTarget: boolean;
  /** Limits chosen so the existing canvas stays legible without shrinking text. */
  maxNodes: number;
  maxEdges: number;
  /** AOE is the only lesson that validates a DAG before execution. */
  requireDag: boolean;
}

export const GRAPH_INPUT_LIMITS = {
  NODE_LABEL_MAX: 12,
  WEIGHT_ABS_MAX: 999,
} as const;

const SPECS: Record<GraphGuidedInputAlgorithm, GraphAlgorithmSpec> = {
  bfs: {
    id: 'bfs',
    direction: 'optional',
    weighted: false,
    weightKind: 'none',
    weightLabel: 'weight',
    needsStart: true,
    needsTarget: false,
    maxNodes: 12,
    maxEdges: 24,
    requireDag: false,
  },
  dfs: {
    id: 'dfs',
    direction: 'optional',
    weighted: false,
    weightKind: 'none',
    weightLabel: 'weight',
    needsStart: true,
    needsTarget: false,
    maxNodes: 12,
    maxEdges: 24,
    requireDag: false,
  },
  components: {
    id: 'components',
    direction: 'undirected',
    weighted: false,
    weightKind: 'none',
    weightLabel: 'weight',
    needsStart: false,
    needsTarget: false,
    maxNodes: 12,
    maxEdges: 20,
    requireDag: false,
  },
  scc: {
    id: 'scc',
    direction: 'directed',
    weighted: false,
    weightKind: 'none',
    weightLabel: 'weight',
    needsStart: false,
    needsTarget: false,
    maxNodes: 12,
    maxEdges: 20,
    requireDag: false,
  },
  dijkstra: {
    id: 'dijkstra',
    direction: 'optional',
    weighted: true,
    weightKind: 'nonnegative',
    weightLabel: 'weight',
    needsStart: true,
    needsTarget: true,
    maxNodes: 12,
    maxEdges: 24,
    requireDag: false,
  },
  'floyd-warshall': {
    id: 'floyd-warshall',
    direction: 'optional',
    weighted: true,
    weightKind: 'signed',
    weightLabel: 'weight',
    needsStart: true,
    needsTarget: true,
    maxNodes: 7,
    maxEdges: 20,
    requireDag: false,
  },
  'bellman-ford': {
    id: 'bellman-ford',
    direction: 'optional',
    weighted: true,
    weightKind: 'signed',
    weightLabel: 'weight',
    needsStart: true,
    needsTarget: true,
    maxNodes: 12,
    maxEdges: 24,
    requireDag: false,
  },
  prim: {
    id: 'prim',
    direction: 'undirected',
    weighted: true,
    weightKind: 'signed',
    weightLabel: 'weight',
    needsStart: true,
    needsTarget: false,
    maxNodes: 10,
    maxEdges: 20,
    requireDag: false,
  },
  kruskal: {
    id: 'kruskal',
    direction: 'undirected',
    weighted: true,
    weightKind: 'signed',
    weightLabel: 'weight',
    needsStart: false,
    needsTarget: false,
    maxNodes: 12,
    maxEdges: 20,
    requireDag: false,
  },
  topological: {
    id: 'topological',
    direction: 'directed',
    weighted: false,
    weightKind: 'none',
    weightLabel: 'weight',
    needsStart: false,
    needsTarget: false,
    maxNodes: 12,
    maxEdges: 20,
    requireDag: false,
  },
  'critical-path': {
    id: 'critical-path',
    direction: 'directed',
    weighted: true,
    weightKind: 'duration',
    weightLabel: 'duration',
    needsStart: false,
    needsTarget: false,
    maxNodes: 12,
    maxEdges: 20,
    requireDag: true,
  },
};

export function graphAlgorithmSpec(id: string): GraphAlgorithmSpec | undefined {
  return (SPECS as Record<string, GraphAlgorithmSpec>)[id];
}

export function isGraphGuidedInputAlgorithm(id: string): id is GraphGuidedInputAlgorithm {
  return (GRAPH_GUIDED_INPUT_ALGORITHMS as readonly string[]).includes(id);
}

export interface GraphEdgeFields {
  from: string;
  to: string;
  weight: string;
}

export interface GraphInputFields {
  nodes: string[];
  edges: GraphEdgeFields[];
  directed: boolean;
  start: string;
  target: string;
}

export interface GraphInputIssue {
  key: string;
  max?: number;
  /** 1-based edge row, used by the shared feedback line. */
  edge?: number;
  /** 1-based node row. */
  node?: number;
}

export type GraphBuildResult =
  | { ok: true; input: unknown }
  | { ok: false; error: GraphInputIssue };

export interface GraphRandomScenario {
  id: string;
  label: [zh: string, en: string];
}

export function blankGraphDraft(spec?: GraphAlgorithmSpec): GraphInputFields {
  const nodes = ['A', 'B', 'C'];
  return {
    nodes,
    edges: [
      { from: 'A', to: 'B', weight: spec?.weighted ? '1' : '' },
      { from: 'B', to: 'C', weight: spec?.weighted ? '2' : '' },
    ],
    directed: spec?.direction === 'directed',
    start: spec?.needsStart ? 'A' : '',
    target: spec?.needsTarget ? 'C' : '',
  };
}

export function emptyGraphDraft(): GraphInputFields {
  return {
    nodes: ['A'],
    edges: [],
    directed: false,
    start: 'A',
    target: '',
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function weightValue(value: unknown): string {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : stringValue(value);
}

function edgeValue(raw: unknown): { from: string; to: string; weight: string } {
  if (Array.isArray(raw)) {
    return {
      from: stringValue(raw[0]),
      to: stringValue(raw[1]),
      weight: weightValue(raw[2]),
    };
  }
  if (isRecord(raw)) {
    return {
      from: stringValue(raw.from),
      to: stringValue(raw.to),
      weight: weightValue(raw.weight ?? raw.duration),
    };
  }
  return { from: '', to: '', weight: '' };
}

/** Convert either the official tuple shape or the editor shape into table rows. */
export function graphDraftFromInput(id: GraphGuidedInputAlgorithm, input: unknown): GraphInputFields {
  const spec = SPECS[id];
  const record = isRecord(input) ? input : {};
  const nodes = Array.isArray(record.nodes)
    ? record.nodes.map((node) => stringValue(node))
    : [];
  const edges = Array.isArray(record.edges) ? record.edges.map(edgeValue) : [];
  const directed =
    typeof record.directed === 'boolean'
      ? record.directed
      : spec.direction === 'directed';
  return {
    nodes,
    edges,
    directed,
    start: stringValue(record.start),
    target: stringValue(record.target),
  };
}

function parseNumber(raw: string): number | null {
  const text = raw.trim();
  if (!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/u.test(text)) return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

function duplicateKey(from: string, to: string, directed: boolean): string {
  return (directed || from <= to) ? `${from}\u0000${to}` : `${to}\u0000${from}`;
}

function containsDirectedCycle(
  nodes: readonly string[],
  edges: ReadonlyArray<Readonly<{ from: string; to: string }>>,
): boolean {
  const adjacency = new Map<string, string[]>(nodes.map((node) => [node, []]));
  for (const edge of edges) adjacency.get(edge.from)?.push(edge.to);
  const state = new Map<string, 0 | 1 | 2>(nodes.map((node) => [node, 0]));
  const visit = (node: string): boolean => {
    state.set(node, 1);
    for (const next of adjacency.get(node) ?? []) {
      const color = state.get(next) ?? 0;
      if (color === 1) return true;
      if (color === 0 && visit(next)) return true;
    }
    state.set(node, 2);
    return false;
  };
  return nodes.some((node) => state.get(node) === 0 && visit(node));
}

/**
 * Validate the table and build the exact input object expected by the existing
 * Python program. Every rejection is explicit: self-loops, dangling endpoints,
 * duplicate edges, invalid weights and missing start/target never get repaired
 * behind the student's back.
 */
export function buildGraphInput(id: GraphGuidedInputAlgorithm, draft: GraphInputFields): GraphBuildResult {
  const spec = SPECS[id];
  const nodes = draft.nodes;
  if (nodes.length === 0) return { ok: false, error: { key: 'graphErrorNodesRequired' } };
  if (nodes.length > spec.maxNodes) {
    return { ok: false, error: { key: 'graphErrorNodeLimit', max: spec.maxNodes } };
  }

  const nodeSet = new Set<string>();
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index]!;
    if (node.length === 0 || node.trim() !== node) {
      return { ok: false, error: { key: 'graphErrorNodeInvalid', node: index + 1 } };
    }
    if (node.length > GRAPH_INPUT_LIMITS.NODE_LABEL_MAX) {
      return {
        ok: false,
        error: {
          key: 'graphErrorNodeTooLong',
          max: GRAPH_INPUT_LIMITS.NODE_LABEL_MAX,
          node: index + 1,
        },
      };
    }
    if (nodeSet.has(node)) {
      return { ok: false, error: { key: 'graphErrorNodeDuplicate', node: index + 1 } };
    }
    nodeSet.add(node);
  }

  if (draft.edges.length > spec.maxEdges) {
    return { ok: false, error: { key: 'graphErrorEdgeLimit', max: spec.maxEdges } };
  }
  const directed =
    spec.direction === 'directed' ? true : spec.direction === 'undirected' ? false : draft.directed;
  const edgeKeys = new Set<string>();
  const acceptedEdges: Array<{ from: string; to: string; weight: number }> = [];

  for (let index = 0; index < draft.edges.length; index += 1) {
    const edge = draft.edges[index]!;
    const edgeNumber = index + 1;
    if (!nodeSet.has(edge.from) || !nodeSet.has(edge.to)) {
      return { ok: false, error: { key: 'graphErrorEdgeEndpoint', edge: edgeNumber } };
    }
    if (edge.from === edge.to) {
      return { ok: false, error: { key: 'graphErrorSelfLoop', edge: edgeNumber } };
    }
    const key = duplicateKey(edge.from, edge.to, directed);
    if (edgeKeys.has(key)) {
      return { ok: false, error: { key: 'graphErrorDuplicateEdge', edge: edgeNumber } };
    }
    edgeKeys.add(key);

    let weight = 0;
    if (spec.weighted) {
      if (edge.weight.trim() === '') {
        return { ok: false, error: { key: 'graphErrorWeightEmpty', edge: edgeNumber } };
      }
      const parsed = parseNumber(edge.weight);
      if (parsed === null) {
        return { ok: false, error: { key: 'graphErrorWeightInvalid', edge: edgeNumber } };
      }
      if (Math.abs(parsed) > GRAPH_INPUT_LIMITS.WEIGHT_ABS_MAX) {
        return {
          ok: false,
          error: {
            key: 'graphErrorWeightRange',
            max: GRAPH_INPUT_LIMITS.WEIGHT_ABS_MAX,
            edge: edgeNumber,
          },
        };
      }
      if (spec.weightKind === 'nonnegative' && parsed < 0) {
        return { ok: false, error: { key: 'graphErrorWeightNegative', edge: edgeNumber } };
      }
      if (spec.weightKind === 'duration' && parsed < 0) {
        return { ok: false, error: { key: 'graphErrorDurationNegative', edge: edgeNumber } };
      }
      weight = parsed;
    }
    acceptedEdges.push({ from: edge.from, to: edge.to, weight });
  }

  let start = '';
  if (spec.needsStart) {
    if (draft.start === '') return { ok: false, error: { key: 'graphErrorStartRequired' } };
    if (!nodeSet.has(draft.start)) return { ok: false, error: { key: 'graphErrorStart' } };
    start = draft.start;
  }

  let target = '';
  if (spec.needsTarget) {
    if (draft.target === '') return { ok: false, error: { key: 'graphErrorTargetRequired' } };
    if (!nodeSet.has(draft.target)) return { ok: false, error: { key: 'graphErrorTarget' } };
    target = draft.target;
  }

  if (spec.requireDag && containsDirectedCycle(nodes, acceptedEdges)) {
    return { ok: false, error: { key: 'graphErrorCriticalCycle' } };
  }

  const plainEdges = acceptedEdges.map((edge) => [edge.from, edge.to]);
  const weightedEdges = acceptedEdges.map((edge) => [edge.from, edge.to, edge.weight]);

  if (id === 'bfs' || id === 'dfs') {
    return { ok: true, input: { start, nodes, edges: plainEdges, directed } };
  }
  if (id === 'components' || id === 'scc') {
    return { ok: true, input: { nodes, edges: plainEdges } };
  }
  if (id === 'dijkstra' || id === 'floyd-warshall' || id === 'bellman-ford') {
    return { ok: true, input: { start, target, directed, nodes, edges: weightedEdges } };
  }
  if (id === 'prim' || id === 'kruskal') {
    return {
      ok: true,
      input: spec.needsStart
        ? { start, nodes, edges: weightedEdges }
        : { nodes, edges: weightedEdges },
    };
  }
  if (id === 'topological') {
    return { ok: true, input: { nodes, edges: plainEdges, directed: true } };
  }
  return { ok: true, input: { nodes, edges: weightedEdges, directed: true } };
}

function randInt(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

const NODE_ALPHABET = 'ABCDEFGHIJKL';

function nodeLabels(count: number): string[] {
  return Array.from({ length: count }, (_, index) => NODE_ALPHABET[index]!);
}

function fields(
  nodes: string[],
  directed: boolean,
  start: string,
  target = '',
): GraphInputFields {
  return { nodes, edges: [], directed, start, target };
}

function addEdge(
  draft: GraphInputFields,
  from: string,
  to: string,
  weight: string | number = '',
  directed = draft.directed,
): void {
  if (from === to) return;
  const key = duplicateKey(from, to, directed);
  const existing = draft.edges.some((edge) => duplicateKey(edge.from, edge.to, directed) === key);
  if (existing) return;
  draft.edges.push({ from, to, weight: weight === '' ? '' : String(weight) });
}

function addRandomSpanningTree(
  draft: GraphInputFields,
  random: () => number,
  weightMin?: number,
  weightMax?: number,
): void {
  for (let index = 1; index < draft.nodes.length; index += 1) {
    const parent = randInt(random, 0, index - 1);
    const weight =
      weightMin === undefined || weightMax === undefined
        ? ''
        : randInt(random, weightMin, weightMax);
    addEdge(draft, draft.nodes[parent]!, draft.nodes[index]!, weight);
  }
}

function traversalConnected(random: () => number): GraphInputFields {
  const count = randInt(random, 6, 8);
  const draft = fields(nodeLabels(count), false, 'A');
  addRandomSpanningTree(draft, random);
  // A marked cycle keeps BFS/DFS from only walking a tree.
  const from = randInt(random, 1, count - 1);
  const to = randInt(random, 0, count - 1);
  addEdge(draft, draft.nodes[from]!, draft.nodes[to]!);
  if (draft.edges.length === count - 1) {
    addEdge(draft, draft.nodes[count - 1]!, 'A');
  }
  return draft;
}

function traversalDisconnected(random: () => number): GraphInputFields {
  const count = randInt(random, 7, 8);
  const draft = fields(nodeLabels(count), false, 'A');
  const firstSize = Math.floor(count / 2);
  for (let index = 1; index < firstSize; index += 1) {
    const parent = randInt(random, 0, index - 1);
    addEdge(draft, draft.nodes[parent]!, draft.nodes[index]!);
  }
  addEdge(draft, draft.nodes[0]!, draft.nodes[firstSize - 1]!);
  if (count - firstSize >= 2) {
    addEdge(draft, draft.nodes[firstSize]!, draft.nodes[firstSize + 1]!);
  }
  // The last node deliberately stays isolated.
  return draft;
}

function traversalDirected(random: () => number): GraphInputFields {
  const count = randInt(random, 7, 8);
  const draft = fields(nodeLabels(count), true, 'A');
  addEdge(draft, 'A', 'B', '', true);
  addEdge(draft, 'A', 'C', '', true);
  addEdge(draft, 'B', 'D', '', true);
  addEdge(draft, 'C', 'D', '', true);
  addEdge(draft, 'D', 'E', '', true);
  addEdge(draft, 'E', 'B', '', true);
  addEdge(draft, 'A', 'F', '', true);
  addEdge(draft, 'F', 'G', '', true);
  if (count > 7) addEdge(draft, 'H', 'G', '', true);
  return draft;
}

function componentsSingle(random: () => number): GraphInputFields {
  const count = randInt(random, 6, 8);
  const draft = fields(nodeLabels(count), false, '');
  addRandomSpanningTree(draft, random);
  addEdge(draft, draft.nodes[1]!, draft.nodes[count - 1]!);
  return draft;
}

function componentsMultiple(random: () => number): GraphInputFields {
  const count = 8;
  const draft = fields(nodeLabels(count), false, '');
  addEdge(draft, 'A', 'B');
  addEdge(draft, 'B', 'C');
  addEdge(draft, 'C', 'A');
  addEdge(draft, 'D', 'E');
  addEdge(draft, 'E', 'F');
  addEdge(draft, 'F', 'D');
  addEdge(draft, 'G', 'H');
  void random;
  return draft;
}

function sccMultiple(random: () => number): GraphInputFields {
  const draft = fields(nodeLabels(8), true, '');
  addEdge(draft, 'A', 'B', '', true);
  addEdge(draft, 'B', 'C', '', true);
  addEdge(draft, 'C', 'A', '', true);
  addEdge(draft, 'D', 'E', '', true);
  addEdge(draft, 'E', 'D', '', true);
  addEdge(draft, 'F', 'G', '', true);
  addEdge(draft, 'G', 'H', '', true);
  addEdge(draft, 'H', 'F', '', true);
  addEdge(draft, 'C', 'D', '', true);
  addEdge(draft, 'E', 'F', '', true);
  addEdge(draft, 'H', 'A', '', true);
  void random;
  return draft;
}

function sccSingle(random: () => number): GraphInputFields {
  const count = randInt(random, 6, 8);
  const draft = fields(nodeLabels(count), true, '');
  for (let index = 0; index < count; index += 1) {
    addEdge(draft, draft.nodes[index]!, draft.nodes[(index + 1) % count]!, '', true);
  }
  addEdge(draft, draft.nodes[0]!, draft.nodes[2]!, '', true);
  addEdge(draft, draft.nodes[2]!, draft.nodes[4 % count]!, '', true);
  return draft;
}

function sccDag(random: () => number): GraphInputFields {
  const draft = fields(nodeLabels(8), true, '');
  addEdge(draft, 'A', 'C', '', true);
  addEdge(draft, 'A', 'D', '', true);
  addEdge(draft, 'B', 'C', '', true);
  addEdge(draft, 'B', 'D', '', true);
  addEdge(draft, 'C', 'E', '', true);
  addEdge(draft, 'D', 'E', '', true);
  addEdge(draft, 'E', 'F', '', true);
  addEdge(draft, 'E', 'G', '', true);
  addEdge(draft, 'F', 'H', '', true);
  addEdge(draft, 'G', 'H', '', true);
  void random;
  return draft;
}

function dijkstraAlternative(random: () => number): GraphInputFields {
  const draft = fields(nodeLabels(8), false, 'A', 'G');
  addEdge(draft, 'A', 'B', randInt(random, 2, 3));
  addEdge(draft, 'A', 'C', randInt(random, 4, 6));
  addEdge(draft, 'B', 'C', randInt(random, 1, 2));
  addEdge(draft, 'C', 'D', 1);
  addEdge(draft, 'B', 'D', randInt(random, 5, 7));
  addEdge(draft, 'B', 'E', randInt(random, 7, 9));
  addEdge(draft, 'D', 'E', 2);
  addEdge(draft, 'E', 'F', 3);
  addEdge(draft, 'C', 'F', 9);
  addEdge(draft, 'F', 'G', 2);
  return draft;
}

function dijkstraEqualCost(random: () => number): GraphInputFields {
  const draft = fields(nodeLabels(7), true, 'A', 'F');
  addEdge(draft, 'A', 'B', 1, true);
  addEdge(draft, 'A', 'C', 1, true);
  addEdge(draft, 'B', 'D', 2, true);
  addEdge(draft, 'C', 'D', 2, true);
  addEdge(draft, 'D', 'F', 1, true);
  addEdge(draft, 'B', 'F', randInt(random, 5, 6), true);
  addEdge(draft, 'E', 'G', 2, true);
  return draft;
}

function dijkstraZeroWeight(random: () => number): GraphInputFields {
  const draft = fields(nodeLabels(7), true, 'A', 'G');
  addEdge(draft, 'A', 'B', 0, true);
  addEdge(draft, 'B', 'C', 0, true);
  addEdge(draft, 'C', 'A', 0, true);
  addEdge(draft, 'B', 'D', randInt(random, 2, 3), true);
  addEdge(draft, 'C', 'D', 1, true);
  addEdge(draft, 'D', 'E', 0, true);
  addEdge(draft, 'E', 'F', 1, true);
  addEdge(draft, 'F', 'G', 0, true);
  return draft;
}

function bellmanNegativeEdge(random: () => number): GraphInputFields {
  const draft = fields(nodeLabels(7), true, 'A', 'F');
  addEdge(draft, 'A', 'B', 4, true);
  addEdge(draft, 'A', 'C', 5, true);
  addEdge(draft, 'B', 'C', -3, true);
  addEdge(draft, 'B', 'D', 4, true);
  addEdge(draft, 'C', 'D', 2, true);
  addEdge(draft, 'D', 'F', 3, true);
  addEdge(draft, 'C', 'F', randInt(random, 7, 9), true);
  addEdge(draft, 'E', 'G', 1, true);
  return draft;
}

function bellmanReachableCycle(random: () => number): GraphInputFields {
  const draft = fields(nodeLabels(6), true, 'A', 'F');
  addEdge(draft, 'A', 'B', 2, true);
  addEdge(draft, 'B', 'C', -2, true);
  addEdge(draft, 'C', 'D', -2, true);
  addEdge(draft, 'D', 'B', -1, true);
  addEdge(draft, 'B', 'E', 3, true);
  addEdge(draft, 'E', 'F', randInt(random, 1, 2), true);
  return draft;
}

function bellmanUnreachableCycle(random: () => number): GraphInputFields {
  const draft = fields(nodeLabels(8), true, 'A', 'F');
  addEdge(draft, 'A', 'B', 2, true);
  addEdge(draft, 'B', 'F', 3, true);
  addEdge(draft, 'C', 'D', 1, true);
  addEdge(draft, 'D', 'C', -2, true);
  addEdge(draft, 'E', 'G', 1, true);
  addEdge(draft, 'G', 'H', randInt(random, 2, 4), true);
  return draft;
}

function floydMixed(random: () => number): GraphInputFields {
  const draft = fields(nodeLabels(7), true, 'A', 'F');
  addEdge(draft, 'A', 'B', 4, true);
  addEdge(draft, 'B', 'C', -2, true);
  addEdge(draft, 'C', 'A', randInt(random, 4, 6), true);
  addEdge(draft, 'B', 'D', 2, true);
  addEdge(draft, 'C', 'D', 5, true);
  addEdge(draft, 'D', 'E', 1, true);
  addEdge(draft, 'E', 'C', 2, true);
  addEdge(draft, 'G', 'D', 3, true);
  return draft;
}

function floydNegativeCycle(random: () => number): GraphInputFields {
  const draft = fields(nodeLabels(7), true, 'A', 'F');
  addEdge(draft, 'A', 'B', 1, true);
  addEdge(draft, 'B', 'C', -2, true);
  addEdge(draft, 'C', 'B', 1, true);
  addEdge(draft, 'C', 'D', 2, true);
  addEdge(draft, 'D', 'E', 1, true);
  addEdge(draft, 'E', 'F', randInt(random, 1, 3), true);
  addEdge(draft, 'A', 'D', 5, true);
  return draft;
}

function floydUndirected(random: () => number): GraphInputFields {
  const draft = fields(nodeLabels(6), false, 'A', 'F');
  addEdge(draft, 'A', 'B', randInt(random, 4, 5));
  addEdge(draft, 'A', 'C', 1);
  addEdge(draft, 'C', 'B', 2);
  addEdge(draft, 'B', 'D', 5);
  addEdge(draft, 'C', 'D', 1);
  addEdge(draft, 'D', 'E', 2);
  addEdge(draft, 'E', 'F', 3);
  return draft;
}

function mstConnected(random: () => number, equal: boolean): GraphInputFields {
  const count = randInt(random, 6, 8);
  const draft = fields(nodeLabels(count), false, 'A');
  const weight = () => (equal ? 2 : randInt(random, 1, 6));
  addRandomSpanningTree(draft, random, equal ? 2 : 1, equal ? 2 : 6);
  for (let index = 0; index < 2; index += 1) {
    const from = randInt(random, 0, count - 1);
    const to = randInt(random, 0, count - 1);
    addEdge(draft, draft.nodes[from]!, draft.nodes[to]!, weight());
  }
  return draft;
}

function mstDisconnected(random: () => number): GraphInputFields {
  const count = randInt(random, 7, 8);
  const draft = fields(nodeLabels(count), false, 'A');
  const split = Math.floor(count / 2);
  for (let index = 1; index < split; index += 1) {
    const parent = randInt(random, 0, index - 1);
    addEdge(draft, draft.nodes[parent]!, draft.nodes[index]!, randInt(random, 1, 6));
  }
  for (let index = split + 1; index < count; index += 1) {
    const parent = randInt(random, split, index - 1);
    addEdge(draft, draft.nodes[parent]!, draft.nodes[index]!, randInt(random, 1, 6));
  }
  return draft;
}

function topologicalDag(random: () => number): GraphInputFields {
  const draft = fields(nodeLabels(7), true, '');
  addEdge(draft, 'A', 'C', '', true);
  addEdge(draft, 'A', 'D', '', true);
  addEdge(draft, 'B', 'C', '', true);
  addEdge(draft, 'B', 'D', '', true);
  addEdge(draft, 'C', 'E', '', true);
  addEdge(draft, 'D', 'E', '', true);
  addEdge(draft, 'E', 'F', '', true);
  addEdge(draft, 'E', 'G', '', true);
  addEdge(draft, 'F', 'G', '', true);
  void random;
  return draft;
}

function topologicalCycle(random: () => number): GraphInputFields {
  const draft = topologicalDag(random);
  addEdge(draft, 'G', 'A', '', true);
  return draft;
}

function aoeCritical(random: () => number): GraphInputFields {
  const draft = fields(nodeLabels(6), true, '');
  const ab = randInt(random, 2, 4);
  const bd = randInt(random, 3, 5);
  const ac = randInt(random, 1, 2);
  const cdMax = ab + bd - ac - 1;
  const cd = randInt(random, 1, Math.max(1, cdMax));
  addEdge(draft, 'A', 'B', ab, true);
  addEdge(draft, 'A', 'C', ac, true);
  addEdge(draft, 'B', 'D', bd, true);
  addEdge(draft, 'C', 'D', cd, true);
  addEdge(draft, 'D', 'F', randInt(random, 2, 4), true);
  addEdge(draft, 'B', 'E', randInt(random, 1, 2), true);
  addEdge(draft, 'E', 'F', randInt(random, 15, 25), true);
  return draft;
}

function aoeAllCritical(random: () => number): GraphInputFields {
  const draft = fields(nodeLabels(6), true, '');
  for (let index = 0; index < draft.nodes.length - 1; index += 1) {
    addEdge(
      draft,
      draft.nodes[index]!,
      draft.nodes[index + 1]!,
      randInt(random, 1, 5),
      true,
    );
  }
  return draft;
}

export const GRAPH_RANDOM_SCENARIOS: Record<
  GraphGuidedInputAlgorithm,
  readonly GraphRandomScenario[]
> = {
  bfs: [
    { id: 'connected', label: ['连通图（含环）', 'Connected with a cycle'] },
    { id: 'disconnected', label: ['非连通图', 'Disconnected'] },
    { id: 'directed', label: ['有向图', 'Directed'] },
  ],
  dfs: [
    { id: 'connected', label: ['连通图（含环）', 'Connected with a cycle'] },
    { id: 'disconnected', label: ['非连通图', 'Disconnected'] },
    { id: 'directed', label: ['有向图', 'Directed'] },
  ],
  components: [
    { id: 'single', label: ['单个连通分量', 'One component'] },
    { id: 'multiple', label: ['多个连通分量', 'Multiple components'] },
  ],
  scc: [
    { id: 'multiple', label: ['多个强连通分量', 'Multiple SCCs'] },
    { id: 'single', label: ['整体强连通', 'One SCC'] },
    { id: 'dag', label: ['DAG（每个节点单独成 SCC）', 'DAG (singleton SCCs)'] },
  ],
  dijkstra: [
    { id: 'alternative', label: ['多条候选路径', 'Alternative routes'] },
    { id: 'equal-cost', label: ['相同代价候选路径', 'Equal-cost routes'] },
    { id: 'zero-weight', label: ['零权边与零权环', 'Zero-weight edges'] },
  ],
  'bellman-ford': [
    { id: 'negative-edge', label: ['负权边（无负环）', 'Negative edge, no cycle'] },
    { id: 'reachable-cycle', label: ['可达负权环', 'Reachable negative cycle'] },
    { id: 'unreachable-cycle', label: ['不可达负权环', 'Unreachable negative cycle'] },
  ],
  'floyd-warshall': [
    { id: 'mixed', label: ['有向混合权与不可达点', 'Directed mixed weights'] },
    { id: 'negative-cycle', label: ['负权环', 'Negative cycle'] },
    { id: 'undirected', label: ['无向正权图', 'Undirected positive graph'] },
  ],
  prim: [
    { id: 'connected', label: ['连通带权图', 'Connected weighted graph'] },
    { id: 'equal-weight', label: ['相同权值候选', 'Equal-weight candidates'] },
    { id: 'disconnected', label: ['非连通图（生成森林）', 'Disconnected (forest)'] },
  ],
  kruskal: [
    { id: 'connected', label: ['连通带权图', 'Connected weighted graph'] },
    { id: 'equal-weight', label: ['相同权值候选', 'Equal-weight candidates'] },
    { id: 'disconnected', label: ['非连通图（生成森林）', 'Disconnected (forest)'] },
  ],
  topological: [
    { id: 'dag', label: ['DAG', 'DAG'] },
    { id: 'cycle', label: ['有向环（无法完成）', 'Directed cycle (cannot finish)'] },
  ],
  'critical-path': [
    { id: 'critical', label: ['关键活动与非关键活动', 'Critical and slack activities'] },
    { id: 'all-critical', label: ['全部活动关键', 'Every activity critical'] },
  ],
};

export function defaultGraphScenario(id: GraphGuidedInputAlgorithm): string {
  return GRAPH_RANDOM_SCENARIOS[id][0]!.id;
}

/** Random buttons only fill the table. The student still chooses Generate. */
export function randomGraphDraft(
  id: GraphGuidedInputAlgorithm,
  scenario: string,
  random: () => number = Math.random,
): GraphInputFields {
  if (id === 'bfs' || id === 'dfs') {
    if (scenario === 'disconnected') return traversalDisconnected(random);
    if (scenario === 'directed') return traversalDirected(random);
    return traversalConnected(random);
  }
  if (id === 'components') {
    return scenario === 'single' ? componentsSingle(random) : componentsMultiple(random);
  }
  if (id === 'scc') {
    if (scenario === 'single') return sccSingle(random);
    if (scenario === 'dag') return sccDag(random);
    return sccMultiple(random);
  }
  if (id === 'dijkstra') {
    if (scenario === 'equal-cost') return dijkstraEqualCost(random);
    if (scenario === 'zero-weight') return dijkstraZeroWeight(random);
    return dijkstraAlternative(random);
  }
  if (id === 'bellman-ford') {
    if (scenario === 'reachable-cycle') return bellmanReachableCycle(random);
    if (scenario === 'unreachable-cycle') return bellmanUnreachableCycle(random);
    return bellmanNegativeEdge(random);
  }
  if (id === 'floyd-warshall') {
    if (scenario === 'negative-cycle') return floydNegativeCycle(random);
    if (scenario === 'undirected') return floydUndirected(random);
    return floydMixed(random);
  }
  if (id === 'prim' || id === 'kruskal') {
    if (scenario === 'disconnected') return mstDisconnected(random);
    return mstConnected(random, scenario === 'equal-weight');
  }
  if (id === 'topological') {
    return scenario === 'cycle' ? topologicalCycle(random) : topologicalDag(random);
  }
  return scenario === 'all-critical' ? aoeAllCritical(random) : aoeCritical(random);
}
