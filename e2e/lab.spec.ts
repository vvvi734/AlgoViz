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
});
