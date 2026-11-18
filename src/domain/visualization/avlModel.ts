import {
  avlSnapshotSchema,
  type AvlDeleteCase,
  type AvlOperation,
  type AvlResult,
  type AvlRotationCase,
  type AvlRotationPhase,
  type AvlSnapshot,
  type BstSide,
} from '../trace/schema';
import {
  layoutBinaryTree,
  type TreeLayoutEdge,
  type TreeLayoutNode,
} from './binaryTreeLayout';

export interface AvlVisualNode extends TreeLayoutNode {
  active: boolean;
  compared: boolean;
  onPath: boolean;
  target: boolean;
  successor: boolean;
  inserted: boolean;
  imbalance: boolean;
  pivot: boolean;
  promoted: boolean;
  height: number;
  balance: number;
}

export interface AvlVisualEdge extends TreeLayoutEdge {
  onPath: boolean;
  active: boolean;
  rotating: boolean;
}

export interface AvlRemovedVisual {
  id: string;
  value: number;
  parentId: string | null;
  side: BstSide | null;
  role: 'target' | 'successor';
  replacementId: string | null;
}

export interface AvlVisualModel {
  kind: 'avl';
  command: AvlSnapshot['command'];
  operation: AvlOperation;
  deleteCase: AvlDeleteCase | null;
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
  removed: AvlRemovedVisual | null;
  oldRootId: string | null;
  imbalanceId: string | null;
  rotationCase: AvlRotationCase | null;
  rotationPhase: AvlRotationPhase | null;
  pivotId: string | null;
  promotedId: string | null;
  rotationStep: number | null;
  rotationTotal: number | null;
  result: AvlResult | null;
  nodes: AvlVisualNode[];
  edges: AvlVisualEdge[];
  width: number;
  height: number;
  empty: boolean;
  label: string;
}

/**
 * Pure mapping from the recorded AVL snapshot to a deterministic tree model.
 * Heights, balance factors, the imbalance node and the rotation pivot all come
 * from the real Python snapshot; nothing is recomputed from screen coordinates.
 */
export function buildAvlModel(
  snapshot: AvlSnapshot,
  emptyLabel: string,
): AvlVisualModel | null {
  const parsed = avlSnapshotSchema.safeParse(snapshot);
  if (!parsed.success) return null;
  const valid = parsed.data;
  const layout = layoutBinaryTree(valid.nodes, valid.rootId);
  const pathSet = new Set(valid.pathIds);
  const visitedSet = new Set(valid.visitedIds);
  const targetSet = new Set(valid.targetNodeId ? [valid.targetNodeId] : []);
  const successorSet = new Set(valid.successorId ? [valid.successorId] : []);
  const insertedSet = new Set(valid.insertedId ? [valid.insertedId] : []);

  const nodes: AvlVisualNode[] = layout.nodes.map((node) => {
    const real = valid.nodes.find((item) => item.id === node.id);
    return {
      ...node,
      active: node.id === valid.currentNodeId,
      compared: visitedSet.has(node.id),
      onPath: pathSet.has(node.id),
      target: targetSet.has(node.id),
      successor: successorSet.has(node.id),
      inserted: insertedSet.has(node.id),
      imbalance: node.id === valid.imbalanceId && valid.rotationPhase !== 'after',
      pivot: node.id === valid.pivotId,
      promoted: node.id === valid.promotedId,
      height: real?.height ?? 1,
      balance: real?.balance ?? 0,
    };
  });

  const rotationNodes = new Set(
    [valid.pivotId, valid.promotedId].filter((id): id is string => id !== null),
  );
  const edges: AvlVisualEdge[] = layout.edges.map((edge) => ({
    ...edge,
    onPath: pathSet.has(edge.fromId) && pathSet.has(edge.toId),
    active:
      (valid.operation === 'go-left' || valid.operation === 'go-right') &&
      edge.fromId === valid.currentNodeId &&
      edge.toId === valid.nextNodeId,
    rotating: rotationNodes.has(edge.fromId) || rotationNodes.has(edge.toId),
  }));

  return {
    kind: 'avl',
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
    imbalanceId: valid.imbalanceId,
    rotationCase: valid.rotationCase,
    rotationPhase: valid.rotationPhase,
    pivotId: valid.pivotId,
    promotedId: valid.promotedId,
    rotationStep: valid.rotationStep,
    rotationTotal: valid.rotationTotal,
    result: valid.result,
    nodes,
    edges,
    width: layout.width,
    height: layout.height,
    empty: nodes.length === 0,
    label: emptyLabel,
  };
}
