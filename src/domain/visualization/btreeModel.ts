/**
 * SEARCH-04: pure layout for the order-4 B-tree canvas.
 *
 * The snapshot already owns every key, child pointer and split detail. This
 * module only assigns coordinates: node boxes are horizontal, child edges leave
 * from the boundary slots between keys, and wide/deep trees scroll instead of
 * shrinking the 18px key text.
 */
import type { BtreeDeleteInfo, BtreeOperation, BtreeResult, BtreeSnapshot } from '../trace/schema';

export const BTREE_NODE_H = 46;
export const BTREE_KEY_W = 42;
export const BTREE_NODE_PAD = 14;
export const BTREE_LEVEL_GAP = 42;
export const BTREE_SIBLING_GAP = 28;

export interface BTreeKeyModel {
  index: number;
  value: number;
  x: number;
  width: number;
  compared: boolean;
  inserted: boolean;
  promoted: boolean;
}

export interface BTreeNodeModel {
  id: string;
  keys: BTreeKeyModel[];
  children: string[];
  leaf: boolean;
  depth: number;
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  onPath: boolean;
  selected: boolean;
  splitBefore: boolean;
  splitLeft: boolean;
  splitRight: boolean;
  newRoot: boolean;
}

export interface BTreeEdgeModel {
  id: string;
  fromId: string;
  toId: string;
  slot: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  onPath: boolean;
  selected: boolean;
  inSubtree: boolean;
}

export interface BTreeSplitModel {
  nodeId: string;
  phase: 'before' | 'after';
  leftId: string | null;
  rightId: string | null;
  promotedKey: number | null;
  parentId: string | null;
  rootChanged: boolean;
  promotedNodeId: string | null;
  promotedIndex: number | null;
}

export interface BTreeVisualModel {
  kind: 'btree';
  order: 4;
  command: 'find' | 'insert' | 'delete';
  operation: BtreeOperation;
  targetValue: number;
  rootId: string | null;
  nodes: BTreeNodeModel[];
  edges: BTreeEdgeModel[];
  pathIds: string[];
  currentNodeId: string | null;
  selectedSubtreeIds: string[];
  split: BTreeSplitModel | null;
  deleteInfo: BtreeDeleteInfo | null;
  deleteAffectedIds: string[];
  insertedKey: number | null;
  result: BtreeResult | null;
  empty: boolean;
  width: number;
  height: number;
}

function nodeWidth(keyCount: number): number {
  return Math.max(70, keyCount * BTREE_KEY_W + BTREE_NODE_PAD * 2);
}

function descendants(rootId: string, byId: Map<string, BtreeSnapshot['nodes'][number]>): string[] {
  const result: string[] = [];
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop() as string;
    const node = byId.get(id);
    if (!node) continue;
    result.push(id);
    for (const child of node.children) stack.push(child);
  }
  return result;
}

export function buildBTreeModel(snapshot: BtreeSnapshot): BTreeVisualModel {
  const byId = new Map(snapshot.nodes.map((node) => [node.id, node]));
  const pathSet = new Set(snapshot.pathIds);
  const pathPairs = new Set(
    snapshot.pathIds.slice(1).map((id, index) => `${snapshot.pathIds[index]}->${id}`),
  );
  const selectedSubtreeIds = snapshot.childId ? descendants(snapshot.childId, byId) : [];
  const selectedSet = new Set(selectedSubtreeIds);
  const split = snapshot.split
    ? {
        ...snapshot.split,
        promotedNodeId: snapshot.split.parentId,
        promotedIndex: snapshot.split.parentId && snapshot.split.promotedKey !== null
          ? (byId.get(snapshot.split.parentId)?.keys.indexOf(snapshot.split.promotedKey) ?? -1)
          : null,
      }
    : null;
  const deleteAffectedIds = snapshot.deleteInfo
    ? [snapshot.currentNodeId, snapshot.deleteInfo.parentId, snapshot.deleteInfo.siblingId]
        .filter((id): id is string => id !== null && byId.has(id))
    : [];

  if (!snapshot.rootId || snapshot.nodes.length === 0) {
    return {
      kind: 'btree',
      order: 4,
      command: snapshot.command,
      operation: snapshot.operation,
      targetValue: snapshot.targetValue,
      rootId: null,
      nodes: [],
      edges: [],
      pathIds: [],
      currentNodeId: null,
      selectedSubtreeIds: [],
      split: split ? { ...split, promotedIndex: null } : null,
      deleteInfo: snapshot.deleteInfo,
      deleteAffectedIds: [],
      insertedKey: snapshot.insertedKey,
      result: snapshot.result,
      empty: true,
      width: 760,
      height: 230,
    };
  }

  const subtreeWidthCache = new Map<string, number>();
  const visiting = new Set<string>();
  const subtreeWidth = (id: string): number => {
    const cached = subtreeWidthCache.get(id);
    if (cached !== undefined) return cached;
    if (visiting.has(id)) return nodeWidth(1);
    visiting.add(id);
    const node = byId.get(id);
    if (!node) {
      visiting.delete(id);
      return nodeWidth(1);
    }
    const own = nodeWidth(node.keys.length);
    if (node.children.length === 0) {
      subtreeWidthCache.set(id, own);
      visiting.delete(id);
      return own;
    }
    const childrenWidth =
      node.children.reduce((total, child) => total + subtreeWidth(child), 0) +
      BTREE_SIBLING_GAP * (node.children.length - 1);
    const width = Math.max(own, childrenWidth);
    subtreeWidthCache.set(id, width);
    visiting.delete(id);
    return width;
  };

  const totalWidth = subtreeWidth(snapshot.rootId);
  const leftMargin = 32;
  const top = 76;
  const nodes: BTreeNodeModel[] = [];
  const position = new Map<string, BTreeNodeModel>();

  const place = (id: string, left: number, depth: number): void => {
    const node = byId.get(id);
    if (!node) return;
    const width = subtreeWidth(id);
    const ownWidth = nodeWidth(node.keys.length);
    const center = left + width / 2;
    const x = center - ownWidth / 2;
    const y = top + depth * (BTREE_NODE_H + BTREE_LEVEL_GAP);
    const model: BTreeNodeModel = {
      id,
      keys: node.keys.map((value, index) => ({
        index,
        value,
        x: x + BTREE_NODE_PAD + index * BTREE_KEY_W,
        width: BTREE_KEY_W,
        compared:
          snapshot.currentNodeId === id &&
          snapshot.compareIndex === index &&
          snapshot.compareKey === value,
        inserted:
          snapshot.operation === 'insert' &&
          snapshot.insertedKey === value &&
          node.keys.includes(value),
        promoted:
          split !== null &&
          split.phase === 'after' &&
          split.promotedIndex === index &&
          split.promotedNodeId === id,
      })),
      children: [...node.children],
      leaf: node.leaf,
      depth,
      x,
      y,
      width: ownWidth,
      height: BTREE_NODE_H,
      active: snapshot.currentNodeId === id,
      onPath: pathSet.has(id),
      selected: snapshot.childId === id,
      splitBefore: split !== null && split.phase === 'before' && split.nodeId === id,
      splitLeft: split !== null && split.phase === 'after' && split.leftId === id,
      splitRight: split !== null && split.phase === 'after' && split.rightId === id,
      newRoot:
        (split !== null && split.phase === 'after' && split.rootChanged && snapshot.rootId === id) ||
        (snapshot.operation === 'root-shrink' && snapshot.rootId === id),
    };
    nodes.push(model);
    position.set(id, model);

    if (node.children.length === 0) return;
    const childWidths = node.children.map((child) => subtreeWidth(child));
    const childrenTotal =
      childWidths.reduce((sum, child) => sum + child, 0) +
      BTREE_SIBLING_GAP * (node.children.length - 1);
    let childLeft = center - childrenTotal / 2;
    node.children.forEach((child, index) => {
      place(child, childLeft, depth + 1);
      childLeft += childWidths[index] + BTREE_SIBLING_GAP;
    });
  };

  place(snapshot.rootId, leftMargin, 0);

  const edges: BTreeEdgeModel[] = [];
  for (const node of nodes) {
    node.children.forEach((childId, slot) => {
      const child = position.get(childId);
      if (!child) return;
      const x1 = node.x + BTREE_NODE_PAD + slot * BTREE_KEY_W;
      const y1 = node.y + BTREE_NODE_H;
      const x2 = child.x + child.width / 2;
      const y2 = child.y;
      edges.push({
        id: `${node.id}-${slot}-${childId}`,
        fromId: node.id,
        toId: childId,
        slot,
        x1,
        y1,
        x2,
        y2,
        onPath: pathPairs.has(`${node.id}->${childId}`),
        selected: snapshot.currentNodeId === node.id && snapshot.childSlot === slot,
        inSubtree: selectedSet.has(childId),
      });
    });
  }

  const bottom = nodes.reduce((max, node) => Math.max(max, node.y + node.height), 0);
  return {
    kind: 'btree',
    order: 4,
    command: snapshot.command,
    operation: snapshot.operation,
    targetValue: snapshot.targetValue,
    rootId: snapshot.rootId,
    nodes,
    edges,
    pathIds: [...snapshot.pathIds],
    currentNodeId: snapshot.currentNodeId,
    selectedSubtreeIds,
    split,
    deleteInfo: snapshot.deleteInfo,
    deleteAffectedIds,
    insertedKey: snapshot.insertedKey,
    result: snapshot.result,
    empty: false,
    width: Math.max(480, Math.ceil(totalWidth + leftMargin * 2)),
    height: Math.max(240, Math.ceil(bottom + 58)),
  };
}
