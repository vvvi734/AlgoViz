import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../theme/ThemeProvider';
import { I18nProvider } from '../i18n/I18nProvider';
import { runForLanguage } from '../runtime/execute';
import { App } from './App';

vi.mock('../runtime/execute', () => ({
  runForLanguage: vi.fn(async () => ({
    frames: [
      { state: { type: 'array', values: [1, 2, 3], focus: [] }, message: 'FIRST' },
      { state: { type: 'array', values: [1, 2, 3], done: true }, message: 'DONE' },
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

function rows() {
  return screen.getAllByTestId('structure-op-row');
}

function operationSelects(): HTMLSelectElement[] {
  return screen.getAllByTestId('structure-op-type') as HTMLSelectElement[];
}

beforeEach(() => {
  mockedRun.mockClear();
});

describe('INPUT-04 — structured linear operation sequences', () => {
  it('executes a sequential-list sequence and restores its official single operation', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 2'));
    await openAlgorithm('seqlist');

    fireEvent.change(screen.getByTestId('structure-initial-values'), { target: { value: '10, 20, 30' } });
    fireEvent.change(operationSelects()[0]!, { target: { value: 'delete' } });
    fireEvent.change(screen.getByTestId('structure-op-index'), { target: { value: '0' } });

    fireEvent.click(screen.getByTestId('structure-add'));
    expect(rows()).toHaveLength(2);
    const secondSelect = operationSelects()[1]!;
    fireEvent.change(secondSelect, { target: { value: 'insert' } });
    const indexInputs = screen.getAllByTestId('structure-op-index');
    const valueInputs = screen.getAllByTestId('structure-op-value');
    fireEvent.change(indexInputs.at(-1)!, { target: { value: '2' } });
    fireEvent.change(valueInputs[0]!, { target: { value: '99' } });

    expect(screen.getByTestId('guided-mode-custom').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByTestId('run-btn'));
    await waitFor(() =>
      expect(mockedRun.mock.calls.at(-1)?.[2]).toEqual({
        capacity: 8,
        values: [10, 20, 30],
        operations: [['delete', 0], ['insert', 2, 99]],
      }),
    );

    fireEvent.click(screen.getByTestId('guided-mode-official'));
    await waitFor(() => {
      const restored = mockedRun.mock.calls.at(-1)?.[2] as {
        preset?: string;
        values?: number[];
        operation?: string;
        index?: number;
        value?: number;
      };
      expect(restored.preset).toBe('insert-middle');
      expect(restored.values).toEqual([10, 20, 30, 40, 50]);
      expect(restored.operation).toBe('insert');
      expect(restored.index).toBe(2);
      expect(restored.value).toBe(25);
    });
    expect(rows()).toHaveLength(1);
    expect(screen.getByTestId('guided-mode-official').getAttribute('aria-pressed')).toBe('true');
  });

  it('supports add, move and remove without losing the operation fields', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 2'));
    await openAlgorithm('seqlist');

    fireEvent.change(operationSelects()[0]!, { target: { value: 'insert' } });
    fireEvent.change(screen.getByTestId('structure-op-index'), { target: { value: '0' } });
    fireEvent.change(screen.getByTestId('structure-op-value'), { target: { value: '7' } });

    fireEvent.click(screen.getByTestId('structure-add'));
    fireEvent.change(operationSelects()[1]!, { target: { value: 'traverse' } });
    expect(rows().map((item) => item.getAttribute('data-op'))).toEqual(['insert', 'traverse']);

    fireEvent.click(screen.getAllByTestId('structure-row-up')[1]!);
    expect(rows().map((item) => item.getAttribute('data-op'))).toEqual(['traverse', 'insert']);
    fireEvent.click(screen.getAllByTestId('structure-row-down')[0]!);
    expect(rows().map((item) => item.getAttribute('data-op'))).toEqual(['insert', 'traverse']);

    fireEvent.click(screen.getAllByTestId('structure-row-remove')[1]!);
    expect(rows()).toHaveLength(1);
    expect(rows()[0]!.getAttribute('data-op')).toBe('insert');
    expect((screen.getByTestId('structure-op-value') as HTMLInputElement).value).toBe('7');
  });

  it('runs custom stack and queue sequences and preserves their operation order', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 2'));

    await openAlgorithm('stack');
    while (rows().length > 1) fireEvent.click(screen.getAllByTestId('structure-row-remove').at(-1)!);
    fireEvent.change(screen.getByTestId('structure-op-value'), { target: { value: '7' } });
    fireEvent.click(screen.getByTestId('structure-add'));
    fireEvent.change(operationSelects()[1]!, { target: { value: 'pop' } });
    fireEvent.click(screen.getByTestId('run-btn'));
    await waitFor(() =>
      expect(mockedRun.mock.calls.at(-1)?.[2]).toEqual([['push', 7], ['pop']]),
    );

    await openAlgorithm('queue');
    while (rows().length > 1) fireEvent.click(screen.getAllByTestId('structure-row-remove').at(-1)!);
    fireEvent.change(screen.getByTestId('structure-op-value'), { target: { value: '4' } });
    fireEvent.click(screen.getByTestId('structure-add'));
    fireEvent.change(operationSelects()[1]!, { target: { value: 'dequeue' } });
    fireEvent.click(screen.getByTestId('run-btn'));
    await waitFor(() =>
      expect(mockedRun.mock.calls.at(-1)?.[2]).toEqual([['enqueue', 4], ['dequeue']]),
    );
  });

  it('rejects an empty pop before Python and clears the previous trace', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 2'));
    await openAlgorithm('stack');
    const before = mockedRun.mock.calls.length;

    while (rows().length > 1) fireEvent.click(screen.getAllByTestId('structure-row-remove').at(-1)!);
    fireEvent.change(operationSelects()[0]!, { target: { value: 'pop' } });
    fireEvent.click(screen.getByTestId('run-btn'));

    expect(mockedRun.mock.calls.length).toBe(before);
    expect(screen.getByTestId('progress').textContent).toBe('0 / 0');
    expect(screen.getByTestId('run-feedback').textContent).toContain('当前结构为空');
    expect(screen.getByTestId('visual-stage').querySelector('.empty')).toBeTruthy();
  });

  it('randomizes all structures into editable rows without running until Generate', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 2'));

    for (const id of ['linked', 'doubly', 'circular', 'seqlist', 'stack', 'queue']) {
      await openAlgorithm(id);
      const before = mockedRun.mock.calls.length;
      fireEvent.click(screen.getByTestId('random-btn'));
      expect(screen.getByTestId('guided-mode-random').getAttribute('aria-pressed')).toBe('true');
      expect(mockedRun.mock.calls.length).toBe(before);
      expect(rows().length).toBeGreaterThan(0);
      const first = rows()[0]!;
      expect(first.getAttribute('data-op')).toBeTruthy();

      fireEvent.change(operationSelects()[0]!, {
        target: { value: id === 'stack' ? 'peek' : id === 'queue' ? 'front' : 'traverse' },
      });
      expect(screen.getByTestId('guided-mode-custom').getAttribute('aria-pressed')).toBe('true');
    }
  });
});
