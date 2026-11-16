/** Strict wire schema for `POST /api/mentor`. Extra fields are rejected. */
import { z } from 'zod';
import { mentorContextSchema, MENTOR_LIMITS } from '../../../src/domain/mentor/schema';

const modelSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/, 'model must be a plain model id');

export const mentorRequestSchema = z
  .object({
    requestId: z
      .string()
      .min(8)
      .max(64)
      .regex(/^[A-Za-z0-9_-]+$/)
      .optional(),
    provider: z.enum(['ollama', 'openai', 'mock']),
    model: modelSchema.optional(),
    level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
    locale: z.enum(['zh', 'en']),
    question: z.string().min(1).max(MENTOR_LIMITS.questionChars).optional(),
    focus: z.enum(['step', 'variables', 'callstack', 'custom']).default('custom'),
    context: mentorContextSchema,
    /** Level 5 is only reachable through an explicit, confirmed request. */
    confirmFullSolution: z.boolean().optional(),
  })
  .strict();

export type MentorRequest = z.infer<typeof mentorRequestSchema>;
