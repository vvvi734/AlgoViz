import { test as base, expect, type Page } from '@playwright/test';
import { useLocalPyodide } from './pyodide-local';

/**
 * Every browser test gets the real Pyodide 0.27.7 distribution from the local
 * npm package. The app's CDN URL is untouched; only the transport is local, so
 * workers, Python execution and Trace stay real even when jsDelivr is blocked.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await useLocalPyodide(page);
    await use(page);
  },
});

export { expect };
export type { Page };

/**
 * UI-03: the code dock is collapsed by default. Tests that need to read or
 * type into Monaco must explicitly open it first; playback must not change.
 */
export async function openCodePanel(page: Page) {
  const toggle = page.getByTestId('code-dock-toggle');
  await expect(toggle).toBeVisible({ timeout: 45_000 });
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') {
    await toggle.click();
  }
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 45_000 });
}

/**
 * UX-01 adds an expanded guide above the old workspace. Tests that measure the
 * pre-existing first-screen layout fold it first so they keep verifying the
 * two-column workspace and dock rather than the new guide height.
 */
export async function collapseAlgorithmGuide(page: Page) {
  const toggle = page.getByTestId('guide-toggle');
  if ((await toggle.count()) === 0) return;
  await expect(toggle).toBeVisible();
  if ((await toggle.getAttribute('aria-expanded')) === 'true') {
    await toggle.click();
  }
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByTestId('algorithm-guide')).toHaveCount(0);
}

/**
 * UX-02 folds the course step list by default so the rail stays short. Tests
 * that jump by step id open this disclosure first; the jump still uses the same
 * real trace frames and the same playback controller.
 */
export async function openLessonStepNav(page: Page) {
  const toggle = page.getByTestId('lesson-steps-toggle');
  await expect(toggle).toBeVisible({ timeout: 45_000 });
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') {
    await toggle.click();
  }
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
}
