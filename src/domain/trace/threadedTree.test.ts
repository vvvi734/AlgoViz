import { describe, expect, it } from 'vitest';
import rawFrames from '../../test/fixtures/threaded-tree-python-frames.json';
import {
  structureSchema,
  type ThreadedTreeSnapshot,
} from './schema';
import { threadedTreeSnapshotSchema } from './threadedTreeSchema';
import { buildThreadedTreeModel } from '../visualization/threadedTreeModel';

type Frame = { structure: ThreadedTreeSnapshot };
const frames = rawFrames as unknown as Frame[];

function snapshots(): ThreadedTreeSnapshot[] {
  return frames.map((frame) => {
    const union = structureSchema.safeParse(frame.structure);
    expect(union.success, JSON.stringify(union.error?.issues)).toBe(true);
    const typed = threadedTreeSnapshotSchema.safeParse(frame.structure);
    expect(typed.success, JSON.stringify(typed.error?.issues)).toBe(true);
    return frame.structure;
  });
}

describe('in-order threaded binary tree trace', () => {
  it('ships real frames for init, threading, traversal and completion', () => {
    const all = snapshots();
    expect(all).toHaveLength(29);
    expect(new Set(all.map((snapshot) => snapshot.phase))).toEqual(
      new Set(['thread', 'traverse', 'done']),
    );
    expect(new Set(all.map((snapshot) => snapshot.operation))).toEqual(
      new Set([
        'init',
        'enter',
        'thread-left',
        'thread-right',
        'thread-last',
        'return',
        'thread-complete',
        'start',
        'visit',
        'follow-thread',
        'descend-left',
        'done',
      ]),
    );
  });

  it('tags exactly the six null pointers and keeps real children intact', () => {
    const final = snapshots().at(-1)!;
    expect(final.threadedCount).toBe(6);
    expect(final.nodes.map((node) => node.ltag + node.rtag).reduce((a, b) => a + b, 0)).toBe(6);
    expect(final.nodes.map((node) => [node.id, node.leftId, node.rightId])).toEqual([
      ['n1', 'n2', 'n3'],
      ['n2', 'n4', 'n5'],
      ['n3', null, null],
      ['n4', null, null],
      ['n5', null, null],
    ]);
    expect(final.nodes.find((node) => node.id === 'n3')).toMatchObject({
      ltag: 1,
      rtag: 1,
      leftThreadId: 'n1',
      rightThreadId: null,
    });
    expect(final.nodes.find((node) => node.id === 'n4')).toMatchObject({
      leftThreadId: null,
      rightThreadId: 'n2',
    });
    expect(final.nodes.find((node) => node.id === 'n5')).toMatchObject({
      leftThreadId: 'n2',
      rightThreadId: 'n1',
    });
  });

  it('visits 1, 2, 3, 4, 6 without using a recursion stack', () => {
    const final = snapshots().at(-1)!;
    expect(final.visitedIds).toEqual(['n4', 'n2', 'n5', 'n1', 'n3']);
    const byId = new Map(final.nodes.map((node) => [node.id, node.value]));
    expect(final.visitedIds.map((id) => byId.get(id))).toEqual([1, 2, 3, 4, 6]);
    expect(final.currentNodeId).toBeNull();
    expect(final.operation).toBe('done');
  });

  it('paints four solid child edges and six dashed threads', () => {
    const final = snapshots().at(-1)!;
    const model = buildThreadedTreeModel(final, 'empty');
    expect(model.kind).toBe('threaded-tree');
    if (model.kind !== 'threaded-tree') throw new Error('unreachable');
    expect(model.nodes).toHaveLength(5);
    expect(model.childEdges).toHaveLength(4);
    expect(model.threadEdges).toHaveLength(6);
    expect(model.threadEdges.filter((edge) => edge.stub).map((edge) => `${edge.fromId}-${edge.side}`)).toEqual([
      'n3-right',
      'n4-left',
    ]);
    expect(model.nodes.find((node) => node.id === 'n3')?.tone).toBe('prev');
    expect(model.nodes.find((node) => node.id === 'n4')?.tone).toBe('visited');
  });
});
