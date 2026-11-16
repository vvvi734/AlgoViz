/**
 * Bounded, containment-checked filesystem access.
 *
 * Rules enforced here (not in the tools, so they cannot drift apart):
 *  - a file name is a *name*, never a path: separators, `..` and absolute forms
 *    are rejected before touching the disk;
 *  - the resolved path must stay inside the configured directory (realpath of
 *    the directory included, so `../` and `..%2f`-style tricks fail);
 *  - symlinks are refused outright — we never follow a link out of the sandbox;
 *  - size limits are checked from `stat` before any read;
 *  - writing never overwrites an existing file (unique-name retry instead).
 */
import {
  closeSync,
  lstatSync,
  openSync,
  readdirSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve, sep } from 'node:path';

export type FsCode =
  | 'not-configured'
  | 'not-a-directory'
  | 'unsafe-name'
  | 'escaped-directory'
  | 'symlink'
  | 'not-a-file'
  | 'too-large'
  | 'read-failed'
  | 'write-failed'
  | 'no-free-name';

export interface FsIssue {
  code: FsCode;
  message: string;
  /** Directory or file the issue refers to (already user-visible). */
  target?: string;
}

export type FsResult<T> = { ok: true; value: T } | { ok: false; issue: FsIssue };

const NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,159}$/;

export function isSafeEntryName(name: string): boolean {
  return NAME_PATTERN.test(name) && !name.includes('..');
}

function fail(code: FsCode, message: string, target?: string): { ok: false; issue: FsIssue } {
  return { ok: false, issue: { code, message, ...(target ? { target } : {}) } };
}

/** Resolve a directory, mapping every fs error to a structured issue. */
export function resolveDirectory(directory: string): FsResult<string> {
  let real: string;
  try {
    real = realpathSync(directory);
  } catch {
    return {
      ok: false,
      issue: {
        code: 'not-a-directory',
        message: `Directory is not accessible: ${directory}`,
        target: directory,
      },
    };
  }
  try {
    if (!statSync(real).isDirectory()) {
      return fail('not-a-directory', `Not a directory: ${directory}`, directory);
    }
  } catch {
    return fail('not-a-directory', `Not a directory: ${directory}`, directory);
  }
  return { ok: true, value: real };
}

/** Directory entries that are regular files with the requested suffix. */
export function listRegularFiles(directory: string, suffix: string): FsResult<Array<{ name: string; size: number }>> {
  const dir = resolveDirectory(directory);
  if (!dir.ok) return dir;
  let names: string[];
  try {
    names = readdirSync(dir.value);
  } catch {
    return fail('read-failed', `Cannot list ${directory}`, directory);
  }
  const files: Array<{ name: string; size: number }> = [];
  for (const name of names.sort()) {
    if (!name.endsWith(suffix) || !isSafeEntryName(name)) continue;
    const absolute = join(dir.value, name);
    try {
      const info = lstatSync(absolute);
      // A symlinked pack/context is skipped, never followed.
      if (!info.isFile()) continue;
      files.push({ name, size: info.size });
    } catch {
      continue;
    }
  }
  return { ok: true, value: files };
}

/** Read a UTF-8 file that must live inside `directory`. */
export function readBoundedTextFile(
  directory: string,
  name: string,
  maxBytes: number,
): FsResult<{ path: string; text: string; bytes: number }> {
  if (!isSafeEntryName(name)) {
    return fail('unsafe-name', 'File name must not contain a path or "..": pass a bare file name.', name);
  }
  const dir = resolveDirectory(directory);
  if (!dir.ok) return dir;
  const target = resolve(dir.value, name);
  if (!target.startsWith(`${dir.value}${sep}`)) {
    return fail('escaped-directory', `Refused: ${name} resolves outside the configured directory.`, name);
  }

  let info;
  try {
    info = lstatSync(target);
  } catch {
    return fail('not-a-file', `File not found in the configured directory: ${name}`, name);
  }
  if (info.isSymbolicLink()) {
    return fail('symlink', `Refused: ${name} is a symbolic link.`, name);
  }
  if (!info.isFile()) {
    return fail('not-a-file', `Not a regular file: ${name}`, name);
  }
  if (info.size > maxBytes) {
    return fail('too-large', `File is larger than the ${maxBytes}-byte limit: ${name}`, name);
  }

  try {
    const text = readFileSync(target, 'utf8');
    return { ok: true, value: { path: target, text, bytes: info.size } };
  } catch {
    return fail('read-failed', `Cannot read ${name}`, name);
  }
}

/**
 * Write a new UTF-8 file inside `directory` without overwriting anything.
 * `baseName` is a bare name (e.g. `bubble-sort-basics.algosession.json`); on a
 * name collision a `-2`, `-3`… suffix is used instead of clobbering the file.
 */
export function writeNewTextFile(
  directory: string,
  baseName: string,
  text: string,
): FsResult<{ path: string; bytes: number }> {
  if (!isSafeEntryName(baseName)) {
    return fail('unsafe-name', 'Output file name must be a bare, safe name.', baseName);
  }
  const dir = resolveDirectory(directory);
  if (!dir.ok) return dir;

  const stem = baseName.replace(/\.algosession\.json$/, '');
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const name = attempt === 0 ? baseName : `${stem}-${attempt + 1}.algosession.json`;
    const target = resolve(dir.value, name);
    if (!target.startsWith(`${dir.value}${sep}`)) {
      return fail('escaped-directory', `Refused: ${name} resolves outside the configured directory.`, name);
    }
    let handle: number | null = null;
    try {
      // `wx` = exclusive: an existing file is never truncated, let alone replaced.
      handle = openSync(target, 'wx', 0o600);
      closeSync(handle);
      handle = null;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === 'EEXIST') continue;
      return fail('write-failed', `Cannot write ${name}: ${code ?? 'unknown error'}`, name);
    }
    try {
      writeFileSync(target, text, { encoding: 'utf8', flag: 'w' });
      return { ok: true, value: { path: target, bytes: Buffer.byteLength(text, 'utf8') } };
    } catch {
      return fail('write-failed', `Cannot write ${name}`, name);
    }
  }
  return fail('no-free-name', 'Too many existing session files with that name; pick another session name.', baseName);
}
