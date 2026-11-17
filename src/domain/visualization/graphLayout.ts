/**
 * Stage 7E deterministic graph layout.
 *
 * Pure geometry: no React, no DOM, no visited state. The official A–G teaching
 * graph has hand-placed coordinates; any other small graph gets a deterministic
 * circle/grid fallback sorted by node id. The same graph therefore keeps the
 * exact same coordinates in every Trace frame and while scrubbing the timeline.
 *
 * This is deliberately NOT a force simulation: there is no random seed and no
 * iterative drift, and a cyclic graph is never forced into a tree hierarchy.
 */
import type { GraphEdge } from '../trace/schema';

export interface GraphLayoutNode {
  id: string;
  x: number;
  y: number;
}

export interface GraphLayoutEdge {
  id: string;
  fromId: string;
  toId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface GraphLayout {
  width: number;
  height: number;
  nodeRadius: number;
  nodes: GraphLayoutNode[];
  edges: GraphLayoutEdge[];
}

type LayoutNodeInput = Pick<GraphLayoutNode, 'id'>;

export const GRAPH_NODE_RADIUS = 23;
export const GRAPH_LAYOUT_WIDTH = 580;
export const GRAPH_LAYOUT_HEIGHT = 380;

/** Hand-placed official teaching graph: branch, cycle and a long tail. */
export const DEFAULT_GRAPH_POSITIONS: Readonly<Record<string, Readonly<{ x: number; y: number }>>> = {
  A: { x: 290, y: 48 },
  B: { x: 160, y: 132 },
  C: { x: 430, y: 132 },
  D: { x: 80, y: 232 },
  E: { x: 230, y: 232 },
  F: { x: 400, y: 232 },
  G: { x: 290, y: 332 },
};

function circleLayout(nodes: LayoutNodeInput[]): GraphLayoutNode[] {
  const count = nodes.length;
  if (count === 1) return [{ id: nodes[0].id, x: 290, y: 190 }];
  const radius = Math.min(150, Math.max(95, count * 17));
  return nodes.map((node, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / count;
    return {
      id: node.id,
      x: Math.round(290 + Math.cos(angle) * radius),
      y: Math.round(195 + Math.sin(angle) * radius),
    };
  });
}

function gridLayout(nodes: LayoutNodeInput[]): GraphLayoutNode[] {
  const columns = Math.min(5, Math.ceil(Math.sqrt(nodes.length)));
  const rows = Math.ceil(nodes.length / columns);
  const columnGap = 108;
  const rowGap = 92;
  const startX = Math.round((GRAPH_LAYOUT_WIDTH - (columns - 1) * columnGap) / 2);
  const startY = Math.round((GRAPH_LAYOUT_HEIGHT - (rows - 1) * rowGap) / 2);
  return nodes.map((node, index) => ({
    id: node.id,
    x: startX + (index % columns) * columnGap,
    y: startY + Math.floor(index / columns) * rowGap,
  }));
}

function positionsFor(nodes: LayoutNodeInput[]): GraphLayoutNode[] {
  const known = nodes.every((node) => node.id in DEFAULT_GRAPH_POSITIONS);
  if (known) {
    return nodes.map((node) => ({
      id: node.id,
      ...DEFAULT_GRAPH_POSITIONS[node.id],
    }));
  }
  const sorted = [...nodes].sort((a, b) => a.id.localeCompare(b.id));
  return sorted.length <= 8 ? circleLayout(sorted) : gridLayout(sorted);
}

function trimEdge(
  a: GraphLayoutNode,
  b: GraphLayoutNode,
): { x1: number; y1: number; x2: number; y2: number } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy);
  if (length < 1) return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
  const trim = Math.min(GRAPH_NODE_RADIUS + 2, length / 2 - 1);
  if (trim <= 0) return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
  const ux = dx / length;
  const uy = dy / length;
  return {
    x1: Math.round(a.x + ux * trim),
    y1: Math.round(a.y + uy * trim),
    x2: Math.round(b.x - ux * trim),
    y2: Math.round(b.y - uy * trim),
  };
}

/**
 * Lay out a small undirected graph. Edges whose endpoint is not in `nodes`
 * are skipped defensively; the schema rejects them before rendering.
 */
export function layoutGraph(nodes: LayoutNodeInput[], edges: GraphEdge[]): GraphLayout {
  const positions = positionsFor(nodes);
  const byId = new Map(positions.map((node) => [node.id, node]));
  const laidEdges: GraphLayoutEdge[] = [];
  for (const edge of edges) {
    const from = byId.get(edge.fromId);
    const to = byId.get(edge.toId);
    if (!from || !to || from.id === to.id) continue;
    laidEdges.push({
      id: edge.id,
      fromId: edge.fromId,
      toId: edge.toId,
      ...trimEdge(from, to),
    });
  }
  return {
    width: GRAPH_LAYOUT_WIDTH,
    height: GRAPH_LAYOUT_HEIGHT,
    nodeRadius: GRAPH_NODE_RADIUS,
    nodes: positions,
    edges: laidEdges,
  };
}
