import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { I18nProvider } from '../../i18n/I18nProvider';
import type { TraceEvent } from '../../domain/trace/schema';
import { VisualStage } from './VisualStage';

function event(overrides: Partial<TraceEvent>): TraceEvent {
  return {
    schemaVersion: 1,
    step: 0,
    eventType: 'step',
    visualType: 'stack',
    state: { type: 'stack', values: [] },
    message: 'frame',
    ...overrides,
  } as TraceEvent;
}

function renderStage(value: TraceEvent | undefined) {
  return render(
    <I18nProvider>
      <VisualStage event={value} />
    </I18nProvider>,
  );
}

function stackValues(): string[] {
  return screen.getAllByTestId('stack-item').map((node) => node.getAttribute('data-value') ?? '');
}

function queueValues(): string[] {
  return screen.getAllByTestId('queue-item').map((node) => node.getAttribute('data-value') ?? '');
}

describe('VisualStage — dedicated stack/queue DOM', () => {
  it('renders a stack top→bottom in the DOM with a TOP marker', () => {
    renderStage(event({
      visualType: 'stack',
      state: { type: 'stack', values: [3, 5, 8] },
      structure: {
        kind: 'stack',
        operation: 'push',
        items: [{ id: 's1', value: 3 }, { id: 's2', value: 5 }, { id: 's3', value: 8 }],
        targetId: 's3',
      },
    }));
    expect(screen.getByTestId('stack-visual')).toBeTruthy();
    expect(screen.getByTestId('stack-top').textContent).toBe('TOP');
    expect(stackValues()).toEqual(['8', '5', '3']);
    const items = screen.getAllByTestId('stack-item');
    expect(items[0].getAttribute('data-role')).toBe('top');
    expect(items[0].getAttribute('data-status')).toBe('entering');
    expect(items[0].getAttribute('data-element-id')).toBe('s3');
    expect(items[1].getAttribute('data-role')).toBe('member');
    expect(screen.getByTestId('stack-op-label').textContent).toContain('PUSH');
  });

  it('renders the popped value outside the remaining stack', () => {
    renderStage(event({
      visualType: 'stack',
      state: { type: 'stack', values: [3, 5] },
      structure: {
        kind: 'stack',
        operation: 'pop',
        items: [{ id: 's1', value: 3 }, { id: 's2', value: 5 }],
        targetId: 's3',
        removed: { id: 's3', value: 8 },
      },
    }));
    expect(stackValues()).toEqual(['5', '3']);
    expect(screen.getByTestId('stack-leaving').getAttribute('data-value')).toBe('8');
    expect(screen.getByTestId('stack-op-label').textContent).toContain('POP');
  });

  it('renders the empty stack label, not a fake element', () => {
    renderStage(event({
      visualType: 'stack',
      state: { type: 'stack', values: [] },
      structure: { kind: 'stack', operation: 'init', items: [] },
    }));
    expect(screen.queryAllByTestId('stack-item')).toHaveLength(0);
    expect(screen.getByTestId('stack-empty').textContent).toContain('空栈');
  });

  it('renders a queue front→rear with FRONT and REAR ends', () => {
    renderStage(event({
      visualType: 'queue',
      state: { type: 'queue', values: [3, 5, 8] },
      structure: {
        kind: 'queue',
        operation: 'front',
        items: [{ id: 'q1', value: 3 }, { id: 'q2', value: 5 }, { id: 'q3', value: 8 }],
        targetId: 'q1',
      },
    }));
    expect(screen.getByTestId('queue-visual')).toBeTruthy();
    expect(queueValues()).toEqual(['3', '5', '8']);
    const items = screen.getAllByTestId('queue-item');
    expect(items[0].getAttribute('data-role')).toBe('front');
    expect(items[2].getAttribute('data-role')).toBe('rear');
    expect(items[0].getAttribute('data-active')).toBe('true');
    expect(screen.getByTestId('queue-front').textContent).toContain('FRONT');
    expect(screen.getByTestId('queue-rear').textContent).toContain('REAR');
  });

  it('renders dequeue with FRONT leaving and the next element becoming FRONT', () => {
    renderStage(event({
      visualType: 'queue',
      state: { type: 'queue', values: [5, 8] },
      structure: {
        kind: 'queue',
        operation: 'dequeue',
        items: [{ id: 'q2', value: 5 }, { id: 'q3', value: 8 }],
        targetId: 'q1',
        removed: { id: 'q1', value: 3 },
      },
    }));
    expect(queueValues()).toEqual(['5', '8']);
    expect(screen.getAllByTestId('queue-item')[0].getAttribute('data-role')).toBe('front');
    expect(screen.getByTestId('queue-leaving').getAttribute('data-value')).toBe('3');
  });

  it('shows an empty queue with no fake items', () => {
    renderStage(event({
      visualType: 'queue',
      state: { type: 'queue', values: [] },
      structure: { kind: 'queue', operation: 'init', items: [] },
    }));
    expect(screen.queryAllByTestId('queue-item')).toHaveLength(0);
    expect(screen.getByTestId('queue-empty').textContent).toContain('空队列');
  });
});
