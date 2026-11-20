import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../theme/ThemeProvider';
import { I18nProvider } from '../i18n/I18nProvider';
import { App } from './App';

vi.mock('../runtime/execute', () => {
  const frames = [
    { state: { type: 'array', values: [3, 1, 2] }, message: 'STEP ONE' },
    { state: { type: 'array', values: [1, 2, 3], done: true }, message: 'STEP TWO' },
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

describe('AlgoViz brand migration and storage compatibility', () => {
  it('shows AlgoViz in the app shell and no visible AlgoLens brand', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('brand-name').textContent).toContain('AlgoViz'));
    expect(screen.getByTestId('brand-name').textContent).toContain('交互式数据结构与算法学习平台');
    expect(document.body.textContent).not.toContain('AlgoLens');
  });

  it('ignores legacy drafts and runs the built-in example', async () => {
    window.localStorage.setItem('algolens.code.bubble.js', 'const LEGACY_DRAFT = 1;');
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress')).toBeTruthy());
    expect(screen.queryByTestId('code-editor')).toBeNull();
    expect(screen.getByTestId('run-input')).toBeTruthy();
  });

  it('still stores the theme under the legacy key', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress')).toBeTruthy());
    const select = screen.getByTestId('theme-select') as HTMLSelectElement;
    select.value = 'light';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    expect(window.localStorage.getItem('algolens-theme')).toBe('light');
  });
});
