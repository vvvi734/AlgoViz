import { existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import type { Page } from '@playwright/test';

const CDN_PREFIX = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
const LOCAL_ROOT = resolve(process.cwd(), 'node_modules/pyodide');

const CONTENT_TYPES: Record<string, string> = {
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.wasm': 'application/wasm',
  '.json': 'application/json; charset=utf-8',
  '.zip': 'application/zip',
};

/**
 * Serve the exact Pyodide 0.27.7 distribution from the local npm package.
 * The application still uses its normal CDN URL; tests only replace transport,
 * so the worker, interpreter and execution path remain real. This keeps E2E
 * deterministic when jsDelivr is slow or blocked, without mocking Trace.
 */
export async function useLocalPyodide(page: Page): Promise<void> {
  await page.context().route(`${CDN_PREFIX}**`, async (route) => {
    const url = new URL(route.request().url());
    const relative = url.pathname.slice(url.pathname.indexOf('/full/') + '/full/'.length);
    const file = join(LOCAL_ROOT, relative);
    if (relative.includes('..') || !existsSync(file)) {
      await route.continue();
      return;
    }
    await route.fulfill({
      path: file,
      contentType: CONTENT_TYPES[extname(file)] ?? 'application/octet-stream',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  });
}
