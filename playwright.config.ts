import { defineConfig } from '@playwright/test';

/**
 * Browser E2E. Uses the locally installed Microsoft Edge (channel `msedge`) so
 * CI-free, sandbox-free runs need no browser download. The `dist/` build is
 * served by `vite preview`. Product code loads Pyodide from jsDelivr; every E2E
 * spec routes that URL to the local `pyodide@0.27.7` package via `fixtures.ts`,
 * so the Worker and Python execution stay real even when the CDN is blocked.
 *
 * Stage 6A adds a second web server: the real local AI Gateway, launched from
 * TypeScript with vite-node so E2E does not depend on a prior `ai:build`.
 * `ALGOLENS_AI_MOCK=1` registers the deterministic provider only. This is a
 * fixture, not a real Ollama/cloud test.
 *
 * `--disable-quic` is a transport workaround, not a test relaxation: on some
 * networks Edge negotiates HTTP/3 with jsdelivr and the 10 MB `pyodide.asm.wasm`
 * body is aborted mid-flight (`net::ERR_QUIC_PROTOCOL_ERROR`), which starves
 * Pyodide past its 30 s boot budget. Forcing HTTP/2 keeps the real download.
 */
/**
 * Preview port. Overridable so two parallel git worktrees (e.g. UI-01 next to
 * the Dijkstra branch) can run E2E without adopting each other's `vite preview`
 * server through `reuseExistingServer`.
 */
const PREVIEW_PORT = Number(process.env.PLAYWRIGHT_PORT ?? 4173);
const PREVIEW_URL = `http://127.0.0.1:${PREVIEW_PORT}`;

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: PREVIEW_URL,
    channel: 'msedge',
    headless: true,
    viewport: { width: 1280, height: 900 },
    actionTimeout: 20_000,
    launchOptions: { args: ['--disable-quic'] },
  },
  webServer: [
    {
      command: `node node_modules/vite/bin/vite.js preview --port ${PREVIEW_PORT} --strictPort --host 127.0.0.1`,
      url: PREVIEW_URL,
      // Never attach to a server started by another checkout: it would serve a
      // different build (and therefore different DOM) than the one under test.
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: 'node node_modules/vite-node/vite-node.mjs packages/ai-gateway/src/main.ts',
      url: 'http://127.0.0.1:8787/api/health',
      reuseExistingServer: true,
      timeout: 60_000,
      env: {
        ALGOLENS_AI_MOCK: '1',
        ALGOLENS_AI_PORT: '8787',
        ALGOLENS_AI_RATE_LIMIT: '200',
        // Follow the isolated preview port: the Gateway's default allow-list
        // only knows 5173/4173, so a custom port must be declared explicitly.
        ALGOLENS_AI_ORIGINS: `${PREVIEW_URL},http://localhost:${PREVIEW_PORT}`,
      },
    },
  ],
});
