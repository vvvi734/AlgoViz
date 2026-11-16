/**
 * stdio smoke test: spawn the *built* `dist/server.mjs` as a real child process
 * and drive it with the official MCP client over stdin/stdout.
 *
 * This is the only test that exercises the shipping artefact (bundled file,
 * real transport, real process boundary). The vitest suite covers the same
 * handlers in-process via InMemoryTransport.
 *
 * Usage:
 *   node scripts/smoke.mjs [--context-dir <abs dir>] [--require-context]
 *
 * With `--context-dir` the script also reads a real `.algocontext.json` (the one
 * the browser exported in e2e/session.spec.ts). Without it, that step is
 * reported as SKIPPED — never as passed.
 */
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(here, '..');
const repoRoot = resolve(packageRoot, '..', '..');
const entry = join(packageRoot, 'dist', 'server.mjs');
const packDir = join(repoRoot, 'packs');

const argv = process.argv.slice(2);
const contextDir = argv.includes('--context-dir') ? resolve(argv[argv.indexOf('--context-dir') + 1]) : null;
const contextFile = argv.includes('--context-file')
  ? argv[argv.indexOf('--context-file') + 1]
  : 'frame.algocontext.json';
const requireContext = argv.includes('--require-context');

if (!existsSync(entry)) {
  console.error('[smoke] dist/server.mjs is missing — run `npm run mcp:build` first.');
  process.exit(1);
}

const sessionDir = mkdtempSync(join(tmpdir(), 'algolens-smoke-session-'));
const checks = [];
let skippedContext = false;

function ok(label, detail = '') {
  checks.push({ label, detail });
  console.log(`  PASS  ${label}${detail ? ` — ${detail}` : ''}`);
}

function payloadOf(result) {
  const first = result.content?.[0];
  assert.equal(first?.type, 'text', 'tool result must be JSON text');
  return JSON.parse(first.text);
}

const serverArgs = [entry, '--pack-dir', packDir, '--session-dir', sessionDir];
if (contextDir) serverArgs.push('--context-dir', contextDir);

const transport = new StdioClientTransport({
  command: process.execPath,
  args: serverArgs,
  env: { ...process.env, NODE_ENV: 'test' },
  stderr: 'pipe',
});

const client = new Client({ name: 'algolens-smoke', version: '1.0.0' });

try {
  await client.connect(transport);
  ok('stdio handshake', 'initialize + initialized over stdin/stdout');

  const tools = await client.listTools();
  assert.deepEqual(
    tools.tools.map((tool) => tool.name).sort(),
    [
      'create_learning_session',
      'get_lesson',
      'get_lesson_step',
      'inspect_learning_context',
      'list_available_packs',
      'list_lessons',
    ],
  );
  ok('tool discovery', `${tools.tools.length} tools`);

  const prompts = await client.listPrompts();
  assert.deepEqual(prompts.prompts.map((prompt) => prompt.name), ['teach_algorithm']);
  ok('prompt discovery', 'teach_algorithm');

  const lessons = payloadOf(await client.callTool({ name: 'list_lessons', arguments: {} }));
  const ids = lessons.lessons.map((lesson) => lesson.lessonId);
  assert.ok(ids.includes('bubble-sort-basics'), 'built-in bubble course must be listed');
  assert.ok(ids.includes('binary-search-basics'), 'pack course must be listed when --pack-dir is set');
  ok('list_lessons', `${lessons.count} courses (built-in + pack)`);

  const lesson = payloadOf(
    await client.callTool({ name: 'get_lesson', arguments: { lessonId: 'binary-search-basics', locale: 'en' } }),
  );
  assert.equal(lesson.steps.length, 5);
  ok('get_lesson', `${lesson.lessonId} · ${lesson.steps.length} steps`);

  const step = payloadOf(
    await client.callTool({
      name: 'get_lesson_step',
      arguments: { lessonId: 'binary-search-basics', stepId: 'compare', locale: 'zh' },
    }),
  );
  assert.equal(step.stepId, 'compare');
  ok('get_lesson_step', 'compare in zh');

  const packs = payloadOf(await client.callTool({ name: 'list_available_packs', arguments: {} }));
  assert.equal(packs.configured, true);
  assert.equal(packs.browserIndexedDbVisible, false);
  ok('list_available_packs', `${packs.count} pack(s), IndexedDB explicitly invisible`);

  const session = payloadOf(
    await client.callTool({
      name: 'create_learning_session',
      arguments: { lessonId: 'binary-search-basics', includePythonExample: true, selectedStepId: 'narrow' },
    }),
  );
  assert.equal(session.created, true);
  assert.equal(session.executed, false);
  const file = readFileSync(session.file, 'utf8');
  assert.ok(file.includes('"sessionFormatVersion": 1'));
  assert.ok(!file.includes('API_KEY'));
  ok('create_learning_session', `${session.filename} (${session.bytes} B, executed=false)`);

  if (contextDir) {
    const context = payloadOf(
      await client.callTool({ name: 'inspect_learning_context', arguments: { file: contextFile } }),
    );
    assert.ok(context.frame.message.length > 0);
    ok(
      'inspect_learning_context',
      `${contextFile} · frame ${context.stepIndex + 1}/${context.totalEvents} · step ${
        context.teaching?.lessonStepId ?? 'none'
      } · source ${context.sourceIncluded ? 'included' : 'omitted'}`,
    );
    if (requireContext) {
      assert.ok(context.teaching?.lessonStepId, 'a required context must carry a teaching stage');
      assert.ok(context.stepIndex < context.totalEvents, 'a required context must point inside the trace');
    }
  } else {
    skippedContext = true;
    console.log('  SKIP  inspect_learning_context — no --context-dir given (run after the E2E export)');
  }

} finally {
  await client.close();
}

// Piped stderr ends only once the child exits, so it is read after the
// connection is closed rather than inside the assertions.
const stderrText = transport.stderr ? String(await readStderr(transport.stderr)) : '';
assert.ok(stderrText.includes('ready on stdio'), 'server must report readiness on stderr');
ok('stderr diagnostics', 'server logs went to stderr, stdout stayed protocol-only');

rmSync(sessionDir, { recursive: true, force: true });

console.log(`\n[smoke] ${checks.length} checks passed${skippedContext ? ', 1 skipped' : ''}`);
if (skippedContext && requireContext) {
  console.error('[smoke] --require-context was passed but no --context-dir was given.');
  process.exit(1);
}
process.exit(0);

/** Collect piped stderr without racing the child's exit. */
async function readStderr(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}
