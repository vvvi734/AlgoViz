/**
 * Server configuration — every filesystem capability is opt-in and explicit.
 *
 * There is no "scan the user's disk" mode: pack/course files, session output and
 * context input each live in a directory the user names with a CLI flag or an
 * environment variable. When a directory is not configured the matching tool
 * says so instead of guessing a default.
 */
import { isAbsolute } from 'node:path';

export const CONFIG_FLAGS = {
  packDir: '--pack-dir',
  sessionDir: '--session-dir',
  contextDir: '--context-dir',
} as const;

export const CONFIG_ENV = {
  packDir: 'ALGOLENS_PACK_DIR',
  sessionDir: 'ALGOLENS_SESSION_DIR',
  contextDir: 'ALGOLENS_CONTEXT_DIR',
} as const;

export interface ConfiguredDir {
  /** Absolute path as configured. Existence is checked when a tool needs it. */
  path: string;
  /** Where the value came from — echoed back so the user can see it. */
  source: 'cli' | 'env';
}

export interface McpConfig {
  packDir: ConfiguredDir | null;
  sessionDir: ConfiguredDir | null;
  contextDir: ConfiguredDir | null;
  notes: string[];
}

export type ConfigParse = { ok: true; config: McpConfig } | { ok: false; errors: string[] };

/** `--name=value` or `--name value`; unknown flags are reported as notes. */
function readFlag(argv: readonly string[], flag: string): string | undefined {
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === flag) {
      const next = argv[index + 1];
      if (next && !next.startsWith('--')) return next;
      return '';
    }
    if (arg.startsWith(`${flag}=`)) return arg.slice(flag.length + 1);
  }
  return undefined;
}

function pickDir(
  argv: readonly string[],
  env: NodeJS.ProcessEnv,
  flag: string,
  envName: string,
  label: string,
  errors: string[],
): ConfiguredDir | null {
  const fromFlag = readFlag(argv, flag);
  const fromEnv = env[envName];
  const raw = (fromFlag ?? fromEnv)?.trim();
  if (!raw) return null;
  if (!isAbsolute(raw)) {
    errors.push(`${label} must be an absolute path (got "${raw}")`);
    return null;
  }
  return { path: raw, source: fromFlag ? 'cli' : 'env' };
}

export function parseConfig(argv: readonly string[], env: NodeJS.ProcessEnv): ConfigParse {
  const errors: string[] = [];
  const notes: string[] = [];

  const packDir = pickDir(argv, env, CONFIG_FLAGS.packDir, CONFIG_ENV.packDir, 'pack directory', errors);
  const sessionDir = pickDir(argv, env, CONFIG_FLAGS.sessionDir, CONFIG_ENV.sessionDir, 'session directory', errors);
  const contextDir = pickDir(argv, env, CONFIG_FLAGS.contextDir, CONFIG_ENV.contextDir, 'context directory', errors);

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      notes.push('help requested');
      continue;
    }
    if (arg.startsWith('--')) {
      const name = arg.split('=')[0];
      if (![CONFIG_FLAGS.packDir, CONFIG_FLAGS.sessionDir, CONFIG_FLAGS.contextDir].includes(name as never)) {
        notes.push(`ignored unknown flag ${name}`);
      }
    }
  }

  if (!packDir) notes.push('no pack directory configured: list_available_packs returns built-in-only results');
  if (!sessionDir) notes.push('no session directory configured: create_learning_session is disabled');
  if (!contextDir) notes.push('no context directory configured: inspect_learning_context is disabled');

  if (errors.length) return { ok: false, errors };
  return { ok: true, config: { packDir, sessionDir, contextDir, notes } };
}

export const USAGE = [
  'AlgoLens MCP server (stdio).',
  '',
  'Usage: node dist/server.mjs [options]',
  '',
  'Options:',
  `  ${CONFIG_FLAGS.packDir} <abs dir>     directory with .algopack files to expose (env ${CONFIG_ENV.packDir})`,
  `  ${CONFIG_FLAGS.sessionDir} <abs dir>  directory where .algosession.json files may be written (env ${CONFIG_ENV.sessionDir})`,
  `  ${CONFIG_FLAGS.contextDir} <abs dir>  directory from which .algocontext.json files may be read (env ${CONFIG_ENV.contextDir})`,
  '  --help, -h                    print this help',
  '',
  'The server never reads outside these directories and never executes any pack content.',
].join('\n');
