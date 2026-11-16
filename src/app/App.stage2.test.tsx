import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../theme/ThemeProvider';
import { I18nProvider } from '../i18n/I18nProvider';
import { App } from './App';
import { runForLanguage } from '../runtime/execute';
import { ExecutionError } from '../domain/trace/diagnostic';

// The app's run path is mocked; frame production is verified elsewhere.
vi.mock('../runtime/execute', () => ({
  runForLanguage: vi.fn(async () => ({
    frames: [
      { state: { type: 'array', values: [3, 1, 2], focus: [0] }, message: 'STEP ONE' },
      { state: { type: 'array', values: [1, 3, 2], focus: [1] }, message: 'STEP TWO' },
      { state: { type: 'array', values: [1, 2, 3], done: true }, message: 'STEP THREE' },
    ],
  })),
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
  await waitFor(() => expect(screen.getByTestId('progress').textContent).toBe('1 / 3'));
}

describe('Stage 2 — source consistency, diagnostics and drafts', () => {
  beforeEach(() => {
    mockedRun.mockClear();
    mockedRun.mockImplementation(async () => ({
      frames: [
        { state: { type: 'array', values: [3, 1, 2], focus: [0] }, message: 'STEP ONE' },
        { state: { type: 'array', values: [1, 3, 2], focus: [1] }, message: 'STEP TWO' },
        { state: { type: 'array', values: [1, 2, 3], done: true }, message: 'STEP THREE' },
      ],
    }));
  });

  it('marks the trace stale after editing and clears it after re-run', async () => {
    renderApp();
    await waitForReady();
    expect(screen.queryByTestId('sync-stale')).toBeNull();

    fireEvent.change(screen.getByTestId('code-editor'), { target: { value: 'const arr = [9, 8, 7];' } });
    await waitFor(() => expect(screen.getByTestId('sync-stale')).toBeTruthy());

    fireEvent.click(screen.getByTestId('run-btn'));
    await waitFor(() => expect(screen.queryByTestId('sync-stale')).toBeNull());
  });

  it('shows a structured Python diagnostic after a failed run', async () => {
    renderApp();
    await waitForReady();

    mockedRun.mockRejectedValueOnce(new ExecutionError('NameError: name x is not defined', {
      severity: 'error',
      category: 'runtime',
      errorType: 'NameError',
      message: 'name x is not defined',
      line: 3,
    }));

    fireEvent.click(screen.getByTestId('run-btn'));
    await waitFor(() => expect(screen.getByTestId('run-feedback').textContent).toContain('NameError'));
  });

  it('autosaves edits and restores them on remount', async () => {
    const { unmount } = renderApp();
    await waitForReady();

    fireEvent.change(screen.getByTestId('code-editor'), { target: { value: 'const CUSTOM = 1;' } });
    await waitFor(() => expect(window.localStorage.getItem('algolens.code.bubble.js')).toBe('const CUSTOM = 1;'));

    unmount();
    renderApp();
    await waitFor(() => {
      expect((screen.getByTestId('code-editor') as HTMLTextAreaElement).value).toBe('const CUSTOM = 1;');
    });
  });

  it('shows a no-location hint for events without source metadata', async () => {
    renderApp();
    await waitForReady();
    // The mocked frames carry no `line`, so the editor must not fabricate a
    // location and should surface the explicit hint instead.
    expect(screen.getByTestId('editor-no-location')).toBeTruthy();
  });
});
