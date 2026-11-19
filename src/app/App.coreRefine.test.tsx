import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../theme/ThemeProvider';
import { I18nProvider } from '../i18n/I18nProvider';
import { App } from './App';

vi.mock('../runtime/execute', () => {
  const frames = [
    { state: { type: 'array', values: [3, 1, 2], focus: [0] }, message: 'STEP ONE' },
    { state: { type: 'array', values: [1, 3, 2], focus: [1] }, message: 'STEP TWO' },
    { state: { type: 'array', values: [1, 2, 3], done: true }, message: 'STEP THREE' },
  ];
  return {
    runForLanguage: vi.fn(async () => ({ frames })),
    isVisualResult: (value: unknown) => typeof value === 'object' && value !== null && 'frames' in value,
  };
});

function renderApp() {
  return render(
    <ThemeProvider>
      <I18nProvider>
        <App />
      </I18nProvider>
    </ThemeProvider>,
  );
}

async function ready() {
  await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 3'));
}

describe('CORE-REFINE-01 shell integration', () => {
  it('opens a concept lesson without a player, trace or code editor and returns to the algorithm', async () => {
    renderApp();
    await ready();

    fireEvent.click(screen.getByTestId('chapter-ch7-graph'));
    fireEvent.click(screen.getByTestId('topic-graph-basics'));
    expect(screen.getByTestId('concept-page')).toBeTruthy();
    expect(screen.getByTestId('concept-title').textContent).toContain('图的基本概念');
    expect(screen.queryByTestId('visual-stage')).toBeNull();
    expect(screen.queryByTestId('run-btn')).toBeNull();
    expect(screen.queryByTestId('next-btn')).toBeNull();
    expect(screen.queryByTestId('code-dock')).toBeNull();
    expect(screen.queryByTestId('workspace-tabs')).toBeNull();
    expect(screen.queryByTestId('reference-code-panel')).toBeNull();

    fireEvent.click(screen.getByTestId('concept-back'));
    expect(screen.queryByTestId('concept-page')).toBeNull();
    expect(screen.getByTestId('visual-stage')).toBeTruthy();
    expect(screen.getByTestId('progress').textContent).toBe('1 / 3');
  });

  it('shows only the trilingual reference panel in the advanced area', async () => {
    renderApp();
    await ready();

    expect(screen.queryByTestId('workspace-tab-state')).toBeNull();
    expect(screen.queryByTestId('workspace-tab-mentor')).toBeNull();
    expect(screen.queryByTestId('workspace-tab-tools')).toBeNull();
    expect(screen.queryByTestId('reference-code-panel')).toBeNull();

    fireEvent.click(screen.getByTestId('workspace-tabs-toggle'));
    expect(screen.getByTestId('workspace-tabs').getAttribute('data-expanded')).toBe('true');
    expect(screen.getByTestId('reference-code-panel')).toBeTruthy();
    expect(screen.getByTestId('reference-lang-c')).toBeTruthy();
    expect(screen.getByTestId('reference-lang-cpp')).toBeTruthy();
    expect(screen.getByTestId('reference-lang-python')).toBeTruthy();
    expect(screen.getByTestId('reference-copy')).toBeTruthy();

    fireEvent.click(screen.getByTestId('reference-lang-cpp'));
    expect(screen.getByTestId('reference-code-panel').getAttribute('data-language')).toBe('cpp');
  });

  it('expands and collapses the whole textbook directory without losing the selected algorithm', async () => {
    renderApp();
    await ready();
    const selected = screen.getByTestId('algo-bubble');
    expect(selected.getAttribute('aria-current')).toBe('true');

    fireEvent.click(screen.getByTestId('sidebar-collapse-all'));
    for (const chapter of ['ch1-intro', 'ch2-algorithm', 'ch9-sort']) {
      expect(screen.getByTestId(`chapter-${chapter}`).getAttribute('aria-expanded')).toBe('false');
    }
    expect(screen.getByTestId('algo-bubble').getAttribute('aria-current')).toBe('true');
    expect(screen.getByTestId('progress').textContent).toBe('1 / 3');

    fireEvent.click(screen.getByTestId('sidebar-expand-all'));
    expect(screen.getByTestId('chapter-ch2-algorithm').getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByTestId('topic-shortest-path').getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByTestId('algo-dijkstra')).toBeTruthy();
    expect(screen.getByTestId('algo-bubble').getAttribute('aria-current')).toBe('true');
  });
});
