import { describe, expect, it } from 'vitest';
import { GRAPH_DEFAULT_INPUT, GRAPH_PYTHON, graphDefaultInput, graphPythonExample } from './graphTraversalExamples';
import { structureDefaultInput, structurePythonExample } from './structureExamples';

function defaultGraph(): { start: string; nodes: string[]; edges: string[][] } {
  return GRAPH_DEFAULT_INPUT as { start: string; nodes: string[]; edges: string[][] };
}

describe('Stage 7E Python graph examples', () => {
  it('defines the official A–G graph with branch, cycle and extra structure', () => {
    const graph = defaultGraph();
    expect(graph.start).toBe('A');
    expect(graph.nodes).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
    expect(graph.edges).toEqual([
      ['A', 'B'],
      ['A', 'C'],
      ['B', 'D'],
      ['B', 'E'],
      ['C', 'F'],
      ['E', 'F'],
      ['F', 'G'],
    ]);
    expect(graph.edges).toContainEqual(['E', 'F']);
    expect(graph.nodes).toContain('G');
  });

  it('registers BFS/DFS only under their existing algorithm ids', () => {
    expect(graphPythonExample('bfs')).toBe(GRAPH_PYTHON.bfs);
    expect(graphPythonExample('dfs')).toBe(GRAPH_PYTHON.dfs);
    expect(graphPythonExample('bubble')).toBeUndefined();
    expect(structurePythonExample('bfs')).toBe(GRAPH_PYTHON.bfs);
    expect(structurePythonExample('dfs')).toBe(GRAPH_PYTHON.dfs);
    expect(structureDefaultInput('bfs')).toBe(GRAPH_DEFAULT_INPUT);
    expect(structureDefaultInput('dfs')).toBe(GRAPH_DEFAULT_INPUT);
  });

  it('uses a real collections.deque and popleft for BFS', () => {
    const source = GRAPH_PYTHON.bfs;
    expect(source).toContain('from collections import deque');
    expect(source).toContain('queue = deque()');
    expect(source).toContain('queue.popleft()');
    expect(source).toContain('queue.append(start)');
    expect(source).not.toContain('stack.pop()');
  });

  it('uses a real Python list stack and pop for iterative DFS', () => {
    const source = GRAPH_PYTHON.dfs;
    expect(source).toContain('stack = []');
    expect(source).toContain('stack.append(start)');
    expect(source).toContain('current = stack.pop()');
    expect(source).toContain('for neighbor in reversed(adjacency[current])');
    expect(source).not.toContain('popleft()');
  });

  it('records source lines from the real caller frame, not a guessed index', () => {
    expect(GRAPH_PYTHON.bfs).toContain('line=sys._getframe(1).f_lineno');
    expect(GRAPH_PYTHON.dfs).toContain('line=sys._getframe(1).f_lineno');
    expect(GRAPH_PYTHON.bfs).toContain('import sys');
    expect(GRAPH_PYTHON.dfs).toContain('import sys');
  });

  it('records all BFS operation vocabulary and stable lesson step ids', () => {
    const source = GRAPH_PYTHON.bfs;
    for (const operation of ['init', 'enqueue', 'dequeue', 'visit', 'inspect-edge', 'discover', 'skip', 'done']) {
      expect(source).toContain(`"${operation}"`);
    }
    for (const step of ['init', 'start', 'dequeue', 'visit', 'inspect', 'discover', 'enqueue', 'skip', 'done']) {
      expect(source).toContain(`"${step}"`);
    }
  });

  it('records all DFS operation vocabulary and stable lesson step ids', () => {
    const source = GRAPH_PYTHON.dfs;
    for (const operation of ['init', 'push', 'pop', 'visit', 'inspect-edge', 'discover', 'skip', 'done']) {
      expect(source).toContain(`"${operation}"`);
    }
    for (const step of ['init', 'start', 'pop', 'visit', 'inspect', 'discover', 'push', 'skip', 'done']) {
      expect(source).toContain(`"${step}"`);
    }
  });

  it('normalises duplicate undirected edges and rejects self-loops before running', () => {
    const source = GRAPH_PYTHON.bfs;
    expect(source).toContain('if key in edge_by_pair:');
    expect(source).toContain('continue');
    expect(source).toContain('if a == b:');
    expect(source).toContain('raise ValueError("self-loops are not supported")');
  });

  it('has explicit size limits and an empty-graph path', () => {
    expect(GRAPH_PYTHON.bfs).toContain('len(nodes_input) > 20');
    expect(GRAPH_PYTHON.bfs).toContain('len(edges_payload) >= 40');
    expect(GRAPH_PYTHON.bfs).toContain('if start is None:');
    expect(GRAPH_PYTHON.dfs).toContain('if start is None:');
    expect(GRAPH_PYTHON.bfs).toContain('"frontierRemoved": removed');
    expect(GRAPH_PYTHON.dfs).toContain('"frontierRemoved": removed');
  });

  it('does not mutate the shared default input when read for either mode', () => {
    const before = JSON.stringify(defaultGraph());
    expect(JSON.stringify(graphDefaultInput('bfs'))).toBe(before);
    expect(JSON.stringify(graphDefaultInput('dfs'))).toBe(before);
    expect(before).toBe(JSON.stringify(GRAPH_DEFAULT_INPUT));
  });
});
