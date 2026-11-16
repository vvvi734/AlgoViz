import type { BinaryTreeNode } from '../trace/schema';

/**
 * Stage 7D geometry constants. The layout is intentionally deterministic: the
 * same tree snapshot always produces byte-identical coordinates, regardless of
 * the current frame or viewport, so scrubbing never makes nodes jump.
 */
export const TREE_NODE_W = 64;
export const TREE_NODE_H = 52;
export const TREE_COL_GAP = 36;
export const TREE_COL_W = TREE_NODE_W + TREE_COL_GAP;
export const TREE_ROW_H = 88;
export const TREE_MARGIN_X = 32;
export const TREE_MARGIN_Y = 24;

export interface TreeLayoutNode {
  id: string;
  value: unknown;
  leftId: string | null;
  rightId: string | null;
  /** Center coordinates in the SVG viewBox. */
  x: number;
  y: number;
  depth: number;
  column: number;
  role: 'root' | 'leaf' | 'internal';
}

export interface TreeLayoutEdge {
  fromId: string;
  toId: string;
  side: 'left' | 'right';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  depth: number;
}

export interface BinaryTreeLayout {
  nodes: TreeLayoutNode[];
  edges: TreeLayoutEdge[];
  width: number;
  height: number;
  rootId: string | null;
}

const EMPTY_LAYOUT: BinaryTreeLayout = { nodes: [], edges: [], width: 0, height: 0, rootId: null };

/**
 * Lay out a real binary tree using in-order columns and depth rows.
 *
 *  - In-order traversal assigns one column per node: every left subtree sits
 *    to the left of its parent and every right subtree to the right.
 *  - Depth assigns the row, so the root is always on top.
 *  - The walk is iterative and guard-railed by a `seen` set: a malformed or
 *    cyclic snapshot can never hang the UI, even if a caller bypasses Schema.
 *  - Unreachable nodes are ignored here; the Schema rejects them before traces
 *    reach the renderer.
 */
export function layoutBinaryTree(
  nodes: readonly BinaryTreeNode[],
  rootId: string | null,
): BinaryTreeLayout {
  if (!rootId || nodes.length === 0) return EMPTY_LAYOUT;
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const root = byId.get(rootId);
  if (!root) return EMPTY_LAYOUT;

  // Depth-first pass with an explicit seen set. Only real references are
  // followed; this establishes reachability and per-node depth.
  const depths = new Map<string, number>();
  const visitStack: Array<{ id: string; depth: number }> = [{ id: rootId, depth: 0 }];
  while (visitStack.length) {
    const entry = visitStack.pop() as { id: string; depth: number };
    if (depths.has(entry.id)) continue;
    const node = byId.get(entry.id);
    if (!node) continue;
    depths.set(entry.id, entry.depth);
    if (node.rightId !== null && byId.has(node.rightId)) {
      visitStack.push({ id: node.rightId, depth: entry.depth + 1 });
    }
    if (node.leftId !== null && byId.has(node.leftId)) {
      visitStack.push({ id: node.leftId, depth: entry.depth + 1 });
    }
  }

  // Iterative in-order traversal assigns stable columns. A second `seen` set
  // and a bounded loop protect against cycles independently of the depth pass.
  const columns = new Map<string, number>();
  const inOrderSeen = new Set<string>();
  const stack: string[] = [];
  const inStack = new Set<string>();
  let current: string | null = rootId;
  let column = 0;
  let guard = 0;
  const maxSteps = nodes.length * 4 + 4;
  while ((current !== null || stack.length > 0) && guard < maxSteps) {
    guard += 1;
    while (current !== null) {
      if (inOrderSeen.has(current) || inStack.has(current)) {
        current = null;
        break;
      }
      stack.push(current);
      inStack.add(current);
      const node = byId.get(current);
      current = node && node.leftId !== null && byId.has(node.leftId) ? node.leftId : null;
    }
    const id = stack.pop();
    if (id === undefined) break;
    inStack.delete(id);
    if (inOrderSeen.has(id)) continue;
    inOrderSeen.add(id);
    columns.set(id, column);
    column += 1;
    const right = byId.get(id)?.rightId ?? null;
    current = right !== null && byId.has(right) && !inOrderSeen.has(right) ? right : null;
  }

  const layoutNodes: TreeLayoutNode[] = [];
  for (const node of nodes) {
    if (!depths.has(node.id) || !columns.has(node.id)) continue;
    const depth = depths.get(node.id) as number;
    const col = columns.get(node.id) as number;
    const role: TreeLayoutNode['role'] =
      node.id === rootId ? 'root' : node.leftId === null && node.rightId === null ? 'leaf' : 'internal';
    layoutNodes.push({
      id: node.id,
      value: node.value,
      leftId: node.leftId,
      rightId: node.rightId,
      x: TREE_MARGIN_X + TREE_NODE_W / 2 + col * TREE_COL_W,
      y: TREE_MARGIN_Y + TREE_NODE_H / 2 + depth * TREE_ROW_H,
      depth,
      column: col,
      role,
    });
  }
  layoutNodes.sort((a, b) => a.depth - b.depth || a.column - b.column);

  const edges: TreeLayoutEdge[] = [];
  for (const node of layoutNodes) {
    for (const [side, childId] of [
      ['left', node.leftId],
      ['right', node.rightId],
    ] as const) {
      const child = layoutNodes.find((candidate) => candidate.id === childId);
      if (!child) continue;
      edges.push({
        fromId: node.id,
        toId: child.id,
        side,
        x1: node.x,
        y1: node.y + TREE_NODE_H / 2 - 2,
        x2: child.x,
        y2: child.y - TREE_NODE_H / 2 + 2,
        depth: node.depth,
      });
    }
  }

  const maxColumn = Math.max(...layoutNodes.map((node) => node.column), 0);
  const maxDepth = Math.max(...layoutNodes.map((node) => node.depth), 0);
  return {
    nodes: layoutNodes,
    edges,
    width: TREE_MARGIN_X * 2 + TREE_NODE_W + maxColumn * TREE_COL_W,
    height: TREE_MARGIN_Y * 2 + TREE_NODE_H + maxDepth * TREE_ROW_H,
    rootId,
  };
}
