/**
 * Pack path policy.
 *
 * ZIP path safety is a security boundary, so the rules are stated once and
 * reused by the manifest parser, the archive checker, the extractor and the
 * authoring CLI. A path is accepted only if it is an **exact** match for one of
 * the allowed shapes: there is no "anything else" bucket.
 */
import { PACK_LIMITS } from './types';

export type PackFileKind = 'manifest' | 'license' | 'readme' | 'lesson' | 'example';

const LESSON_PATH = /^lessons\/([a-z0-9][a-z0-9-]*)\/(?:[a-z0-9][a-z0-9-]*)\.json$/;
const LESSON_FLAT = /^lessons\/([a-z0-9][a-z0-9-]*)\.json$/;
const EXAMPLE_PATH = /^examples\/([a-z0-9][a-z0-9-]*)\/(?:[a-z0-9][a-z0-9-]*)\.py$/;
const EXAMPLE_FLAT = /^examples\/([a-z0-9][a-z0-9-]*)\.py$/;

const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

/** Reasons a path is rejected; kept explicit so errors stay explainable. */
export function classifyPath(path: string): PackFileKind | null {
  if (path === 'manifest.json') return 'manifest';
  if (path === 'LICENSE') return 'license';
  if (path === 'README.md') return 'readme';
  if (LESSON_FLAT.test(path) || LESSON_PATH.test(path)) return 'lesson';
  if (EXAMPLE_FLAT.test(path) || EXAMPLE_PATH.test(path)) return 'example';
  return null;
}

export interface PathCheck {
  ok: boolean;
  /** Set when the path is structurally unsafe (traversal / absolute / control). */
  unsafe: boolean;
  /** Set when the path is merely too long. */
  tooLong: boolean;
  kind: PackFileKind | null;
}

/**
 * Structural safety first, allow-list second.
 *
 * Rejected: empty, leading `/` or `\`, drive letters, any `..` segment, `./`,
 * backslashes, control characters, `//`, trailing slash, non-ASCII, and
 * anything longer than `PACK_LIMITS.pathLength`.
 */
export function checkPath(rawPath: string): PathCheck {
  const path = rawPath;
  const unsafe =
    path.length === 0 ||
    path.startsWith('/') ||
    path.startsWith('\\') ||
    /^[A-Za-z]:/.test(path) ||
    path.includes('\\') ||
    path.includes('//') ||
    path.endsWith('/') ||
    CONTROL_CHARS.test(path) ||
    // eslint-disable-next-line no-control-regex
    path.split('/').some((segment) => segment === '..' || segment === '.' || segment === '') ||
    !/^[\x20-\x7e]+$/.test(path);

  if (unsafe) return { ok: false, unsafe: true, tooLong: false, kind: null };
  if (path.length > PACK_LIMITS.pathLength) {
    return { ok: false, unsafe: false, tooLong: true, kind: null };
  }
  const kind = classifyPath(path);
  return { ok: kind !== null, unsafe: false, tooLong: false, kind };
}

/** True when a path is safe AND of a supported pack file type. */
export function isAllowedPackPath(path: string): boolean {
  return checkPath(path).ok;
}

/** Case-insensitive identity used to detect "same file twice in one ZIP". */
export function pathIdentity(path: string): string {
  return path.toLowerCase();
}
