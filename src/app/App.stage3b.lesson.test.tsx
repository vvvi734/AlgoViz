import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../theme/ThemeProvider';
import { I18nProvider } from '../i18n/I18nProvider';
import { App } from './App';
import { runForLanguage } from '../runtime/execute';

// COMPONENT-level wiring only: `runtime/execute` is mocked, so no worker runs.
// Real Pyodide traces are covered by e2e/lab.spec.ts.
vi.mock('../runtime/execute', () => ({
  runForLanguage: vi.fn(),
  isVisualResult: (value: unknown) => typeof value === 'object' && value !== null && 'frames' in value,
}));

const mockedRun = vi.mocked(runForLanguage);

/** Bubble shape with the teaching stages the Python preset really records. */
const STAGES = [
  'init', 'compare', 'swap', 'compare', 'swap', 'pass',
  'compare', 'swap', 'pass', 'compare', 'swap', 'done',
];

const linkedFrames = STAGES.map((lessonStepId, index) => ({
  state: { type: 'array', values: [index, 12 - index], focus: [0, 1] },
  message: `STAGE ${lessonStepId} #${index}`,
  line: 1 + (index % 3),
  variables: [{ name: 'i', type: 'int', value: index }],
  lessonStepId,
}));

function renderApp() {
  return render(
    <ThemeProvider>
      <I18nProvider>
        <App />
      </I18nProvider>
    </ThemeProvider>,
  );
}

/** Wait for the async first run, not just the initial legacy frame painted by the shell. */
async function waitForInitialRun() {
  await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 12'));
  await waitFor(() => expect(screen.getByTestId('run-feedback').textContent).toContain('动画已生成'));
}

beforeEach(() => {
  window.localStorage.clear();
  mockedRun.mockReset();
  mockedRun.mockImplementation(async () => ({ frames: linkedFrames }));
});

describe('Stage 3B — teaching steps follow the single timeline cursor', () => {
  it('renders the course and highlights the stage recorded by frame 0', async () => {
    renderApp();
    await waitForInitialRun();
    expect(screen.getByTestId('lesson-panel')).toBeTruthy();
    expect(screen.getByTestId('lesson-title').textContent).toContain('冒泡排序');
    await waitFor(() =>
      expect(screen.getByTestId('lesson-active-step').dataset.stepId).toBe('init'),
    );
  });

  it('timeline → lesson: scrubbing and stepping update the highlighted stage', async () => {
    renderApp();
    await waitForInitialRun();

    fireEvent.change(screen.getByTestId('scrub'), { target: { value: '2' } });
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('3 / 12'));
    await waitFor(() =>
      expect(screen.getByTestId('lesson-active-step').dataset.stepId).toBe('swap'),
    );

    fireEvent.click(screen.getByTestId('next-btn'));
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('4 / 12'));
    await waitFor(() =>
      expect(screen.getByTestId('lesson-active-step').dataset.stepId).toBe('compare'),
    );

    fireEvent.click(screen.getByTestId('prev-btn'));
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('3 / 12'));
    await waitFor(() =>
      expect(screen.getByTestId('lesson-active-step').dataset.stepId).toBe('swap'),
    );
  });

  it('lesson → timeline: clicking a step seeks the real frame and pauses playback', async () => {
    renderApp();
    await waitForInitialRun();

    // Playing first, so the click must also stop the timer.
    fireEvent.click(screen.getByTestId('play-btn'));
    expect(screen.getByTestId('play-btn').textContent).toContain('暂停');

    fireEvent.click(screen.getByTestId('lesson-step-pass'));
    // Next 'pass' after frame 0 is frame 5 (1-based step 6).
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('6 / 12'));
    expect(screen.getByTestId('play-btn').textContent).toContain('播放');
    expect(screen.getByTestId('lesson-active-step').dataset.stepId).toBe('pass');
    // The same cursor drives the step description and variables watch.
    expect(screen.getByTestId('step-desc').textContent).toContain('STAGE pass');
    expect(screen.getByTestId('variables-watch').textContent).toContain('i');
  });

  it('keeps an algorithm without a course working and shows the empty state', async () => {
    renderApp();
    await waitForInitialRun();

    fireEvent.click(screen.getByTestId('algo-fib'));
    // The course-less algorithm must render an explicit empty state, never crash.
    await waitFor(() => expect(screen.getByTestId('lesson-no-lesson')).toBeTruthy());
    expect(screen.getByTestId('lesson-no-lesson').textContent).toContain('尚未提供教学课程');
    expect(screen.queryByTestId('lesson-steps')).toBeNull();
    // The rest of the lab keeps working: a trace arrives and the stage renders.
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toMatch(/1 \/ \d+/));
    expect(screen.getByTestId('visual-stage')).toBeTruthy();
  });

  it('switching language keeps the frame, the code and the highlighted step id', async () => {
    renderApp();
    await waitForInitialRun();
    fireEvent.change(screen.getByTestId('scrub'), { target: { value: '2' } });
    expect(screen.getByTestId('lesson-active-step').dataset.stepId).toBe('swap');

    fireEvent.click(screen.getByRole('button', { name: 'Switch language' }));

    const runsBeforeSwitch = mockedRun.mock.calls.length;
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('3 / 12'));
    expect(screen.getByTestId('lesson-active-step').dataset.stepId).toBe('swap');
    expect(screen.getByTestId('lesson-title').textContent).toContain('Bubble sort');
    // Switching language is not a new run: no extra execution was dispatched.
    expect(mockedRun.mock.calls.length).toBe(runsBeforeSwitch);
  });

  it('does not keep the old teaching highlight after a new run', async () => {
    renderApp();
    await waitForInitialRun();
    fireEvent.change(screen.getByTestId('scrub'), { target: { value: '11' } });
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('12 / 12'));
    await waitFor(() =>
      expect(screen.getByTestId('lesson-active-step').dataset.stepId).toBe('done'),
    );

    fireEvent.click(screen.getByTestId('run-btn'));
    await waitForInitialRun();
    expect(screen.getByTestId('lesson-active-step').dataset.stepId).toBe('init');
  });

  it('shows the unlinked state when the run recorded no teaching stage', async () => {
    mockedRun.mockImplementation(async () => ({
      frames: linkedFrames.map(({ lessonStepId: _ignored, ...frame }) => frame),
    }));
    renderApp();
    await waitForInitialRun();
    expect(screen.getByTestId('lesson-panel')).toBeTruthy();
    expect(screen.queryByTestId('lesson-active-step')).toBeNull();
    expect(screen.getByTestId('lesson-unlinked')).toBeTruthy();
  });
});
