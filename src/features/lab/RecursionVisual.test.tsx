import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CallFrame, TraceEvent, VariableSnapshot } from '../../domain/trace/schema';
import { I18nProvider } from '../../i18n/I18nProvider';
import { VisualStage } from './VisualStage';

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

function event(step: number, stack: CallFrame[], extra: Partial<TraceEvent> = {}): TraceEvent {
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

/** Real factorial(3) shape, including the combining frame and final answer. */
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
    frame('f2', 2, 1, 'running', [intVar('n', 2), intVar('partial', 1), intVar('result', 2)]),
  ]),
  event(8, [frame('f1', 3, 0), frame('f2', 2, 1, 'returning')]),
  event(9, [
    frame('f1', 3, 0, 'running', [intVar('n', 3), intVar('partial', 2), intVar('result', 6)]),
  ]),
  event(10, [frame('f1', 3, 0, 'returning')]),
  event(11, [], { eventType: 'done', variables: [intVar('answer', 6)] }),
];

/** Fibonacci(4) topology with two independent fib(2) calls. */
const FIB_4: TraceEvent[] = [
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

function renderStage(events: TraceEvent[], index: number, algorithmId: string) {
  return render(
    <I18nProvider>
      <VisualStage event={events[index]} events={events} index={index} algorithmId={algorithmId} />
    </I18nProvider>,
  );
}

describe('RECUR-01 recursion canvas', () => {
  it('shows future factorial calls as pending and marks the combining frame current', () => {
    renderStage(FACTORIAL_3, 7, 'factorial');
    expect(screen.getByTestId('recursion-visual')).toBeTruthy();
    expect(screen.getAllByTestId(/recursion-node-/)).toHaveLength(3);
    expect(screen.getByTestId('recursion-node-f1').getAttribute('data-status')).toBe('waiting');
    expect(screen.getByTestId('recursion-node-f2').getAttribute('data-current')).toBe('true');
    expect(screen.getByTestId('recursion-node-f2').textContent).toContain('2 × 1 = 2');
    expect(screen.getByTestId('recursion-node-f3').getAttribute('data-status')).toBe('returned');
    expect(screen.getByTestId('recursion-stack-depth').textContent).toContain('2');
    expect(screen.getByTestId('recursion-returned-count').textContent).toContain('1');
    expect(screen.queryByTestId('recursion-result')).toBeNull();
  });

  it('renders the final factorial answer without a leftover current node', () => {
    renderStage(FACTORIAL_3, 11, 'factorial');
    expect(screen.getByTestId('recursion-node-f1').getAttribute('data-current')).toBe('false');
    expect(screen.getByTestId('recursion-result').textContent).toContain('6');
    expect(screen.getByTestId('recursion-returned-count').textContent).toContain('3');
  });

  it('renders the Fibonacci tree and calls out repeated fib(2) subproblems', () => {
    renderStage(FIB_4, 8, 'fib');
    expect(screen.getAllByTestId(/recursion-node-/)).toHaveLength(9);
    expect(screen.getByTestId('recursion-node-f9').getAttribute('data-current')).toBe('true');
    expect(screen.getByTestId('recursion-node-f7').getAttribute('data-status')).toBe('waiting');
    expect(screen.getByTestId('recursion-repeat-note').textContent).toContain('fib(2) × 2');
    expect(screen.getByTestId('recursion-node-f3').getAttribute('data-status')).toBe('returned');
    expect(screen.getByTestId('recursion-node-f4').getAttribute('data-status')).toBe('returned');
  });
});
