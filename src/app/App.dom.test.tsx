import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../theme/ThemeProvider';
import { I18nProvider } from '../i18n/I18nProvider';
import { setSystemDark } from '../test/setup';
import { App } from './App';

// The app's run path is mocked so the UI regression does not need a real
// Worker (jsdom has none). Frame production itself is verified against the
// legacy baseline in src/domain/algorithms/catalog.test.ts.
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

describe('App UI regression (Phase 1)', () => {
  it('renders all 19 presets and loads a timeline on startup', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 3'));
    expect(screen.getAllByTestId(/^algo-/)).toHaveLength(19);
    expect(screen.getByTestId('algo-prim')).toBeTruthy();
    expect(screen.getByTestId('algo-kruskal')).toBeTruthy();
    expect(screen.getByTestId('progress').textContent).toBe('1 / 3');
    expect((screen.getByTestId('code-editor') as HTMLTextAreaElement).value).toContain('const arr');
    expect(document.querySelectorAll('.bar')).toHaveLength(3);
  });

  it('keeps play / pause / rewind / step / scrub behaviour', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 3'));
    fireEvent.click(screen.getByTestId('next-btn'));
    expect(screen.getByTestId('step-desc').textContent).toBe('STEP TWO');
    expect(screen.getByTestId('progress').textContent).toBe('2 / 3');
    fireEvent.click(screen.getByTestId('prev-btn'));
    expect(screen.getByTestId('step-desc').textContent).toBe('STEP ONE');
    fireEvent.change(screen.getByTestId('scrub'), { target: { value: '2' } });
    expect(screen.getByTestId('step-desc').textContent).toBe('STEP THREE');
    fireEvent.click(screen.getByTestId('play-btn'));
    expect(screen.getByTestId('play-btn').textContent).toContain('暂停');
    fireEvent.click(screen.getByTestId('play-btn'));
    expect(screen.getByTestId('play-btn').textContent).toContain('播放');
  });

  it('supports light / dark / system and follows OS changes live', async () => {
    setSystemDark(true);
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 3'));
    expect(document.documentElement.dataset.theme).toBe('dark');

    fireEvent.change(screen.getByTestId('theme-select'), { target: { value: 'light' } });
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(window.localStorage.getItem('algolens-theme')).toBe('light');

    fireEvent.change(screen.getByTestId('theme-select'), { target: { value: 'system' } });
    expect(document.documentElement.dataset.theme).toBe('dark');
    act(() => setSystemDark(false));
    expect(document.documentElement.dataset.theme).toBe('light');
    act(() => setSystemDark(true));
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('switches UI language, practice bank and AI import tabs', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 3'));
    fireEvent.click(screen.getByRole('button', { name: 'Switch language' }));
    expect(screen.getByTestId('play-btn').textContent).toBe('▶ Play');

    fireEvent.click(screen.getByTestId('nav-more'));
    fireEvent.click(screen.getByTestId('nav-practice'));
    expect(screen.getAllByTestId(/^problem-/)).toHaveLength(8);
    fireEvent.click(screen.getByTestId('nav-more'));
    fireEvent.click(screen.getByTestId('nav-custom'));
    expect(screen.getByTestId('custom-view')).toBeTruthy();
  });
});
