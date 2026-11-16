import { defineConfig } from '@playwright/test';

/**
 * Browser E2E. Uses the locally installed Microsoft Edge (channel `msedge`) so
 * CI-free, sandbox-free runs need no browser download. The `dist/` build is
 * served by `vite preview`; Pyodide is fetched from jsdelivr at runtime.
 *
 * `--disable-quic` is a transport workaround, not a test relaxation: on some
 * networks Edge negotiates HTTP/3 with jsdelivr and the 10 MB `pyodide.asm.wasm`
 * body is aborted mid-flight (`net::ERR_QUIC_PROTOCOL_ERROR`), which starves
 * Pyodide past its 30 s boot budget. Forcing HTTP/2 keeps the real download.
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
    launchOptions: { args: ['--disable-quic'] },
  },
  webServer: {
    command: 'node node_modules/vite/bin/vite.js preview --port 4173 --strictPort --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
