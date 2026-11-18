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

/** Content-driven SVG viewport. `x`/`y` are SVG user units, not page pixels. */
export interface GraphViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GraphViewNode {
  x: number;
  y: number;
  label?: string;
  start?: boolean;
  target?: boolean;
}

export interface GraphViewEdge {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  weight?: number;
}

type LayoutNodeInput = Pick<GraphLayoutNode, 'id'>;

export const GRAPH_NODE_RADIUS = 23;
export const GRAPH_LAYOUT_WIDTH = 580;
export const GRAPH_LAYOUT_HEIGHT = 380;
export const GRAPH_VIEW_PADDING = 10;
export const GRAPH_VIEW_MIN_WIDTH = 240;
export const GRAPH_VIEW_MIN_HEIGHT = 180;

/**
 * The official teaching graph spreads horizontally so a wide desktop canvas
 * uses its width instead of leaving the seven nodes in a small centre block.
 * Coordinates stay fixed and deterministic across every frame of a trace.
 */
export const DEFAULT_GRAPH_POSITIONS: Readonly<Record<string, Readonly<{ x: number; y: number }>>> = {
  A: { x: 300, y: 40 },
  B: { x: 130, y: 105 },
  C: { x: 470, y: 105 },
  D: { x: 25, y: 175 },
  E: { x: 215, y: 175 },
  F: { x: 425, y: 175 },
  G: { x: 300, y: 240 },
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

function roundView(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Fit the SVG viewport to the drawn graph instead of to a fixed 580×380 sheet.
 *
 * The old fixed viewBox left large empty bands around the seven-node graph. This
 * keeps every node ring, START/TARGET tag, badge, arrow endpoint and weight
 * label inside the viewport (plus breathing room), while removing unused space.
 * It is a pure function of the same frame data, so scrubbing cannot change the
 * viewport or make the graph jump.
 */
export function computeGraphViewBox(
  nodes: readonly GraphViewNode[],
  edges: readonly GraphViewEdge[],
  radius = GRAPH_NODE_RADIUS,
): GraphViewBox {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: GRAPH_LAYOUT_WIDTH, height: GRAPH_LAYOUT_HEIGHT };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  const include = (left: number, top: number, right: number, bottom: number) => {
    minX = Math.min(minX, left);
    maxX = Math.max(maxX, right);
    minY = Math.min(minY, top);
    maxY = Math.max(maxY, bottom);
  };

  for (const node of nodes) {
    const labelHalf = Math.max(radius + 8, (node.label?.length ?? 0) * 5);
    // START sits at -radius-12, TARGET at -radius-27. Text is 9.5px, so the
    // current node needs up to radius+36 above its centre to stay visible.
    const topOverflow = radius + 8 + (node.start ? 22 : 0) + (node.target ? 14 : 0);
    include(node.x - labelHalf, node.y - topOverflow, node.x + labelHalf, node.y + radius + 8);
  }

  for (const edge of edges) {
    include(edge.x1, edge.y1, edge.x2, edge.y2);
    if (edge.weight !== undefined) {
      const midX = (edge.x1 + edge.x2) / 2;
      const midY = (edge.y1 + edge.y2) / 2;
      include(midX - 17, midY - 11, midX + 17, midY + 11);
    }
  }

  minX -= GRAPH_VIEW_PADDING;
  maxX += GRAPH_VIEW_PADDING;
  minY -= GRAPH_VIEW_PADDING;
  maxY += GRAPH_VIEW_PADDING;

  const width = Math.max(GRAPH_VIEW_MIN_WIDTH, maxX - minX);
  const height = Math.max(GRAPH_VIEW_MIN_HEIGHT, maxY - minY);
  return {
    x: roundView((minX + maxX) / 2 - width / 2),
    y: roundView((minY + maxY) / 2 - height / 2),
    width: roundView(width),
    height: roundView(height),
  };
}
