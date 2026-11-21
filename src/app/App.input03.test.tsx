import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../theme/ThemeProvider';
import { I18nProvider } from '../i18n/I18nProvider';
import { runForLanguage } from '../runtime/execute';
import { App } from './App';

vi.mock('../runtime/execute', () => ({
  runForLanguage: vi.fn(async (_mode: string, _code: string, input: unknown) => {
    const values =
      typeof input === 'object' && input !== null && Array.isArray((input as { nums?: unknown }).nums)
        ? (input as { nums: number[] }).nums
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

beforeEach(() => {
  mockedRun.mockClear();
});

describe('INPUT-03 — linear search and hash operation inputs', () => {
  it('sends a genuinely empty linear array to Python and resets playback', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 2'));
    await openAlgorithm('linear');

    fireEvent.change(screen.getByTestId('run-input'), { target: { value: '' } });
    fireEvent.change(screen.getByTestId('linear-target'), { target: { value: '5' } });
    fireEvent.click(screen.getByTestId('run-btn'));

    const call = mockedRun.mock.calls.at(-1);
    expect(call?.[2]).toEqual({ nums: [], target: 5 });
    expect(call?.[4]).toBe('python');
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 2'));
    expect(screen.getByTestId('run-feedback').textContent).toMatch(/动画已生成|Visualization ready/);
  });

  it('keeps unsorted duplicate linear input unchanged and returns it to the executor', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 2'));
    await openAlgorithm('linear');

    fireEvent.change(screen.getByTestId('run-input'), { target: { value: '6, 3, 7, 3, 9' } });
    fireEvent.change(screen.getByTestId('linear-target'), { target: { value: '3' } });
    expect(screen.getByTestId('guided-mode-custom').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByTestId('run-btn'));

    await waitFor(() => expect(mockedRun.mock.calls.at(-1)?.[2]).toEqual({ nums: [6, 3, 7, 3, 9], target: 3 }));
  });

  it('runs chaining operations from the concise line editor and restores official data', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 2'));
    await openAlgorithm('hash-chain');

    fireEvent.change(screen.getByTestId('hash-operations'), {
      target: { value: 'insert 1\ninsert 8\ninsert 15\ndelete 8\nfind 15' },
    });
    fireEvent.click(screen.getByTestId('run-btn'));
    await waitFor(() =>
      expect(mockedRun.mock.calls.at(-1)?.[2]).toEqual({
        tableSize: 7,
        operations: [
          ['insert', 1],
          ['insert', 8],
          ['insert', 15],
          ['delete', 8],
          ['find', 15],
        ],
      }),
    );

    fireEvent.click(screen.getByTestId('guided-mode-official'));
    await waitFor(() => {
      const restored = mockedRun.mock.calls.at(-1)?.[2] as { operations?: unknown[] };
      expect(restored.operations?.length).toBeGreaterThan(10);
    });
  });

  it('supports the probing tombstone sequence without changing its operation order', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 2'));
    await openAlgorithm('hash-probe');

    fireEvent.change(screen.getByTestId('hash-operations'), {
      target: { value: 'insert 1\ninsert 8\ninsert 15\ndelete 8\nfind 15\ninsert 22' },
    });
    fireEvent.click(screen.getByTestId('run-btn'));

    await waitFor(() =>
      expect(mockedRun.mock.calls.at(-1)?.[2]).toEqual({
        tableSize: 7,
        operations: [
          ['insert', 1],
          ['insert', 8],
          ['insert', 15],
          ['delete', 8],
          ['find', 15],
          ['insert', 22],
        ],
      }),
    );
  });

  it('rejects an out-of-range hash key, clears the old trace and never executes it', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 2'));
    await openAlgorithm('hash-probe');
    const before = mockedRun.mock.calls.length;

    fireEvent.change(screen.getByTestId('hash-operations'), { target: { value: 'insert 100' } });
    fireEvent.click(screen.getByTestId('run-btn'));

    expect(mockedRun.mock.calls.length).toBe(before);
    expect(screen.getByTestId('progress').textContent).toBe('0 / 0');
    expect(screen.getByTestId('run-feedback').textContent).toContain('哈希关键字必须是 0–99 的整数');
    expect(screen.getByTestId('visual-stage').querySelector('.empty')).toBeTruthy();
  });

  it('random hash operations only fill the editor before Generate', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 2'));
    await openAlgorithm('hash-chain');
    const before = mockedRun.mock.calls.length;

    fireEvent.click(screen.getByTestId('random-btn'));
    expect(screen.getByTestId('guided-mode-random').getAttribute('aria-pressed')).toBe('true');
    expect(mockedRun.mock.calls.length).toBe(before);
    expect((screen.getByTestId('hash-operations') as HTMLTextAreaElement).value).toMatch(/^(insert|find|delete) \d+/m);

    fireEvent.click(screen.getByTestId('run-btn'));
    await waitFor(() => expect(mockedRun.mock.calls.length).toBeGreaterThan(before));
    expect(mockedRun.mock.calls.at(-1)?.[4]).toBe('python');
  });
});
