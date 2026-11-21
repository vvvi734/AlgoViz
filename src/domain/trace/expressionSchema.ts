/**
 * Trace payload for the two stack applications in chapter 3.
 *
 * The payload is deliberately separate from the generic stack/queue snapshot:
 * an expression algorithm needs the whole token stream, the operator stack,
 * the produced suffix (or operand stack), and on evaluation the two popped
 * operands. Keeping it separate prevents the storage renderer from guessing
 * expression semantics and keeps every field explicit in the real Python trace.
 */
import { z } from 'zod';

export const EXPRESSION_ALGORITHMS = ['infix-to-postfix', 'postfix-eval'] as const;
export type ExpressionAlgorithm = (typeof EXPRESSION_ALGORITHMS)[number];

export const EXPRESSION_OPERATIONS = [
  'init',
  'read',
  'push',
  'pop',
  'emit',
  'apply',
  'done',
  'error',
] as const;
export type ExpressionOperation = (typeof EXPRESSION_OPERATIONS)[number];

const EXPRESSION_LIMITS = {
  MAX_TOKENS: 80,
  MAX_STACK_ITEMS: 40,
  MAX_TOKEN_CHARS: 16,
  MAX_ERROR_CHARS: 240,
} as const;

/** Stack entry: an id for React identity plus the scalar the algorithm stores. */
export const expressionStackItemSchema = z.object({
  id: z.string().min(1).max(64),
  value: z.union([z.string().max(EXPRESSION_LIMITS.MAX_TOKEN_CHARS), z.number().finite()]),
});
export type ExpressionStackItem = z.infer<typeof expressionStackItemSchema>;

/**
 * A completed binary operation. `right` is the first value popped and `left`
 * the second one; the renderer shows this order explicitly so subtraction and
 * division can never silently reverse their operands.
 */
export const expressionOperandsSchema = z.object({
  right: expressionStackItemSchema,
  left: expressionStackItemSchema,
  operator: z.enum(['+', '-', '*', '/']),
  result: z.number().finite(),
});
export type ExpressionOperands = z.infer<typeof expressionOperandsSchema>;

export const expressionSnapshotSchema = z
  .object({
    kind: z.literal('expression'),
    algorithm: z.enum(EXPRESSION_ALGORITHMS),
    operation: z.enum(EXPRESSION_OPERATIONS),
    /** Normalised token stream; numbers are whole tokens, never single digits. */
    tokens: z.array(z.string().min(1).max(EXPRESSION_LIMITS.MAX_TOKEN_CHARS)).max(EXPRESSION_LIMITS.MAX_TOKENS),
    /** 0-based index of the token being read; -1 before the loop, tokens.length after it. */
    index: z.number().int().min(-1).max(EXPRESSION_LIMITS.MAX_TOKENS),
    operatorStack: z.array(expressionStackItemSchema).max(EXPRESSION_LIMITS.MAX_STACK_ITEMS),
    operandStack: z.array(expressionStackItemSchema).max(EXPRESSION_LIMITS.MAX_STACK_ITEMS).optional(),
    /** Postfix tokens produced so far (infix conversion only). */
    output: z.array(z.string().min(1).max(EXPRESSION_LIMITS.MAX_TOKEN_CHARS)).max(EXPRESSION_LIMITS.MAX_TOKENS).optional(),
    targetId: z.string().min(1).max(64).optional(),
    operands: expressionOperandsSchema.optional(),
    result: z.number().finite().nullable().optional(),
    error: z.string().min(1).max(EXPRESSION_LIMITS.MAX_ERROR_CHARS).nullable().optional(),
  })
  .superRefine((snapshot, ctx) => {
    if (snapshot.index > snapshot.tokens.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['index'],
        message: 'index must not run past the token stream',
      });
    }
    const ids = new Set<string>();
    for (const [field, items] of [
      ['operatorStack', snapshot.operatorStack],
      ['operandStack', snapshot.operandStack ?? []],
    ] as const) {
      items.forEach((item, position) => {
        if (ids.has(item.id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field, position, 'id'],
            message: `duplicate expression stack id "${item.id}"`,
          });
        }
        ids.add(item.id);
      });
    }
    if (snapshot.operation === 'apply' && !snapshot.operands) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['operands'],
        message: 'apply must record the two operands and the result',
      });
    }
    if (snapshot.operation === 'error' && !snapshot.error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['error'],
        message: 'error operation must explain the failure',
      });
    }
  });
export type ExpressionSnapshot = z.infer<typeof expressionSnapshotSchema>;
