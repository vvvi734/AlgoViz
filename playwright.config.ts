import { defineConfig } from '@playwright/test';

/**
 * Browser E2E. Uses the locally installed Microsoft Edge (channel `msedge`) so
 * CI-free, sandbox-free runs need no browser download. The `dist/` build is
 * served by `vite preview`; Pyodide is fetched from jsdelivr at runtime.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    channel: 'msedge',
    headless: true,
    viewport: { width: 1280, height: 900 },
    actionTimeout: 20_000,
  },
  webServer: {
    command: 'node node_modules/vite/bin/vite.js preview --port 4173 --strictPort --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
