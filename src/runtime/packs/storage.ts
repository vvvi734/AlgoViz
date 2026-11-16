/**
 * IndexedDB persistence for installed packs (Stage 4).
 *
 * Three object stores share one database so install/uninstall/replace can run
 * inside a **single transaction**: either the pack record, its lessons and its
 * examples all land, or none do. There is no cloud sync — the browser owns the
 * data, and clearing site data removes packs (documented as a limitation).
 */
import type { Lesson } from '../../domain/lessons/types';
import type { PackErrorCode } from '../../domain/packs/errors';
import type { InstalledPack, PackExample, PackPreview } from '../../domain/packs/types';

const DB_NAME = 'algolens-packs';
const DB_VERSION = 1;
const STORE_PACKS = 'packs';
const STORE_LESSONS = 'lessons';
const STORE_EXAMPLES = 'examples';

interface PackRecord {
  packId: string;
  version: string;
  manifest: InstalledPack['manifest'];
  installedAt: number;
  lessonIds: string[];
}

interface LessonRecord {
  packId: string;
  lessonId: string;
  algorithmId: string;
  lesson: Lesson;
}

interface ExampleRecord {
  packId: string;
  lessonId: string;
  path: string;
  language: 'python';
  code: string;
  input?: unknown;
}

/** Storage failures surfaced as pack error codes (never raw DOMException). */
export class PackStorageError extends Error {
  constructor(readonly code: PackErrorCode) {
    super(code);
    this.name = 'PackStorageError';
  }
}

export interface PackStore {
  readonly kind: 'indexeddb' | 'unavailable';
  list(): Promise<InstalledPack[]>;
  /** Atomic install; `replace` must be explicitly confirmed by the user. */
  install(preview: PackPreview, options?: { replace?: boolean }): Promise<void>;
  uninstall(packId: string): Promise<void>;
  reset(): Promise<void>;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('indexeddb request failed'));
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new Error('indexeddb transaction aborted'));
    tx.onerror = () => reject(tx.error ?? new Error('indexeddb transaction failed'));
  });
}

function describe(error: unknown): PackStorageError {
  if (error instanceof PackStorageError) return error;
  const name = (error as { name?: string } | null)?.name ?? '';
  if (name === 'QuotaExceededError') return new PackStorageError('storage-quota');
  return new PackStorageError('storage-failed');
}

function openDatabase(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let open: IDBOpenDBRequest;
    try {
      open = factory.open(DB_NAME, DB_VERSION);
    } catch (error) {
      reject(describe(error));
      return;
    }
    open.onupgradeneeded = () => {
      const db = open.result;
      if (!db.objectStoreNames.contains(STORE_PACKS)) {
        db.createObjectStore(STORE_PACKS, { keyPath: 'packId' });
      }
      if (!db.objectStoreNames.contains(STORE_LESSONS)) {
        const lessons = db.createObjectStore(STORE_LESSONS, { keyPath: ['packId', 'lessonId'] });
        lessons.createIndex('by-pack', 'packId');
      }
      if (!db.objectStoreNames.contains(STORE_EXAMPLES)) {
        const examples = db.createObjectStore(STORE_EXAMPLES, { keyPath: ['packId', 'lessonId'] });
        examples.createIndex('by-pack', 'packId');
      }
    };
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(describe(open.error));
    open.onblocked = () => reject(new PackStorageError('storage-failed'));
  });
}

/** IndexedDB-backed store. Pass a factory to test with fake-indexeddb. */
export function createIndexedDbPackStore(factory?: IDBFactory | null): PackStore {
  const available = factory != null;
  if (!available) {
    return {
      kind: 'unavailable',
      list: async () => [],
      install: async () => {
        throw new PackStorageError('storage-unavailable');
      },
      uninstall: async () => {
        throw new PackStorageError('storage-unavailable');
      },
      reset: async () => {},
    };
  }

  let dbPromise: Promise<IDBDatabase> | null = null;
  const db = (): Promise<IDBDatabase> => {
    if (!dbPromise) dbPromise = openDatabase(factory as IDBFactory);
    return dbPromise;
  };

  const readPack = async (packId: string): Promise<PackRecord | undefined> => {
    const handle = await db();
    const tx = handle.transaction([STORE_PACKS], 'readonly');
    const record = await requestResult(tx.objectStore(STORE_PACKS).get(packId));
    return record as PackRecord | undefined;
  };

  const readLessons = async (packId: string): Promise<LessonRecord[]> => {
    const handle = await db();
    const tx = handle.transaction([STORE_LESSONS], 'readonly');
    const index = tx.objectStore(STORE_LESSONS).index('by-pack');
    const rows = await requestResult(index.getAll(packId));
    return rows as LessonRecord[];
  };

  const readExamples = async (packId: string): Promise<ExampleRecord[]> => {
    const handle = await db();
    const tx = handle.transaction([STORE_EXAMPLES], 'readonly');
    const index = tx.objectStore(STORE_EXAMPLES).index('by-pack');
    const rows = await requestResult(index.getAll(packId));
    return rows as ExampleRecord[];
  };

  return {
    kind: 'indexeddb',

    async list(): Promise<InstalledPack[]> {
      try {
        const handle = await db();
        const tx = handle.transaction([STORE_PACKS, STORE_LESSONS, STORE_EXAMPLES], 'readonly');
        // All requests are issued synchronously so the transaction stays active.
        const packRequest = tx.objectStore(STORE_PACKS).getAll();
        const lessonRequest = tx.objectStore(STORE_LESSONS).getAll();
        const exampleRequest = tx.objectStore(STORE_EXAMPLES).getAll();
        const [packRows, lessonRows, exampleRows] = await Promise.all([
          requestResult(packRequest),
          requestResult(lessonRequest),
          requestResult(exampleRequest),
        ]);
        const packs = packRows as PackRecord[];
        const lessons = lessonRows as LessonRecord[];
        const examples = exampleRows as ExampleRecord[];
        return packs
          .slice()
          .sort((a, b) => a.installedAt - b.installedAt)
          .map((pack) => ({
            manifest: pack.manifest,
            installedAt: pack.installedAt,
            lessons: lessons.filter((row) => row.packId === pack.packId).map((row) => row.lesson),
            examples: examples
              .filter((row) => row.packId === pack.packId)
              .map<PackExample>((row) => ({
                lessonId: row.lessonId,
                path: row.path,
                language: row.language,
                code: row.code,
                ...(row.input === undefined ? {} : { input: row.input }),
              })),
          }));
      } catch (error) {
        throw describe(error);
      }
    },

    async install(preview: PackPreview, options: { replace?: boolean } = {}): Promise<void> {
      try {
        const existing = await readPack(preview.manifest.packId);
        if (existing && existing.version === preview.manifest.version) {
          throw new PackStorageError('already-installed');
        }
        if (existing && !options.replace) {
          throw new PackStorageError('version-conflict');
        }

        // Old rows are read *before* the write transaction; the write itself is
        // one synchronous burst so the transaction cannot auto-commit mid-way.
        const oldLessons = existing ? await readLessons(existing.packId) : [];

        const handle = await db();
        const record: PackRecord = {
          packId: preview.manifest.packId,
          version: preview.manifest.version,
          manifest: preview.manifest,
          installedAt: Date.now(),
          lessonIds: preview.lessons.map((lesson) => lesson.lessonId),
        };

        const tx = handle.transaction([STORE_PACKS, STORE_LESSONS, STORE_EXAMPLES], 'readwrite');
        const packs = tx.objectStore(STORE_PACKS);
        const lessons = tx.objectStore(STORE_LESSONS);
        const examples = tx.objectStore(STORE_EXAMPLES);

        for (const lesson of oldLessons) {
          lessons.delete([lesson.packId, lesson.lessonId]);
          examples.delete([lesson.packId, lesson.lessonId]);
        }
        for (const lesson of preview.lessons) {
          lessons.put({
            packId: record.packId,
            lessonId: lesson.lessonId,
            algorithmId: lesson.algorithmId,
            lesson,
          } satisfies LessonRecord);
        }
        for (const example of preview.examples) {
          examples.put({
            packId: record.packId,
            lessonId: example.lessonId,
            path: example.path,
            language: example.language,
            code: example.code,
            ...(example.input === undefined ? {} : { input: example.input }),
          } satisfies ExampleRecord);
        }
        packs.put(record);
        await transactionDone(tx);
      } catch (error) {
        throw describe(error);
      }
    },

    async uninstall(packId: string): Promise<void> {
      try {
        const existing = await readPack(packId);
        if (!existing) return;
        // Read everything that must be deleted BEFORE opening the write
        // transaction (awaiting inside it could deactivate it).
        const oldLessons = await readLessons(packId);
        const oldExamples = await readExamples(packId);
        const handle = await db();
        const tx = handle.transaction([STORE_PACKS, STORE_LESSONS, STORE_EXAMPLES], 'readwrite');
        for (const lesson of oldLessons) {
          tx.objectStore(STORE_LESSONS).delete([packId, lesson.lessonId]);
          tx.objectStore(STORE_EXAMPLES).delete([packId, lesson.lessonId]);
        }
        // Drop any example rows whose lesson was not recorded (defensive).
        for (const row of oldExamples) {
          tx.objectStore(STORE_EXAMPLES).delete([packId, row.lessonId]);
        }
        tx.objectStore(STORE_PACKS).delete(packId);
        await transactionDone(tx);
      } catch (error) {
        throw describe(error);
      }
    },

    async reset(): Promise<void> {
      try {
        const handle = await db();
        const tx = handle.transaction([STORE_PACKS, STORE_LESSONS, STORE_EXAMPLES], 'readwrite');
        tx.objectStore(STORE_PACKS).clear();
        tx.objectStore(STORE_LESSONS).clear();
        tx.objectStore(STORE_EXAMPLES).clear();
        await transactionDone(tx);
      } catch (error) {
        throw describe(error);
      }
    },
  };
}

/** Resolve the environment's IndexedDB factory, or `null` when unavailable. */
export function browserPackStore(): PackStore {
  if (typeof indexedDB === 'undefined') return createIndexedDbPackStore(null);
  return createIndexedDbPackStore(indexedDB);
}
