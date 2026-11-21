import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../theme/ThemeProvider';
import { I18nProvider } from '../i18n/I18nProvider';
import { runForLanguage } from '../runtime/execute';
import { App } from './App';

vi.mock('../runtime/execute', () => ({
  runForLanguage: vi.fn(async () => ({
    frames: [
      { state: { type: 'stack', values: ['frame'] }, message: 'FIRST' },
      { state: { type: 'stack', values: [], done: true }, message: 'DONE' },
    ],
  })),
  isVisualResult: (value: unknown) => typeof value === 'object' && value !== null && 'frames' in value,
}));

const mockedRun = vi.mocked(runForLanguage);

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
  await waitFor(() => expect(screen.getByTestId('guided-input').getAttribute('data-algorithm')).toBe(id));
  await waitFor(() => expect(mockedRun.mock.calls.at(-1)?.[4]).toBe('python'));
}

function lastInput(): number {
  return mockedRun.mock.calls.at(-1)?.[2] as number;
}

function inputValue(): string {
  return (screen.getByTestId('recursion-n') as HTMLInputElement).value;
}

beforeEach(() => {
  mockedRun.mockClear();
});

describe('RECUR-01 — factorial / Fibonacci share the guided input pipeline', () => {
  it('runs factorial(3), clears the old trace for an invalid n and restores the official example', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 2'));
    await openAlgorithm('factorial');

    expect(screen.queryByTestId('recursion-visual')).toBeNull();
    expect(inputValue()).toBe('4');
    expect(screen.getByTestId('guided-mode-official').getAttribute('aria-pressed')).toBe('true');

    fireEvent.change(screen.getByTestId('recursion-n'), { target: { value: '3' } });
    expect(screen.getByTestId('guided-mode-custom').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByTestId('run-btn'));
    await waitFor(() => expect(lastInput()).toBe(3));
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 2'));

    const beforeInvalid = mockedRun.mock.calls.length;
    fireEvent.change(screen.getByTestId('recursion-n'), { target: { value: '11' } });
    fireEvent.click(screen.getByTestId('run-btn'));
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('0 / 0'));
    expect(mockedRun.mock.calls.length).toBe(beforeInvalid);
    expect(screen.getByTestId('run-feedback').textContent).toContain('0 到 10');

    fireEvent.click(screen.getByTestId('guided-mode-official'));
    await waitFor(() => expect(inputValue()).toBe('4'));
    await waitFor(() => expect(lastInput()).toBe(4));
  });

  it('fills Fibonacci random n without running, then runs the exact visible integer', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 2'));
    await openAlgorithm('fib');

    expect(inputValue()).toBe('4');
    const beforeRandom = mockedRun.mock.calls.length;
    fireEvent.click(screen.getByTestId('random-btn'));
    expect(mockedRun.mock.calls.length).toBe(beforeRandom);
    expect(screen.getByTestId('guided-mode-random').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('guided-random-scenario')).not.toBeNull();
    const randomN = Number(inputValue());
    expect(Number.isInteger(randomN)).toBe(true);
    expect(randomN).toBeGreaterThanOrEqual(0);
    expect(randomN).toBeLessThanOrEqual(8);

    fireEvent.click(screen.getByTestId('run-btn'));
    await waitFor(() => expect(lastInput()).toBe(randomN));

    const beforeLanguage = mockedRun.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Switch language' }));
    expect(inputValue()).toBe(String(randomN));
    expect(mockedRun.mock.calls.length).toBe(beforeLanguage);
  });

  it('rejects fib(9), restores fib(4), and resets the draft when switching algorithms', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 2'));
    await openAlgorithm('fib');

    fireEvent.change(screen.getByTestId('recursion-n'), { target: { value: '9' } });
    fireEvent.click(screen.getByTestId('run-btn'));
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('0 / 0'));
    expect(screen.getByTestId('run-feedback').textContent).toContain('0 到 8');

    fireEvent.click(screen.getByTestId('guided-mode-official'));
    await waitFor(() => expect(inputValue()).toBe('4'));
    await waitFor(() => expect(lastInput()).toBe(4));

    await openAlgorithm('factorial');
    await waitFor(() => expect(inputValue()).toBe('4'));
    await openAlgorithm('fib');
    await waitFor(() => expect(inputValue()).toBe('4'));
  });
});
