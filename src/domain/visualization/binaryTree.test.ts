import { describe, expect, it } from 'vitest';
import {
  binaryTreeSnapshotSchema,
  structureSchema,
  structureSnapshotSchema,
  type BinaryTreeNode,
  type BinaryTreeSnapshot,
} from '../trace/schema';
import { framesToTraceDocument } from '../trace/adapter';
import { parseTraceDocument } from '../trace/schema';
import {
  TREE_COL_W,
  TREE_ROW_H,
  layoutBinaryTree,
} from './binaryTreeLayout';
import { buildBinaryTreeModel } from './binaryTreeModel';
import { buildVisualModel } from './model';

const nodes: BinaryTreeNode[] = [
  { id: 'n1', value: 4, leftId: 'n2', rightId: 'n3' },
  { id: 'n2', value: 2, leftId: 'n4', rightId: 'n5' },
  { id: 'n3', value: 6, leftId: 'n6', rightId: 'n7' },
  { id: 'n4', value: 1, leftId: null, rightId: null },
  { id: 'n5', value: 3, leftId: null, rightId: null },
  { id: 'n6', value: 5, leftId: null, rightId: null },
  { id: 'n7', value: 7, leftId: null, rightId: null },
];

function snapshot(partial: Partial<BinaryTreeSnapshot> = {}): BinaryTreeSnapshot {
  return {
    kind: 'binary-tree',
    traversal: 'inorder',
    operation: 'enter',
    rootId: 'n1',
    nodes,
    currentNodeId: 'n1',
    visitedIds: [],
    pathIds: ['n1'],
    ...partial,
  } as BinaryTreeSnapshot;
}

describe('Stage 7D binary-tree Trace schema', () => {
  it('accepts empty, single-node, full, left-only and right-only trees', () => {
    expect(binaryTreeSnapshotSchema.safeParse(snapshot({
      operation: 'init', rootId: null, nodes: [], currentNodeId: null, pathIds: [],
    })).success).toBe(true);
    expect(binaryTreeSnapshotSchema.safeParse(snapshot({
      rootId: 'n1', nodes: [{ id: 'n1', value: 4, leftId: null, rightId: null }],
    })).success).toBe(true);
    expect(binaryTreeSnapshotSchema.safeParse(snapshot()).success).toBe(true);
    expect(binaryTreeSnapshotSchema.safeParse(snapshot({
      rootId: 'n1',
      nodes: [
        { id: 'n1', value: 4, leftId: 'n2', rightId: null },
        { id: 'n2', value: 2, leftId: null, rightId: null },
      ],
      pathIds: ['n1'],
    })).success).toBe(true);
    expect(binaryTreeSnapshotSchema.safeParse(snapshot({
      rootId: 'n1',
      nodes: [
        { id: 'n1', value: 4, leftId: null, rightId: 'n2' },
        { id: 'n2', value: 2, leftId: null, rightId: null },
      ],
    })).success).toBe(true);
  });

  it('accepts same values with distinct ids and a real visit order', () => {
    const parsed = binaryTreeSnapshotSchema.parse(snapshot({
      nodes: [
        { id: 'n1', value: 3, leftId: 'n2', rightId: null },
        { id: 'n2', value: 3, leftId: null, rightId: null },
      ],
      operation: 'visit',
      currentNodeId: 'n2',
      pathIds: ['n1', 'n2'],
      visitedIds: ['n1', 'n2'],
    }));
    expect(parsed.nodes.map((node) => node.id)).toEqual(['n1', 'n2']);
    expect(parsed.visitedIds).toEqual(['n1', 'n2']);
  });

  it('rejects duplicate ids, dangling children, a missing root and multiple parents', () => {
    expect(binaryTreeSnapshotSchema.safeParse(snapshot({
      nodes: [...nodes, { id: 'n1', value: 9, leftId: null, rightId: null }],
    })).success).toBe(false);
    expect(binaryTreeSnapshotSchema.safeParse(snapshot({
      nodes: [{ id: 'n1', value: 4, leftId: 'missing', rightId: null }],
    })).success).toBe(false);
    expect(binaryTreeSnapshotSchema.safeParse(snapshot({ rootId: 'missing' })).success).toBe(false);
    expect(binaryTreeSnapshotSchema.safeParse(snapshot({
      nodes: [
        { id: 'n1', value: 4, leftId: 'n3', rightId: 'n3' },
        { id: 'n3', value: 6, leftId: null, rightId: null },
        { id: 'n2', value: 2, leftId: null, rightId: null },
      ],
      pathIds: ['n1'],
    })).success).toBe(false);
  });

  it('rejects cycles, unreachable nodes and an invalid root parent', () => {
    expect(binaryTreeSnapshotSchema.safeParse(snapshot({
      nodes: [
        { id: 'n1', value: 4, leftId: 'n2', rightId: null },
        { id: 'n2', value: 2, leftId: 'n1', rightId: null },
      ],
    })).success).toBe(false);
    expect(binaryTreeSnapshotSchema.safeParse(snapshot({
      nodes: [
        ...nodes,
        { id: 'orphan', value: 99, leftId: null, rightId: null },
      ],
    })).success).toBe(false);
    expect(binaryTreeSnapshotSchema.safeParse(snapshot({
      rootId: 'n1',
      nodes: [
        { id: 'n1', value: 4, leftId: null, rightId: null },
        { id: 'n2', value: 2, leftId: 'n1', rightId: null },
      ],
      pathIds: ['n1'],
    })).success).toBe(false);
  });

  it('rejects illegal visited and path references', () => {
    expect(binaryTreeSnapshotSchema.safeParse(snapshot({
      visitedIds: ['missing'],
    })).success).toBe(false);
    expect(binaryTreeSnapshotSchema.safeParse(snapshot({
      visitedIds: ['n1', 'n1'],
    })).success).toBe(false);
    expect(binaryTreeSnapshotSchema.safeParse(snapshot({
      pathIds: ['n2'],
    })).success).toBe(false);
    expect(binaryTreeSnapshotSchema.safeParse(snapshot({
      pathIds: ['n1', 'n4'],
    })).success).toBe(false);
    expect(binaryTreeSnapshotSchema.safeParse(snapshot({
      currentNodeId: 'n4',
      pathIds: ['n1', 'n2'],
    })).success).toBe(false);
  });

  it('enforces lifecycle, visit and left/right semantics', () => {
    expect(binaryTreeSnapshotSchema.safeParse(snapshot({
      operation: 'init', currentNodeId: 'n1', pathIds: ['n1'],
    })).success).toBe(false);
    expect(binaryTreeSnapshotSchema.safeParse(snapshot({
      operation: 'done', currentNodeId: 'n1',
    })).success).toBe(false);
    expect(binaryTreeSnapshotSchema.safeParse(snapshot({
      operation: 'visit', visitedIds: [],
    })).success).toBe(false);
    expect(binaryTreeSnapshotSchema.safeParse(snapshot({
      operation: 'left', currentNodeId: 'n4', pathIds: ['n1', 'n2', 'n4'],
    })).success).toBe(false);
    expect(binaryTreeSnapshotSchema.safeParse(snapshot({
      operation: 'right', currentNodeId: 'n6', pathIds: ['n1', 'n3', 'n6'],
    })).success).toBe(false);
  });

  it('accepts real level-order queue states and rejects inconsistent ones', () => {
    expect(binaryTreeSnapshotSchema.safeParse(snapshot({
      traversal: 'levelorder',
      operation: 'init',
      currentNodeId: null,
      pathIds: [],
      queueIds: [],
    })).success).toBe(true);
    expect(binaryTreeSnapshotSchema.safeParse(snapshot({
      traversal: 'levelorder',
      operation: 'enqueue',
      currentNodeId: 'n1',
      pathIds: ['n1'],
      queueIds: ['n1'],
    })).success).toBe(true);
    expect(binaryTreeSnapshotSchema.safeParse(snapshot({
      traversal: 'levelorder',
      operation: 'enqueue',
      currentNodeId: 'n4',
      pathIds: ['n1', 'n2', 'n4'],
      queueIds: ['n2', 'n3', 'n4'],
    })).success).toBe(true);
    expect(binaryTreeSnapshotSchema.safeParse(snapshot({
      traversal: 'levelorder',
      operation: 'dequeue',
      currentNodeId: 'n2',
      pathIds: ['n1', 'n2'],
      queueIds: ['n3'],
    })).success).toBe(true);
    expect(binaryTreeSnapshotSchema.safeParse(snapshot({
      traversal: 'levelorder',
      operation: 'visit',
      currentNodeId: 'n1',
      pathIds: ['n1'],
      visitedIds: ['n1'],
      queueIds: ['n2', 'n3'],
    })).success).toBe(true);

    expect(binaryTreeSnapshotSchema.safeParse(snapshot({
      traversal: 'levelorder',
      operation: 'enqueue',
      currentNodeId: 'n1',
      queueIds: [],
    })).success).toBe(false);
    expect(binaryTreeSnapshotSchema.safeParse(snapshot({
      traversal: 'levelorder',
      operation: 'dequeue',
      currentNodeId: 'n1',
      queueIds: ['n1'],
    })).success).toBe(false);
    expect(binaryTreeSnapshotSchema.safeParse(snapshot({
      traversal: 'levelorder',
      operation: 'enqueue',
      currentNodeId: 'n1',
      pathIds: ['n1'],
      queueIds: ['n1', 'n1'],
    })).success).toBe(false);
    expect(binaryTreeSnapshotSchema.safeParse(snapshot({
      traversal: 'levelorder',
      operation: 'enter',
    })).success).toBe(false);
    expect(binaryTreeSnapshotSchema.safeParse(snapshot({
      traversal: 'inorder',
      queueIds: ['n1'],
    })).success).toBe(false);
  });

  it('rejects more than 40 nodes', () => {
    const many: BinaryTreeNode[] = Array.from({ length: 41 }, (_, index) => ({
      id: `n${index}`,
      value: index,
      leftId: index === 40 ? null : `n${index + 1}`,
      rightId: null,
    }));
    expect(binaryTreeSnapshotSchema.safeParse(snapshot({
      rootId: 'n0',
      nodes: many,
      currentNodeId: 'n0',
      pathIds: ['n0'],
    })).success).toBe(false);
  });

  it('keeps stack, queue and linked-list compatibility', () => {
    expect(structureSchema.safeParse({
      kind: 'stack', operation: 'push', items: [{ id: 's1', value: 3 }], targetId: 's1',
    }).success).toBe(true);
    expect(structureSchema.safeParse({
      kind: 'linked-list', operation: 'visit', headId: 'n1',
      nodes: [{ id: 'n1', value: 3, nextId: null }], targetId: 'n1',
    }).success).toBe(true);
    expect(structureSnapshotSchema.safeParse({
      kind: 'queue', operation: 'enqueue', items: [{ id: 'q1', value: 3 }], targetId: 'q1',
    }).success).toBe(true);
  });

  it('drops a malformed tree structure in the adapter and keeps the legacy state', () => {
    const doc = parseTraceDocument(framesToTraceDocument([
      {
        state: { type: 'tree', values: [4, 2, 6, 1, 3, 5, 7] },
        message: 'enter root',
        structure: snapshot(),
      },
      {
        state: { type: 'tree', values: [4, 2, 6, 1, 3, 5, 7] },
        message: 'bad tree',
        structure: snapshot({ rootId: 'missing' }),
      },
    ], 'tree source'));
    expect(doc.ok).toBe(true);
    if (!doc.ok) return;
    expect(doc.document.events[0].structure?.kind).toBe('binary-tree');
    expect(doc.document.events[1].structure).toBeUndefined();
    expect(doc.document.events[1].state.type).toBe('tree');
  });
});

describe('Stage 7D binary-tree layout', () => {
  it('places the root on top, left children left and right children right', () => {
    const layout = layoutBinaryTree(nodes, 'n1');
    const byId = new Map(layout.nodes.map((node) => [node.id, node]));
    const root = byId.get('n1')!;
    const left = byId.get('n2')!;
    const right = byId.get('n3')!;
    expect(root.depth).toBe(0);
    expect(left.depth).toBe(1);
    expect(right.depth).toBe(1);
    expect(left.x).toBeLessThan(root.x);
    expect(right.x).toBeGreaterThan(root.x);
    expect(left.y).toBe(root.y + TREE_ROW_H);
    expect(right.y).toBe(root.y + TREE_ROW_H);
    expect(byId.get('n4')!.x).toBeLessThan(byId.get('n2')!.x);
    expect(byId.get('n7')!.x).toBeGreaterThan(byId.get('n3')!.x);
    expect(byId.get('n4')!.x).toBe(32 + 32);
    expect(byId.get('n1')!.x - byId.get('n2')!.x).toBe(2 * TREE_COL_W);
  });

  it('does not overlap nodes at the same depth and keeps all seven edges', () => {
    const layout = layoutBinaryTree(nodes, 'n1');
    for (let i = 0; i < layout.nodes.length; i += 1) {
      for (let j = i + 1; j < layout.nodes.length; j += 1) {
        const a = layout.nodes[i];
        const b = layout.nodes[j];
        if (a.depth !== b.depth) continue;
        expect(Math.abs(a.x - b.x)).toBeGreaterThanOrEqual(TREE_COL_W - 1);
      }
    }
    expect(layout.nodes).toHaveLength(7);
    expect(layout.edges).toHaveLength(6);
    expect(layout.width).toBeGreaterThan(600);
  });

  it('does not cross unrelated parent-child edges in a normal tree', () => {
    const layout = layoutBinaryTree(nodes, 'n1');
    const cross = (a: typeof layout.edges[number], b: typeof layout.edges[number]) => {
      const orient = (
        p: { x: number; y: number },
        q: { x: number; y: number },
        r: { x: number; y: number },
      ) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
      const a1 = { x: a.x1, y: a.y1 };
      const a2 = { x: a.x2, y: a.y2 };
      const b1 = { x: b.x1, y: b.y1 };
      const b2 = { x: b.x2, y: b.y2 };
      return orient(a1, a2, b1) * orient(a1, a2, b2) < 0
        && orient(b1, b2, a1) * orient(b1, b2, a2) < 0;
    };
    for (let i = 0; i < layout.edges.length; i += 1) {
      for (let j = i + 1; j < layout.edges.length; j += 1) {
        const a = layout.edges[i];
        const b = layout.edges[j];
        if (a.fromId === b.fromId || a.toId === b.toId || a.fromId === b.toId || a.toId === b.fromId) continue;
        expect(cross(a, b)).toBe(false);
      }
    }
  });

  it('lays out left-only and right-only chains without recursion or overlap', () => {
    const left = layoutBinaryTree([
      { id: 'n1', value: 4, leftId: 'n2', rightId: null },
      { id: 'n2', value: 2, leftId: 'n3', rightId: null },
      { id: 'n3', value: 1, leftId: null, rightId: null },
    ], 'n1');
    const leftById = new Map(left.nodes.map((node) => [node.id, node]));
    expect(leftById.get('n2')!.x).toBeLessThan(leftById.get('n1')!.x);
    expect(leftById.get('n3')!.x).toBeLessThan(leftById.get('n2')!.x);
    expect(leftById.get('n3')!.depth).toBe(2);

    const right = layoutBinaryTree([
      { id: 'n1', value: 4, leftId: null, rightId: 'n2' },
      { id: 'n2', value: 6, leftId: null, rightId: 'n3' },
      { id: 'n3', value: 7, leftId: null, rightId: null },
    ], 'n1');
    const rightById = new Map(right.nodes.map((node) => [node.id, node]));
    expect(rightById.get('n2')!.x).toBeGreaterThan(rightById.get('n1')!.x);
    expect(rightById.get('n3')!.x).toBeGreaterThan(rightById.get('n2')!.x);
  });

  it('handles empty, missing-root and cyclic input safely', () => {
    expect(layoutBinaryTree([], null).nodes).toHaveLength(0);
    expect(layoutBinaryTree(nodes, null).nodes).toHaveLength(0);
    expect(layoutBinaryTree(nodes, 'missing').nodes).toHaveLength(0);
    const cyclic = layoutBinaryTree([
      { id: 'n1', value: 4, leftId: 'n2', rightId: null },
      { id: 'n2', value: 2, leftId: 'n1', rightId: null },
    ], 'n1');
    expect(cyclic.nodes.length).toBeLessThanOrEqual(2);
    expect(cyclic.edges.length).toBeLessThanOrEqual(2);
  });

  it('returns identical coordinates for the same snapshot', () => {
    expect(layoutBinaryTree(nodes, 'n1')).toEqual(layoutBinaryTree(nodes, 'n1'));
  });
});

describe('Stage 7D binary-tree visual model', () => {
  it('derives order from left/right references, not from array order', () => {
    const shuffled = [...nodes].reverse();
    const layout = layoutBinaryTree(shuffled, 'n1');
    const byId = new Map(layout.nodes.map((node) => [node.id, node]));
    expect(byId.get('n4')!.x).toBeLessThan(byId.get('n2')!.x);
    expect(byId.get('n1')!.x).toBeGreaterThan(byId.get('n2')!.x);
    expect(byId.get('n1')!.x).toBeLessThan(byId.get('n3')!.x);
  });

  it('maps real visited order, current node, path and child-edge highlight', () => {
    const model = buildBinaryTreeModel(snapshot({
      operation: 'left',
      currentNodeId: 'n2',
      pathIds: ['n1', 'n2'],
      visitedIds: ['n1', 'n2'],
    }), 'empty');
    expect(model).not.toBeNull();
    if (!model) return;
    expect(model.nextChildId).toBe('n4');
    expect(model.nodes.find((node) => node.id === 'n2')?.active).toBe(true);
    expect(model.nodes.find((node) => node.id === 'n2')?.visitOrder).toBe(2);
    expect(model.nodes.find((node) => node.id === 'n1')?.visitOrder).toBe(1);
    expect(model.nodes.find((node) => node.id === 'n4')?.onPath).toBe(false);
    const activeEdge = model.edges.find((edge) => edge.active);
    expect(activeEdge?.fromId).toBe('n2');
    expect(activeEdge?.toId).toBe('n4');
    expect(model.edges.filter((edge) => edge.onPath)).toHaveLength(1);
  });

  it('maps the level-order queue and enqueue edge without inventing visits', () => {
    const model = buildBinaryTreeModel(snapshot({
      traversal: 'levelorder',
      operation: 'enqueue',
      currentNodeId: 'n4',
      pathIds: ['n1', 'n2', 'n4'],
      queueIds: ['n2', 'n3', 'n4'],
    }), 'empty');
    expect(model).not.toBeNull();
    if (!model) return;
    expect(model.queueIds).toEqual(['n2', 'n3', 'n4']);
    expect(model.nextChildId).toBe('n4');
    expect(model.nodes.find((node) => node.id === 'n4')?.active).toBe(true);
    expect(model.nodes.find((node) => node.id === 'n4')?.visited).toBe(false);
    const activeEdge = model.edges.find((edge) => edge.active);
    expect(activeEdge?.fromId).toBe('n2');
    expect(activeEdge?.toId).toBe('n4');
  });

  it('renders an empty tree and distinguishes same-value nodes', () => {
    const empty = buildBinaryTreeModel(snapshot({
      operation: 'init', rootId: null, nodes: [], currentNodeId: null, pathIds: [],
    }), 'empty tree');
    expect(empty?.empty).toBe(true);
    expect(empty?.label).toBe('empty tree');

    const same = buildBinaryTreeModel(snapshot({
      nodes: [
        { id: 'n1', value: 3, leftId: 'n2', rightId: null },
        { id: 'n2', value: 3, leftId: null, rightId: null },
      ],
      operation: 'visit', currentNodeId: 'n2', pathIds: ['n1', 'n2'], visitedIds: ['n2'],
    }), 'empty tree');
    expect(same?.nodes.map((node) => node.id)).toEqual(['n1', 'n2']);
    expect(same?.nodes.find((node) => node.id === 'n2')?.visitOrder).toBe(1);
    expect(same?.nodes.find((node) => node.id === 'n1')?.visited).toBe(false);
  });

  it('falls back to raw for a malformed tree and keeps the legacy graph snapshot', () => {
    const malformed = buildBinaryTreeModel(snapshot({ rootId: 'missing' }), 'empty');
    expect(malformed).toBeNull();
    const treeState = { type: 'tree', values: [4, 2, 6, 1, 3, 5, 7] };
    expect(buildVisualModel(treeState, { invalid: 'invalid', emptyStructure: 'empty' }, snapshot({
      rootId: 'missing',
    })).kind).toBe('raw');
    expect(buildVisualModel(treeState, { invalid: 'invalid', emptyStructure: 'empty' })).toMatchObject({
      kind: 'graph',
      isTree: true,
    });
  });
});
