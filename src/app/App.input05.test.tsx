import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../theme/ThemeProvider';
import { I18nProvider } from '../i18n/I18nProvider';
import { runForLanguage } from '../runtime/execute';
import { App } from './App';

vi.mock('../runtime/execute', () => ({
  runForLanguage: vi.fn(async (_mode: string, _code: string, input: unknown) => {
    const record = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
    const values = Array.isArray(input)
      ? input
      : Array.isArray(record.tree)
        ? record.tree
        : Array.isArray(record.heap)
          ? record.heap
          : [1, 2, 3];
    return {
      frames: [
        { state: { type: 'array', values, focus: [] }, message: 'FIRST' },
        { state: { type: 'array', values, done: true }, message: 'DONE' },
      ],
    };
  }),
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

function inputValue(testId: string): string {
  return (screen.getByTestId(testId) as HTMLInputElement).value;
}

beforeEach(() => {
  mockedRun.mockClear();
});

describe('INPUT-05 — custom tree and heap inputs execute through Python', () => {
  it('keeps a custom traversal tree when the stage mode picker changes', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 2'));
    await openAlgorithm('inorder');

    expect(inputValue('tree-nodes')).toBe('4, 2, 6, 1, 3, 5, 7');
    fireEvent.change(screen.getByTestId('tree-nodes'), { target: { value: '4, 2, 6, null, 3' } });
    expect(screen.getByTestId('guided-mode-custom').getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(screen.getByTestId('tree-mode-preorder'));
    expect(inputValue('tree-nodes')).toBe('4, 2, 6, null, 3');
    fireEvent.click(screen.getByTestId('run-btn'));
    await waitFor(() =>
      expect(mockedRun.mock.calls.at(-1)?.[2]).toEqual({
        mode: 'preorder',
        tree: [4, 2, 6, null, 3],
      }),
    );

    fireEvent.click(screen.getByTestId('tree-mode-postorder'));
    fireEvent.click(screen.getByTestId('run-btn'));
    await waitFor(() =>
      expect(mockedRun.mock.calls.at(-1)?.[2]).toEqual({
        mode: 'postorder',
        tree: [4, 2, 6, null, 3],
      }),
    );

    const beforeRandom = mockedRun.mock.calls.length;
    fireEvent.click(screen.getByTestId('random-btn'));
    expect(screen.getByTestId('guided-mode-random').getAttribute('aria-pressed')).toBe('true');
    expect(mockedRun.mock.calls.length).toBe(beforeRandom);
    expect(inputValue('tree-nodes').split(/[,\s]+/).filter(Boolean).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByTestId('run-btn'));
    await waitFor(() => {
      const input = mockedRun.mock.calls.at(-1)?.[2] as { mode: string; tree: unknown[] };
      expect(input.mode).toBe('postorder');
      expect(Array.isArray(input.tree)).toBe(true);
    });
  });

  it('runs BST delete and find commands and restores the official example', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 2'));
    await openAlgorithm('bst');

    fireEvent.change(screen.getByTestId('tree-sequence'), { target: { value: '50, 30, 70, 20' } });
    fireEvent.change(screen.getByTestId('tree-command'), { target: { value: 'delete' } });
    fireEvent.change(screen.getByTestId('tree-target'), { target: { value: '30' } });
    fireEvent.click(screen.getByTestId('run-btn'));
    await waitFor(() =>
      expect(mockedRun.mock.calls.at(-1)?.[2]).toEqual({
        preset: null,
        operation: 'delete',
        tree: [50, 30, 70, 20],
        target: 30,
      }),
    );

    fireEvent.click(screen.getByTestId('guided-mode-official'));
    await waitFor(() => {
      const restored = mockedRun.mock.calls.at(-1)?.[2] as { preset?: string; operation?: string; target?: number };
      expect(restored.preset).toBe('find-success');
      expect(restored.operation).toBe('find');
      expect(restored.target).toBe(40);
    });
    expect(screen.getByTestId('guided-mode-official').getAttribute('aria-pressed')).toBe('true');
    expect(inputValue('tree-sequence')).toBe('50, 30, 70, 20, 40, 60, 80');
  });

  it('rejects a duplicate AVL insert target and never executes it', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 2'));
    await openAlgorithm('avl');

    fireEvent.change(screen.getByTestId('tree-sequence'), { target: { value: '30, 20, 40, 10' } });
    fireEvent.change(screen.getByTestId('tree-target'), { target: { value: '20' } });
    fireEvent.click(screen.getByTestId('run-btn'));

    expect(mockedRun.mock.calls.length).toBeGreaterThan(0);
    const callsBefore = mockedRun.mock.calls.length;
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('0 / 0'));
    expect(mockedRun.mock.calls.length).toBe(callsBefore);
    expect(screen.getByTestId('run-feedback').textContent).toContain('已存在于初始序列');
  });

  it('runs an order-4 B-tree insert that the Python program can split', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 2'));
    await openAlgorithm('btree');

    fireEvent.change(screen.getByTestId('tree-command'), { target: { value: 'insert' } });
    fireEvent.change(screen.getByTestId('tree-sequence'), {
      target: { value: '10, 20, 30, 40, 50, 60, 70' },
    });
    fireEvent.change(screen.getByTestId('tree-target'), { target: { value: '80' } });
    fireEvent.click(screen.getByTestId('run-btn'));
    await waitFor(() =>
      expect(mockedRun.mock.calls.at(-1)?.[2]).toEqual({
        preset: null,
        operation: 'insert',
        tree: [10, 20, 30, 40, 50, 60, 70],
        target: 80,
      }),
    );
  });

  it('runs heap push and rejects a non-heap extract before execution', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 2'));
    await openAlgorithm('heap');

    fireEvent.change(screen.getByTestId('heap-values'), { target: { value: '5, 3, 4, 1, 2' } });
    fireEvent.change(screen.getByTestId('heap-operation'), { target: { value: 'push' } });
    fireEvent.change(screen.getByTestId('heap-value'), { target: { value: '10' } });
    fireEvent.click(screen.getByTestId('run-btn'));
    await waitFor(() =>
      expect(mockedRun.mock.calls.at(-1)?.[2]).toEqual({
        preset: null,
        operation: 'push',
        heap: [5, 3, 4, 1, 2],
        value: 10,
      }),
    );

    const beforeInvalid = mockedRun.mock.calls.length;
    fireEvent.change(screen.getByTestId('heap-operation'), { target: { value: 'extract' } });
    fireEvent.change(screen.getByTestId('heap-values'), { target: { value: '4, 9, 2, 7' } });
    fireEvent.click(screen.getByTestId('run-btn'));
    expect(mockedRun.mock.calls.length).toBe(beforeInvalid);
    expect(screen.getByTestId('progress').textContent).toBe('0 / 0');
    expect(screen.getByTestId('run-feedback').textContent).toContain('最大堆性质');
  });

  it('runs Huffman symbol weights and randomizes without executing', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 2'));
    await openAlgorithm('huffman');

    fireEvent.change(screen.getByTestId('huffman-symbols'), {
      target: { value: 'A: 5\nB: 9\nC: 12\nD: 13' },
    });
    fireEvent.click(screen.getByTestId('run-btn'));
    await waitFor(() =>
      expect(mockedRun.mock.calls.at(-1)?.[2]).toEqual({
        preset: null,
        symbols: [
          ['A', 5],
          ['B', 9],
          ['C', 12],
          ['D', 13],
        ],
      }),
    );

    const beforeRandom = mockedRun.mock.calls.length;
    fireEvent.click(screen.getByTestId('random-btn'));
    expect(screen.getByTestId('guided-mode-random').getAttribute('aria-pressed')).toBe('true');
    expect(mockedRun.mock.calls.length).toBe(beforeRandom);
    expect(inputValue('huffman-symbols').split('\n').length).toBeGreaterThanOrEqual(4);
    fireEvent.click(screen.getByTestId('run-btn'));
    await waitFor(() => {
      const input = mockedRun.mock.calls.at(-1)?.[2] as { symbols: Array<[string, number]> };
      expect(input.symbols.length).toBeGreaterThanOrEqual(4);
      expect(new Set(input.symbols.map(([symbol]) => symbol)).size).toBe(input.symbols.length);
    });
  });
});
