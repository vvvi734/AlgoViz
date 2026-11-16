import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { ThemeProvider } from '../theme/ThemeProvider';
import { I18nProvider } from '../i18n/I18nProvider';
import { App } from './App';
import { runForLanguage } from '../runtime/execute';
import { bubbleSortLesson } from '../domain/lessons/bubbleSort';
import { factorialLesson } from '../domain/lessons/factorial';
import { exampleFor } from '../domain/algorithms/examples';
import { buildLearningSession, serializeLearningSession } from '../domain/sessions/session';
import { parseLearningContext } from '../domain/sessions/context';
import type { SessionLessonOrigin } from '../domain/sessions/types';
import { lessonFixture } from '../test/packs';

/**
 * Stage 5A — the browser half of the Agent bridge.
 */
vi.mock('../runtime/execute', () => ({
  runForLanguage: vi.fn(),
  isVisualResult: (value: unknown) => typeof value === 'object' && value !== null && 'frames' in value,
}));

const mockedRun = vi.mocked(runForLanguage);

const frames = [
  { state: { type: 'array', values: [3, 1, 2] }, message: 'FRAME 0', line: 1, lessonStepId: 'init' },
  { state: { type: 'array', values: [3, 1, 2], focus: [0, 1] }, message: 'FRAME 1', line: 7, lessonStepId: 'compare' },
  { state: { type: 'array', values: [1, 3, 2] }, message: 'FRAME 2', line: 8, lessonStepId: 'swap' },
];

const PYTHON = exampleFor('bubble', 'python');

function renderApp() {
  return render(
    <ThemeProvider>
      <I18nProvider>
        <App />
      </I18nProvider>
    </ThemeProvider>,
  );
}

function sessionFile(origin: SessionLessonOrigin = { kind: 'builtin' }) {
  const lesson = origin.kind === 'pack' ? lessonFixture({ lessonId: 'binary-pack', algorithmId: 'binary' }) : bubbleSortLesson;
  const built = buildLearningSession({
    lesson,
    locale: 'zh',
    origin,
    selectedStepId: origin.kind === 'pack' ? undefined : 'compare',
    ...(origin.kind === 'pack' ? {} : { source: PYTHON, input: [3, 1, 2] }),
  });
  if (!built.ok) throw new Error('session fixture is invalid');
  return new File([serializeLearningSession(built.value)], `${lesson.lessonId}.algosession.json`, {
    type: 'application/json',
  });
}

/** jsdom's Blob has no `.text()`; FileReader is the portable reader here. */
function readBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('blob read failed'));
    reader.readAsText(blob);
  });
}

/** Capture the Blob the export hands to the browser instead of downloading it. */
function captureDownloads() {
  let blob: Blob | null = null;
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: (value: Blob) => {
      blob = value;
      return 'blob:captured';
    },
  });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: () => {} });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  return {
    read: () => blob,
    reset: () => {
      blob = null;
    },
  };
}

beforeEach(() => {
  window.localStorage.clear();
  Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: new IDBFactory() });
  mockedRun.mockReset();
  // The mount-time run yields a shorter trace, so a later explicit run is
  // observable by frame count instead of being confused with the initial one.
  let runs = 0;
  mockedRun.mockImplementation(async () => {
    runs += 1;
    return { frames: runs === 1 ? frames.slice(0, 2) : frames };
  });
});

describe('Stage 5A — importing an Agent learning session', () => {
  it('previews first, applies on confirm and runs nothing', async () => {
    renderApp();
    await waitFor(() => expect(mockedRun).toHaveBeenCalled());

    const runsBefore = mockedRun.mock.calls.length;
    fireEvent.change(screen.getByTestId('session-file-input'), { target: { files: [sessionFile()] } });
    await waitFor(() => expect(screen.getByTestId('session-preview')).toBeTruthy());

    // Preview only: the editor is untouched and nothing was executed.
    expect(screen.getByTestId('session-preview-source').textContent).toBeTruthy();
    expect((screen.getByTestId('code-editor') as HTMLTextAreaElement).value).not.toContain('lesson_step');
    expect(mockedRun.mock.calls.length).toBe(runsBefore);

    fireEvent.click(screen.getByTestId('session-preview-apply'));
    await waitFor(() => expect(screen.getByTestId('session-applied')).toBeTruthy());

    // The Python example is loaded as inert text and the trace is cleared.
    await waitFor(() =>
      expect((screen.getByTestId('code-editor') as HTMLTextAreaElement).value).toContain('lesson_step'),
    );
    expect(screen.getByTestId('progress').textContent).toMatch(/0 \/ 0/);
    expect(screen.getByTestId('session-applied-step').textContent).toBeTruthy();
    expect(screen.getByTestId('session-applied-run').textContent).toBeTruthy();
    expect(mockedRun.mock.calls.length).toBe(runsBefore);
  });

  it('rejects a pack session while the pack is not installed', async () => {
    renderApp();
    await waitFor(() => expect(mockedRun).toHaveBeenCalled());

    fireEvent.change(screen.getByTestId('session-file-input'), {
      target: { files: [sessionFile({ kind: 'pack', packId: 'algolens-search-basics', version: '1.0.0' })] },
    });
    await waitFor(() => expect(screen.getByTestId('session-issues')).toBeTruthy());
    expect(screen.getByTestId('session-issue-origin-pack-missing').textContent).toContain('algolens-search-basics');
    expect(screen.queryByTestId('session-preview')).toBeNull();
    expect(screen.queryByText('lesson_step')).toBeNull();
  });

  it('rejects a session whose lesson does not match its algorithm', async () => {
    renderApp();
    await waitFor(() => expect(mockedRun).toHaveBeenCalled());

    const lesson = { ...factorialLesson, algorithmId: 'bubble' };
    const built = buildLearningSession({ lesson, locale: 'zh', origin: { kind: 'builtin' } });
    if (!built.ok) throw new Error('fixture invalid');
    const file = new File([serializeLearningSession(built.value)], 'mismatch.algosession.json', {
      type: 'application/json',
    });
    fireEvent.change(screen.getByTestId('session-file-input'), { target: { files: [file] } });
    await waitFor(() => expect(screen.getByTestId('session-issues')).toBeTruthy());
    // factorial lesson under the bubble algorithm: the app refuses to guess.
    expect(screen.getByTestId('session-issue-lesson-algorithm-mismatch').textContent).toBeTruthy();
  });
});

describe('Stage 5A — exporting the current learning context', () => {
  it('serialises the frame on screen without re-running anything', async () => {
    const downloads = captureDownloads();
    renderApp();
    await waitFor(() => expect(mockedRun).toHaveBeenCalled());

    fireEvent.click(screen.getByTestId('run-btn'));
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toMatch(/1 \/ 3/));
    const runsAfterRun = mockedRun.mock.calls.length;

    // Move to the second frame (compare) with the real timeline scrubber.
    fireEvent.change(screen.getByTestId('scrub'), { target: { value: '1' } });
    expect(screen.getByTestId('progress').textContent).toBe('2 / 3');
    expect(screen.getByTestId('step-desc').textContent).toBe('FRAME 1');
    fireEvent.click(screen.getByTestId('session-export'));
    await waitFor(() => expect(downloads.read()).toBeTruthy());

    const text = await readBlob(downloads.read()!);
    const parsed = parseLearningContext(text);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.stepIndex).toBe(1);
      expect(parsed.value.totalEvents).toBe(3);
      expect(parsed.value.lessonStepId).toBe('compare');
      expect(parsed.value.event.message).toBe('FRAME 1');
      expect(parsed.value.source).toBeUndefined();
    }
    expect(mockedRun.mock.calls.length).toBe(runsAfterRun);

    // Opt-in source: the exact editor text, still without any execution.
    const editorText = (screen.getByTestId('code-editor') as HTMLTextAreaElement).value;
    downloads.reset();
    fireEvent.click(screen.getByTestId('session-export-source'));
    fireEvent.click(screen.getByTestId('session-export'));
    await waitFor(() => expect(downloads.read()).toBeTruthy());
    const withSource = parseLearningContext(await readBlob(downloads.read()!));
    expect(withSource.ok).toBe(true);
    if (withSource.ok) {
      expect(withSource.value.source).toBe(editorText);
      expect(withSource.value.stepIndex).toBe(1);
    }
    expect(mockedRun.mock.calls.length).toBe(runsAfterRun);
  });
});
