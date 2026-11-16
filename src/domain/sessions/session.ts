/**
 * `.algosession.json` — schema, parser and builder.
 *
 * The file only expresses *intent*: which course to open, optionally which stage
 * to surface, optionally a Python example and sample input. It never carries an
 * execution result, so importing it cannot fabricate an animation.
 */
import { z } from 'zod';
import type { Lesson } from '../lessons/types';
import { jsonValueSchema } from '../trace/schema';
import {
  SESSION_FORMAT_VERSION,
  SESSION_LIMITS,
  sessionFail,
  sessionIssue,
  type LearningSession,
  type SessionLessonOrigin,
  type SessionResult,
} from './types';

const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const STEP_ID_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;

const originSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('builtin') }).strict(),
  z
    .object({
      kind: z.literal('pack'),
      packId: z.string().min(1).max(64).regex(ID_PATTERN, 'packId must be lowercase (a-z, 0-9, -)'),
      version: z.string().regex(SEMVER_PATTERN, 'version must be SemVer').optional(),
    })
    .strict(),
]);

/**
 * `.strict()` matters: an unknown key (an API key, a stray chat transcript)
 * fails validation instead of being silently carried along.
 */
export const learningSessionSchema = z
  .object({
    sessionFormatVersion: z.literal(SESSION_FORMAT_VERSION),
    lessonId: z.string().min(1).max(80).regex(ID_PATTERN, 'lessonId must be lowercase (a-z, 0-9, -)'),
    algorithmId: z.string().min(1).max(80).regex(ID_PATTERN, 'algorithmId must be lowercase (a-z, 0-9, -)'),
    locale: z.enum(['zh', 'en']),
    selectedStepId: z
      .string()
      .min(1)
      .max(64)
      .regex(STEP_ID_PATTERN, 'selectedStepId must be lowercase (a-z, 0-9, - or _)')
      .optional(),
    source: z.string().min(1).max(SESSION_LIMITS.sourceChars).optional(),
    input: jsonValueSchema.optional(),
    lessonOrigin: originSchema,
    sessionName: z.string().min(1).max(SESSION_LIMITS.sessionNameChars).optional(),
    createdAt: z.string().datetime({ offset: true }),
  })
  .strict();

/** Byte length as UTF-8, so limits match what actually lands on disk. */
export function utf8Bytes(text: string): number {
  return new TextEncoder().encode(text).length;
}

/** Parse an `.algosession.json` string. Never throws. */
export function parseLearningSession(text: string): SessionResult<LearningSession> {
  if (utf8Bytes(text) > SESSION_LIMITS.fileBytes) {
    return sessionFail('session-too-large', { limit: String(SESSION_LIMITS.fileBytes) });
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return sessionFail('session-json');
  }
  const parsed = learningSessionSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const detail = `${first?.path.join('.') || '(root)'}: ${first?.message ?? 'invalid'}`;
    const code = (json as { sessionFormatVersion?: unknown } | null)?.sessionFormatVersion;
    if (typeof code === 'number' && code !== SESSION_FORMAT_VERSION) {
      return sessionFail('session-format-version', { version: String(code) }, detail);
    }
    return sessionFail('session-invalid', undefined, detail);
  }
  return { ok: true, value: parsed.data as LearningSession };
}

export interface BuildSessionInput {
  lesson: Lesson;
  locale: 'zh' | 'en';
  origin: SessionLessonOrigin;
  /** Must be one of `lesson.steps[].stepId` when present. */
  selectedStepId?: string;
  /** Python source; inert text only. */
  source?: string;
  input?: unknown;
  sessionName?: string;
  /** Overridable for deterministic tests. */
  createdAt?: string;
}

/**
 * Build a session for a *known* lesson. The caller is responsible for having
 * resolved the lesson (built-in or pack); this function checks the cross-field
 * rules that a schema alone cannot express.
 */
export function buildLearningSession(input: BuildSessionInput): SessionResult<LearningSession> {
  const { lesson } = input;

  if (input.selectedStepId && !lesson.steps.some((step) => step.stepId === input.selectedStepId)) {
    return sessionFail('step-unknown', {
      stepId: input.selectedStepId,
      lessonId: lesson.lessonId,
    });
  }
  if (input.source != undefined && input.source.length > SESSION_LIMITS.sourceChars) {
    return sessionFail('source-too-large', { limit: String(SESSION_LIMITS.sourceChars) });
  }
  if (input.input !== undefined) {
    const parsedInput = jsonValueSchema.safeParse(input.input);
    if (!parsedInput.success) {
      return sessionFail('context-invalid', undefined, 'input: must be JSON');
    }
    if (JSON.stringify(input.input).length > SESSION_LIMITS.inputJsonBytes) {
      return sessionFail('input-too-large', { limit: String(SESSION_LIMITS.inputJsonBytes) });
    }
  }
  if (input.sessionName && input.sessionName.length > SESSION_LIMITS.sessionNameChars) {
    return sessionFail('name-too-long', { limit: String(SESSION_LIMITS.sessionNameChars) });
  }

  const candidate = {
    sessionFormatVersion: SESSION_FORMAT_VERSION,
    lessonId: lesson.lessonId,
    algorithmId: lesson.algorithmId,
    locale: input.locale,
    ...(input.selectedStepId ? { selectedStepId: input.selectedStepId } : {}),
    ...(input.source != undefined ? { source: input.source } : {}),
    ...(input.input !== undefined ? { input: input.input } : {}),
    lessonOrigin: input.origin,
    ...(input.sessionName ? { sessionName: input.sessionName } : {}),
    createdAt: input.createdAt ?? new Date().toISOString(),
  };

  const parsed = learningSessionSchema.safeParse(candidate);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      ok: false,
      errors: [
        sessionIssue('session-invalid', undefined, `${first?.path.join('.') || '(root)'}: ${first?.message ?? 'invalid'}`),
      ],
    };
  }
  return { ok: true, value: parsed.data as LearningSession };
}

/** Pretty JSON with a trailing newline — what we write to disk / download. */
export function serializeLearningSession(session: LearningSession): string {
  return `${JSON.stringify(session, null, 2)}\n`;
}
