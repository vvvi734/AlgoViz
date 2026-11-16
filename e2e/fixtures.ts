import { test as base, expect } from '@playwright/test';
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
export type { Page } from '@playwright/test';
