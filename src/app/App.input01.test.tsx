import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../theme/ThemeProvider';
import { I18nProvider } from '../i18n/I18nProvider';
import { runForLanguage } from '../runtime/execute';
import type { VisualRunResult } from '../domain/trace/types';
import { App } from './App';

vi.mock('../runtime/execute', () => ({
  runForLanguage: vi.fn(async (_mode: string, _code: string, input: unknown) => {
    const values = Array.isArray(input) ? input : [1, 2, 3];
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

function renderApp() {
  return render(
    <ThemeProvider>
      <I18nProvider>
        <App initialConcept={null} />
      </I18nProvider>
    </ThemeProvider>,
  );
}

async function ready() {
  await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 2'));
}

function framesFor(label: string) {
  return {
    frames: [
      { state: { type: 'array', values: [1, 2, 3], focus: [0] }, message: `FIRST ${label}` },
      { state: { type: 'array', values: [1, 2, 3], done: true }, message: 'DONE' },
    ],
  };
}

describe('INPUT-01 custom inputs really execute', () => {
  it('passes edited bubble values to the real executor and restarts playback', async () => {
    renderApp();
    await ready();
    const input = screen.getByTestId('run-input') as HTMLInputElement;
    expect(input.value).toBe('5, 2, 8, 1, 6, 3');

    fireEvent.click(screen.getByTestId('next-btn'));
    expect(screen.getByTestId('progress').textContent).toBe('2 / 2');

    fireEvent.change(input, { target: { value: '8, 3, 5, 1, 7' } });
    expect(screen.getByTestId('guided-mode-custom').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByTestId('run-btn'));

    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 2'));
    const call = mockedRun.mock.calls.at(-1);
    expect(call?.[2]).toEqual([8, 3, 5, 1, 7]);
    expect(call?.[4]).toBe('python');
    await waitFor(() => expect(screen.getByTestId('step-desc').textContent).toContain('FIRST 8,3,5,1,7'));
  });

  it('keeps binary-search order untouched so the algorithm can reject it', async () => {
    renderApp();
    await ready();
    fireEvent.change(screen.getByTestId('mobile-algo-select'), { target: { value: 'binary' } });
    await waitFor(() => expect(screen.getByTestId('guided-input').getAttribute('data-algorithm')).toBe('binary'));

    fireEvent.change(screen.getByTestId('run-input'), { target: { value: '3, 1, 2' } });
    fireEvent.change(screen.getByTestId('binary-target'), { target: { value: '2' } });
    fireEvent.click(screen.getByTestId('run-btn'));

    await waitFor(() => {
      const call = mockedRun.mock.calls.at(-1);
      expect(call?.[2]).toEqual({ nums: [3, 1, 2], target: 2 });
    });
    expect(mockedRun.mock.calls.at(-1)?.[4]).toBe('python');
  });

  it('clears the old trace and does not execute malformed input', async () => {
    renderApp();
    await ready();
    const callsBefore = mockedRun.mock.calls.length;

    fireEvent.change(screen.getByTestId('run-input'), { target: { value: '8, nope, 5' } });
    fireEvent.click(screen.getByTestId('run-btn'));

    expect(mockedRun.mock.calls.length).toBe(callsBefore);
    expect(screen.getByTestId('progress').textContent).toBe('0 / 0');
    expect(screen.getByTestId('run-feedback').textContent).toContain('请输入');
    expect(screen.getByTestId('visual-stage').querySelector('.empty')).toBeTruthy();
  });

  it('ignores a late result from an older generation', async () => {
    renderApp();
    await ready();

    const deferred: Array<{ input: unknown; resolve: (value: VisualRunResult) => void }> = [];
    mockedRun.mockImplementation(
      (_mode, _code, input) => new Promise<VisualRunResult>((resolve) => {
        deferred.push({ input, resolve });
      }),
    );

    fireEvent.change(screen.getByTestId('run-input'), { target: { value: '9, 1, 4' } });
    fireEvent.click(screen.getByTestId('run-btn'));
    fireEvent.change(screen.getByTestId('run-input'), { target: { value: '2, 8, 3' } });
    fireEvent.click(screen.getByTestId('run-btn'));

    expect(deferred).toHaveLength(2);
    await act(async () => {
      deferred[1]!.resolve(framesFor('NEW'));
    });
    await waitFor(() => expect(screen.getByTestId('step-desc').textContent).toContain('FIRST NEW'));

    await act(async () => {
      deferred[0]!.resolve(framesFor('OLD'));
    });
    await waitFor(() => expect(screen.getByTestId('step-desc').textContent).toContain('FIRST NEW'));
    expect(screen.getByTestId('step-desc').textContent).not.toContain('FIRST OLD');
  });

  it('does not carry one algorithm draft into the next algorithm', async () => {
    renderApp();
    await ready();
    fireEvent.change(screen.getByTestId('run-input'), { target: { value: '9, 1, 4' } });
    expect(screen.getByTestId('guided-mode-custom').getAttribute('aria-pressed')).toBe('true');

    fireEvent.change(screen.getByTestId('mobile-algo-select'), { target: { value: 'binary' } });
    await waitFor(() => expect(screen.getByTestId('guided-input').getAttribute('data-algorithm')).toBe('binary'));

    expect(screen.getByTestId('guided-mode-official').getAttribute('aria-pressed')).toBe('true');
    expect((screen.getByTestId('run-input') as HTMLInputElement).value).toBe('1, 3, 5, 7, 9, 11, 13');
    expect((screen.getByTestId('binary-target') as HTMLInputElement).value).toBe('9');
    await waitFor(() => {
      expect(mockedRun.mock.calls.at(-1)?.[2]).toEqual({
        nums: [1, 3, 5, 7, 9, 11, 13],
        target: 9,
      });
    });
  });

  it('fills a valid random bubble draft, then executes it on demand', async () => {
    renderApp();
    await ready();
    const input = screen.getByTestId('run-input') as HTMLInputElement;
    const official = input.value;

    fireEvent.click(screen.getByTestId('random-btn'));
    expect(screen.getByTestId('guided-mode-random').getAttribute('aria-pressed')).toBe('true');
    expect(input.value).not.toBe(official);
    expect(screen.getByTestId('progress').textContent).toBe('1 / 2');

    fireEvent.click(screen.getByTestId('run-btn'));
    await waitFor(() => {
      const values = mockedRun.mock.calls.at(-1)?.[2];
      expect(Array.isArray(values)).toBe(true);
      expect((values as number[]).length).toBeGreaterThanOrEqual(8);
      expect((values as number[]).length).toBeLessThanOrEqual(11);
    });
    expect(mockedRun.mock.calls.at(-1)?.[4]).toBe('python');
  });

  it('passes a new KMP text and pattern to the real Python executor', async () => {
    renderApp();
    await ready();
    fireEvent.change(screen.getByTestId('mobile-algo-select'), { target: { value: 'kmp' } });
    await waitFor(() => expect(screen.getByTestId('guided-input').getAttribute('data-algorithm')).toBe('kmp'));

    fireEvent.change(screen.getByTestId('run-input'), { target: { value: 'AABAACAABAA' } });
    fireEvent.change(screen.getByTestId('kmp-pattern'), { target: { value: 'AABAA' } });
    fireEvent.click(screen.getByTestId('run-btn'));

    await waitFor(() => {
      expect(mockedRun.mock.calls.at(-1)?.[2]).toEqual({
        text: 'AABAACAABAA',
        pattern: 'AABAA',
      });
    });
    expect(mockedRun.mock.calls.at(-1)?.[4]).toBe('python');
  });
});
