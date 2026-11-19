import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { ThemeProvider } from '../theme/ThemeProvider';
import { I18nProvider } from '../i18n/I18nProvider';
import { App } from './App';
import { runForLanguage } from '../runtime/execute';
import { lessonFixture, manifestFixture, packFileSet, zipOf } from '../test/packs';

// COMPONENT-level wiring: the worker is mocked, but the ZIP reader, the domain
// validators and a real (fake) IndexedDB all run for real. Real Pyodide traces
// are covered by e2e/packs.spec.ts.
vi.mock('../runtime/execute', () => ({
  runForLanguage: vi.fn(),
  isVisualResult: (value: unknown) => typeof value === 'object' && value !== null && 'frames' in value,
}));

const mockedRun = vi.mocked(runForLanguage);

const frames = [
  { state: { type: 'array', values: [1, 3, 5] }, message: 'FRAME 0', line: 1, lessonStepId: 'init' },
  { state: { type: 'array', values: [1, 3, 5], focus: [1] }, message: 'FRAME 1', line: 3, lessonStepId: 'compare' },
];

/** A real `.algopack` archive targeting `fib` (which has no built-in course). */
function packBytes(algorithmId = 'fib') {
  const lesson = lessonFixture({
    lessonId: 'fib-pack',
    algorithmId,
    title: { zh: '斐波那契（知识包）', en: 'Fibonacci (pack)' },
  });
  const manifest = manifestFixture({
    packId: 'fixture-pack',
    lessons: ['lessons/pack-course.json'],
    examples: [{ path: 'examples/pack-course.py', lessonId: 'fib-pack', language: 'python' }],
  });
  return zipOf(packFileSet({ lesson, manifest }));
}

function packFile(algorithmId?: string) {
  return new File([packBytes(algorithmId) as unknown as BlobPart], 'fixture-pack.algopack', {
    type: 'application/octet-stream',
  });
}

function renderApp() {
  return render(
    <ThemeProvider>
      <I18nProvider>
        <App />
      </I18nProvider>
    </ThemeProvider>,
  );
}

function useIndexedDb(factory: IDBFactory) {
  Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: factory });
}

async function importAndInstall(file: File) {
  fireEvent.click(screen.getByTestId('nav-packs'));
  const input = screen.getByTestId('pack-file-input') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [file] } });
  await waitFor(() => expect(screen.getByTestId('pack-preview')).toBeTruthy());
  fireEvent.click(screen.getByTestId('pack-preview-confirm'));
  await waitFor(() => expect(screen.getByTestId('pack-card-fixture-pack')).toBeTruthy());
}

beforeEach(() => {
  window.localStorage.clear();
  // Fresh database per test: `browserPackStore()` binds to this global on mount.
  useIndexedDb(new IDBFactory());
  mockedRun.mockReset();
  mockedRun.mockImplementation(async () => ({ frames }));
});

describe('Stage 4 — installed packs join the lab', () => {
  it('imports, previews, installs, opens the course and uninstalls it', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toMatch(/1 \/ \d+/));

    await importAndInstall(packFile());
    expect(screen.getByTestId('pack-version-fixture-pack').textContent).toContain('1.0.0');

    fireEvent.click(screen.getByTestId('pack-open-fib'));
    await waitFor(() => expect(screen.getByTestId('learn-view')).toBeTruthy());
    await waitFor(() =>
      expect(screen.getByTestId('lesson-title').textContent).toContain('斐波那契（知识包）'),
    );
    expect(screen.getByTestId('lesson-origin').textContent).toContain('样例知识包');
    expect(screen.getByTestId('lesson-use-example')).toBeTruthy();

    // Loading the example must NOT execute anything by itself.
    const runsBefore = mockedRun.mock.calls.length;
    fireEvent.click(screen.getByTestId('lesson-use-example'));
    expect(mockedRun.mock.calls.length).toBe(runsBefore);

    // Uninstall → the course disappears and the algorithm falls back to the
    // explicit empty state, while built-in courses stay untouched.
    fireEvent.click(screen.getByTestId('nav-packs'));
    fireEvent.click(screen.getByTestId('pack-uninstall-fixture-pack'));
    fireEvent.click(screen.getByTestId('pack-uninstall-yes-fixture-pack'));
    await waitFor(() => expect(screen.queryByTestId('pack-card-fixture-pack')).toBeNull());
    expect(screen.getByTestId('pack-empty')).toBeTruthy();

    fireEvent.click(screen.getByTestId('nav-learn'));
    await waitFor(() => expect(screen.getByTestId('lesson-no-lesson')).toBeTruthy());
  });

  it('keeps the install after a reload (same IndexedDB, fresh React tree)', async () => {
    const factory = new IDBFactory();
    useIndexedDb(factory);
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toMatch(/1 \/ \d+/));
    await importAndInstall(packFile());
    expect(screen.getByTestId('pack-card-fixture-pack')).toBeTruthy();

    // Re-mount the app against the same database: the course must come back.
    const second = render(
      <ThemeProvider>
        <I18nProvider>
          <App />
        </I18nProvider>
      </ThemeProvider>,
    );
    const views = within(second.container);
    await waitFor(() => expect(views.getByTestId('pack-card-fixture-pack')).toBeTruthy());
    fireEvent.click(views.getByTestId('pack-open-fib'));
    await waitFor(() =>
      expect(views.getByTestId('lesson-title').textContent).toContain('斐波那契（知识包）'),
    );
  });

  it('refuses a duplicate install of the same version', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toMatch(/1 \/ \d+/));
    await importAndInstall(packFile());

    fireEvent.change(screen.getByTestId('pack-file-input'), { target: { files: [packFile()] } });
    await waitFor(() => expect(screen.getByTestId('pack-error')).toBeTruthy());
    expect(screen.getByTestId('pack-error').textContent).toContain('已安装');
    expect(screen.getAllByTestId('pack-card-fixture-pack')).toHaveLength(1);
  });

  it('cannot override a built-in course', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('progress').textContent).toMatch(/1 \/ \d+/));

    fireEvent.click(screen.getByTestId('nav-packs'));
    fireEvent.change(screen.getByTestId('pack-file-input'), {
      target: { files: [packFile('bubble')] },
    });
    await waitFor(() => expect(screen.getByTestId('pack-error')).toBeTruthy());
    expect(screen.getByTestId('pack-error').textContent).toContain('内置课程');
    expect(screen.queryByTestId('pack-preview')).toBeNull();
  });
});
