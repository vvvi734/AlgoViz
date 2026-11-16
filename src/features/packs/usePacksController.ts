/**
 * Knowledge pack controller (Stage 4).
 *
 * Owns the whole lifecycle the UI drives: pick file → bounded ZIP read →
 * schema/policy validation → preview → explicit confirm → atomic IndexedDB
 * install → catalog refresh → uninstall. Nothing is executed from the pack; the
 * only side effect is local storage.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { algorithmIds } from '../../domain/algorithms/examples';
import {
  builtinCourseAlgorithms,
  createLessonCatalog,
  type LessonCatalog,
} from '../../domain/lessons/catalog';
import { packError, type PackError } from '../../domain/packs/errors';
import { PACK_LIMITS, type InstalledPack, type PackPreview } from '../../domain/packs/types';
import { validatePack } from '../../domain/packs/validate';
import { TRACE_SCHEMA_VERSION } from '../../domain/trace/schema';
import { PackStorageError, browserPackStore, type PackStore } from '../../runtime/packs/storage';
import { readPackArchive } from '../../runtime/packs/zip';

export type PacksResult =
  | { kind: 'installed' | 'uninstalled'; packName: { zh: string; en: string } }
  | null;

export interface PacksController {
  packs: InstalledPack[];
  /** Composite course catalog: built-in courses first, then installed packs. */
  catalog: LessonCatalog;
  loading: boolean;
  busy: boolean;
  preview: PackPreview | null;
  error: PackError | null;
  result: PacksResult;
  pendingUninstall: string | null;
  storageKind: PackStore['kind'];
  importFile: (file: File) => void;
  confirmInstall: () => void;
  cancelPreview: () => void;
  requestUninstall: (packId: string) => void;
  cancelUninstall: () => void;
  confirmUninstall: () => void;
  dismissError: () => void;
}

function storageError(error: unknown): PackError {
  if (error instanceof PackStorageError) return packError(error.code);
  return packError('storage-failed');
}

/**
 * Read the picked file into bytes.
 *
 * `Blob.arrayBuffer()` is the modern path; the FileReader branch keeps older
 * runtimes (and jsdom in tests) working. Either way the bytes stay in memory —
 * nothing is written to disk or uploaded.
 */
async function readFileBytes(file: File): Promise<Uint8Array> {
  if (typeof file.arrayBuffer === 'function') {
    return new Uint8Array(await file.arrayBuffer());
  }
  const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error ?? new Error('file read failed'));
    reader.readAsArrayBuffer(file);
  });
  return new Uint8Array(buffer);
}

export function usePacksController(injected?: PackStore): PacksController {
  const storeRef = useRef<PackStore | null>(null);
  if (!storeRef.current) storeRef.current = injected ?? browserPackStore();
  const store = storeRef.current;

  const [packs, setPacks] = useState<InstalledPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<PackPreview | null>(null);
  const [error, setError] = useState<PackError | null>(null);
  const [result, setResult] = useState<PacksResult>(null);
  const [pendingUninstall, setPendingUninstall] = useState<string | null>(null);

  const catalog = useMemo(
    () => createLessonCatalog(packs.map((pack) => ({ packId: pack.manifest.packId, lessons: pack.lessons }))),
    [packs],
  );

  const refresh = useCallback(async () => {
    try {
      const installed = await store.list();
      setPacks(installed);
    } catch (failure) {
      setError(storageError(failure));
    }
  }, [store]);

  // Restore installs on mount (and again after every mutation below).
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const installed = await store.list();
        if (!cancelled) setPacks(installed);
      } catch (failure) {
        if (!cancelled) setError(storageError(failure));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [store]);

  const importFile = useCallback(
    (file: File) => {
      setError(null);
      setResult(null);
      setPreview(null);
      setBusy(true);
      void (async () => {
        try {
          if (file.size > PACK_LIMITS.archiveBytes) {
            setError(packError('file-too-large', { path: '.algopack', limit: String(PACK_LIMITS.archiveBytes) }));
            return;
          }
          const bytes = await readFileBytes(file);
          const archive = readPackArchive(bytes);
          if (!archive.ok) {
            setError(archive.errors[0] ?? packError('not-a-zip'));
            return;
          }
          const validation = validatePack({
            files: archive.value.files,
            bytes: archive.value.bytes,
            traceSchemaVersion: TRACE_SCHEMA_VERSION,
            catalogIds: algorithmIds(),
            builtinAlgorithmIds: builtinCourseAlgorithms(),
            installed: packs.map((pack) => ({
              packId: pack.manifest.packId,
              version: pack.manifest.version,
              algorithmIds: pack.lessons.map((lesson) => lesson.algorithmId),
            })),
          });
          if (!validation.ok) {
            setError(validation.errors[0] ?? packError('not-a-zip'));
            return;
          }
          setPreview(validation.value);
        } catch {
          setError(packError('file-read-failed'));
        } finally {
          setBusy(false);
        }
      })();
    },
    [packs],
  );

  const confirmInstall = useCallback(() => {
    if (!preview) return;
    const candidate = preview;
    setBusy(true);
    setError(null);
    void (async () => {
      try {
        await store.install(candidate, { replace: candidate.replaces != null });
        await refresh();
        setPreview(null);
        setResult({ kind: 'installed', packName: candidate.manifest.name });
      } catch (failure) {
        setError(storageError(failure));
      } finally {
        setBusy(false);
      }
    })();
  }, [preview, refresh, store]);

  const cancelPreview = useCallback(() => setPreview(null), []);

  const requestUninstall = useCallback((packId: string) => {
    setPendingUninstall(packId);
    setError(null);
  }, []);

  const cancelUninstall = useCallback(() => setPendingUninstall(null), []);

  const confirmUninstall = useCallback(() => {
    const packId = pendingUninstall;
    if (!packId) return;
    const target = packs.find((pack) => pack.manifest.packId === packId);
    setBusy(true);
    void (async () => {
      try {
        await store.uninstall(packId);
        await refresh();
        setPendingUninstall(null);
        if (target) setResult({ kind: 'uninstalled', packName: target.manifest.name });
      } catch (failure) {
        setError(storageError(failure));
      } finally {
        setBusy(false);
      }
    })();
  }, [pendingUninstall, packs, refresh, store]);

  const dismissError = useCallback(() => setError(null), []);

  return {
    packs,
    catalog,
    loading,
    busy,
    preview,
    error,
    result,
    pendingUninstall,
    storageKind: store.kind,
    importFile,
    confirmInstall,
    cancelPreview,
    requestUninstall,
    cancelUninstall,
    confirmUninstall,
    dismissError,
  };
}
