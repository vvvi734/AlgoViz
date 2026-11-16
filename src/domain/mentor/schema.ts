/**
 * Mentor contract shared by the web app and the local AI Gateway.
 *
 * One schema in one place: the browser builds the context, the Gateway validates
 * it before calling any model, and the browser validates the reply before it is
 * rendered. Nothing here touches React, Node or provider SDKs.
 */
import { z } from 'zod';
import { traceEventSchema } from '../trace/schema';

export const MENTOR_LEVELS = [1, 2, 3, 4, 5] as const;
export type MentorLevel = (typeof MENTOR_LEVELS)[number];

export const MENTOR_LIMITS = {
  questionChars: 800,
  sourceChars: 40_000,
  explanationChars: 1_600,
  guidingQuestionChars: 320,
  factChars: 220,
  facts: 6,
  issueChars: 260,
  issues: 5,
  nextActionChars: 260,
  titleChars: 160,
  stepExplanationChars: 1_200,
  requestBytes: 96 * 1024,
} as const;

const localeSchema = z.enum(['zh', 'en']);
const idSchema = z.string().min(1).max(80).regex(/^[a-z0-9][a-z0-9-]*$/);

/**
 * What the browser may send. It is deliberately the same shape as
 * `.algocontext.json` where the two overlap: the embedded event is the *real*
 * frame under the cursor, validated with the app's own Trace Schema.
 */
export const mentorContextSchema = z
  .object({
    algorithmId: idSchema,
    lessonId: idSchema.optional(),
    lessonStepId: z
      .string()
      .min(1)
      .max(64)
      .regex(/^[a-z0-9][a-z0-9_-]*$/)
      .optional(),
    /** Course title in the session locale (plain text). */
    lessonTitle: z.string().min(1).max(MENTOR_LIMITS.titleChars).optional(),
    /** Teaching copy for the current stage, already localised by the web app. */
    lessonStepTitle: z.string().min(1).max(MENTOR_LIMITS.titleChars).optional(),
    lessonStepExplanation: z.string().min(1).max(MENTOR_LIMITS.stepExplanationChars).optional(),
    locale: localeSchema,
    stepIndex: z.number().int().min(0),
    totalEvents: z.number().int().min(1),
    /** The frame the user is looking at. Never a synthesised state. */
    event: traceEventSchema,
    /** True when the editor no longer matches the snapshot that produced `event`. */
    traceStale: z.boolean(),
    /** Only present when the user explicitly ticked "include my code". */
    source: z.string().min(1).max(MENTOR_LIMITS.sourceChars).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.event.step !== value.stepIndex) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['stepIndex'],
        message: 'stepIndex must equal event.step (the frame shown on screen)',
      });
    }
    if (value.stepIndex >= value.totalEvents) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['stepIndex'],
        message: 'stepIndex must be inside the trace',
      });
    }
  });

export type MentorContext = z.infer<typeof mentorContextSchema>;

/**
 * The five-level tutor answer. Every field is bounded: a hostile or broken
 * model cannot return a novel through this door.
 */
export const mentorReplySchema = z.object({
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  explanation: z.string().min(1).max(MENTOR_LIMITS.explanationChars),
  guidingQuestion: z.string().min(1).max(MENTOR_LIMITS.guidingQuestionChars),
  observedFacts: z.array(z.string().min(1).max(MENTOR_LIMITS.factChars)).max(MENTOR_LIMITS.facts),
  possibleIssues: z.array(z.string().min(1).max(MENTOR_LIMITS.issueChars)).max(MENTOR_LIMITS.issues),
  suggestedNextAction: z.string().min(1).max(MENTOR_LIMITS.nextActionChars),
  answerDisclosure: z.enum(['none', 'partial', 'full']),
});

export type MentorReply = z.infer<typeof mentorReplySchema>;

/** Parsed reply + the guardrail actions the Gateway had to take. */
export const mentorMetaSchema = z.object({
  requestId: z.string().min(1).max(64),
  provider: z.enum(['ollama', 'openai', 'mock']),
  model: z.string().min(1).max(80),
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  stepIndex: z.number().int().min(0),
  totalEvents: z.number().int().min(1),
  traceStale: z.boolean(),
  sourceIncluded: z.boolean(),
  latencyMs: z.number().int().min(0),
  guardrails: z.array(z.enum(['code-redacted', 'level-normalised', 'disclosure-downgraded'])),
  mock: z.boolean(),
});

export const mentorEnvelopeSchema = z.object({
  ok: z.literal(true),
  reply: mentorReplySchema,
  meta: mentorMetaSchema,
  disclaimer: z.string().min(1).max(400),
});

export type MentorEnvelope = z.infer<typeof mentorEnvelopeSchema>;

export const providerStatusSchema = z.object({
  id: z.enum(['ollama', 'openai', 'mock']),
  label: z.string().min(1).max(80),
  configured: z.boolean(),
  reachable: z.boolean(),
  models: z.array(z.string().min(1).max(80)).max(40),
  defaultModel: z.string().min(1).max(80).nullable(),
  detail: z.string().max(240).optional(),
  mock: z.boolean(),
});

export const providersResponseSchema = z.object({
  ok: z.literal(true),
  gatewayVersion: z.string().min(1).max(40),
  providers: z.array(providerStatusSchema).max(4),
});

export type ProvidersResponse = z.infer<typeof providersResponseSchema>;

/** Human-readable, localised description of the level contract (UI copy). */
export function levelContract(level: MentorLevel): {
  disclosure: 'none' | 'partial' | 'full';
  allowsPseudoCode: boolean;
} {
  if (level <= 2) return { disclosure: 'none', allowsPseudoCode: false };
  if (level <= 4) return { disclosure: 'partial', allowsPseudoCode: true };
  return { disclosure: 'full', allowsPseudoCode: true };
}
