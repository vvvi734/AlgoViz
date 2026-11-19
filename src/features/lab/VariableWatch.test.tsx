import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { I18nProvider } from '../../i18n/I18nProvider';
import type { TraceEvent } from '../../domain/trace/schema';
import { VariableWatch } from './VariableWatch';

const manyVariables = Array.from({ length: 12 }, (_, index) => ({
  name: index === 0 ? 'dist' : `tmp${index}`,
  type: 'int',
  value: index,
}));

const event = {
  schemaVersion: 1,
  step: 0,
  eventType: 'step',
  visualType: 'graph',
  state: { type: 'graph' },
  message: '松弛 dist[E] 的候选值。',
  variables: manyVariables,
  lessonStepId: 'relax',
} as unknown as TraceEvent;

function renderWatch(current: TraceEvent | undefined) {
  render(
    <I18nProvider>
      <VariableWatch event={current} selectedFrameId={null} relatedText={current?.message ?? ''} />
    </I18nProvider>,
  );
}

describe('UX-SIMPLIFY-02 VariableWatch', () => {
  it('shows related variables first and folds the long tail', () => {
    renderWatch(event);
    const table = screen.getByTestId('variables-watch');
    expect(table.querySelectorAll('tbody tr')).toHaveLength(8);
    expect(table.querySelector('tbody tr')?.textContent).toContain('dist');
    expect(screen.getByText('其余变量（4）')).toBeTruthy();
  });

  it('keeps an explicit empty state instead of guessing variables', () => {
    renderWatch(undefined);
    expect(screen.getByTestId('variables-empty')).toBeTruthy();
    expect(screen.queryByTestId('variables-watch')).toBeNull();
  });
});
