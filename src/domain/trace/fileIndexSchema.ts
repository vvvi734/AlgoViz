/**
 * TEXTBOOK-12: indexed-file lookup over a simulated external store.
 *
 * The file is a sorted record collection partitioned into fixed-capacity blocks.
 * A dense index owns one entry per record; a sparse index owns one entry per
 * block, using the block's first key. A lookup reads the index table once, picks
 * one block, reads that block once, and scans it. All block counters are
 * teaching-model events, not real disk access.
 */
import { z } from 'zod';

export const FILE_INDEX_MIN_RECORDS = 3;
export const FILE_INDEX_MAX_RECORDS = 12;
export const FILE_INDEX_MIN_BLOCKS = 1;
export const FILE_INDEX_MAX_BLOCKS = 6;
export const FILE_INDEX_MIN_BLOCK_CAPACITY = 2;
export const FILE_INDEX_MAX_BLOCK_CAPACITY = 4;

const ID = z.string().regex(/^R\d{1,2}$/);
const BLOCK_ID = z.string().regex(/^B\d$/);

export const FILE_INDEX_KINDS = ['dense', 'sparse'] as const;
export type FileIndexKind = (typeof FILE_INDEX_KINDS)[number];

export const FILE_INDEX_OPERATIONS = [
  'init',
  'index-probe',
  'read-block',
  'compare',
  'found',
  'not-found',
  'done',
] as const;
export type FileIndexOperation = (typeof FILE_INDEX_OPERATIONS)[number];

export const FILE_INDEX_RESULTS = ['found', 'not-found'] as const;

export const fileIndexRecordSchema = z.object({
  id: ID,
  key: z.number().int().min(0).max(9999),
  label: z.string().min(1).max(12),
});

export const fileIndexBlockSchema = z.object({
  id: BLOCK_ID,
  indexKey: z.number().int().min(0).max(9999),
  recordIds: z.array(ID).min(1).max(FILE_INDEX_MAX_BLOCK_CAPACITY),
});

export const fileIndexEntrySchema = z.object({
  key: z.number().int().min(0).max(9999),
  blockId: BLOCK_ID,
});

export const fileIndexSnapshotSchema = z
  .object({
    kind: z.literal('file-index'),
    preset: z.string().max(200).nullable(),
    indexKind: z.enum(FILE_INDEX_KINDS),
    operation: z.enum(FILE_INDEX_OPERATIONS),
    blockCapacity: z.number().int().min(FILE_INDEX_MIN_BLOCK_CAPACITY).max(FILE_INDEX_MAX_BLOCK_CAPACITY),
    targetKey: z.number().int().min(0).max(9999),
    records: z.array(fileIndexRecordSchema).min(FILE_INDEX_MIN_RECORDS).max(FILE_INDEX_MAX_RECORDS),
    blocks: z.array(fileIndexBlockSchema).min(FILE_INDEX_MIN_BLOCKS).max(FILE_INDEX_MAX_BLOCKS),
    indexEntries: z.array(fileIndexEntrySchema).min(1).max(FILE_INDEX_MAX_RECORDS),
    currentIndexIndex: z.number().int().min(0).max(FILE_INDEX_MAX_RECORDS - 1).nullable(),
    currentBlockId: BLOCK_ID.nullable(),
    compareId: ID.nullable(),
    foundId: ID.nullable(),
    indexBlockReads: z.number().int().min(1).max(1),
    dataBlockReads: z.number().int().min(0).max(1),
    indexEntryProbes: z.number().int().min(0).max(FILE_INDEX_MAX_RECORDS * 2),
    result: z.enum(FILE_INDEX_RESULTS).nullable(),
  })
  .superRefine((snapshot, ctx) => {
    const add = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });

    const records = new Map<string, z.infer<typeof fileIndexRecordSchema>>();
    snapshot.records.forEach((record, index) => {
      if (records.has(record.id)) add(['records', index, 'id'], `duplicate record id "${record.id}"`);
      records.set(record.id, record);
      if (index > 0 && snapshot.records[index - 1]!.key >= record.key) {
        add(['records', index, 'key'], 'records must be strictly increasing by key');
      }
    });
    if (records.size !== snapshot.records.length) add(['records'], 'record ids must be unique');

    const blockById = new Map<string, z.infer<typeof fileIndexBlockSchema>>();
    const owners = new Map<string, string>();
    snapshot.blocks.forEach((block, blockIndex) => {
      if (block.id !== `B${blockIndex}`) add(['blocks', blockIndex, 'id'], `block id must be B${blockIndex}`);
      if (blockById.has(block.id)) add(['blocks', blockIndex, 'id'], `duplicate block id "${block.id}"`);
      blockById.set(block.id, block);
      if (block.recordIds.length > snapshot.blockCapacity) {
        add(['blocks', blockIndex, 'recordIds'], 'block exceeds its capacity');
      }
      block.recordIds.forEach((recordId, recordIndex) => {
        const record = records.get(recordId);
        if (!record) {
          add(['blocks', blockIndex, 'recordIds'], `unknown record "${recordId}"`);
          return;
        }
        if (owners.has(recordId)) {
          add(['blocks', blockIndex, 'recordIds'], `record "${recordId}" appears in another block`);
        }
        owners.set(recordId, block.id);
        const previousId = block.recordIds[recordIndex - 1];
        if (previousId !== undefined && records.get(previousId)!.key >= record.key) {
          add(['blocks', blockIndex, 'recordIds'], 'records inside a block must be strictly increasing');
        }
      });
      const lastId = block.recordIds.at(-1);
      if (lastId === undefined || block.indexKey !== records.get(lastId)!.key) {
        add(['blocks', blockIndex, 'indexKey'], 'block indexKey must equal the last record key');
      }
    });
    if (owners.size !== snapshot.records.length) add(['blocks'], 'every record must belong to exactly one block');

    const entryBlockIds = new Set<string>();
    snapshot.indexEntries.forEach((entry, index) => {
      if (index > 0 && snapshot.indexEntries[index - 1]!.key >= entry.key) {
        add(['indexEntries', index, 'key'], 'index entries must be strictly increasing');
      }
      const block = blockById.get(entry.blockId);
      if (!block) {
        add(['indexEntries', index, 'blockId'], `unknown block "${entry.blockId}"`);
        return;
      }
      if (snapshot.indexKind === 'sparse' && entryBlockIds.has(entry.blockId)) {
        add(['indexEntries', index, 'blockId'], `duplicate index entry for block "${entry.blockId}"`);
      }
      entryBlockIds.add(entry.blockId);
      if (snapshot.indexKind === 'sparse') {
        const firstId = block.recordIds[0]!;
        if (entry.key !== records.get(firstId)!.key) {
          add(['indexEntries', index, 'key'], 'a sparse entry must equal the block’s first key');
        }
      } else {
        const matching = block.recordIds.some((recordId) => records.get(recordId)!.key === entry.key);
        if (!matching) add(['indexEntries', index, 'key'], 'a dense entry must key a record inside its block');
      }
    });

    if (snapshot.indexKind === 'dense' && snapshot.indexEntries.length !== snapshot.records.length) {
      add(['indexEntries'], 'a dense index needs exactly one entry per record');
    }
    if (snapshot.indexKind === 'sparse' && snapshot.indexEntries.length !== snapshot.blocks.length) {
      add(['indexEntries'], 'a sparse index needs exactly one entry per block');
    }

    const activeEntry = snapshot.currentIndexIndex === null
      ? null
      : snapshot.indexEntries[snapshot.currentIndexIndex] ?? null;
    if (snapshot.currentIndexIndex !== null && activeEntry === null) {
      add(['currentIndexIndex'], 'current index position is outside the index');
    }
    if (snapshot.currentBlockId !== null && !blockById.has(snapshot.currentBlockId)) {
      add(['currentBlockId'], 'current block is not part of the file');
    }
    if (snapshot.compareId !== null && !records.has(snapshot.compareId)) {
      add(['compareId'], 'compareId must name an existing record');
    }
    if (snapshot.foundId !== null) {
      const record = records.get(snapshot.foundId);
      if (!record) add(['foundId'], 'foundId must name an existing record');
      else if (record.key !== snapshot.targetKey) add(['foundId'], 'found record does not match targetKey');
    }
    if (snapshot.operation === 'compare' && snapshot.compareId === null) {
      add(['compareId'], 'a compare frame needs a record');
    }
    if (snapshot.operation === 'found' && snapshot.foundId === null) {
      add(['foundId'], 'a found frame needs the matching record');
    }
    if (snapshot.indexEntryProbes > snapshot.indexEntries.length) {
      add(['indexEntryProbes'], 'cannot probe more entries than the index contains');
    }

    if (snapshot.operation === 'done') {
      if (snapshot.result === null) add(['result'], 'done must report found or not-found');
      if (snapshot.dataBlockReads !== 1) add(['dataBlockReads'], 'a completed lookup reads one data block');
      if (snapshot.compareId !== null) add(['compareId'], 'done has no active comparison');
      if (snapshot.result === 'found' && snapshot.foundId === null) {
        add(['foundId'], 'found result requires foundId');
      }
      if (snapshot.result === 'not-found' && snapshot.foundId !== null) {
        add(['foundId'], 'not-found result must not name a record');
      }
    } else {
      if (snapshot.result !== null) add(['result'], 'only done may declare a result');
      if (snapshot.dataBlockReads > 1) add(['dataBlockReads'], 'one lookup reads at most one data block');
    }
  });

export type FileIndexSnapshot = z.infer<typeof fileIndexSnapshotSchema>;
