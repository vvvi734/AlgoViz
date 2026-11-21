/**
 * TEXTBOOK-12: inverted-index construction and set queries.
 *
 * Input records carry an already-segmented keyword list; no tokenizer is
 * simulated. Construction scans every record and appends its id to each term's
 * posting list. A query then reads one posting list per term and applies set
 * intersection (AND) or union (OR), preserving the record order for display.
 */
import { z } from 'zod';

export const INVERTED_MIN_RECORDS = 2;
export const INVERTED_MAX_RECORDS = 9;
export const INVERTED_MAX_KEYWORDS_PER_RECORD = 4;
export const INVERTED_MAX_QUERY_TERMS = 4;
export const INVERTED_MAX_TERM_LENGTH = 16;

const RECORD_ID = z.string().regex(/^R[1-9]\d?$/);
const TERM = z.string().min(1).max(INVERTED_MAX_TERM_LENGTH);

export const INVERTED_MODES = ['and', 'or'] as const;
export type InvertedMode = (typeof INVERTED_MODES)[number];

export const INVERTED_OPERATIONS = [
  'init',
  'scan-record',
  'term-add',
  'build-done',
  'query-term',
  'combine',
  'done',
] as const;
export type InvertedOperation = (typeof INVERTED_OPERATIONS)[number];

export const INVERTED_RESULTS = ['matched', 'empty'] as const;
export type InvertedResult = (typeof INVERTED_RESULTS)[number];

export const invertedRecordSchema = z.object({
  id: RECORD_ID,
  keywords: z.array(TERM).min(1).max(INVERTED_MAX_KEYWORDS_PER_RECORD),
});

export const invertedEntrySchema = z.object({
  term: TERM,
  postings: z.array(RECORD_ID).max(INVERTED_MAX_RECORDS),
});

export const invertedSnapshotSchema = z
  .object({
    kind: z.literal('inverted-index'),
    preset: z.string().max(200).nullable(),
    operation: z.enum(INVERTED_OPERATIONS),
    mode: z.enum(INVERTED_MODES),
    records: z.array(invertedRecordSchema).min(INVERTED_MIN_RECORDS).max(INVERTED_MAX_RECORDS),
    index: z.array(invertedEntrySchema).min(1).max(40),
    builtCount: z.number().int().min(0).max(INVERTED_MAX_RECORDS),
    currentRecordId: RECORD_ID.nullable(),
    currentKeyword: TERM.nullable(),
    queryTerms: z.array(TERM).min(1).max(INVERTED_MAX_QUERY_TERMS),
    currentTerm: TERM.nullable(),
    termPostings: z.array(RECORD_ID).max(INVERTED_MAX_RECORDS),
    matchedIds: z.array(RECORD_ID).max(INVERTED_MAX_RECORDS),
    result: z.enum(INVERTED_RESULTS).nullable(),
  })
  .superRefine((snapshot, ctx) => {
    const add = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });

    const recordById = new Map<string, z.infer<typeof invertedRecordSchema>>();
    const order = new Map<string, number>();
    snapshot.records.forEach((record, index) => {
      if (recordById.has(record.id)) add(['records', index, 'id'], `duplicate record id "${record.id}"`);
      recordById.set(record.id, record);
      order.set(record.id, index);
      if (new Set(record.keywords).size !== record.keywords.length) {
        add(['records', index, 'keywords'], 'keywords inside a record must be unique');
      }
    });
    if (recordById.size !== snapshot.records.length) add(['records'], 'record ids must be unique');

    const expectedTerms = [...new Set(snapshot.records.flatMap((record) => record.keywords))];
    if (snapshot.index.length !== expectedTerms.length) {
      add(['index'], 'index must contain every distinct keyword exactly once');
    }
    const indexByTerm = new Map<string, z.infer<typeof invertedEntrySchema>>();
    snapshot.index.forEach((entry, index) => {
      if (indexByTerm.has(entry.term)) add(['index', index, 'term'], `duplicate term "${entry.term}"`);
      indexByTerm.set(entry.term, entry);
      if (!expectedTerms.includes(entry.term)) add(['index', index, 'term'], `term "${entry.term}" never appears`);
      entry.postings.forEach((recordId, postingIndex) => {
        const record = recordById.get(recordId);
        if (!record) {
          add(['index', index, 'postings'], `unknown record "${recordId}"`);
          return;
        }
        if (!record.keywords.includes(entry.term)) {
          add(['index', index, 'postings'], `record "${recordId}" does not contain "${entry.term}"`);
        }
        if (postingIndex > 0 && order.get(entry.postings[postingIndex - 1]!)! >= order.get(recordId)!) {
          add(['index', index, 'postings'], 'posting lists must follow record order');
        }
      });
    });
    if (indexByTerm.size !== expectedTerms.length) add(['index'], 'index must be unique by term');
    if (snapshot.builtCount < 0 || snapshot.builtCount > snapshot.records.length) {
      add(['builtCount'], 'builtCount is outside the record range');
    }
    if (new Set(snapshot.queryTerms).size !== snapshot.queryTerms.length) {
      add(['queryTerms'], 'query terms must be unique');
    }

    if (snapshot.currentRecordId !== null) {
      if (!recordById.has(snapshot.currentRecordId)) {
        add(['currentRecordId'], 'currentRecordId must name a record');
      } else {
        const position = order.get(snapshot.currentRecordId)!;
        if (position >= snapshot.builtCount) add(['builtCount'], 'current record must already be counted as built');
      }
    }
    if (snapshot.operation === 'term-add' && snapshot.currentKeyword === null) {
      add(['currentKeyword'], 'term-add needs the current keyword');
    }
    if (snapshot.currentKeyword !== null && snapshot.currentRecordId !== null) {
      const record = recordById.get(snapshot.currentRecordId)!;
      if (!record.keywords.includes(snapshot.currentKeyword)) {
        add(['currentKeyword'], 'current keyword is absent from the current record');
      }
    }
    snapshot.termPostings.forEach((recordId) => {
      if (!recordById.has(recordId)) add(['termPostings'], `unknown posting "${recordId}"`);
      if (snapshot.currentTerm !== null && !recordById.get(recordId)!.keywords.includes(snapshot.currentTerm)) {
        add(['termPostings'], 'current posting does not contain the current term');
      }
    });
    if (snapshot.termPostings.length > 0 && snapshot.currentTerm === null) {
      add(['termPostings'], 'postings require a current term');
    }
    snapshot.matchedIds.forEach((recordId, index) => {
      if (!recordById.has(recordId)) add(['matchedIds', index], `unknown matched record "${recordId}"`);
      if (index > 0 && order.get(snapshot.matchedIds[index - 1]!)! >= order.get(recordId)!) {
        add(['matchedIds', index], 'matched records must follow record order');
      }
    });

    const buildOps = new Set(['init', 'scan-record', 'term-add', 'build-done']);
    if (buildOps.has(snapshot.operation)) {
      if (snapshot.matchedIds.length !== 0) add(['matchedIds'], 'build frames cannot contain query results');
      if (snapshot.currentTerm !== null || snapshot.termPostings.length !== 0) {
        add(['currentTerm'], 'build frames do not have an active query term');
      }
    }
    if (snapshot.operation === 'build-done') {
      if (snapshot.builtCount !== snapshot.records.length) add(['builtCount'], 'build-done requires every record scanned');
      if (snapshot.currentRecordId !== null) add(['currentRecordId'], 'build-done clears the scan cursor');
      const exact = snapshot.index.every((entry) => {
        const expected = snapshot.records
          .filter((record) => record.keywords.includes(entry.term))
          .map((record) => record.id);
        return entry.postings.join(',') === expected.join(',');
      });
      if (!exact) add(['index'], 'completed index must exactly match every keyword’s postings');
    }
    if (snapshot.operation === 'done') {
      if (snapshot.result === null) add(['result'], 'done must report matched or empty');
      if (snapshot.builtCount !== snapshot.records.length) add(['builtCount'], 'done requires a complete index build');
      if (snapshot.termPostings.length !== 0) add(['termPostings'], 'done clears transient postings');
      if (snapshot.currentTerm !== null) add(['currentTerm'], 'done clears the active query term');
      const expected = (() => {
        let result: string[] | null = null;
        for (const term of snapshot.queryTerms) {
          const postings = snapshot.records
            .filter((record) => record.keywords.includes(term))
            .map((record) => record.id);
          if (result === null) result = postings;
          else if (snapshot.mode === 'and') result = result.filter((id) => postings.includes(id));
          else result = snapshot.records
            .filter((record) => result!.includes(record.id) || postings.includes(record.id))
            .map((record) => record.id);
        }
        return result ?? [];
      })();
      if (snapshot.matchedIds.join(',') !== expected.join(',')) {
        add(['matchedIds'], 'final matches do not equal the requested AND/OR query');
      }
      const empty = snapshot.matchedIds.length === 0;
      if (empty !== (snapshot.result === 'empty')) add(['result'], 'result must reflect whether matches are empty');
    } else if (snapshot.result !== null) {
      add(['result'], 'only done may declare a result');
    }
  });

export type InvertedSnapshot = z.infer<typeof invertedSnapshotSchema>;
