import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../theme/ThemeProvider';
import { I18nProvider } from '../i18n/I18nProvider';
import { App } from './App';
import { runForLanguage } from '../runtime/execute';

// COMPONENT tests only: `runtime/execute` is mocked, so no Worker / Pyodide runs
// here. What they prove is the React wiring — that a new trace resets the
// timeline and that the call stack, variables watch and code position all land
// on frame 0. Real Python execution is covered by e2e/lab.spec.ts.
vi.mock('../runtime/execute', () => ({
  runForLanguage: vi.fn(),
  isVisualResult: (value: unknown) => typeof value === 'object' && value !== null && 'frames' in value,
}));

const mockedRun = vi.mocked(runForLanguage);

const bubbleFrames = Array.from({ length: 12 }, (_, index) => ({
  state: { type: 'array', values: [12 - index, index] },
  message: `BUBBLE ${index}`,
  line: 1 + (index % 3),
}));

const factorialFrames = [
  {
    state: { type: 'stack', values: ['factorial'] },
    message: '调用 / call factorial(4)',
    line: 2,
    callStack: [{
      name: 'factorial', frameId: 'f1', depth: 0, status: 'running',
      arguments: [{ name: 'n', type: 'int', value: 4 }],
      locals: [{ name: 'n', type: 'int', value: 4 }],
    }],
  },
  {
    state: { type: 'stack', values: ['factorial', 'factorial'] },
    message: '调用 / call factorial(3)',
    line: 2,
    callStack: [
      { name: 'factorial', frameId: 'f1', depth: 0, status: 'running', locals: [{ name: 'n', type: 'int', value: 4 }] },
      { name: 'factorial', frameId: 'f2', depth: 1, status: 'running', arguments: [{ name: 'n', type: 'int', value: 3 }], locals: [{ name: 'n', type: 'int', value: 3 }] },
    ],
  },
  {
    state: { type: 'stack', values: ['factorial', 'factorial', 'factorial'] },
    message: '返回 / return factorial = 6',
    line: 3,
    callStack: [
      { name: 'factorial', frameId: 'f1', depth: 0, status: 'running', locals: [{ name: 'n', type: 'int', value: 4 }] },
      { name: 'factorial', frameId: 'f2', depth: 1, status: 'running', locals: [{ name: 'n', type: 'int', value: 3 }] },
      { name: 'factorial', frameId: 'f3', depth: 2, status: 'returning', returnValue: 2, locals: [{ name: 'n', type: 'int', value: 2 }] },
    ],
  },
  {
    state: { type: 'stack', values: [] },
    message: '完成 / Done 24',
    line: 3,
    variables: [{ name: 'result', type: 'int', value: 24 }],
    callStack: [],
  },
];

function renderApp() {
  return render(
    <ThemeProvider>
      <I18nProvider>
        <App />
      </I18nProvider>
    </ThemeProvider>,
  );
}

/**
 * The app paints an initial legacy trace before the first async run resolves.
 * Waiting only for "1 / 12" can therefore race with the run's reset, especially
 * when the full suite runs in parallel. Wait for the run feedback too, so the
 * trace under test is the freshly installed one.
 */
async function waitForInitialRun() {
  await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 12'));
  await waitFor(() => expect(screen.getByTestId('run-feedback').textContent).toContain('动画已生成'));
}

/** Route the mocked runner by the preset source it receives. */
function framesFor(code: string) {
  return code.includes('factorial(') ? factorialFrames : bubbleFrames;
}

beforeEach(() => {
  mockedRun.mockReset();
  mockedRun.mockImplementation(async (_mode, code) => ({ frames: framesFor(String(code)) }));
});

describe('Stage 3 playback fix — a new trace restarts the timeline', () => {
  it('scenario A: scrubbing a long trace then switching to a shorter one lands on frame 0', async () => {
    renderApp();
    await waitForInitialRun();

    // Go far forward in the long (bubble) trace.
    fireEvent.change(screen.getByTestId('scrub'), { target: { value: '10' } });
    expect(screen.getByTestId('progress').textContent).toBe('11 / 12');
    expect(screen.getByTestId('step-desc').textContent).toBe('BUBBLE 10');

    // Switch to a 4-frame recursion trace: index 10 would be out of range.
    fireEvent.click(screen.getByTestId('algo-factorial'));
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 4'));

    // Frame 0 is a valid, rendered event again. The timeline keeps only the
    // active UI language, so the bilingual trace message is reduced to Chinese.
    expect(screen.getByTestId('step-desc').textContent).toBe('调用');

    // The call stack shows only the outermost frame, active.
    expect(screen.getByTestId('call-frame-f1').className).toContain('active');
    expect(screen.queryByTestId('call-frame-f2')).toBeNull();

    // Variables watch follows the same frame.
    expect(screen.getByTestId('variables-watch').textContent).toContain('n');
    expect(screen.getByTestId('variables-watch').textContent).toContain('4');
    expect(screen.getByTestId('variables-scope').textContent).toContain('factorial');
  });

  it('scenario B: switching algorithm while playing stops the old timer', async () => {
    vi.useFakeTimers();
    try {
      renderApp();
      await act(async () => { await vi.advanceTimersByTimeAsync(0); });
      await act(async () => {
        await vi.waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 12'));
      });

      fireEvent.click(screen.getByTestId('play-btn'));
      expect(screen.getByTestId('play-btn').textContent).toContain('暂停');
      await act(async () => { await vi.advanceTimersByTimeAsync(1200); }); // 3 ticks at 390 ms
      expect(screen.getByTestId('progress').textContent).not.toBe('1 / 12');

      fireEvent.click(screen.getByTestId('algo-factorial'));
      await act(async () => { await vi.advanceTimersByTimeAsync(0); });
      await act(async () => {
        await vi.waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 4'));
      });

      // Playback stopped and no leftover interval keeps moving the new trace.
      expect(screen.getByTestId('play-btn').textContent).toContain('播放');
      await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
      expect(screen.getByTestId('progress').textContent).toBe('1 / 4');
    } finally {
      vi.useRealTimers();
    }
  });

  it('scenario C: an empty trace renders a defined empty state and clears the old call stack', async () => {
    renderApp();
    await waitForInitialRun();

    // Put a real call stack on screen first.
    fireEvent.click(screen.getByTestId('algo-factorial'));
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 4'));
    expect(screen.getByTestId('call-stack-panel')).toBeTruthy();

    // The next run yields no valid events at all (the schema rejects []).
    mockedRun.mockImplementation(async () => ({ frames: [] }));
    fireEvent.click(screen.getByTestId('run-btn'));

    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('0 / 0'));
    expect(screen.getByTestId('visual-stage').textContent).toContain('请运行代码以生成步骤');
    expect((screen.getByTestId('play-btn') as HTMLButtonElement).disabled).toBe(true);

    // A failed/empty trace must not leave the previous call stack on screen.
    expect(screen.queryByTestId('call-stack-panel')).toBeNull();

    // Controls on an empty trace must be harmless.
    fireEvent.click(screen.getByTestId('next-btn'));
    fireEvent.click(screen.getByTestId('prev-btn'));
    fireEvent.change(screen.getByTestId('scrub'), { target: { value: '99' } });
    expect(screen.getByTestId('progress').textContent).toBe('0 / 0');
    expect(screen.getByTestId('step-desc').textContent).toContain('请运行代码以生成步骤');
  });

  it('scenario E: UI-only changes do not reset the scrubbed position', async () => {
    renderApp();
    await waitForInitialRun();

    fireEvent.change(screen.getByTestId('scrub'), { target: { value: '6' } });
    expect(screen.getByTestId('progress').textContent).toBe('7 / 12');

    // Theme + language + speed are not new traces.
    fireEvent.change(screen.getByTestId('theme-select'), { target: { value: 'light' } });
    expect(screen.getByTestId('progress').textContent).toBe('7 / 12');
    fireEvent.click(screen.getByRole('button', { name: 'Switch language' }));
    expect(screen.getByTestId('progress').textContent).toBe('7 / 12');
    fireEvent.change(screen.getByLabelText('Speed'), { target: { value: '5' } });
    expect(screen.getByTestId('progress').textContent).toBe('7 / 12');
  });
});
