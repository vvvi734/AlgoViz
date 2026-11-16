import { describe, expect, it } from 'vitest';
import { checkArchiveEntries, type ZipEntryMeta } from './archive';
import { PACK_LIMITS } from './types';

const entry = (overrides: Partial<ZipEntryMeta> = {}): ZipEntryMeta => ({
  name: 'manifest.json',
  compressedSize: 100,
  uncompressedSize: 200,
  method: 8,
  encrypted: false,
  ...overrides,
});

const ok = (entries: ZipEntryMeta[]) => checkArchiveEntries(entries);

describe('ZIP entry policy', () => {
  it('accepts a small, fully declared pack', () => {
    const result = ok([
      entry({ name: 'manifest.json', uncompressedSize: 300, compressedSize: 120 }),
      entry({ name: 'LICENSE', uncompressedSize: 1000, compressedSize: 400 }),
      entry({ name: 'lessons/a.json', uncompressedSize: 4000, compressedSize: 900 }),
      entry({ name: 'examples/a.py', uncompressedSize: 800, compressedSize: 300 }),
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.entries).toBe(4);
  });

  it('rejects an empty archive', () => {
    const result = ok([]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('empty-archive');
  });

  it('rejects too many entries', () => {
    const entries = Array.from({ length: PACK_LIMITS.entries + 1 }, (_, index) =>
      entry({ name: `lessons/l-${index}.json`, uncompressedSize: 10, compressedSize: 10 }),
    );
    const result = ok(entries);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('too-many-entries');
  });

  it('rejects an entry above the per-file limit', () => {
    const result = ok([entry({ uncompressedSize: PACK_LIMITS.fileBytes + 1 })]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('file-too-large');
  });

  it('rejects a total above the limit', () => {
    const big = PACK_LIMITS.fileBytes; // 512 KiB each
    const count = Math.ceil(PACK_LIMITS.totalBytes / big) + 1;
    const entries = Array.from({ length: count }, (_, index) =>
      entry({ name: `lessons/l-${index}.json`, uncompressedSize: big, compressedSize: big }),
    );
    const result = ok(entries);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(['total-too-large']).toContain(result.errors[0].code);
  });

  it('rejects a zip-bomb style expansion ratio', () => {
    const result = ok([entry({ name: 'lessons/a.json', compressedSize: 10, uncompressedSize: 500_000 })]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('compression-ratio');
  });

  it('rejects traversal, absolute and backslash paths', () => {
    for (const name of ['../evil.json', 'lessons/../../evil.json', '/etc/passwd', 'C:/windows/x.json', 'lessons\\win.json']) {
      const result = ok([entry({ name })]);
      expect(result.ok, name).toBe(false);
      if (result.ok) continue;
      expect(result.errors[0].code, name).toBe('unsafe-path');
    }
  });

  it('rejects over-long paths', () => {
    const result = ok([entry({ name: `lessons/${'a'.repeat(PACK_LIMITS.pathLength)}.json` })]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('path-too-long');
  });

  it('rejects duplicate names regardless of case', () => {
    const result = ok([
      entry({ name: 'manifest.json' }),
      entry({ name: 'MANIFEST.JSON' }),
    ]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(['duplicate-path', 'unsupported-file']).toContain(result.errors[0].code);
  });

  it('rejects executable and unknown file types', () => {
    for (const name of ['run.js', 'index.html', 'module.mjs', 'assets/logo.svg', 'lessons/x.txt']) {
      const result = ok([entry({ name }), entry({ name: 'manifest.json' })]);
      expect(result.ok, name).toBe(false);
      if (result.ok) continue;
      expect(result.errors[0].code, name).toBe('unsupported-file');
    }
  });

  it('rejects encrypted entries and unsupported compression methods', () => {
    const encrypted = ok([entry({ encrypted: true })]);
    expect(encrypted.ok).toBe(false);
    if (!encrypted.ok) expect(encrypted.errors[0].code).toBe('encrypted-entry');

    const method = ok([entry({ method: 12 })]);
    expect(method.ok).toBe(false);
    if (!method.ok) expect(method.errors[0].code).toBe('unsupported-method');
  });

  it('requires manifest.json', () => {
    const result = ok([entry({ name: 'LICENSE' })]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('missing-manifest');
  });
});
