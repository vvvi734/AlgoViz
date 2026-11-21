/**
 * TEXTBOOK-12: ISAM-style index-sequential file over a simulated store.
 *
 * Main blocks are ordered by key and each owns a bounded overflow chain. The
 * top index stores one upper bound (the largest resident key) per main block.
 * A key lookup selects the first bound not below the target (or the final block
 * when the target is larger), reads the main block, then follows only that
 * block's overflow chain. Insertion fills the chosen main block or appends to
 * the chain; index bounds are refreshed in the same frame.
 */
import { z } from 'zod';

export const ISAM_MIN_RECORDS = 4;
export const ISAM_MAX_RECORDS = 18;
export const ISAM_MIN_BLOCKS = 1;
export const ISAM_MAX_BLOCKS = 6;
export const ISAM_MIN_BLOCK_CAPACITY = 2;
export const ISAM_MAX_BLOCK_CAPACITY = 4;
export const ISAM_MAX_OVERFLOW_NODES = 5;

const ID = z.string().regex(/^R\d{1,2}$/);
const BLOCK_ID = z.string().regex(/^B\d$/);
const OVERFLOW_ID = z.string().regex(/^O\d$/);

export const ISAM_COMMANDS = ['find', 'insert'] as const;
export type IsamCommand = (typeof ISAM_COMMANDS)[number];

export const ISAM_OPERATIONS = [
  'init',
  'index-probe',
  'read-main',
  'compare',
  'read-overflow',
  'found',
  'not-found',
  'insert-main',
  'insert-overflow',
  'link-overflow',
  'index-update',
  'done',
] as const;
export type IsamOperation = (typeof ISAM_OPERATIONS)[number];

export const ISAM_RESULTS = ['found', 'not-found', 'inserted'] as const;
export type IsamResult = (typeof ISAM_RESULTS)[number];

export const isamRecordSchema = z.object({
  id: ID,
  key: z.number().int().min(0).max(9999),
  label: z.string().min(1).max(12),
});

export const isamBlockSchema = z.object({
  id: BLOCK_ID,
  indexKey: z.number().int().min(0).max(9999),
  recordIds: z.array(ID).min(1).max(ISAM_MAX_BLOCK_CAPACITY),
  overflowHead: OVERFLOW_ID.nullable(),
});

export const isamIndexEntrySchema = z.object({
  key: z.number().int().min(0).max(9999),
  blockId: BLOCK_ID,
});

export const isamOverflowSchema = z.object({
  id: OVERFLOW_ID,
  blockId: BLOCK_ID,
  recordIds: z.array(ID).min(1).max(ISAM_MAX_BLOCK_CAPACITY),
  nextId: OVERFLOW_ID.nullable(),
});

export const isamSnapshotSchema = z
  .object({
    kind: z.literal('isam'),
    preset: z.string().max(200).nullable(),
    command: z.enum(ISAM_COMMANDS),
    operation: z.enum(ISAM_OPERATIONS),
    blockCapacity: z.number().int().min(ISAM_MIN_BLOCK_CAPACITY).max(ISAM_MAX_BLOCK_CAPACITY),
    targetKey: z.number().int().min(0).max(9999),
    records: z.array(isamRecordSchema).min(ISAM_MIN_RECORDS).max(ISAM_MAX_RECORDS),
    blocks: z.array(isamBlockSchema).min(ISAM_MIN_BLOCKS).max(ISAM_MAX_BLOCKS),
    indexEntries: z.array(isamIndexEntrySchema).min(1).max(ISAM_MAX_BLOCKS),
    overflowNodes: z.array(isamOverflowSchema).max(ISAM_MAX_OVERFLOW_NODES),
    currentIndexIndex: z.number().int().min(0).max(ISAM_MAX_BLOCKS - 1).nullable(),
    selectedBlockId: BLOCK_ID.nullable(),
    currentBlockId: BLOCK_ID.nullable(),
    currentOverflowId: OVERFLOW_ID.nullable(),
    compareId: ID.nullable(),
    foundId: ID.nullable(),
    insertedId: ID.nullable(),
    indexBlockReads: z.number().int().min(1).max(1),
    mainBlockReads: z.number().int().min(0).max(2),
    overflowBlockReads: z.number().int().min(0).max(ISAM_MAX_OVERFLOW_NODES),
    result: z.enum(ISAM_RESULTS).nullable(),
  })
  .superRefine((snapshot, ctx) => {
    const add = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });

    const records = new Map<string, z.infer<typeof isamRecordSchema>>();
    snapshot.records.forEach((record, index) => {
      if (records.has(record.id)) add(['records', index, 'id'], `duplicate record id "${record.id}"`);
      records.set(record.id, record);
    });
    if (records.size !== snapshot.records.length) add(['records'], 'record ids must be unique');
    if (new Set(snapshot.records.map((record) => record.key)).size !== snapshot.records.length) {
      add(['records'], 'keys of resident records must be unique');
    }

    const blockById = new Map<string, z.infer<typeof isamBlockSchema>>();
    const assigned = new Map<string, string>();
    snapshot.blocks.forEach((block, blockIndex) => {
      if (block.id !== `B${blockIndex}`) add(['blocks', blockIndex, 'id'], `block id must be B${blockIndex}`);
      if (blockById.has(block.id)) add(['blocks', blockIndex, 'id'], `duplicate block "${block.id}"`);
      blockById.set(block.id, block);
      if (block.recordIds.length > snapshot.blockCapacity) {
        add(['blocks', blockIndex, 'recordIds'], 'main block exceeds its capacity');
      }
      block.recordIds.forEach((recordId, recordIndex) => {
        const record = records.get(recordId);
        if (!record) {
          add(['blocks', blockIndex, 'recordIds'], `unknown record "${recordId}"`);
          return;
        }
        if (assigned.has(recordId)) {
          add(['blocks', blockIndex, 'recordIds'], `record "${recordId}" is stored twice`);
        }
        assigned.set(recordId, block.id);
        const previousId = block.recordIds[recordIndex - 1];
        if (previousId !== undefined && records.get(previousId)!.key >= record.key) {
          add(['blocks', blockIndex, 'recordIds'], 'main-block records must be strictly increasing');
        }
      });
    });
    if (assigned.size !== snapshot.records.length && snapshot.overflowNodes.length === 0) {
      add(['blocks'], 'every record must be in a main block or an overflow chain');
    }

    const overflowById = new Map<string, z.infer<typeof isamOverflowSchema>>();
    snapshot.overflowNodes.forEach((node, nodeIndex) => {
      if (node.id !== `O${nodeIndex}`) add(['overflowNodes', nodeIndex, 'id'], `overflow id must be O${nodeIndex}`);
      if (overflowById.has(node.id)) add(['overflowNodes', nodeIndex, 'id'], `duplicate overflow node "${node.id}"`);
      overflowById.set(node.id, node);
      const block = blockById.get(node.blockId);
      if (!block) add(['overflowNodes', nodeIndex, 'blockId'], `unknown main block "${node.blockId}"`);
      if (node.recordIds.length > snapshot.blockCapacity) {
        add(['overflowNodes', nodeIndex, 'recordIds'], 'overflow node exceeds its capacity');
      }
      node.recordIds.forEach((recordId, recordIndex) => {
        const record = records.get(recordId);
        if (!record) {
          add(['overflowNodes', nodeIndex, 'recordIds'], `unknown overflow record "${recordId}"`);
          return;
        }
        if (assigned.has(recordId)) {
          add(['overflowNodes', nodeIndex, 'recordIds'], `record "${recordId}" is stored twice`);
        }
        assigned.set(recordId, node.blockId);
        const previousId = node.recordIds[recordIndex - 1];
        if (previousId !== undefined && records.get(previousId)!.key >= record.key) {
          add(['overflowNodes', nodeIndex, 'recordIds'], 'overflow records must be strictly increasing');
        }
      });
    });
    if (assigned.size !== snapshot.records.length) add(['records'], 'every record must be stored exactly once');

    const chains = new Map<string, string>();
    snapshot.overflowNodes.forEach((node, nodeIndex) => {
      if (node.nextId !== null && !overflowById.has(node.nextId)) {
        add(['overflowNodes', nodeIndex, 'nextId'], `next "${node.nextId}" is not an overflow node`);
      }
      if (node.nextId !== null) {
        const next = overflowById.get(node.nextId)!;
        if (next.blockId !== node.blockId) add(['overflowNodes', nodeIndex, 'nextId'], 'overflow links cannot cross blocks');
      }
      chains.set(node.blockId, node.id);
    });

    snapshot.blocks.forEach((block, blockIndex) => {
      if (block.overflowHead !== (chains.get(block.id) ?? null)) {
        add(['blocks', blockIndex, 'overflowHead'], 'overflowHead must name the chain’s first node');
      }
      let cursor = block.overflowHead;
      const visited = new Set<string>();
      while (cursor !== null) {
        if (visited.has(cursor)) {
          add(['overflowNodes'], 'overflow chain contains a cycle');
          break;
        }
        visited.add(cursor);
        cursor = overflowById.get(cursor)?.nextId ?? null;
      }
    });

    snapshot.indexEntries.forEach((entry, index) => {
      if (index > 0 && snapshot.indexEntries[index - 1]!.key >= entry.key) {
        add(['indexEntries', index, 'key'], 'index upper bounds must be strictly increasing');
      }
      const block = blockById.get(entry.blockId);
      if (!block) {
        add(['indexEntries', index, 'blockId'], `unknown block "${entry.blockId}"`);
        return;
      }
      const resident = block.recordIds.concat(
        snapshot.overflowNodes
          .filter((node) => node.blockId === block.id)
          .flatMap((node) => node.recordIds),
      );
      const maxKey = Math.max(...resident.map((recordId) => records.get(recordId)!.key));
      if (entry.key !== maxKey) {
        add(['indexEntries', index, 'key'], 'index bound must equal the largest key stored for its block');
      }
    });
    if (snapshot.indexEntries.length !== snapshot.blocks.length) {
      add(['indexEntries'], 'ISAM needs exactly one upper bound per main block');
    }

    const targetBlock = (() => {
      const hit = snapshot.indexEntries.find((entry) => entry.key >= snapshot.targetKey);
      return (hit ?? snapshot.indexEntries.at(-1))?.blockId ?? null;
    })();
    if (snapshot.selectedBlockId !== null && snapshot.selectedBlockId !== targetBlock) {
      add(['selectedBlockId'], 'selected block does not match the index upper bounds');
    }
    if (snapshot.currentIndexIndex !== null) {
      const entry = snapshot.indexEntries[snapshot.currentIndexIndex];
      if (!entry) add(['currentIndexIndex'], 'current index position is outside the index');
      else if (snapshot.selectedBlockId !== entry.blockId) {
        add(['selectedBlockId'], 'selected block must be the entry at currentIndexIndex');
      }
    }
    if (snapshot.currentBlockId !== null && !blockById.has(snapshot.currentBlockId)) {
      add(['currentBlockId'], 'current block is not in the file');
    }
    if (snapshot.currentOverflowId !== null && !overflowById.has(snapshot.currentOverflowId)) {
      add(['currentOverflowId'], 'current overflow node is not attached');
    }
    if (snapshot.compareId !== null) {
      if (!records.has(snapshot.compareId)) add(['compareId'], 'compareId must name a record');
      else if (!assigned.has(snapshot.compareId)) add(['compareId'], 'compareId is not stored in this file');
    }
    if (snapshot.foundId !== null) {
      const record = records.get(snapshot.foundId);
      if (!record) add(['foundId'], 'foundId must name a record');
      else if (record.key !== snapshot.targetKey) add(['foundId'], 'found record does not match targetKey');
    }
    if (snapshot.operation === 'compare' && snapshot.compareId === null) {
      add(['compareId'], 'a compare frame needs a record');
    }
    if ((snapshot.operation === 'insert-main' || snapshot.operation === 'insert-overflow') && snapshot.insertedId === null) {
      add(['insertedId'], 'an insertion frame needs the inserted record');
    }
    if (snapshot.insertedId !== null) {
      const record = records.get(snapshot.insertedId);
      if (!record) add(['insertedId'], 'insertedId must name a record');
      else if (record.key !== snapshot.targetKey && snapshot.command === 'insert') {
        add(['insertedId'], 'inserted record must have the requested targetKey');
      }
    }

    if (snapshot.operation === 'index-probe' && snapshot.selectedBlockId === null) {
      add(['selectedBlockId'], 'an index probe must select a block');
    }
    if (snapshot.operation === 'read-main' && snapshot.currentBlockId === null) {
      add(['currentBlockId'], 'a main-block read needs currentBlockId');
    }
    if (snapshot.operation === 'read-overflow' && snapshot.currentOverflowId === null) {
      add(['currentOverflowId'], 'an overflow read needs currentOverflowId');
    }
    if (snapshot.mainBlockReads > 2) add(['mainBlockReads'], 'one operation reads at most two main blocks');

    if (snapshot.operation === 'done') {
      if (snapshot.result === null) add(['result'], 'done must report a result');
      if (snapshot.mainBlockReads !== 1) add(['mainBlockReads'], 'a completed ISAM operation reads one main block');
      if (snapshot.compareId !== null) add(['compareId'], 'done has no active comparison');
      if (snapshot.currentOverflowId !== null) add(['currentOverflowId'], 'done has no active overflow node');
      if (snapshot.selectedBlockId === null) add(['selectedBlockId'], 'done must retain the selected block');
      if (snapshot.result === 'found' && snapshot.foundId === null) add(['foundId'], 'found requires a record');
      if (snapshot.result === 'not-found' && snapshot.foundId !== null) add(['foundId'], 'not-found cannot name a record');
      if (snapshot.result === 'inserted') {
        if (snapshot.command !== 'insert') add(['result'], 'inserted result requires insert command');
        if (snapshot.insertedId === null || snapshot.foundId !== snapshot.insertedId) {
          add(['foundId'], 'an inserted result must re-find the inserted record');
        }
      }
      if (snapshot.command === 'insert' && snapshot.result !== 'inserted') {
        add(['result'], 'insert command must end with inserted');
      }
      if (snapshot.command === 'find' && snapshot.result === 'inserted') {
        add(['result'], 'find command cannot report inserted');
      }
    } else {
      if (snapshot.result !== null) add(['result'], 'only done may declare a result');
    }
  });

export type IsamSnapshot = z.infer<typeof isamSnapshotSchema>;
