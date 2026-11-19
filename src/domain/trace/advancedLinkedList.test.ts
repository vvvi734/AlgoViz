import { describe, expect, it } from 'vitest';
import rawDoublyDefault from '../../test/fixtures/l1a-doubly-default-frames.json';
import rawDoublyEdge from '../../test/fixtures/l1a-doubly-edge-frames.json';
import rawCircularDefault from '../../test/fixtures/l1a-circular-default-frames.json';
import rawCircularEdge from '../../test/fixtures/l1a-circular-edge-frames.json';
import {
  buildAdvancedLinkedListModel,
} from '../visualization/advancedLinkedListModel';
import {
  circularLinkedListSnapshotSchema,
  doublyLinkedListSnapshotSchema,
  linkedListSnapshotSchema,
  structureSchema,
  type AdvancedLinkedListSnapshot,
  type CircularLinkedListSnapshot,
  type DoublyLinkedListSnapshot,
} from './schema';
import type { TraceState } from './types';

type Frame = {
  state: TraceState;
  structure: AdvancedLinkedListSnapshot;
  lessonStepId: string;
  message: string;
  variables: Record<string, unknown>;
};
type RawFrame = Frame & { structure: unknown };

const doublyDefault = rawDoublyDefault as unknown as RawFrame[];
const doublyEdge = rawDoublyEdge as unknown as Record<string, RawFrame[]>;
const circularDefault = rawCircularDefault as unknown as RawFrame[];
const circularEdge = rawCircularEdge as unknown as Record<string, RawFrame[]>;

function parse(frames: RawFrame[]): Frame[] {
  return frames.map((frame) => {
    const union = structureSchema.safeParse(frame.structure);
    expect(union.success, JSON.stringify(union.error?.issues)).toBe(true);
    const kind = (frame.structure as { kind?: string }).kind;
    const typed = kind === 'doubly-linked-list'
      ? doublyLinkedListSnapshotSchema.safeParse(frame.structure)
      : circularLinkedListSnapshotSchema.safeParse(frame.structure);
    expect(typed.success, JSON.stringify(typed.error?.issues)).toBe(true);
    return { ...frame, structure: frame.structure as AdvancedLinkedListSnapshot };
  });
}

function asDoubly(frames: Frame[]): DoublyLinkedListSnapshot[] {
  return frames.map((frame) => frame.structure as DoublyLinkedListSnapshot);
}
function asCircular(frames: Frame[]): CircularLinkedListSnapshot[] {
  return frames.map((frame) => frame.structure as CircularLinkedListSnapshot);
}

function chainValues(snapshot: DoublyLinkedListSnapshot | CircularLinkedListSnapshot): unknown[] {
  const nodes = new Map(snapshot.nodes.map((node) => [node.id, node]));
  if (snapshot.headId === null) return [];
  const result: unknown[] = [];
  const seen = new Set<string>();
  let id: string | null = snapshot.headId;
  while (id !== null && !seen.has(id)) {
    seen.add(id);
    const node = nodes.get(id);
    if (!node) break;
    result.push(node.value);
    id = node.nextId;
    if (snapshot.kind === 'circular-linked-list' && id === snapshot.headId) break;
  }
  return result;
}

describe('L1A doubly / circular real Python fixtures', () => {
  it('accepts every default and edge frame through the shared structure union', () => {
    parse(doublyDefault);
    parse(circularDefault);
    for (const frames of Object.values(doublyEdge)) parse(frames);
    for (const frames of Object.values(circularEdge)) parse(frames);
    expect(doublyDefault).toHaveLength(89);
    expect(circularDefault).toHaveLength(80);
    expect(Object.values(doublyEdge).flat().length).toBe(174);
    expect(Object.values(circularEdge).flat().length).toBe(171);
  });

  it('keeps one stable id per Python object and never revalues it', () => {
    const frames = parse(doublyDefault);
    const ids = new Map<string, unknown>();
    for (const frame of frames) {
      for (const node of frame.structure.nodes) {
        if (ids.has(node.id)) expect(ids.get(node.id)).toBe(node.value);
        else ids.set(node.id, node.value);
      }
    }
    expect([...ids.entries()]).toEqual([
      ['n1', 5], ['n2', 7], ['n3', 3], ['n4', 6], ['n5', 8], ['n6', 9], ['n7', 11],
    ]);
  });

  it('doubly forwards and backwards are exact reverses', () => {
    const frames = parse(doublyDefault);
    const forward = frames.filter((frame) => frame.lessonStepId === 'traverse-forward').map((frame) => frame.variables.current);
    const reverse = frames.filter((frame) => frame.lessonStepId === 'traverse-reverse').map((frame) => frame.variables.current);
    expect(forward).toEqual([3, 5, 6, 7, 8]);
    expect(reverse).toEqual([8, 7, 6, 5, 3]);
    expect(forward).toEqual([...reverse].reverse());
  });

  it('doubly keeps both directions consistent during head, tail and middle edits', () => {
    const frames = asDoubly(parse(doublyDefault));
    const middleInsert = frames.find(
      (snapshot) => snapshot.operation === 'set-next' && snapshot.phase === 'complete' && snapshot.change?.beforeId === 'n2',
    )!;
    expect(middleInsert.change).toMatchObject({ nodeId: 'n1', field: 'next', beforeId: 'n2', afterId: 'n4' });
    const n4 = middleInsert.nodes.find((node) => node.id === 'n4')!;
    expect(n4.prevId).toBe('n1');
    expect(n4.nextId).toBe('n2');
    expect(middleInsert.nodes.find((node) => node.id === 'n2')!.prevId).toBe('n4');

    const middleDelete = frames.find(
      (snapshot) => snapshot.operation === 'detach' && snapshot.targetId === 'n4',
    )!;
    expect(middleDelete.phase).toBe('complete');
    const removed = middleDelete.nodes.find((node) => node.id === 'n4')!;
    expect(removed.prevId).toBeNull();
    expect(removed.nextId).toBeNull();
    expect(middleDelete.nodes.find((node) => node.id === 'n1')!.nextId).toBe('n2');
    expect(middleDelete.nodes.find((node) => node.id === 'n2')!.prevId).toBe('n1');

    const final = frames.at(-1)!;
    expect(final.headId).toBeNull();
    expect(final.tailId).toBeNull();
    expect(final.phase).toBe('complete');
  });

  it('every doubly complete frame has null ends and agreeing adjacent pointers', () => {
    const frames = asDoubly(parse(doublyDefault));
    for (const snapshot of frames.filter((frame) => frame.phase === 'complete')) {
      if (snapshot.headId === null) {
        expect(snapshot.tailId).toBeNull();
        continue;
      }
      const nodes = new Map(snapshot.nodes.map((node) => [node.id, node]));
      const head = nodes.get(snapshot.headId)!;
      const tail = nodes.get(snapshot.tailId!)!;
      expect(head.prevId).toBeNull();
      expect(tail.nextId).toBeNull();
      let id: string | null = snapshot.headId;
      const seen = new Set<string>();
      while (id !== null) {
        const node = snapshot.nodes.find((item) => item.id === id)!;
        if (node.nextId !== null) expect(nodes.get(node.nextId)!.prevId).toBe(id);
        expect(seen.has(id)).toBe(false);
        seen.add(id);
        id = node.nextId;
      }
    }
  });

  it('circular completes every non-empty frame with tail.next = head and one full lap', () => {
    const frames = asCircular(parse(circularDefault));
    for (const snapshot of frames.filter((frame) => frame.phase === 'complete')) {
      if (snapshot.headId === null) {
        expect(snapshot.tailId).toBeNull();
        continue;
      }
      const nodes = new Map(snapshot.nodes.map((node) => [node.id, node]));
      const tail = nodes.get(snapshot.tailId!)!;
      expect(tail.nextId).toBe(snapshot.headId);
      const walk: unknown[] = [];
      const seen = new Set<string>();
      let id: string | null = snapshot.headId;
      while (id !== null && !seen.has(id)) {
        seen.add(id);
        const node = snapshot.nodes.find((item) => item.id === id)!;
        walk.push(node.value);
        id = node.nextId;
        if (id === snapshot.headId) break;
      }
      expect(walk.length).toBeGreaterThan(0);
    }
  });

  it('circular shows a self-loop for one node and an empty list after the last delete', () => {
    const one = parse(circularDefault).find(
      (frame) => frame.structure.phase === 'complete' && frame.structure.headId !== null && frame.structure.nodes.length === 1,
    )!;
    const snapshot = one.structure as CircularLinkedListSnapshot;
    expect(snapshot.headId).toBe(snapshot.tailId);
    expect(snapshot.nodes[0]!.nextId).toBe(snapshot.nodes[0]!.id);
    const model = buildAdvancedLinkedListModel(snapshot);
    expect(model.single).toBe(true);
    expect(model.edges.find((edge) => edge.circular && edge.selfLoop)).toBeTruthy();

    const frames = asCircular(parse(circularDefault));
    const empty = frames.some((frame) => frame.phase === 'complete' && frame.headId === null && frame.tailId === null);
    expect(empty).toBe(true);
    expect(chainValues(frames.at(-1)!)).toEqual([]);
  });

  it('circular walk is exactly one lap and missing search ends at not-found', () => {
    const frames = parse(circularDefault);
    const walk = frames.filter((frame) => frame.lessonStepId === 'traverse-circle');
    expect(walk.map((frame) => frame.variables.current)).toEqual([3, 5, 6, 7, 8]);
    expect(walk).toHaveLength(5);
    const miss = frames.find((frame) => frame.structure.operation === 'not-found')!;
    expect((miss.structure as CircularLinkedListSnapshot).found).toBe(false);
    expect((miss.structure as CircularLinkedListSnapshot).searchValue).toBe(99);
  });

  it('mixed edge cases keep head/middle/tail deletion, rebuild and order correct', () => {
    const edge = (name: string) => asDoubly(parse(doublyEdge[name]!));
    const middle = edge('middle');
    const afterDelete = middle.find((frame) => frame.operation === 'detach')!;
    expect(chainValues(afterDelete)).toEqual([3, 5, 7, 8]);
    const deleted = afterDelete.nodes.find((node) => node.id === 'n4')!;
    expect(deleted.prevId).toBeNull();
    expect(deleted.nextId).toBeNull();

    const all = edge('delete_all');
    expect(chainValues(all.at(-1)!)).toEqual([]);
    expect(all.at(-1)!.headId).toBeNull();
    expect(all.at(-1)!.tailId).toBeNull();

    const circular = asCircular(parse(circularEdge['order']!));
    const after = circular.filter((frame) => frame.operation === 'detach').at(-1)!;
    expect(chainValues(after)).toEqual([1, 3, 5]);
  });

  it('intermediate pointer frames never draw an edge that the real pointers do not have', () => {
    const beforeSelfLoop = asCircular(parse(circularDefault)).find(
      (frame) => frame.phase === 'intermediate' && frame.headId !== null && frame.nodes.length === 1 && frame.nodes[0]!.nextId === null,
    )!;
    expect(buildAdvancedLinkedListModel(beforeSelfLoop).edges).toEqual([]);

    const middleInsert = asDoubly(parse(doublyDefault)).find(
      (frame) => frame.operation === 'set-prev' && frame.change?.nodeId === 'n2' && frame.change.afterId === 'n4',
    )!;
    const model = buildAdvancedLinkedListModel(middleInsert);
    expect(model.nodes.find((node) => node.id === 'n2')!.prevId).toBe('n4');
    expect(model.edges.some((edge) => edge.field === 'prev' && edge.fromId === 'n2' && edge.toId === 'n1')).toBe(false);
  });

  it('model distinguishes prev edges from circular return edges and keeps detached nodes out', () => {
    const doubly = buildAdvancedLinkedListModel(asDoubly(parse(doublyDefault)).find(
      (snapshot) => snapshot.phase === 'complete' && snapshot.nodes.length === 5 && snapshot.headId !== null,
    )!);
    expect(doubly.kind).toBe('doubly-linked-list');
    expect(doubly.edges.filter((edge) => edge.field === 'prev')).toHaveLength(4);
    expect(doubly.edges.filter((edge) => edge.field === 'next')).toHaveLength(4);
    expect(doubly.edges.some((edge) => edge.circular)).toBe(false);

    const circular = buildAdvancedLinkedListModel(asCircular(parse(circularDefault)).find(
      (snapshot) => snapshot.phase === 'complete' && snapshot.nodes.length === 5 && snapshot.headId !== null,
    )!);
    expect(circular.kind).toBe('circular-linked-list');
    expect(circular.edges.some((edge) => edge.circular && !edge.selfLoop)).toBe(true);
    expect(circular.detachedNodes).toEqual([]);

    const afterDelete = buildAdvancedLinkedListModel(asDoubly(parse(doublyDefault)).find(
      (snapshot) => snapshot.operation === 'detach',
    )!);
    expect(afterDelete.detachedNodes.length).toBeGreaterThan(0);
    expect(afterDelete.detachedNodes[0]!.detached).toBe(true);
  });

  it('old singly-linked schema still rejects cycles and does not weaken its invariant', () => {
    const circular = asCircular(parse(circularDefault)).find(
      (snapshot) => snapshot.phase === 'complete' && snapshot.headId !== null,
    )!;
    const oldShape = {
      kind: 'linked-list',
      operation: 'done',
      headId: circular.headId,
      nodes: circular.nodes.map((node) => ({ id: node.id, value: node.value, nextId: node.nextId })),
    };
    const result = linkedListSnapshotSchema.safeParse(oldShape);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.message.includes('cyclic linked list detected'))).toBe(true);
  });

  it('every change equals the previous and current snapshots of the same node/field', () => {
    for (const frames of [parse(doublyDefault), parse(circularDefault)]) {
      for (let index = 1; index < frames.length; index += 1) {
        const change = frames[index]!.structure.change;
        if (!change) continue;
        const current = frames[index]!.structure.nodes.find((node) => node.id === change.nodeId)!;
        const previous = frames[index - 1]!.structure.nodes.find((node) => node.id === change.nodeId)!;
        const actualCurrent = change.field === 'prev' && 'prevId' in current
          ? (current.prevId as string | null)
          : current.nextId;
        const actualPrevious = change.field === 'prev' && 'prevId' in previous
          ? (previous.prevId as string | null)
          : previous.nextId;
        expect(change.afterId).toBe(actualCurrent);
        expect(change.beforeId).toBe(actualPrevious);
      }
    }
  });

  it('lesson step ids resolve to real frames', () => {
    const doublySteps = new Set(parse(doublyDefault).map((frame) => frame.lessonStepId));
    const circularSteps = new Set(parse(circularDefault).map((frame) => frame.lessonStepId));
    for (const step of ['init', 'insert-head', 'insert-tail', 'insert-middle', 'traverse-forward', 'traverse-reverse', 'find', 'delete-middle', 'delete-head', 'delete-tail', 'done']) {
      expect(doublySteps.has(step)).toBe(true);
    }
    for (const step of ['init', 'insert-head', 'insert-tail', 'insert-middle', 'traverse-circle', 'find', 'delete-middle', 'delete-head', 'delete-tail', 'done']) {
      expect(circularSteps.has(step)).toBe(true);
    }
  });
});
