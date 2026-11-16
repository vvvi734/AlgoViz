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
    visualType: 'linked',
    state: { type: 'linked', values: [] },
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

function ids(testId: string): string[] {
  return screen.getAllByTestId(testId).map((node) => node.getAttribute('data-node-id') ?? '');
}

describe('VisualStage — dedicated linked-list DOM', () => {
  it('renders node data, next cells and directed arrows in chain order', () => {
    renderStage(event({
      state: { type: 'linked', values: [3, 8, 5] },
      structure: {
        kind: 'linked-list',
        operation: 'visit',
        headId: 'n3',
        nodes: [
          { id: 'n1', value: 5, nextId: null },
          { id: 'n2', value: 8, nextId: 'n1' },
          { id: 'n3', value: 3, nextId: 'n2' },
        ],
        targetId: 'n3',
      },
    }));
    expect(screen.getByTestId('linked-visual')).toBeTruthy();
    expect(ids('linked-node')).toEqual(['n3', 'n2', 'n1']);
    expect(screen.getAllByTestId('linked-node').map((node) => node.getAttribute('data-value')))
      .toEqual(['3', '8', '5']);
    expect(screen.getAllByTestId('linked-node').map((node) => node.getAttribute('data-next-id')))
      .toEqual(['n2', 'n1', 'null']);
    expect(screen.getAllByTestId('linked-edge').map((edge) => [
      edge.getAttribute('data-from-id'),
      edge.getAttribute('data-to-id'),
    ])).toEqual([['n3', 'n2'], ['n2', 'n1']]);
    expect(screen.getByTestId('linked-head').getAttribute('data-node-id')).toBe('n3');
    expect(screen.getByTestId('linked-null').textContent).toBe('NULL');
    expect(screen.getAllByTestId('linked-node')[0].getAttribute('data-status')).toBe('linked');
    expect(screen.getAllByTestId('linked-node')[0].getAttribute('data-active')).toBe('true');
  });

  it('keeps a new node visible outside the main chain', () => {
    renderStage(event({
      state: { type: 'linked', values: [3, 8] },
      structure: {
        kind: 'linked-list',
        operation: 'create',
        headId: 'n1',
        nodes: [
          { id: 'n1', value: 3, nextId: 'n2' },
          { id: 'n2', value: 8, nextId: null },
          { id: 'n4', value: 6, nextId: null },
        ],
        targetId: 'n4',
      },
    }));
    expect(ids('linked-node')).toEqual(['n1', 'n2']);
    expect(ids('linked-detached-node')).toEqual(['n4']);
    expect(screen.getByTestId('linked-detached-node').getAttribute('data-status')).toBe('temporary');
    expect(screen.getByTestId('linked-detached-region')).toBeTruthy();
  });

  it('shows a pointer change with before/after ids and highlights the changed node', () => {
    renderStage(event({
      state: { type: 'linked', values: [3, 6, 8] },
      structure: {
        kind: 'linked-list',
        operation: 'set-next',
        headId: 'n3',
        nodes: [
          { id: 'n3', value: 3, nextId: 'n4' },
          { id: 'n4', value: 6, nextId: 'n2' },
          { id: 'n2', value: 8, nextId: null },
        ],
        targetId: 'n3',
        change: { nodeId: 'n3', beforeNextId: 'n2', afterNextId: 'n4' },
      },
    }));
    const change = screen.getByTestId('linked-change');
    expect(change.getAttribute('data-node-id')).toBe('n3');
    expect(change.getAttribute('data-before-next-id')).toBe('n2');
    expect(change.getAttribute('data-after-next-id')).toBe('n4');
    expect(screen.getAllByTestId('linked-node')[0].getAttribute('data-changed')).toBe('true');
    expect(screen.getAllByTestId('linked-edge')[0].getAttribute('data-changed')).toBe('true');
  });

  it('renders an empty HEAD -> NULL list without a fake node', () => {
    renderStage(event({
      state: { type: 'linked', values: [] },
      structure: { kind: 'linked-list', operation: 'init', headId: null, nodes: [] },
    }));
    expect(screen.getByTestId('linked-empty').textContent).toContain('HEAD');
    expect(screen.getByTestId('linked-empty').textContent).toContain('NULL');
    expect(screen.queryAllByTestId('linked-node')).toHaveLength(0);
    expect(screen.queryByTestId('linked-head')).toBeNull();
  });

  it('does not merge equal values: two nodes keep separate ids and next targets', () => {
    renderStage(event({
      state: { type: 'linked', values: [3, 3] },
      structure: {
        kind: 'linked-list',
        operation: 'visit',
        headId: 'n1',
        nodes: [
          { id: 'n1', value: 3, nextId: 'n2' },
          { id: 'n2', value: 3, nextId: null },
        ],
        targetId: 'n2',
      },
    }));
    expect(ids('linked-node')).toEqual(['n1', 'n2']);
    expect(screen.getAllByTestId('linked-node').map((node) => node.getAttribute('data-next-id')))
      .toEqual(['n2', 'null']);
    expect(screen.getAllByTestId('linked-node')[1].getAttribute('data-active')).toBe('true');
  });

  it('shows the detached node with next cleared after deletion', () => {
    renderStage(event({
      state: { type: 'linked', values: [3, 6, 5] },
      structure: {
        kind: 'linked-list',
        operation: 'detach',
        headId: 'n3',
        nodes: [
          { id: 'n3', value: 3, nextId: 'n4' },
          { id: 'n4', value: 6, nextId: 'n1' },
          { id: 'n2', value: 8, nextId: null },
          { id: 'n1', value: 5, nextId: null },
        ],
        targetId: 'n2',
        change: { nodeId: 'n2', beforeNextId: 'n1', afterNextId: null },
      },
    }));
    expect(ids('linked-node')).toEqual(['n3', 'n4', 'n1']);
    expect(screen.getByTestId('linked-detached-node').getAttribute('data-node-id')).toBe('n2');
    expect(screen.getByTestId('linked-detached-node').getAttribute('data-next-id')).toBe('null');
    expect(screen.getByTestId('linked-detached-node').getAttribute('data-status')).toBe('detached');
  });
});
