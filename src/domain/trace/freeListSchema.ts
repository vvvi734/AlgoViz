import { z } from 'zod';

/**
 * TEXTBOOK-08: validated snapshots for the free-space list course.
 *
 * Every block covers a half-open range [start, start + size). The snapshot is a
 * complete partition of [0, capacity): allocated and free blocks must tile the
 * range without gaps or overlaps. The header/footer tags are part of the data
 * model, not decoration: they must always agree with the block's size and state.
 */
export const FREE_LIST_OPERATIONS = [
  'init',
  'consider',
  'select',
  'split',
  'allocate',
  'release',
  'merge',
  'fail',
  'done',
] as const;

export const FREE_LIST_POLICIES = ['first-fit', 'best-fit'] as const;

export const FREE_LIST_DECISIONS = [
  'scan',
  'fit',
  'too-small',
  'exact',
  'split',
  'isolated',
  'left-free',
  'right-free',
  'both-free',
  'merged',
  'no-fit',
  'done',
] as const;

const blockStateSchema = z.enum(['free', 'allocated']);

const boundarySchema = z.object({
  headSize: z.number().int().positive(),
  tailSize: z.number().int().positive(),
  headStatus: blockStateSchema,
  tailStatus: blockStateSchema,
});

const blockSchema = z.object({
  start: z.number().int().nonnegative(),
  size: z.number().int().positive(),
  status: blockStateSchema,
  label: z.string().min(1).max(8).nullable(),
  boundary: boundarySchema,
});

const requestSchema = z.object({
  id: z.string().min(1).max(8),
  size: z.number().int().positive(),
});

export const freeListSnapshotSchema = z
  .object({
    kind: z.literal('free-list'),
    algorithm: z.literal('free-list'),
    operation: z.enum(FREE_LIST_OPERATIONS),
    policy: z.enum(FREE_LIST_POLICIES),
    capacity: z.number().int().min(8).max(128),
    blocks: z.array(blockSchema).min(1).max(40),
    freeBlocks: z.array(blockSchema).max(40),
    request: requestSchema.nullable(),
    currentStart: z.number().int().nonnegative().nullable(),
    candidateStart: z.number().int().nonnegative().nullable(),
    selectedStart: z.number().int().nonnegative().nullable(),
    decision: z.enum(FREE_LIST_DECISIONS).nullable(),
    internalFragment: z.number().int().nonnegative(),
    freeRegionCount: z.number().int().nonnegative(),
    totalFree: z.number().int().nonnegative(),
    largestFree: z.number().int().nonnegative(),
    allocatedCount: z.number().int().nonnegative(),
  })
  .superRefine((snapshot, ctx) => {
    let cursor = 0;
    const labels = new Set<string>();
    for (const block of snapshot.blocks) {
      if (block.start !== cursor) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `blocks must tile the capacity without gaps: expected start ${cursor}, got ${block.start}`,
        });
        break;
      }
      if (block.boundary.headSize !== block.size || block.boundary.tailSize !== block.size) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'boundary sizes must equal the block size' });
      }
      if (block.boundary.headStatus !== block.status || block.boundary.tailStatus !== block.status) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'boundary states must equal the block state' });
      }
      if (block.status === 'allocated' && block.label === null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'an allocated block needs a label' });
      }
      if (block.status === 'allocated' && block.label !== null) {
        if (labels.has(block.label)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: `duplicate allocated label ${block.label}` });
        }
        labels.add(block.label);
      }
      cursor += block.size;
    }
    if (cursor !== snapshot.capacity) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `blocks cover ${cursor}, capacity is ${snapshot.capacity}` });
    }

    const free = snapshot.blocks
      .filter((block) => block.status === 'free')
      .map((block) => ({ start: block.start, size: block.size }));
    if (free.length !== snapshot.freeBlocks.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'freeBlocks must list every free block exactly once' });
    } else {
      for (let index = 0; index < free.length; index += 1) {
        const expected = free[index]!;
        const actual = snapshot.freeBlocks[index]!;
        if (expected.start !== actual.start || expected.size !== actual.size || actual.status !== 'free') {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'freeBlocks is out of sync with the memory partition' });
        }
      }
    }

    const allocated = snapshot.blocks.filter((block) => block.status === 'allocated').length;
    if (allocated !== snapshot.allocatedCount) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'allocatedCount does not match the partition' });
    }
    const freeTotal = free.reduce((sum, block) => sum + block.size, 0);
    if (snapshot.totalFree !== freeTotal) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'totalFree mismatch' });
    }
    if (snapshot.freeRegionCount !== free.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'freeRegionCount mismatch' });
    }
    const largest = free.reduce((max, block) => Math.max(max, block.size), 0);
    if (snapshot.largestFree !== largest) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'largestFree mismatch' });
    }
  });

export type FreeListSnapshot = z.infer<typeof freeListSnapshotSchema>;
export type FreeListPolicy = (typeof FREE_LIST_POLICIES)[number];
export type FreeListOperation = (typeof FREE_LIST_OPERATIONS)[number];

