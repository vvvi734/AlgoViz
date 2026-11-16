import {
  binaryTreeSnapshotSchema,
  type BinaryTreeOperation,
  type BinaryTreeSnapshot,
  type BinaryTreeTraversal,
} from '../trace/schema';
import {
  layoutBinaryTree,
  type TreeLayoutEdge,
  type TreeLayoutNode,
} from './binaryTreeLayout';

export interface BinaryTreeVisualNode extends TreeLayoutNode {
  active: boolean;
  visited: boolean;
  /** 1-based real visit order, or null before the node was visited. */
  visitOrder: number | null;
  onPath: boolean;
}

export interface BinaryTreeVisualEdge extends TreeLayoutEdge {
  /** Both endpoints are on the recorded root→current recursion path. */
  onPath: boolean;
  /** The operation is about to enter this real child edge. */
  active: boolean;
}

export interface BinaryTreeVisualModel {
  kind: 'binary-tree';
  traversal: BinaryTreeTraversal;
  operation: BinaryTreeOperation;
  rootId: string | null;
  currentNodeId: string | null;
  /** Child that `left`/`right` is about to enter; null for other operations. */
  nextChildId: string | null;
  visitedIds: string[];
  pathIds: string[];
  nodes: BinaryTreeVisualNode[];
  edges: BinaryTreeVisualEdge[];
  width: number;
  height: number;
  empty: boolean;
  label: string;
}

/**
 * Pure mapping from the recorded binary-tree snapshot to a renderable model.
 * The renderer never infers a visit, an edge or a recursion path: every status
 * comes from `visitedIds`, `pathIds` and the explicit operation.
 */
export function buildBinaryTreeModel(
  snapshot: BinaryTreeSnapshot,
  emptyLabel: string,
): BinaryTreeVisualModel | null {
  const parsed = binaryTreeSnapshotSchema.safeParse(snapshot);
  if (!parsed.success) return null;
  const valid = parsed.data;
  const layout = layoutBinaryTree(valid.nodes, valid.rootId);
  const visitedOrder = new Map(valid.visitedIds.map((id, index) => [id, index + 1]));
  const pathSet = new Set(valid.pathIds);
  let nextChildId: string | null = null;
  if (valid.currentNodeId !== null && (valid.operation === 'left' || valid.operation === 'right')) {
    const current = valid.nodes.find((node) => node.id === valid.currentNodeId);
    nextChildId = current?.[valid.operation === 'left' ? 'leftId' : 'rightId'] ?? null;
  }

  const nodes: BinaryTreeVisualNode[] = layout.nodes.map((node) => ({
    ...node,
    active: node.id === valid.currentNodeId,
    visited: visitedOrder.has(node.id),
    visitOrder: visitedOrder.get(node.id) ?? null,
    onPath: pathSet.has(node.id),
  }));
  const edges: BinaryTreeVisualEdge[] = layout.edges.map((edge) => ({
    ...edge,
    onPath: pathSet.has(edge.fromId) && pathSet.has(edge.toId),
    // For a left/right operation the parent is current and the child is the
    // real next node. For an `enter` frame, the last path edge is the real one
    // just descended; `pathIds` already covers it.
    active:
      (valid.operation === 'left' || valid.operation === 'right') &&
      edge.fromId === valid.currentNodeId &&
      edge.toId === nextChildId,
  }));

  return {
    kind: 'binary-tree',
    traversal: valid.traversal,
    operation: valid.operation,
    rootId: valid.rootId,
    currentNodeId: valid.currentNodeId,
    nextChildId,
    visitedIds: valid.visitedIds,
    pathIds: valid.pathIds,
    nodes,
    edges,
    width: layout.width,
    height: layout.height,
    empty: nodes.length === 0,
    label: emptyLabel,
  };
}
