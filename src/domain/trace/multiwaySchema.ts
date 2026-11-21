/**
 * TEXTBOOK-11: k-way balanced merge snapshots over a simulated external store.
 *
 * Each run is already sorted. Every run owns an input buffer; only the head of
 * that buffer is a merge candidate. A candidate leaves the buffer into the
 * shared output buffer, which is flushed as a simulated write block when full.
 * Nothing here touches a real disk: read/write counters count teaching events.
 */
import { z } from 'zod';

const RECORD_ID = z.string().regex(/^[A-X]$/);
const RUN_ID = z.string().regex(/^R[0-3]$/);
export const MULTIWAY_MAX_RECORDS = 24;
export const MULTIWAY_MIN_K = 2;
export const MULTIWAY_MAX_K = 4;
export const MULTIWAY_MAX_RECORDS_PER_RUN = 6;
export const MULTIWAY_MAX_BUFFER = 3;

export const MULTIWAY_OPERATIONS = [
  'init', 'read', 'compare', 'select', 'output', 'flush', 'done',
] as const;
export type MultiwayOperation = (typeof MULTIWAY_OPERATIONS)[number];
export const MULTIWAY_RESULTS = ['sorted'] as const;

export const multiwayRecordSchema = z.object({
  id: RECORD_ID,
  value: z.number().int().min(-1_000_000).max(1_000_000),
  originalIndex: z.number().int().min(0).max(MULTIWAY_MAX_RECORDS - 1),
  runIndex: z.number().int().min(0).max(MULTIWAY_MAX_K - 1),
});

export const multiwayRunSchema = z.object({
  id: RUN_ID,
  label: z.string().min(1).max(24),
  recordIds: z.array(RECORD_ID).max(MULTIWAY_MAX_RECORDS_PER_RUN),
  cursor: z.number().int().min(0).max(MULTIWAY_MAX_RECORDS_PER_RUN),
  buffer: z.array(RECORD_ID).max(MULTIWAY_MAX_BUFFER),
  currentId: RECORD_ID.nullable(),
  exhausted: z.boolean(),
});

export const multiwaySnapshotSchema = z
  .object({
    kind: z.literal('multiway'),
    preset: z.string().max(200).nullable(),
    operation: z.enum(MULTIWAY_OPERATIONS),
    records: z.array(multiwayRecordSchema).min(1).max(MULTIWAY_MAX_RECORDS),
    runs: z.array(multiwayRunSchema).min(MULTIWAY_MIN_K).max(MULTIWAY_MAX_K),
    k: z.number().int().min(MULTIWAY_MIN_K).max(MULTIWAY_MAX_K),
    bufferCapacity: z.number().int().min(1).max(MULTIWAY_MAX_BUFFER),
    blockSize: z.number().int().min(1).max(MULTIWAY_MAX_BUFFER),
    candidateIds: z.array(RECORD_ID).max(MULTIWAY_MAX_K),
    winnerId: RECORD_ID.nullable(),
    output: z.array(RECORD_ID).max(MULTIWAY_MAX_RECORDS),
    outputBuffer: z.array(RECORD_ID).max(MULTIWAY_MAX_BUFFER),
    readBlocks: z.number().int().min(0).max(100),
    writeBlocks: z.number().int().min(0).max(100),
    mergePasses: z.literal(1),
    result: z.enum(MULTIWAY_RESULTS).nullable(),
  })
  .superRefine((snapshot, ctx) => {
    const add = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
    const ids = new Map<string, z.infer<typeof multiwayRecordSchema>>();
    snapshot.records.forEach((record, index) => {
      if (ids.has(record.id)) add(['records', index, 'id'], `duplicate record id "${record.id}"`);
      ids.set(record.id, record);
      if (record.originalIndex !== index) add(['records', index], 'records must be in identity order');
    });
    if (new Set(snapshot.records.map((record) => record.id)).size !== snapshot.records.length) {
      add(['records'], 'record ids must be unique');
    }

    if (snapshot.runs.length !== snapshot.k) {
      add(['runs'], `exactly ${snapshot.k} runs are required`);
    }

    const runById = new Map<string, (typeof snapshot.runs)[number]>();
    const recordOwners = new Map<string, string>();
    snapshot.runs.forEach((run, runIndex) => {
      if (run.id !== `R${runIndex}`) add(['runs', runIndex, 'id'], `run id must be R${runIndex}`);
      if (runById.has(run.id)) add(['runs', runIndex, 'id'], `duplicate run id "${run.id}"`);
      runById.set(run.id, run);
      if (run.cursor > run.recordIds.length) add(['runs', runIndex, 'cursor'], 'cursor past the run end');
      if (run.buffer.length > snapshot.bufferCapacity) {
        add(['runs', runIndex, 'buffer'], 'buffer exceeds capacity');
      }
      const start = run.cursor - run.buffer.length;
      if (start < 0 || run.buffer.join(',') !== run.recordIds.slice(start, run.cursor).join(',')) {
        add(['runs', runIndex, 'buffer'], 'buffer must be the loaded prefix ending at cursor');
      }
      for (const recordId of run.recordIds) {
        if (!ids.has(recordId)) add(['runs', runIndex, 'recordIds'], `unknown record "${recordId}"`);
        if (recordOwners.has(recordId)) add(['runs', runIndex, 'recordIds'], `record "${recordId}" belongs to another run`);
        recordOwners.set(recordId, run.id);
      }
      const values = run.recordIds.map((id) => ids.get(id)?.value ?? 0);
      for (let index = 1; index < values.length; index += 1) {
        if (values[index - 1]! > values[index]!) {
          add(['runs', runIndex, 'recordIds'], 'each input run must already be sorted');
          break;
        }
      }
      const expectedCurrent = run.buffer[0] ?? null;
      if (run.currentId !== expectedCurrent) add(['runs', runIndex, 'currentId'], 'currentId must be the buffer head');
      const exhausted = run.cursor >= run.recordIds.length && run.buffer.length === 0;
      if (run.exhausted !== exhausted) add(['runs', runIndex, 'exhausted'], 'exhausted flag does not match cursor/buffer');
    });

    const expectedCandidates = snapshot.runs
      .filter((run) => !run.exhausted)
      .map((run) => run.currentId)
      .filter((id): id is string => id !== null);
    if (snapshot.candidateIds.length !== expectedCandidates.length) {
      add(['candidateIds'], 'candidates must contain exactly one head per unfinished run');
    } else if (snapshot.candidateIds.join(',') !== expectedCandidates.join(',')) {
      add(['candidateIds'], 'candidate ids must follow run order');
    }
    if (snapshot.winnerId !== null && snapshot.operation !== 'output' &&
      !snapshot.candidateIds.includes(snapshot.winnerId)) {
      add(['winnerId'], 'winner must be one of the current candidates');
    }

    const allIds = snapshot.records.map((record) => record.id);
    if (recordOwners.size !== allIds.length) add(['runs'], 'every record must belong to a run');
    const pending = [...snapshot.output, ...snapshot.outputBuffer];
    const buffered = snapshot.runs.flatMap((run) => run.buffer);
    const covered = new Set([...pending, ...buffered]);
    if (covered.size !== pending.length + buffered.length) {
      add(['output'], 'a record cannot be both pending and buffered');
    }
    for (const id of covered) if (!ids.has(id)) add(['output'], `unknown output record "${id}"`);
    if (pending.length > allIds.length) add(['output'], 'too many output records');

    const byValue = (left: string, right: string) => {
      const a = ids.get(left)!;
      const b = ids.get(right)!;
      return a.value - b.value || a.originalIndex - b.originalIndex;
    };
    if (![...snapshot.output].every((id, index, list) => index === 0 || byValue(list[index - 1]!, id) <= 0)) {
      add(['output'], 'flushed output must be sorted');
    }
    if (![...snapshot.outputBuffer].every((id, index, list) => index === 0 || byValue(list[index - 1]!, id) <= 0)) {
      add(['outputBuffer'], 'pending output must stay sorted');
    }

    const expectedReads = snapshot.runs.reduce((sum, run) => {
      const take = Math.min(snapshot.blockSize, snapshot.bufferCapacity);
      return sum + Math.ceil(run.cursor / take);
    }, 0);
    if (snapshot.readBlocks !== expectedReads) {
      add(['readBlocks'], `expected ${expectedReads} simulated read blocks from cursor positions`);
    }

    const done = snapshot.operation === 'done';
    if (done) {
      if (snapshot.result !== 'sorted') add(['result'], 'done requires a sorted result');
      if (snapshot.output.length !== allIds.length) add(['output'], 'done requires every record written out');
      if (snapshot.outputBuffer.length !== 0) add(['outputBuffer'], 'done flushes the output buffer');
      if (snapshot.candidateIds.length !== 0) add(['candidateIds'], 'done has no candidates');
      if (snapshot.winnerId !== null) add(['winnerId'], 'done has no winner');
      if (!snapshot.runs.every((run) => run.exhausted && run.currentId === null)) {
        add(['runs'], 'done requires every run to be exhausted');
      }
      const expectedWrites = Math.ceil(allIds.length / snapshot.bufferCapacity);
      if (snapshot.writeBlocks !== expectedWrites) {
        add(['writeBlocks'], `done requires ${expectedWrites} simulated write blocks`);
      }
    } else {
      if (snapshot.result !== null) add(['result'], 'only done may declare a result');
      if (snapshot.outputBuffer.length > 0) {
        if (snapshot.output.length !== snapshot.writeBlocks * snapshot.bufferCapacity) {
          add(['writeBlocks'], 'a pending output buffer means every finished block was full');
        }
      } else if (snapshot.writeBlocks !== Math.ceil(snapshot.output.length / snapshot.bufferCapacity)) {
        add(['writeBlocks'], 'write blocks must cover the flushed output, including one partial tail');
      }
    }
  });

export type MultiwaySnapshot = z.infer<typeof multiwaySnapshotSchema>;
