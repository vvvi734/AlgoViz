import type { ThreadedTreeSnapshot, ThreadedTreeNode } from '../trace/schema';
import { layoutBinaryTree, TREE_NODE_H, TREE_NODE_W } from './binaryTreeLayout';

/**
 * Pure threaded-tree layout. Real child links are solid; tagged null pointers
 * become dashed predecessor/successor threads. Nodes are never positioned from
 * the thread graph, so scrubbing cannot make the underlying tree move.
 */

export type ThreadedNodeTone = 'active' | 'prev' | 'visited' | 'threaded' | 'normal';

export interface ThreadedNodeModel {
  id: string;
  value: unknown;
  x: number;
  y: number;
  leftId: string | null;
  rightId: string | null;
  ltag: 0 | 1;
  rtag: 0 | 1;
  leftThreadId: string | null;
  rightThreadId: string | null;
  tone: ThreadedNodeTone;
  role: 'root' | 'leaf' | 'internal';
}

export interface ThreadedChildEdge {
  fromId: string;
  toId: string;
  side: 'left' | 'right';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface ThreadedThreadEdge {
  fromId: string;
  /** Null means the tagged pointer is the terminal null thread. */
  toId: string | null;
  side: 'left' | 'right';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Stub direction when the thread target is null. */
  stub: boolean;
}

export interface ThreadedTreeVisualModel {
  kind: 'threaded-tree';
  phase: ThreadedTreeSnapshot['phase'];
  operation: ThreadedTreeSnapshot['operation'];
  nodes: ThreadedNodeModel[];
  childEdges: ThreadedChildEdge[];
  threadEdges: ThreadedThreadEdge[];
  rootId: string | null;
  currentNodeId: string | null;
  prevId: string | null;
  visitedIds: string[];
  threadedCount: number;
  width: number;
  height: number;
  done: boolean;
}

function toneFor(
  node: ThreadedTreeNode,
  snapshot: ThreadedTreeSnapshot,
): ThreadedNodeTone {
  if (node.id === snapshot.currentNodeId) return 'active';
  if (node.id === snapshot.prevId) return 'prev';
  if (snapshot.visitedIds.includes(node.id)) return 'visited';
  if (node.ltag === 1 || node.rtag === 1) return 'threaded';
  return 'normal';
}

function stubPoint(
  node: { x: number; y: number },
  side: 'left' | 'right',
): { x: number; y: number } {
  return side === 'left'
    ? { x: node.x - TREE_NODE_W / 2 - 18, y: node.y + TREE_NODE_H / 2 - 8 }
    : { x: node.x + TREE_NODE_W / 2 + 18, y: node.y + TREE_NODE_H / 2 - 8 };
}

export function buildThreadedTreeModel(
  snapshot: ThreadedTreeSnapshot,
  emptyLabel: string,
): ThreadedTreeVisualModel | { kind: 'empty'; text: string } {
  if (snapshot.nodes.length === 0) return { kind: 'empty', text: emptyLabel };
  const layout = layoutBinaryTree(
    snapshot.nodes.map((node) => ({
      id: node.id,
      value: node.value,
      leftId: node.leftId,
      rightId: node.rightId,
    })),
    snapshot.rootId,
  );
  if (layout.nodes.length === 0) return { kind: 'empty', text: emptyLabel };

  const nodes: ThreadedNodeModel[] = layout.nodes.map((node) => {
    const source = snapshot.nodes.find((item) => item.id === node.id) as ThreadedTreeNode;
    return {
      id: node.id,
      value: node.value,
      x: node.x,
      y: node.y,
      leftId: source.leftId,
      rightId: source.rightId,
      ltag: source.ltag,
      rtag: source.rtag,
      leftThreadId: source.leftThreadId,
      rightThreadId: source.rightThreadId,
      role: node.role,
      tone: toneFor(source, snapshot),
    };
  });
  const byId = new Map(nodes.map((node) => [node.id, node]));

  const childEdges: ThreadedChildEdge[] = layout.edges.map((edge) => ({
    fromId: edge.fromId,
    toId: edge.toId,
    side: edge.side,
    x1: edge.x1,
    y1: edge.y1,
    x2: edge.x2,
    y2: edge.y2,
  }));

  const threadEdges: ThreadedThreadEdge[] = [];
  for (const node of nodes) {
    for (const side of ['left', 'right'] as const) {
      const tag = side === 'left' ? node.ltag : node.rtag;
      if (tag !== 1) continue;
      const targetId = side === 'left' ? node.leftThreadId : node.rightThreadId;
      const target = targetId ? byId.get(targetId) : undefined;
      const start = {
        x: side === 'left' ? node.x - TREE_NODE_W / 2 + 4 : node.x + TREE_NODE_W / 2 - 4,
        y: node.y + TREE_NODE_H / 2 - 4,
      };
      const end = target
        ? {
            x: side === 'left' ? target.x - TREE_NODE_W / 2 + 8 : target.x + TREE_NODE_W / 2 - 8,
            y: target.y + (target.y <= node.y ? -TREE_NODE_H / 2 + 4 : TREE_NODE_H / 2 - 4),
          }
        : stubPoint(node, side);
      threadEdges.push({
        fromId: node.id,
        toId: target?.id ?? null,
        side,
        x1: start.x,
        y1: start.y,
        x2: end.x,
        y2: end.y,
        stub: !target,
      });
    }
  }

  return {
    kind: 'threaded-tree',
    phase: snapshot.phase,
    operation: snapshot.operation,
    nodes,
    childEdges,
    threadEdges,
    rootId: snapshot.rootId,
    currentNodeId: snapshot.currentNodeId,
    prevId: snapshot.prevId,
    visitedIds: snapshot.visitedIds,
    threadedCount: snapshot.threadedCount,
    width: layout.width,
    height: layout.height,
    done: snapshot.phase === 'done',
  };
}
