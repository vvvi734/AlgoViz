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
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    restoreMocks: true,
  },
});
