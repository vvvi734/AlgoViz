import { describe, expect, it } from 'vitest';
import { zipSync } from 'fflate';
import { readPackArchive } from './zip';
import { packFileSet, zipOf } from '../../test/packs';

/** Patch the declared uncompressed size of one central-directory entry. */
function patchDeclaredSize(bytes: Uint8Array, name: string, delta: number): Uint8Array {
  const copy = new Uint8Array(bytes);
  const view = new DataView(copy.buffer);
  const decoder = new TextDecoder();
  for (let offset = 0; offset + 46 <= copy.length; offset += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) continue;
    const nameLength = view.getUint16(offset + 28, true);
    const entryName = decoder.decode(copy.subarray(offset + 46, offset + 46 + nameLength));
    if (entryName !== name) continue;
    view.setUint32(offset + 24, view.getUint32(offset + 24, true) + delta, true);
    return copy;
  }
  throw new Error(`central entry not found: ${name}`);
}

describe('bounded ZIP reader', () => {
  it('reads a valid pack and returns decoded UTF-8 text', () => {
    const result = readPackArchive(zipOf(packFileSet()));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect([...result.value.files.keys()].sort()).toEqual([
      'LICENSE',
      'examples/pack-course.py',
      'lessons/pack-course.json',
      'manifest.json',
    ]);
    expect(result.value.files.get('manifest.json')).toContain('fixture-pack');
    expect(result.value.bytes).toBeGreaterThan(0);
    expect(result.value.entries).toHaveLength(4);
  });

  it('rejects bytes that are not a ZIP', () => {
    const result = readPackArchive(new TextEncoder().encode('definitely not a zip archive'));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('not-a-zip');
  });

  it('rejects an empty archive', () => {
    const result = readPackArchive(zipSync({}));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('empty-archive');
  });

  it('rejects path traversal and absolute paths inside the ZIP', () => {
    const traversal = readPackArchive(zipOf({ 'manifest.json': '{}', '../evil.json': '{}' }));
    expect(traversal.ok).toBe(false);
    if (!traversal.ok) expect(traversal.errors[0].code).toBe('unsafe-path');

    const absolute = readPackArchive(zipOf({ 'manifest.json': '{}', '/etc/passwd': 'root' }));
    expect(absolute.ok).toBe(false);
    if (!absolute.ok) expect(absolute.errors[0].code).toBe('unsafe-path');
  });

  it('rejects too many entries before inflating anything', () => {
    const files: Record<string, string> = { 'manifest.json': '{}' };
    for (let index = 0; index < 70; index += 1) files[`lessons/l-${index}.json`] = '{}';
    const result = readPackArchive(zipOf(files, 0));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('too-many-entries');
  });

  it('rejects a compression bomb via the declared ratio', () => {
    const padded = 'a'.repeat(300 * 1024);
    const result = readPackArchive(zipOf({ 'manifest.json': '{}', 'lessons/bomb.json': padded }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('compression-ratio');
  });

  it('rejects executable types and non-UTF-8 payloads', () => {
    const script = readPackArchive(zipOf({ 'manifest.json': '{}', 'run.js': 'alert(1)' }));
    expect(script.ok).toBe(false);
    if (!script.ok) expect(script.errors[0].code).toBe('unsupported-file');

    const binary = readPackArchive(
      zipSync({ 'manifest.json': new TextEncoder().encode('{}'), 'examples/bin.py': new Uint8Array([0xff, 0xfe, 0x00]) }),
    );
    expect(binary.ok).toBe(false);
    if (!binary.ok) expect(binary.errors[0].code).toBe('not-text');
  });

  it('refuses an entry that inflates to a different size than declared', () => {
    const patched = patchDeclaredSize(zipOf(packFileSet()), 'examples/pack-course.py', 1);
    const result = readPackArchive(patched);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('size-mismatch');
  });

  it('refuses an oversized archive before parsing', () => {
    const huge = new Uint8Array(7 * 1024 * 1024);
    const result = readPackArchive(huge);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('file-too-large');
  });
});
