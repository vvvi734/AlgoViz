/**
 * TEXTBOOK-09: B+ tree layout. Internal nodes and the leaf chain are both part
 * of the real model: leaf links are drawn from actual `next` ids, never from a
 * decorative in-order guess.
 */
import type { BplusTreeSnapshot, BplusSplit } from '../trace/bplusSchema';

export const BPLUS_NODE_H = 46;
export const BPLUS_KEY_W = 46;
export const BPLUS_NODE_PAD = 12;
export const BPLUS_LEVEL_GAP = 76;
export const BPLUS_SIBLING_GAP = 34;

export interface BplusKeyModel {
  index: number;
  value: number;
  x: number;
  width: number;
  compared: boolean;
  inserted: boolean;
  promoted: boolean;
}

export interface BplusNodeModel {
  id: string;
  keys: BplusKeyModel[];
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
  splitLeft: boolean;
  splitRight: boolean;
  newRoot: boolean;
  rangeScanned: boolean;
}

export interface BplusEdgeModel {
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
}

export interface BplusLeafLinkModel {
  id: string;
  fromId: string;
  toId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  scanned: boolean;
}

export interface BplusVisualModel {
  kind: 'bplus-tree';
  command: BplusTreeSnapshot['command'];
  operation: BplusTreeSnapshot['operation'];
  targetValue: number;
  rangeEnd: number;
  rootId: string | null;
  nodes: BplusNodeModel[];
  edges: BplusEdgeModel[];
  leafLinks: BplusLeafLinkModel[];
  pathIds: string[];
  currentNodeId: string | null;
  rangeKeys: number[];
  rangeLeafIds: string[];
  split: BplusSplit | null;
  insertedKey: number | null;
  result: BplusTreeSnapshot['result'];
  empty: boolean;
  width: number;
  height: number;
}

function nodeWidth(keyCount: number): number {
  return BPLUS_NODE_PAD * 2 + Math.max(1, keyCount) * BPLUS_KEY_W;
}

export function buildBplusModel(snapshot: BplusTreeSnapshot): BplusVisualModel {
  const byId = new Map(snapshot.nodes.map((node) => [node.id, node]));
  const pathSet = new Set(snapshot.pathIds);
  const pathPairs = new Set(
    snapshot.pathIds.slice(1).map((id, index) => `${snapshot.pathIds[index]}->${id}`),
  );
  const rangeLeafSet = new Set(snapshot.rangeLeafIds);
  const split = snapshot.split;
  const cache = new Map<string, number>();
  const visiting = new Set<string>();

  const subtreeWidth = (id: string): number => {
    const cached = cache.get(id);
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
      cache.set(id, own);
      visiting.delete(id);
      return own;
    }
    const childrenWidth =
      node.children.reduce((total, child) => total + subtreeWidth(child), 0) +
      BPLUS_SIBLING_GAP * (node.children.length - 1);
    const width = Math.max(own, childrenWidth);
    cache.set(id, width);
    visiting.delete(id);
    return width;
  };

  if (!snapshot.rootId || snapshot.nodes.length === 0) {
    return {
      kind: 'bplus-tree',
      command: snapshot.command,
      operation: snapshot.operation,
      targetValue: snapshot.targetValue,
      rangeEnd: snapshot.rangeEnd,
      rootId: null,
      nodes: [],
      edges: [],
      leafLinks: [],
      pathIds: [],
      currentNodeId: null,
      rangeKeys: [...snapshot.rangeKeys],
      rangeLeafIds: [...snapshot.rangeLeafIds],
      split,
      insertedKey: snapshot.insertedKey,
      result: snapshot.result,
      empty: true,
      width: 760,
      height: 230,
    };
  }

  const totalWidth = subtreeWidth(snapshot.rootId);
  const leftMargin = 34;
  const top = 82;
  const nodes: BplusNodeModel[] = [];
  const positions = new Map<string, BplusNodeModel>();

  const place = (id: string, left: number, depth: number): void => {
    const node = byId.get(id);
    if (!node) return;
    const width = subtreeWidth(id);
    const ownWidth = nodeWidth(node.keys.length);
    const center = left + width / 2;
    const x = center - ownWidth / 2;
    const y = top + depth * (BPLUS_NODE_H + BPLUS_LEVEL_GAP);
    const model: BplusNodeModel = {
      id,
      keys: node.keys.map((value, index) => ({
        index,
        value,
        x: x + BPLUS_NODE_PAD + index * BPLUS_KEY_W,
        width: BPLUS_KEY_W,
        compared:
          snapshot.currentNodeId === id &&
          snapshot.compareIndex === index &&
          snapshot.compareKey === value,
        inserted:
          snapshot.insertedKey === value &&
          node.leaf &&
          snapshot.operation === 'insert-leaf',
        promoted:
          split !== null &&
          split.parentId === id &&
          split.promotedKey === value,
      })),
      children: [...node.children],
      leaf: node.leaf,
      depth,
      x,
      y,
      width: ownWidth,
      height: BPLUS_NODE_H,
      active: snapshot.currentNodeId === id,
      onPath: pathSet.has(id),
      selected: snapshot.childId === id,
      splitLeft: split !== null && split.leftId === id,
      splitRight: split !== null && split.rightId === id,
      newRoot: split !== null && split.rootChanged && snapshot.rootId === id,
      rangeScanned: rangeLeafSet.has(id),
    };
    nodes.push(model);
    positions.set(id, model);

    if (node.children.length === 0) return;
    const childWidths = node.children.map((child) => subtreeWidth(child));
    const childrenTotal =
      childWidths.reduce((sum, child) => sum + child, 0) +
      BPLUS_SIBLING_GAP * (node.children.length - 1);
    let childLeft = center - childrenTotal / 2;
    node.children.forEach((child, index) => {
      place(child, childLeft, depth + 1);
      childLeft += childWidths[index] + BPLUS_SIBLING_GAP;
    });
  };

  place(snapshot.rootId, leftMargin, 0);

  const edges: BplusEdgeModel[] = [];
  for (const node of nodes) {
    node.children.forEach((childId, slot) => {
      const child = positions.get(childId);
      if (!child) return;
      const slotX = node.x + BPLUS_NODE_PAD + slot * BPLUS_KEY_W;
      edges.push({
        id: `${node.id}-${slot}-${childId}`,
        fromId: node.id,
        toId: childId,
        slot,
        x1: slotX,
        y1: node.y + BPLUS_NODE_H,
        x2: child.x + child.width / 2,
        y2: child.y,
        onPath: pathPairs.has(`${node.id}->${childId}`),
        selected: snapshot.currentNodeId === node.id && snapshot.childSlot === slot,
      });
    });
  }

  const leafLinks: BplusLeafLinkModel[] = [];
  snapshot.leafOrder.forEach((leafId) => {
    const from = positions.get(leafId);
    const nextId = byId.get(leafId)?.next;
    const to = nextId ? positions.get(nextId) : undefined;
    if (!from || !to || !nextId) return;
    leafLinks.push({
      id: `${leafId}-${nextId}`,
      fromId: leafId,
      toId: nextId,
      x1: from.x + from.width,
      y1: from.y + from.height / 2,
      x2: to.x,
      y2: to.y + to.height / 2,
      scanned: rangeLeafSet.has(leafId) && rangeLeafSet.has(nextId),
    });
  });

  const bottom = nodes.reduce((max, node) => Math.max(max, node.y + node.height), 0);
  return {
    kind: 'bplus-tree',
    command: snapshot.command,
    operation: snapshot.operation,
    targetValue: snapshot.targetValue,
    rangeEnd: snapshot.rangeEnd,
    rootId: snapshot.rootId,
    nodes,
    edges,
    leafLinks,
    pathIds: [...snapshot.pathIds],
    currentNodeId: snapshot.currentNodeId,
    rangeKeys: [...snapshot.rangeKeys],
    rangeLeafIds: [...snapshot.rangeLeafIds],
    split,
    insertedKey: snapshot.insertedKey,
    result: snapshot.result,
    empty: false,
    width: Math.max(560, Math.ceil(totalWidth + leftMargin * 2)),
    height: Math.max(280, Math.ceil(bottom + 78)),
  };
}
