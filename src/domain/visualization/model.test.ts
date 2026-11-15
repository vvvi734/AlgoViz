import { describe, expect, it } from 'vitest';
import { buildVisualModel, logWindow } from './model';

const labels = { invalid: 'INVALID', emptyStructure: 'EMPTY' };

describe('trace state → visual model', () => {
  it('rejects non-object states', () => {
    expect(buildVisualModel(null, labels)).toEqual({ kind: 'empty', text: 'INVALID' });
    expect(buildVisualModel(42, labels)).toEqual({ kind: 'empty', text: 'INVALID' });
  });

  it('scales array bars and marks focus / done', () => {
    const model = buildVisualModel(
      { type: 'array', values: [4, 2, 8], focus: [1], done: true },
      labels,
    );
    expect(model.kind).toBe('bars');
    if (model.kind !== 'bars') return;
    expect(model.bars).toHaveLength(3);
    expect(model.bars[2].height).toBe(165);
    expect(model.bars[0].height).toBe(83);
    expect(model.bars[1].focused).toBe(true);
    expect(model.bars[0].focused).toBe(false);
    expect(model.bars.every((bar) => bar.done)).toBe(true);
  });

  it('caps array/structure lengths like the legacy renderer', () => {
    const many = Array.from({ length: 100 }, (_, i) => i);
    const bars = buildVisualModel({ type: 'array', values: many }, labels);
    const nodes = buildVisualModel({ type: 'stack', values: many }, labels);
    expect(bars.kind === 'bars' && bars.bars).toHaveLength(60);
    expect(nodes.kind === 'nodes' && nodes.nodes).toHaveLength(40);
  });

  it('labels stack/queue/linked heads and linked-list arrows', () => {
    const stack = buildVisualModel({ type: 'stack', values: [1, 2], focus: [1] }, labels);
    if (stack.kind !== 'nodes') throw new Error('expected nodes');
    expect(stack.nodes[1].sub).toBe('TOP');
    expect(stack.nodes[1].focused).toBe(true);
    expect(stack.nodes[0].arrowAfter).toBe(false);

    const queue = buildVisualModel({ type: 'queue', values: [1, 2] }, labels);
    if (queue.kind !== 'nodes') throw new Error('expected nodes');
    expect(queue.nodes[0].sub).toBe('FRONT');

    const linked = buildVisualModel({ type: 'linked', values: [1, 2, 3], focus: [0] }, labels);
    if (linked.kind !== 'nodes') throw new Error('expected nodes');
    expect(linked.nodes[0].sub).toBe('HEAD');
    expect(linked.nodes[0].arrowAfter).toBe(true);
    expect(linked.nodes[2].arrowAfter).toBe(false);
  });

  it('shows an empty-state message for empty structures', () => {
    expect(buildVisualModel({ type: 'stack', values: [] }, labels)).toEqual({ kind: 'empty', text: 'EMPTY' });
  });

  it('maps graph focus/visited and tree indices correctly', () => {
    const graph = buildVisualModel({ type: 'graph', visited: ['A', 'B'], focus: ['C'] }, labels);
    if (graph.kind !== 'graph') throw new Error('expected graph');
    expect(graph.isTree).toBe(false);
    expect(graph.nodes).toHaveLength(6);
    expect(graph.nodes.find((n) => n.value === 'C')?.status).toBe('focus');
    expect(graph.nodes.find((n) => n.value === 'B')?.status).toBe('visited');
    expect(graph.nodes.find((n) => n.value === 'D')?.status).toBe('none');

    const tree = buildVisualModel({ type: 'tree', values: [4, 2, 6], visited: [1], focus: [0] }, labels);
    if (tree.kind !== 'graph') throw new Error('expected graph');
    expect(tree.isTree).toBe(true);
    expect(tree.edges).toEqual([[0, 1], [0, 2]]);
    expect(tree.nodes[0].status).toBe('focus');
    expect(tree.nodes[1].status).toBe('visited');
  });

  it('falls back to a bounded raw JSON view for unknown types', () => {
    const model = buildVisualModel({ type: 'matrix', data: [1, 2] }, labels);
    expect(model.kind).toBe('raw');
    if (model.kind === 'raw') expect(model.text).toContain('matrix');
  });

  it('renders a 13-frame log window centred on the current frame', () => {
    const frames = Array.from({ length: 30 }, (_, i) => i);
    const window = logWindow(frames, 15);
    expect(window).toHaveLength(13);
    expect(window[0].index).toBe(9);
    expect(window.find((w) => w.current)?.index).toBe(15);
    expect(logWindow(frames.slice(0, 3), 1)).toHaveLength(3);
  });
});
