import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from './fixtures';
import { bubbleSortLesson } from '../src/domain/lessons/bubbleSort';
import { exampleFor } from '../src/domain/algorithms/examples';
import { buildLearningSession, serializeLearningSession } from '../src/domain/sessions/session';
import { parseLearningContext } from '../src/domain/sessions/context';

/**
 * Stage 5A — the two file-exchange flows in a real browser.
 *
 *  A. Agent → Web: an `.algosession.json` written ahead of time (exactly what
 *     `create_learning_session` writes) is imported, previewed, applied, and only
 *     after the user presses Run does real Pyodide produce a trace.
 *  B. Web → Agent: the current frame is exported as `.algocontext.json`; the file
 *     is then read back and validated with the same parser the MCP server uses.
 *
 * The exported file is left in `test-results/agent/` so `npm run mcp:smoke
 * -- --context-dir test-results/agent` can feed it to the real stdio server.
 */

const AGENT_DIR = path.resolve('test-results', 'agent');
const SESSION_FILE = path.join(AGENT_DIR, 'bubble-sort-basics.algosession.json');
const CONTEXT_FILE = path.join(AGENT_DIR, 'bubble.algocontext.json');

const PYTHON = exampleFor('bubble', 'python');

test.beforeAll(() => {
  fs.mkdirSync(AGENT_DIR, { recursive: true });
  const built = buildLearningSession({
    lesson: bubbleSortLesson,
    locale: 'zh',
    origin: { kind: 'builtin' },
    selectedStepId: 'compare',
    source: PYTHON,
    input: [5, 2, 9, 1],
    sessionName: 'E2E bubble sort',
  });
  if (!built.ok) throw new Error('could not build the e2e session fixture');
  fs.writeFileSync(SESSION_FILE, serializeLearningSession(built.value), 'utf8');
});

async function openApp(page: Page) {
  await page.goto('/');
  await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 45_000 });
}

test.describe('Stage 5A — Agent session file → AlgoLens Web', () => {
  test('import, preview, apply, then a user-triggered real Pyodide run', async ({ page }) => {
    await openApp(page);
    await page.click('[data-testid="workspace-tab-tools"]');

    await page.setInputFiles('[data-testid="session-file-input"]', SESSION_FILE);
    await expect(page.locator('[data-testid="session-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="session-preview-lesson"]')).toContainText('冒泡排序');
    await expect(page.locator('[data-testid="session-preview-step"]')).toContainText('比较');
    await expect(page.locator('[data-testid="session-preview-source"]')).toContainText('Python');

    await page.click('[data-testid="session-preview-apply"]');
    await expect(page.locator('[data-testid="session-applied"]')).toBeVisible();
    await expect(page.locator('[data-testid="session-applied-step"]')).toContainText('比较');
    await expect(page.locator('#code-lang')).toHaveValue('python');
    await expect(page.locator('.monaco-editor')).toContainText('lesson_step');

    // Applying clears the previous trace: the timeline starts empty, and no
    // teaching stage can be highlighted without a real frame.
    await expect(page.locator('[data-testid="step-number"]')).toContainText('0');
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveCount(0);

    // The user presses Run; Pyodide (~10 MB) downloads on first use.
    await page.click('[data-testid="run-btn"]');
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'init', {
      timeout: 120_000,
    });
    await page.click('[data-testid="workspace-tab-state"]');
    await expect(page.locator('[data-testid="variables-watch"]')).toContainText('arr');

    // Lesson → timeline: jumping to `compare` lands on a real frame of that stage.
    await page.click('[data-testid="lesson-step-compare"]');
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'compare');
    await expect(page.locator('[data-testid="step-desc"]')).toContainText('比较');
    await expect(page.locator('.algolens-active-line').first()).toBeVisible();

    // Walk to the next `compare` occurrence: the same stage repeats, as it must.
    await page.click('[data-testid="next-btn"]');
    await expect(page.locator('[data-testid="step-desc"]')).not.toHaveText('');
  });
});

test.describe('Stage 5A — AlgoLens Web → Agent context file', () => {
  test('exports the frame on screen as a validated .algocontext.json', async ({ page }) => {
    await openApp(page);
    // Python is the language that records `lesson_step`; the JS example does not.
    await page.selectOption('#code-lang', 'python');
    await expect(page.locator('#code-lang')).toHaveValue('python');
    await expect(page.locator('.monaco-editor')).toContainText('lesson_step');
    await page.click('[data-testid="run-btn"]');
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'init', {
      timeout: 120_000,
    });

    // Pick a teaching stage through the lesson panel (real trace frames only).
    await page.click('[data-testid="lesson-step-compare"]');
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'compare');
    const frameBefore = await page.locator('[data-testid="step-number"]').textContent();

    await page.click('[data-testid="workspace-tab-tools"]');
    await page.check('[data-testid="session-export-source"]');
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="session-export"]');
    const download = await downloadPromise;
    await download.saveAs(CONTEXT_FILE);

    // Exporting must not re-run anything: the frame indicator is unchanged.
    await expect(page.locator('[data-testid="step-number"]')).toHaveText(frameBefore ?? '');

    const text = fs.readFileSync(CONTEXT_FILE, 'utf8');
    const parsed = parseLearningContext(text);
    expect(parsed.ok, parsed.ok ? '' : JSON.stringify(parsed.errors)).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.value.contextFormatVersion).toBe(1);
    expect(parsed.value.traceSchemaVersion).toBe(1);
    expect(parsed.value.algorithmId).toBe('bubble');
    expect(parsed.value.lessonId).toBe('bubble-sort-basics');
    expect(parsed.value.lessonStepId).toBe('compare');
    expect(parsed.value.stepIndex).toBe(parsed.value.event.step);
    expect(parsed.value.totalEvents).toBeGreaterThan(parsed.value.stepIndex);
    expect(parsed.value.event.lessonStepId).toBe('compare');
    expect((parsed.value.event.variables ?? []).length).toBeGreaterThan(0);
    expect(parsed.value.source).toContain('lesson_step');
    // No secrets, no browser storage, no absolute paths in the exported file.
    expect(text).not.toMatch(/api[_-]?key|OPENAI|indexedDB|C:\\\\Users/i);
  });
});
