import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

/**
 * Stage 4 — the official `.algopack` end to end, in a real browser.
 *
 * The first test needs no Pyodide (install → learn → reload → uninstall); the
 * second runs the pack's own Python example and checks that the teaching stages
 * come from real frames, not from a scripted trace.
 */

const PACK_FILE = path.resolve('packs', 'algolens-search-basics.algopack');

async function importOfficialPack(page: Page) {
  await page.click('[data-testid="nav-packs"]');
  await page.setInputFiles('[data-testid="pack-file-input"]', PACK_FILE);
  await expect(page.locator('[data-testid="pack-preview"]')).toBeVisible();
  await expect(page.locator('[data-testid="pack-preview-name"]')).toContainText('查找算法入门');
  await expect(page.locator('[data-testid="pack-preview-lesson-binary-search-basics"]')).toBeVisible();
  await page.click('[data-testid="pack-preview-confirm"]');
  await expect(page.locator('[data-testid="pack-card-algolens-search-basics"]')).toBeVisible();
}

test.describe('Stage 4 — official .algopack installs, survives reload and uninstalls', () => {
  test('import → preview → install → open course → reload → uninstall', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 45_000 });

    await importOfficialPack(page);
    await expect(page.locator('[data-testid="pack-version-algolens-search-basics"]')).toContainText('1.0.0');
    await expect(page.locator('[data-testid="pack-card-algolens-search-basics"]')).toContainText('MIT');

    // The installed course joins the existing catalog for `binary`.
    await page.click('[data-testid="pack-open-binary"]');
    await expect(page.locator('[data-testid="lesson-title"]')).toContainText('二分查找');
    await expect(page.locator('[data-testid="lesson-origin"]')).toBeVisible();
    await expect(page.locator('[data-testid="lesson-use-example"]')).toBeVisible();
    await expect(page.locator('[data-testid="lesson-step-found"]')).toBeVisible();

    // Reload: IndexedDB keeps the pack, so the course must come back.
    await page.reload();
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 45_000 });
    await page.click('[data-testid="nav-packs"]');
    await expect(page.locator('[data-testid="pack-card-algolens-search-basics"]')).toBeVisible();

    await page.click('[data-testid="pack-open-binary"]');
    await expect(page.locator('[data-testid="lesson-title"]')).toContainText('二分查找');
    await expect(page.locator('[data-testid="lesson-step-narrow"]')).toBeVisible();

    // Uninstall removes the pack course and leaves the built-in courses alone.
    await page.click('[data-testid="nav-packs"]');
    await page.click('[data-testid="pack-uninstall-algolens-search-basics"]');
    await page.click('[data-testid="pack-uninstall-yes-algolens-search-basics"]');
    await expect(page.locator('[data-testid="pack-empty"]')).toBeVisible();
    await expect(page.locator('[data-testid="pack-card-algolens-search-basics"]')).toHaveCount(0);

    // Binary falls back to the explicit "no course" state…
    await page.click('[data-testid="nav-learn"]');
    await expect(page.locator('[data-testid="lesson-no-lesson"]')).toBeVisible();
    // …while the built-in bubble sort course still renders.
    await page.click('[data-testid="algo-bubble"]');
    await expect(page.locator('[data-testid="lesson-title"]')).toContainText('冒泡排序');
  });
});

test.describe('Stage 4 — pack Python example produces a real trace', () => {
  test('user-triggered run syncs the teaching steps with real Pyodide frames', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 45_000 });

    await importOfficialPack(page);
    await page.click('[data-testid="pack-open-binary"]');

    // Loading the example only fills the editor: it must not run anything.
    await page.click('[data-testid="lesson-use-example"]');
    await expect(page.locator('#code-lang')).toHaveValue('python');
    await expect(page.locator('.monaco-editor')).toContainText('lesson_step');

    // The user explicitly starts the run; Pyodide (~10 MB) downloads on first use.
    await page.click('[data-testid="run-btn"]');
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute(
      'data-step-id',
      'init',
      { timeout: 120_000 },
    );
    await page.click('[data-testid="workspace-tab-state"]');
    await expect(page.locator('[data-testid="variables-watch"]')).toContainText('target');

    // Lesson → timeline: a `found` stage exists only in the real trace.
    await page.click('[data-testid="workspace-tab-lesson"]');
    await page.click('[data-testid="lesson-step-found"]');
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'found');
    await expect(page.locator('.algolens-active-line').first()).toBeVisible();

    // The example runs a second search that misses, so `missing` closes the trace.
    const last = await page.locator('[data-testid="scrub"]').evaluate((el) => (el as HTMLInputElement).max);
    await page.locator('[data-testid="scrub"]').fill(String(last));
    await expect(page.locator('[data-testid="lesson-active-step"]')).toHaveAttribute('data-step-id', 'missing');
  });
});
