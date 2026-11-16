/**
 * The MCP server's course view: built-in courses plus packs found in the
 * directory the user explicitly configured.
 *
 * It reuses the browser's own validators (`readPackArchive`, `validatePack`,
 * `createLessonRegistry`) instead of keeping a second copy of the rules, so a
 * pack that the web app would reject is rejected here too — and vice versa.
 *
 * Deliberate limitation: packs installed in the browser live in IndexedDB, which
 * a local process cannot read. `loadCourseIndex` therefore only ever reports
 * *files on disk* and says so in its result.
 */
import { readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { algorithmIds } from '../../../src/domain/algorithms/examples';
import { builtinCourseAlgorithms } from '../../../src/domain/lessons/catalog';
import { lessonRegistry } from '../../../src/domain/lessons/registry';
import type { Lesson } from '../../../src/domain/lessons/types';
import { describeErrors } from '../../../src/domain/packs/errors';
import { PACK_LIMITS, type LocalizedLabel, type PackExample } from '../../../src/domain/packs/types';
import { validatePack } from '../../../src/domain/packs/validate';
import { TRACE_SCHEMA_VERSION } from '../../../src/domain/trace/schema';
import { readPackArchive } from '../../../src/runtime/packs/zip';
import type { SessionLessonOrigin } from '../../../src/domain/sessions/types';
import { listRegularFiles, type FsIssue } from './fsSafe';

/** Limit on pack files inspected per call — a directory, not a disk scan. */
const MAX_PACK_FILES = 32;

export interface PackCourseSource {
  /** File name inside the configured directory (never a full path in output). */
  file: string;
  packId: string;
  version: string;
  name: LocalizedLabel;
  description: LocalizedLabel;
  author: string;
  license: string;
  lessons: Lesson[];
  examples: PackExample[];
  bytes: number;
}

export interface CourseEntry {
  lesson: Lesson;
  origin: SessionLessonOrigin;
  pack?: PackCourseSource;
}

export interface SkippedEntry {
  file: string;
  reason: string;
}

export interface CourseIndex {
  entries: CourseEntry[];
  packs: PackCourseSource[];
  skipped: SkippedEntry[];
  packDir: string | null;
  packDirIssue?: FsIssue;
}

export function loadCourseIndex(packDir: string | null): CourseIndex {
  const builtin = lessonRegistry.lessons as Lesson[];
  const entries: CourseEntry[] = builtin.map((lesson) => ({ lesson, origin: { kind: 'builtin' } }));
  const claimedAlgorithms = new Set(builtin.map((lesson) => lesson.algorithmId));
  const claimedIds = new Set(builtin.map((lesson) => lesson.lessonId));
  const packs: PackCourseSource[] = [];
  const skipped: SkippedEntry[] = [];

  if (!packDir) return { entries, packs, skipped, packDir: null };

  const listing = listRegularFiles(packDir, '.algopack');
  if (!listing.ok) return { entries, packs, skipped, packDir, packDirIssue: listing.issue };

  const catalogIds = algorithmIds();
  for (const file of listing.value.slice(0, MAX_PACK_FILES)) {
    if (file.size > PACK_LIMITS.archiveBytes) {
      skipped.push({ file: file.name, reason: `archive exceeds ${PACK_LIMITS.archiveBytes} bytes` });
      continue;
    }
    let bytes: Uint8Array;
    try {
      bytes = new Uint8Array(readFileSync(join(packDir, file.name)));
    } catch {
      skipped.push({ file: file.name, reason: 'cannot read file' });
      continue;
    }
    const archive = readPackArchive(bytes);
    if (!archive.ok) {
      skipped.push({ file: file.name, reason: describeErrors(archive.errors) });
      continue;
    }
    const validation = validatePack({
      files: archive.value.files,
      bytes: archive.value.bytes,
      traceSchemaVersion: TRACE_SCHEMA_VERSION,
      catalogIds,
      builtinAlgorithmIds: builtinCourseAlgorithms(),
      // Packs are validated independently; cross-pack conflicts are resolved below.
      installed: [],
    });
    if (!validation.ok) {
      skipped.push({ file: file.name, reason: describeErrors(validation.errors) });
      continue;
    }
    const preview = validation.value;
    const source: PackCourseSource = {
      file: file.name,
      packId: preview.manifest.packId,
      version: preview.manifest.version,
      name: preview.manifest.name,
      description: preview.manifest.description,
      author: preview.manifest.author,
      license: preview.manifest.license,
      lessons: [],
      examples: preview.examples,
      bytes: archive.value.bytes,
    };
    for (const lesson of preview.lessons) {
      if (claimedAlgorithms.has(lesson.algorithmId)) {
        skipped.push({ file: file.name, reason: `algorithm "${lesson.algorithmId}" already has a course` });
        continue;
      }
      if (claimedIds.has(lesson.lessonId)) {
        skipped.push({ file: file.name, reason: `lesson id "${lesson.lessonId}" already exists` });
        continue;
      }
      claimedAlgorithms.add(lesson.algorithmId);
      claimedIds.add(lesson.lessonId);
      source.lessons.push(lesson);
      entries.push({
        lesson,
        origin: { kind: 'pack', packId: source.packId, version: source.version },
        pack: source,
      });
    }
    packs.push(source);
  }

  if (listing.value.length > MAX_PACK_FILES) {
    const extra = listing.value.length - MAX_PACK_FILES;
    skipped.push({
      file: '(' + extra + ' more .algopack files)',
      reason: 'only the first ' + MAX_PACK_FILES + ' files are inspected',
    });
  }

  return { entries, packs, skipped, packDir };
}

/** Course lookup by lesson id. */
export function findCourse(index: CourseIndex, lessonId: string): CourseEntry | undefined {
  return index.entries.find((entry) => entry.lesson.lessonId === lessonId);
}

/** Course lookup by algorithm id (used by the teaching prompt). */
export function findCourseByAlgorithm(index: CourseIndex, algorithmId: string): CourseEntry | undefined {
  return index.entries.find((entry) => entry.lesson.algorithmId === algorithmId);
}

/** Human-facing file label, never a full path (the user already knows the dir). */
export function packFileLabel(source: PackCourseSource): string {
  return basename(source.file);
}
