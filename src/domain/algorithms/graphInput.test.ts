import { describe, expect, it } from 'vitest';
import {
  GRAPH_GUIDED_INPUT_ALGORITHMS,
  GRAPH_INPUT_LIMITS,
  GRAPH_RANDOM_SCENARIOS,
  blankGraphDraft,
  buildGraphInput,
  defaultGraphScenario,
  graphAlgorithmSpec,
  graphDraftFromInput,
  randomGraphDraft,
  type GraphGuidedInputAlgorithm,
} from './graphInput';
import { structureDefaultInput } from './structureExamples';

function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function buildOk(id: GraphGuidedInputAlgorithm, input: ReturnType<typeof blankGraphDraft>) {
  const result = buildGraphInput(id, input);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.key);
  return result.input as Record<string, unknown>;
}

function officialInput(id: GraphGuidedInputAlgorithm): unknown {
  const raw = structureDefaultInput(id);
  expect(raw).toBeDefined();
  return raw;
}

describe('INPUT-06 shared graph input', () => {
  it('registers all twelve graph lessons with their existing limits', () => {
    expect([...GRAPH_GUIDED_INPUT_ALGORITHMS]).toEqual([
      'bfs',
      'dfs',
      'components',
      'scc',
      'articulation',
      'dijkstra',
      'floyd-warshall',
      'bellman-ford',
      'prim',
      'kruskal',
      'topological',
      'critical-path',
    ]);
    expect(graphAlgorithmSpec('bfs')?.direction).toBe('optional');
    expect(graphAlgorithmSpec('components')?.direction).toBe('undirected');
    expect(graphAlgorithmSpec('scc')?.direction).toBe('directed');
    expect(graphAlgorithmSpec('articulation')?.direction).toBe('undirected');
    expect(graphAlgorithmSpec('floyd-warshall')?.maxNodes).toBe(7);
    expect(graphAlgorithmSpec('prim')?.maxNodes).toBe(10);
    expect(graphAlgorithmSpec('critical-path')?.requireDag).toBe(true);
  });

  it('round-trips every official graph into the table shape and back', () => {
    for (const id of GRAPH_GUIDED_INPUT_ALGORITHMS) {
      const draft = graphDraftFromInput(id, officialInput(id));
      const built = buildOk(id, draft);
      expect(Array.isArray(built.nodes)).toBe(true);

      if (id === 'bfs' || id === 'dfs') {
        expect(built.start).toBe('A');
        expect(built.directed).toBe(false);
        expect(built.edges).toEqual([
          ['A', 'B'],
          ['A', 'C'],
          ['B', 'D'],
          ['B', 'E'],
          ['C', 'F'],
          ['E', 'F'],
          ['F', 'G'],
        ]);
      }
      if (id === 'dijkstra') {
        expect(built.directed).toBe(false);
        expect(built.start).toBe('A');
        expect(built.target).toBe('G');
        expect(built.edges).toContainEqual(['A', 'B', 2]);
      }
      if (id === 'floyd-warshall') {
        expect(built.directed).toBe(true);
        expect(built.edges).toContainEqual(['C', 'B', -2]);
      }
      if (id === 'critical-path') {
        expect(built.directed).toBe(true);
        expect(built.edges).toContainEqual(['A', 'B', 3]);
      }
      if (id === 'topological') {
        expect(built.directed).toBe(true);
        expect(built.edges).toContainEqual(['A', 'C']);
        expect(built.start).toBeUndefined();
      }
    }
  });

  it('rejects duplicate nodes, invalid labels, and rows over the readable limit', () => {
    const base = blankGraphDraft(graphAlgorithmSpec('bfs'));
    expect(buildGraphInput('bfs', { ...base, nodes: [] })).toEqual({
      ok: false,
      error: { key: 'graphErrorNodesRequired' },
    });
    expect(buildGraphInput('bfs', { ...base, nodes: ['A', 'A'] })).toEqual({
      ok: false,
      error: { key: 'graphErrorNodeDuplicate', node: 2 },
    });
    const trimmed = { ...base, nodes: [' A', 'B'] };
    expect(buildGraphInput('bfs', trimmed)).toEqual({
      ok: false,
      error: { key: 'graphErrorNodeInvalid', node: 1 },
    });
    const tooLong = { ...base, nodes: ['ABCDEFGHIJKLM', 'B'] };
    expect(buildGraphInput('bfs', tooLong)).toEqual({
      ok: false,
      error: {
        key: 'graphErrorNodeTooLong',
        max: GRAPH_INPUT_LIMITS.NODE_LABEL_MAX,
        node: 1,
      },
    });
    const tooMany = {
      ...base,
      nodes: Array.from({ length: 13 }, (_, index) => `N${index}`),
      edges: [],
      start: 'N0',
    };
    expect(buildGraphInput('bfs', tooMany)).toEqual({
      ok: false,
      error: { key: 'graphErrorNodeLimit', max: 12 },
    });
  });

  it('rejects dangling endpoints, self-loops, duplicates and bad weights', () => {
    const base = {
      ...blankGraphDraft(graphAlgorithmSpec('bfs')),
      nodes: ['A', 'B', 'C'],
    };
    expect(
      buildGraphInput('bfs', {
        ...base,
        edges: [{ from: 'A', to: 'Z', weight: '' }],
      }),
    ).toEqual({ ok: false, error: { key: 'graphErrorEdgeEndpoint', edge: 1 } });
    expect(
      buildGraphInput('bfs', {
        ...base,
        edges: [{ from: 'A', to: 'A', weight: '' }],
      }),
    ).toEqual({ ok: false, error: { key: 'graphErrorSelfLoop', edge: 1 } });
    expect(
      buildGraphInput('bfs', {
        ...base,
        edges: [
          { from: 'A', to: 'B', weight: '' },
          { from: 'B', to: 'A', weight: '' },
        ],
      }),
    ).toEqual({ ok: false, error: { key: 'graphErrorDuplicateEdge', edge: 2 } });

    const weighted = {
      ...blankGraphDraft(graphAlgorithmSpec('dijkstra')),
      nodes: ['A', 'B'],
      start: 'A',
      target: 'B',
    };
    expect(
      buildGraphInput('dijkstra', {
        ...weighted,
        edges: [{ from: 'A', to: 'B', weight: '' }],
      }),
    ).toEqual({ ok: false, error: { key: 'graphErrorWeightEmpty', edge: 1 } });
    expect(
      buildGraphInput('dijkstra', {
        ...weighted,
        edges: [{ from: 'A', to: 'B', weight: '1e3' }],
      }),
    ).toEqual({ ok: false, error: { key: 'graphErrorWeightInvalid', edge: 1 } });
    expect(
      buildGraphInput('dijkstra', {
        ...weighted,
        edges: [{ from: 'A', to: 'B', weight: '1000' }],
      }),
    ).toEqual({
      ok: false,
      error: { key: 'graphErrorWeightRange', max: 999, edge: 1 },
    });
    expect(
      buildGraphInput('dijkstra', {
        ...weighted,
        edges: [{ from: 'A', to: 'B', weight: '-2' }],
      }),
    ).toEqual({ ok: false, error: { key: 'graphErrorWeightNegative', edge: 1 } });
  });

  it('allows negative MST weights but rejects negative AOE durations and AOE cycles', () => {
    const mst = {
      ...blankGraphDraft(graphAlgorithmSpec('prim')),
      nodes: ['A', 'B', 'C'],
      start: 'A',
      edges: [
        { from: 'A', to: 'B', weight: '-2' },
        { from: 'B', to: 'C', weight: '3' },
      ],
    };
    expect(buildOk('prim', mst).edges).toEqual([
      ['A', 'B', -2],
      ['B', 'C', 3],
    ]);

    const aoe = {
      ...blankGraphDraft(graphAlgorithmSpec('critical-path')),
      nodes: ['A', 'B', 'C'],
      edges: [
        { from: 'A', to: 'B', weight: '-1' },
        { from: 'B', to: 'C', weight: '2' },
      ],
    };
    expect(buildGraphInput('critical-path', aoe)).toEqual({
      ok: false,
      error: { key: 'graphErrorDurationNegative', edge: 1 },
    });

    const cycle = {
      ...aoe,
      edges: [
        { from: 'A', to: 'B', weight: '3' },
        { from: 'B', to: 'C', weight: '2' },
        { from: 'C', to: 'A', weight: '1' },
      ],
    };
    expect(buildGraphInput('critical-path', cycle)).toEqual({
      ok: false,
      error: { key: 'graphErrorCriticalCycle' },
    });
  });

  it('requires start and target only for algorithms that consume them', () => {
    const bfs = {
      ...blankGraphDraft(graphAlgorithmSpec('bfs')),
      nodes: ['A', 'B'],
      start: '',
      edges: [{ from: 'A', to: 'B', weight: '' }],
    };
    expect(buildGraphInput('bfs', bfs)).toEqual({
      ok: false,
      error: { key: 'graphErrorStartRequired' },
    });
    expect(
      buildGraphInput('bfs', {
        ...bfs,
        start: 'Z',
      }),
    ).toEqual({ ok: false, error: { key: 'graphErrorStart' } });

    const dijkstra = {
      ...blankGraphDraft(graphAlgorithmSpec('dijkstra')),
      nodes: ['A', 'B'],
      start: 'A',
      target: '',
      edges: [{ from: 'A', to: 'B', weight: '2' }],
    };
    expect(buildGraphInput('dijkstra', dijkstra)).toEqual({
      ok: false,
      error: { key: 'graphErrorTargetRequired' },
    });
    expect(
      buildGraphInput('dijkstra', {
        ...dijkstra,
        target: 'Z',
      }),
    ).toEqual({ ok: false, error: { key: 'graphErrorTarget' } });

    const components = {
      ...blankGraphDraft(graphAlgorithmSpec('components')),
      nodes: ['A', 'B'],
      edges: [{ from: 'A', to: 'B', weight: '' }],
    };
    expect(buildOk('components', components)).toEqual({
      nodes: ['A', 'B'],
      edges: [['A', 'B']],
    });
    expect(
      buildOk('kruskal', {
        ...components,
        edges: [{ from: 'A', to: 'B', weight: '1' }],
      }).start,
    ).toBeUndefined();
  });

  it('keeps directed opposite edges distinct while rejecting a same-direction duplicate', () => {
    const base = {
      ...blankGraphDraft(graphAlgorithmSpec('dijkstra')),
      nodes: ['A', 'B'],
      directed: true,
      start: 'A',
      target: 'B',
    };
    expect(
      buildOk('dijkstra', {
        ...base,
        edges: [
          { from: 'A', to: 'B', weight: '1' },
          { from: 'B', to: 'A', weight: '2' },
        ],
      }).edges,
    ).toEqual([
      ['A', 'B', 1],
      ['B', 'A', 2],
    ]);
    expect(
      buildGraphInput('dijkstra', {
        ...base,
        edges: [
          { from: 'A', to: 'B', weight: '1' },
          { from: 'A', to: 'B', weight: '2' },
        ],
      }),
    ).toEqual({ ok: false, error: { key: 'graphErrorDuplicateEdge', edge: 2 } });
  });

  it('fills every random scenario with a legal graph for its algorithm', () => {
    for (const id of GRAPH_GUIDED_INPUT_ALGORITHMS) {
      const spec = graphAlgorithmSpec(id)!;
      for (const scenario of GRAPH_RANDOM_SCENARIOS[id]) {
        for (let seed = 1; seed <= 8; seed += 1) {
          const draft = randomGraphDraft(id, scenario.id, seeded(seed));
          const result = buildGraphInput(id, draft);
          expect(result.ok, `${id}/${scenario.id}/seed ${seed}`).toBe(true);
          if (!result.ok) continue;
          const input = result.input as {
            nodes: string[];
            edges: Array<unknown[]>;
            directed?: boolean;
            start?: string;
            target?: string;
          };
          expect(input.nodes.length).toBeGreaterThanOrEqual(1);
          expect(input.nodes.length).toBeLessThanOrEqual(spec.maxNodes);
          expect(input.edges.length).toBeLessThanOrEqual(spec.maxEdges);
          expect(new Set(input.nodes).size).toBe(input.nodes.length);
          if (spec.needsStart) expect(input.start).toBeDefined();
          if (spec.needsTarget) expect(input.target).toBeDefined();
          if (id === 'scc') {
            expect(input.directed).toBeUndefined();
          } else if (spec.direction === 'directed') {
            expect(input.directed).toBe(true);
          }
          if (spec.direction === 'undirected' || id === 'components') {
            expect(input.directed).toBeUndefined();
          }

          if (spec.weightKind === 'nonnegative') {
            for (const edge of input.edges) expect(Number(edge[2])).toBeGreaterThanOrEqual(0);
          }
          if (spec.weightKind === 'duration') {
            for (const edge of input.edges) expect(Number(edge[2])).toBeGreaterThanOrEqual(0);
          }
        }
      }
    }
  });

  it('exposes concise scenario choices and a stable default per algorithm', () => {
    for (const id of GRAPH_GUIDED_INPUT_ALGORITHMS) {
      expect(GRAPH_RANDOM_SCENARIOS[id].length).toBeGreaterThanOrEqual(2);
      const max = id === 'articulation' ? 6 : 3;
      expect(GRAPH_RANDOM_SCENARIOS[id].length).toBeLessThanOrEqual(max);
      expect(defaultGraphScenario(id)).toBe(GRAPH_RANDOM_SCENARIOS[id][0]!.id);
    }
    expect(GRAPH_RANDOM_SCENARIOS['bellman-ford'].map((scenario) => scenario.id)).toEqual([
      'negative-edge',
      'reachable-cycle',
      'unreachable-cycle',
    ]);
    expect(GRAPH_RANDOM_SCENARIOS['critical-path'].map((scenario) => scenario.id)).toEqual([
      'critical',
      'all-critical',
    ]);
  });
});
