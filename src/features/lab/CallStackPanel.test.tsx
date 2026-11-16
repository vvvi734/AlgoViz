import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CallStackPanel } from './CallStackPanel';
import { I18nProvider } from '../../i18n/I18nProvider';
import type { TraceEvent } from '../../domain/trace/schema';

const event: TraceEvent = {
  schemaVersion: 1,
  step: 0,
  eventType: 'step',
  visualType: 'stack',
  state: { type: 'stack', values: ['factorial', 'factorial'] },
  message: '调用 / call factorial(2)',
  callStack: [
    { name: 'factorial', frameId: 'f1', depth: 0, status: 'running', arguments: [{ name: 'n', type: 'int', value: 4 }], locals: [{ name: 'n', type: 'int', value: 4 }] },
    { name: 'factorial', frameId: 'f2', depth: 1, status: 'running', arguments: [{ name: 'n', type: 'int', value: 3 }], locals: [{ name: 'n', type: 'int', value: 3 }] },
  ],
};

function renderPanel(e: TraceEvent | undefined, selectedFrameId: string | null = null) {
  return render(
    <I18nProvider>
      <CallStackPanel event={e} selectedFrameId={selectedFrameId} onSelectFrame={vi.fn()} />
    </I18nProvider>,
  );
}

describe('CallStackPanel (Stage 3)', () => {
  it('shows an empty state when the event has no call stack', () => {
    renderPanel({ ...event, callStack: undefined });
    expect(screen.getByTestId('call-stack-empty')).toBeTruthy();
    expect(screen.queryByTestId('call-stack')).toBeNull();
  });

  it('renders each frame with distinct depth and same-named locals', () => {
    renderPanel(event);
    const frames = screen.getAllByRole('button');
    expect(frames).toHaveLength(2);
    // Newest (deepest) frame is rendered first.
    expect(screen.getByTestId('call-frame-f2').textContent).toContain('factorial');
    expect(screen.getByTestId('call-frame-f2').textContent).toContain('n = 3');
    expect(screen.getByTestId('call-frame-f1').textContent).toContain('n = 4');
  });

  it('highlights the active (top) frame', () => {
    renderPanel(event);
    expect(screen.getByTestId('call-frame-f2').className).toContain('active');
    expect(screen.getByTestId('call-frame-f1').className).not.toContain('active');
  });

  it('marks a selected frame and shows a return value for returning frames', () => {
    const returning: TraceEvent = {
      ...event,
      callStack: [
        { name: 'factorial', frameId: 'f1', depth: 0, status: 'running', locals: [{ name: 'n', type: 'int', value: 2 }] },
        { name: 'factorial', frameId: 'f2', depth: 1, status: 'returning', returnValue: 1, locals: [{ name: 'n', type: 'int', value: 1 }] },
      ],
    };
    renderPanel(returning, 'f1');
    expect(screen.getByTestId('call-frame-f1').className).toContain('selected');
    expect(screen.getByTestId('call-frame-f2').textContent).toContain('1');
  });
});
