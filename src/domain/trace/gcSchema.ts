import { z } from 'zod';

/**
 * TEXTBOOK-08: mark-and-sweep and storage-compaction snapshots.
 *
 * The object graph and the memory map share one model. Reachability is always
 * computed from the root set; an object is garbage when no root can reach it,
 * even if another unreachable object points at it. A cyclic component that is
 * unreachable is therefore reclaimed as a whole.
 *
 * `freeSpans` must tile exactly the complement of the currently allocated
 * object ranges. During compaction a moved object's `start` is already its new
 * address, `previousStart` records the old one, and every reference renders
 * against the current address, never a stale pointer.
 */
export const GC_MODES = ['mark-sweep', 'compaction'] as const;
export const GC_OPERATIONS = [
  'init',
  'root',
  'visit',
  'follow',
  'skip',
  'marked',
  'sweep',
  'free',
  'select',
  'move',
  'update',
  'done',
] as const;
export const GC_DECISIONS = [
  'root-push',
  'visit',
  'already-marked',
  'follow',
  'compact-start',
  'sweep-live',
  'sweep-free',
  'move',
  'in-place',
  'done',
] as const;

const gcObjectSchema = z.object({
  id: z.string().min(1).max(8),
  size: z.number().int().positive(),
  start: z.number().int().nonnegative(),
  status: z.enum(['allocated', 'free']),
  marked: z.boolean(),
  reachable: z.boolean(),
  root: z.boolean(),
  previousStart: z.number().int().nonnegative().nullable(),
});

const gcRefSchema = z.object({
  id: z.string().min(1).max(8),
  fromId: z.string().min(1).max(8),
  toId: z.string().min(1).max(8),
  fromStart: z.number().int().nonnegative(),
  toStart: z.number().int().nonnegative(),
});

const spanSchema = z.object({
  start: z.number().int().nonnegative(),
  size: z.number().int().positive(),
});

export const gcSnapshotSchema = z
  .object({
    kind: z.literal('garbage-collection'),
    algorithm: z.literal('garbage-collection'),
    mode: z.enum(GC_MODES),
    operation: z.enum(GC_OPERATIONS),
    capacity: z.number().int().min(16).max(128),
    objects: z.array(gcObjectSchema).min(1).max(8),
    refs: z.array(gcRefSchema).max(16),
    roots: z.array(z.string()).max(8),
    reachableIds: z.array(z.string()).max(8),
    markedIds: z.array(z.string()).max(8),
    freeSpans: z.array(spanSchema).max(10),
    currentObjectId: z.string().nullable(),
    targetObjectId: z.string().nullable(),
    stackIds: z.array(z.string()).max(8),
    lastMove: z
      .object({
        objectId: z.string(),
        from: z.number().int().nonnegative(),
        to: z.number().int().nonnegative(),
      })
      .nullable(),
    updatedRefIds: z.array(z.string()).max(16),
    liveBytes: z.number().int().nonnegative(),
    freeBytes: z.number().int().nonnegative(),
    decision: z.enum(GC_DECISIONS).nullable(),
  })
  .superRefine((snapshot, ctx) => {
    const ids = new Set<string>();
    const objectById = new Map<string, (typeof snapshot.objects)[number]>();
    for (const object of snapshot.objects) {
      if (ids.has(object.id)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `duplicate object id ${object.id}` });
      }
      ids.add(object.id);
      objectById.set(object.id, object);
      if (object.start + object.size > snapshot.capacity) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `object ${object.id} exceeds capacity` });
      }
    }
    for (const root of snapshot.roots) {
      if (!ids.has(root)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `root ${root} is not an object` });
      }
    }
    const refIds = new Set<string>();
    const graph = new Map<string, string[]>();
    for (const id of ids) graph.set(id, []);
    for (const ref of snapshot.refs) {
      if (refIds.has(ref.id)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `duplicate reference ${ref.id}` });
      }
      refIds.add(ref.id);
      if (!ids.has(ref.fromId) || !ids.has(ref.toId)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `reference ${ref.id} uses an unknown object` });
      } else {
        graph.get(ref.fromId)!.push(ref.toId);
        const source = objectById.get(ref.fromId)!;
        const target = objectById.get(ref.toId)!;
        if (ref.fromStart !== source.start || ref.toStart !== target.start) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: `reference ${ref.id} carries a stale object address` });
        }
      }
    }

    for (const refId of snapshot.updatedRefIds) {
      if (!refIds.has(refId)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `updatedRefIds contains unknown reference ${refId}` });
      }
    }
    const reachable = new Set<string>();
    const queue = [...snapshot.roots];
    while (queue.length) {
      const id = queue.shift()!;
      if (reachable.has(id)) continue;
      reachable.add(id);
      for (const next of graph.get(id) ?? []) if (!reachable.has(next)) queue.push(next);
    }
    const claimed = new Set(snapshot.reachableIds);
    if (claimed.size !== reachable.size || [...claimed].some((id) => !reachable.has(id))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'reachableIds does not match root reachability' });
    }
    for (const id of snapshot.markedIds) {
      if (!reachable.has(id)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `marked object ${id} is not reachable` });
      }
    }

    const occupied: Array<{ start: number; end: number; id: string }> = [];
    let liveBytes = 0;
    for (const object of snapshot.objects) {
      if (object.status !== 'allocated') continue;
      occupied.push({ start: object.start, end: object.start + object.size, id: object.id });
      liveBytes += object.size;
    }
    occupied.sort((left, right) => left.start - right.start);
    let cursor = 0;
    for (const block of occupied) {
      if (block.start < cursor) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `allocated object ${block.id} overlaps its neighbour` });
      }
      cursor = Math.max(cursor, block.end);
    }
    // Holes before, between and after allocated objects are legal; freeSpans
    // below must describe them exactly.
    // A trailing free span is legal and is checked against freeSpans below.

    const expectedSpans: Array<{ start: number; size: number }> = [];
    let spanCursor = 0;
    for (const block of occupied) {
      if (block.start > spanCursor) {
        expectedSpans.push({ start: spanCursor, size: block.start - spanCursor });
      }
      spanCursor = block.end;
    }
    if (spanCursor < snapshot.capacity) {
      expectedSpans.push({ start: spanCursor, size: snapshot.capacity - spanCursor });
    }
    if (expectedSpans.length !== snapshot.freeSpans.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'free spans do not match the holes' });
    } else {
      for (let index = 0; index < expectedSpans.length; index += 1) {
        const expected = expectedSpans[index]!;
        const actual = snapshot.freeSpans[index]!;
        if (expected.start !== actual.start || expected.size !== actual.size) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'free spans do not match the holes' });
          break;
        }
      }
    }
    if (snapshot.liveBytes !== liveBytes) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'liveBytes mismatch' });
    }
    if (snapshot.freeBytes !== snapshot.capacity - liveBytes) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'freeBytes mismatch' });
    }
    if (snapshot.lastMove !== null) {
      if (!ids.has(snapshot.lastMove.objectId)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'lastMove uses an unknown object' });
      }
      if (snapshot.lastMove.to + (snapshot.objects.find((item) => item.id === snapshot.lastMove!.objectId)?.size ?? 0) > snapshot.capacity) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'lastMove target exceeds capacity' });
      }
    }
  });

export type GcSnapshot = z.infer<typeof gcSnapshotSchema>;
export type GcMode = (typeof GC_MODES)[number];
export type GcOperation = (typeof GC_OPERATIONS)[number];

