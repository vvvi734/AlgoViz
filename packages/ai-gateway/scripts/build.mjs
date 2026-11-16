/**
 * Bundle the Gateway into one ESM file (`dist/server.mjs`).
 *
 * Same reasoning as the MCP server: shared AlgoLens domain code uses
 * extensionless relative imports, so bundling keeps one schema source while
 * producing a file `node dist/server.mjs` can run directly.
 */
import { build } from 'esbuild';
import { rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(here, '..');

await rm(join(packageRoot, 'dist'), { recursive: true, force: true });

await build({
  entryPoints: [join(packageRoot, 'src', 'main.ts')],
  outfile: join(packageRoot, 'dist', 'server.mjs'),
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  logLevel: 'warning',
  sourcemap: false,
  external: ['zod', 'zod/*'],
  banner: { js: '#!/usr/bin/env node' },
});
