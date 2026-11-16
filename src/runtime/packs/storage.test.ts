import { describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { algorithmIds } from '../../domain/algorithms/examples';
import { builtinCourseAlgorithms } from '../../domain/lessons/catalog';
import { describeErrors } from '../../domain/packs/errors';
import type { PackPreview } from '../../domain/packs/types';
import { validatePack } from '../../domain/packs/validate';
import { lessonFixture, manifestFixture, packFileSet } from '../../test/packs';
import { PackStorageError, createIndexedDbPackStore } from './storage';

function previewOf(
  overrides: { packId?: string; version?: string; algorithmId?: string; lessonId?: string } = {},
): PackPreview {
  const lessonId = overrides.lessonId ?? 'pack-course';
  const lesson = lessonFixture({
    lessonId,
    algorithmId: overrides.algorithmId ?? 'binary',
  });
  const manifest = manifestFixture({
    packId: overrides.packId ?? 'fixture-pack',
    version: overrides.version ?? '1.0.0',
    lessons: ['lessons/pack-course.json'],
    examples: [{ path: 'examples/pack-course.py', lessonId, language: 'python' }],
  });
  const files = packFileSet({ manifest, lesson });
  const validation = validatePack({
    files: new Map(Object.entries(files)),
    bytes: 1,
    traceSchemaVersion: 1,
    catalogIds: algorithmIds(),
    builtinAlgorithmIds: builtinCourseAlgorithms(),
    installed: [],
  });
  if (!validation.ok) throw new Error(describeErrors(validation.errors));
  return validation.value;
}

const newStore = () => createIndexedDbPackStore(new IDBFactory());

async function expectStorageError(promise: Promise<unknown>, code: string) {
  await expect(promise).rejects.toBeInstanceOf(PackStorageError);
  await expect(promise).rejects.toMatchObject({ code });
}

describe('IndexedDB pack store', () => {
  it('installs a pack and returns its lessons and example text', async () => {
    const store = newStore();
    await store.install(previewOf());

    const packs = await store.list();
    expect(packs).toHaveLength(1);
    expect(packs[0].manifest.packId).toBe('fixture-pack');
    expect(packs[0].lessons[0].lessonId).toBe('pack-course');
    expect(packs[0].examples[0].code).toContain('lesson_step');
    expect(packs[0].installedAt).toBeGreaterThan(0);
  });

  it('restores installs in a fresh store instance (page reload)', async () => {
    const factory = new IDBFactory();
    await createIndexedDbPackStore(factory).install(previewOf());

    const afterReload = await createIndexedDbPackStore(factory).list();
    expect(afterReload).toHaveLength(1);
    expect(afterReload[0].manifest.version).toBe('1.0.0');
    expect(afterReload[0].lessons).toHaveLength(1);
  });

  it('uninstalls only the requested pack', async () => {
    const store = newStore();
    await store.install(previewOf({ packId: 'pack-a', lessonId: 'course-a', algorithmId: 'binary' }));
    await store.install(previewOf({ packId: 'pack-b', lessonId: 'course-b', algorithmId: 'linear' }));

    await store.uninstall('pack-a');
    const packs = await store.list();
    expect(packs.map((pack) => pack.manifest.packId)).toEqual(['pack-b']);
    expect(packs[0].lessons.map((lesson) => lesson.lessonId)).toEqual(['course-b']);
  });

  it('refuses to install the same version twice', async () => {
    const store = newStore();
    await store.install(previewOf());
    await expectStorageError(store.install(previewOf()), 'already-installed');
  });

  it('requires explicit confirmation before replacing another version', async () => {
    const store = newStore();
    await store.install(previewOf({ version: '1.0.0' }));
    await expectStorageError(store.install(previewOf({ version: '2.0.0' })), 'version-conflict');

    await store.install(previewOf({ version: '2.0.0' }), { replace: true });
    const packs = await store.list();
    expect(packs[0].manifest.version).toBe('2.0.0');
    expect(packs[0].lessons).toHaveLength(1);
  });

  it('rolls back when the write transaction fails (atomic install)', async () => {
    const store = newStore();
    await store.install(previewOf({ version: '1.0.0' }));

    const broken = previewOf({ version: '2.0.0' });
    // A function cannot be structured-cloned, so `put` throws mid-transaction.
    const poisoned = JSON.parse(JSON.stringify(broken)) as PackPreview;
    (poisoned.lessons[0] as unknown as { steps: unknown }).steps = [
      { stepId: 'init', title: { zh: 'a', en: 'a' }, explanation: { zh: 'a', en: 'a' }, tip: () => 'x' },
    ];
    await expectStorageError(store.install(poisoned, { replace: true }), 'storage-failed');

    const packs = await store.list();
    expect(packs).toHaveLength(1);
    expect(packs[0].manifest.version).toBe('1.0.0');
  });

  it('maps a quota failure to the storage-quota code', async () => {
    const quotaFactory = {
      open: () => {
        const request = {
          result: {
            objectStoreNames: { contains: () => true },
            transaction: () => {
              throw new DOMException('quota', 'QuotaExceededError');
            },
          },
        } as unknown as IDBOpenDBRequest;
        setTimeout(() => request.onsuccess?.(new Event('success') as unknown as Event), 0);
        return request;
      },
    } as unknown as IDBFactory;

    await expectStorageError(createIndexedDbPackStore(quotaFactory).install(previewOf()), 'storage-quota');
  });

  it('reports the unavailable store instead of inventing a successful install', async () => {
    const store = createIndexedDbPackStore(null);
    expect(store.kind).toBe('unavailable');
    expect(await store.list()).toEqual([]);
    await expectStorageError(store.install(previewOf()), 'storage-unavailable');
  });

  it('clears everything with reset', async () => {
    const store = newStore();
    await store.install(previewOf());
    await store.reset();
    expect(await store.list()).toEqual([]);
  });
});
