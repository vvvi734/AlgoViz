import { describe, expect, it } from 'vitest';
import {
  btreeSnapshotSchema,
  type BtreeSnapshot,
} from './schema';
import { buildBTreeModel } from '../visualization/btreeModel';

const nodes = [
  { id: 'n1', keys: [10], children: [], leaf: true },
  { id: 'n2', keys: [20, 40], children: ['n1', 'n3', 'n4'], leaf: false },
  { id: 'n3', keys: [30], children: [], leaf: true },
  { id: 'n4', keys: [50, 60, 70], children: [], leaf: true },
];

function snapshot(overrides: Partial<BtreeSnapshot> = {}): BtreeSnapshot {
  return {
    kind: 'btree',
    order: 4,
    preset: 'find-hit',
    command: 'find',
    operation: 'init',
    targetValue: 30,
    rootId: 'n2',
    nodes,
    currentNodeId: 'n2',
    pathIds: ['n2'],
    compareIndex: null,
    compareKey: null,
    childSlot: null,
    childId: null,
    split: null,
    insertedKey: null,
    deleteInfo: null,
    result: null,
    ...overrides,
  };
}

function parse(value: unknown): boolean {
  return btreeSnapshotSchema.safeParse(value).success;
}

describe('SEARCH-04 order-4 B-tree snapshots', () => {
  it('accepts a real attached tree and its search frames', () => {
    expect(parse(snapshot())).toBe(true);
    expect(parse(snapshot({
      operation: 'inspect',
      compareIndex: 1,
      compareKey: 40,
    }))).toBe(true);
    expect(parse(snapshot({
      operation: 'descend',
      childSlot: 1,
      childId: 'n3',
    }))).toBe(true);
    expect(parse(snapshot({
      operation: 'found',
      currentNodeId: 'n3',
      pathIds: ['n2', 'n3'],
      compareIndex: 0,
      compareKey: 30,
      result: 'found',
    }))).toBe(true);
    expect(parse(snapshot({
      operation: 'not-found',
      currentNodeId: 'n3',
      pathIds: ['n2', 'n3'],
      targetValue: 35,
      result: 'not-found',
    }))).toBe(true);
    expect(parse(snapshot({
      operation: 'done',
      currentNodeId: null,
      pathIds: [],
      result: 'found',
    }))).toBe(true);
  });

  it('accepts a duplicate rejection and a non-root split without changing the old id', () => {
    expect(parse(snapshot({
      command: 'insert',
      operation: 'duplicate',
      currentNodeId: 'n3',
      pathIds: ['n2', 'n3'],
      compareIndex: 0,
      compareKey: 30,
      result: 'duplicate',
    }))).toBe(true);

    const splitBefore = snapshot({
      command: 'insert',
      operation: 'split',
      targetValue: 45,
      split: {
        nodeId: 'n4',
        phase: 'before',
        leftId: null,
        rightId: null,
        promotedKey: null,
        parentId: null,
        rootChanged: false,
      },
    });
    expect(parse(splitBefore)).toBe(true);

    const splitNodes = [
      ...nodes,
      { id: 'n5', keys: [70], children: [], leaf: true },
    ];
    const splitAfter = snapshot({
      command: 'insert',
      operation: 'split',
      targetValue: 45,
      nodes: splitNodes.map((node) => {
        if (node.id === 'n2') return { ...node, keys: [20, 40, 60], children: ['n1', 'n3', 'n4', 'n5'] };
        if (node.id === 'n4') return { ...node, keys: [50] };
        return node;
      }),
      split: {
        nodeId: 'n4',
        phase: 'after',
        leftId: 'n4',
        rightId: 'n5',
        promotedKey: 60,
        parentId: 'n2',
        rootChanged: false,
      },
    });
    expect(parse(splitAfter)).toBe(true);

    const inserted = snapshot({
      command: 'insert',
      operation: 'insert',
      targetValue: 45,
      nodes: splitNodes.map((node) => {
        if (node.id === 'n2') return { ...node, keys: [20, 40, 60], children: ['n1', 'n3', 'n4', 'n5'] };
        if (node.id === 'n4') return { ...node, keys: [45, 50] };
        return node;
      }),
      currentNodeId: 'n4',
      pathIds: ['n2', 'n4'],
      compareIndex: 0,
      compareKey: 45,
      insertedKey: 45,
      result: 'inserted',
    });
    expect(parse(inserted)).toBe(true);
  });

  it('accepts a real root split and the subsequent leaf insert', () => {
    const rootNodes = [
      { id: 'n1', keys: [10], children: [], leaf: true },
      { id: 'n2', keys: [20], children: ['n1', 'n3'], leaf: false },
      { id: 'n3', keys: [30], children: [], leaf: true },
    ];
    const rootSplit = snapshot({
      command: 'insert',
      operation: 'split',
      targetValue: 40,
      nodes: rootNodes,
      currentNodeId: 'n2',
      pathIds: ['n2'],
      split: {
        nodeId: 'n1',
        phase: 'after',
        leftId: 'n1',
        rightId: 'n3',
        promotedKey: 20,
        parentId: 'n2',
        rootChanged: true,
      },
    });
    expect(parse(rootSplit)).toBe(true);
    expect(parse(snapshot({
      ...rootSplit,
      nodes: rootNodes.map((node) => node.id === 'n3' ? { ...node, keys: [30, 40] } : node),
      operation: 'insert',
      currentNodeId: 'n3',
      pathIds: ['n2', 'n3'],
      compareIndex: 1,
      compareKey: 40,
      split: null,
      insertedKey: 40,
      result: 'inserted',
    }))).toBe(true);
  });

  it('rejects unordered keys, wrong intervals, broken paths and unequal leaf depths', () => {
    expect(parse(snapshot({ rootId: 'missing' }))).toBe(false);
    expect(parse(snapshot({
      nodes: nodes.map((node) => node.id === 'n2' ? { ...node, keys: [40, 20] } : node),
    }))).toBe(false);
    expect(parse(snapshot({
      nodes: nodes.map((node) => node.id === 'n2' ? { ...node, children: ['n1', 'n3'] } : node),
    }))).toBe(false);
    expect(parse(snapshot({
      nodes: nodes.map((node) => node.id === 'n4' ? { ...node, keys: [30, 60, 70] } : node),
    }))).toBe(false);
    expect(parse(snapshot({
      pathIds: ['n2', 'n3'],
      currentNodeId: 'n4',
    }))).toBe(false);
    expect(parse(snapshot({
      compareIndex: 0,
      compareKey: 40,
    }))).toBe(false);

    const unevenNodes = [
      ...nodes,
      { id: 'n0', keys: [5], children: [], leaf: true },
    ].map((node) => node.id === 'n1'
      ? { ...node, keys: [10], children: ['n0'], leaf: false }
      : node);
    expect(parse(snapshot({ nodes: unevenNodes }))).toBe(false);
  });

  it('rejects invalid split-after frames instead of drawing a different split', () => {
    const splitNodes = [
      ...nodes,
      { id: 'n5', keys: [70], children: [], leaf: true },
    ].map((node) => {
      if (node.id === 'n2') return { ...node, keys: [20, 40, 60], children: ['n1', 'n3', 'n4', 'n5'] };
      if (node.id === 'n4') return { ...node, keys: [50] };
      return node;
    });
    const valid = {
      nodeId: 'n4',
      phase: 'after' as const,
      leftId: 'n4',
      rightId: 'n5',
      promotedKey: 60,
      parentId: 'n2',
      rootChanged: false,
    };
    expect(parse(snapshot({ command: 'insert', operation: 'split', nodes: splitNodes, split: valid }))).toBe(true);
    expect(parse(snapshot({ command: 'insert', operation: 'split', nodes: splitNodes, split: { ...valid, leftId: 'n5' } }))).toBe(false);
    expect(parse(snapshot({ command: 'insert', operation: 'split', nodes: splitNodes, split: { ...valid, promotedKey: 55 } }))).toBe(false);
  });

  it('derives split and child-selection flags from recorded ids, not positions', () => {
    const splitNodes = [
      ...nodes,
      { id: 'n5', keys: [70], children: [], leaf: true },
    ].map((node) => node.id === 'n2'
      ? { ...node, keys: [20, 40, 60], children: ['n1', 'n3', 'n4', 'n5'] }
      : node);
    const model = buildBTreeModel(snapshot({
      command: 'insert',
      operation: 'split',
      nodes: splitNodes,
      split: {
        nodeId: 'n4',
        phase: 'after',
        leftId: 'n4',
        rightId: 'n5',
        promotedKey: 60,
        parentId: 'n2',
        rootChanged: false,
      },
    }));
    expect(model.nodes.find((node) => node.id === 'n4')?.splitLeft).toBe(true);
    expect(model.nodes.find((node) => node.id === 'n5')?.splitRight).toBe(true);
    expect(model.nodes.find((node) => node.id === 'n2')?.newRoot).toBe(false);
    expect(model.split?.promotedIndex).toBe(2);

    const childModel = buildBTreeModel(snapshot({
      operation: 'descend',
      childSlot: 1,
      childId: 'n3',
    }));
    expect(childModel.selectedSubtreeIds).toEqual(['n3']);
    const selectedEdge = childModel.edges.find((edge) => edge.slot === 1);
    expect(selectedEdge).toMatchObject({ fromId: 'n2', toId: 'n3', selected: true, inSubtree: true });
    expect(childModel.edges.find((edge) => edge.slot === 0)).toMatchObject({ selected: false });
  });
});
