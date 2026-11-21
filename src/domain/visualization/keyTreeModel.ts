/**
 * TEXTBOOK-09: key-tree layout. Edges are real child links, labelled by the
 * child character. A double ring means `terminal`, not merely "has children".
 */
import type { KeyTreeSnapshot } from '../trace/keyTreeSchema';

export const KEY_TREE_NODE_R = 22;
export const KEY_TREE_LEVEL_GAP = 74;
export const KEY_TREE_LEAF_GAP = 18;

export interface KeyTreeNodeModel {
  id: string;
  char: string;
  depth: number;
  x: number;
  y: number;
  terminal: boolean;
  active: boolean;
  onPath: boolean;
  created: boolean;
  root: boolean;
}

export interface KeyTreeEdgeModel {
  id: string;
  fromId: string;
  toId: string;
  char: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  onPath: boolean;
}

export interface KeyTreeVisualModel {
  kind: 'key-tree';
  mode: KeyTreeSnapshot['mode'];
  target: string;
  operation: KeyTreeSnapshot['operation'];
  result: KeyTreeSnapshot['result'];
  rootId: string;
  nodes: KeyTreeNodeModel[];
  edges: KeyTreeEdgeModel[];
  pathIds: string[];
  currentNodeId: string | null;
  compareChar: string | null;
  matchedLength: number;
  createdNodeId: string | null;
  terminalNodeId: string | null;
  dictionary: string[];
  width: number;
  height: number;
}

export function buildKeyTreeModel(snapshot: KeyTreeSnapshot): KeyTreeVisualModel {
  const byId = new Map(snapshot.nodes.map((node) => [node.id, node]));
  const pathSet = new Set(snapshot.pathIds);
  const pathPairs = new Set(
    snapshot.pathIds.slice(1).map((id, index) => `${snapshot.pathIds[index]}->${id}`),
  );
  const widthCache = new Map<string, number>();
  const visiting = new Set<string>();

  const widthOf = (id: string): number => {
    const cached = widthCache.get(id);
    if (cached !== undefined) return cached;
    if (visiting.has(id)) return KEY_TREE_NODE_R * 2;
    visiting.add(id);
    const node = byId.get(id);
    if (!node || node.children.length === 0) {
      const width = KEY_TREE_NODE_R * 2;
      widthCache.set(id, width);
      visiting.delete(id);
      return width;
    }
    const children = [...node.children].sort((a, b) => {
      const ca = byId.get(a)?.char ?? '';
      const cb = byId.get(b)?.char ?? '';
      return ca.localeCompare(cb);
    });
    const width =
      children.reduce((total, child) => total + widthOf(child), 0) +
      KEY_TREE_LEAF_GAP * (children.length - 1);
    const result = Math.max(KEY_TREE_NODE_R * 2, width);
    widthCache.set(id, result);
    visiting.delete(id);
    return result;
  };

  const nodes: KeyTreeNodeModel[] = [];
  const positions = new Map<string, KeyTreeNodeModel>();
  const edges: KeyTreeEdgeModel[] = [];

  const place = (id: string, left: number, depth: number): void => {
    const node = byId.get(id);
    if (!node) return;
    const width = widthOf(id);
    const center = left + width / 2;
    const y = 76 + depth * KEY_TREE_LEVEL_GAP;
    const model: KeyTreeNodeModel = {
      id,
      char: node.char || '·',
      depth,
      x: center,
      y,
      terminal: node.terminal,
      active: snapshot.currentNodeId === id,
      onPath: pathSet.has(id),
      created: snapshot.createdNodeId === id,
      root: id === snapshot.rootId,
    };
    nodes.push(model);
    positions.set(id, model);

    const children = [...node.children].sort((a, b) => {
      const ca = byId.get(a)?.char ?? '';
      const cb = byId.get(b)?.char ?? '';
      return ca.localeCompare(cb);
    });
    const widths = children.map((child) => widthOf(child));
    const total = widths.reduce((sum, value) => sum + value, 0) + KEY_TREE_LEAF_GAP * (children.length - 1);
    let childLeft = center - total / 2;
    children.forEach((childId, index) => {
      const childWidth = widths[index];
      const child = byId.get(childId);
      place(childId, childLeft, depth + 1);
      childLeft += childWidth + KEY_TREE_LEAF_GAP;
      const placed = positions.get(childId);
      if (!child || !placed) return;
      edges.push({
        id: `${id}-${childId}`,
        fromId: id,
        toId: childId,
        char: child.char,
        x1: center,
        y1: y + KEY_TREE_NODE_R,
        x2: placed.x,
        y2: placed.y - KEY_TREE_NODE_R,
        onPath: pathPairs.has(`${id}->${childId}`),
      });
    });
  };

  place(snapshot.rootId, 30, 0);
  const totalWidth = widthOf(snapshot.rootId);
  const bottom = nodes.reduce((max, node) => Math.max(max, node.y + KEY_TREE_NODE_R), 0);
  return {
    kind: 'key-tree',
    mode: snapshot.mode,
    target: snapshot.target,
    operation: snapshot.operation,
    result: snapshot.result,
    rootId: snapshot.rootId,
    nodes,
    edges,
    pathIds: [...snapshot.pathIds],
    currentNodeId: snapshot.currentNodeId,
    compareChar: snapshot.compareChar,
    matchedLength: snapshot.matchedLength,
    createdNodeId: snapshot.createdNodeId,
    terminalNodeId: snapshot.terminalNodeId,
    dictionary: [...snapshot.dictionary],
    width: Math.max(560, Math.ceil(totalWidth + 80)),
    height: Math.max(250, Math.ceil(bottom + 74)),
  };
}
