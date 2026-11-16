import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SyncPanel } from './SyncPanel';
import { I18nProvider } from '../../i18n/I18nProvider';
import type { TraceEvent } from '../../domain/trace/schema';

const source = [
  'arr = list(input)',
  'for i in range(n):',
  '    if arr[j] > arr[j + 1]:',
  '        arr[j], arr[j + 1] = arr[j + 1], arr[j]',
].join('\n');

function renderPanel(event?: TraceEvent, stale = false) {
  return render(
    <I18nProvider>
      <SyncPanel event={event} source={source} stale={stale} />
    </I18nProvider>,
  );
}

const baseEvent: TraceEvent = {
  schemaVersion: 1,
  step: 0,
  eventType: 'swap',
  visualType: 'array',
  state: { type: 'array', values: [1, 2] },
  message: '交换 / Swap',
  sourceLocation: { line: 4 },
  variables: [
    { name: 'i', type: 'int', value: 0 },
    { name: 'arr', type: 'list', value: [1, 2] },
  ],
};

describe('SyncPanel (Stage-1 synchronous observation)', () => {
  it('highlights the source line linked to the current event', () => {
    renderPanel(baseEvent);
    const active = document.querySelector('.codeline.active');
    expect(active).not.toBeNull();
    expect(active?.textContent).toContain('arr[j], arr[j + 1]');
  });

  it('shows variables from the current event', () => {
    renderPanel(baseEvent);
    const table = screen.getByTestId('variables-watch');
    expect(table.textContent).toContain('i');
    expect(table.textContent).toContain('int');
    expect(table.textContent).toContain('0');
    expect(table.textContent).toContain('arr');
  });

  it('shows the step explanation', () => {
    renderPanel(baseEvent);
    expect(screen.getByTestId('step-explanation').textContent).toBe('交换 / Swap');
  });

  it('shows an empty state when the event has no variables', () => {
    renderPanel({ ...baseEvent, variables: undefined });
    expect(screen.getByTestId('variables-empty')).toBeTruthy();
    expect(screen.queryByTestId('variables-watch')).toBeNull();
  });

  it('shows a no-location hint when the event has no source line', () => {
    renderPanel({ ...baseEvent, sourceLocation: undefined });
    expect(screen.getByTestId('no-location')).toBeTruthy();
    expect(document.querySelector('.codeline.active')).toBeNull();
  });

  it('warns when the editor has diverged from the trace snapshot', () => {
    renderPanel(baseEvent, true);
    expect(screen.getByTestId('sync-stale')).toBeTruthy();
  });
});
