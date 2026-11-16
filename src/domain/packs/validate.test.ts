import { describe, expect, it } from 'vitest';
import { algorithmIds } from '../algorithms/examples';
import { builtinCourseAlgorithms } from '../lessons/catalog';
import { lessonFixture, manifestFixture, packFileSet } from '../../test/packs';
import { validatePack, type ValidatePackInput } from './validate';

const baseInput = (files: Record<string, string>, overrides: Partial<ValidatePackInput> = {}): ValidatePackInput => ({
  files: new Map(Object.entries(files)),
  bytes: Object.values(files).join('').length,
  traceSchemaVersion: 1,
  catalogIds: algorithmIds(),
  builtinAlgorithmIds: builtinCourseAlgorithms(),
  installed: [],
  ...overrides,
});

const run = (files: Record<string, string>, overrides: Partial<ValidatePackInput> = {}) =>
  validatePack(baseInput(files, overrides));

describe('pack content validation', () => {
  it('accepts a valid pack and builds the preview', () => {
    const result = run(packFileSet());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const preview = result.value;
    expect(preview.manifest.packId).toBe('fixture-pack');
    expect(preview.lessons).toHaveLength(1);
    expect(preview.lessons[0].algorithmId).toBe('binary');
    expect(preview.examples).toHaveLength(1);
    expect(preview.examples[0].lessonId).toBe('pack-course');
    expect(preview.totals.lessonCount).toBe(1);
    expect(preview.replaces).toBeNull();
  });

  it('rejects a pack without manifest.json', () => {
    const files = packFileSet();
    delete files['manifest.json'];
    const result = run(files);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('missing-manifest');
  });

  it('rejects a pack without a non-empty LICENSE', () => {
    const result = run(packFileSet({ license: '   \n' }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('missing-license');
  });

  it('rejects an incompatible Trace Schema', () => {
    const result = run(packFileSet({ manifest: manifestFixture({ requiredTraceSchema: 2 }) }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('trace-schema');
    expect(result.errors[0].params?.required).toBe('2');
  });

  it('refuses to override a built-in course', () => {
    const lesson = lessonFixture({ algorithmId: 'bubble', lessonId: 'rogue-bubble' });
    const result = run(
      packFileSet({
        lesson,
        manifest: manifestFixture({ lessons: ['lessons/pack-course.json'] }),
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('algorithm-builtin-conflict');
    expect(result.errors[0].params?.algorithm).toBe('bubble');
  });

  it('rejects a lesson for an algorithm that does not exist', () => {
    const result = run(packFileSet({ lesson: lessonFixture({ algorithmId: 'quantum-sort' }) }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('algorithm-unknown');
  });

  it('rejects two courses for the same algorithm inside one pack', () => {
    const files = packFileSet();
    const second = lessonFixture({ lessonId: 'pack-course-2', algorithmId: 'binary' });
    files['lessons/second.json'] = JSON.stringify(second);
    const manifest = manifestFixture({ lessons: ['lessons/pack-course.json', 'lessons/second.json'] });
    const result = run({ ...files, 'manifest.json': JSON.stringify(manifest) });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('algorithm-pack-conflict');
  });

  it('rejects duplicate lesson ids', () => {
    const files = packFileSet({ lesson: lessonFixture({ algorithmId: 'linear', lessonId: 'pack-course' }) });
    const duplicated = { ...files, 'lessons/second.json': files['lessons/pack-course.json'] };
    const manifest = manifestFixture({ lessons: ['lessons/pack-course.json', 'lessons/second.json'] });
    const result = run({ ...duplicated, 'manifest.json': JSON.stringify(manifest) });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((error) => error.code === 'lesson-duplicate')).toBe(true);
  });

  it('rejects a declared lesson file that is absent', () => {
    const files = packFileSet();
    delete files['lessons/pack-course.json'];
    const result = run(files);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('missing-lesson-file');
  });

  it('rejects a lesson file that is not valid JSON', () => {
    const files = packFileSet();
    files['lessons/pack-course.json'] = '{ broken';
    const result = run(files);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('lesson-json');
  });

  it('rejects a lesson that fails the existing Lesson schema', () => {
    const lesson = lessonFixture();
    // Drop a required bilingual list.
    delete (lesson as Partial<typeof lesson>).commonMistakes;
    const result = run(packFileSet({ lesson }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('lesson-invalid');
  });

  it('rejects a missing example file and an example pointing at an unknown lesson', () => {
    const files = packFileSet();
    delete files['examples/pack-course.py'];
    const missing = run(files);
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.errors[0].code).toBe('example-missing');

    const wrongLesson = run(
      packFileSet({
        manifest: manifestFixture({
          examples: [{ path: 'examples/pack-course.py', lessonId: 'nope', language: 'python' }],
        }),
      }),
    );
    expect(wrongLesson.ok).toBe(false);
    if (!wrongLesson.ok) expect(wrongLesson.errors[0].code).toBe('example-invalid');
  });

  it('rejects an example whose lesson is claimed by another installed pack', () => {
    const result = run(packFileSet(), {
      installed: [{ packId: 'other-pack', version: '1.0.0', algorithmIds: ['binary'] }],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('algorithm-pack-conflict');
    expect(result.errors[0].params?.pack).toBe('other-pack');
  });

  it('refuses a duplicate install of the same version', () => {
    const result = run(packFileSet(), {
      installed: [{ packId: 'fixture-pack', version: '1.0.0', algorithmIds: [] }],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe('already-installed');
  });

  it('marks an older installed version as a replacement', () => {
    const result = run(packFileSet(), {
      installed: [{ packId: 'fixture-pack', version: '0.9.0', algorithmIds: ['binary'] }],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.replaces).toEqual({ version: '0.9.0' });
  });

  it('accepts a lesson for an algorithm without a built-in course', () => {
    const result = run(packFileSet({ lesson: lessonFixture({ algorithmId: 'linear' }) }));
    expect(result.ok).toBe(true);
  });
});
