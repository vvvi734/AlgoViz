/**
 * stdio entry point.
 *
 * stdout is reserved for the MCP protocol: every diagnostic goes to stderr, and
 * nothing is ever `console.log`ed. A host that starts this file as a subprocess
 * therefore sees a clean JSON-RPC stream.
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { parseConfig, USAGE } from './config';
import { createAlgoLensServer } from './server';

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stderr.write(`${USAGE}\n`);
    return;
  }

  const parsed = parseConfig(argv, process.env);
  if (!parsed.ok) {
    process.stderr.write(`[algolens-mcp] configuration error:\n${parsed.errors.map((line) => `  - ${line}`).join('\n')}\n`);
    process.exit(2);
  }

  for (const note of parsed.config.notes) {
    process.stderr.write(`[algolens-mcp] ${note}\n`);
  }
  for (const [label, dir] of [
    ['pack', parsed.config.packDir],
    ['session', parsed.config.sessionDir],
    ['context', parsed.config.contextDir],
  ] as const) {
    if (dir) process.stderr.write(`[algolens-mcp] ${label} directory: ${dir.path} (${dir.source})\n`);
  }

  const server = createAlgoLensServer(parsed.config);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('[algolens-mcp] ready on stdio\n');
}

main().catch((error: unknown) => {
  process.stderr.write(`[algolens-mcp] fatal: ${(error as Error).message}\n`);
  process.exit(1);
});
