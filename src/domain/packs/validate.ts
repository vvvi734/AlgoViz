/**
 * Content validation for an already-extracted pack.
 *
 * Everything here is pure: given a map of `path → UTF-8 text`, the algorithm
 * catalog and the currently installed packs, decide whether the pack may be
 * installed and produce the preview the user confirms.
 *
 * Trust boundary: a pack may add lessons for algorithms that have no built-in
 * course and are not claimed by another installed pack. It can never replace a
 * built-in course, never shadow another pack and never reference an algorithm
 * that does not exist.
 */
import { validateLesson } from '../lessons/schema';
import type { Lesson } from '../lessons/types';
import { fail, failWith, packError, type PackError, type PackResult } from './errors';
import { LICENSE_FILE, MANIFEST_FILE, parseManifestText, toManifest } from './manifest';
import { checkPath } from './paths';
import { PACK_LIMITS, type PackExample, type PackManifest, type PackPreview } from './types';

export interface InstalledPackSummary {
  packId: string;
  version: string;
  algorithmIds: readonly string[];
}

export interface ValidatePackInput {
  /** Decompressed, security-checked text files keyed by exact path. */
  files: ReadonlyMap<string, string>;
  /** Total decompressed bytes actually read (for the preview totals). */
  bytes: number;
  /** App's Trace Schema version; a pack older/newer than this is refused. */
  traceSchemaVersion: number;
  /** Real algorithm ids from the catalog. */
  catalogIds: readonly string[];
  /** Algorithms that already ship a built-in course (higher priority). */
  builtinAlgorithmIds: readonly string[];
  /** Packs already installed (conflict + version checks). */
  installed: readonly InstalledPackSummary[];
}

const encoder = new TextEncoder();

function byteLength(text: string): number {
  return encoder.encode(text).length;
}

/** Validate a pack and build its preview. Never writes anything. */
export function validatePack(input: ValidatePackInput): PackResult<PackPreview> {
  const { files } = input;

  const manifestText = files.get(MANIFEST_FILE);
  if (manifestText == undefined) return fail('missing-manifest');

  const parsed = parseManifestText(manifestText);
  if (!parsed.ok) return parsed;
  const manifest: PackManifest = toManifest(parsed.value);

  if (manifest.requiredTraceSchema !== input.traceSchemaVersion) {
    return fail('trace-schema', {
      required: String(manifest.requiredTraceSchema),
      current: String(input.traceSchemaVersion),
    });
  }

  const license = files.get(LICENSE_FILE);
  if (license == undefined || license.trim().length === 0) return fail('missing-license');

  // ---- lessons ----------------------------------------------------------
  const lessons: Lesson[] = [];
  const errors: PackError[] = [];
  const lessonIds = new Set<string>();
  const algorithmIds = new Set<string>();

  for (const path of manifest.lessons) {
    const text = files.get(path);
    if (text == undefined) {
      errors.push(packError('missing-lesson-file', { path }));
      continue;
    }
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      errors.push(packError('lesson-json', { path }));
      continue;
    }
    const validation = validateLesson(json);
    if (!validation.ok) {
      errors.push(packError('lesson-invalid', { path, reason: validation.errors[0] ?? 'invalid' }));
      continue;
    }
    const lesson = json as Lesson;

    if (lessonIds.has(lesson.lessonId)) {
      errors.push(packError('lesson-duplicate', { lesson: lesson.lessonId }));
      continue;
    }
    lessonIds.add(lesson.lessonId);

    if (algorithmIds.has(lesson.algorithmId)) {
      errors.push(packError('algorithm-pack-conflict', { algorithm: lesson.algorithmId, pack: manifest.packId }));
      continue;
    }
    algorithmIds.add(lesson.algorithmId);

    if (!input.catalogIds.includes(lesson.algorithmId)) {
      errors.push(packError('algorithm-unknown', { algorithm: lesson.algorithmId }));
      continue;
    }
    if (input.builtinAlgorithmIds.includes(lesson.algorithmId)) {
      errors.push(packError('algorithm-builtin-conflict', { algorithm: lesson.algorithmId }));
      continue;
    }
    const owner = input.installed.find(
      (pack) => pack.packId !== manifest.packId && pack.algorithmIds.includes(lesson.algorithmId),
    );
    if (owner) {
      errors.push(
        packError('algorithm-pack-conflict', { algorithm: lesson.algorithmId, pack: owner.packId }),
      );
      continue;
    }

    lessons.push(lesson);
  }

  if (errors.length) return failWith(errors);
  if (lessons.length === 0) return fail('lesson-invalid', { path: manifest.lessons[0] ?? '', reason: 'no lessons' });

  // ---- examples (lazy text, never executed) -----------------------------
  const examples: PackExample[] = [];
  for (const ref of manifest.examples ?? []) {
    const check = checkPath(ref.path);
    if (!check.ok || check.kind !== 'example') return fail('unsafe-path', { path: ref.path });
    const text = files.get(ref.path);
    if (text == undefined) return fail('example-missing', { path: ref.path });
    if (text.trim().length === 0 || text.includes('\u0000')) {
      return fail('example-invalid', { path: ref.path });
    }
    if (byteLength(text) > PACK_LIMITS.pythonBytes) {
      return fail('file-too-large', { path: ref.path, limit: String(PACK_LIMITS.pythonBytes) });
    }
    if (!lessonIds.has(ref.lessonId)) {
      return fail('example-invalid', { path: ref.path, lesson: ref.lessonId });
    }
    examples.push({
      lessonId: ref.lessonId,
      path: ref.path,
      language: 'python',
      code: text,
      ...(ref.input === undefined ? {} : { input: ref.input }),
    });
  }

  // ---- version / duplicate install --------------------------------------
  const existing = input.installed.find((pack) => pack.packId === manifest.packId) ?? null;
  if (existing && existing.version === manifest.version) {
    return fail('already-installed', { pack: manifest.packId, version: manifest.version });
  }

  return {
    ok: true,
    value: {
      manifest,
      lessons,
      examples,
      totals: {
        files: files.size,
        bytes: input.bytes,
        lessonCount: lessons.length,
        pythonExamples: examples.length,
      },
      replaces: existing ? { version: existing.version } : null,
    },
  };
}
