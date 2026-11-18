import {
  bstSnapshotSchema,
  type BstDeleteCase,
  type BstOperation,
  type BstResult,
  type BstSide,
  type BstSnapshot,
} from '../trace/schema';
import {
  layoutBinaryTree,
  type TreeLayoutEdge,
  type TreeLayoutNode,
} from './binaryTreeLayout';

export interface BstVisualNode extends TreeLayoutNode {
  active: boolean;
  compared: boolean;
  onPath: boolean;
  target: boolean;
  successor: boolean;
  inserted: boolean;
}

export interface BstVisualEdge extends TreeLayoutEdge {
  onPath: boolean;
  active: boolean;
}

export interface BstRemovedVisual {
  id: string;
  value: number;
  parentId: string | null;
  side: BstSide | null;
  role: 'target' | 'successor';
  replacementId: string | null;
}

export interface BstVisualModel {
  kind: 'bst';
  command: BstSnapshot['command'];
  operation: BstOperation;
  deleteCase: BstDeleteCase | null;
  targetValue: number;
  rootId: string | null;
  currentNodeId: string | null;
  nextNodeId: string | null;
  pathIds: string[];
  visitedIds: string[];
  inorderIds: string[];
  targetNodeId: string | null;
  insertedId: string | null;
  successorId: string | null;
  replacementId: string | null;
  parentId: string | null;
  side: BstSide | null;
  removed: BstRemovedVisual | null;
  oldRootId: string | null;
  result: BstResult | null;
  nodes: BstVisualNode[];
  edges: BstVisualEdge[];
  width: number;
  height: number;
  empty: boolean;
  label: string;
}

/**
 * Pure mapping from the recorded BST snapshot to a deterministic tree model.
 * The renderer never infers parent links, a successor, a removed node or the
 * listed in-order result from screen positions; every one of them is a field
 * captured by the real Python run.
 */
export function buildBstModel(
  snapshot: BstSnapshot,
  emptyLabel: string,
): BstVisualModel | null {
  const parsed = bstSnapshotSchema.safeParse(snapshot);
  if (!parsed.success) return null;
  const valid = parsed.data;
  const layout = layoutBinaryTree(valid.nodes, valid.rootId);
  const pathSet = new Set(valid.pathIds);
  const visitedSet = new Set(valid.visitedIds);
  const targetSet = new Set(valid.targetNodeId ? [valid.targetNodeId] : []);
  const successorSet = new Set(valid.successorId ? [valid.successorId] : []);
  const insertedSet = new Set(valid.insertedId ? [valid.insertedId] : []);

  const nodes: BstVisualNode[] = layout.nodes.map((node) => ({
    ...node,
    active: node.id === valid.currentNodeId,
    compared: visitedSet.has(node.id),
    onPath: pathSet.has(node.id),
    target: targetSet.has(node.id),
    successor: successorSet.has(node.id),
    inserted: insertedSet.has(node.id),
  }));

  const edges: BstVisualEdge[] = layout.edges.map((edge) => ({
    ...edge,
    onPath: pathSet.has(edge.fromId) && pathSet.has(edge.toId),
    active:
      (valid.operation === 'go-left' || valid.operation === 'go-right') &&
      edge.fromId === valid.currentNodeId &&
      edge.toId === valid.nextNodeId,
  }));

  return {
    kind: 'bst',
    command: valid.command,
    operation: valid.operation,
    deleteCase: valid.deleteCase,
    targetValue: valid.targetValue,
    rootId: valid.rootId,
    currentNodeId: valid.currentNodeId,
    nextNodeId: valid.nextNodeId,
    pathIds: valid.pathIds,
    visitedIds: valid.visitedIds,
    inorderIds: valid.inorderIds,
    targetNodeId: valid.targetNodeId,
    insertedId: valid.insertedId,
    successorId: valid.successorId,
    replacementId: valid.replacementId,
    parentId: valid.parentId,
    side: valid.side,
    removed: valid.removedNode,
    oldRootId: valid.oldRootId,
    result: valid.result,
    nodes,
    edges,
    width: layout.width,
    height: layout.height,
    empty: nodes.length === 0,
    label: emptyLabel,
  };
}
