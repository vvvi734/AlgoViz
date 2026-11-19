/**
 * T4: deterministic tidy layout for a Huffman forest.
 *
 * A Huffman build has several independent roots before the final merge, so this is
 * intentionally not the binary-tree inorder layout. Each subtree gets exactly the
 * horizontal space its leaves need; the parent sits halfway between its two
 * children. The packing is stable: roots arrive already ordered by
 * (weight, order), so equal weights never reshuffle between frames.
 *
 * Node size is fixed. A wide tree grows the SVG and the panel scrolls instead of
 * shrinking characters until they become unreadable.
 */
import type { HuffmanNode } from '../trace/schema';

export const HUFFMAN_NODE_W = 88;
export const HUFFMAN_NODE_H = 58;
export const HUFFMAN_SUBTREE_GAP = 30;
export const HUFFMAN_ROOT_GAP = 44;
export const HUFFMAN_ROW_GAP = 46;
export const HUFFMAN_MARGIN_X = 30;
export const HUFFMAN_MARGIN_Y = 24;

export type HuffmanNodeRole = 'root-leaf' | 'root-internal' | 'leaf' | 'internal';

export interface HuffmanLayoutNode {
  id: string;
  x: number;
  y: number;
  depth: number;
  role: HuffmanNodeRole;
  leftId: string | null;
  rightId: string | null;
}

export interface HuffmanLayoutEdge {
  fromId: string;
  toId: string;
  side: 'left' | 'right';
  bit: '0' | '1';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface HuffmanLayout {
  nodes: HuffmanLayoutNode[];
  edges: HuffmanLayoutEdge[];
  rootIds: string[];
  width: number;
  height: number;
}

export function layoutHuffmanForest(
  nodes: readonly HuffmanNode[],
  rootIds: readonly string[],
): HuffmanLayout {
  if (nodes.length === 0 || rootIds.length === 0) {
    return { nodes: [], edges: [], rootIds: [], width: 0, height: 0 };
  }
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const rootSet = new Set(rootIds);
  const roots = rootIds.filter((id) => rootSet.has(id) && byId.has(id));
  if (roots.length === 0) return { nodes: [], edges: [], rootIds: [], width: 0, height: 0 };

  // Width of a subtree: leaves need one node, an internal node needs the two
  // child widths plus one inter-subtree gap.
  const widthCache = new Map<string, number>();
  const subtreeWidth = (id: string, guard = 0): number => {
    const cached = widthCache.get(id);
    if (cached !== undefined) return cached;
    const node = byId.get(id);
    if (!node || guard > nodes.length) return HUFFMAN_NODE_W;
    let width = HUFFMAN_NODE_W;
    if (node.leftId !== null && node.rightId !== null) {
      width =
        subtreeWidth(node.leftId, guard + 1) +
        HUFFMAN_SUBTREE_GAP +
        subtreeWidth(node.rightId, guard + 1);
      width = Math.max(width, HUFFMAN_NODE_W);
    }
    widthCache.set(id, width);
    return width;
  };

  const laidOut: HuffmanLayoutNode[] = [];
  const edges: HuffmanLayoutEdge[] = [];
  const visited = new Set<string>();

  const place = (id: string, startX: number, depth: number, isRoot: boolean, guard = 0) => {
    if (visited.has(id) || guard > nodes.length) return;
    const node = byId.get(id);
    if (!node) return;
    visited.add(id);
    const width = subtreeWidth(id);
    let x = startX + width / 2;
    let role: HuffmanNodeRole;
    const y = HUFFMAN_MARGIN_Y + depth * (HUFFMAN_NODE_H + HUFFMAN_ROW_GAP) + HUFFMAN_NODE_H / 2;
    if (node.leftId === null || node.rightId === null) {
      role = isRoot ? 'root-leaf' : 'leaf';
    } else {
      const left = byId.get(node.leftId);
      const right = byId.get(node.rightId);
      if (!left || !right) {
        role = isRoot ? 'root-internal' : 'internal';
      } else {
        const leftWidth = subtreeWidth(node.leftId);
        place(node.leftId, startX, depth + 1, false, guard + 1);
        place(node.rightId, startX + leftWidth + HUFFMAN_SUBTREE_GAP, depth + 1, false, guard + 1);
        const leftNode = laidOut.find((entry) => entry.id === node.leftId);
        const rightNode = laidOut.find((entry) => entry.id === node.rightId);
        if (leftNode && rightNode) {
          // The parent sits halfway between the two child centres. That is the
          // conventional tidy-tree rule and keeps both 0/1 edges symmetric.
          x = (leftNode.x + rightNode.x) / 2;
          edges.push({
            fromId: id,
            toId: node.leftId,
            side: 'left',
            bit: '0',
            x1: x,
            y1: y + HUFFMAN_NODE_H / 2,
            x2: leftNode.x,
            y2: leftNode.y - HUFFMAN_NODE_H / 2,
          });
          edges.push({
            fromId: id,
            toId: node.rightId,
            side: 'right',
            bit: '1',
            x1: x,
            y1: y + HUFFMAN_NODE_H / 2,
            x2: rightNode.x,
            y2: rightNode.y - HUFFMAN_NODE_H / 2,
          });
        }
        role = isRoot ? 'root-internal' : 'internal';
      }
    }
    laidOut.push({
      id,
      x,
      y,
      depth,
      role,
      leftId: node.leftId,
      rightId: node.rightId,
    });
  };

  let cursor = HUFFMAN_MARGIN_X;
  for (const rootId of roots) {
    const width = subtreeWidth(rootId);
    place(rootId, cursor, 0, true);
    cursor += width + HUFFMAN_ROOT_GAP;
  }

  // Edges are created before the child node itself is pushed; their x2 values
  // already come from subtree widths and are exact for the fixed node width.
  const maxX = laidOut.reduce((max, node) => Math.max(max, node.x + HUFFMAN_NODE_W / 2), HUFFMAN_NODE_W / 2);
  const maxY = laidOut.reduce((max, node) => Math.max(max, node.y + HUFFMAN_NODE_H / 2), 0);
  return {
    nodes: laidOut,
    edges,
    rootIds: roots,
    width: Math.max(maxX + HUFFMAN_MARGIN_X, HUFFMAN_NODE_W + HUFFMAN_MARGIN_X * 2),
    height: Math.max(maxY + HUFFMAN_MARGIN_Y, HUFFMAN_NODE_H + HUFFMAN_MARGIN_Y * 2),
  };
}
