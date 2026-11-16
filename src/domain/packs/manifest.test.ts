import { describe, expect, it } from 'vitest';
import { parseManifestText, packManifestSchema, toManifest } from './manifest';
import { manifestFixture } from '../../test/packs';

const parse = (overrides: Record<string, unknown>) =>
  parseManifestText(JSON.stringify(manifestFixture(overrides)));

describe('pack manifest schema', () => {
  it('accepts a well-formed manifest and keeps bilingual names', () => {
    const result = parse({});
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const manifest = toManifest(result.value);
    expect(manifest.packId).toBe('fixture-pack');
    expect(manifest.version).toBe('1.0.0');
    expect(manifest.name.zh.length).toBeGreaterThan(0);
    expect(manifest.name.en.length).toBeGreaterThan(0);
    expect(manifest.lessons).toEqual(['lessons/pack-course.json']);
  });

  it('rejects a manifest that is not JSON', () => {
    const result = parseManifestText('{ nope');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('manifest-json');
  });

  it('rejects a missing English name', () => {
    const result = parse({ name: { zh: '只有中文' } });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('manifest-invalid');
    expect(result.errors[0].params?.field).toContain('name');
  });

  it('rejects an invalid packId', () => {
    const parsed = packManifestSchema.safeParse(manifestFixture({ packId: 'Bad_ID' }));
    expect(parsed.success).toBe(false);
    const result = parse({ packId: 'Bad_ID' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('manifest-invalid');
  });

  it('rejects a non-SemVer version', () => {
    const result = parse({ version: 'v1' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('manifest-invalid');
  });

  it('rejects an unsupported format version', () => {
    const result = parse({ packFormatVersion: 2 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('format-version');
  });

  it('rejects a traversal lesson path', () => {
    const result = parse({ lessons: ['lessons/../../etc/passwd.json'] });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('unsafe-path');
  });

  it('rejects a lesson path outside lessons/', () => {
    const result = parse({ lessons: ['examples/lesson.json'] });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('unsupported-file');
  });

  it('rejects duplicated lesson declarations', () => {
    const result = parse({ lessons: ['lessons/pack-course.json', 'lessons/pack-course.json'] });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('lesson-duplicate');
  });

  it('rejects a non-Python example', () => {
    const result = parse({
      examples: [{ path: 'examples/run.js', lessonId: 'pack-course', language: 'python' }],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('unsupported-file');
  });

  it('rejects duplicate example paths', () => {
    const result = parse({
      examples: [
        { path: 'examples/a.py', lessonId: 'pack-course', language: 'python' },
        { path: 'examples/a.py', lessonId: 'pack-course', language: 'python' },
      ],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('duplicate-path');
  });
});
