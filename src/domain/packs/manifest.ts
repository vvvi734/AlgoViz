/**
 * `manifest.json` schema and parsing.
 *
 * Zod is the single source of truth here too: the browser import path, the
 * tests and the authoring CLI all validate the same object.
 */
import { z } from 'zod';
import { fail, type PackResult } from './errors';
import { checkPath } from './paths';
import { PACK_FORMAT_VERSION, PACK_LIMITS, type PackManifest } from './types';

const localizedLabel = z.object({
  zh: z.string().trim().min(1).max(200),
  en: z.string().trim().min(1).max(200),
});

const PACK_ID = /^[a-z0-9][a-z0-9-]*$/;
const SEMVER = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;

const exampleRef = z.object({
  path: z.string().min(1).max(PACK_LIMITS.pathLength),
  lessonId: z.string().min(1).max(80),
  language: z.literal('python'),
  input: z.unknown().optional(),
});

export const packManifestSchema = z.object({
  packFormatVersion: z.number().int().min(1),
  packId: z.string().min(1).max(64).regex(PACK_ID, 'packId must be lowercase (a-z, 0-9, -)'),
  version: z.string().regex(SEMVER, 'version must be SemVer, e.g. 1.2.0'),
  name: localizedLabel,
  description: localizedLabel,
  author: z.string().trim().min(1).max(120),
  license: z.string().trim().min(1).max(80),
  requiredTraceSchema: z.number().int().min(1).max(99),
  lessons: z.array(z.string().min(1).max(PACK_LIMITS.pathLength)).min(1).max(PACK_LIMITS.lessons),
  examples: z.array(exampleRef).max(PACK_LIMITS.examples).optional(),
});

export type ParsedManifest = z.infer<typeof packManifestSchema>;

/**
 * Parse manifest text. Structural checks that Zod cannot express (duplicate
 * declarations, unsafe/unsupported paths, duplicate example refs) happen here.
 */
export function parseManifestText(text: string): PackResult<ParsedManifest> {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return fail('manifest-json');
  }
  const parsed = packManifestSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return fail('manifest-invalid', {
      field: first?.path.join('.') || '(root)',
      reason: first?.message ?? 'invalid',
    });
  }
  const manifest = parsed.data;

  if (manifest.packFormatVersion !== PACK_FORMAT_VERSION) {
    return fail('format-version', { version: String(manifest.packFormatVersion) });
  }

  const seenLessons = new Set<string>();
  for (const path of manifest.lessons) {
    const check = checkPath(path);
    if (!check.ok) return fail(check.unsafe ? 'unsafe-path' : check.tooLong ? 'path-too-long' : 'unsupported-file', { path });
    if (check.kind !== 'lesson') return fail('unsupported-file', { path });
    if (seenLessons.has(path)) return fail('lesson-duplicate', { lesson: path });
    seenLessons.add(path);
  }

  const seenExamples = new Set<string>();
  for (const ref of manifest.examples ?? []) {
    const check = checkPath(ref.path);
    if (check.unsafe) return fail('unsafe-path', { path: ref.path });
    if (!check.ok && check.tooLong) return fail('path-too-long', { path: ref.path });
    if (check.kind !== 'example') return fail('unsupported-file', { path: ref.path });
    if (seenExamples.has(ref.path)) return fail('duplicate-path', { path: ref.path });
    seenExamples.add(ref.path);
  }

  return { ok: true, value: manifest };
}

/** Narrow a validated manifest to the public shape (drops zod internals). */
export function toManifest(parsed: ParsedManifest): PackManifest {
  return {
    packFormatVersion: parsed.packFormatVersion,
    packId: parsed.packId,
    version: parsed.version,
    name: parsed.name,
    description: parsed.description,
    author: parsed.author,
    license: parsed.license,
    requiredTraceSchema: parsed.requiredTraceSchema,
    lessons: [...parsed.lessons],
    ...(parsed.examples ? { examples: parsed.examples.map((ref) => ({ ...ref })) } : {}),
  };
}

export const MANIFEST_FILE = 'manifest.json';
export const LICENSE_FILE = 'LICENSE';
