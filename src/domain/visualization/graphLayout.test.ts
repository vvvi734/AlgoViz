import { describe, expect, it } from 'vitest';
import {
  layoutGraph,
  DEFAULT_GRAPH_POSITIONS,
  GRAPH_LAYOUT_HEIGHT,
  GRAPH_LAYOUT_WIDTH,
  computeGraphViewBox,
} from './graphLayout';
import type { GraphEdge } from '../trace/schema';

const DEFAULT_NODES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((id) => ({ id }));
const DEFAULT_EDGES: GraphEdge[] = [
  { id: 'e1', fromId: 'A', toId: 'B' },
  { id: 'e2', fromId: 'A', toId: 'C' },
  { id: 'e3', fromId: 'B', toId: 'D' },
  { id: 'e4', fromId: 'B', toId: 'E' },
  { id: 'e5', fromId: 'C', toId: 'F' },
  { id: 'e6', fromId: 'E', toId: 'F' },
  { id: 'e7', fromId: 'F', toId: 'G' },
];

function distances(nodes: Array<{ x: number; y: number }>): number[] {
  const values: number[] = [];
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      values.push(Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y));
    }
  }
  return values;
}

describe('Stage 7E deterministic graph layout', () => {
  it('keeps the shared default radius and lets MST opt into a larger local radius', () => {
    const standard = layoutGraph(DEFAULT_NODES, DEFAULT_EDGES);
    const mst = layoutGraph(DEFAULT_NODES, DEFAULT_EDGES, 29);
    expect(standard.nodeRadius).toBe(23);
    expect(mst.nodeRadius).toBe(29);
    const standardEdge = standard.edges.find((edge) => edge.id === 'e1')!;
    const mstEdge = mst.edges.find((edge) => edge.id === 'e1')!;
    expect(Math.hypot(mstEdge.x2 - mstEdge.x1, mstEdge.y2 - mstEdge.y1)).toBeLessThan(
      Math.hypot(standardEdge.x2 - standardEdge.x1, standardEdge.y2 - standardEdge.y1),
    );
  });

  it('uses stable hand-placed coordinates for the official A–G graph', () => {
    const layout = layoutGraph(DEFAULT_NODES, DEFAULT_EDGES);
    expect(layout.width).toBe(GRAPH_LAYOUT_WIDTH);
    expect(layout.height).toBe(GRAPH_LAYOUT_HEIGHT);
    const a = layout.nodes.find((node) => node.id === 'A');
    const b = layout.nodes.find((node) => node.id === 'B');
    const c = layout.nodes.find((node) => node.id === 'C');
    expect(a).toMatchObject(DEFAULT_GRAPH_POSITIONS.A);
    expect(b).toMatchObject(DEFAULT_GRAPH_POSITIONS.B);
    expect(c).toMatchObject(DEFAULT_GRAPH_POSITIONS.C);
    expect(a!.y).toBeLessThan(b!.y);
    expect(b!.x).toBeLessThan(a!.x);
    expect(c!.x).toBeGreaterThan(a!.x);
  });

  it('returns the exact same coordinates for the same graph on every call', () => {
    const first = layoutGraph(DEFAULT_NODES, DEFAULT_EDGES);
    const second = layoutGraph(DEFAULT_NODES, DEFAULT_EDGES);
    expect(second.nodes).toEqual(first.nodes);
    expect(second.edges).toEqual(first.edges);
  });

  it('fits the SVG viewport to the real node/edge bounds instead of a fixed sheet', () => {
    const layout = layoutGraph(DEFAULT_NODES, DEFAULT_EDGES);
    const viewBox = computeGraphViewBox(layout.nodes, layout.edges, layout.nodeRadius);
    expect(viewBox.width).toBeLessThan(GRAPH_LAYOUT_WIDTH - 20);
    expect(viewBox.height).toBeLessThan(GRAPH_LAYOUT_HEIGHT - 10);
    expect(viewBox.width / viewBox.height).toBeGreaterThan(1.4);

    for (const node of layout.nodes) {
      expect(node.x - layout.nodeRadius).toBeGreaterThan(viewBox.x);
      expect(node.x + layout.nodeRadius).toBeLessThan(viewBox.x + viewBox.width);
      // START/TARGET labels and the current ring sit above the node body.
      expect(node.y - layout.nodeRadius).toBeGreaterThan(viewBox.y);
      expect(node.y + layout.nodeRadius).toBeLessThan(viewBox.y + viewBox.height);
    }
    for (const edge of layout.edges) {
      expect(edge.x1).toBeGreaterThanOrEqual(viewBox.x);
      expect(edge.x2).toBeGreaterThanOrEqual(viewBox.x);
      expect(edge.y1).toBeGreaterThanOrEqual(viewBox.y);
      expect(edge.y2).toBeGreaterThanOrEqual(viewBox.y);
    }
  });

  it('includes weighted edge labels and keeps a minimum readable viewport', () => {
    const layout = layoutGraph(DEFAULT_NODES, DEFAULT_EDGES);
    const viewBox = computeGraphViewBox(
      layout.nodes,
      layout.edges.map((edge, index) => ({ ...edge, weight: index + 1 })),
      layout.nodeRadius,
    );
    expect(viewBox.width).toBeGreaterThan(0);
    expect(viewBox.height).toBeGreaterThan(0);
    const tiny = computeGraphViewBox([{ x: 20, y: 20, label: 'A' }], [], layout.nodeRadius);
    expect(tiny.width).toBeGreaterThanOrEqual(240);
    expect(tiny.height).toBeGreaterThanOrEqual(180);
  });

  it('does not depend on node array order for the generic fallback', () => {
    const nodes = ['P', 'Q', 'R', 'S'].map((id) => ({ id }));
    const edges: GraphEdge[] = [
      { id: 'p1', fromId: 'P', toId: 'Q' },
      { id: 'p2', fromId: 'Q', toId: 'R' },
      { id: 'p3', fromId: 'R', toId: 'S' },
      { id: 'p4', fromId: 'S', toId: 'P' },
    ];
    const first = layoutGraph(nodes, edges);
    const second = layoutGraph([...nodes].reverse(), edges);
    expect(second.nodes).toEqual(first.nodes);
  });

  it('keeps default nodes from overlapping and preserves real edge endpoints', () => {
    const layout = layoutGraph(DEFAULT_NODES, DEFAULT_EDGES);
    expect(Math.min(...distances(layout.nodes))).toBeGreaterThan(46);
    expect(layout.edges).toHaveLength(DEFAULT_EDGES.length);
    layout.edges.forEach((edge, index) => {
      expect(edge.fromId).toBe(DEFAULT_EDGES[index].fromId);
      expect(edge.toId).toBe(DEFAULT_EDGES[index].toId);
      expect(Number.isFinite(edge.x1)).toBe(true);
      expect(Number.isFinite(edge.y2)).toBe(true);
    });
  });

  it('shows isolated nodes and never invents an edge for them', () => {
    const nodes = ['A', 'B', 'Z'].map((id) => ({ id }));
    const edges: GraphEdge[] = [{ id: 'e1', fromId: 'A', toId: 'B' }];
    const layout = layoutGraph(nodes, edges);
    expect(layout.nodes.find((node) => node.id === 'Z')).toBeTruthy();
    expect(layout.edges).toHaveLength(1);
  });

  it('lays out a cycle without recursion or an infinite loop', () => {
    const nodes = ['A', 'B', 'C'].map((id) => ({ id }));
    const edges: GraphEdge[] = [
      { id: 'e1', fromId: 'A', toId: 'B' },
      { id: 'e2', fromId: 'B', toId: 'C' },
      { id: 'e3', fromId: 'C', toId: 'A' },
    ];
    const layout = layoutGraph(nodes, edges);
    expect(layout.nodes).toHaveLength(3);
    expect(layout.edges).toHaveLength(3);
  });

  it('handles an empty graph safely', () => {
    const layout = layoutGraph([], []);
    expect(layout.nodes).toEqual([]);
    expect(layout.edges).toEqual([]);
    expect(layout.width).toBe(GRAPH_LAYOUT_WIDTH);
  });

  it('skips dangling edges defensively', () => {
    const layout = layoutGraph([{ id: 'A' }], [{ id: 'bad', fromId: 'A', toId: 'Z' }]);
    expect(layout.edges).toEqual([]);
  });

  it('lays out the maximum 20-node graph without overlapping centers', () => {
    const nodes = Array.from({ length: 20 }, (_, index) => ({ id: `N${String(index).padStart(2, '0')}` }));
    const layout = layoutGraph(nodes, []);
    expect(layout.nodes).toHaveLength(20);
    expect(Math.min(...distances(layout.nodes))).toBeGreaterThan(46);
  });
});
