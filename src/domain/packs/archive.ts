/**
 * ZIP entry policy — pure metadata checks.
 *
 * Runs on the *declared* central-directory values before any byte is inflated,
 * then again (against real output sizes) while extracting. Declared sizes are
 * attacker-controlled, which is exactly why the extractor never trusts them.
 */
import { fail, type PackResult } from './errors';
import { checkPath, pathIdentity } from './paths';
import { PACK_LIMITS } from './types';

export interface ZipEntryMeta {
  /** Path exactly as stored in the ZIP (UTF-8). */
  name: string;
  compressedSize: number;
  uncompressedSize: number;
  /** 0 = stored, 8 = deflate. Anything else is refused. */
  method: number;
  /** General-purpose flag bit 0 — encrypted entries are refused. */
  encrypted: boolean;
}

export interface ArchiveStats {
  entries: number;
  declaredBytes: number;
  compressedBytes: number;
}

/**
 * Validate the whole entry list.
 *
 * Order matters: structural checks (count, sizes, paths) come before the
 * allow-list, so an archive with a traversal path is reported as unsafe rather
 * than "unsupported file".
 */
export function checkArchiveEntries(entries: readonly ZipEntryMeta[]): PackResult<ArchiveStats> {
  if (entries.length === 0) return fail('empty-archive');
  if (entries.length > PACK_LIMITS.entries) {
    return fail('too-many-entries', { limit: String(PACK_LIMITS.entries), count: String(entries.length) });
  }

  const identities = new Set<string>();
  let declaredBytes = 0;
  let compressedBytes = 0;

  for (const entry of entries) {
    const path = checkPath(entry.name);
    if (path.unsafe) return fail('unsafe-path', { path: entry.name });
    if (!path.ok && path.tooLong) return fail('path-too-long', { path: entry.name });
    if (path.kind === null) return fail('unsupported-file', { path: entry.name });

    if (entry.encrypted) return fail('encrypted-entry', { path: entry.name });
    if (entry.method !== 0 && entry.method !== 8) return fail('unsupported-method', { path: entry.name });

    const identity = pathIdentity(entry.name);
    if (identities.has(identity)) return fail('duplicate-path', { path: entry.name });
    identities.add(identity);

    if (entry.uncompressedSize < 0 || entry.compressedSize < 0) {
      return fail('not-a-zip');
    }
    if (entry.uncompressedSize > PACK_LIMITS.fileBytes) {
      return fail('file-too-large', { path: entry.name, limit: String(PACK_LIMITS.fileBytes) });
    }
    // A stored 0-byte entry is only legal for LICENSE/README placeholders; we
    // still allow it here and let the licence check reject empty LICENSE text.
    if (entry.compressedSize > 0 && entry.uncompressedSize / Math.max(1, entry.compressedSize) > PACK_LIMITS.compressionRatio) {
      return fail('compression-ratio', { path: entry.name, limit: String(PACK_LIMITS.compressionRatio) });
    }

    declaredBytes += entry.uncompressedSize;
    compressedBytes += entry.compressedSize;
    if (declaredBytes > PACK_LIMITS.totalBytes) {
      return fail('total-too-large', { limit: String(PACK_LIMITS.totalBytes) });
    }
  }

  if (!identities.has('manifest.json')) return fail('missing-manifest');

  return { ok: true, value: { entries: entries.length, declaredBytes, compressedBytes } };
}
