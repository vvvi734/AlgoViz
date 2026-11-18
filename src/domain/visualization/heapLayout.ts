/**
 * T3: deterministic geometry for a complete binary tree stored in an array.
 *
 * Slot i maps to the node at level floor(log2(i+1)) and horizontal position
 * `(i - levelStart + 0.5) / levelCount`. The layout depends only on the number
 * of active elements, so swapping values never moves a node or changes the
 * tree shape. The renderer fits this viewBox into the available card without
 * CSS transforms, and wide heaps scroll inside their own canvas.
 */

export interface HeapLayoutNode {
  slot: number;
  depth: number;
  x: number;
  y: number;
}

export interface HeapLayoutEdge {
  parentSlot: number;
  childSlot: number;
  side: 'left' | 'right';
}

export interface HeapLayout {
  width: number;
  height: number;
  radius: number;
  padding: number;
  unit: number;
  nodes: HeapLayoutNode[];
  edges: HeapLayoutEdge[];
}

export function heapNodeDimensions(count: number): { radius: number; unit: number; verticalGap: number } {
  if (count <= 3) return { radius: 32, unit: 82, verticalGap: 44 };
  if (count <= 7) return { radius: 28, unit: 70, verticalGap: 38 };
  if (count <= 12) return { radius: 22, unit: 56, verticalGap: 30 };
  if (count <= 18) return { radius: 18, unit: 48, verticalGap: 24 };
  return { radius: 15, unit: 42, verticalGap: 20 };
}

export function layoutCompleteHeap(count: number): HeapLayout {
  const safeCount = Math.max(0, Math.min(24, Math.floor(count)));
  if (safeCount === 0) {
    return {
      width: 0,
      height: 0,
      radius: 0,
      padding: 0,
      unit: 0,
      nodes: [],
      edges: [],
    };
  }

  const levels = Math.floor(Math.log2(safeCount)) + 1;
  const leafDepth = levels - 1;
  const leafSlots = 2 ** leafDepth;
  const { radius, unit, verticalGap } = heapNodeDimensions(safeCount);
  const padding = Math.max(10, Math.round(radius * 0.55));
  const width = leafSlots * unit;
  const height = padding * 2 + levels * radius * 2 + (levels - 1) * verticalGap;

  const nodes: HeapLayoutNode[] = [];
  for (let slot = 0; slot < safeCount; slot += 1) {
    const depth = Math.floor(Math.log2(slot + 1));
    const levelStart = 2 ** depth - 1;
    const levelCount = 2 ** depth;
    const x = ((slot - levelStart + 0.5) / levelCount) * width;
    const y = padding + radius + depth * (radius * 2 + verticalGap);
    nodes.push({ slot, depth, x, y });
  }

  const edges: HeapLayoutEdge[] = [];
  for (let childSlot = 1; childSlot < safeCount; childSlot += 1) {
    const parentSlot = Math.floor((childSlot - 1) / 2);
    edges.push({
      parentSlot,
      childSlot,
      side: childSlot % 2 === 1 ? 'left' : 'right',
    });
  }

  return { width, height, radius, padding, unit, nodes, edges };
}
