/**
 * Runtime validation for lesson content (Zod).
 *
 * The content authors write is untrusted input as far as the renderer is
 * concerned — a future external pack will feed the same schema. Everything the
 * UI depends on is therefore checked here rather than asserted with `!`.
 */
import { z } from 'zod';
import type { Lesson, LessonValidationResult } from './types';

/** Lowercase, dash-separated ids; no spaces, no localisation. */
const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
/** Step ids are stable join keys: lowercase snake or kebab case. */
const STEP_ID_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;
const CONTENT_VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

const localizedTextSchema = z.object({
  zh: z.string().trim().min(1).max(2000),
  en: z.string().trim().min(1).max(2000),
});

const localizedListSchema = z.object({
  zh: z.array(z.string().trim().min(1).max(400)).min(0).max(20),
  en: z.array(z.string().trim().min(1).max(400)).min(0).max(20),
});

export const lessonStepSchema = z.object({
  stepId: z.string().min(1).max(64).regex(STEP_ID_PATTERN, 'stepId must be lowercase (a-z, 0-9, - or _)'),
  title: localizedTextSchema,
  explanation: localizedTextSchema,
  tip: localizedTextSchema.optional(),
});
export type ValidatedLessonStep = z.infer<typeof lessonStepSchema>;

export const lessonSchema = z
  .object({
    lessonId: z.string().min(1).max(80).regex(ID_PATTERN, 'lessonId must be lowercase (a-z, 0-9, -)'),
    algorithmId: z.string().min(1).max(80).regex(ID_PATTERN, 'algorithmId must be lowercase (a-z, 0-9, -)'),
    contentVersion: z.string().regex(CONTENT_VERSION_PATTERN, 'contentVersion must look like 1.2.3'),
    title: localizedTextSchema,
    oneLiner: localizedTextSchema,
    overview: localizedTextSchema,
    intuition: localizedTextSchema,
    prerequisites: localizedListSchema,
    complexity: z.object({
      time: z.string().trim().min(1).max(40),
      space: z.string().trim().min(1).max(40),
      note: localizedTextSchema,
    }),
    steps: z.array(lessonStepSchema).min(1, 'a lesson needs at least one teaching step').max(20),
    commonMistakes: localizedListSchema,
  })
  // Duplicate step ids would make "which step is this frame?" ambiguous, so this
  // is a hard error, not a warning the UI could paper over.
  .superRefine((lesson, ctx) => {
    const seen = new Set<string>();
    lesson.steps.forEach((step, index) => {
      if (seen.has(step.stepId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['steps', index, 'stepId'],
          message: `duplicate stepId "${step.stepId}"`,
        });
      }
      seen.add(step.stepId);
    });
    // Bilingual content must describe the same stages in both languages.
    if (lesson.prerequisites.zh.length !== lesson.prerequisites.en.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['prerequisites'],
        message: 'prerequisites must have the same number of items in zh and en',
      });
    }
    if (lesson.commonMistakes.zh.length !== lesson.commonMistakes.en.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['commonMistakes'],
        message: 'commonMistakes must have the same number of items in zh and en',
      });
    }
  });

/** Parse one lesson, throwing on invalid content (used for bundled courses). */
export function parseLesson(input: unknown): Lesson {
  return lessonSchema.parse(input) as Lesson;
}

/** Non-throwing validation of one lesson; used by tests and pack loaders. */
export function validateLesson(input: unknown): LessonValidationResult {
  const result = lessonSchema.safeParse(input);
  if (result.success) return { ok: true, errors: [] };
  return {
    ok: false,
    errors: result.error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`),
  };
}

/** Validate a whole set: shape, ids, and no two lessons claiming one algorithm. */
export function validateLessonSet(lessons: unknown[]): LessonValidationResult {
  const errors: string[] = [];
  lessons.forEach((lesson, index) => {
    const result = validateLesson(lesson);
    if (!result.ok) errors.push(`lesson[${index}]: ${result.errors.join('; ')}`);
  });
  if (errors.length) return { ok: false, errors };

  const parsed = lessons as Lesson[];
  const lessonIds = new Set<string>();
  const algorithmIds = new Set<string>();
  parsed.forEach((lesson) => {
    if (lessonIds.has(lesson.lessonId)) errors.push(`duplicate lessonId "${lesson.lessonId}"`);
    lessonIds.add(lesson.lessonId);
    if (algorithmIds.has(lesson.algorithmId)) {
      errors.push(`duplicate algorithmId "${lesson.algorithmId}" (one course per algorithm in this stage)`);
    }
    algorithmIds.add(lesson.algorithmId);
  });
  return { ok: errors.length === 0, errors };
}
