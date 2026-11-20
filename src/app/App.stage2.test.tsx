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

  it('keeps the compact runner free of a source editor', async () => {
    renderApp();
    await waitForReady();

    expect(screen.getByTestId('code-dock')).toBeTruthy();
    expect(screen.getByTestId('run-input')).toBeTruthy();
    expect(screen.queryByTestId('code-editor')).toBeNull();
    expect(screen.queryByTestId('editor-no-location')).toBeNull();
  });
});
