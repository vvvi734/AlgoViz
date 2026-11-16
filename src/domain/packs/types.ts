/**
 * `.algopack` value types (Stage 4).
 *
 * A pack is *content only*: JSON lessons + plain-text Python examples. Nothing
 * here references React, the worker or IndexedDB, so the same validation runs
 * in the browser, in Node (authoring CLI) and in tests.
 */
import type { Lesson } from '../lessons/types';

/** Format revision of the container/manifest. Bumped only by breaking changes. */
export const PACK_FORMAT_VERSION = 1;

/**
 * Hard resource limits (documented in docs/PACK_FORMAT_V1.md).
 *
 * They are deliberately small: an AlgoLens pack is teaching text, not media.
 * Every number below is enforced BEFORE anything is stored, and the compressed
 * limits are additionally re-checked while inflating (declared sizes may lie).
 */
export const PACK_LIMITS = {
  /** Compressed `.algopack` file size. */
  archiveBytes: 6 * 1024 * 1024,
  /** Number of ZIP entries. */
  entries: 64,
  /** Declared uncompressed size of one entry. */
  fileBytes: 512 * 1024,
  /** Declared total uncompressed size. */
  totalBytes: 3 * 1024 * 1024,
  /** Declared max expansion per entry (zip-bomb guard). */
  compressionRatio: 200,
  /** Character length of an entry path. */
  pathLength: 120,
  /** Lessons per pack. */
  lessons: 20,
  /** Python examples per pack. */
  examples: 20,
  /** Python source size in bytes. */
  pythonBytes: 192 * 1024,
} as const;

export interface LocalizedLabel {
  zh: string;
  en: string;
}

/** `manifest.json` — the only file every pack must contain. */
export interface PackManifest {
  packFormatVersion: number;
  /** Globally stable, lowercase id (also the IndexedDB key). */
  packId: string;
  /** SemVer, e.g. `1.2.0`. */
  version: string;
  name: LocalizedLabel;
  description: LocalizedLabel;
  author: string;
  /** SPDX-ish identifier or short licence name; LICENSE file must exist. */
  license: string;
  /** Trace Schema version the pack's examples expect. */
  requiredTraceSchema: number;
  /** Declared lesson files, all under `lessons/`. */
  lessons: string[];
  /** Declared Python examples (lazy text; never executed on import). */
  examples?: PackExampleRef[];
}

export interface PackExampleRef {
  /** Path under `examples/`, `*.py`. */
  path: string;
  /** Which lesson this example demonstrates. */
  lessonId: string;
  language: 'python';
  /** Optional sample input overriding the algorithm preset. */
  input?: unknown;
}

/** A validated Python example, stored as inert text. */
export interface PackExample {
  lessonId: string;
  path: string;
  language: 'python';
  code: string;
  input?: unknown;
}

/** Result of a successful import, shown to the user before installing. */
export interface PackPreview {
  manifest: PackManifest;
  lessons: Lesson[];
  examples: PackExample[];
  totals: {
    files: number;
    /** Decompressed bytes actually read. */
    bytes: number;
    lessonCount: number;
    pythonExamples: number;
  };
  /** Set when an older version of the same packId is already installed. */
  replaces: { version: string } | null;
}

/** In-memory representation of an installed pack (IndexedDB + UI). */
export interface InstalledPack {
  manifest: PackManifest;
  installedAt: number;
  lessons: Lesson[];
  examples: PackExample[];
}
