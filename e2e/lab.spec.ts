import { expect, test, type Page } from '@playwright/test';

/** Replace the Monaco editor content by selecting all and typing. */
async function setEditorCode(page: Page, code: string) {
  // Click the visible editor surface (Monaco's hidden textarea is not clickable
  // in headless mode), then select-all and type over it.
  await page.locator('.monaco-editor').first().click();
  await page.keyboard.press('Control+a');
  await page.keyboard.insertText(code);
}

test.describe('AlgoLens Stage 2 — Monaco + Python sync (real browser)', () => {
  test('loads Monaco, runs Python bubble sort and syncs highlight + variables', async ({ page }) => {
    await page.goto('/');
    // Monaco is lazy-loaded; wait for the real editor (not the fallback).
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 45_000 });

    // Switch the teaching language to Python.
    await page.selectOption('#code-lang', 'python');
    await page.click('[data-testid="run-btn"]');

    // First run downloads Pyodide (~10 MB), so give it room.
    await expect(page.locator('[data-testid="variables-watch"]')).toBeVisible({ timeout: 90_000 });
    await expect(page.locator('[data-testid="variables-watch"]')).toContainText('arr');
    await expect(page.locator('[data-testid="variables-watch"]')).toContainText('i');

    // The current trace event highlights a source line inside Monaco.
    await expect(page.locator('.algolens-active-line').first()).toBeVisible();

    // Step forward must change the highlighted line and the step text.
    const stepBefore = await page.locator('[data-testid="step-desc"]').textContent();
    await page.click('[data-testid="next-btn"]');
    await expect(page.locator('[data-testid="step-desc"]')).not.toHaveText(stepBefore ?? '');
    await expect(page.locator('.algolens-active-line').first()).toBeVisible();
  });

  test('shows a real Python SyntaxError and clears it after fixing', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 45_000 });
    await page.selectOption('#code-lang', 'python');

    await setEditorCode(page, 'def broken(:\n    arr = list(input)');
    await page.click('[data-testid="run-btn"]');

    // The Pyodide worker reports a structured SyntaxError in the output panel.
    await expect(page.locator('[data-testid="run-feedback"]')).toContainText('SyntaxError', { timeout: 90_000 });
    // And the editor underlines the offending line with an error squiggle.
    await expect(page.locator('.monaco-editor .squiggly-error').first()).toBeVisible();

    // Fix it and re-run: the error must clear and variables come back.
    await setEditorCode(page, 'arr = list(input)\ntrace({"type": "array", "values": arr}, "ok", variables={"arr": arr})');
    await page.click('[data-testid="run-btn"]');
    await expect(page.locator('[data-testid="run-feedback"]')).not.toContainText('SyntaxError', { timeout: 90_000 });
    await expect(page.locator('.monaco-editor .squiggly-error')).toHaveCount(0);
    await expect(page.locator('[data-testid="variables-watch"]')).toBeVisible({ timeout: 90_000 });
    await expect(page.locator('[data-testid="variables-watch"]')).toContainText('arr');
  });

  test('autosaves edits and restores them after reload', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 45_000 });

    await setEditorCode(page, 'const CUSTOM_MARKER = 424242;');
    // The debounced autosave flushes into localStorage.
    await expect.poll(() =>
      page.evaluate(() => window.localStorage.getItem('algolens.code.bubble.js')),
    ).toContain('CUSTOM_MARKER', { timeout: 10_000 });

    await page.reload();
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 45_000 });
    await expect(page.locator('.monaco-editor')).toContainText('CUSTOM_MARKER');
  });

  test('switches Light / Dark / System without losing the editor or code', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 45_000 });
    await setEditorCode(page, 'const THEME_TEST = 1;');

    await page.selectOption('[data-testid="theme-select"]', 'light');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('.monaco-editor')).toBeVisible();

    await page.selectOption('[data-testid="theme-select"]', 'dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('.monaco-editor')).toContainText('THEME_TEST');

    await page.selectOption('[data-testid="theme-select"]', 'system');
    await expect(page.locator('html')).toHaveAttribute('data-theme', /light|dark/);
    await expect(page.locator('.monaco-editor')).toContainText('THEME_TEST');
  });

  test('Stage 3 — Python factorial recursion: real Pyodide call stack, result 24', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 45_000 });

    // Switch to Python, then open the factorial preset (auto-runs real Pyodide).
    await page.selectOption('#code-lang', 'python');
    await page.click('[data-testid="algo-factorial"]');

    // First run downloads Pyodide (~10 MB) and executes the real recursion.
    await expect(page.locator('[data-testid="call-stack"]')).toBeVisible({ timeout: 120_000 });

    // factorial(4) begins: at least one frame, and stepping forward pushes more.
    await expect(page.locator('[data-testid="call-frame-f1"]')).toBeVisible();
    await page.click('[data-testid="next-btn"]');
    await expect(page.locator('[data-testid="call-frame-f2"]')).toBeVisible({ timeout: 15_000 });

    // The variables watch shows the per-frame `n`.
    await expect(page.locator('[data-testid="variables-watch"]')).toContainText('n');

    // Monaco highlights the recorded source line for the current event.
    await expect(page.locator('.algolens-active-line').first()).toBeVisible();

    // Rewind restores the historical (smaller) call stack.
    await page.click('[data-testid="prev-btn"]');
    await expect(page.locator('[data-testid="call-frame-f2"]')).toHaveCount(0);

    // Scrub to the last event: the call stack is cleared and `answer` = 24.
    const last = await page.locator('[data-testid="scrub"]').evaluate((el) => (el as HTMLInputElement).max);
    await page.locator('[data-testid="scrub"]').fill(String(last));
    await expect(page.locator('[data-testid="variables-watch"]')).toContainText('24');
    await expect(page.locator('[data-testid="step-explanation"]')).toContainText('完成');
  });

  test('Stage 3 — Python Fibonacci recursion: real Pyodide branches, result 3', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 45_000 });

    await page.selectOption('#code-lang', 'python');
    await page.click('[data-testid="algo-fib"]');

    await expect(page.locator('[data-testid="call-stack"]')).toBeVisible({ timeout: 120_000 });
    await expect(page.locator('[data-testid="call-frame-f1"]')).toBeVisible();

    // fib(4) recurses into several branches, each a distinct frame.
    await page.click('[data-testid="next-btn"]');
    await expect(page.locator('[data-testid="call-frame-f2"]')).toBeVisible({ timeout: 15_000 });
    await page.click('[data-testid="next-btn"]');
    await expect(page.locator('[data-testid="call-frame-f3"]')).toBeVisible({ timeout: 15_000 });

    // Scrub to the end: fib(4) = 3.
    const last = await page.locator('[data-testid="scrub"]').evaluate((el) => (el as HTMLInputElement).max);
    await page.locator('[data-testid="scrub"]').fill(String(last));
    await expect(page.locator('[data-testid="variables-watch"]')).toContainText('3');
  });
});

/**
 * Regression for the Stage-3 timeline bug: the reset effect watched the DOM
 * global `window.frames` instead of the event array, so a scrubbed index survived
 * an algorithm switch and could point past the end of the new trace.
 *
 * Uses only JavaScript presets, so this test needs no Pyodide download.
 */
test.describe('Stage 3 fix — switching traces resets the timeline (JS, offline)', () => {
  test('scrubbing the 25-frame bubble sort then switching to the 5-frame binary search lands on frame 1', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 45_000 });

    // Bubble sort is the longest legacy trace: 25 frames.
    await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 25');

    const last = await page.locator('[data-testid="scrub"]').evaluate((el) => (el as HTMLInputElement).max);
    await page.locator('[data-testid="scrub"]').fill(String(last));
    await expect(page.locator('[data-testid="progress"]')).toHaveText('25 / 25');

    // Binary search has 5 frames, so index 24 is out of range for it.
    await page.click('[data-testid="algo-binary"]');
    await expect(page.locator('[data-testid="progress"]')).toHaveText('1 / 5');

    // The stage still renders a real frame instead of the empty placeholder.
    await expect(page.locator('[data-testid="visual-stage"] .empty')).toHaveCount(0);
    await expect(page.locator('[data-testid="visual-stage"] .bar')).toHaveCount(7);
    await expect(page.locator('[data-testid="step-desc"]')).toContainText('有序数组');
    await expect(page.locator('[data-testid="step-number"]')).toContainText('1');
  });
});
