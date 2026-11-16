/**
 * Build the MCP server into a single ES module (`dist/server.mjs`).
 *
 * Why bundle instead of `tsc` emit: the shared AlgoLens domain code uses
 * extensionless relative imports (Vite style), which Node's ESM loader cannot
 * resolve. Bundling keeps the sources shared — one validator, not two — while
 * still producing a file an MCP host can spawn directly.
 *
 * The SDK, zod and fflate stay *external*: they resolve at runtime from
 * `packages/mcp-server/node_modules`, so the version the protocol tests use is
 * the version the host runs.
 *
 * Paths are resolved from this file, not from the caller's cwd, so
 * `npm run mcp:build` works from the repository root as well as from the
 * package directory.
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
  logLevel: 'info',
  sourcemap: false,
  external: [
    '@modelcontextprotocol/sdk',
    '@modelcontextprotocol/sdk/*',
    'fflate',
    'zod',
    'zod/*',
  ],
  banner: { js: '#!/usr/bin/env node' },
});
