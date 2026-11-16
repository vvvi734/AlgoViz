import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../theme/ThemeProvider';
import { I18nProvider } from '../i18n/I18nProvider';
import { App } from './App';
import { runForLanguage } from '../runtime/execute';

// The app's run path is mocked here: these are COMPONENT tests that verify the
// React sync behaviour (call stack rendering, scope switching, rewind), NOT a
// Pyodide integration test. Real Python execution is verified in e2e/lab.spec.ts.
vi.mock('../runtime/execute', () => ({
  runForLanguage: vi.fn(async () => ({ frames: [] })),
  isVisualResult: (value: unknown) => typeof value === 'object' && value !== null && 'frames' in value,
}));

const mockedRun = vi.mocked(runForLanguage);

function renderApp() {
  return render(
    <ThemeProvider>
      <I18nProvider>
        <App />
      </I18nProvider>
    </ThemeProvider>,
  );
}

async function waitForReady() {
  await waitFor(() => expect(screen.getByTestId('run-feedback').textContent).toContain('动画已生成'));
  await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 2'));
}

const recursionFrames = [
  {
    state: { type: 'stack', values: ['factorial'] },
    message: '调用 / call factorial(4)', line: 2,
    callStack: [
      { name: 'factorial', frameId: 'f1', depth: 0, status: 'running', arguments: [{ name: 'n', type: 'int', value: 4 }], locals: [{ name: 'n', type: 'int', value: 4 }] },
    ],
  },
  {
    state: { type: 'stack', values: ['factorial', 'factorial'] },
    message: '调用 / call factorial(3)', line: 2,
    callStack: [
      { name: 'factorial', frameId: 'f1', depth: 0, status: 'running', locals: [{ name: 'n', type: 'int', value: 4 }] },
      { name: 'factorial', frameId: 'f2', depth: 1, status: 'running', arguments: [{ name: 'n', type: 'int', value: 3 }], locals: [{ name: 'n', type: 'int', value: 3 }] },
    ],
  },
];

describe('Stage 3 — recursion call-stack sync', () => {
  beforeEach(() => {
    mockedRun.mockClear();
    mockedRun.mockImplementation(async () => ({ frames: recursionFrames }));
  });

  it('renders the call stack and highlights the active (deepest) frame', async () => {
    renderApp();
    await waitForReady();
    fireEvent.click(screen.getByTestId('next-btn'));
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('2 / 2'));

    expect(screen.getByTestId('call-stack')).toBeTruthy();
    expect(screen.getByTestId('call-frame-f1')).toBeTruthy();
    expect(screen.getByTestId('call-frame-f2').className).toContain('active');
    // Same-named `n` is shown per frame, not merged.
    expect(screen.getByTestId('call-frame-f1').textContent).toContain('n = 4');
    expect(screen.getByTestId('call-frame-f2').textContent).toContain('n = 3');
  });

  it('selecting a frame switches the variables watch to that scope', async () => {
    renderApp();
    await waitForReady();
    fireEvent.click(screen.getByTestId('next-btn'));
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('2 / 2'));

    // Active frame (f2, n = 3) is shown by default.
    expect(screen.getByTestId('variables-scope').textContent).toContain('factorial');
    expect(screen.getByTestId('variables-watch').textContent).toContain('3');

    fireEvent.click(screen.getByTestId('call-frame-f1'));
    await waitFor(() => expect(screen.getByTestId('variables-watch').textContent).toContain('4'));
    expect(screen.getByTestId('variables-watch').textContent).not.toContain('3');
  });

  it('rewinding the timeline restores the historical call stack', async () => {
    renderApp();
    await waitForReady();
    fireEvent.click(screen.getByTestId('next-btn'));
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('2 / 2'));

    // At frame 2/2 there are two frames in the stack.
    expect(screen.getByTestId('call-frame-f1')).toBeTruthy();
    expect(screen.getByTestId('call-frame-f2')).toBeTruthy();

    fireEvent.click(screen.getByTestId('prev-btn'));
    // Frame 1/2 carries only one stack frame.
    await waitFor(() => expect(screen.queryByTestId('call-frame-f2')).toBeNull());
    expect(screen.getByTestId('call-frame-f1')).toBeTruthy();
  });

  it('shows no call-stack panel for legacy traces and keeps variables working', async () => {
    mockedRun.mockImplementation(async () => ({
      frames: [{ state: { type: 'array', values: [3, 1, 2] }, message: 'LEGACY', variables: [{ name: 'arr', type: 'list', value: [3, 1, 2] }] }],
    }));
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 1'));
    expect(screen.queryByTestId('call-stack-panel')).toBeNull();
    expect(screen.getByTestId('variables-watch').textContent).toContain('arr');
  });
});
