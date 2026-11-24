import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Local development and generic static hosting use a relative base. GitHub
// Pages supplies an absolute project prefix through VITE_BASE_PATH so the
// same source can be deployed under /<repository>/ without a second config.
const base = process.env.VITE_BASE_PATH ?? './';

export default defineConfig({
  base,
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
    testTimeout: 20_000,
    restoreMocks: true,
  },
});
