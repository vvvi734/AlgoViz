/**
 * TEXTBOOK-10: LSD decimal radix-sort snapshots.
 *
 * The course uses ten buckets and non-negative integers in 0..9999. A pass
 * distributes the current order from the least significant digit upward, then
 * collect 0..9. Buckets are FIFO queues, so every pass is stable; `order` only
 * changes after a complete collection. Duplicate values retain their original
 * identities in the final sequence.
 */
import { z } from 'zod';

const RECORD_ID = z.string().regex(/^[A-P]$/);
export const RADIX_MAX_RECORDS = 16;
export const RADIX_MAX_DIGITS = 4;
export const RADIX_MAX_VALUE = 9999;
export const RADIX_BUCKETS = 10;

export const RADIX_OPERATIONS = [
  'init', 'digit-start', 'distribute', 'collect', 'pass-end', 'done',
] as const;
export type RadixOperation = (typeof RADIX_OPERATIONS)[number];

export const RADIX_RESULTS = ['sorted'] as const;
export type RadixResult = (typeof RADIX_RESULTS)[number];

export const radixRecordSchema = z.object({
  id: RECORD_ID,
  value: z.number().int().min(0).max(RADIX_MAX_VALUE),
  originalIndex: z.number().int().min(0).max(RADIX_MAX_RECORDS - 1),
});
export type RadixRecord = z.infer<typeof radixRecordSchema>;

export const radixSnapshotSchema = z
  .object({
    kind: z.literal('radix'),
    preset: z.string().max(200).nullable(),
    operation: z.enum(RADIX_OPERATIONS),
    records: z.array(radixRecordSchema).min(1).max(RADIX_MAX_RECORDS),
    order: z.array(RECORD_ID).min(1).max(RADIX_MAX_RECORDS),
    buckets: z.array(z.array(RECORD_ID).max(RADIX_MAX_RECORDS)).length(RADIX_BUCKETS),
    collected: z.array(RECORD_ID).max(RADIX_MAX_RECORDS),
    pass: z.number().int().min(0).max(RADIX_MAX_DIGITS - 1),
    maxDigits: z.number().int().min(1).max(RADIX_MAX_DIGITS),
    digitPower: z.number().int().min(1).max(1000),
    currentId: RECORD_ID.nullable(),
    currentBucket: z.number().int().min(0).max(RADIX_BUCKETS - 1).nullable(),
    currentDigit: z.number().int().min(0).max(9).nullable(),
    result: z.enum(RADIX_RESULTS).nullable(),
  })
  .superRefine((snapshot, ctx) => {
    const add = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });

    const recordsById = new Map<string, RadixRecord>();
    snapshot.records.forEach((record, index) => {
      if (recordsById.has(record.id)) add(['records', index, 'id'], `duplicate record id "${record.id}"`);
      recordsById.set(record.id, record);
      if (record.originalIndex !== index) {
        add(['records', index, 'originalIndex'], 'records must stay in original identity order');
      }
    });

    const uniqueAll = (ids: string[]) => new Set(ids).size === ids.length;
    if (!uniqueAll(snapshot.order)) add(['order'], 'order cannot repeat a record');
    if (snapshot.order.some((id) => !recordsById.has(id))) add(['order'], 'order ids must be real records');
    if (snapshot.order.length !== snapshot.records.length) add(['order'], 'order must contain every record');
    if (snapshot.collected.some((id) => !recordsById.has(id))) add(['collected'], 'collected ids must be real records');
    if (!uniqueAll(snapshot.collected)) add(['collected'], 'collected cannot repeat a record');

    const bucketIds = snapshot.buckets.flat();
    if (!uniqueAll(bucketIds)) add(['buckets'], 'a record cannot appear in two buckets');
    if (bucketIds.some((id) => !recordsById.has(id))) add(['buckets'], 'bucket ids must be real records');
    const bucketConcat = snapshot.buckets.flat();
    const processed = bucketIds.length;

    const maxDigits = Math.max(
      1,
      ...snapshot.records.map((record) => String(record.value).length),
    );
    if (snapshot.maxDigits !== maxDigits) add(['maxDigits'], 'maxDigits must match the widest real value');
    if (snapshot.digitPower !== 10 ** snapshot.pass) add(['digitPower'], 'digitPower must equal 10^pass');
    if (snapshot.records.some((record) => String(record.value).length > snapshot.maxDigits)) {
      add(['maxDigits'], 'a record is wider than maxDigits');
    }

    const digitOf = (id: string): number =>
      Math.floor(recordsById.get(id)!.value / snapshot.digitPower) % 10;
    const stableOrderByDigits = (digits: number): string[] =>
      [...snapshot.records]
        .sort(
          (a, b) =>
            (a.value % 10 ** digits) - (b.value % 10 ** digits) ||
            a.originalIndex - b.originalIndex,
        )
        .map((record) => record.id);
    const expectedFinal = [...snapshot.records]
      .sort((a, b) => a.value - b.value || a.originalIndex - b.originalIndex)
      .map((record) => record.id);

    if (snapshot.operation === 'init') {
      if (snapshot.pass !== 0 || snapshot.digitPower !== 1) add(['pass'], 'init starts at the units digit');
      if (JSON.stringify(snapshot.order) !== JSON.stringify(snapshot.records.map((r) => r.id))) {
        add(['order'], 'init preserves the original input order');
      }
      if (processed !== 0 || snapshot.collected.length !== 0) add(['buckets'], 'init has empty buckets');
      if (snapshot.currentId !== null || snapshot.currentBucket !== null || snapshot.currentDigit !== null) {
        add(['currentId'], 'init has no current record or bucket');
      }
      if (snapshot.result !== null) add(['result'], 'init has no result');
    }

    if (snapshot.operation === 'digit-start') {
      if (JSON.stringify(snapshot.order) !== JSON.stringify(stableOrderByDigits(snapshot.pass))) {
        add(['order'], 'a new pass starts from the stable order of the lower digits');
      }
      if (processed !== 0 || snapshot.collected.length !== 0) add(['buckets'], 'a new pass starts with empty buckets');
      if (snapshot.currentId !== null || snapshot.currentBucket !== null || snapshot.currentDigit !== null) {
        add(['currentId'], 'digit-start has no current record');
      }
      if (snapshot.result !== null) add(['result'], 'digit-start has no result');
    }

    if (snapshot.operation === 'distribute') {
      if (processed < 1 || processed > snapshot.order.length) {
        add(['buckets'], 'distribute appends exactly one record');
      }
      const expectedBuckets: string[][] = Array.from({ length: RADIX_BUCKETS }, () => []);
      snapshot.order.slice(0, processed).forEach((id) => expectedBuckets[digitOf(id)]!.push(id));
      if (JSON.stringify(snapshot.buckets) !== JSON.stringify(expectedBuckets)) {
        add(['buckets'], 'buckets must be stable FIFO groups of the processed prefix');
      }
      if (snapshot.currentId !== snapshot.order[processed - 1]) {
        add(['currentId'], 'currentId must be the record just distributed');
      }
      const digit = snapshot.currentId === null ? null : digitOf(snapshot.currentId);
      if (snapshot.currentBucket !== digit || snapshot.currentDigit !== digit) {
        add(['currentBucket'], 'current bucket and digit must match the current record');
      }
      if (snapshot.collected.length !== 0) add(['collected'], 'distribution has not collected yet');
      if (JSON.stringify(snapshot.order) !== JSON.stringify(stableOrderByDigits(snapshot.pass))) {
        add(['order'], 'distribution does not change the current order');
      }
      if (snapshot.result !== null) add(['result'], 'distribute has no result');
    }

    if (snapshot.operation === 'collect') {
      if (processed !== snapshot.order.length) add(['buckets'], 'collection needs a full distribution');
      if (snapshot.currentId !== null) add(['currentId'], 'collection advances by bucket, not record');
      if (snapshot.currentBucket === null) add(['currentBucket'], 'collect names the bucket being appended');
      const expectedCollected = snapshot.buckets
        .slice(0, (snapshot.currentBucket ?? 0) + 1)
        .flat();
      if (JSON.stringify(snapshot.collected) !== JSON.stringify(expectedCollected)) {
        add(['collected'], 'collected must be the concatenation through the current bucket');
      }
      if (snapshot.currentDigit !== snapshot.currentBucket) {
        add(['currentDigit'], 'collect highlights the current bucket number');
      }
      if (JSON.stringify(snapshot.order) !== JSON.stringify(stableOrderByDigits(snapshot.pass))) {
        add(['order'], 'collection keeps the old order until it finishes');
      }
      if (snapshot.result !== null) add(['result'], 'collect has no result');
    }

    if (snapshot.operation === 'pass-end') {
      if (processed !== snapshot.order.length) add(['buckets'], 'pass-end needs every record distributed');
      if (JSON.stringify(snapshot.order) !== JSON.stringify(bucketConcat)) {
        add(['order'], 'pass-end adopts exactly the collected bucket order');
      }
      if (!snapshot.order.every((id) => snapshot.collected.includes(id))) {
        add(['collected'], 'pass-end keeps the full collected sequence');
      }
      if (JSON.stringify(snapshot.order) !== JSON.stringify(stableOrderByDigits(snapshot.pass + 1))) {
        add(['order'], 'stable LSD after this pass must order the lower digits');
      }
      if (snapshot.currentId !== null || snapshot.currentBucket !== null || snapshot.currentDigit !== null) {
        add(['currentId'], 'pass-end has no current record');
      }
      if (snapshot.result !== null) add(['result'], 'pass-end has no result');
    }

    if (snapshot.operation !== 'pass-end' && snapshot.operation !== 'done') {
      if (snapshot.collected.some((id) => !snapshot.order.includes(id))) {
        add(['collected'], 'partial collection must come from the current order');
      }
    }

    if (snapshot.operation === 'done') {
      if (snapshot.result !== 'sorted') add(['result'], 'done reports sorted');
      if (JSON.stringify(snapshot.order) !== JSON.stringify(expectedFinal)) {
        add(['order'], 'done must be the stable ascending order');
      }
      if (processed !== snapshot.records.length) add(['buckets'], 'done keeps the final pass buckets');
      if (JSON.stringify(snapshot.collected) !== JSON.stringify(expectedFinal)) {
        add(['collected'], 'done keeps the final collected sequence');
      }
      if (snapshot.currentId !== null || snapshot.currentBucket !== null || snapshot.currentDigit !== null) {
        add(['currentId'], 'done has no current record');
      }
    } else if (snapshot.result !== null) {
      add(['result'], 'only done reports sorted');
    }
  });

export type RadixSnapshot = z.infer<typeof radixSnapshotSchema>;
