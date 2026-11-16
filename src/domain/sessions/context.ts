/**
 * `.algocontext.json` — the user's *current* learning state, exported from the
 * browser so a local Agent can explain what is actually on screen.
 *
 * The embedded `event` is the real `TraceEvent` at the current cursor: nothing
 * is re-executed, nothing is synthesised. Validation reuses
 * `traceEventSchema`, so an exported context can never contain a frame the app
 * itself would have rejected.
 */
import { z } from 'zod';
import type { Lesson } from '../lessons/types';
import { lessonStepSchema } from '../lessons/schema';
import {
  LIMITS,
  TRACE_SCHEMA_VERSION,
  traceEventSchema,
  type TraceEvent,
} from '../trace/schema';
import {
  CONTEXT_FORMAT_VERSION,
  CONTEXT_LIMITS,
  sessionFail,
  sessionIssue,
  type ContextLessonStep,
  type LearningContext,
  type SessionResult,
} from './types';
import { utf8Bytes } from './session';

const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

export const learningContextSchema = z
  .object({
    contextFormatVersion: z.literal(CONTEXT_FORMAT_VERSION),
    exportedAt: z.string().datetime({ offset: true }),
    locale: z.enum(['zh', 'en']),
    algorithmId: z.string().min(1).max(80).regex(ID_PATTERN, 'algorithmId must be lowercase'),
    lessonId: z.string().min(1).max(80).regex(ID_PATTERN, 'lessonId must be lowercase').optional(),
    traceSchemaVersion: z.literal(TRACE_SCHEMA_VERSION),
    stepIndex: z.number().int().nonnegative(),
    totalEvents: z.number().int().positive().max(LIMITS.MAX_EVENTS),
    lessonStepId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).optional(),
    lessonStep: lessonStepSchema.optional(),
    /** The real frame at the cursor; validated with the app's own schema. */
    event: traceEventSchema,
    source: z.string().min(1).max(CONTEXT_LIMITS.sourceChars).optional(),
  })
  .strict()
  // A context whose `stepIndex` disagrees with the embedded event is not a
  // "slightly wrong" file: it is fabricated, so it fails hard.
  .superRefine((context, ctx) => {
    if (context.event.step !== context.stepIndex) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['stepIndex'],
        message: 'stepIndex must equal event.step',
      });
    }
    if (context.stepIndex >= context.totalEvents) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['stepIndex'],
        message: 'stepIndex must be inside the exported trace',
      });
    }
    if (context.lessonStep && context.lessonStepId && context.lessonStep.stepId !== context.lessonStepId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['lessonStep', 'stepId'],
        message: 'lessonStep.stepId must match lessonStepId',
      });
    }
  });

/** Parse an `.algocontext.json` string. Never throws. */
export function parseLearningContext(text: string): SessionResult<LearningContext> {
  if (utf8Bytes(text) > CONTEXT_LIMITS.fileBytes) {
    return sessionFail('context-too-large', { limit: String(CONTEXT_LIMITS.fileBytes) });
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return sessionFail('context-json');
  }
  const parsed = learningContextSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const detail = `${first?.path.join('.') || '(root)'}: ${first?.message ?? 'invalid'}`;
    const version = (json as { contextFormatVersion?: unknown } | null)?.contextFormatVersion;
    if (typeof version === 'number' && version !== CONTEXT_FORMAT_VERSION) {
      return sessionFail('context-format-version', { version: String(version) }, detail);
    }
    return sessionFail('context-invalid', undefined, detail);
  }
  return { ok: true, value: parsed.data as LearningContext };
}

export interface BuildContextInput {
  locale: 'zh' | 'en';
  algorithmId: string;
  lessonId?: string;
  /** The course for this algorithm, when it has one. */
  lesson?: Lesson;
  event: TraceEvent;
  stepIndex: number;
  totalEvents: number;
  /** Only passed when the user explicitly opted in. */
  source?: string;
  exportedAt?: string;
}

/** Build a context from the live lab state. The event is validated here. */
export function buildLearningContext(input: BuildContextInput): SessionResult<LearningContext> {
  const parsedEvent = traceEventSchema.safeParse(input.event);
  if (!parsedEvent.success) {
    const first = parsedEvent.error.issues[0];
    return sessionFail(
      'context-invalid',
      undefined,
      `event: ${first?.path.join('.') || '(root)'}: ${first?.message ?? 'invalid'}`,
    );
  }
  if (input.stepIndex !== parsedEvent.data.step) {
    return sessionFail('context-invalid', undefined, 'stepIndex: does not match the current event');
  }
  if (input.totalEvents < 1 || input.totalEvents > LIMITS.MAX_EVENTS) {
    return sessionFail('context-invalid', undefined, 'totalEvents: out of range');
  }
  if (input.stepIndex >= input.totalEvents) {
    return sessionFail('context-invalid', undefined, 'stepIndex: outside the trace');
  }
  if (input.source != undefined && input.source.length > CONTEXT_LIMITS.sourceChars) {
    return sessionFail('source-too-large', { limit: String(CONTEXT_LIMITS.sourceChars) });
  }

  const lessonStepId = parsedEvent.data.lessonStepId;
  const step = lessonStepId ? input.lesson?.steps.find((entry) => entry.stepId === lessonStepId) : undefined;
  const lessonStep: ContextLessonStep | undefined = step
    ? {
        stepId: step.stepId,
        title: step.title,
        explanation: step.explanation,
        ...(step.tip ? { tip: step.tip } : {}),
      }
    : undefined;

  const candidate = {
    contextFormatVersion: CONTEXT_FORMAT_VERSION,
    exportedAt: input.exportedAt ?? new Date().toISOString(),
    locale: input.locale,
    algorithmId: input.algorithmId,
    ...(input.lessonId ? { lessonId: input.lessonId } : {}),
    traceSchemaVersion: TRACE_SCHEMA_VERSION,
    stepIndex: input.stepIndex,
    totalEvents: input.totalEvents,
    ...(lessonStepId ? { lessonStepId } : {}),
    ...(lessonStep ? { lessonStep } : {}),
    event: parsedEvent.data,
    ...(input.source != undefined ? { source: input.source } : {}),
  };

  const parsed = learningContextSchema.safeParse(candidate);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      ok: false,
      errors: [sessionIssue('context-invalid', undefined, `${first?.path.join('.') || '(root)'}: ${first?.message ?? 'invalid'}`)],
    };
  }
  const value = parsed.data as LearningContext;
  if (utf8Bytes(JSON.stringify(value)) > CONTEXT_LIMITS.fileBytes) {
    return sessionFail('context-too-large', { limit: String(CONTEXT_LIMITS.fileBytes) });
  }
  return { ok: true, value };
}

/** Pretty JSON with a trailing newline — what the browser downloads. */
export function serializeLearningContext(context: LearningContext): string {
  return `${JSON.stringify(context, null, 2)}\n`;
}
