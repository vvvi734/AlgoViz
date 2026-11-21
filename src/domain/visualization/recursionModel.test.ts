import { describe, expect, it } from 'vitest';
import type { CallFrame, TraceEvent, VariableSnapshot } from '../trace/schema';
import { buildRecursionModel } from './recursionModel';

function intVar(name: string, value: number): VariableSnapshot {
  return { name, type: 'int', value };
}

function frame(
  frameId: string,
  n: number,
  depth: number,
  status: 'running' | 'returning' = 'running',
  locals: VariableSnapshot[] = [intVar('n', n)],
): CallFrame {
  return {
    frameId,
    name: 'recursive',
    depth,
    status,
    arguments: [intVar('n', n)],
    locals,
    ...(status === 'returning' ? { returnValue: n } : {}),
  };
}

function event(
  step: number,
  stack: CallFrame[],
  extra: Partial<TraceEvent> = {},
): TraceEvent {
  return {
    schemaVersion: 1,
    step,
    eventType: 'step',
    visualType: 'stack',
    state: { type: 'stack', values: stack.map((item) => item.name) },
    message: `step ${step}`,
    ...(stack.length ? { callStack: stack } : {}),
    ...extra,
  };
}

/**
 * A real factorial(3) shape: enter f1→f2→f3, hit the base case, then combine
 * on the way back. The numbers in locals are what the Python preset emits.
 */
const FACTORIAL_3: TraceEvent[] = [
  event(0, [frame('f1', 3, 0)]),
  event(1, [frame('f1', 3, 0)]),
  event(2, [frame('f1', 3, 0), frame('f2', 2, 1)]),
  event(3, [frame('f1', 3, 0), frame('f2', 2, 1)]),
  event(4, [frame('f1', 3, 0), frame('f2', 2, 1), frame('f3', 1, 2)]),
  event(5, [frame('f1', 3, 0), frame('f2', 2, 1), frame('f3', 1, 2)]),
  event(6, [frame('f1', 3, 0), frame('f2', 2, 1), frame('f3', 1, 2, 'returning')]),
  event(7, [
    frame('f1', 3, 0),
    frame('f2', 2, 1, 'running', [
      intVar('n', 2),
      intVar('partial', 1),
      intVar('result', 2),
    ]),
  ]),
  event(8, [frame('f1', 3, 0), frame('f2', 2, 1, 'returning')]),
  event(9, [
    frame('f1', 3, 0, 'running', [
      intVar('n', 3),
      intVar('partial', 2),
      intVar('result', 6),
    ]),
  ]),
  event(10, [frame('f1', 3, 0, 'returning')]),
  event(11, [], { eventType: 'done', variables: [intVar('answer', 6)] }),
];

/**
 * Fibonacci(4) call structure. This fixture is about topology and playback
 * state, so every call is a snapshot on its real path; the Pyodide E2E covers
 * the real return values.
 */
const FIB_4_TOPOLOGY: TraceEvent[] = [
  event(0, [frame('f1', 4, 0)]),
  event(1, [frame('f1', 4, 0), frame('f2', 3, 1)]),
  event(2, [frame('f1', 4, 0), frame('f2', 3, 1), frame('f3', 2, 2)]),
  event(3, [frame('f1', 4, 0), frame('f2', 3, 1), frame('f3', 2, 2), frame('f4', 1, 3)]),
  event(4, [frame('f1', 4, 0), frame('f2', 3, 1), frame('f3', 2, 2), frame('f5', 0, 3)]),
  event(5, [frame('f1', 4, 0), frame('f2', 3, 1), frame('f6', 1, 2)]),
  event(6, [frame('f1', 4, 0), frame('f7', 2, 1)]),
  event(7, [frame('f1', 4, 0), frame('f7', 2, 1), frame('f8', 1, 2)]),
  event(8, [frame('f1', 4, 0), frame('f7', 2, 1), frame('f9', 0, 2)]),
  event(9, [], { eventType: 'done', variables: [intVar('answer', 3)] }),
];

describe('RECUR-01 recursion model', () => {
  it('builds the factorial chain from real frame snapshots and keeps future calls pending', () => {
    const model = buildRecursionModel(FACTORIAL_3, 0, 'factorial')!;
    expect(model.kind).toBe('call-chain');
    expect(model.nodes.map((node) => node.id)).toEqual(['f1', 'f2', 'f3']);
    expect(model.nodes.map((node) => node.n)).toEqual([3, 2, 1]);
    expect(model.nodes.find((node) => node.id === 'f1')!.status).toBe('active');
    expect(model.nodes.filter((node) => node.status === 'pending')).toHaveLength(2);
    expect(model.pendingCount).toBe(2);
    expect(model.stackDepth).toBe(1);
    expect(model.currentId).toBe('f1');
    expect(model.returnedCount).toBe(0);
    expect(model.result).toBeNull();
  });

  it('moves the active marker to the returning frame, then to the parent combination', () => {
    const returning = buildRecursionModel(FACTORIAL_3, 6, 'factorial')!;
    expect(returning.nodes.find((node) => node.id === 'f3')!.status).toBe('returning');
    expect(returning.nodes.find((node) => node.id === 'f3')!.returnValue).toBe(1);
    expect(returning.nodes.find((node) => node.id === 'f2')!.status).toBe('waiting');
    expect(returning.stackDepth).toBe(3);

    const combining = buildRecursionModel(FACTORIAL_3, 7, 'factorial')!;
    const parent = combining.nodes.find((node) => node.id === 'f2')!;
    expect(parent.status).toBe('active');
    expect(parent.isCurrent).toBe(true);
    expect(parent.combine).toBe('2 × 1 = 2');
    expect(combining.nodes.find((node) => node.id === 'f3')!.status).toBe('returned');
  });

  it('returns both the graph and the final value after every call unwinds', () => {
    const model = buildRecursionModel(FACTORIAL_3, FACTORIAL_3.length - 1, 'factorial')!;
    expect(model.nodes.every((node) => node.status === 'returned')).toBe(true);
    expect(model.returnedCount).toBe(3);
    expect(model.pendingCount).toBe(0);
    expect(model.stackDepth).toBe(0);
    expect(model.currentId).toBeNull();
    expect(model.result).toBe(6);
    expect(model.links.every((link) => link.status === 'returned')).toBe(true);
  });

  it('builds a two-branch Fibonacci tree and marks repeated n values', () => {
    const model = buildRecursionModel(FIB_4_TOPOLOGY, FIB_4_TOPOLOGY.length - 1, 'fib')!;
    expect(model.kind).toBe('call-tree');
    expect(model.nodes).toHaveLength(9);
    const root = model.nodes.find((node) => node.id === 'f1')!;
    expect(root.parentId).toBeNull();
    expect(model.nodes.filter((node) => node.parentId === 'f1').map((node) => node.id)).toEqual(['f2', 'f7']);
    expect(model.nodes.find((node) => node.id === 'f4')!.parentId).toBe('f3');
    expect(model.repeated).toEqual([{ n: 2, count: 2 }]);
    const twins = model.nodes.filter((node) => node.n === 2);
    expect(twins).toHaveLength(2);
    expect(twins[0]!.repeatTone).toBe(twins[1]!.repeatTone);
    expect(twins.every((node) => node.repeatTone !== null)).toBe(true);
    expect(model.result).toBe(3);
    expect(model.nodes.every((node) => node.status === 'returned')).toBe(true);
  });

  it('does not shrink a large tree; it reports a scrollable width instead', () => {
    const small = buildRecursionModel(FIB_4_TOPOLOGY, 0, 'fib')!;
    const large = buildRecursionModel(
      FIB_4_TOPOLOGY.map((item) => ({
        ...item,
        callStack: item.callStack?.map((itemFrame) => ({ ...itemFrame })),
      })),
      0,
      'fib',
    )!;
    expect(small.nodeWidth).toBe(88);
    expect(large.nodeWidth).toBe(88);
    expect(small.width).toBe(large.width);
    expect(small.nodes.filter((node) => node.status === 'pending')).toHaveLength(8);
  });

  it('returns null for every non-recursive algorithm', () => {
    expect(buildRecursionModel(FACTORIAL_3, 0, 'bubble')).toBeNull();
    expect(buildRecursionModel([], 0, 'factorial')).toBeNull();
  });
});
