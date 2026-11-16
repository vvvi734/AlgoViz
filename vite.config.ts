import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// `base: './'` keeps the build usable both at a domain root and under
// GitHub Pages project paths (/<repo>/). There is no client-side router yet.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Monaco ships as its own lazy chunk (~4 MB / ~1 MB gzip) that is only
    // fetched when the code editor first opens; raise the warning threshold so
    // the build log stays readable without hiding real regressions.
    chunkSizeWarningLimit: 5000,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // MCP protocol tests live in the isolated subpackage; they opt into the
    // node environment per file (`// @vitest-environment node`) and the shared
    // setup file no-ops when there is no DOM.
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'packages/mcp-server/src/**/*.test.ts'],
    // The MCP dependency tree is large; give protocol round-trips room to boot.
    testTimeout: 20_000,
    restoreMocks: true,
  },
});
