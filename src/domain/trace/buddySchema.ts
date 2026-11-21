import { z } from 'zod';

/**
 * TEXTBOOK-08: buddy-system snapshots.
 *
 * A block is always a power-of-two range aligned to its own size. The memory
 * partition covers [0, capacity) exactly. Two blocks are buddies only when they
 * have the same size, their starts differ by exactly that size, and the lower
 * block is aligned to twice the size. Adjacency alone is not a buddy relation.
 */
export const BUDDY_OPERATIONS = [
  'init',
  'search',
  'found',
  'split',
  'allocate',
  'release',
  'buddy-check',
  'merge',
  'fail',
  'done',
] as const;

export const BUDDY_DECISIONS = [
  'search-up',
  'found',
  'split',
  'exact',
  'buddy-free',
  'buddy-busy',
  'merged',
  'no-fit',
  'done',
] as const;

const buddyBlockSchema = z.object({
  start: z.number().int().nonnegative(),
  size: z.number().int().positive(),
  level: z.number().int().nonnegative(),
  status: z.enum(['free', 'allocated']),
  label: z.string().min(1).max(8).nullable(),
});

export const buddySnapshotSchema = z
  .object({
    kind: z.literal('buddy-system'),
    algorithm: z.literal('buddy-system'),
    operation: z.enum(BUDDY_OPERATIONS),
    capacity: z.number().int().min(8).max(128),
    maxLevel: z.number().int().min(3).max(7),
    blocks: z.array(buddyBlockSchema).min(1).max(32),
    requestedId: z.string().min(1).max(8).nullable(),
    requestedSize: z.number().int().positive().nullable(),
    targetLevel: z.number().int().nonnegative().nullable(),
    currentLevel: z.number().int().nonnegative().nullable(),
    currentStart: z.number().int().nonnegative().nullable(),
    selectedStart: z.number().int().nonnegative().nullable(),
    buddyStart: z.number().int().nonnegative().nullable(),
    mergeStart: z.number().int().nonnegative().nullable(),
    blockSize: z.number().int().positive().nullable(),
    internalFragment: z.number().int().nonnegative(),
    allocationId: z.string().min(1).max(8).nullable(),
    decision: z.enum(BUDDY_DECISIONS).nullable(),
  })
  .superRefine((snapshot, ctx) => {
    const power = (value: number) => value > 0 && (value & (value - 1)) === 0;
    if (!power(snapshot.capacity)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'capacity must be a power of two' });
    }
    if (snapshot.maxLevel !== Math.log2(snapshot.capacity)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'maxLevel must be log2(capacity)' });
    }

    let cursor = 0;
    const labels = new Set<string>();
    for (const block of snapshot.blocks) {
      if (block.start !== cursor) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `buddy blocks must tile the capacity without gaps: expected ${cursor}, got ${block.start}`,
        });
        break;
      }
      if (!power(block.size)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'every buddy block size must be a power of two' });
      }
      if (block.start % block.size !== 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `block at ${block.start} is not aligned to its size ${block.size}`,
        });
      }
      if (block.level !== Math.log2(block.size)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'block level must equal log2(size)' });
      }
      if (block.status === 'allocated' && block.label === null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'allocated buddy block needs a label' });
      }
      if (block.status === 'allocated' && block.label !== null) {
        if (labels.has(block.label)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: `duplicate allocation ${block.label}` });
        }
        labels.add(block.label);
      }
      cursor += block.size;
    }
    if (cursor !== snapshot.capacity) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'buddy blocks do not cover the capacity' });
    }
    if (snapshot.targetLevel !== null && snapshot.targetLevel > snapshot.maxLevel) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'targetLevel exceeds maxLevel' });
    }
    if (snapshot.requestedSize !== null && snapshot.requestedSize > snapshot.capacity) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'request exceeds capacity' });
    }
    if (snapshot.blockSize !== null && snapshot.requestedSize !== null) {
      if (snapshot.blockSize < snapshot.requestedSize) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'allocated block is smaller than the request' });
      }
      if (snapshot.blockSize - snapshot.requestedSize !== snapshot.internalFragment) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'internal fragmentation mismatch' });
      }
    }
    if (snapshot.blockSize === null && snapshot.internalFragment !== 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'fragmentation requires an allocated block' });
    }
  });

export type BuddySnapshot = z.infer<typeof buddySnapshotSchema>;
export type BuddyOperation = (typeof BUDDY_OPERATIONS)[number];
