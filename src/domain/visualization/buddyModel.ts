import type { BuddySnapshot } from '../trace/buddySchema';

export interface BuddySegmentModel {
  start: number;
  size: number;
  level: number;
  status: 'free' | 'allocated';
  label: string | null;
  current: boolean;
  selected: boolean;
  buddy: boolean;
  merged: boolean;
}

export interface BuddyTreeNodeModel {
  id: string;
  start: number;
  size: number;
  level: number;
  status: 'free' | 'allocated' | 'internal';
  label: string | null;
  x: number;
  y: number;
  onPath: boolean;
  selected: boolean;
  buddy: boolean;
  leftId: string | null;
  rightId: string | null;
}

export interface BuddyVisualModel {
  kind: 'buddy-system';
  operation: string;
  capacity: number;
  maxLevel: number;
  segments: BuddySegmentModel[];
  nodes: BuddyTreeNodeModel[];
  requestedId: string | null;
  requestedSize: number | null;
  targetLevel: number | null;
  currentLevel: number | null;
  currentStart: number | null;
  selectedStart: number | null;
  buddyStart: number | null;
  mergeStart: number | null;
  blockSize: number | null;
  internalFragment: number;
  decision: string | null;
}

interface RawTreeNode {
  start: number;
  size: number;
  level: number;
  block: BuddySnapshot['blocks'][number] | null;
  left: RawTreeNode | null;
  right: RawTreeNode | null;
}

function nodeId(start: number, size: number): string {
  return `b${start}-${size}`;
}

/** Build the partition tree from the current leaves, so merges collapse upward. */
function buildTree(snapshot: BuddySnapshot): RawTreeNode | null {
  const blocks = new Map(snapshot.blocks.map((block) => [`${block.start}:${block.size}`, block]));
  const build = (start: number, size: number, level: number): RawTreeNode => {
    const block = blocks.get(`${start}:${size}`) ?? null;
    if (block) return { start, size, level, block, left: null, right: null };
    if (size <= 1) return { start, size, level, block: null, left: null, right: null };
    const half = size / 2;
    return {
      start,
      size,
      level,
      block: null,
      left: build(start, half, level + 1),
      right: build(start + half, half, level + 1),
    };
  };
  return build(0, snapshot.capacity, 0);
}

function collectLeaves(node: RawTreeNode, leaves: RawTreeNode[]): void {
  if (!node.left || !node.right) {
    leaves.push(node);
    return;
  }
  collectLeaves(node.left, leaves);
  collectLeaves(node.right, leaves);
}

/** TEXTBOOK-08: map a validated buddy snapshot to memory and split-tree views. */
export function buildBuddyVisualModel(snapshot: BuddySnapshot): BuddyVisualModel {
  const segments: BuddySegmentModel[] = snapshot.blocks.map((block) => ({
    start: block.start,
    size: block.size,
    level: block.level,
    status: block.status,
    label: block.label,
    current: snapshot.currentStart === block.start && snapshot.currentLevel === block.level,
    selected: snapshot.selectedStart === block.start && block.status === 'free',
    buddy: snapshot.buddyStart === block.start,
    merged: snapshot.mergeStart === block.start,
  }));

  const root = buildTree(snapshot);
  const nodes: BuddyTreeNodeModel[] = [];
  if (root) {
    const leaves: RawTreeNode[] = [];
    collectLeaves(root, leaves);
    const leafX = new Map<RawTreeNode, number>();
    const usable = 880;
    const left = 60;
    leaves.forEach((leaf, index) => {
      leafX.set(leaf, leaves.length === 1 ? 500 : left + (index * usable) / (leaves.length - 1));
    });
    const walk = (node: RawTreeNode): number => {
      let x: number;
      if (!node.left || !node.right) {
        x = leafX.get(node) ?? 500;
      } else {
        x = (walk(node.left) + walk(node.right)) / 2;
      }
      const onPath =
        snapshot.currentStart !== null &&
        node.start <= snapshot.currentStart &&
        snapshot.currentStart < node.start + node.size;
      nodes.push({
        id: nodeId(node.start, node.size),
        start: node.start,
        size: node.size,
        level: node.level,
        status: node.block ? node.block.status : 'internal',
        label: node.block?.label ?? null,
        x,
        y: 26 + node.level * 42,
        onPath,
        selected: snapshot.selectedStart === node.start && Boolean(node.block),
        buddy: snapshot.buddyStart === node.start && Boolean(node.block),
        leftId: node.left ? nodeId(node.left.start, node.left.size) : null,
        rightId: node.right ? nodeId(node.right.start, node.right.size) : null,
      });
      return x;
    };
    walk(root);
    nodes.sort((left, right) => left.level - right.level || left.x - right.x);
  }

  return {
    kind: 'buddy-system',
    operation: snapshot.operation,
    capacity: snapshot.capacity,
    maxLevel: snapshot.maxLevel,
    segments,
    nodes,
    requestedId: snapshot.requestedId,
    requestedSize: snapshot.requestedSize,
    targetLevel: snapshot.targetLevel,
    currentLevel: snapshot.currentLevel,
    currentStart: snapshot.currentStart,
    selectedStart: snapshot.selectedStart,
    buddyStart: snapshot.buddyStart,
    mergeStart: snapshot.mergeStart,
    blockSize: snapshot.blockSize,
    internalFragment: snapshot.internalFragment,
    decision: snapshot.decision,
  };
}
