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
