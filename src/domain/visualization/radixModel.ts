/**
 * TEXTBOOK-10: LSD decimal radix visual model. The order before distribution,
 * ten FIFO bucket columns and the collected prefix are all explicit so the
 * animation never has to infer why a pass changed the sequence.
 */
import type { RadixSnapshot } from '../trace/radixSchema';

export const RADIX_WIDTH = 1060;
export const RADIX_BUCKET_WIDTH = 92;

export interface RadixRecordModel {
  id: string;
  label: string;
  value: number;
  originalIndex: number;
  digit: number | null;
  state: 'idle' | 'current' | 'in-bucket' | 'collected';
}

export interface RadixBucketModel {
  digit: number;
  records: RadixRecordModel[];
  active: boolean;
}

export interface RadixVisualModel {
  kind: 'radix';
  operation: RadixSnapshot['operation'];
  records: RadixRecordModel[];
  order: RadixRecordModel[];
  buckets: RadixBucketModel[];
  collected: RadixRecordModel[];
  pass: number;
  maxDigits: number;
  digitPower: number;
  currentId: string | null;
  currentBucket: number | null;
  currentDigit: number | null;
  result: RadixSnapshot['result'];
  width: number;
}

export function radixRecordLabel(value: number, id: string): string {
  return `${value} · ${id}`;
}

export function buildRadixModel(snapshot: RadixSnapshot): RadixVisualModel {
  const byId = new Map(snapshot.records.map((record) => [record.id, record]));
  const currentDigit = snapshot.currentDigit;
  const inBucket = new Set(
    snapshot.buckets.flat().filter((id) => id !== snapshot.currentId),
  );
  const collected = new Set(snapshot.collected);

  const decorate = (id: string, state: RadixRecordModel['state']): RadixRecordModel => {
    const record = byId.get(id)!;
    const digit = snapshot.digitPower > 0
      ? Math.floor(record.value / snapshot.digitPower) % 10
      : null;
    return {
      id,
      label: record.id,
      value: record.value,
      originalIndex: record.originalIndex,
      digit: snapshot.currentDigit === null ? null : digit,
      state,
    };
  };

  const records: RadixRecordModel[] = snapshot.records.map((record) => {
    const state: RadixRecordModel['state'] = snapshot.currentId === record.id
      ? 'current'
      : collected.has(record.id)
        ? 'collected'
        : inBucket.has(record.id)
          ? 'in-bucket'
          : 'idle';
    return {
      id: record.id,
      label: record.id,
      value: record.value,
      originalIndex: record.originalIndex,
      digit: currentDigit === null ? null : Math.floor(record.value / snapshot.digitPower) % 10,
      state,
    };
  });

  return {
    kind: 'radix',
    operation: snapshot.operation,
    records,
    order: snapshot.order.map((id) => decorate(
      id,
      snapshot.currentId === id ? 'current' : collected.has(id) ? 'collected' : 'idle',
    )),
    buckets: snapshot.buckets.map((ids, digit) => ({
      digit,
      records: ids.map((id) => decorate(
        id,
        snapshot.currentId === id
          ? 'current'
          : snapshot.currentBucket === digit
            ? 'in-bucket'
            : 'idle',
      )),
      active: snapshot.currentBucket === digit,
    })),
    collected: snapshot.collected.map((id) => decorate(
      id,
      snapshot.currentId === id ? 'current' : 'collected',
    )),
    pass: snapshot.pass,
    maxDigits: snapshot.maxDigits,
    digitPower: snapshot.digitPower,
    currentId: snapshot.currentId,
    currentBucket: snapshot.currentBucket,
    currentDigit: snapshot.currentDigit,
    result: snapshot.result,
    width: RADIX_WIDTH,
  };
}
