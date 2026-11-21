import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../theme/ThemeProvider';
import { I18nProvider } from '../i18n/I18nProvider';
import { defaultInputFor } from '../domain/algorithms/examples';
import { runForLanguage } from '../runtime/execute';
import { App } from './App';

vi.mock('../runtime/execute', () => ({
  runForLanguage: vi.fn(async (_mode: string, _code: string, input: unknown) => {
    const values = Array.isArray(input)
      ? input
      : typeof input === 'object' && input !== null && Array.isArray((input as { heap?: unknown }).heap)
        ? (input as { heap: number[] }).heap
        : [1, 2, 3];
    return {
      frames: [
        { state: { type: 'array', values, focus: [0] }, message: `FIRST ${values.join(',')}` },
        { state: { type: 'array', values, done: true }, message: 'DONE' },
      ],
    };
  }),
  isVisualResult: (value: unknown) => typeof value === 'object' && value !== null && 'frames' in value,
}));

const mockedRun = vi.mocked(runForLanguage);

const ALGORITHMS = [
  ['selection', '6, 4, 9, 1, 7, 2'],
  ['insertion', '7, 3, 5, 1, 9, 2'],
  ['shell', '8, 3, 7, 4, 9, 2, 6, 1'],
  ['quick', '8, 3, 1, 7, 5, 2, 9, 4'],
  ['merge', '7, 3, 5, 1, 9, 2, 8, 4'],
  ['heap', '4, 9, 2, 7, 5, 9, 1'],
] as const;

function renderApp() {
  return render(
    <ThemeProvider>
      <I18nProvider>
        <App initialConcept={null} />
      </I18nProvider>
    </ThemeProvider>,
  );
}

async function openAlgorithm(id: string, official: string) {
  fireEvent.change(screen.getByTestId('mobile-algo-select'), { target: { value: id } });
  await waitFor(() => expect(screen.getByTestId('guided-input').getAttribute('data-algorithm')).toBe(id));
  await waitFor(() => expect((screen.getByTestId('run-input') as HTMLInputElement).value).toBe(official));
  await waitFor(() => expect(mockedRun.mock.calls.at(-1)?.[4]).toBe('python'));
}

beforeEach(() => {
  mockedRun.mockClear();
});

describe('INPUT-02 — six sorting algorithms execute generated data', () => {
  it.each(ALGORITHMS)('%s runs custom signed/duplicate values through Python and restores official data', async (id, official) => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 2'));
    await openAlgorithm(id, official);

    const input = screen.getByTestId('run-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '9, -4, 0, 4, 4' } });
    expect(screen.getByTestId('guided-mode-custom').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByTestId('run-btn'));

    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 2'));
    const custom = mockedRun.mock.calls.at(-1);
    expect(custom?.[4]).toBe('python');
    expect(custom?.[2]).toEqual(
      id === 'heap'
        ? { preset: null, operation: 'sort', heap: [9, -4, 0, 4, 4], value: null }
        : [9, -4, 0, 4, 4],
    );
    expect(screen.getByTestId('step-desc').textContent).toContain('FIRST 9,-4,0,4,4');

    fireEvent.click(screen.getByTestId('guided-mode-official'));
    await waitFor(() => {
      const restored = mockedRun.mock.calls.at(-1)?.[2];
      expect(restored).toEqual(defaultInputFor(id));
    });
    expect(screen.getByTestId('guided-mode-official').getAttribute('aria-pressed')).toBe('true');
  });

  it('fills random merge data without running until Generate is pressed', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 2'));
    await openAlgorithm('merge', '7, 3, 5, 1, 9, 2, 8, 4');
    const callsBefore = mockedRun.mock.calls.length;

    fireEvent.click(screen.getByTestId('random-btn'));
    expect(screen.getByTestId('guided-mode-random').getAttribute('aria-pressed')).toBe('true');
    expect(mockedRun.mock.calls.length).toBe(callsBefore);
    expect(screen.getByTestId('progress').textContent).toBe('1 / 2');

    const values = (screen.getByTestId('run-input') as HTMLInputElement).value
      .split(/[,\s]+/u)
      .filter(Boolean)
      .map(Number);
    expect(values.length).toBeGreaterThanOrEqual(8);
    expect(values.length).toBeLessThanOrEqual(11);

    fireEvent.click(screen.getByTestId('run-btn'));
    await waitFor(() => {
      const call = mockedRun.mock.calls.at(-1);
      expect(call?.[2]).toEqual(values);
      expect(call?.[4]).toBe('python');
    });
  });

  it('rejects a one-element quick-sort draft, clears the old trace and never executes it', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 2'));
    await openAlgorithm('quick', '8, 3, 1, 7, 5, 2, 9, 4');
    const callsBefore = mockedRun.mock.calls.length;

    fireEvent.change(screen.getByTestId('run-input'), { target: { value: '7' } });
    fireEvent.click(screen.getByTestId('run-btn'));

    expect(mockedRun.mock.calls.length).toBe(callsBefore);
    expect(screen.getByTestId('progress').textContent).toBe('0 / 0');
    expect(screen.getByTestId('run-feedback').textContent).toContain('该排序算法需要 2–16 个整数');
    expect(screen.getByTestId('visual-stage').querySelector('.empty')).toBeTruthy();
  });
});
