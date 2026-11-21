/**
 * TEXTBOOK-09: schema for indexed sequential (block) search.
 *
 * The snapshot carries the original data order, the exact block partition,
 * the sequential index table and the two comparison stages. It rejects every
 * input that would need the algorithm to silently regroup or reorder records.
 */
import { z } from 'zod';

export const BLOCK_SEARCH_MAX_RECORDS = 24;
export const BLOCK_SEARCH_MAX_BLOCK_SIZE = 8;

export const blockSearchBlockSchema = z.object({
  index: z.number().int().min(0).max(BLOCK_SEARCH_MAX_BLOCK_SIZE),
  start: z.number().int().min(0).max(BLOCK_SEARCH_MAX_RECORDS),
  length: z.number().int().min(1).max(BLOCK_SEARCH_MAX_BLOCK_SIZE),
  max: z.number().finite(),
  values: z.array(z.number().finite()).min(1).max(BLOCK_SEARCH_MAX_BLOCK_SIZE),
});
export type BlockSearchBlock = z.infer<typeof blockSearchBlockSchema>;

export const blockSearchIndexSchema = z.object({
  blockIndex: z.number().int().min(0).max(BLOCK_SEARCH_MAX_BLOCK_SIZE),
  max: z.number().finite(),
  start: z.number().int().min(0).max(BLOCK_SEARCH_MAX_RECORDS),
  length: z.number().int().min(1).max(BLOCK_SEARCH_MAX_BLOCK_SIZE),
});
export type BlockSearchIndexEntry = z.infer<typeof blockSearchIndexSchema>;

export const BLOCK_SEARCH_PHASES = ['index', 'block', 'done'] as const;
export type BlockSearchPhase = (typeof BLOCK_SEARCH_PHASES)[number];

export const BLOCK_SEARCH_OPERATIONS = [
  'init', 'index-compare', 'index-select', 'block-compare', 'found', 'not-found', 'done',
] as const;
export type BlockSearchOperation = (typeof BLOCK_SEARCH_OPERATIONS)[number];

export const BLOCK_SEARCH_RESULTS = ['found', 'not-found'] as const;
export type BlockSearchResult = (typeof BLOCK_SEARCH_RESULTS)[number];

export const blockSearchSnapshotSchema = z
  .object({
    kind: z.literal('block-search'),
    preset: z.string().max(200).nullable(),
    operation: z.enum(BLOCK_SEARCH_OPERATIONS),
    targetValue: z.number().finite(),
    blockSize: z.number().int().min(1).max(BLOCK_SEARCH_MAX_BLOCK_SIZE),
    data: z.array(z.number().finite()).max(BLOCK_SEARCH_MAX_RECORDS),
    blocks: z.array(blockSearchBlockSchema).max(BLOCK_SEARCH_MAX_BLOCK_SIZE),
    indexEntries: z.array(blockSearchIndexSchema).max(BLOCK_SEARCH_MAX_BLOCK_SIZE),
    currentIndex: z.number().int().min(0).max(BLOCK_SEARCH_MAX_BLOCK_SIZE - 1).nullable(),
    currentBlock: z.number().int().min(0).max(BLOCK_SEARCH_MAX_BLOCK_SIZE - 1).nullable(),
    currentPos: z.number().int().min(0).max(BLOCK_SEARCH_MAX_BLOCK_SIZE - 1).nullable(),
    compareValue: z.number().finite().nullable(),
    phase: z.enum(BLOCK_SEARCH_PHASES),
    indexComparisons: z.number().int().min(0).max(BLOCK_SEARCH_MAX_BLOCK_SIZE),
    blockComparisons: z.number().int().min(0).max(BLOCK_SEARCH_MAX_RECORDS),
    result: z.enum(BLOCK_SEARCH_RESULTS).nullable(),
  })
  .superRefine((snapshot, ctx) => {
    const add = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });

    if (snapshot.blocks.length === 0 && snapshot.indexEntries.length !== 0) {
      add(['indexEntries'], 'an empty table cannot have index entries');
    }
    if (snapshot.blocks.length === 0 && snapshot.data.length !== 0) {
      add(['data'], 'data without blocks would be silently ignored');
    }

    let cursor = 0;
    snapshot.blocks.forEach((block, index) => {
      if (block.index !== index) add(['blocks', index, 'index'], 'block indices must be dense and in order');
      if (block.start !== cursor) add(['blocks', index, 'start'], 'blocks must partition the prefix without gaps');
      if (block.length !== block.values.length) add(['blocks', index, 'length'], 'length must equal values.length');
      if (block.max !== Math.max(...block.values)) add(['blocks', index, 'max'], 'block max must be the real maximum');
      cursor += block.length;

      if (index > 0) {
        const previous = snapshot.blocks[index - 1];
        const previousMax = previous.max;
        if (block.max <= previousMax) add(['blocks', index, 'max'], 'block maxima must strictly increase');
        if (Math.min(...block.values) <= previousMax) {
          add(['blocks', index, 'values'], 'every value in this block must exceed the previous block maximum');
        }
      }
    });
    if (cursor !== snapshot.data.length) add(['blocks'], 'blocks must cover exactly the original data order');

    snapshot.indexEntries.forEach((entry, index) => {
      if (entry.blockIndex !== index) add(['indexEntries', index, 'blockIndex'], 'index entries must be one per block in order');
      const block = snapshot.blocks[index];
      if (!block) {
        add(['indexEntries', index], 'index entry has no matching block');
        return;
      }
      if (entry.max !== block.max) add(['indexEntries', index, 'max'], 'index max must equal the block max');
      if (entry.start !== block.start) add(['indexEntries', index, 'start'], 'index start must equal the block start');
      if (entry.length !== block.length) add(['indexEntries', index, 'length'], 'index length must equal the block length');
    });

    if (snapshot.blocks.length === 0) {
      if (snapshot.currentIndex !== null || snapshot.currentBlock !== null || snapshot.currentPos !== null) {
        add(['currentBlock'], 'an empty table has no current position');
      }
      if (snapshot.operation === 'found') add(['operation'], 'an empty table cannot find a record');
    }

    if (snapshot.currentBlock !== null) {
      const block = snapshot.blocks[snapshot.currentBlock];
      if (!block) add(['currentBlock'], 'currentBlock does not name a real block');
    }
    if (snapshot.currentPos !== null) {
      if (snapshot.currentBlock === null) add(['currentPos'], 'a block offset requires currentBlock');
      const block =
        snapshot.currentBlock === null ? undefined : snapshot.blocks[snapshot.currentBlock];
      if (!block || snapshot.currentPos >= block.values.length) {
        add(['currentPos'], 'currentPos must point inside the selected block');
      }
    }
    if (snapshot.currentIndex !== null && !snapshot.indexEntries[snapshot.currentIndex]) {
      add(['currentIndex'], 'currentIndex does not name a real index entry');
    }

    if (snapshot.compareValue !== null) {
      if (snapshot.phase === 'index') {
        if (snapshot.currentIndex === null) add(['currentIndex'], 'an index comparison needs a current index entry');
        else if (snapshot.indexEntries[snapshot.currentIndex]?.max !== snapshot.compareValue) {
          add(['compareValue'], 'index comparison must use the entry maximum');
        }
      } else if (snapshot.phase === 'block') {
        if (snapshot.operation === 'block-compare') {
          if (snapshot.currentBlock === null || snapshot.currentPos === null) {
            add(['compareValue'], 'a block comparison needs a block and a position');
          } else {
            const value = snapshot.blocks[snapshot.currentBlock]?.values[snapshot.currentPos];
            if (value !== snapshot.compareValue) add(['compareValue'], 'block comparison must use the value at currentPos');
          }
        } else if (
          snapshot.currentIndex === null ||
          snapshot.indexEntries[snapshot.currentIndex]?.max !== snapshot.compareValue
        ) {
          add(['compareValue'], 'a selection frame must repeat the selected index maximum');
        }
      }
    }

    if (snapshot.operation === 'init') {
      if (snapshot.result !== null) add(['result'], 'init has no result');
      if (snapshot.currentBlock !== null || snapshot.currentPos !== null || snapshot.compareValue !== null) {
        add(['phase'], 'init has no comparison position');
      }
    }
    if (snapshot.operation === 'index-compare') {
      if (snapshot.phase !== 'index') add(['phase'], 'index-compare belongs to the index phase');
      if (snapshot.currentIndex === null) add(['currentIndex'], 'index-compare needs a current index entry');
      if (snapshot.currentBlock !== null || snapshot.currentPos !== null) {
        add(['currentBlock'], 'index-compare has not selected a block yet');
      }
      if (snapshot.compareValue === null) add(['compareValue'], 'index-compare must record the entry max');
      if (snapshot.result !== null) add(['result'], 'index-compare has no final result');
    }
    if (snapshot.operation === 'index-select') {
      if (snapshot.phase !== 'block') add(['phase'], 'index-select opens the block phase');
      if (snapshot.currentIndex === null || snapshot.currentBlock !== snapshot.currentIndex) {
        add(['currentBlock'], 'index-select must enter the same block it selected');
      }
      if (snapshot.currentPos !== null) add(['currentPos'], 'index-select has not compared a block item yet');
      if (snapshot.result !== null) add(['result'], 'index-select is not a result');
    }
    if (snapshot.operation === 'block-compare') {
      if (snapshot.phase !== 'block') add(['phase'], 'block-compare belongs to the block phase');
      if (snapshot.currentIndex === null || snapshot.currentBlock === null || snapshot.currentPos === null) {
        add(['currentBlock'], 'block-compare needs a selected block and a position');
      }
      if (snapshot.currentIndex !== snapshot.currentBlock) {
        add(['currentBlock'], 'the selected block must stay the index-selected block');
      }
      if (snapshot.compareValue === null) add(['compareValue'], 'block-compare must record the compared value');
      if (snapshot.result !== null) add(['result'], 'block-compare has no final result');
    }
    if (snapshot.operation === 'found') {
      if (snapshot.phase !== 'done') add(['phase'], 'found is terminal');
      if (snapshot.result !== 'found') add(['result'], 'found must record success');
      if (snapshot.currentBlock === null || snapshot.currentPos === null) {
        add(['currentPos'], 'found needs the matching block position');
      } else {
        const value = snapshot.blocks[snapshot.currentBlock]?.values[snapshot.currentPos];
        if (value !== snapshot.targetValue) add(['currentPos'], 'found position must hold the target');
      }
    }
    if (snapshot.operation === 'not-found') {
      if (snapshot.phase !== 'done') add(['phase'], 'not-found is terminal');
      if (snapshot.result !== 'not-found') add(['result'], 'not-found must record failure');
    }
    if (snapshot.operation === 'done') {
      if (snapshot.result === null) add(['result'], 'done must report the final result');
      if (snapshot.compareValue !== null) add(['compareValue'], 'done has no active comparison');
      if (snapshot.phase !== 'done') add(['phase'], 'done must close the run');
    }

    if (snapshot.indexComparisons > snapshot.indexEntries.length) {
      add(['indexComparisons'], 'cannot compare more index entries than the table holds');
    }
    if (snapshot.blockComparisons > snapshot.data.length) {
      add(['blockComparisons'], 'block comparisons cannot exceed the record count');
    }
  });

export type BlockSearchSnapshot = z.infer<typeof blockSearchSnapshotSchema>;
