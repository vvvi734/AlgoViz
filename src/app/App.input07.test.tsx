import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../theme/ThemeProvider';
import { I18nProvider } from '../i18n/I18nProvider';
import { runForLanguage } from '../runtime/execute';
import { App } from './App';

vi.mock('../runtime/execute', () => ({
  runForLanguage: vi.fn(async () => ({
    frames: [
      { state: { type: 'array', values: [1], focus: [] }, message: 'FIRST' },
      { state: { type: 'array', values: [2], focus: [], done: true }, message: 'DONE' },
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

function lastInput<T>(): T {
  return mockedRun.mock.calls.at(-1)?.[2] as T;
}

async function clearTriples() {
  while (screen.queryAllByTestId('sparse-triple-remove').length > 0) {
    fireEvent.click(screen.getAllByTestId('sparse-triple-remove')[0]!);
  }
  await waitFor(() => expect(screen.queryAllByTestId('sparse-triple-row')).toHaveLength(0));
}

beforeEach(() => {
  mockedRun.mockClear();
});

describe('INPUT-07 — sparse matrix input and shared state consistency', () => {
  it('runs a custom sparse matrix and clears the old trace when the triple order is invalid', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 2'));
    await openAlgorithm('sparse-transpose');

    expect(screen.getByTestId('sparse-input-editor')).not.toBeNull();
    expect((screen.getByTestId('sparse-rows') as HTMLInputElement).value).toBe('4');
    expect((screen.getByTestId('sparse-cols') as HTMLInputElement).value).toBe('5');
    expect(screen.queryAllByTestId('sparse-triple-row')).toHaveLength(6);

    fireEvent.change(screen.getByTestId('sparse-rows'), { target: { value: '3' } });
    fireEvent.change(screen.getByTestId('sparse-cols'), { target: { value: '4' } });
    await clearTriples();
    for (let index = 0; index < 4; index += 1) {
      fireEvent.click(screen.getByTestId('sparse-add-triple'));
      await waitFor(() => expect(screen.queryAllByTestId('sparse-triple-row')).toHaveLength(index + 1));
    }

    const rows = ['0', '0', '1', '2'];
    const cols = ['0', '3', '2', '1'];
    const values = ['5', '-2', '4', '7'];
    for (let index = 0; index < 4; index += 1) {
      fireEvent.change(screen.getAllByTestId('sparse-triple-row-input')[index]!, {
        target: { value: rows[index] },
      });
      fireEvent.change(screen.getAllByTestId('sparse-triple-col-input')[index]!, {
        target: { value: cols[index] },
      });
      fireEvent.change(screen.getAllByTestId('sparse-triple-value-input')[index]!, {
        target: { value: values[index] },
      });
    }
    expect(screen.getByTestId('guided-mode-custom').getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(screen.getByTestId('run-btn'));
    await waitFor(() => {
      expect(lastInput()).toEqual({
        rows: 3,
        cols: 4,
        triples: [
          { row: 0, col: 0, value: 5 },
          { row: 0, col: 3, value: -2 },
          { row: 1, col: 2, value: 4 },
          { row: 2, col: 1, value: 7 },
        ],
      });
    });
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 2'));

    fireEvent.change(screen.getAllByTestId('sparse-triple-row-input')[1]!, {
      target: { value: '2' },
    });
    fireEvent.change(screen.getAllByTestId('sparse-triple-col-input')[1]!, {
      target: { value: '0' },
    });
    const beforeInvalid = mockedRun.mock.calls.length;
    fireEvent.click(screen.getByTestId('run-btn'));
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('0 / 0'));
    expect(mockedRun.mock.calls.length).toBe(beforeInvalid);
    expect(screen.getByTestId('run-feedback').textContent).toContain('行优先');

    fireEvent.click(screen.getByTestId('guided-mode-official'));
    await waitFor(() => expect((screen.getByTestId('sparse-rows') as HTMLInputElement).value).toBe('4'));
    expect(screen.queryAllByTestId('sparse-triple-row')).toHaveLength(6);
  });

  it('fills random sparse data without executing and restores the official matrix', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 2'));
    await openAlgorithm('sparse-transpose');

    const beforeRandom = mockedRun.mock.calls.length;
    fireEvent.click(screen.getByTestId('random-btn'));
    expect(mockedRun.mock.calls.length).toBe(beforeRandom);
    expect(screen.getByTestId('guided-mode-random').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('guided-random-scenario')).not.toBeNull();
    expect(screen.getAllByTestId('sparse-triple-row').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByTestId('run-btn'));
    await waitFor(() => {
      const input = lastInput<{ rows: number; cols: number; triples: unknown[] }>();
      expect(input.rows).toBeGreaterThan(0);
      expect(input.cols).toBeGreaterThan(0);
      expect(input.triples.length).toBeGreaterThan(0);
    });
  });

  it('keeps KMP custom fields across a language switch and switches algorithms without stale data', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 2'));
    await openAlgorithm('kmp');

    fireEvent.change(screen.getByTestId('run-input'), { target: { value: 'ABABAB' } });
    fireEvent.change(screen.getByTestId('kmp-pattern'), { target: { value: 'ABA' } });
    fireEvent.click(screen.getByTestId('run-btn'));
    await waitFor(() => {
      expect(lastInput()).toEqual({ text: 'ABABAB', pattern: 'ABA' });
    });

    const beforeLanguage = mockedRun.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Switch language' }));
    expect((screen.getByTestId('run-input') as HTMLInputElement).value).toBe('ABABAB');
    expect((screen.getByTestId('kmp-pattern') as HTMLInputElement).value).toBe('ABA');
    expect(mockedRun.mock.calls.length).toBe(beforeLanguage);
    fireEvent.click(screen.getByTestId('run-btn'));
    await waitFor(() => expect(lastInput()).toEqual({ text: 'ABABAB', pattern: 'ABA' }));

    await openAlgorithm('dijkstra');
    expect(screen.getByTestId('graph-input-editor')).not.toBeNull();
    expect(screen.queryByTestId('sparse-input-editor')).toBeNull();
    await waitFor(() => expect(lastInput<{ nodes: string[] }>().nodes[0]).toBe('A'));
  });
});
