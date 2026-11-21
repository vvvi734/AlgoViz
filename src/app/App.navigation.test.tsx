import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
        <App initialConcept={null} />
      </I18nProvider>
    </ThemeProvider>,
  );
}

async function openAlgorithm(id: string) {
  fireEvent.change(screen.getByTestId('mobile-algo-select'), { target: { value: id } });
  await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 3'));
}

describe('course navigation starts a fresh session', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  });

  it('rewinds the shared playhead and scrolls to the top when the course changes', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 3'));

    fireEvent.click(screen.getByTestId('next-btn'));
    expect(screen.getByTestId('progress').textContent).toBe('2 / 3');
    document.documentElement.scrollTop = 320;
    document.body.scrollTop = 320;

    await openAlgorithm('insertion');

    expect(screen.getByTestId('progress').textContent).toBe('1 / 3');
    expect(document.documentElement.scrollTop).toBe(0);
    expect(document.body.scrollTop).toBe(0);
  });

  it('opens the guide for an unseen course and restores each course fold state', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 3'));
    const initialAlgorithm = (screen.getByTestId('mobile-algo-select') as HTMLSelectElement).value;

    const toggle = screen.getByTestId('guide-toggle');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    await openAlgorithm('insertion');
    expect(screen.getByTestId('guide-toggle').getAttribute('aria-expanded')).toBe('true');

    await openAlgorithm(initialAlgorithm);
    expect(screen.getByTestId('guide-toggle').getAttribute('aria-expanded')).toBe('false');
  });
});
