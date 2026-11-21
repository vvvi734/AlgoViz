import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../theme/ThemeProvider';
import { I18nProvider } from '../i18n/I18nProvider';
import { runForLanguage } from '../runtime/execute';
import { App } from './App';

vi.mock('../runtime/execute', () => ({
  runForLanguage: vi.fn(async () => ({
    frames: [
      { state: { type: 'graph', values: [], focus: [] }, message: 'FIRST' },
      { state: { type: 'graph', values: [], focus: [], done: true }, message: 'DONE' },
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

beforeEach(() => {
  mockedRun.mockClear();
});

describe('INPUT-06 — shared graph table executes through the existing Python path', () => {
  it('renames a Dijkstra node, updates endpoints and rejects a negative weight', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 2'));
    await openAlgorithm('dijkstra');

    expect(screen.getByTestId('graph-input-editor')).not.toBeNull();
    expect(screen.getAllByTestId('graph-node-input')).toHaveLength(7);
    expect(screen.getAllByTestId('graph-input-edge-weight')).toHaveLength(7);

    fireEvent.change(screen.getAllByTestId('graph-node-input')[0]!, { target: { value: 'S' } });
    expect(screen.getByTestId('guided-mode-custom').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByTestId('run-btn'));
    await waitFor(() => {
      const input = lastInput<{
        start: string;
        target: string;
        directed: boolean;
        nodes: string[];
        edges: unknown[][];
      }>();
      expect(input.start).toBe('S');
      expect(input.target).toBe('G');
      expect(input.directed).toBe(false);
      expect(input.nodes[0]).toBe('S');
      expect(input.edges[0]).toEqual(['S', 'B', 2]);
    });

    fireEvent.change(screen.getAllByTestId('graph-input-edge-weight')[0]!, { target: { value: '-1' } });
    const beforeInvalid = mockedRun.mock.calls.length;
    fireEvent.click(screen.getByTestId('run-btn'));
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('0 / 0'));
    expect(mockedRun.mock.calls.length).toBe(beforeInvalid);
    expect(screen.getByTestId('run-feedback').textContent).toContain('Dijkstra');
  });

  it('restores the official graph and randomizes without executing', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 2'));
    await openAlgorithm('dijkstra');

    fireEvent.click(screen.getByTestId('guided-mode-official'));
    await waitFor(() => {
      const input = lastInput<{ nodes: string[]; start: string; target: string }>();
      expect(input.nodes).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
      expect(input.start).toBe('A');
      expect(input.target).toBe('G');
    });
    expect((screen.getAllByTestId('graph-node-input')[0] as HTMLInputElement).value).toBe('A');
    expect(screen.getByTestId('guided-mode-official').getAttribute('aria-pressed')).toBe('true');

    const beforeRandom = mockedRun.mock.calls.length;
    fireEvent.click(screen.getByTestId('random-btn'));
    expect(mockedRun.mock.calls.length).toBe(beforeRandom);
    expect(screen.getByTestId('guided-mode-random').getAttribute('aria-pressed')).toBe('true');
    expect((screen.getAllByTestId('graph-node-input').length)).toBeGreaterThan(0);
  });

  it('keeps unweighted BFS without weight fields and passes the directed toggle', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 2'));
    await openAlgorithm('bfs');

    expect(screen.queryAllByTestId('graph-input-edge-weight')).toHaveLength(0);
    expect(screen.getByTestId('graph-directed')).not.toBeNull();
    fireEvent.click(screen.getByTestId('graph-directed'));
    fireEvent.click(screen.getByTestId('run-btn'));
    await waitFor(() => {
      const input = lastInput<{ directed: boolean; start: string; edges: unknown[][] }>();
      expect(input.directed).toBe(true);
      expect(input.start).toBe('A');
      expect(input.edges[0]).toEqual(['A', 'B']);
    });
  });

  it('shows fixed direction and duration fields for AOE', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 2'));
    await openAlgorithm('critical-path');

    expect(screen.queryByTestId('graph-directed')).toBeNull();
    expect(screen.getByTestId('graph-directed-mode').textContent).toContain('有向图');
    expect(screen.getAllByTestId('graph-input-edge-weight')).toHaveLength(7);
    const firstWeight = screen.getAllByTestId('graph-input-edge-weight')[0] as HTMLInputElement;
    expect(firstWeight.value).toBe('3');

    fireEvent.change(screen.getAllByTestId('graph-input-edge-weight')[0]!, { target: { value: '-2' } });
    const beforeInvalid = mockedRun.mock.calls.length;
    fireEvent.click(screen.getByTestId('run-btn'));
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('0 / 0'));
    expect(mockedRun.mock.calls.length).toBe(beforeInvalid);
    expect(screen.getByTestId('run-feedback').textContent).toContain('持续时间');
  });
});
