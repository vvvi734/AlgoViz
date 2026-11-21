/**
 * TEXTBOOK-11: replacement-selection snapshots.
 *
 * The workspace is a fixed number of real slots. Eligible records may still
 * belong to the current run (`value >= lastOutput`); records below that
 * threshold are frozen for the next run. At the end of a run every frozen
 * record is unfrozen together, so the next run can be longer than the workspace.
 */
import { z } from 'zod';

const RECORD_ID = z.string().regex(/^[A-T]$/);
export const REPLACEMENT_MAX_RECORDS = 20;
export const REPLACEMENT_MIN_CAPACITY = 2;
export const REPLACEMENT_MAX_CAPACITY = 6;

export const REPLACEMENT_OPERATIONS = [
  'init', 'select', 'output', 'read', 'freeze', 'segment-end', 'advance', 'done',
] as const;
export type ReplacementOperation = (typeof REPLACEMENT_OPERATIONS)[number];
export const REPLACEMENT_RESULTS = ['runs-ready'] as const;

export const replacementRecordSchema = z.object({
  id: RECORD_ID,
  value: z.number().int().min(-1_000_000).max(1_000_000),
  originalIndex: z.number().int().min(0).max(REPLACEMENT_MAX_RECORDS - 1),
});

export const replacementSlotSchema = z.object({
  recordId: RECORD_ID.nullable(),
  state: z.enum(['empty', 'eligible', 'frozen']),
});

export const replacementSnapshotSchema = z
  .object({
    kind: z.literal('replacement'),
    preset: z.string().max(200).nullable(),
    operation: z.enum(REPLACEMENT_OPERATIONS),
    records: z.array(replacementRecordSchema).min(1).max(REPLACEMENT_MAX_RECORDS),
    workspaceCapacity: z.number().int().min(REPLACEMENT_MIN_CAPACITY).max(REPLACEMENT_MAX_CAPACITY),
    workspace: z.array(replacementSlotSchema).max(REPLACEMENT_MAX_CAPACITY),
    eligibleIds: z.array(RECORD_ID).max(REPLACEMENT_MAX_CAPACITY),
    frozenIds: z.array(RECORD_ID).max(REPLACEMENT_MAX_CAPACITY),
    inputIndex: z.number().int().min(0).max(REPLACEMENT_MAX_RECORDS),
    lastOutput: z.number().int().min(-1_000_000).max(1_000_000).nullable(),
    currentId: RECORD_ID.nullable(),
    newId: RECORD_ID.nullable(),
    currentRun: z.array(RECORD_ID).max(REPLACEMENT_MAX_RECORDS),
    runs: z.array(z.array(RECORD_ID).min(1).max(REPLACEMENT_MAX_RECORDS)).max(REPLACEMENT_MAX_RECORDS),
    result: z.enum(REPLACEMENT_RESULTS).nullable(),
  })
  .superRefine((snapshot, ctx) => {
    const add = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
    const records = new Map<string, z.infer<typeof replacementRecordSchema>>();
    snapshot.records.forEach((record, index) => {
      if (records.has(record.id)) add(['records', index, 'id'], `duplicate record id "${record.id}"`);
      records.set(record.id, record);
      if (record.originalIndex !== index) add(['records', index], 'records must be in identity order');
    });
    if (records.size !== snapshot.records.length) add(['records'], 'record ids must be unique');

    if (snapshot.workspace.length !== snapshot.workspaceCapacity) {
      add(['workspace'], `workspace must contain exactly ${snapshot.workspaceCapacity} slots`);
    }
    const slotIds = snapshot.workspace
      .map((slot) => slot.recordId)
      .filter((id): id is string => id !== null);
    if (new Set(slotIds).size !== slotIds.length) add(['workspace'], 'a record occupies one slot');
    const expectedEligible: string[] = [];
    const expectedFrozen: string[] = [];
    snapshot.workspace.forEach((slot, index) => {
      if (slot.state === 'empty' && slot.recordId !== null) {
        add(['workspace', index], 'an empty slot cannot hold a record');
      }
      if (slot.state !== 'empty' && slot.recordId === null) {
        add(['workspace', index], 'a non-empty slot needs a record');
      }
      if (slot.recordId && slot.state === 'eligible') expectedEligible.push(slot.recordId);
      if (slot.recordId && slot.state === 'frozen') expectedFrozen.push(slot.recordId);
    });
    if (expectedEligible.join(',') !== snapshot.eligibleIds.join(',')) {
      add(['eligibleIds'], 'eligible ids must follow the eligible slots');
    }
    if (expectedFrozen.join(',') !== snapshot.frozenIds.join(',')) {
      add(['frozenIds'], 'frozen ids must follow the frozen slots');
    }

    const loaded = [
      ...snapshot.runs.flat(),
      ...snapshot.currentRun,
      ...slotIds,
    ];
    if (new Set(loaded).size !== loaded.length) add(['runs'], 'loaded records must be unique');
    const expectedLoaded = snapshot.records.slice(0, snapshot.inputIndex).map((record) => record.id);
    if (new Set(loaded).size !== loaded.length ||
      loaded.length !== expectedLoaded.length ||
      [...loaded].sort().join(',') !== [...expectedLoaded].sort().join(',')) {
      add(['inputIndex'], 'inputIndex must cover exactly the loaded records');
    }
    for (const id of loaded) if (!records.has(id)) add(['runs'], `unknown loaded record "${id}"`);

    const sortedByKey = (ids: string[]) =>
      ids.every((id, index) => {
        if (index === 0) return true;
        const previous = records.get(ids[index - 1]!)!;
        const current = records.get(id)!;
        return previous.value < current.value ||
          (previous.value === current.value && previous.originalIndex <= current.originalIndex);
      });
    if (!sortedByKey(snapshot.currentRun)) add(['currentRun'], 'the current run must be sorted');
    for (let index = 0; index < snapshot.runs.length; index += 1) {
      if (!sortedByKey(snapshot.runs[index]!)) add(['runs', index], 'a completed run must be sorted');
    }

    if (snapshot.lastOutput === null) {
      if (snapshot.frozenIds.length > 0) add(['frozenIds'], 'without a threshold nothing is frozen');
    } else {
      for (const id of snapshot.eligibleIds) {
        if (records.get(id)!.value < snapshot.lastOutput) {
          add(['eligibleIds'], 'an eligible value must not be below the threshold');
        }
      }
      for (const id of snapshot.frozenIds) {
        if (records.get(id)!.value >= snapshot.lastOutput) {
          add(['frozenIds'], 'a frozen value must be below the threshold');
        }
      }
    }

    if (snapshot.currentRun.length > 0 && snapshot.lastOutput !== null) {
      const last = records.get(snapshot.currentRun[snapshot.currentRun.length - 1]!)!;
      if (last.value !== snapshot.lastOutput) add(['lastOutput'], 'lastOutput must equal the current run tail');
    }
    if (snapshot.currentId !== null && !records.has(snapshot.currentId)) {
      add(['currentId'], 'currentId must name a real record');
    }
    if (snapshot.newId !== null && (!records.has(snapshot.newId) || !expectedLoaded.includes(snapshot.newId))) {
      add(['newId'], 'newId must name a loaded record');
    }
    if (snapshot.operation === 'select' && snapshot.currentId === null) {
      add(['currentId'], 'select needs the minimum eligible record');
    }

    const done = snapshot.operation === 'done';
    if (done) {
      if (snapshot.result !== 'runs-ready') add(['result'], 'done requires generated runs');
      if (snapshot.inputIndex !== snapshot.records.length) add(['inputIndex'], 'done consumes every record');
      if (slotIds.length !== 0) add(['workspace'], 'done leaves the workspace empty');
      if (snapshot.currentRun.length !== 0) add(['currentRun'], 'done closes the final run');
      if (snapshot.newId !== null) add(['newId'], 'done has no newly read record');
      if (snapshot.currentId !== null) add(['currentId'], 'done has no selected record');
      const total = snapshot.runs.flat().length;
      if (total !== snapshot.records.length) add(['runs'], 'every record must belong to exactly one completed run');
      if (snapshot.runs.length === 0) add(['runs'], 'at least one run must be produced');
    } else if (snapshot.result !== null) {
      add(['result'], 'only done may declare a result');
    }
  });

export type ReplacementSnapshot = z.infer<typeof replacementSnapshotSchema>;
