/**
 * Trace Event Schema v1 — the unified, versioned execution-trace protocol.
 *
 * Every teaching-language runner (JavaScript, Python via Pyodide) emits frames
 * that an adapter normalises into `TraceEvent`s; this module is the single
 * runtime validator that guarantees the events the playback / sync panels
 * consume are well-formed. Invalid events are rejected with readable errors and
 * never crash the page.
 *
 * Design goals (Issue 05):
 *  - explicit `schemaVersion` so the protocol can evolve without silent breakage
 *  - JSON-serialisable values only (no functions, cycles, `undefined`, `NaN`)
 *  - hard limits on event count / frame size / variable payloads to bound memory
 *  - callStack is *specified* here but is not animated yet (future recursion work)
 */
import { z } from 'zod';
import { kmpSnapshotSchema } from './kmpSchema';
import { sparseTransposeSnapshotSchema } from './sparseTransposeSchema';
export type { KmpSnapshot, KmpOperation, KmpPhase } from './kmpSchema';
export type {
  SparseTransposeSnapshot,
  SparseTransposeOperation,
  SparseTransposePhase,
  SparseTriplet,
} from './sparseTransposeSchema';
export { KMP_MAX_PATTERN, KMP_MAX_TEXT, computeKmpLps, kmpSnapshotSchema } from './kmpSchema';
export {
  SPARSE_MAX_COLS,
  SPARSE_MAX_ROWS,
  SPARSE_MAX_TRIPLES,
  sparseColumnCounts,
  sparseCpot,
  sparsePlacementOrder,
  sparseTranspose,
  sparseTransposeSnapshotSchema,
} from './sparseTransposeSchema';

/** Protocol version. Bump this only with a deliberate breaking change. */
export const TRACE_SCHEMA_VERSION = 1 as const;

/** Visual structures supported by the first-batch visual model. */
export const VISUAL_TYPES = ['array', 'stack', 'queue', 'linked', 'tree', 'graph'] as const;
export type VisualType = (typeof VISUAL_TYPES)[number];

/**
 * Event kinds. The adapter only ever emits `step` (a plain progression) or
 * `done` (terminal). `compare` / `swap` / `visit` / `mark` / `init` are declared
 * for future, richer adapters but are NOT inferred from message text or
 * algorithm names (guessing would fabricate data).
 */
export const EVENT_TYPES = ['init', 'step', 'compare', 'swap', 'visit', 'mark', 'done'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

/**
 * Stage 7B structural operations. These are RECORDED by the runner, never
 * inferred from `message`, the algorithm id, or a change in array length.
 * `init`/`done` describe the container lifecycle; the rest are real operations.
 */
export const STRUCTURE_KINDS = ['stack', 'queue'] as const;
export type StructureKind = (typeof STRUCTURE_KINDS)[number];

export const STRUCTURE_OPERATIONS = [
  'init', 'push', 'pop', 'peek', 'enqueue', 'dequeue', 'front', 'done',
] as const;
export type StructureOperation = (typeof STRUCTURE_OPERATIONS)[number];

const STRUCTURE_OPERATIONS_BY_KIND: Record<StructureKind, readonly StructureOperation[]> = {
  stack: ['init', 'push', 'pop', 'peek', 'done'],
  queue: ['init', 'enqueue', 'dequeue', 'front', 'done'],
};

/** Bounded payloads. Kept in one place so tests can assert them. */
export const LIMITS = {
  MAX_EVENTS: 500,
  MAX_MESSAGE_CHARS: 240,
  MAX_VARIABLES: 50,
  MAX_CALL_STACK: 64,
  MAX_STATE_JSON_BYTES: 8192,
  MAX_VARIABLE_VALUE_JSON_BYTES: 2048,
  MAX_EVENT_JSON_BYTES: 16384,
  MAX_TOTAL_JSON_BYTES: 2_000_000,
  MAX_SOURCE_CHARS: 40_000,
  MAX_NAME_CHARS: 64,
} as const;

/** Recursive JSON value — the only values allowed inside a trace. */
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/**
 * Zod counterpart of {@link JsonValue}. Exported so formats that *embed* trace
 * values (learning sessions, exported contexts) validate the same JSON subset
 * instead of re-inventing one.
 */
export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([z.string(), z.number().finite(), z.boolean(), z.null(), z.array(jsonValueSchema), z.record(jsonValueSchema)]),
);

/** One element of a stack/queue snapshot. `id` is stable for the element's lifetime. */
export const structureItemSchema = z.object({
  id: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  value: jsonValueSchema.refine(
    (value) => JSON.stringify(value).length <= LIMITS.MAX_VARIABLE_VALUE_JSON_BYTES,
    'structure element value too large',
  ),
});
export type StructureItem = z.infer<typeof structureItemSchema>;

/**
 * Additive Stage 7B structure semantics. `items` is the container AFTER the
 * operation (bottom→top for a stack, front→rear for a queue). `targetId`
 * identifies the element involved; for `pop`/`dequeue` it may refer to
 * `removed`, which is why the removed element is also snapshotted explicitly.
 *
 * The field is optional on `TraceEvent`, so every Stage 1–7A event still
 * validates. An event without this field is rendered by the legacy node view,
 * never by guessing an operation from text.
 */
export const structureSnapshotSchema = z
  .object({
    kind: z.enum(STRUCTURE_KINDS),
    operation: z.enum(STRUCTURE_OPERATIONS),
    items: z.array(structureItemSchema).max(40),
    targetId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).optional(),
    removed: structureItemSchema.optional(),
  })
  .superRefine((snapshot, ctx) => {
    const ids = new Set<string>();
    snapshot.items.forEach((item, index) => {
      if (ids.has(item.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['items', index, 'id'],
          message: `duplicate structure element id "${item.id}"`,
        });
      }
      ids.add(item.id);
    });
    if (!STRUCTURE_OPERATIONS_BY_KIND[snapshot.kind].includes(snapshot.operation)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['operation'],
        message: `operation "${snapshot.operation}" is not valid for ${snapshot.kind}`,
      });
    }
    if (snapshot.operation === 'pop' || snapshot.operation === 'dequeue') {
      if (!snapshot.removed) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['removed'],
          message: `${snapshot.operation} must record the removed element`,
        });
      }
      if (snapshot.targetId && snapshot.removed && snapshot.targetId !== snapshot.removed.id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['targetId'],
          message: 'targetId must identify the removed element',
        });
      }
    }
  });
export type StructureSnapshot = z.infer<typeof structureSnapshotSchema>;

/**
 * Stage 7C: singly linked-list semantics. A frame snapshots every Node object
 * the Python program still holds, not only the nodes reachable from HEAD:
 * `nodes` may therefore contain a newly created node that is not connected yet
 * or a node that was just detached. Reachability is derived from `headId` and
 * `nextId`; the renderer never treats the array order as the chain order.
 *
 * `change` records the pointer assignment that produced this frame
 * (`beforeNextId -> afterNextId`) and must agree with the node's new `nextId`.
 * A cycle is rejected here (Stage 7C does not teach circular lists), so both the
 * model and the renderer are guaranteed a finite chain.
 */
export const LINKED_LIST_OPERATIONS = [
  'init', 'create', 'set-next', 'set-head', 'visit', 'detach', 'done',
] as const;
export type LinkedListOperation = (typeof LINKED_LIST_OPERATIONS)[number];

export const linkedListNodeSchema = z.object({
  id: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  value: jsonValueSchema.refine(
    (value) => JSON.stringify(value).length <= LIMITS.MAX_VARIABLE_VALUE_JSON_BYTES,
    'linked-list node value too large',
  ),
  nextId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
});
export type LinkedListNode = z.infer<typeof linkedListNodeSchema>;

export const linkedListChangeSchema = z.object({
  nodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  beforeNextId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
  afterNextId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
});
export type LinkedListChange = z.infer<typeof linkedListChangeSchema>;

export const linkedListSnapshotSchema = z
  .object({
    kind: z.literal('linked-list'),
    operation: z.enum(LINKED_LIST_OPERATIONS),
    headId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    nodes: z.array(linkedListNodeSchema).max(40),
    targetId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).optional(),
    change: linkedListChangeSchema.optional(),
  })
  .superRefine((snapshot, ctx) => {
    const ids = new Set<string>();
    const byId = new Map<string, LinkedListNode>();
    snapshot.nodes.forEach((node, index) => {
      if (ids.has(node.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['nodes', index, 'id'],
          message: `duplicate linked-list node id "${node.id}"`,
        });
      }
      ids.add(node.id);
      byId.set(node.id, node);
    });

    if (snapshot.headId !== null && !ids.has(snapshot.headId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['headId'],
        message: `headId "${snapshot.headId}" does not refer to a node`,
      });
    }
    snapshot.nodes.forEach((node, index) => {
      if (node.nextId !== null && !ids.has(node.nextId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['nodes', index, 'nextId'],
          message: `nextId "${node.nextId}" does not refer to a node`,
        });
      }
    });
    if (snapshot.targetId !== undefined && !ids.has(snapshot.targetId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['targetId'],
        message: `targetId "${snapshot.targetId}" does not refer to a node`,
      });
    }

    // Reject any cycle, including one that only exists among detached nodes.
    for (const start of snapshot.nodes) {
      const path = new Set<string>();
      let current: string | null = start.id;
      while (current !== null) {
        if (path.has(current)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['nodes'],
            message: `cyclic linked list detected at node "${current}"`,
          });
          break;
        }
        path.add(current);
        current = byId.get(current)?.nextId ?? null;
      }
    }

    if (snapshot.change) {
      const changed = byId.get(snapshot.change.nodeId);
      if (!changed) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['change', 'nodeId'],
          message: 'change.nodeId does not refer to a node',
        });
      } else if (changed.nextId !== snapshot.change.afterNextId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['change', 'afterNextId'],
          message: "change.afterNextId must equal the node's recorded nextId",
        });
      }
      for (const key of ['beforeNextId', 'afterNextId'] as const) {
        const ref = snapshot.change[key];
        if (ref !== null && !ids.has(ref)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['change', key],
            message: `${key} "${ref}" does not refer to a node`,
          });
        }
      }
      if (snapshot.operation !== 'set-next' && snapshot.operation !== 'detach') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['change'],
          message: `change is not valid for operation "${snapshot.operation}"`,
        });
      }
      if (snapshot.targetId !== snapshot.change.nodeId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['targetId'],
          message: 'targetId must identify the node whose pointer changed',
        });
      }
      if (snapshot.operation === 'detach' && snapshot.change.afterNextId !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['change', 'afterNextId'],
          message: 'detach must record next = null',
        });
      }
    } else if (snapshot.operation === 'set-next' || snapshot.operation === 'detach') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['change'],
        message: `${snapshot.operation} must record the pointer change`,
      });
    }

    if (snapshot.operation === 'create' || snapshot.operation === 'visit' || snapshot.operation === 'set-next' || snapshot.operation === 'detach') {
      if (!snapshot.targetId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['targetId'],
          message: `${snapshot.operation} must identify its target node`,
        });
      }
    }
  });
export type LinkedListSnapshot = z.infer<typeof linkedListSnapshotSchema>;

/**
 * L1A: doubly linked list and circular singly linked list.
 *
 * These are separate snapshot kinds on purpose: the Stage 7C schema above
 * rejects every cycle, and weakening it would make the old singly-linked traces
 * unverifiable. The new schemas share pointer-change bookkeeping but enforce
 * different completed-state invariants:
 *  - doubly: head.prev = null, tail.next = null, adjacent prev/next agree;
 *  - circular: non-empty tail.next = head, one full next-cycle from head, and a
 *    single node points to itself.
 *
 * `phase: 'intermediate'` is used while Python has changed only part of a link
 * set (for example node.next was set but the predecessor has not been updated).
 * Every `complete` frame must satisfy the structure's invariant, so an
 * operation cannot be declared finished with a broken chain.
 */
export const ADVANCED_LINKED_OPERATIONS = [
  'init', 'create', 'set-next', 'set-prev', 'set-head', 'set-tail',
  'visit', 'found', 'not-found', 'detach', 'done',
] as const;
export type AdvancedLinkedListOperation = (typeof ADVANCED_LINKED_OPERATIONS)[number];

export const LINKED_SNAPSHOT_PHASES = ['intermediate', 'complete'] as const;
export type LinkedSnapshotPhase = (typeof LINKED_SNAPSHOT_PHASES)[number];

export const advancedLinkedListChangeSchema = z.object({
  nodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  field: z.enum(['prev', 'next']),
  beforeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
  afterId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
});
export type AdvancedLinkedListChange = z.infer<typeof advancedLinkedListChangeSchema>;

export const doublyLinkedListNodeSchema = z.object({
  id: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  value: jsonValueSchema.refine(
    (value) => JSON.stringify(value).length <= LIMITS.MAX_VARIABLE_VALUE_JSON_BYTES,
    'doubly linked-list node value too large',
  ),
  prevId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
  nextId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
});
export type DoublyLinkedListNode = z.infer<typeof doublyLinkedListNodeSchema>;

export const circularLinkedListNodeSchema = z.object({
  id: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  value: jsonValueSchema.refine(
    (value) => JSON.stringify(value).length <= LIMITS.MAX_VARIABLE_VALUE_JSON_BYTES,
    'circular linked-list node value too large',
  ),
  nextId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
});
export type CircularLinkedListNode = z.infer<typeof circularLinkedListNodeSchema>;

interface LinkedAudit {
  ids: Set<string>;
  byId: Map<string, DoublyLinkedListNode | CircularLinkedListNode>;
}

function collectLinkedNodes(
  ctx: z.RefinementCtx,
  nodes: Array<DoublyLinkedListNode | CircularLinkedListNode>,
  kindLabel: string,
): LinkedAudit {
  const ids = new Set<string>();
  const byId = new Map<string, DoublyLinkedListNode | CircularLinkedListNode>();
  nodes.forEach((node, index) => {
    if (ids.has(node.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['nodes', index, 'id'],
        message: `duplicate ${kindLabel} node id "${node.id}"`,
      });
    }
    ids.add(node.id);
    byId.set(node.id, node);
  });
  return { ids, byId };
}

function checkRef(
  ctx: z.RefinementCtx,
  ids: Set<string>,
  ref: string | null,
  path: Array<string | number>,
  label: string,
): void {
  if (ref !== null && !ids.has(ref)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path,
      message: `${label} "${ref}" does not refer to a node`,
    });
  }
}

function checkAdvancedLinkedCommon(
  ctx: z.RefinementCtx,
  snapshot: {
    operation: AdvancedLinkedListOperation;
    phase: LinkedSnapshotPhase;
    headId: string | null;
    tailId: string | null;
    nodes: Array<DoublyLinkedListNode | CircularLinkedListNode>;
    targetId?: string;
    change?: AdvancedLinkedListChange;
    searchValue?: unknown;
    found?: boolean;
  },
  audit: LinkedAudit,
  isDoubly: boolean,
): void {
  const { ids } = audit;
  checkRef(ctx, ids, snapshot.headId, ['headId'], 'headId');
  checkRef(ctx, ids, snapshot.tailId, ['tailId'], 'tailId');
  if (snapshot.targetId !== undefined && !ids.has(snapshot.targetId)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['targetId'],
      message: `targetId "${snapshot.targetId}" does not refer to a node`,
    });
  }
  snapshot.nodes.forEach((node, index) => {
    if (isDoubly && 'prevId' in node) {
      checkRef(ctx, ids, node.prevId, ['nodes', index, 'prevId'], 'prevId');
    }
    checkRef(ctx, ids, node.nextId, ['nodes', index, 'nextId'], 'nextId');
  });

  if (snapshot.phase === 'complete') {
    if (snapshot.headId === null && snapshot.tailId !== null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['tailId'], message: 'empty list must have tailId = null' });
    }
    if (snapshot.tailId === null && snapshot.headId !== null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['headId'], message: 'empty list must have headId = null' });
    }
  }

  const change = snapshot.change;
  if (change) {
    const node = audit.byId.get(change.nodeId);
    if (!node) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['change', 'nodeId'], message: 'change.nodeId does not refer to a node' });
    } else {
      const current = change.field === 'prev' && 'prevId' in node ? node.prevId : node.nextId;
      if (current !== change.afterId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['change', 'afterId'],
          message: `change.afterId must equal the node's recorded ${change.field}`,
        });
      }
    }
    checkRef(ctx, ids, change.beforeId, ['change', 'beforeId'], 'change.beforeId');
    checkRef(ctx, ids, change.afterId, ['change', 'afterId'], 'change.afterId');
    if (snapshot.targetId !== change.nodeId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['targetId'], message: 'targetId must identify the node whose pointer changed' });
    }
    if (snapshot.operation !== 'set-next' && snapshot.operation !== 'set-prev') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['change'], message: `change is not valid for operation "${snapshot.operation}"` });
    }
    if (snapshot.operation === 'set-next' && change.field !== 'next') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['change', 'field'], message: 'set-next must change the next pointer' });
    }
    if (snapshot.operation === 'set-prev' && change.field !== 'prev') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['change', 'field'], message: 'set-prev must change the prev pointer' });
    }
  } else if (snapshot.operation === 'set-next' || snapshot.operation === 'set-prev') {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['change'], message: `${snapshot.operation} must record the pointer change` });
  }

  if ((snapshot.operation === 'visit' || snapshot.operation === 'found') && !snapshot.targetId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['targetId'], message: `${snapshot.operation} must identify the current node` });
  }
  if (snapshot.operation === 'not-found') {
    if (snapshot.targetId !== undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['targetId'], message: 'a missing search has no target node' });
    }
    if (snapshot.found !== false) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['found'], message: 'not-found must set found = false' });
    }
  }
  if (snapshot.operation === 'found') {
    if (snapshot.found !== true) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['found'], message: 'found must set found = true' });
    }
    const target = snapshot.targetId ? audit.byId.get(snapshot.targetId) : undefined;
    if (!target) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['targetId'], message: 'found must point at the matching node' });
    } else if (snapshot.searchValue !== undefined && JSON.stringify(target.value) !== JSON.stringify(snapshot.searchValue)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['targetId'], message: 'found target value must equal searchValue' });
    }
  }
  if ((snapshot.operation === 'found' || snapshot.operation === 'not-found') && snapshot.searchValue === undefined) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['searchValue'], message: 'search result must record searchValue' });
  }

  if (snapshot.operation === 'create') {
    const target = snapshot.targetId ? audit.byId.get(snapshot.targetId) : undefined;
    if (!target) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['targetId'], message: 'create must identify its new node' });
    } else if (target.nextId !== null || ('prevId' in target && target.prevId !== null)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['targetId'], message: 'a newly created node must start with null links' });
    }
    if (snapshot.phase !== 'intermediate') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['phase'], message: 'create is an intermediate frame' });
    }
  }
  if (snapshot.operation === 'set-head' && snapshot.targetId !== undefined && snapshot.targetId !== snapshot.headId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['targetId'], message: 'set-head target must be the recorded head' });
  }
  if (snapshot.operation === 'set-tail' && snapshot.targetId !== undefined && snapshot.targetId !== snapshot.tailId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['targetId'], message: 'set-tail target must be the recorded tail' });
  }
  if (snapshot.operation === 'detach') {
    const target = snapshot.targetId ? audit.byId.get(snapshot.targetId) : undefined;
    if (!target) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['targetId'], message: 'detach must identify the removed node' });
    } else if (target.nextId !== null || ('prevId' in target && target.prevId !== null)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['targetId'], message: 'detached node must have null links' });
    }
    if (snapshot.change !== undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['change'], message: 'detach does not change a pointer' });
    }
    if (snapshot.phase !== 'complete') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['phase'], message: 'detach completes an unlink operation' });
    }
  }
  if (snapshot.operation === 'done' && snapshot.phase !== 'complete') {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['phase'], message: 'done must be a complete frame' });
  }
}

export const doublyLinkedListSnapshotSchema = z
  .object({
    kind: z.literal('doubly-linked-list'),
    operation: z.enum(ADVANCED_LINKED_OPERATIONS),
    phase: z.enum(LINKED_SNAPSHOT_PHASES),
    headId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    tailId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    nodes: z.array(doublyLinkedListNodeSchema).max(40),
    targetId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).optional(),
    change: advancedLinkedListChangeSchema.optional(),
    searchValue: jsonValueSchema.optional(),
    found: z.boolean().optional(),
  })
  .superRefine((snapshot, ctx) => {
    const audit = collectLinkedNodes(ctx, snapshot.nodes, 'doubly linked-list');
    checkAdvancedLinkedCommon(ctx, snapshot, audit, true);
    if (snapshot.phase !== 'complete') return;

    const chain: DoublyLinkedListNode[] = [];
    const seen = new Set<string>();
    let current = snapshot.headId;
    while (current !== null) {
      if (seen.has(current)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['nodes'], message: `cyclic doubly linked list at node "${current}"` });
        break;
      }
      const node = audit.byId.get(current);
      if (!node) break;
      seen.add(current);
      chain.push(node as DoublyLinkedListNode);
      current = node.nextId;
    }
    if (snapshot.headId === null && snapshot.tailId !== null) return;
    if (snapshot.headId !== null && chain.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['headId'], message: 'non-empty list head must be reachable' });
    }
    if (snapshot.headId !== null && snapshot.tailId !== null && chain.length > 0 && chain[chain.length - 1].id !== snapshot.tailId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['tailId'], message: 'tailId must be the last node on the next chain' });
    }
    chain.forEach((node, index) => {
      const previous = index === 0 ? null : chain[index - 1].id;
      if (node.prevId !== previous) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['nodes'], message: `node "${node.id}" prevId does not match the previous node` });
      }
      const next = index === chain.length - 1 ? null : chain[index + 1].id;
      if (node.nextId !== next) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['nodes'], message: `node "${node.id}" nextId does not match the next node` });
      }
    });
    snapshot.nodes.filter((node) => !seen.has(node.id)).forEach((node, index) => {
      if (node.prevId !== null || node.nextId !== null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['nodes', index], message: `unreachable node "${node.id}" must have null links` });
      }
    });
  });
export type DoublyLinkedListSnapshot = z.infer<typeof doublyLinkedListSnapshotSchema>;

export const circularLinkedListSnapshotSchema = z
  .object({
    kind: z.literal('circular-linked-list'),
    operation: z.enum(ADVANCED_LINKED_OPERATIONS),
    phase: z.enum(LINKED_SNAPSHOT_PHASES),
    headId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    tailId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    nodes: z.array(circularLinkedListNodeSchema).max(40),
    targetId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).optional(),
    change: advancedLinkedListChangeSchema.optional(),
    searchValue: jsonValueSchema.optional(),
    found: z.boolean().optional(),
  })
  .superRefine((snapshot, ctx) => {
    const audit = collectLinkedNodes(ctx, snapshot.nodes, 'circular linked-list');
    checkAdvancedLinkedCommon(ctx, snapshot, audit, false);
    if (snapshot.operation === 'set-prev') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['operation'], message: 'circular singly linked list has no prev pointer' });
    }
    if (snapshot.change?.field === 'prev') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['change', 'field'], message: 'circular singly linked list has no prev pointer' });
    }
    if (snapshot.phase !== 'complete') return;

    if (snapshot.headId === null && snapshot.tailId !== null) return;
    if (snapshot.headId !== null && snapshot.tailId === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['tailId'], message: 'non-empty circular list needs a tail' });
      return;
    }
    const cycle: CircularLinkedListNode[] = [];
    const seen = new Set<string>();
    let current = snapshot.headId;
    while (current !== null && !seen.has(current)) {
      const node = audit.byId.get(current);
      if (!node) break;
      seen.add(current);
      cycle.push(node as CircularLinkedListNode);
      current = node.nextId;
      if (current === snapshot.headId) break;
    }
    if (snapshot.headId !== null) {
      if (current !== snapshot.headId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['nodes'], message: 'next chain must return to head without dangling' });
      }
      if (cycle.length > 0 && cycle[cycle.length - 1].id !== snapshot.tailId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['tailId'], message: 'tailId must be the node whose next is head' });
      }
      if (snapshot.tailId !== null) {
        const tail = audit.byId.get(snapshot.tailId);
        if (tail && tail.nextId !== snapshot.headId) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['tailId'], message: 'non-empty circular list must have tail.next = head' });
        }
      }
      if (cycle.length === 1 && snapshot.headId !== snapshot.tailId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['tailId'], message: 'single-node list must have head = tail' });
      }
      if (cycle.length === 1 && cycle[0].nextId !== cycle[0].id) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['nodes'], message: 'single node must point to itself' });
      }
    }
    snapshot.nodes.filter((node) => !seen.has(node.id)).forEach((node, index) => {
      if (node.nextId !== null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['nodes', index], message: `unreachable node "${node.id}" must have next = null` });
      }
    });
  });
export type CircularLinkedListSnapshot = z.infer<typeof circularLinkedListSnapshotSchema>;
export type AdvancedLinkedListSnapshot = DoublyLinkedListSnapshot | CircularLinkedListSnapshot;

/**
 * L1B: fixed-capacity sequential list. `capacity` is the physical slot count,
 * `length` is the live prefix [0, length), and `slots` records every physical
 * cell, including the free tail. A complete frame requires occupied values in
 * the prefix and null values in the free tail; an intermediate frame may show
 * temporary duplicates/stale values produced by real assignments, but must
 * never claim they are valid elements.
 */
export const SEQUENTIAL_LIST_OPERATIONS = [
  'init', 'access', 'search', 'insert', 'delete', 'traverse', 'done',
] as const;
export type SequentialListOperation = (typeof SEQUENTIAL_LIST_OPERATIONS)[number];

export const SEQUENTIAL_LIST_ACTIONS = [
  'read', 'compare', 'visit', 'check', 'shift-right', 'write', 'save',
  'shift-left', 'clear', 'complete', 'reject',
] as const;
export type SequentialListAction = (typeof SEQUENTIAL_LIST_ACTIONS)[number];

export const SEQUENTIAL_LIST_ERRORS = [
  'index-out-of-range', 'capacity-full', 'list-empty',
] as const;
export type SequentialListError = (typeof SEQUENTIAL_LIST_ERRORS)[number];

export const SEQUENTIAL_LIST_PHASES = ['intermediate', 'complete'] as const;
export type SequentialListPhase = (typeof SEQUENTIAL_LIST_PHASES)[number];

export const sequentialListSlotSchema = z.object({
  index: z.number().int().min(0).max(31),
  value: jsonValueSchema.refine(
    (value) => JSON.stringify(value).length <= LIMITS.MAX_VARIABLE_VALUE_JSON_BYTES,
    'sequential-list slot value too large',
  ).nullable(),
});
export type SequentialListSlot = z.infer<typeof sequentialListSlotSchema>;

export const sequentialListChangeSchema = z.object({
  index: z.number().int().min(0).max(31),
  before: jsonValueSchema,
  after: jsonValueSchema,
});
export type SequentialListChange = z.infer<typeof sequentialListChangeSchema>;

export const sequentialListSnapshotSchema = z
  .object({
    kind: z.literal('sequential-list'),
    operation: z.enum(SEQUENTIAL_LIST_OPERATIONS),
    action: z.enum(SEQUENTIAL_LIST_ACTIONS),
    phase: z.enum(SEQUENTIAL_LIST_PHASES),
    capacity: z.number().int().min(1).max(16),
    length: z.number().int().min(0).max(16),
    slots: z.array(sequentialListSlotSchema).max(16),
    requestedIndex: z.number().int().min(-16).max(999).optional(),
    focusIndex: z.number().int().min(0).max(15).optional(),
    sourceIndex: z.number().int().min(0).max(15).optional(),
    targetIndex: z.number().int().min(0).max(15).optional(),
    change: sequentialListChangeSchema.optional(),
    checked: z.array(z.number().int().min(0).max(15)).max(16).optional(),
    searchValue: jsonValueSchema.optional(),
    result: jsonValueSchema.optional(),
    found: z.boolean().optional(),
    foundIndex: z.number().int().min(0).max(15).optional(),
    removedIndex: z.number().int().min(0).max(15).optional(),
    removedValue: jsonValueSchema.optional(),
    error: z.enum(SEQUENTIAL_LIST_ERRORS).optional(),
    preset: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).optional(),
  })
  .superRefine((snapshot, ctx) => {
    if (snapshot.slots.length !== snapshot.capacity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['slots'],
        message: `slots length ${snapshot.slots.length} must equal capacity ${snapshot.capacity}`,
      });
      return;
    }
    snapshot.slots.forEach((slot, index) => {
      if (slot.index !== index) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['slots', index, 'index'],
          message: `slot ${index} must carry index ${index}`,
        });
      }
    });
    if (snapshot.length > snapshot.capacity) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['length'], message: 'length cannot exceed capacity' });
    }

    for (const [name, value] of [
      ['focusIndex', snapshot.focusIndex],
      ['sourceIndex', snapshot.sourceIndex],
      ['targetIndex', snapshot.targetIndex],
      ['foundIndex', snapshot.foundIndex],
      ['removedIndex', snapshot.removedIndex],
    ] as const) {
      if (value !== undefined && value >= snapshot.capacity) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [name], message: `${name} is outside capacity` });
      }
    }
    if (snapshot.checked) {
      const seen = new Set<number>();
      snapshot.checked.forEach((index, position) => {
        if (index >= snapshot.capacity) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['checked', position], message: 'checked index is outside capacity' });
        }
        if (seen.has(index)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['checked', position], message: 'checked indices must be unique' });
        }
        seen.add(index);
      });
    }

    if (snapshot.phase === 'complete') {
      snapshot.slots.forEach((slot, index) => {
        const occupied = index < snapshot.length;
        if (occupied && slot.value === null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['slots', index, 'value'],
            message: `occupied slot ${index} cannot be null in a complete frame`,
          });
        }
        if (!occupied && slot.value !== null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['slots', index, 'value'],
            message: `free slot ${index} must be null in a complete frame`,
          });
        }
      });
    }

    if (snapshot.change) {
      if (snapshot.phase !== 'intermediate') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['change'], message: 'change only belongs to an intermediate assignment frame' });
      }
      if (snapshot.change.index >= snapshot.capacity) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['change', 'index'], message: 'change index is outside capacity' });
      } else if (JSON.stringify(snapshot.slots[snapshot.change.index]?.value) !== JSON.stringify(snapshot.change.after)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['change', 'after'], message: 'change.after must equal the recorded slot value' });
      }
    }

    if (snapshot.action === 'reject') {
      if (!snapshot.error) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['error'], message: 'reject must record an error reason' });
      }
      if (snapshot.phase !== 'complete') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['phase'], message: 'reject is a complete frame' });
      }
    } else if (snapshot.error) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['error'], message: 'error requires action = reject' });
    }

    if (snapshot.action === 'shift-right') {
      if (snapshot.operation !== 'insert') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['operation'], message: 'shift-right belongs to insertion' });
      }
      if (snapshot.sourceIndex === undefined || snapshot.targetIndex !== snapshot.sourceIndex + 1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['targetIndex'], message: 'shift-right must target sourceIndex + 1' });
      }
      if (snapshot.phase !== 'intermediate') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['phase'], message: 'shift-right is an intermediate frame' });
      }
    }
    if (snapshot.action === 'shift-left') {
      if (snapshot.operation !== 'delete') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['operation'], message: 'shift-left belongs to deletion' });
      }
      if (snapshot.sourceIndex === undefined || snapshot.targetIndex !== snapshot.sourceIndex - 1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['targetIndex'], message: 'shift-left must target sourceIndex - 1' });
      }
      if (snapshot.phase !== 'intermediate') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['phase'], message: 'shift-left is an intermediate frame' });
      }
    }
    if (snapshot.action === 'write') {
      if (snapshot.operation !== 'insert') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['operation'], message: 'write belongs to insertion' });
      }
      if (snapshot.targetIndex === undefined || !snapshot.change) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['change'], message: 'write must record its target and assignment' });
      }
      if (snapshot.phase !== 'intermediate') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['phase'], message: 'write is an intermediate frame' });
      }
    }
    if (snapshot.action === 'clear') {
      if (snapshot.operation !== 'delete') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['operation'], message: 'clear belongs to deletion' });
      }
      if (snapshot.targetIndex !== snapshot.length || snapshot.slots[snapshot.length]?.value !== null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['targetIndex'], message: 'clear must null the first free slot' });
      }
      if (snapshot.phase !== 'intermediate') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['phase'], message: 'clear is an intermediate frame' });
      }
    }
    if (snapshot.action === 'save') {
      if (snapshot.operation !== 'delete' || snapshot.removedIndex === undefined || snapshot.removedValue === undefined) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['removedIndex'], message: 'save must record the removed element' });
      }
      if (snapshot.phase !== 'intermediate') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['phase'], message: 'save is an intermediate frame' });
      }
    }
    if (snapshot.action === 'read') {
      if (snapshot.operation !== 'access' || snapshot.focusIndex === undefined || snapshot.found !== true || snapshot.foundIndex !== snapshot.focusIndex) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['focusIndex'], message: 'read must identify the accessed slot and result' });
      }
      if (snapshot.phase !== 'complete') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['phase'], message: 'read is a complete frame' });
      }
    }
    if ((snapshot.action === 'compare' || snapshot.action === 'visit') && snapshot.focusIndex === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['focusIndex'], message: `${snapshot.action} must identify the current slot` });
    }
    if (snapshot.operation === 'done' && (snapshot.phase !== 'complete' || snapshot.action !== 'complete')) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['operation'], message: 'done must be a complete frame' });
    }
    if (snapshot.operation === 'init' && (snapshot.phase !== 'complete' || snapshot.action !== 'complete')) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['operation'], message: 'init must be a complete frame' });
    }
    if (snapshot.operation === 'search' && snapshot.action === 'complete' && snapshot.found === true) {
      if (snapshot.foundIndex === undefined || snapshot.result === undefined) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['foundIndex'], message: 'a successful search must record its index and result' });
      } else if (JSON.stringify(snapshot.result) !== JSON.stringify(snapshot.slots[snapshot.foundIndex]?.value)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['result'], message: 'search result must equal the matching slot value' });
      }
    }
    if (snapshot.operation === 'search' && snapshot.action === 'complete' && snapshot.found === false && snapshot.foundIndex !== undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['foundIndex'], message: 'a missing search has no foundIndex' });
    }
  });
export type SequentialListSnapshot = z.infer<typeof sequentialListSnapshotSchema>;

/**
 * Stage 7D: binary-tree traversal semantics. Every frame is a full snapshot of
 * the real TreeNode objects plus the real recursion state recorded by Python:
 *
 *  - `nodes` stores stable teaching ids (`n1`, …), values and real left/right
 *    references; array order is never used as identity.
 *  - `rootId` is the single root. A node array is either empty (rootId null) or
 *    a fully reachable tree (no forest, no detached nodes, no cycles).
 *  - `visitedIds` is the real visit sequence in order; `pathIds` is the real
 *    root→current recursion path kept by the Python traversal.
 *  - `traversal` names the real executed mode. The UI reads it as a recorded
 *    fact; it is never inferred from the algorithm id or message text.
 *
 * `enter`/`return` frames are emitted by the tracked wrapper, while
 * `visit`/`left`/`right` come from explicit trace calls in the Python source.
 */
export const BINARY_TREE_OPERATIONS = [
  'init', 'enqueue', 'dequeue', 'enter', 'visit', 'left', 'right', 'return', 'done',
] as const;
export type BinaryTreeOperation = (typeof BINARY_TREE_OPERATIONS)[number];

export const BINARY_TREE_TRAVERSALS = ['preorder', 'inorder', 'postorder', 'levelorder'] as const;
export type BinaryTreeTraversal = (typeof BINARY_TREE_TRAVERSALS)[number];

export const binaryTreeNodeSchema = z.object({
  id: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  value: jsonValueSchema.refine(
    (value) => JSON.stringify(value).length <= LIMITS.MAX_VARIABLE_VALUE_JSON_BYTES,
    'binary-tree node value too large',
  ),
  leftId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
  rightId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
});
export type BinaryTreeNode = z.infer<typeof binaryTreeNodeSchema>;

export const binaryTreeSnapshotSchema = z
  .object({
    kind: z.literal('binary-tree'),
    traversal: z.enum(BINARY_TREE_TRAVERSALS),
    operation: z.enum(BINARY_TREE_OPERATIONS),
    rootId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    nodes: z.array(binaryTreeNodeSchema).max(40),
    currentNodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    visitedIds: z.array(z.string().min(1).max(LIMITS.MAX_NAME_CHARS)).max(40),
    pathIds: z.array(z.string().min(1).max(LIMITS.MAX_NAME_CHARS)).max(40),
    /** FIFO order for level-order traversal: index 0 is the FRONT. */
    queueIds: z.array(z.string().min(1).max(LIMITS.MAX_NAME_CHARS)).max(40).default([]),
  })
  .superRefine((snapshot, ctx) => {
    const ids = new Set<string>();
    const byId = new Map<string, BinaryTreeNode>();
    snapshot.nodes.forEach((node, index) => {
      if (ids.has(node.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['nodes', index, 'id'],
          message: `duplicate binary-tree node id "${node.id}"`,
        });
      }
      ids.add(node.id);
      byId.set(node.id, node);
    });

    if (snapshot.nodes.length === 0) {
      if (snapshot.rootId !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['rootId'],
          message: 'an empty binary tree must have rootId = null',
        });
      }
    } else if (snapshot.rootId === null || !ids.has(snapshot.rootId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['rootId'],
        message: 'rootId must refer to a real node in a non-empty tree',
      });
    }

    snapshot.nodes.forEach((node, index) => {
      for (const key of ['leftId', 'rightId'] as const) {
        const ref = node[key];
        if (ref !== null && !ids.has(ref)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['nodes', index, key],
            message: `${key} "${ref}" does not refer to a node`,
          });
        }
      }
    });

    if (snapshot.currentNodeId !== null && !ids.has(snapshot.currentNodeId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['currentNodeId'],
        message: `currentNodeId "${snapshot.currentNodeId}" does not refer to a node`,
      });
    }

    // Each node has at most one parent; every node is reachable exactly once
    // from the root. This rejects both multi-parent DAGs and cycles.
    const parentCount = new Map<string, number>();
    snapshot.nodes.forEach((node) => {
      for (const ref of [node.leftId, node.rightId]) {
        if (ref !== null) parentCount.set(ref, (parentCount.get(ref) ?? 0) + 1);
      }
    });
    for (const [id, count] of parentCount) {
      if (count > 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['nodes'],
          message: `node "${id}" has multiple parents`,
        });
      }
    }
    if (snapshot.rootId !== null && (parentCount.get(snapshot.rootId) ?? 0) > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['rootId'],
        message: 'the root must not have a parent',
      });
    }

    if (snapshot.nodes.length > 0 && snapshot.rootId !== null) {
      const seen = new Set<string>();
      const stack = [snapshot.rootId];
      let cycleDetected = false;
      while (stack.length) {
        const id = stack.pop() as string;
        if (seen.has(id)) {
          cycleDetected = true;
          break;
        }
        seen.add(id);
        const node = byId.get(id);
        if (!node) break;
        if (node.leftId !== null) stack.push(node.leftId);
        if (node.rightId !== null) stack.push(node.rightId);
      }
      if (cycleDetected) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['nodes'],
          message: 'cyclic binary-tree reference detected',
        });
      }
      for (const node of snapshot.nodes) {
        if (!seen.has(node.id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['nodes'],
            message: `binary-tree node "${node.id}" is not reachable from the root`,
          });
        }
      }
    }

    const visited = new Set<string>();
    snapshot.visitedIds.forEach((id, index) => {
      if (!ids.has(id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['visitedIds', index],
          message: `visited id "${id}" does not refer to a node`,
        });
      }
      if (visited.has(id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['visitedIds', index],
          message: `visitedIds contains duplicate node "${id}"`,
        });
      }
      visited.add(id);
    });

    const queue = new Set<string>();
    snapshot.queueIds.forEach((id, index) => {
      if (!ids.has(id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['queueIds', index],
          message: `queue id "${id}" does not refer to a node`,
        });
      }
      if (queue.has(id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['queueIds', index],
          message: `queueIds contains duplicate node "${id}"`,
        });
      }
      queue.add(id);
    });

    // Path validation: starts at the root, follows real parent→child edges,
    // ends at the current node, and never repeats a node.
    snapshot.pathIds.forEach((id, index) => {
      if (!ids.has(id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['pathIds', index],
          message: `path id "${id}" does not refer to a node`,
        });
      }
      if (index === 0 && id !== snapshot.rootId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['pathIds', 0],
          message: 'pathIds must start at rootId',
        });
      }
      if (index > 0) {
        const previousId = snapshot.pathIds[index - 1];
        const parent = previousId === undefined ? undefined : byId.get(previousId);
        const isChild = parent?.leftId === id || parent?.rightId === id;
        if (!isChild) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['pathIds', index],
            message: 'pathIds must follow real left/right references',
          });
        }
      }
    });

    if (snapshot.pathIds.length && snapshot.currentNodeId !== null) {
      const last = snapshot.pathIds[snapshot.pathIds.length - 1];
      if (last !== snapshot.currentNodeId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['pathIds'],
          message: 'the path must end at currentNodeId',
        });
      }
    }

    if (snapshot.operation === 'init' || snapshot.operation === 'done') {
      if (snapshot.currentNodeId !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['currentNodeId'],
          message: `${snapshot.operation} must not name a current node`,
        });
      }
      if (snapshot.pathIds.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['pathIds'],
          message: `${snapshot.operation} must have an empty recursion path`,
        });
      }
    } else {
      if (snapshot.currentNodeId === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['currentNodeId'],
          message: `${snapshot.operation} must name the current node`,
        });
      }
      if (snapshot.pathIds.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['pathIds'],
          message: `${snapshot.operation} must carry the current recursion path`,
        });
      }
    }

    if (snapshot.operation === 'visit' && snapshot.currentNodeId !== null && !visited.has(snapshot.currentNodeId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['visitedIds'],
        message: 'a visit frame must already include currentNodeId in visitedIds',
      });
    }

    if (snapshot.currentNodeId !== null) {
      const current = byId.get(snapshot.currentNodeId);
      if (snapshot.operation === 'left' && current?.leftId === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['operation'],
          message: 'left requires the current node to have a left child',
        });
      }
      if (snapshot.operation === 'right' && current?.rightId === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['operation'],
          message: 'right requires the current node to have a right child',
        });
      }
    }

    if (snapshot.traversal === 'levelorder') {
      const levelOperations = new Set<BinaryTreeOperation>([
        'init', 'enqueue', 'dequeue', 'visit', 'done',
      ]);
      if (!levelOperations.has(snapshot.operation)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['operation'],
          message: `${snapshot.operation} is not a level-order operation`,
        });
      }
      if (snapshot.operation === 'init' || snapshot.operation === 'done') {
        if (snapshot.queueIds.length > 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['queueIds'],
            message: `${snapshot.operation} must leave the queue empty`,
          });
        }
      }
      if (snapshot.operation === 'enqueue' && snapshot.currentNodeId !== null) {
        if (!queue.has(snapshot.currentNodeId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['queueIds'],
            message: 'an enqueue frame must include currentNodeId in queueIds',
          });
        }
        if (snapshot.queueIds[snapshot.queueIds.length - 1] !== snapshot.currentNodeId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['queueIds'],
            message: 'an enqueue frame must append currentNodeId at the REAR',
          });
        }
      }
      if (
        (snapshot.operation === 'dequeue' || snapshot.operation === 'visit') &&
        snapshot.currentNodeId !== null &&
        queue.has(snapshot.currentNodeId)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['queueIds'],
          message: `${snapshot.operation} requires currentNodeId to be out of the queue`,
        });
      }
    } else {
      if (snapshot.operation === 'enqueue' || snapshot.operation === 'dequeue') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['operation'],
          message: `${snapshot.operation} is only valid for level-order traversal`,
        });
      }
      if (snapshot.queueIds.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['queueIds'],
          message: 'only level-order traversal may carry queueIds',
        });
      }
    }
  });
export type BinaryTreeSnapshot = z.infer<typeof binaryTreeSnapshotSchema>;

/**
 * T1: binary-search-tree operations. The snapshot always describes the REAL
 * attached tree after the frame's operation. Node ids are stable teaching ids:
 * insertion allocates a fresh id; deletion never renames a survivor. A
 * two-child delete physically transplants the in-order successor, so the same
 * successor id appears before and after the move while the target id leaves.
 *
 * `removedNode` is the object that really left the tree. It carries the parent
 * link and replacement child that were rewired, so a renderer can explain the
 * deletion even though that object is no longer in `nodes`.
 */
export const BST_COMMANDS = ['find', 'insert', 'delete'] as const;
export type BstCommand = (typeof BST_COMMANDS)[number];

export const BST_OPERATIONS = [
  'init', 'inspect', 'go-left', 'go-right', 'found', 'not-found', 'attach',
  'locate', 'delete-leaf', 'delete-one', 'successor-search', 'successor-found',
  'successor-detach', 'transplant', 'duplicate', 'done',
] as const;
export type BstOperation = (typeof BST_OPERATIONS)[number];

export const BST_DELETE_CASES = ['leaf', 'one-child', 'two-child'] as const;
export type BstDeleteCase = (typeof BST_DELETE_CASES)[number];

export const BST_SIDES = ['left', 'right'] as const;
export type BstSide = (typeof BST_SIDES)[number];

export const BST_RESULTS = [
  'found', 'not-found', 'inserted', 'duplicate', 'deleted', 'missing',
] as const;
export type BstResult = (typeof BST_RESULTS)[number];

export const bstNodeSchema = z.object({
  id: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  value: z.number().finite(),
  leftId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
  rightId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
});
export type BstNode = z.infer<typeof bstNodeSchema>;

export const bstRemovedNodeSchema = z.object({
  id: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  value: z.number().finite(),
  parentId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
  side: z.enum(BST_SIDES).nullable(),
  role: z.enum(['target', 'successor']),
  replacementId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
});
export type BstRemovedNode = z.infer<typeof bstRemovedNodeSchema>;

const BST_ID = z.string().min(1).max(LIMITS.MAX_NAME_CHARS);

export const bstSnapshotSchema = z
  .object({
    kind: z.literal('bst'),
    preset: z.string().max(LIMITS.MAX_NAME_CHARS).nullable(),
    command: z.enum(BST_COMMANDS),
    operation: z.enum(BST_OPERATIONS),
    deleteCase: z.enum(BST_DELETE_CASES).nullable(),
    targetValue: z.number().finite(),
    rootId: BST_ID.nullable(),
    nodes: z.array(bstNodeSchema).max(40),
    currentNodeId: BST_ID.nullable(),
    pathIds: z.array(BST_ID).max(40),
    visitedIds: z.array(BST_ID).max(40),
    inorderIds: z.array(BST_ID).max(40),
    targetNodeId: BST_ID.nullable(),
    nextNodeId: BST_ID.nullable(),
    parentId: BST_ID.nullable(),
    side: z.enum(BST_SIDES).nullable(),
    insertedId: BST_ID.nullable(),
    successorId: BST_ID.nullable(),
    replacementId: BST_ID.nullable(),
    removedNode: bstRemovedNodeSchema.nullable(),
    oldRootId: BST_ID.nullable(),
    result: z.enum(BST_RESULTS).nullable(),
  })
  .superRefine((snapshot, ctx) => {
    const add = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
    const byId = new Map<string, BstNode>();
    snapshot.nodes.forEach((node, index) => {
      if (byId.has(node.id)) add(['nodes', index, 'id'], `duplicate BST node id "${node.id}"`);
      byId.set(node.id, node);
    });

    if (snapshot.nodes.length === 0) {
      if (snapshot.rootId !== null) add(['rootId'], 'an empty BST must have rootId = null');
    } else if (snapshot.rootId === null || !byId.has(snapshot.rootId)) {
      add(['rootId'], 'rootId must refer to a real node in a non-empty BST');
    }

    const parentCount = new Map<string, number>();
    snapshot.nodes.forEach((node, index) => {
      for (const key of ['leftId', 'rightId'] as const) {
        const ref = node[key];
        if (ref !== null && !byId.has(ref)) {
          add(['nodes', index, key], `${key} "${ref}" does not refer to a node`);
        }
      }
      for (const ref of [node.leftId, node.rightId]) {
        if (ref !== null) parentCount.set(ref, (parentCount.get(ref) ?? 0) + 1);
      }
    });
    for (const [id, count] of parentCount) {
      if (count > 1) add(['nodes'], `node "${id}" has multiple parents`);
    }
    if (snapshot.rootId !== null && (parentCount.get(snapshot.rootId) ?? 0) > 0) {
      add(['rootId'], 'the root must not have a parent');
    }
    if (snapshot.nodes.length > 0 && snapshot.rootId !== null) {
      const seen = new Set<string>();
      const stack = [snapshot.rootId];
      let cycle = false;
      while (stack.length) {
        const id = stack.pop() as string;
        if (seen.has(id)) {
          cycle = true;
          break;
        }
        seen.add(id);
        const node = byId.get(id);
        if (!node) break;
        if (node.leftId !== null) stack.push(node.leftId);
        if (node.rightId !== null) stack.push(node.rightId);
      }
      if (cycle) add(['nodes'], 'cyclic BST reference detected');
      for (const node of snapshot.nodes) {
        if (!seen.has(node.id)) add(['nodes'], `BST node "${node.id}" is not reachable from the root`);
      }
    }

    // The real Python snapshot must already be a valid BST. In-order is both
    // the teaching result and the strongest cheap invariant: strictly increasing
    // values under real left/right references reject misplaced nodes.
    const inorder: string[] = [];
    const stack: string[] = [];
    let current: string | null = snapshot.rootId;
    let guard = 0;
    while ((current !== null || stack.length > 0) && guard < snapshot.nodes.length * 4 + 4) {
      guard += 1;
      while (current !== null) {
        stack.push(current);
        current = byId.get(current)?.leftId ?? null;
      }
      const id = stack.pop();
      if (id === undefined) break;
      inorder.push(id);
      current = byId.get(id)?.rightId ?? null;
    }
    if (inorder.length !== snapshot.nodes.length) {
      add(['nodes'], 'in-order traversal does not cover every BST node');
    } else {
      for (let index = 1; index < inorder.length; index += 1) {
        const previous = byId.get(inorder[index - 1]);
        const next = byId.get(inorder[index]);
        if (!previous || !next || previous.value >= next.value) {
          add(['nodes'], 'BST in-order values must be strictly increasing (duplicate keys are rejected)');
          break;
        }
      }
    }
    if (snapshot.inorderIds.length !== inorder.length) {
      add(['inorderIds'], 'inorderIds must list every attached node exactly once');
    } else {
      snapshot.inorderIds.forEach((id, index) => {
        if (id !== inorder[index]) add(['inorderIds', index], 'inorderIds must equal the real in-order traversal');
      });
    }

    const visited = new Set<string>();
    snapshot.visitedIds.forEach((id, index) => {
      if (!byId.has(id)) add(['visitedIds', index], `visited id "${id}" is not an attached node`);
      if (visited.has(id)) add(['visitedIds', index], `visitedIds contains duplicate node "${id}"`);
      visited.add(id);
    });

    snapshot.pathIds.forEach((id, index) => {
      if (!byId.has(id)) add(['pathIds', index], `path id "${id}" is not an attached node`);
      if (index === 0 && id !== snapshot.rootId) add(['pathIds', 0], 'pathIds must start at rootId');
      if (index > 0) {
        const parent = byId.get(snapshot.pathIds[index - 1]);
        if (!parent || parent.leftId !== id && parent.rightId !== id) {
          add(['pathIds', index], 'pathIds must follow real left/right references');
        }
      }
    });
    if (snapshot.currentNodeId === null) {
      if (snapshot.pathIds.length > 0) add(['pathIds'], 'a frame without a current node must have an empty path');
    } else {
      if (!byId.has(snapshot.currentNodeId)) add(['currentNodeId'], `currentNodeId "${snapshot.currentNodeId}" is not attached`);
      const last = snapshot.pathIds[snapshot.pathIds.length - 1];
      if (last !== snapshot.currentNodeId) add(['pathIds'], 'the path must end at currentNodeId');
    }

    const nullCurrentOps: BstOperation[] = ['init', 'done', 'delete-leaf', 'delete-one', 'not-found'];
    if (!nullCurrentOps.includes(snapshot.operation) && snapshot.currentNodeId === null) {
      add(['currentNodeId'], `${snapshot.operation} must name a current node`);
    }

    if (snapshot.operation !== 'init' && snapshot.operation !== 'done' && snapshot.targetNodeId !== null) {
      const target = byId.get(snapshot.targetNodeId);
      if (!target) add(['targetNodeId'], 'targetNodeId must be an attached node');
      else if (target.value !== snapshot.targetValue) add(['targetNodeId'], 'targetNodeId value must equal targetValue');
    }
    if (snapshot.operation === 'init' || snapshot.operation === 'done') {
      if (snapshot.targetNodeId !== null) add(['targetNodeId'], `${snapshot.operation} must not name a target node`);
    }

    if (snapshot.nextNodeId !== null) {
      if (snapshot.operation !== 'go-left' && snapshot.operation !== 'go-right') {
        add(['nextNodeId'], 'nextNodeId is only meaningful on go-left/go-right');
      }
      if (snapshot.currentNodeId !== null) {
        const current = byId.get(snapshot.currentNodeId);
        if (snapshot.operation === 'go-left' && current?.leftId !== snapshot.nextNodeId) {
          add(['nextNodeId'], 'go-left nextNodeId must be the real left child');
        }
        if (snapshot.operation === 'go-right' && current?.rightId !== snapshot.nextNodeId) {
          add(['nextNodeId'], 'go-right nextNodeId must be the real right child');
        }
      }
    }

    if (snapshot.operation === 'attach') {
      if (snapshot.insertedId === null || !byId.has(snapshot.insertedId)) {
        add(['insertedId'], 'attach must insert an attached node');
      } else if (byId.get(snapshot.insertedId)?.value !== snapshot.targetValue) {
        add(['insertedId'], 'the inserted node value must equal targetValue');
      }
      if (snapshot.parentId === null) {
        if (snapshot.side !== null) add(['side'], 'a root insertion has no side');
        if (snapshot.rootId !== snapshot.insertedId) add(['parentId'], 'a root insertion must make insertedId the root');
      } else {
        const parent = byId.get(snapshot.parentId);
        if (!parent) add(['parentId'], 'attach parentId must be an attached node');
        else if (snapshot.side === null) add(['side'], 'a non-root insertion needs the parent side');
        else if ((snapshot.side === 'left' ? parent.leftId : parent.rightId) !== snapshot.insertedId) {
          add(['side'], 'attach side must point at the inserted node');
        }
      }
    } else if (snapshot.parentId !== null || snapshot.side !== null || snapshot.insertedId !== null) {
      add(['parentId'], 'insertion details are only allowed on attach');
    }

    if (snapshot.successorId !== null && snapshot.operation !== 'successor-search' &&
        snapshot.operation !== 'successor-found' && snapshot.operation !== 'successor-detach' &&
        snapshot.operation !== 'transplant') {
      add(['successorId'], 'successorId is only allowed on two-child delete frames');
    }
    if (snapshot.operation === 'successor-search' || snapshot.operation === 'successor-found') {
      if (snapshot.successorId === null || !byId.has(snapshot.successorId)) {
        add(['successorId'], 'successor search must name an attached successor');
      }
    }
    if (snapshot.operation === 'transplant' && snapshot.successorId !== null && !byId.has(snapshot.successorId)) {
      add(['successorId'], 'the transplanted successor must be attached');
    }

    if (snapshot.removedNode === null) {
      if (snapshot.replacementId !== null) add(['replacementId'], 'replacementId requires a removed node');
      if (snapshot.oldRootId !== null) add(['oldRootId'], 'oldRootId requires a removed node');
    } else {
      const removed = snapshot.removedNode;
      if (byId.has(removed.id)) add(['removedNode', 'id'], 'a removed node must not remain attached');
      if (removed.parentId !== null && !byId.has(removed.parentId)) {
        add(['removedNode', 'parentId'], 'the removed node parent must still be attached');
      }
      if (removed.parentId === null && removed.side !== null) {
        add(['removedNode', 'side'], 'a root removal has no side');
      }
      if (removed.parentId !== null && removed.side === null) {
        add(['removedNode', 'side'], 'a non-root removal needs the parent side');
      }
      if (snapshot.replacementId !== removed.replacementId) {
        add(['replacementId'], 'replacementId must match removedNode.replacementId');
      }
      if (removed.replacementId !== null && !byId.has(removed.replacementId)) {
        add(['removedNode', 'replacementId'], 'the replacement node must be attached');
      }
      if (snapshot.oldRootId !== null) {
        if (snapshot.oldRootId !== removed.id) add(['oldRootId'], 'oldRootId must be the removed root');
        if (snapshot.oldRootId === snapshot.rootId) add(['oldRootId'], 'oldRootId must differ from the new root');
      }
    }

    if (snapshot.operation === 'delete-leaf') {
      if (snapshot.deleteCase !== 'leaf') add(['deleteCase'], 'delete-leaf must record the leaf case');
      if (snapshot.removedNode?.role !== 'target') add(['removedNode'], 'delete-leaf must remove the target');
      if (snapshot.removedNode?.replacementId !== null) add(['replacementId'], 'a leaf has no replacement');
    }
    if (snapshot.operation === 'delete-one') {
      if (snapshot.deleteCase !== 'one-child') add(['deleteCase'], 'delete-one must record the one-child case');
      if (snapshot.removedNode?.role !== 'target') add(['removedNode'], 'delete-one must remove the target');
      if (snapshot.removedNode?.replacementId === null) add(['replacementId'], 'a one-child delete needs the child');
    }
    if (snapshot.operation === 'successor-search' || snapshot.operation === 'successor-found' ||
        snapshot.operation === 'successor-detach' || snapshot.operation === 'transplant') {
      if (snapshot.deleteCase !== 'two-child') add(['deleteCase'], 'two-child delete frames must record two-child');
    }
    if (snapshot.operation === 'successor-detach' && snapshot.removedNode?.role !== 'successor') {
      add(['removedNode'], 'successor-detach must report the successor as removed');
    }
    if (snapshot.operation === 'transplant' && snapshot.removedNode?.role !== 'target') {
      add(['removedNode'], 'transplant must report the target as removed');
    }

    const allowed: Record<BstCommand, BstOperation[]> = {
      find: ['init', 'inspect', 'go-left', 'go-right', 'found', 'not-found', 'done'],
      insert: ['init', 'inspect', 'go-left', 'go-right', 'attach', 'duplicate', 'done'],
      delete: ['init', 'inspect', 'go-left', 'go-right', 'locate', 'not-found', 'delete-leaf',
        'delete-one', 'successor-search', 'successor-found', 'successor-detach', 'transplant', 'done'],
    };
    if (!allowed[snapshot.command].includes(snapshot.operation)) {
      add(['operation'], `${snapshot.operation} is not a ${snapshot.command} operation`);
    }

    if (snapshot.operation === 'init') {
      if (snapshot.result !== null) add(['result'], 'init has no result');
      if (snapshot.deleteCase !== null) add(['deleteCase'], 'init has no delete case');
      if (snapshot.removedNode !== null) add(['removedNode'], 'init has no removed node');
    }
    if (snapshot.operation === 'found' && snapshot.result !== 'found') add(['result'], 'found must record success');
    if (snapshot.operation === 'duplicate' && snapshot.result !== 'duplicate') add(['result'], 'duplicate must record duplicate');
    if (snapshot.operation === 'attach' && snapshot.result !== 'inserted') add(['result'], 'attach must record insertion');
    if (snapshot.operation === 'not-found') {
      const expected = snapshot.command === 'delete' ? 'missing' : 'not-found';
      if (snapshot.result !== expected) add(['result'], `not-found must record ${expected}`);
    }
    if (snapshot.operation === 'delete-leaf' || snapshot.operation === 'delete-one' || snapshot.operation === 'transplant') {
      if (snapshot.result !== 'deleted') add(['result'], 'delete transition must record deletion');
    }
    if (snapshot.operation === 'done' && snapshot.result === null) add(['result'], 'done must record the final result');

    // Path/current details for frames that intentionally have no active node.
    if (snapshot.operation === 'delete-leaf' || snapshot.operation === 'delete-one') {
      if (snapshot.removedNode === null) add(['removedNode'], 'a delete result must report the removed node');
    }
  });
export type BstSnapshot = z.infer<typeof bstSnapshotSchema>;

/**
 * SEARCH-04: order-4 B-tree search and insertion.
 *
 * Every snapshot is the real attached tree after the named frame operation.
 * Insertion uses one fixed policy: split a full child BEFORE descending into it;
 * a full root is split first and grows a new root. Duplicate keys are rejected
 * before any structural change. A split is emitted as a before/after pair so the
 * full original node, the promoted median and the two resulting nodes are all
 * part of the recorded semantics rather than a visual-only effect.
 */
export const BTREE_ORDER = 4 as const;
export const BTREE_MAX_KEYS = BTREE_ORDER - 1;

export const BTREE_COMMANDS = ['find', 'insert'] as const;
export type BtreeCommand = (typeof BTREE_COMMANDS)[number];

export const BTREE_OPERATIONS = [
  'init', 'inspect', 'descend', 'found', 'not-found', 'duplicate',
  'split', 'insert', 'done',
] as const;
export type BtreeOperation = (typeof BTREE_OPERATIONS)[number];

export const BTREE_RESULTS = ['found', 'not-found', 'inserted', 'duplicate'] as const;
export type BtreeResult = (typeof BTREE_RESULTS)[number];

export const BTREE_SPLIT_PHASES = ['before', 'after'] as const;
export type BtreeSplitPhase = (typeof BTREE_SPLIT_PHASES)[number];

const BTREE_ID = z.string().min(1).max(LIMITS.MAX_NAME_CHARS);

export const btreeNodeSchema = z.object({
  id: BTREE_ID,
  /** A non-empty node holds 1..3 sorted keys for order 4. */
  keys: z.array(z.number().finite()).min(1).max(BTREE_MAX_KEYS),
  /** Leaves have no children; an internal node has exactly keys.length + 1. */
  children: z.array(BTREE_ID).max(BTREE_ORDER),
  leaf: z.boolean(),
});
export type BtreeNode = z.infer<typeof btreeNodeSchema>;

export const btreeSplitSchema = z.object({
  nodeId: BTREE_ID,
  phase: z.enum(BTREE_SPLIT_PHASES),
  leftId: BTREE_ID.nullable(),
  rightId: BTREE_ID.nullable(),
  promotedKey: z.number().finite().nullable(),
  parentId: BTREE_ID.nullable(),
  rootChanged: z.boolean(),
});
export type BtreeSplit = z.infer<typeof btreeSplitSchema>;

export const btreeSnapshotSchema = z
  .object({
    kind: z.literal('btree'),
    order: z.literal(BTREE_ORDER),
    preset: z.string().max(LIMITS.MAX_NAME_CHARS).nullable(),
    command: z.enum(BTREE_COMMANDS),
    operation: z.enum(BTREE_OPERATIONS),
    targetValue: z.number().finite(),
    rootId: BTREE_ID.nullable(),
    nodes: z.array(btreeNodeSchema).max(64),
    currentNodeId: BTREE_ID.nullable(),
    pathIds: z.array(BTREE_ID).max(20),
    compareIndex: z.number().int().min(0).max(BTREE_MAX_KEYS - 1).nullable(),
    compareKey: z.number().finite().nullable(),
    childSlot: z.number().int().min(0).max(BTREE_ORDER - 1).nullable(),
    childId: BTREE_ID.nullable(),
    split: btreeSplitSchema.nullable(),
    insertedKey: z.number().finite().nullable(),
    result: z.enum(BTREE_RESULTS).nullable(),
  })
  .superRefine((snapshot, ctx) => {
    const add = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
    const byId = new Map<string, BtreeNode>();
    snapshot.nodes.forEach((node, index) => {
      if (byId.has(node.id)) add(['nodes', index, 'id'], `duplicate B-tree node id "${node.id}"`);
      byId.set(node.id, node);
    });

    if (snapshot.nodes.length === 0) {
      if (snapshot.rootId !== null) add(['rootId'], 'an empty B-tree must have rootId = null');
    } else if (snapshot.rootId === null || !byId.has(snapshot.rootId)) {
      add(['rootId'], 'rootId must refer to a real node in a non-empty B-tree');
    }

    const parentCount = new Map<string, number>();
    snapshot.nodes.forEach((node, index) => {
      for (const ref of node.children) {
        if (!byId.has(ref)) add(['nodes', index, 'children'], `child "${ref}" does not refer to a node`);
        parentCount.set(ref, (parentCount.get(ref) ?? 0) + 1);
      }
      if (node.leaf) {
        if (node.children.length !== 0) add(['nodes', index, 'children'], 'a B-tree leaf must have no children');
        return;
      }
      if (node.children.length !== node.keys.length + 1) {
        add(['nodes', index, 'children'], 'an internal node needs exactly keys.length + 1 children');
      }
      if (node.keys.length < 1) add(['nodes', index, 'keys'], 'an internal node needs at least one separator key');
    });
    for (const [id, count] of parentCount) {
      if (count > 1) add(['nodes'], `node "${id}" has multiple parents`);
    }
    if (snapshot.rootId !== null && (parentCount.get(snapshot.rootId) ?? 0) > 0) {
      add(['rootId'], 'the root must not have a parent');
    }

    if (snapshot.nodes.length > 0 && snapshot.rootId !== null) {
      const root = byId.get(snapshot.rootId);
      if (root && !root.leaf && root.children.length < 2) {
        add(['rootId'], 'a non-leaf root must have at least two children');
      }
      const seen = new Set<string>();
      const stack = [snapshot.rootId];
      let cycle = false;
      while (stack.length) {
        const id = stack.pop() as string;
        if (seen.has(id)) {
          cycle = true;
          break;
        }
        seen.add(id);
        const node = byId.get(id);
        if (!node) break;
        for (const child of node.children) stack.push(child);
      }
      if (cycle) add(['nodes'], 'cyclic B-tree child reference detected');
      for (const node of snapshot.nodes) {
        if (!seen.has(node.id)) add(['nodes'], `B-tree node "${node.id}" is not reachable from the root`);
      }
    }

    // Strictly increasing keys inside every node, globally unique keys, and no
    // key outside the interval owned by the child slot.
    const allKeys = new Set<number>();
    const leafDepths = new Set<number>();
    let guard = 0;
    const walk = (
      id: string,
      lower: number,
      upper: number,
      depth: number,
    ): void => {
      guard += 1;
      if (guard > snapshot.nodes.length + 1) return;
      const node = byId.get(id);
      if (!node) return;
      for (let index = 0; index < node.keys.length; index += 1) {
        const key = node.keys[index];
        if (index > 0 && node.keys[index - 1] >= key) {
          add(['nodes', node.id, 'keys', index], 'keys inside a B-tree node must be strictly increasing');
        }
        if (key <= lower || key >= upper) {
          add(['nodes', node.id, 'keys', index], 'key is outside the range owned by this subtree');
        }
        if (allKeys.has(key)) add(['nodes', node.id, 'keys', index], 'duplicate key in the B-tree');
        allKeys.add(key);
      }
      if (node.leaf) {
        if (node.children.length !== 0) add(['nodes', node.id, 'children'], 'a leaf cannot own child pointers');
        leafDepths.add(depth);
        return;
      }
      if (node.children.length !== node.keys.length + 1) return;
      for (let slot = 0; slot < node.children.length; slot += 1) {
        const childLower = slot === 0 ? lower : node.keys[slot - 1];
        const childUpper = slot === node.keys.length ? upper : node.keys[slot];
        walk(node.children[slot], childLower, childUpper, depth + 1);
      }
    };
    if (snapshot.rootId !== null && byId.has(snapshot.rootId)) {
      walk(snapshot.rootId, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, 0);
    }
    if (leafDepths.size > 1) {
      add(['nodes'], 'all B-tree leaves must be at the same depth');
    }

    if (snapshot.currentNodeId === null) {
      if (snapshot.pathIds.length > 0) add(['pathIds'], 'a frame without a current node must have an empty path');
    } else {
      if (!byId.has(snapshot.currentNodeId)) add(['currentNodeId'], `currentNodeId "${snapshot.currentNodeId}" is not attached`);
      const last = snapshot.pathIds[snapshot.pathIds.length - 1];
      if (last !== snapshot.currentNodeId) add(['pathIds'], 'the path must end at currentNodeId');
    }
    snapshot.pathIds.forEach((id, index) => {
      if (!byId.has(id)) add(['pathIds', index], `path id "${id}" is not attached`);
      if (index === 0 && id !== snapshot.rootId) add(['pathIds', 0], 'pathIds must start at rootId');
      if (index > 0) {
        const parent = byId.get(snapshot.pathIds[index - 1]);
        if (!parent || !parent.children.includes(id)) {
          add(['pathIds', index], 'pathIds must follow real child references');
        }
      }
    });

    if (snapshot.compareIndex !== null || snapshot.compareKey !== null) {
      if (snapshot.compareIndex === null || snapshot.compareKey === null) {
        add(['compareIndex'], 'compareIndex and compareKey must be present together');
      } else if (snapshot.currentNodeId !== null) {
        const current = byId.get(snapshot.currentNodeId);
        if (!current || current.keys[snapshot.compareIndex] !== snapshot.compareKey) {
          add(['compareKey'], 'compareKey must equal the current node key at compareIndex');
        }
      }
    }
    if (snapshot.childSlot !== null || snapshot.childId !== null) {
      if (snapshot.childSlot === null || snapshot.childId === null) {
        add(['childSlot'], 'childSlot and childId must be present together');
      } else if (snapshot.currentNodeId !== null) {
        const current = byId.get(snapshot.currentNodeId);
        if (!current || current.children[snapshot.childSlot] !== snapshot.childId) {
          add(['childId'], 'childId must be the real child at childSlot');
        }
      }
    }

    const allowed: Record<BtreeCommand, BtreeOperation[]> = {
      find: ['init', 'inspect', 'descend', 'found', 'not-found', 'done'],
      insert: ['init', 'inspect', 'descend', 'duplicate', 'split', 'insert', 'done'],
    };
    if (!allowed[snapshot.command].includes(snapshot.operation)) {
      add(['operation'], `${snapshot.operation} is not a ${snapshot.command} operation`);
    }

    if (snapshot.operation === 'init') {
      if (snapshot.result !== null) add(['result'], 'init has no result');
      if (snapshot.compareIndex !== null || snapshot.compareKey !== null) add(['compareIndex'], 'init has no comparison');
      if (snapshot.childSlot !== null || snapshot.childId !== null) add(['childSlot'], 'init has no selected child');
      if (snapshot.split !== null) add(['split'], 'init has no split');
      if (snapshot.insertedKey !== null) add(['insertedKey'], 'init has no inserted key');
    }
    if (snapshot.operation === 'inspect') {
      if (snapshot.currentNodeId === null) add(['currentNodeId'], 'inspect needs a current node');
      if (snapshot.compareIndex === null || snapshot.compareKey === null) {
        add(['compareIndex'], 'inspect must record the compared key');
      }
      if (snapshot.result !== null) add(['result'], 'inspect has no final result yet');
      if (snapshot.split !== null || snapshot.insertedKey !== null) add(['split'], 'inspect has no split or inserted key');
    }
    if (snapshot.operation === 'descend') {
      if (snapshot.currentNodeId === null) add(['currentNodeId'], 'descend needs a current node');
      if (snapshot.childSlot === null || snapshot.childId === null) {
        add(['childSlot'], 'descend must record the selected child');
      }
      if (snapshot.compareIndex !== null || snapshot.compareKey !== null) add(['compareIndex'], 'descend has no key comparison');
      if (snapshot.result !== null) add(['result'], 'descend has no final result yet');
      if (snapshot.split !== null || snapshot.insertedKey !== null) add(['split'], 'descend has no split or inserted key');
    }
    if (snapshot.operation === 'found') {
      if (snapshot.currentNodeId === null) add(['currentNodeId'], 'found needs a current node');
      if (snapshot.compareKey !== snapshot.targetValue) add(['compareKey'], 'found must compare the target key');
      if (snapshot.result !== 'found') add(['result'], 'found must record success');
      if (snapshot.split !== null || snapshot.insertedKey !== null) add(['split'], 'found changes no structure');
    }
    if (snapshot.operation === 'not-found') {
      if (snapshot.currentNodeId === null) add(['currentNodeId'], 'not-found must name the final leaf');
      else if (!byId.get(snapshot.currentNodeId)?.leaf) add(['currentNodeId'], 'not-found must end at a leaf');
      if (snapshot.result !== 'not-found') add(['result'], 'not-found must record failure');
      if (snapshot.compareIndex !== null || snapshot.compareKey !== null) add(['compareIndex'], 'not-found has no key comparison');
      if (snapshot.split !== null || snapshot.insertedKey !== null) add(['split'], 'not-found changes no structure');
    }
    if (snapshot.operation === 'duplicate') {
      if (snapshot.currentNodeId === null) add(['currentNodeId'], 'duplicate needs the node that owns the key');
      const current = snapshot.currentNodeId === null ? undefined : byId.get(snapshot.currentNodeId);
      if (!current || !current.keys.includes(snapshot.targetValue)) {
        add(['targetValue'], 'duplicate requires the target key to exist in the current node');
      }
      if (snapshot.compareKey !== snapshot.targetValue) add(['compareKey'], 'duplicate must compare the target key');
      if (snapshot.result !== 'duplicate') add(['result'], 'duplicate must record rejection');
      if (snapshot.split !== null || snapshot.insertedKey !== null) add(['split'], 'duplicate changes no structure');
    }
    if (snapshot.operation === 'insert') {
      if (snapshot.currentNodeId === null) add(['currentNodeId'], 'insert needs the target leaf');
      else if (!byId.get(snapshot.currentNodeId)?.leaf) add(['currentNodeId'], 'insert must end at a leaf');
      const current = snapshot.currentNodeId === null ? undefined : byId.get(snapshot.currentNodeId);
      if (!current || !current.keys.includes(snapshot.targetValue)) {
        add(['targetValue'], 'insert requires the target key in the leaf after insertion');
      }
      if (snapshot.insertedKey !== snapshot.targetValue) add(['insertedKey'], 'insertedKey must equal targetValue');
      if (snapshot.result !== 'inserted') add(['result'], 'insert must record insertion');
      if (snapshot.split !== null) add(['split'], 'insert is not itself a split frame');
    }
    if (snapshot.operation === 'split') {
      if (snapshot.split === null) add(['split'], 'split must carry split details');
      if (snapshot.compareIndex !== null || snapshot.compareKey !== null) add(['compareIndex'], 'split has no key comparison');
      if (snapshot.childSlot !== null || snapshot.childId !== null) add(['childSlot'], 'split has no selected child');
      if (snapshot.result !== null) add(['result'], 'split has no final result yet');
      if (snapshot.insertedKey !== null) add(['insertedKey'], 'split frame has no inserted key yet');
    }
    if (snapshot.operation === 'done') {
      if (snapshot.currentNodeId !== null || snapshot.pathIds.length > 0) {
        add(['currentNodeId'], 'done must release the current node and path');
      }
      if (snapshot.compareIndex !== null || snapshot.compareKey !== null) add(['compareIndex'], 'done has no comparison');
      if (snapshot.childSlot !== null || snapshot.childId !== null) add(['childSlot'], 'done has no selected child');
      if (snapshot.split !== null || snapshot.insertedKey !== null) add(['split'], 'done has no split or inserted key');
      if (snapshot.result === null) add(['result'], 'done must record the final result');
      const allowedResults: BtreeResult[] = snapshot.command === 'find'
        ? ['found', 'not-found']
        : ['inserted', 'duplicate'];
      if (snapshot.result !== null && !allowedResults.includes(snapshot.result)) {
        add(['result'], `${snapshot.result} cannot finish a ${snapshot.command} run`);
      }
    }

    const split = snapshot.split;
    if (split !== null) {
      if (snapshot.operation !== 'split') add(['split'], 'split details are only allowed on split frames');
      if (!byId.has(split.nodeId)) add(['split', 'nodeId'], 'split nodeId must be attached');
      if (split.phase === 'before') {
        if (split.leftId !== null || split.rightId !== null || split.parentId !== null || split.promotedKey !== null) {
          add(['split'], 'a before frame cannot name the resulting nodes or promoted key');
        }
        if (split.rootChanged) add(['split', 'rootChanged'], 'a before frame cannot claim the root changed');
        if ((byId.get(split.nodeId)?.keys.length ?? 0) !== BTREE_MAX_KEYS) {
          add(['split', 'nodeId'], 'a split-before node must be full');
        }
      } else {
        if (split.leftId === null || split.rightId === null || split.parentId === null || split.promotedKey === null) {
          add(['split'], 'a split-after frame must name both results, the parent and the promoted key');
        } else {
          if (split.nodeId !== split.leftId) add(['split', 'nodeId'], 'the original node id survives as the left result');
          if (!byId.has(split.rightId)) add(['split', 'rightId'], 'split rightId must be attached');
          if (!byId.has(split.parentId)) add(['split', 'parentId'], 'split parentId must be attached');
          const left = byId.get(split.leftId);
          const right = byId.get(split.rightId);
          const parent = byId.get(split.parentId);
          if (!left || left.keys.length !== 1) add(['split', 'leftId'], 'a split of a full order-4 node leaves one key on the left');
          if (!right || right.keys.length !== 1) add(['split', 'rightId'], 'a split of a full order-4 node leaves one key on the right');
          if (parent) {
            const index = parent.keys.indexOf(split.promotedKey);
            if (index < 0) add(['split', 'promotedKey'], 'the promoted key must be present in the parent');
            else if (parent.children[index] !== split.leftId || parent.children[index + 1] !== split.rightId) {
              add(['split'], 'parent child slots must place the split results around the promoted key');
            }
          }
          if (split.rootChanged && split.parentId !== snapshot.rootId) {
            add(['split', 'rootChanged'], 'rootChanged requires the parent to be the new root');
          }
        }
      }
    }
  });
export type BtreeSnapshot = z.infer<typeof btreeSnapshotSchema>;

/**
 * T2: AVL tree insert/delete. The snapshot is the REAL attached AVL tree after
 * the frame operation. Nodes carry their real subtree height and balance
 * factor; rotations are recorded as before/after frames around genuine pointer
 * rewiring, never as a visual-only animation.
 */
export const AVL_COMMANDS = ['insert', 'delete'] as const;
export type AvlCommand = (typeof AVL_COMMANDS)[number];

export const AVL_OPERATIONS = [
  'init', 'inspect', 'go-left', 'go-right', 'attach', 'height', 'balance',
  'imbalance', 'rotate-left', 'rotate-right', 'duplicate', 'locate', 'not-found',
  'delete-leaf', 'delete-one', 'successor-search', 'successor-found',
  'successor-detach', 'transplant', 'done',
] as const;
export type AvlOperation = (typeof AVL_OPERATIONS)[number];

export const AVL_DELETE_CASES = ['leaf', 'one-child', 'two-child'] as const;
export type AvlDeleteCase = (typeof AVL_DELETE_CASES)[number];

export const AVL_ROTATION_CASES = ['LL', 'RR', 'LR', 'RL'] as const;
export type AvlRotationCase = (typeof AVL_ROTATION_CASES)[number];

export const AVL_ROTATION_PHASES = ['before', 'after'] as const;
export type AvlRotationPhase = (typeof AVL_ROTATION_PHASES)[number];

export const AVL_RESULTS = ['inserted', 'duplicate', 'deleted', 'missing'] as const;
export type AvlResult = (typeof AVL_RESULTS)[number];

export const avlNodeSchema = z.object({
  id: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  value: z.number().finite(),
  leftId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
  rightId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
  height: z.number().int().min(1).max(40),
  balance: z.number().int().min(-39).max(39),
});
export type AvlNode = z.infer<typeof avlNodeSchema>;

const AVL_ID = z.string().min(1).max(LIMITS.MAX_NAME_CHARS);

export const avlSnapshotSchema = z
  .object({
    kind: z.literal('avl'),
    preset: z.string().max(LIMITS.MAX_NAME_CHARS).nullable(),
    command: z.enum(AVL_COMMANDS),
    operation: z.enum(AVL_OPERATIONS),
    deleteCase: z.enum(AVL_DELETE_CASES).nullable(),
    targetValue: z.number().finite(),
    rootId: AVL_ID.nullable(),
    nodes: z.array(avlNodeSchema).max(40),
    currentNodeId: AVL_ID.nullable(),
    pathIds: z.array(AVL_ID).max(40),
    visitedIds: z.array(AVL_ID).max(40),
    inorderIds: z.array(AVL_ID).max(40),
    targetNodeId: AVL_ID.nullable(),
    nextNodeId: AVL_ID.nullable(),
    parentId: AVL_ID.nullable(),
    side: z.enum(BST_SIDES).nullable(),
    insertedId: AVL_ID.nullable(),
    successorId: AVL_ID.nullable(),
    replacementId: AVL_ID.nullable(),
    removedNode: bstRemovedNodeSchema.nullable(),
    oldRootId: AVL_ID.nullable(),
    imbalanceId: AVL_ID.nullable(),
    rotationCase: z.enum(AVL_ROTATION_CASES).nullable(),
    rotationPhase: z.enum(AVL_ROTATION_PHASES).nullable(),
    pivotId: AVL_ID.nullable(),
    promotedId: AVL_ID.nullable(),
    rotationStep: z.number().int().min(1).max(2).nullable(),
    rotationTotal: z.number().int().min(1).max(2).nullable(),
    result: z.enum(AVL_RESULTS).nullable(),
  })
  .superRefine((snapshot, ctx) => {
    const add = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
    const byId = new Map<string, AvlNode>();
    snapshot.nodes.forEach((node, index) => {
      if (byId.has(node.id)) add(['nodes', index, 'id'], `duplicate AVL node id "${node.id}"`);
      byId.set(node.id, node);
    });

    if (snapshot.nodes.length === 0) {
      if (snapshot.rootId !== null) add(['rootId'], 'an empty AVL tree must have rootId = null');
    } else if (snapshot.rootId === null || !byId.has(snapshot.rootId)) {
      add(['rootId'], 'rootId must refer to a real node in a non-empty AVL tree');
    }

    const parentCount = new Map<string, number>();
    snapshot.nodes.forEach((node, index) => {
      for (const key of ['leftId', 'rightId'] as const) {
        const ref = node[key];
        if (ref !== null && !byId.has(ref)) {
          add(['nodes', index, key], `${key} "${ref}" does not refer to a node`);
        }
      }
      for (const ref of [node.leftId, node.rightId]) {
        if (ref !== null) parentCount.set(ref, (parentCount.get(ref) ?? 0) + 1);
      }
    });
    for (const [id, count] of parentCount) {
      if (count > 1) add(['nodes'], `node "${id}" has multiple parents`);
    }
    if (snapshot.rootId !== null && (parentCount.get(snapshot.rootId) ?? 0) > 0) {
      add(['rootId'], 'the root must not have a parent');
    }
    if (snapshot.nodes.length > 0 && snapshot.rootId !== null) {
      const seen = new Set<string>();
      const stack = [snapshot.rootId];
      let cycle = false;
      while (stack.length) {
        const id = stack.pop() as string;
        if (seen.has(id)) {
          cycle = true;
          break;
        }
        seen.add(id);
        const node = byId.get(id);
        if (!node) break;
        if (node.leftId !== null) stack.push(node.leftId);
        if (node.rightId !== null) stack.push(node.rightId);
      }
      if (cycle) add(['nodes'], 'cyclic AVL reference detected');
      for (const node of snapshot.nodes) {
        if (!seen.has(node.id)) add(['nodes'], `AVL node "${node.id}" is not reachable from the root`);
      }
    }

    const inorder: string[] = [];
    const stack: string[] = [];
    let current: string | null = snapshot.rootId;
    let guard = 0;
    while ((current !== null || stack.length > 0) && guard < snapshot.nodes.length * 4 + 4) {
      guard += 1;
      while (current !== null) {
        stack.push(current);
        current = byId.get(current)?.leftId ?? null;
      }
      const id = stack.pop();
      if (id === undefined) break;
      inorder.push(id);
      current = byId.get(id)?.rightId ?? null;
    }
    if (inorder.length !== snapshot.nodes.length) {
      add(['nodes'], 'in-order traversal does not cover every AVL node');
    } else {
      for (let index = 1; index < inorder.length; index += 1) {
        const previous = byId.get(inorder[index - 1]);
        const next = byId.get(inorder[index]);
        if (!previous || !next || previous.value >= next.value) {
          add(['nodes'], 'AVL in-order values must be strictly increasing (duplicate keys are rejected)');
          break;
        }
      }
    }
    if (snapshot.inorderIds.length !== inorder.length) {
      add(['inorderIds'], 'inorderIds must list every attached node exactly once');
    } else {
      snapshot.inorderIds.forEach((id, index) => {
        if (id !== inorder[index]) add(['inorderIds', index], 'inorderIds must equal the real in-order traversal');
      });
    }

    // Heights and balance factors are checked against the attached left/right
    // references, not against a separately supplied array.
    const heightCache = new Map<string, number>();
    const balanceCache = new Map<string, number>();
    const heightOf = (id: string | null, visiting: Set<string>): number => {
      if (id === null) return 0;
      if (heightCache.has(id)) return heightCache.get(id) as number;
      if (visiting.has(id)) return 0;
      visiting.add(id);
      const node = byId.get(id);
      const value = node
        ? 1 + Math.max(heightOf(node.leftId, visiting), heightOf(node.rightId, visiting))
        : 0;
      visiting.delete(id);
      heightCache.set(id, value);
      return value;
    };
    for (const node of snapshot.nodes) {
      const actualHeight = heightOf(node.id, new Set());
      const actualBalance = heightOf(node.leftId, new Set()) - heightOf(node.rightId, new Set());
      heightCache.set(node.id, actualHeight);
      balanceCache.set(node.id, actualBalance);
      if (node.height !== actualHeight) add(['nodes'], `node "${node.id}" height must equal its real subtree height`);
      if (node.balance !== actualBalance) add(['nodes'], `node "${node.id}" balance must equal left height - right height`);
      if ((snapshot.operation === 'init' || snapshot.operation === 'done') && Math.abs(actualBalance) > 1) {
        add(['nodes'], `node "${node.id}" is not AVL-balanced at ${snapshot.operation}`);
      }
    }

    const visited = new Set<string>();
    snapshot.visitedIds.forEach((id, index) => {
      if (!byId.has(id)) add(['visitedIds', index], `visited id "${id}" is not an attached node`);
      if (visited.has(id)) add(['visitedIds', index], `visitedIds contains duplicate node "${id}"`);
      visited.add(id);
    });

    snapshot.pathIds.forEach((id, index) => {
      if (!byId.has(id)) add(['pathIds', index], `path id "${id}" is not an attached node`);
      if (index === 0 && id !== snapshot.rootId) add(['pathIds', 0], 'pathIds must start at rootId');
      if (index > 0) {
        const parent = byId.get(snapshot.pathIds[index - 1]);
        if (!parent || (parent.leftId !== id && parent.rightId !== id)) {
          add(['pathIds', index], 'pathIds must follow real left/right references');
        }
      }
    });
    if (snapshot.currentNodeId === null) {
      if (snapshot.pathIds.length > 0) add(['pathIds'], 'a frame without a current node must have an empty path');
    } else {
      if (!byId.has(snapshot.currentNodeId)) add(['currentNodeId'], `currentNodeId "${snapshot.currentNodeId}" is not attached`);
      const last = snapshot.pathIds[snapshot.pathIds.length - 1];
      if (last !== snapshot.currentNodeId) add(['pathIds'], 'the path must end at currentNodeId');
    }

    if (snapshot.targetNodeId !== null) {
      const target = byId.get(snapshot.targetNodeId);
      if (!target) add(['targetNodeId'], 'targetNodeId must be an attached node');
      else if (target.value !== snapshot.targetValue) add(['targetNodeId'], 'targetNodeId value must equal targetValue');
      if (snapshot.operation === 'init' || snapshot.operation === 'done') {
        add(['targetNodeId'], `${snapshot.operation} must not name a target node`);
      }
    }

    if (snapshot.nextNodeId !== null) {
      if (snapshot.operation !== 'go-left' && snapshot.operation !== 'go-right') {
        add(['nextNodeId'], 'nextNodeId is only meaningful on go-left/go-right');
      } else if (snapshot.currentNodeId !== null) {
        const current = byId.get(snapshot.currentNodeId);
        if (snapshot.operation === 'go-left' && current?.leftId !== snapshot.nextNodeId) {
          add(['nextNodeId'], 'go-left nextNodeId must be the real left child');
        }
        if (snapshot.operation === 'go-right' && current?.rightId !== snapshot.nextNodeId) {
          add(['nextNodeId'], 'go-right nextNodeId must be the real right child');
        }
      }
    }

    if (snapshot.operation === 'attach') {
      if (snapshot.insertedId === null || !byId.has(snapshot.insertedId)) {
        add(['insertedId'], 'attach must insert an attached node');
      } else if (byId.get(snapshot.insertedId)?.value !== snapshot.targetValue) {
        add(['insertedId'], 'the inserted node value must equal targetValue');
      }
      if (snapshot.removedNode !== null) add(['removedNode'], 'attach must not record a removed node');
    } else if (snapshot.parentId !== null || snapshot.side !== null || snapshot.insertedId !== null) {
      add(['parentId'], 'insertion details are only allowed on attach');
    }

    if (snapshot.successorId !== null && snapshot.operation !== 'successor-search' &&
        snapshot.operation !== 'successor-found' && snapshot.operation !== 'successor-detach' &&
        snapshot.operation !== 'transplant') {
      add(['successorId'], 'successorId is only allowed on two-child delete frames');
    }
    if (snapshot.operation === 'successor-search' || snapshot.operation === 'successor-found') {
      if (snapshot.successorId === null || !byId.has(snapshot.successorId)) {
        add(['successorId'], 'successor search must name an attached successor');
      }
    }
    if (snapshot.operation === 'transplant' && snapshot.successorId !== null && !byId.has(snapshot.successorId)) {
      add(['successorId'], 'the transplanted successor must be attached');
    }

    if (snapshot.removedNode === null) {
      if (snapshot.replacementId !== null) add(['replacementId'], 'replacementId requires a removed node');
      if (snapshot.oldRootId !== null) add(['oldRootId'], 'oldRootId requires a removed node');
    } else {
      const removed = snapshot.removedNode;
      if (byId.has(removed.id)) add(['removedNode', 'id'], 'a removed node must not remain attached');
      if (removed.parentId !== null && !byId.has(removed.parentId)) {
        add(['removedNode', 'parentId'], 'the removed node parent must still be attached');
      }
      if (removed.parentId === null && removed.side !== null) {
        add(['removedNode', 'side'], 'a root removal has no side');
      }
      if (removed.parentId !== null && removed.side === null) {
        add(['removedNode', 'side'], 'a non-root removal needs the parent side');
      }
      if (snapshot.replacementId !== removed.replacementId) {
        add(['replacementId'], 'replacementId must match removedNode.replacementId');
      }
      if (removed.replacementId !== null && !byId.has(removed.replacementId)) {
        add(['removedNode', 'replacementId'], 'the replacement node must be attached');
      }
      if (snapshot.oldRootId !== null) {
        if (snapshot.oldRootId !== removed.id) add(['oldRootId'], 'oldRootId must be the removed root');
        if (snapshot.oldRootId === snapshot.rootId) add(['oldRootId'], 'oldRootId must differ from the new root');
      }
    }

    if (snapshot.operation === 'delete-leaf') {
      if (snapshot.deleteCase !== 'leaf') add(['deleteCase'], 'delete-leaf must record the leaf case');
      if (snapshot.removedNode?.role !== 'target') add(['removedNode'], 'delete-leaf must remove the target');
      if (snapshot.removedNode?.replacementId !== null) add(['replacementId'], 'a leaf has no replacement');
    }
    if (snapshot.operation === 'delete-one') {
      if (snapshot.deleteCase !== 'one-child') add(['deleteCase'], 'delete-one must record the one-child case');
      if (snapshot.removedNode?.role !== 'target') add(['removedNode'], 'delete-one must remove the target');
      if (snapshot.removedNode?.replacementId === null) add(['replacementId'], 'a one-child delete needs the child');
    }
    if (snapshot.operation === 'successor-search' || snapshot.operation === 'successor-found' ||
        snapshot.operation === 'successor-detach' || snapshot.operation === 'transplant') {
      if (snapshot.deleteCase !== 'two-child') add(['deleteCase'], 'two-child delete frames must record two-child');
    }
    if (snapshot.operation === 'successor-detach' && snapshot.removedNode?.role !== 'successor') {
      add(['removedNode'], 'successor-detach must report the successor as removed');
    }
    if (snapshot.operation === 'transplant' && snapshot.removedNode?.role !== 'target') {
      add(['removedNode'], 'transplant must report the target as removed');
    }

    const rotationOps: AvlOperation[] = ['imbalance', 'rotate-left', 'rotate-right'];
    const isRotation = snapshot.operation === 'rotate-left' || snapshot.operation === 'rotate-right';
    if (rotationOps.includes(snapshot.operation)) {
      if (snapshot.imbalanceId === null || !byId.has(snapshot.imbalanceId)) {
        add(['imbalanceId'], 'rotation frames must name an attached imbalance node');
      }
      if (snapshot.rotationCase === null) add(['rotationCase'], 'rotation frames need a rotation case');
      if (snapshot.pivotId === null || !byId.has(snapshot.pivotId)) {
        add(['pivotId'], 'rotation frames must name an attached pivot node');
      }
      if (snapshot.rotationStep === null || snapshot.rotationTotal === null) {
        add(['rotationStep'], 'rotation frames need step and total');
      } else if (snapshot.rotationStep > snapshot.rotationTotal) {
        add(['rotationStep'], 'rotationStep must be <= rotationTotal');
      }
      if (isRotation) {
        if (snapshot.rotationPhase === null) add(['rotationPhase'], 'rotate frames need a before/after phase');
        if (snapshot.promotedId === null || !byId.has(snapshot.promotedId)) {
          add(['promotedId'], 'rotate frames must name an attached promoted node');
        }
      }
    } else {
      if (snapshot.rotationCase !== null || snapshot.rotationPhase !== null ||
          snapshot.pivotId !== null || snapshot.promotedId !== null ||
          snapshot.rotationStep !== null || snapshot.rotationTotal !== null || snapshot.imbalanceId !== null) {
        add(['rotationCase'], 'rotation details are only allowed on rotation frames');
      }
    }
    if (snapshot.rotationPhase !== null && !isRotation) {
      add(['rotationPhase'], 'only rotate frames may carry a rotation phase');
    }

    const allowed: Record<AvlCommand, AvlOperation[]> = {
      insert: ['init', 'inspect', 'go-left', 'go-right', 'attach', 'height', 'balance',
        'imbalance', 'rotate-left', 'rotate-right', 'duplicate', 'done'],
      delete: ['init', 'inspect', 'go-left', 'go-right', 'locate', 'not-found', 'delete-leaf',
        'delete-one', 'successor-search', 'successor-found', 'successor-detach', 'transplant',
        'height', 'balance', 'imbalance', 'rotate-left', 'rotate-right', 'done'],
    };
    if (!allowed[snapshot.command].includes(snapshot.operation)) {
      add(['operation'], `${snapshot.operation} is not a ${snapshot.command} operation`);
    }

    if (snapshot.operation === 'init') {
      if (snapshot.result !== null) add(['result'], 'init has no result');
      if (snapshot.deleteCase !== null) add(['deleteCase'], 'init has no delete case');
      if (snapshot.removedNode !== null) add(['removedNode'], 'init has no removed node');
    }
    if (snapshot.operation === 'duplicate' && snapshot.result !== 'duplicate') add(['result'], 'duplicate must record duplicate');
    if (snapshot.operation === 'attach' && snapshot.result !== 'inserted') add(['result'], 'attach must record insertion');
    if (snapshot.operation === 'not-found') {
      if (snapshot.result !== 'missing') add(['result'], 'not-found must record missing');
    }
    if (snapshot.operation === 'delete-leaf' || snapshot.operation === 'delete-one' || snapshot.operation === 'transplant') {
      if (snapshot.result !== 'deleted') add(['result'], 'delete transition must record deletion');
    }
    if (snapshot.operation === 'done' && snapshot.result === null) add(['result'], 'done must record the final result');
  });
export type AvlSnapshot = z.infer<typeof avlSnapshotSchema>;


/**
 * Stage 7E graph traversal.
 *
 * The graph is an UNDIRECTED SIMPLE GRAPH. Node ids are the stable teaching
 * identity; duplicate undirected edges are normalised by the Python input
 * builder and self-loops are rejected before a run starts. Cycles are valid.
 *
 * `discoveredIds` are nodes that entered the discovered set at least once,
 * `frontierItems` are the subset still waiting in the queue/stack, and
 * `visitedIds` are nodes that completed their formal visit. The runner marks
 * BFS discovered at enqueue and DFS discovered at push; `visited` happens only
 * after dequeue/pop. All three states are snapshotted on the SAME trace frame.
 */
export const GRAPH_ALGORITHMS = ['bfs', 'dfs'] as const;
export type GraphAlgorithm = (typeof GRAPH_ALGORITHMS)[number];

export const GRAPH_OPERATIONS = [
  'init', 'enqueue', 'dequeue', 'push', 'pop', 'inspect-edge', 'discover', 'visit', 'skip', 'done',
] as const;
export type GraphOperation = (typeof GRAPH_OPERATIONS)[number];

export const GRAPH_FRONTIER_KINDS = ['queue', 'stack'] as const;
export type GraphFrontierKind = (typeof GRAPH_FRONTIER_KINDS)[number];

const GRAPH_OPERATIONS_BY_ALGORITHM: Record<GraphAlgorithm, readonly GraphOperation[]> = {
  bfs: ['init', 'enqueue', 'dequeue', 'inspect-edge', 'discover', 'visit', 'skip', 'done'],
  dfs: ['init', 'push', 'pop', 'inspect-edge', 'discover', 'visit', 'skip', 'done'],
};

export const GRAPH_LIMITS = {
  MAX_NODES: 20,
  MAX_EDGES: 40,
  MAX_FRONTIER: 20,
  /** A heap can hold one entry per successful relax, so it needs more room
   * than a BFS/DFS frontier while the same 20-node / 40-edge cap holds. */
  MAX_PRIORITY_QUEUE: 64,
} as const;

export const graphNodeSchema = z.object({
  id: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  value: jsonValueSchema.refine(
    (value) => JSON.stringify(value).length <= LIMITS.MAX_VARIABLE_VALUE_JSON_BYTES,
    'graph node value too large',
  ),
});
export type GraphNode = z.infer<typeof graphNodeSchema>;

export const graphEdgeSchema = z.object({
  id: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  fromId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  toId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
});
export type GraphEdge = z.infer<typeof graphEdgeSchema>;

export const graphFrontierItemSchema = z.object({
  id: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  nodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
});
export type GraphFrontierItem = z.infer<typeof graphFrontierItemSchema>;

export const graphSnapshotSchema = z
  .object({
    kind: z.literal('graph'),
    algorithm: z.enum(GRAPH_ALGORITHMS),
    operation: z.enum(GRAPH_OPERATIONS),
    nodes: z.array(graphNodeSchema).max(GRAPH_LIMITS.MAX_NODES),
    edges: z.array(graphEdgeSchema).max(GRAPH_LIMITS.MAX_EDGES),
    startNodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    currentNodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    currentEdgeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    /** The neighbor currently looked at; null unless an edge is being handled. */
    neighborNodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    discoveredIds: z.array(z.string().min(1).max(LIMITS.MAX_NAME_CHARS)).max(GRAPH_LIMITS.MAX_NODES),
    visitedIds: z.array(z.string().min(1).max(LIMITS.MAX_NAME_CHARS)).max(GRAPH_LIMITS.MAX_NODES),
    visitOrder: z.array(z.string().min(1).max(LIMITS.MAX_NAME_CHARS)).max(GRAPH_LIMITS.MAX_NODES),
    frontierKind: z.enum(GRAPH_FRONTIER_KINDS),
    frontierItems: z.array(graphFrontierItemSchema).max(GRAPH_LIMITS.MAX_FRONTIER),
    /** The element that just left the frontier; non-null only for dequeue/pop. */
    frontierRemoved: graphFrontierItemSchema.nullable(),
  })
  .superRefine((snapshot, ctx) => {
    const ids = new Set<string>();
    snapshot.nodes.forEach((node, index) => {
      if (ids.has(node.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['nodes', index, 'id'],
          message: `duplicate graph node id "${node.id}"`,
        });
      }
      ids.add(node.id);
    });

    const edgeIds = new Set<string>();
    const pairs = new Set<string>();
    const edgeById = new Map<string, GraphEdge>();
    snapshot.edges.forEach((edge, index) => {
      if (edgeIds.has(edge.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['edges', index, 'id'],
          message: `duplicate graph edge id "${edge.id}"`,
        });
      }
      edgeIds.add(edge.id);
      edgeById.set(edge.id, edge);
      if (!ids.has(edge.fromId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['edges', index, 'fromId'],
          message: `edge "${edge.id}" starts at unknown node "${edge.fromId}"`,
        });
      }
      if (!ids.has(edge.toId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['edges', index, 'toId'],
          message: `edge "${edge.id}" ends at unknown node "${edge.toId}"`,
        });
      }
      if (edge.fromId === edge.toId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['edges', index],
          message: 'self-loops are not supported in the Stage 7E teaching graph',
        });
      }
      if (ids.has(edge.fromId) && ids.has(edge.toId) && edge.fromId !== edge.toId) {
        const pair = [edge.fromId, edge.toId].sort().join('\u0000');
        if (pairs.has(pair)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['edges', index],
            message: `duplicate undirected edge "${edge.fromId}"–"${edge.toId}"`,
          });
        }
        pairs.add(pair);
      }
    });

    if (!GRAPH_OPERATIONS_BY_ALGORITHM[snapshot.algorithm].includes(snapshot.operation)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['operation'],
        message: `operation "${snapshot.operation}" is not valid for ${snapshot.algorithm}`,
      });
    }
    const expectedFrontier: GraphFrontierKind = snapshot.algorithm === 'bfs' ? 'queue' : 'stack';
    if (snapshot.frontierKind !== expectedFrontier) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['frontierKind'],
        message: `${snapshot.algorithm} must use a ${expectedFrontier} frontier`,
      });
    }

    if (snapshot.nodes.length === 0) {
      if (snapshot.startNodeId !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['startNodeId'],
          message: 'an empty graph must have startNodeId = null',
        });
      }
      if (snapshot.operation !== 'init' && snapshot.operation !== 'done') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['operation'],
          message: 'an empty graph may only emit init or done',
        });
      }
      if (snapshot.currentNodeId !== null || snapshot.currentEdgeId !== null || snapshot.neighborNodeId !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['currentNodeId'],
          message: 'an empty graph has no current node or edge',
        });
      }
      if (snapshot.discoveredIds.length || snapshot.visitedIds.length || snapshot.visitOrder.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['discoveredIds'],
          message: 'an empty graph has no discovered or visited nodes',
        });
      }
      if (snapshot.frontierItems.length || snapshot.frontierRemoved !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['frontierItems'],
          message: 'an empty graph has an empty frontier',
        });
      }
      return;
    }

    if (snapshot.startNodeId === null || !ids.has(snapshot.startNodeId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['startNodeId'],
        message: 'startNodeId must refer to a real node in a non-empty graph',
      });
    }

    const uniqueRefList = (values: string[], path: string, label: string): Set<string> => {
      const seen = new Set<string>();
      values.forEach((value, index) => {
        if (!ids.has(value)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [path, index],
            message: `${label} "${value}" does not refer to a node`,
          });
        }
        if (seen.has(value)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [path, index],
            message: `${label} contains duplicate node "${value}"`,
          });
        }
        seen.add(value);
      });
      return seen;
    };

    const discovered = uniqueRefList(snapshot.discoveredIds, 'discoveredIds', 'discoveredIds');
    const visited = uniqueRefList(snapshot.visitedIds, 'visitedIds', 'visitedIds');
    uniqueRefList(snapshot.visitOrder, 'visitOrder', 'visitOrder');
    for (const id of visited) {
      if (!discovered.has(id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['visitedIds'],
          message: `visited node "${id}" was never discovered`,
        });
      }
    }
    if (
      snapshot.visitedIds.length !== snapshot.visitOrder.length ||
      snapshot.visitedIds.some((id, index) => snapshot.visitOrder[index] !== id)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['visitOrder'],
        message: 'visitOrder must equal visitedIds in the real visit order',
      });
    }

    const current = snapshot.currentNodeId;
    if (snapshot.operation !== 'init' && snapshot.operation !== 'done') {
      if (current === null || !ids.has(current)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['currentNodeId'],
          message: 'a non-terminal graph frame must name the current node',
        });
      }
    }
    if (snapshot.operation === 'init') {
      if (current !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['currentNodeId'],
          message: 'init must not name a current node',
        });
      }
      if (snapshot.discoveredIds.length || snapshot.visitedIds.length || snapshot.frontierItems.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['discoveredIds'],
          message: 'init happens before any node is discovered',
        });
      }
    }
    if (snapshot.operation === 'done') {
      if (current !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['currentNodeId'],
          message: 'done must not name a current node',
        });
      }
      if (snapshot.frontierItems.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['frontierItems'],
          message: 'done requires an empty frontier',
        });
      }
    }

    if (current !== null && snapshot.operation !== 'init' && snapshot.operation !== 'done') {
      if (!discovered.has(current)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['currentNodeId'],
          message: `current node "${current}" is not discovered`,
        });
      }
    }

    if (snapshot.operation !== 'init' && snapshot.startNodeId !== null && !discovered.has(snapshot.startNodeId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['startNodeId'],
        message: 'startNodeId must be discovered once traversal begins',
      });
    }

    if (snapshot.operation === 'visit' && current !== null) {
      if (!visited.has(current)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['visitedIds'],
          message: 'visit must already include currentNodeId in visitedIds',
        });
      }
      if (snapshot.visitOrder[snapshot.visitOrder.length - 1] !== current) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['visitOrder'],
          message: 'visit must append currentNodeId to visitOrder',
        });
      }
      if (snapshot.currentEdgeId !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['currentEdgeId'],
          message: 'a visit frame must not keep an edge highlighted',
        });
      }
    }
    if (['dequeue', 'pop'].includes(snapshot.operation) && current !== null && visited.has(current)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['visitedIds'],
        message: `${snapshot.operation} must happen before the node is visited`,
      });
    }
    if (
      ['inspect-edge', 'discover', 'skip'].includes(snapshot.operation) &&
      current !== null &&
      !visited.has(current)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['visitedIds'],
        message: `${snapshot.operation} happens while the current node is being processed`,
      });
    }

    if (snapshot.currentEdgeId !== null) {
      const edge = edgeById.get(snapshot.currentEdgeId);
      if (!edge) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['currentEdgeId'],
          message: `currentEdgeId "${snapshot.currentEdgeId}" does not refer to an edge`,
        });
      } else if (current !== null && edge.fromId !== current && edge.toId !== current) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['currentEdgeId'],
          message: 'the highlighted edge must touch the current node',
        });
      }
      if (['init', 'done', 'dequeue', 'pop', 'visit'].includes(snapshot.operation)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['currentEdgeId'],
          message: `${snapshot.operation} must not keep an edge highlighted`,
        });
      }
    } else if (['inspect-edge', 'discover', 'skip'].includes(snapshot.operation)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['currentEdgeId'],
        message: `${snapshot.operation} requires a real edge`,
      });
    }

    const neighbor = snapshot.neighborNodeId;
    if (neighbor !== null && !ids.has(neighbor)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['neighborNodeId'],
        message: `neighborNodeId "${neighbor}" does not refer to a node`,
      });
    }
    if (neighbor !== null && current !== null && neighbor === current) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['neighborNodeId'],
        message: 'the neighbor cannot be the current node',
      });
    }
    if (['inspect-edge', 'discover', 'skip'].includes(snapshot.operation) && neighbor === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['neighborNodeId'],
        message: `${snapshot.operation} requires the neighbor being examined`,
      });
    }
    if (['dequeue', 'pop', 'visit', 'init', 'done'].includes(snapshot.operation) && neighbor !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['neighborNodeId'],
        message: `${snapshot.operation} must not name a neighbor`,
      });
    }
    if (snapshot.currentEdgeId !== null && neighbor !== null) {
      const edge = edgeById.get(snapshot.currentEdgeId);
      if (edge && edge.fromId !== neighbor && edge.toId !== neighbor) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['neighborNodeId'],
          message: 'the neighbor must be an endpoint of currentEdgeId',
        });
      }
    }

    if (snapshot.operation === 'discover' && neighbor !== null) {
      if (!discovered.has(neighbor)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['discoveredIds'],
          message: 'discover must include the newly discovered neighbor',
        });
      }
      if (visited.has(neighbor)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['visitedIds'],
          message: 'a newly discovered neighbor cannot already be visited',
        });
      }
    }
    if (snapshot.operation === 'skip' && neighbor !== null && !discovered.has(neighbor)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['neighborNodeId'],
        message: 'skip requires the neighbor to be already discovered',
      });
    }

    const frontierIds = new Set<string>();
    const frontierNodes = new Set<string>();
    snapshot.frontierItems.forEach((item, index) => {
      if (frontierIds.has(item.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['frontierItems', index, 'id'],
          message: `duplicate frontier entry id "${item.id}"`,
        });
      }
      frontierIds.add(item.id);
      if (!ids.has(item.nodeId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['frontierItems', index, 'nodeId'],
          message: `frontier node "${item.nodeId}" does not refer to a node`,
        });
      }
      if (frontierNodes.has(item.nodeId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['frontierItems', index, 'nodeId'],
          message: `frontier contains node "${item.nodeId}" more than once`,
        });
      }
      frontierNodes.add(item.nodeId);
      if (!discovered.has(item.nodeId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['frontierItems', index, 'nodeId'],
          message: `frontier node "${item.nodeId}" was never discovered`,
        });
      }
      if (visited.has(item.nodeId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['frontierItems', index, 'nodeId'],
          message: `visited node "${item.nodeId}" cannot remain in the frontier`,
        });
      }
    });

    const removed = snapshot.frontierRemoved;
    if (['dequeue', 'pop'].includes(snapshot.operation)) {
      if (removed === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['frontierRemoved'],
          message: `${snapshot.operation} must record the removed frontier element`,
        });
      } else {
        if (removed.nodeId !== current) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['frontierRemoved', 'nodeId'],
            message: 'the removed frontier element must be currentNodeId',
          });
        }
        if (frontierNodes.has(removed.nodeId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['frontierRemoved', 'nodeId'],
            message: 'the removed element cannot still be in frontierItems',
          });
        }
        if (!discovered.has(removed.nodeId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['frontierRemoved', 'nodeId'],
            message: 'the removed element was not discovered',
          });
        }
      }
    } else if (removed !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['frontierRemoved'],
        message: 'only dequeue/pop may record a removed frontier element',
      });
    }

    if (snapshot.operation === 'enqueue' || snapshot.operation === 'push') {
      if (snapshot.currentEdgeId === null) {
        if (current !== snapshot.startNodeId || snapshot.visitedIds.length > 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['currentEdgeId'],
            message: 'an edge-less push/enqueue is only the first start-node operation',
          });
        }
        if (snapshot.startNodeId !== null && !frontierNodes.has(snapshot.startNodeId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['frontierItems'],
            message: 'the start node must be in the frontier after its first push/enqueue',
          });
        }
      } else if (neighbor === null || !frontierNodes.has(neighbor)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['frontierItems'],
          message: 'a new node push/enqueue must include the neighbor in the frontier',
        });
      }
    }
  });
export type GraphSnapshot = z.infer<typeof graphSnapshotSchema>;

/**
 * Stage 7F weighted graph / Dijkstra.
 *
 * A sibling of the Stage 7E graph snapshot instead of extra optional fields on
 * it. That keeps the BFS/DFS contract byte-for-byte unchanged while Dijkstra
 * gets a genuinely different frontier: a heap may contain duplicate node ids
 * and stale entries, which the queue/stack schema deliberately forbids.
 *
 * `visitedIds` / `visitOrder` are the settled nodes here. A node is settled
 * only after its smallest heap entry is popped; tentative distances and
 * previous pointers live in `distances` / `previous`. `null` distance means
 * unreachable/infinite — Python `float("inf")` never enters JSON.
 */
export const DIJKSTRA_OPERATIONS = [
  'init', 'push', 'pop', 'stale', 'settle', 'inspect-edge', 'relax', 'skip', 'done',
] as const;
export type DijkstraOperation = (typeof DIJKSTRA_OPERATIONS)[number];

const weightedGraphEdgeSchema = graphEdgeSchema.extend({
  weight: z.number().finite().nonnegative(),
});

const weightedDistanceRowSchema = z.object({
  nodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  /** null = unreachable / infinity; never a JSON Infinity or a magic string. */
  distance: z.number().finite().nonnegative().nullable(),
});

const weightedPreviousRowSchema = z.object({
  nodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  previousId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
});

const priorityQueueItemSchema = z.object({
  id: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  nodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  distance: z.number().finite().nonnegative(),
  stale: z.boolean(),
});

const relaxChangeSchema = z.object({
  nodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  oldDistance: z.number().finite().nonnegative().nullable(),
  newDistance: z.number().finite().nonnegative(),
  oldPreviousId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
  newPreviousId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
});

export const weightedGraphSnapshotSchema = z
  .object({
    kind: z.literal('weighted-graph'),
    algorithm: z.literal('dijkstra'),
    operation: z.enum(DIJKSTRA_OPERATIONS),
    nodes: z.array(graphNodeSchema).max(GRAPH_LIMITS.MAX_NODES),
    edges: z.array(weightedGraphEdgeSchema).max(GRAPH_LIMITS.MAX_EDGES),
    /** false = undirected; true = directed (outgoing adjacency only). */
    directed: z.boolean(),
    startNodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    targetNodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    currentNodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    currentEdgeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    neighborNodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    discoveredIds: z.array(z.string().min(1).max(LIMITS.MAX_NAME_CHARS)).max(GRAPH_LIMITS.MAX_NODES),
    /** Dijkstra's settled set; kept in the same fields as BFS/DFS visited. */
    visitedIds: z.array(z.string().min(1).max(LIMITS.MAX_NAME_CHARS)).max(GRAPH_LIMITS.MAX_NODES),
    visitOrder: z.array(z.string().min(1).max(LIMITS.MAX_NAME_CHARS)).max(GRAPH_LIMITS.MAX_NODES),
    distances: z.array(weightedDistanceRowSchema).max(GRAPH_LIMITS.MAX_NODES),
    previous: z.array(weightedPreviousRowSchema).max(GRAPH_LIMITS.MAX_NODES),
    frontierKind: z.literal('priority-queue'),
    /** Heap entries may repeat a node id; entry ids stay unique. */
    frontierItems: z.array(priorityQueueItemSchema).max(GRAPH_LIMITS.MAX_PRIORITY_QUEUE),
    frontierRemoved: priorityQueueItemSchema.nullable(),
    frontierAdded: priorityQueueItemSchema.nullable(),
    relax: relaxChangeSchema.nullable(),
    /** Empty array means no path (unreachable, or not the final frame yet). */
    pathNodeIds: z.array(z.string().min(1).max(LIMITS.MAX_NAME_CHARS)).max(GRAPH_LIMITS.MAX_NODES).nullable(),
    pathDistance: z.number().finite().nonnegative().nullable(),
  })
  .superRefine((snapshot, ctx) => {
    const add = (path: Array<string | number>, message: string) => {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
    };
    const ids = new Set<string>();
    snapshot.nodes.forEach((node, index) => {
      if (ids.has(node.id)) add(['nodes', index, 'id'], `duplicate graph node id "${node.id}"`);
      ids.add(node.id);
    });

    const edgeIds = new Set<string>();
    const edgeById = new Map<string, z.infer<typeof weightedGraphEdgeSchema>>();
    const edgePairs = new Set<string>();
    snapshot.edges.forEach((edge, index) => {
      if (edgeIds.has(edge.id)) add(['edges', index, 'id'], `duplicate graph edge id "${edge.id}"`);
      edgeIds.add(edge.id);
      edgeById.set(edge.id, edge);
      if (!ids.has(edge.fromId)) add(['edges', index, 'fromId'], `edge "${edge.id}" starts at unknown node "${edge.fromId}"`);
      if (!ids.has(edge.toId)) add(['edges', index, 'toId'], `edge "${edge.id}" ends at unknown node "${edge.toId}"`);
      if (edge.fromId === edge.toId) add(['edges', index], 'self-loops are not supported in the Dijkstra teaching graph');
      if (ids.has(edge.fromId) && ids.has(edge.toId) && edge.fromId !== edge.toId) {
        const pair = snapshot.directed
          ? `${edge.fromId}\u0000${edge.toId}`
          : [edge.fromId, edge.toId].sort().join('\u0000');
        if (edgePairs.has(pair)) {
          add(
            ['edges', index],
            snapshot.directed
              ? `duplicate directed edge "${edge.fromId}"→"${edge.toId}"`
              : `duplicate undirected edge "${edge.fromId}"–"${edge.toId}"`,
          );
        }
        edgePairs.add(pair);
      }
    });

    if (snapshot.nodes.length === 0) {
      if (snapshot.startNodeId !== null || snapshot.targetNodeId !== null) {
        add(['startNodeId'], 'an empty graph must have startNodeId and targetNodeId = null');
      }
      if (snapshot.operation !== 'init' && snapshot.operation !== 'done') {
        add(['operation'], 'an empty graph may only emit init or done');
      }
      if (snapshot.currentNodeId !== null || snapshot.currentEdgeId !== null || snapshot.neighborNodeId !== null) {
        add(['currentNodeId'], 'an empty graph has no current node or edge');
      }
      if (
        snapshot.discoveredIds.length ||
        snapshot.visitedIds.length ||
        snapshot.visitOrder.length ||
        snapshot.distances.length ||
        snapshot.previous.length ||
        snapshot.frontierItems.length ||
        snapshot.frontierRemoved ||
        snapshot.frontierAdded ||
        snapshot.relax
      ) {
        add(['discoveredIds'], 'an empty graph has no state');
      }
      if (snapshot.pathNodeIds && snapshot.pathNodeIds.length) add(['pathNodeIds'], 'an empty graph has no path');
      if (snapshot.pathDistance !== null) add(['pathDistance'], 'an empty graph has no path distance');
      return;
    }

    if (snapshot.startNodeId === null || !ids.has(snapshot.startNodeId)) {
      add(['startNodeId'], 'startNodeId must refer to a real node in a non-empty graph');
    }
    if (snapshot.targetNodeId === null || !ids.has(snapshot.targetNodeId)) {
      add(['targetNodeId'], 'targetNodeId must refer to a real node in a non-empty graph');
    }

    const uniqueRefList = (values: string[], path: string, label: string): Set<string> => {
      const seen = new Set<string>();
      values.forEach((value, index) => {
        if (!ids.has(value)) add([path, index], `${label} "${value}" does not refer to a node`);
        if (seen.has(value)) add([path, index], `${label} contains duplicate node "${value}"`);
        seen.add(value);
      });
      return seen;
    };

    const discovered = uniqueRefList(snapshot.discoveredIds, 'discoveredIds', 'discoveredIds');
    const visited = uniqueRefList(snapshot.visitedIds, 'visitedIds', 'visitedIds');
    uniqueRefList(snapshot.visitOrder, 'visitOrder', 'visitOrder');
    for (const id of visited) {
      if (!discovered.has(id)) add(['visitedIds'], `settled node "${id}" was never discovered`);
    }
    if (
      snapshot.visitedIds.length !== snapshot.visitOrder.length ||
      snapshot.visitedIds.some((id, index) => snapshot.visitOrder[index] !== id)
    ) {
      add(['visitOrder'], 'visitOrder must equal visitedIds in the real settlement order');
    }

    const distanceById = new Map<string, number | null>();
    snapshot.distances.forEach((row, index) => {
      if (!ids.has(row.nodeId)) add(['distances', index, 'nodeId'], `distance row "${row.nodeId}" does not refer to a node`);
      if (distanceById.has(row.nodeId)) add(['distances', index, 'nodeId'], `duplicate distance row for "${row.nodeId}"`);
      distanceById.set(row.nodeId, row.distance);
    });
    snapshot.nodes.forEach((node) => {
      if (!distanceById.has(node.id)) add(['distances'], `missing distance row for node "${node.id}"`);
    });

    const previousById = new Map<string, string | null>();
    snapshot.previous.forEach((row, index) => {
      if (!ids.has(row.nodeId)) add(['previous', index, 'nodeId'], `previous row "${row.nodeId}" does not refer to a node`);
      if (previousById.has(row.nodeId)) add(['previous', index, 'nodeId'], `duplicate previous row for "${row.nodeId}"`);
      if (row.previousId !== null && !ids.has(row.previousId)) {
        add(['previous', index, 'previousId'], `previous node "${row.previousId}" does not exist`);
      }
      if (row.previousId === row.nodeId) add(['previous', index, 'previousId'], 'a node cannot be its own previous node');
      previousById.set(row.nodeId, row.previousId);
    });
    snapshot.nodes.forEach((node) => {
      if (!previousById.has(node.id)) add(['previous'], `missing previous row for node "${node.id}"`);
    });
    // Every finite-distance node must climb the previous chain back to the start
    // without a cycle; otherwise the final path reconstruction would be a lie.
    snapshot.nodes.forEach((node) => {
      const distance = distanceById.get(node.id);
      if (node.id === snapshot.startNodeId || distance === null || distance === undefined) return;
      const seen = new Set<string>([node.id]);
      let cursor = previousById.get(node.id) ?? null;
      let steps = 0;
      while (cursor !== null && cursor !== snapshot.startNodeId) {
        if (seen.has(cursor) || steps > snapshot.nodes.length) {
          add(['previous'], `previous pointers form a cycle at node "${node.id}"`);
          return;
        }
        seen.add(cursor);
        cursor = previousById.get(cursor) ?? null;
        steps += 1;
      }
      if (cursor !== snapshot.startNodeId) {
        add(['previous'], `previous chain for "${node.id}" does not reach the start node`);
      }
    });
    snapshot.nodes.forEach((node) => {
      const distance = distanceById.get(node.id);
      const previous = previousById.get(node.id);
      if (distance === null || distance === undefined) {
        if (previous !== null) add(['previous'], `unreachable node "${node.id}" must have previousId = null`);
      } else if (node.id !== snapshot.startNodeId && previous === null) {
        add(['previous'], `reachable non-start node "${node.id}" needs a previous node`);
      }
      if (node.id === snapshot.startNodeId && distance !== null && distance !== 0) {
        add(['distances'], 'the start node must have distance 0 once discovered');
      }
    });

    if (snapshot.operation === 'init') {
      if (snapshot.distances.some((row) => row.distance !== null)) add(['distances'], 'init has no finite distances');
      if (snapshot.previous.some((row) => row.previousId !== null)) add(['previous'], 'init has no previous nodes');
      if (snapshot.currentNodeId !== null) add(['currentNodeId'], 'init must not name a current node');
      if (snapshot.discoveredIds.length || snapshot.visitedIds.length || snapshot.frontierItems.length) {
        add(['discoveredIds'], 'init happens before any node is discovered');
      }
    } else if (snapshot.startNodeId !== null && !discovered.has(snapshot.startNodeId)) {
      add(['startNodeId'], 'startNodeId must be discovered once Dijkstra begins');
    }

    const current = snapshot.currentNodeId;
    if (snapshot.operation !== 'init' && snapshot.operation !== 'done') {
      if (current === null || !ids.has(current)) {
        add(['currentNodeId'], 'a non-terminal Dijkstra frame must name the current node');
      }
    }
    if (snapshot.operation === 'done') {
      if (current !== null) add(['currentNodeId'], 'done must not name a current node');
      if (snapshot.currentEdgeId !== null || snapshot.neighborNodeId !== null) {
        add(['currentEdgeId'], 'done must not keep an edge or neighbour highlighted');
      }
      if (snapshot.frontierItems.length || snapshot.frontierRemoved || snapshot.frontierAdded) {
        add(['frontierItems'], 'done requires an empty priority queue');
      }
      if (snapshot.relax) add(['relax'], 'done must not report a relax change');
      if (!snapshot.pathNodeIds) add(['pathNodeIds'], 'done must report pathNodeIds (an empty array means unreachable)');
    } else if (snapshot.pathNodeIds && snapshot.pathNodeIds.length) {
      add(['pathNodeIds'], 'only the done frame reports the final path');
    }

    if (current !== null && snapshot.operation !== 'init' && snapshot.operation !== 'done') {
      if (!discovered.has(current)) add(['currentNodeId'], `current node "${current}" is not discovered`);
    }

    const edgeNeighbourOps = ['inspect-edge', 'relax', 'skip'];
    if (edgeNeighbourOps.includes(snapshot.operation)) {
      if (snapshot.currentEdgeId === null) add(['currentEdgeId'], `${snapshot.operation} requires a real edge`);
      if (snapshot.neighborNodeId === null) add(['neighborNodeId'], `${snapshot.operation} requires a neighbour`);
      if (current !== null && !visited.has(current)) {
        add(['visitedIds'], `${snapshot.operation} happens while the current node is being processed`);
      }
    } else if (snapshot.operation !== 'done' && snapshot.currentEdgeId !== null) {
      add(['currentEdgeId'], `${snapshot.operation} must not keep an edge highlighted`);
    }
    if (!edgeNeighbourOps.includes(snapshot.operation) && snapshot.neighborNodeId !== null) {
      add(['neighborNodeId'], `${snapshot.operation} must not name a neighbour`);
    }

    const currentEdge = snapshot.currentEdgeId === null ? null : edgeById.get(snapshot.currentEdgeId) ?? null;
    if (snapshot.currentEdgeId !== null && currentEdge === null) {
      add(['currentEdgeId'], `currentEdgeId "${snapshot.currentEdgeId}" does not refer to an edge`);
    }
    if (currentEdge && current !== null) {
      const touches = currentEdge.fromId === current || (!snapshot.directed && currentEdge.toId === current);
      const pointsAtNeighbour = !snapshot.directed
        ? (currentEdge.fromId === current && currentEdge.toId === snapshot.neighborNodeId) ||
          (currentEdge.toId === current && currentEdge.fromId === snapshot.neighborNodeId)
        : currentEdge.fromId === current && currentEdge.toId === snapshot.neighborNodeId;
      if (!touches) add(['currentEdgeId'], 'the highlighted edge must leave the current node');
      if (snapshot.neighborNodeId !== null && !pointsAtNeighbour) {
        add(['currentEdgeId'], 'the highlighted edge must point at neighborNodeId');
      }
    }

    if (snapshot.operation === 'skip' && currentEdge && current !== null && snapshot.neighborNodeId !== null) {
      const currentDistance = distanceById.get(current);
      const neighbourDistance = distanceById.get(snapshot.neighborNodeId);
      if (currentDistance === null || currentDistance === undefined || neighbourDistance === null || neighbourDistance === undefined) {
        add(['neighborNodeId'], 'skip must involve two reachable distances');
      } else if (currentDistance + currentEdge.weight < neighbourDistance) {
        add(['neighborNodeId'], 'skip cannot hide a strict distance improvement');
      }
    }
    if (snapshot.operation === 'relax' && currentEdge && current !== null && snapshot.neighborNodeId !== null) {
      const change = snapshot.relax;
      if (!change) {
        add(['relax'], 'relax requires a relax change record');
      } else {
        if (change.nodeId !== snapshot.neighborNodeId) add(['relax', 'nodeId'], 'relax must target neighborNodeId');
        if (change.newPreviousId !== current) add(['relax', 'newPreviousId'], 'a successful relax sets previous to the current node');
        if (change.newDistance !== distanceById.get(snapshot.neighborNodeId)) {
          add(['relax', 'newDistance'], 'relax.newDistance must equal the updated distance row');
        }
        if (change.oldDistance !== null && change.newDistance >= change.oldDistance) {
          add(['relax', 'oldDistance'], 'a successful relax must strictly decrease the distance');
        }
        if (change.oldDistance === null && change.oldPreviousId !== null) {
          add(['relax', 'oldPreviousId'], 'the old previous must be null when the old distance is infinite');
        }
      }
      if (!visited.has(current)) add(['visitedIds'], 'relax happens while the current node is being processed');
    } else if (snapshot.operation !== 'relax' && snapshot.relax) {
      add(['relax'], 'only a relax frame carries a relax change record');
    }

    if (snapshot.operation === 'settle') {
      if (current === null || !visited.has(current)) add(['visitedIds'], 'settle must already mark the current node as settled');
      if (snapshot.visitOrder[snapshot.visitOrder.length - 1] !== current) {
        add(['visitOrder'], 'settle must append the current node to visitOrder');
      }
    }
    if (snapshot.operation === 'pop' && current !== null && visited.has(current)) {
      add(['visitedIds'], 'pop must happen before the node is settled');
    }

    snapshot.frontierItems.forEach((item, index) => {
      if (!ids.has(item.nodeId)) add(['frontierItems', index, 'nodeId'], `frontier item "${item.id}" points at unknown node "${item.nodeId}"`);
      if (!discovered.has(item.nodeId)) add(['frontierItems', index, 'nodeId'], `frontier node "${item.nodeId}" was never discovered`);
      if (!item.stale && visited.has(item.nodeId)) {
        add(['frontierItems', index, 'stale'], `fresh frontier entry "${item.id}" points at an already settled node`);
      }
      if (!item.stale && item.distance !== distanceById.get(item.nodeId)) {
        add(['frontierItems', index, 'distance'], `fresh frontier entry "${item.id}" has a non-current distance`);
      }
    });

    if (['push', 'relax'].includes(snapshot.operation)) {
      if (!snapshot.frontierAdded) add(['frontierAdded'], `${snapshot.operation} must report the added heap entry`);
    } else if (snapshot.frontierAdded) {
      add(['frontierAdded'], `${snapshot.operation} must not report an added heap entry`);
    }
    if (snapshot.frontierAdded) {
      const added = snapshot.frontierAdded;
      if (!ids.has(added.nodeId) || !discovered.has(added.nodeId)) add(['frontierAdded', 'nodeId'], 'the added entry must point at a discovered node');
      if (added.stale) add(['frontierAdded', 'stale'], 'a newly added heap entry cannot be stale');
      if (added.distance !== distanceById.get(added.nodeId)) add(['frontierAdded', 'distance'], 'the added entry must carry the current distance');
      if (!snapshot.frontierItems.some((item) => item.id === added.id)) add(['frontierAdded'], 'the added entry must be present in frontierItems');
      if (snapshot.operation === 'push' && added.nodeId !== current) add(['frontierAdded', 'nodeId'], 'the initial push adds the current start node');
    }

    if (['pop', 'stale'].includes(snapshot.operation)) {
      if (!snapshot.frontierRemoved) add(['frontierRemoved'], `${snapshot.operation} must report the removed heap entry`);
    } else if (snapshot.frontierRemoved) {
      add(['frontierRemoved'], `${snapshot.operation} must not report a removed heap entry`);
    }
    if (snapshot.frontierRemoved) {
      const removed = snapshot.frontierRemoved;
      if (!ids.has(removed.nodeId) || !discovered.has(removed.nodeId)) add(['frontierRemoved', 'nodeId'], 'the removed entry must point at a discovered node');
      if (removed.nodeId !== current) add(['frontierRemoved', 'nodeId'], 'the removed entry must be the current node');
      if (snapshot.frontierItems.some((item) => item.id === removed.id)) add(['frontierRemoved', 'id'], 'the removed entry is still in frontierItems');
      if (snapshot.operation === 'pop') {
        if (removed.stale) add(['frontierRemoved', 'stale'], 'a pop frame removes a fresh heap entry');
        if (removed.distance !== distanceById.get(removed.nodeId)) add(['frontierRemoved', 'distance'], 'a fresh pop must carry the current distance');
      }
      if (snapshot.operation === 'stale') {
        if (!removed.stale) add(['frontierRemoved', 'stale'], 'a stale frame must mark the removed entry stale');
        const currentDistance = distanceById.get(removed.nodeId);
        if (!visited.has(removed.nodeId) && currentDistance !== null && currentDistance !== undefined && removed.distance === currentDistance) {
          add(['frontierRemoved', 'distance'], 'a stale entry must be obsolete (settled or an older larger distance)');
        }
      }
    }

    if (snapshot.operation === 'done' && snapshot.pathNodeIds) {
      const path = snapshot.pathNodeIds;
      uniqueRefList(path, 'pathNodeIds', 'pathNodeIds');
      const targetDistance = distanceById.get(snapshot.targetNodeId ?? '');
      if (path.length === 0) {
        if (snapshot.targetNodeId !== null && targetDistance !== null) {
          add(['pathNodeIds'], 'a reachable target must have a reconstructed path');
        }
        if (snapshot.pathDistance !== null) add(['pathDistance'], 'an unreachable target has no path distance');
      } else {
        if (snapshot.startNodeId !== null && path[0] !== snapshot.startNodeId) add(['pathNodeIds'], 'a path must start at startNodeId');
        if (snapshot.targetNodeId !== null && path[path.length - 1] !== snapshot.targetNodeId) add(['pathNodeIds'], 'a path must end at targetNodeId');
        if (snapshot.pathDistance !== targetDistance) add(['pathDistance'], 'pathDistance must equal the target distance row');
        for (let index = 0; index + 1 < path.length; index += 1) {
          const from = path[index];
          const to = path[index + 1];
          if (from === undefined || to === undefined) continue;
          const found = snapshot.edges.some((edge) =>
            snapshot.directed
              ? edge.fromId === from && edge.toId === to
              : (edge.fromId === from && edge.toId === to) || (edge.fromId === to && edge.toId === from),
          );
          if (!found) add(['pathNodeIds', index + 1], `no edge connects path nodes "${from}" and "${to}"`);
          if (previousById.get(to) !== from) {
            add(['pathNodeIds', index + 1], `previous[${to}] must be ${from} on the reconstructed path`);
          }
        }
      }
    } else if (snapshot.pathDistance !== null) {
      add(['pathDistance'], 'only a done frame reports pathDistance');
    }
  });
export type WeightedGraphSnapshot = z.infer<typeof weightedGraphSnapshotSchema>;

/**
 * G1 shortest-path batch: Floyd-Warshall and Bellman-Ford.
 *
 * Both use signed edge weights. The existing Dijkstra schema deliberately
 * rejects negatives, so these are separate snapshots instead of weakening the
 * Dijkstra contract. Every distance matrix/table is copied from the real
 * Python execution; `null` remains the JSON-safe representation of infinity.
 */
export const FLOYD_OPERATIONS = ['init', 'k-advance', 'update', 'skip', 'negative-cycle', 'done'] as const;
export type FloydOperation = (typeof FLOYD_OPERATIONS)[number];

export const BELLMAN_OPERATIONS = [
  'init', 'round-start', 'inspect-edge', 'relax', 'skip', 'round-end', 'early-exit', 'negative-cycle', 'done',
] as const;
export type BellmanOperation = (typeof BELLMAN_OPERATIONS)[number];

const signedWeightEdgeSchema = graphEdgeSchema.extend({
  weight: z.number().finite(),
});

const shortestPathDistanceCellSchema = z.object({
  fromId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  toId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  distance: z.number().finite().nullable(),
});

const shortestPathPreviousCellSchema = z.object({
  fromId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  toId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  previousId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
});

const floydCompareSchema = z.object({
  iNodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  jNodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  kNodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  throughIK: z.number().finite().nullable(),
  throughKJ: z.number().finite().nullable(),
  candidate: z.number().finite().nullable(),
  oldDistance: z.number().finite().nullable(),
  updated: z.boolean(),
  newDistance: z.number().finite().nullable(),
});

const negativeCycleSchema = z.object({
  hasCycle: z.boolean(),
  /** Reachable-from-start cycle nodes for Bellman-Ford; negative diagonal nodes for Floyd. */
  nodeIds: z.array(z.string().min(1).max(LIMITS.MAX_NAME_CHARS)).max(GRAPH_LIMITS.MAX_NODES),
});

function validateSignedGraph(
  snapshot: {
    nodes: Array<{ id: string }>;
    edges: Array<{ id: string; fromId: string; toId: string; weight: number }>;
    directed: boolean;
  },
  add: (path: Array<string | number>, message: string) => void,
): Set<string> {
  const ids = new Set<string>();
  snapshot.nodes.forEach((node, index) => {
    if (ids.has(node.id)) add(['nodes', index, 'id'], `duplicate graph node id "${node.id}"`);
    ids.add(node.id);
  });
  const edgeIds = new Set<string>();
  const edgePairs = new Set<string>();
  snapshot.edges.forEach((edge, index) => {
    if (edgeIds.has(edge.id)) add(['edges', index, 'id'], `duplicate graph edge id "${edge.id}"`);
    edgeIds.add(edge.id);
    if (!ids.has(edge.fromId)) add(['edges', index, 'fromId'], `edge "${edge.id}" starts at unknown node "${edge.fromId}"`);
    if (!ids.has(edge.toId)) add(['edges', index, 'toId'], `edge "${edge.id}" ends at unknown node "${edge.toId}"`);
    if (edge.fromId === edge.toId) add(['edges', index], 'self-loops are not supported in this teaching graph');
    if (ids.has(edge.fromId) && ids.has(edge.toId) && edge.fromId !== edge.toId) {
      const pair = snapshot.directed
        ? `${edge.fromId}\u0000${edge.toId}`
        : [edge.fromId, edge.toId].sort().join('\u0000');
      if (edgePairs.has(pair)) {
        add(['edges', index], snapshot.directed
          ? `duplicate directed edge "${edge.fromId}"→"${edge.toId}"`
          : `duplicate undirected edge "${edge.fromId}"–"${edge.toId}"`);
      }
      edgePairs.add(pair);
    }
  });
  return ids;
}

function validatePath(
  snapshot: {
    edges: Array<{ fromId: string; toId: string }>;
    directed: boolean;
    previous?: Array<{ fromId: string; toId: string; previousId: string | null }>;
    pathNodeIds: string[] | null;
    pathDistance: number | null;
    targetNodeId: string | null;
    distanceOf?: (from: string, to: string) => number | null | undefined;
  },
  add: (path: Array<string | number>, message: string) => void,
): void {
  const path = snapshot.pathNodeIds ?? [];
  if (!path.length) {
    if (snapshot.pathDistance !== null) add(['pathDistance'], 'an empty path has no path distance');
    return;
  }
  const seen = new Set<string>();
  path.forEach((id, index) => {
    if (seen.has(id)) add(['pathNodeIds', index], `path repeats node "${id}"`);
    seen.add(id);
  });
  if (snapshot.targetNodeId !== null && path[path.length - 1] !== snapshot.targetNodeId) {
    add(['pathNodeIds'], 'a path must end at targetNodeId');
  }
  const targetDistance = snapshot.distanceOf?.(path[0] ?? '', snapshot.targetNodeId ?? '');
  if (snapshot.pathDistance !== null && targetDistance !== undefined && snapshot.pathDistance !== targetDistance) {
    add(['pathDistance'], 'pathDistance must equal the target distance');
  }
  for (let index = 0; index + 1 < path.length; index += 1) {
    const from = path[index];
    const to = path[index + 1];
    if (from === undefined || to === undefined) continue;
    const found = snapshot.edges.some((edge) =>
      snapshot.directed
        ? edge.fromId === from && edge.toId === to
        : (edge.fromId === from && edge.toId === to) || (edge.fromId === to && edge.toId === from),
    );
    if (!found) add(['pathNodeIds', index + 1], `no edge connects path nodes "${from}" and "${to}"`);
    if (snapshot.previous) {
      const previous = snapshot.previous.find((cell) => cell.fromId === path[0] && cell.toId === to);
      if (previous && previous.previousId !== from) add(['pathNodeIds', index + 1], `previous[${to}] must be ${from}`);
    }
  }
}

export const floydWarshallSnapshotSchema = z
  .object({
    kind: z.literal('floyd-warshall'),
    algorithm: z.literal('floyd-warshall'),
    operation: z.enum(FLOYD_OPERATIONS),
    nodes: z.array(graphNodeSchema).max(GRAPH_LIMITS.MAX_NODES),
    edges: z.array(signedWeightEdgeSchema).max(GRAPH_LIMITS.MAX_EDGES),
    directed: z.boolean(),
    startNodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    targetNodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    /** Current intermediate node k; absent only before the first k. */
    kNodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    /** Current matrix row i and column j for a comparison frame. */
    iNodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    jNodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    /** Current i→j comparison, copied from the real triple loop. */
    compare: floydCompareSchema.nullable(),
    /** Complete V×V matrix, ordered by nodes. */
    distances: z.array(shortestPathDistanceCellSchema).max(GRAPH_LIMITS.MAX_NODES * GRAPH_LIMITS.MAX_NODES),
    /** Complete V×V previous matrix (predecessor on the best known path). */
    previous: z.array(shortestPathPreviousCellSchema).max(GRAPH_LIMITS.MAX_NODES * GRAPH_LIMITS.MAX_NODES),
    negativeCycle: negativeCycleSchema.nullable(),
    pathNodeIds: z.array(z.string().min(1).max(LIMITS.MAX_NAME_CHARS)).max(GRAPH_LIMITS.MAX_NODES).nullable(),
    pathDistance: z.number().finite().nullable(),
  })
  .superRefine((snapshot, ctx) => {
    const add = (path: Array<string | number>, message: string) => {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
    };
    const ids = validateSignedGraph(snapshot, add);
    const n = snapshot.nodes.length;
    if (n === 0) {
      if (snapshot.startNodeId !== null || snapshot.targetNodeId !== null) add(['startNodeId'], 'an empty graph has no start/target');
      if (snapshot.operation !== 'init' && snapshot.operation !== 'done') add(['operation'], 'an empty graph may only emit init or done');
      if (snapshot.kNodeId !== null || snapshot.iNodeId !== null || snapshot.jNodeId !== null || snapshot.compare) {
        add(['kNodeId'], 'an empty graph has no current comparison');
      }
      if (snapshot.distances.length || snapshot.previous.length || snapshot.negativeCycle) add(['distances'], 'an empty graph has no matrix');
      if (snapshot.pathNodeIds && snapshot.pathNodeIds.length) add(['pathNodeIds'], 'an empty graph has no path');
      if (snapshot.pathDistance !== null) add(['pathDistance'], 'an empty graph has no path distance');
      return;
    }
    if (snapshot.startNodeId === null || !ids.has(snapshot.startNodeId)) add(['startNodeId'], 'startNodeId must name a real node');
    if (snapshot.targetNodeId === null || !ids.has(snapshot.targetNodeId)) add(['targetNodeId'], 'targetNodeId must name a real node');
    if (snapshot.kNodeId !== null && !ids.has(snapshot.kNodeId)) add(['kNodeId'], 'kNodeId must name a real node');
    if (snapshot.iNodeId !== null && !ids.has(snapshot.iNodeId)) add(['iNodeId'], 'iNodeId must name a real node');
    if (snapshot.jNodeId !== null && !ids.has(snapshot.jNodeId)) add(['jNodeId'], 'jNodeId must name a real node');

    const cells = new Map<string, number | null>();
    snapshot.distances.forEach((cell, index) => {
      if (!ids.has(cell.fromId) || !ids.has(cell.toId)) add(['distances', index], 'matrix cell refers to an unknown node');
      const key = `${cell.fromId}\u0000${cell.toId}`;
      if (cells.has(key)) add(['distances', index], 'duplicate matrix cell');
      cells.set(key, cell.distance);
    });
    if (cells.size !== n * n) add(['distances'], 'the distance matrix must cover every ordered node pair');
    const previous = new Set<string>();
    snapshot.previous.forEach((cell, index) => {
      if (!ids.has(cell.fromId) || !ids.has(cell.toId)) add(['previous', index], 'previous cell refers to an unknown node');
      if (cell.previousId !== null && !ids.has(cell.previousId)) add(['previous', index, 'previousId'], 'previousId must name a real node');
      const key = `${cell.fromId}\u0000${cell.toId}`;
      if (previous.has(key)) add(['previous', index], 'duplicate previous cell');
      previous.add(key);
    });
    if (previous.size !== n * n) add(['previous'], 'the previous matrix must cover every ordered node pair');

    const compare = snapshot.compare;
    if (snapshot.operation === 'update' || snapshot.operation === 'skip') {
      if (!compare) add(['compare'], `${snapshot.operation} must include the current comparison`);
      if (!snapshot.iNodeId || !snapshot.jNodeId || !snapshot.kNodeId) add(['compare'], 'a comparison frame must name i, j and k');
      if (snapshot.operation === 'update' && compare && !compare.updated) add(['compare', 'updated'], 'update frames must report updated=true');
      if (snapshot.operation === 'skip' && compare && compare.updated) add(['compare', 'updated'], 'skip frames must report updated=false');
    } else if (compare) {
      add(['compare'], 'only update/skip frames carry a comparison');
    }
    if (snapshot.operation === 'k-advance' && snapshot.kNodeId === null) add(['kNodeId'], 'k-advance must name k');
    if (compare) {
      const cell = cells.get(`${compare.iNodeId}\u0000${compare.jNodeId}`) ?? null;
      if (snapshot.operation === 'skip' && cell !== compare.oldDistance) {
        add(['compare', 'oldDistance'], 'a skipped cell must still hold oldDistance');
      }
      if (compare.newDistance !== cell) add(['compare', 'newDistance'], 'newDistance must be the post-comparison cell');
      const throughIK = cells.get(`${compare.iNodeId}\u0000${compare.kNodeId}`) ?? null;
      const throughKJ = cells.get(`${compare.kNodeId}\u0000${compare.jNodeId}`) ?? null;
      if (throughIK !== compare.throughIK || throughKJ !== compare.throughKJ) add(['compare'], 'through values must come from the matrix');
      if (compare.candidate !== (throughIK === null || throughKJ === null ? null : throughIK + throughKJ)) {
        add(['compare', 'candidate'], 'candidate must be throughIK + throughKJ');
      }
      if (compare.newDistance !== (compare.updated ? compare.candidate : compare.oldDistance)) {
        add(['compare', 'newDistance'], 'newDistance must describe the post-comparison cell');
      }
    }

    if (snapshot.negativeCycle) {
      if (snapshot.operation !== 'negative-cycle' && snapshot.operation !== 'done') add(['negativeCycle'], 'only the final frames report cycle detection');
      snapshot.negativeCycle.nodeIds.forEach((id) => {
        if (!ids.has(id)) add(['negativeCycle', 'nodeIds'], 'cycle node is unknown');
      });
      if (snapshot.negativeCycle.hasCycle) {
        if (!snapshot.negativeCycle.nodeIds.length) add(['negativeCycle', 'nodeIds'], 'a detected negative cycle needs at least one node');
      } else if (snapshot.negativeCycle.nodeIds.length) {
        add(['negativeCycle', 'nodeIds'], 'a false cycle result must not list nodes');
      }
    }
    const diagonalNegative = snapshot.nodes.filter((node) => (cells.get(`${node.id}\u0000${node.id}`) ?? 0) < 0);
    if (snapshot.negativeCycle?.hasCycle && diagonalNegative.length === 0) {
      add(['negativeCycle'], 'a negative cycle must leave a negative diagonal cell');
    }
    if (snapshot.operation === 'negative-cycle' && !snapshot.negativeCycle?.hasCycle) {
      add(['negativeCycle'], 'a negative-cycle frame must report a real cycle');
    }
    if (snapshot.operation === 'done') {
      validatePath({
        edges: snapshot.edges,
        directed: snapshot.directed,
        previous: snapshot.previous.filter((cell) => cell.fromId === snapshot.startNodeId),
        pathNodeIds: snapshot.pathNodeIds,
        pathDistance: snapshot.pathDistance,
        targetNodeId: snapshot.targetNodeId,
        distanceOf: (from, to) => cells.get(`${from}\u0000${to}`),
      }, add);
      if (snapshot.negativeCycle?.hasCycle && snapshot.pathDistance !== null) {
        add(['pathDistance'], 'a negative cycle makes the shortest distance undefined');
      }
    } else if (snapshot.pathDistance !== null || (snapshot.pathNodeIds && snapshot.pathNodeIds.length)) {
      add(['pathNodeIds'], 'only the done frame reports a path');
    }
  });
export type FloydWarshallSnapshot = z.infer<typeof floydWarshallSnapshotSchema>;

export const bellmanFordSnapshotSchema = z
  .object({
    kind: z.literal('bellman-ford'),
    algorithm: z.literal('bellman-ford'),
    operation: z.enum(BELLMAN_OPERATIONS),
    nodes: z.array(graphNodeSchema).max(GRAPH_LIMITS.MAX_NODES),
    edges: z.array(signedWeightEdgeSchema).max(GRAPH_LIMITS.MAX_EDGES),
    directed: z.boolean(),
    startNodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    targetNodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    round: z.number().int().nonnegative().max(GRAPH_LIMITS.MAX_NODES),
    maxRounds: z.number().int().nonnegative().max(GRAPH_LIMITS.MAX_NODES),
    currentNodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    currentEdgeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    neighborNodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    distances: z.array(shortestPathDistanceCellSchema).max(GRAPH_LIMITS.MAX_NODES),
    previous: z.array(shortestPathPreviousCellSchema).max(GRAPH_LIMITS.MAX_NODES),
    relax: z.object({
      nodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
      oldDistance: z.number().finite().nullable(),
      newDistance: z.number().finite(),
      oldPreviousId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
      newPreviousId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
    }).nullable(),
    updatedInRound: z.boolean(),
    earlyExit: z.boolean(),
    negativeCycle: negativeCycleSchema.nullable(),
    pathNodeIds: z.array(z.string().min(1).max(LIMITS.MAX_NAME_CHARS)).max(GRAPH_LIMITS.MAX_NODES).nullable(),
    pathDistance: z.number().finite().nullable(),
  })
  .superRefine((snapshot, ctx) => {
    const add = (path: Array<string | number>, message: string) => {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
    };
    const ids = validateSignedGraph(snapshot, add);
    const edgeById = new Map(snapshot.edges.map((edge) => [edge.id, edge]));
    const n = snapshot.nodes.length;
    if (n === 0) {
      if (snapshot.startNodeId !== null || snapshot.targetNodeId !== null) add(['startNodeId'], 'an empty graph has no start/target');
      if (snapshot.operation !== 'init' && snapshot.operation !== 'done') add(['operation'], 'an empty graph may only emit init or done');
      if (snapshot.round !== 0 || snapshot.maxRounds !== 0) add(['round'], 'an empty graph has no rounds');
      if (snapshot.distances.length || snapshot.previous.length || snapshot.relax || snapshot.negativeCycle) {
        add(['distances'], 'an empty graph has no distances');
      }
      if (snapshot.pathNodeIds && snapshot.pathNodeIds.length) add(['pathNodeIds'], 'an empty graph has no path');
      if (snapshot.pathDistance !== null) add(['pathDistance'], 'an empty graph has no path distance');
      return;
    }
    if (snapshot.startNodeId === null || !ids.has(snapshot.startNodeId)) add(['startNodeId'], 'startNodeId must name a real node');
    if (snapshot.targetNodeId === null || !ids.has(snapshot.targetNodeId)) add(['targetNodeId'], 'targetNodeId must name a real node');
    if (snapshot.maxRounds !== n - 1) add(['maxRounds'], 'maxRounds must equal V-1');
    if (snapshot.operation === 'init' && snapshot.round !== 0) add(['round'], 'init is round 0');
    if (snapshot.operation !== 'init' && snapshot.round === 0) add(['round'], 'only init may use round 0');
    if (snapshot.round > snapshot.maxRounds && snapshot.operation !== 'done' && snapshot.operation !== 'negative-cycle') {
      add(['round'], 'round exceeds V-1');
    }

    const distance = new Map<string, number | null>();
    snapshot.distances.forEach((cell, index) => {
      if (cell.fromId !== snapshot.startNodeId || !ids.has(cell.toId)) {
        add(['distances', index], 'Bellman-Ford distance rows must be from startNodeId to every node');
      }
      if (distance.has(cell.toId)) add(['distances', index], 'duplicate distance row');
      distance.set(cell.toId, cell.distance);
    });
    if (distance.size !== n) add(['distances'], 'the distance table must cover every node');
    const previous = new Map<string, string | null>();
    snapshot.previous.forEach((cell, index) => {
      if (cell.fromId !== snapshot.startNodeId || !ids.has(cell.toId)) add(['previous', index], 'previous rows must be from startNodeId');
      if (!ids.has(cell.toId)) add(['previous', index, 'toId'], 'previous target is unknown');
      if (cell.previousId !== null && !ids.has(cell.previousId)) add(['previous', index, 'previousId'], 'previousId must name a node');
      if (previous.has(cell.toId)) add(['previous', index], 'duplicate previous row');
      previous.set(cell.toId, cell.previousId);
    });
    if (previous.size !== n) add(['previous'], 'the previous table must cover every node');

    const edge = snapshot.currentEdgeId ? edgeById.get(snapshot.currentEdgeId) : undefined;
    const edgeOperation = ['inspect-edge', 'relax', 'skip'].includes(snapshot.operation);
    if (edgeOperation) {
      if (!edge) add(['currentEdgeId'], `${snapshot.operation} must name a real edge`);
      if (!edge) return;
      if (snapshot.currentNodeId !== edge.fromId) add(['currentNodeId'], 'currentNodeId must be edge.fromId');
      if (snapshot.neighborNodeId !== edge.toId) add(['neighborNodeId'], 'neighborNodeId must be edge.toId');
    } else if (snapshot.currentEdgeId) {
      add(['currentEdgeId'], `${snapshot.operation} must not carry an edge`);
    }
    if (snapshot.operation === 'relax') {
      if (!snapshot.relax) add(['relax'], 'relax frames must carry a relax change');
      if (edge && snapshot.relax) {
        if (snapshot.relax.nodeId !== edge.toId) add(['relax', 'nodeId'], 'relax must update the edge target');
        if (snapshot.relax.newDistance !== distance.get(edge.toId)) add(['relax', 'newDistance'], 'relax newDistance must be the table value');
        if (snapshot.relax.oldDistance !== null && snapshot.relax.oldDistance! <= snapshot.relax.newDistance) {
          add(['relax', 'oldDistance'], 'relax must strictly improve the distance');
        }
        if (snapshot.relax.newPreviousId !== edge.fromId) add(['relax', 'newPreviousId'], 'relax must set previous to edge.fromId');
      }
      if (!snapshot.updatedInRound) add(['updatedInRound'], 'a relax frame sets updatedInRound');
    } else if (snapshot.relax) {
      add(['relax'], 'only relax frames carry a relax change');
    }
    if (snapshot.operation === 'round-start') {
      if (snapshot.updatedInRound) add(['updatedInRound'], 'round-start begins with no updates');
      if (snapshot.earlyExit) add(['earlyExit'], 'round-start is not an early exit');
    }
    if (snapshot.operation === 'early-exit' && !snapshot.earlyExit) add(['earlyExit'], 'early-exit must set earlyExit');
    if (snapshot.operation === 'negative-cycle') {
      if (!snapshot.negativeCycle?.hasCycle) add(['negativeCycle'], 'negative-cycle must report a real reachable cycle');
      if (snapshot.pathDistance !== null) add(['pathDistance'], 'an undefined shortest path has no distance');
    }
    if (snapshot.negativeCycle) {
      if (snapshot.operation !== 'negative-cycle' && snapshot.operation !== 'done') add(['negativeCycle'], 'cycle result belongs to the final frames');
      snapshot.negativeCycle.nodeIds.forEach((id) => {
        if (!ids.has(id)) add(['negativeCycle', 'nodeIds'], 'cycle node is unknown');
      });
    }
    if (snapshot.operation === 'done') {
      validatePath({
        edges: snapshot.edges,
        directed: snapshot.directed,
        previous: snapshot.previous,
        pathNodeIds: snapshot.pathNodeIds,
        pathDistance: snapshot.pathDistance,
        targetNodeId: snapshot.targetNodeId,
        distanceOf: (_from, to) => distance.get(to),
      }, add);
      if (snapshot.negativeCycle?.hasCycle && snapshot.pathDistance !== null) {
        add(['pathDistance'], 'a negative cycle makes the shortest distance undefined');
      }
    } else if (snapshot.pathDistance !== null || (snapshot.pathNodeIds && snapshot.pathNodeIds.length)) {
      add(['pathNodeIds'], 'only the done frame reports a path');
    }
  });
export type BellmanFordSnapshot = z.infer<typeof bellmanFordSnapshotSchema>;

/**
 * G2 minimum spanning tree batch.
 *
 * MST input is undirected only. Negative weights are valid here, unlike
 * Dijkstra, so the existing non-negative contract is not reused. Prim is a
 * growing cut with a real heapq frontier; Kruskal is a sorted edge stream plus
 * a live union-find parent/rank table. A disconnected graph produces a forest
 * and both schemas enforce that it is never described as one spanning tree.
 */
export const PRIM_OPERATIONS = ['init', 'start', 'push', 'pop', 'select-edge', 'skip', 'component-start', 'done'] as const;
export type PrimOperation = (typeof PRIM_OPERATIONS)[number];

export const KRUSKAL_OPERATIONS = ['init', 'sort', 'inspect-edge', 'reject-edge', 'union', 'done'] as const;
export type KruskalOperation = (typeof KRUSKAL_OPERATIONS)[number];

const mstFrontierEntrySchema = z.object({
  id: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  edgeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  fromId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  toId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  weight: z.number().finite(),
});

const primSelectedEdgeSchema = z.object({
  edgeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  fromId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  toId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  weight: z.number().finite(),
  newNodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
});

const unionFindRowSchema = z.object({
  nodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  parentId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  rank: z.number().int().nonnegative().max(32),
  rootId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
});

const kruskalUnionSchema = z.object({
  edgeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  rootA: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  rootB: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  mergedRoot: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  attachedRoot: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  rankBefore: z.number().int().nonnegative().max(32),
  rankAfter: z.number().int().nonnegative().max(32),
  parentOfAttachedBefore: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  parentOfAttachedAfter: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  componentCountBefore: z.number().int().nonnegative().max(GRAPH_LIMITS.MAX_NODES),
  componentCountAfter: z.number().int().nonnegative().max(GRAPH_LIMITS.MAX_NODES),
  mergedSize: z.number().int().positive().max(GRAPH_LIMITS.MAX_NODES),
});

function graphComponentCount(
  nodes: Array<{ id: string }>,
  edges: Array<{ fromId: string; toId: string }>,
): number {
  const adjacency = new Map<string, string[]>();
  nodes.forEach((node) => adjacency.set(node.id, []));
  edges.forEach((edge) => {
    adjacency.get(edge.fromId)?.push(edge.toId);
    adjacency.get(edge.toId)?.push(edge.fromId);
  });
  const seen = new Set<string>();
  let count = 0;
  for (const node of nodes) {
    if (seen.has(node.id)) continue;
    count += 1;
    const stack = [node.id];
    seen.add(node.id);
    while (stack.length) {
      const current = stack.pop();
      if (current === undefined) continue;
      for (const neighbor of adjacency.get(current) ?? []) {
        if (!seen.has(neighbor)) {
          seen.add(neighbor);
          stack.push(neighbor);
        }
      }
    }
  }
  return count;
}

export const primMstSnapshotSchema = z
  .object({
    kind: z.literal('prim-mst'),
    algorithm: z.literal('prim'),
    operation: z.enum(PRIM_OPERATIONS),
    nodes: z.array(graphNodeSchema).max(GRAPH_LIMITS.MAX_NODES),
    edges: z.array(signedWeightEdgeSchema).max(GRAPH_LIMITS.MAX_EDGES),
    directed: z.literal(false),
    startNodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    /** Total connected components in the whole graph, not just opened ones. */
    componentCount: z.number().int().nonnegative().max(GRAPH_LIMITS.MAX_NODES),
    /** Index of the component currently being grown (0-based). */
    componentIndex: z.number().int().nonnegative().max(GRAPH_LIMITS.MAX_NODES - 1),
    treeNodeIds: z.array(z.string().min(1).max(LIMITS.MAX_NAME_CHARS)).max(GRAPH_LIMITS.MAX_NODES),
    componentNodeIds: z.array(z.string().min(1).max(LIMITS.MAX_NAME_CHARS)).max(GRAPH_LIMITS.MAX_NODES),
    visitOrder: z.array(z.string().min(1).max(LIMITS.MAX_NAME_CHARS)).max(GRAPH_LIMITS.MAX_NODES),
    selectedEdgeIds: z.array(z.string().min(1).max(LIMITS.MAX_NAME_CHARS)).max(GRAPH_LIMITS.MAX_EDGES),
    skippedEdgeIds: z.array(z.string().min(1).max(LIMITS.MAX_NAME_CHARS)).max(GRAPH_LIMITS.MAX_EDGES),
    currentEdgeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    frontierKind: z.literal('priority-queue'),
    frontierItems: z.array(mstFrontierEntrySchema).max(GRAPH_LIMITS.MAX_EDGES),
    frontierAdded: mstFrontierEntrySchema.nullable(),
    frontierRemoved: mstFrontierEntrySchema.nullable(),
    selectedEdge: primSelectedEdgeSchema.nullable(),
    totalWeight: z.number().finite(),
    connected: z.boolean(),
    forest: z.boolean(),
  })
  .superRefine((snapshot, ctx) => {
    const add = (path: Array<string | number>, message: string) => {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
    };
    const ids = validateSignedGraph(snapshot, add);
    const edgeById = new Map(snapshot.edges.map((edge) => [edge.id, edge]));
    const n = snapshot.nodes.length;
    const components = graphComponentCount(snapshot.nodes, snapshot.edges);
    if (snapshot.componentCount !== components) add(['componentCount'], 'componentCount must match the real graph components');
    if (snapshot.connected !== (components === 1)) add(['connected'], 'connected must be true only for one component');
    if (snapshot.forest !== (components > 1)) add(['forest'], 'forest must be true for a disconnected graph');

    if (n === 0) {
      if (snapshot.startNodeId !== null) add(['startNodeId'], 'an empty graph has no start');
      if (snapshot.operation !== 'init' && snapshot.operation !== 'done') add(['operation'], 'an empty graph may only emit init or done');
      if (snapshot.componentCount !== 0 || snapshot.componentIndex !== 0) add(['componentCount'], 'an empty graph has no components');
      if (snapshot.treeNodeIds.length || snapshot.componentNodeIds.length || snapshot.visitOrder.length) {
        add(['treeNodeIds'], 'an empty graph has no tree');
      }
      if (snapshot.selectedEdgeIds.length || snapshot.skippedEdgeIds.length || snapshot.frontierItems.length) {
        add(['selectedEdgeIds'], 'an empty graph has no edges or frontier');
      }
      if (snapshot.currentEdgeId || snapshot.selectedEdge || snapshot.frontierAdded || snapshot.frontierRemoved) {
        add(['currentEdgeId'], 'an empty graph has no current edge');
      }
      if (snapshot.totalWeight !== 0) add(['totalWeight'], 'an empty graph has zero weight');
      return;
    }

    if (snapshot.startNodeId === null || !ids.has(snapshot.startNodeId)) add(['startNodeId'], 'startNodeId must name a real node');
    if (snapshot.componentIndex >= components) add(['componentIndex'], 'componentIndex exceeds the component count');
    if (snapshot.operation === 'init' && snapshot.componentIndex !== 0) add(['componentIndex'], 'init starts at component 0');
    const treeSet = new Set<string>();
    snapshot.treeNodeIds.forEach((id, index) => {
      if (!ids.has(id)) add(['treeNodeIds', index], 'tree node is unknown');
      if (treeSet.has(id)) add(['treeNodeIds', index], `tree repeats node "${id}"`);
      treeSet.add(id);
    });
    if (snapshot.visitOrder.length !== snapshot.treeNodeIds.length || snapshot.visitOrder.some((id, index) => id !== snapshot.treeNodeIds[index])) {
      add(['visitOrder'], 'visitOrder must record the real tree insertion order');
    }
    const componentSet = new Set<string>();
    snapshot.componentNodeIds.forEach((id, index) => {
      if (!treeSet.has(id)) add(['componentNodeIds', index], 'component node must already be in the tree');
      if (componentSet.has(id)) add(['componentNodeIds', index], `component repeats node "${id}"`);
      componentSet.add(id);
    });
    if (snapshot.operation !== 'init' && snapshot.componentNodeIds.length === 0) {
      add(['componentNodeIds'], 'an opened component must contain its start node');
    }

    const selected = new Set<string>();
    snapshot.selectedEdgeIds.forEach((id, index) => {
      const edge = edgeById.get(id);
      if (!edge) add(['selectedEdgeIds', index], 'selected edge is unknown');
      if (selected.has(id)) add(['selectedEdgeIds', index], 'selected edge is duplicated');
      selected.add(id);
      if (edge && (!treeSet.has(edge.fromId) || !treeSet.has(edge.toId))) {
        add(['selectedEdgeIds', index], 'both endpoints of a selected edge must be in the tree');
      }
    });
    const skipped = new Set<string>();
    snapshot.skippedEdgeIds.forEach((id, index) => {
      const edge = edgeById.get(id);
      if (!edge) add(['skippedEdgeIds', index], 'skipped edge is unknown');
      if (skipped.has(id)) add(['skippedEdgeIds', index], 'skipped edge is duplicated');
      if (selected.has(id)) add(['skippedEdgeIds', index], 'an edge cannot be both selected and skipped');
      skipped.add(id);
      if (edge && (!treeSet.has(edge.fromId) || !treeSet.has(edge.toId))) {
        add(['skippedEdgeIds', index], 'a skipped edge must be internal to the tree');
      }
    });
    const openedComponents = Math.min(snapshot.componentIndex + 1, components);
    if (snapshot.operation !== 'init' && snapshot.selectedEdgeIds.length !== snapshot.treeNodeIds.length - openedComponents) {
      add(['selectedEdgeIds'], 'a forest with k opened components needs |tree| - k selected edges');
    }
    const selectedWeight = snapshot.selectedEdgeIds.reduce((sum, id) => sum + (edgeById.get(id)?.weight ?? 0), 0);
    if (Math.abs(snapshot.totalWeight - selectedWeight) > 1e-9 * Math.max(1, Math.abs(selectedWeight))) {
      add(['totalWeight'], 'totalWeight must equal the sum of selected edge weights');
    }

    const frontierIds = new Set<string>();
    snapshot.frontierItems.forEach((entry, index) => {
      const edge = edgeById.get(entry.edgeId);
      if (!edge) add(['frontierItems', index, 'edgeId'], 'frontier edge is unknown');
      if (frontierIds.has(entry.id)) add(['frontierItems', index, 'id'], 'frontier entry id is duplicated');
      frontierIds.add(entry.id);
      const sameDirection = edge && ((edge.fromId === entry.fromId && edge.toId === entry.toId) || (edge.fromId === entry.toId && edge.toId === entry.fromId));
      if (edge && (!sameDirection || edge.weight !== entry.weight)) {
        add(['frontierItems', index], 'frontier entry must copy the real edge');
      }
      if (edge && !treeSet.has(edge.fromId) && !treeSet.has(edge.toId)) {
        add(['frontierItems', index], 'a frontier edge must touch the tree cut');
      }
    });

    const edgeOperations: PrimOperation[] = ['pop', 'skip', 'select-edge'];
    const currentEdge = snapshot.currentEdgeId ? edgeById.get(snapshot.currentEdgeId) : undefined;
    if (edgeOperations.includes(snapshot.operation)) {
      if (!currentEdge) add(['currentEdgeId'], `${snapshot.operation} must name a real edge`);
    } else if (snapshot.currentEdgeId) {
      add(['currentEdgeId'], `${snapshot.operation} must not carry a current edge`);
    }

    if (snapshot.operation === 'push') {
      if (!snapshot.frontierAdded) add(['frontierAdded'], 'push must report the added heap entry');
      if (snapshot.frontierRemoved) add(['frontierRemoved'], 'push does not remove a heap entry');
      if (snapshot.frontierAdded && !frontierIds.has(snapshot.frontierAdded.id)) add(['frontierAdded'], 'added entry must be in the frontier');
    } else if (snapshot.frontierAdded) {
      add(['frontierAdded'], 'only push frames add a frontier entry');
    }
    if (snapshot.operation === 'pop') {
      if (!snapshot.frontierRemoved) add(['frontierRemoved'], 'pop must report the removed heap entry');
      if (snapshot.frontierAdded) add(['frontierAdded'], 'pop does not add a heap entry');
      if (snapshot.frontierRemoved && snapshot.currentEdgeId !== snapshot.frontierRemoved.edgeId) {
        add(['currentEdgeId'], 'pop currentEdgeId must equal the removed entry edge');
      }
      if (snapshot.frontierRemoved && frontierIds.has(snapshot.frontierRemoved.id)) {
        add(['frontierRemoved'], 'a popped entry cannot remain in the frontier');
      }
    } else if (snapshot.frontierRemoved) {
      add(['frontierRemoved'], 'only pop frames remove a frontier entry');
    }

    if (snapshot.operation === 'select-edge') {
      if (!snapshot.selectedEdge) add(['selectedEdge'], 'select-edge must report the selected edge and new node');
      if (snapshot.selectedEdge) {
        if (snapshot.selectedEdge.edgeId !== snapshot.currentEdgeId) add(['selectedEdge', 'edgeId'], 'selectedEdge must match currentEdgeId');
        if (!selected.has(snapshot.selectedEdge.edgeId)) add(['selectedEdge', 'edgeId'], 'selectedEdge must be in selectedEdgeIds');
        if (!treeSet.has(snapshot.selectedEdge.newNodeId)) add(['selectedEdge', 'newNodeId'], 'newNodeId must be in the tree');
        if (snapshot.selectedEdge.newNodeId !== snapshot.selectedEdge.fromId && snapshot.selectedEdge.newNodeId !== snapshot.selectedEdge.toId) {
          add(['selectedEdge', 'newNodeId'], 'newNodeId must be one endpoint of the selected edge');
        }
      }
    } else if (snapshot.selectedEdge) {
      add(['selectedEdge'], 'only select-edge frames carry a selected edge');
    }
    if (snapshot.operation === 'skip' && snapshot.currentEdgeId && !skipped.has(snapshot.currentEdgeId)) {
      add(['skippedEdgeIds'], 'a skip frame must record the skipped edge');
    }
    if (snapshot.operation === 'start') {
      if (snapshot.treeNodeIds.length !== 1 || snapshot.treeNodeIds[0] !== snapshot.startNodeId) add(['treeNodeIds'], 'start adds exactly the start node');
      if (snapshot.selectedEdgeIds.length || snapshot.skippedEdgeIds.length) add(['selectedEdgeIds'], 'start has no edges yet');
      if (snapshot.componentIndex !== 0) add(['componentIndex'], 'the start component is index 0');
    }
    if (snapshot.operation === 'component-start') {
      if (snapshot.componentIndex === 0) add(['componentIndex'], 'component-start opens a later component');
      if (snapshot.componentNodeIds.length !== 1) add(['componentNodeIds'], 'component-start adds one node');
      if (snapshot.currentEdgeId || snapshot.selectedEdge) add(['currentEdgeId'], 'component-start carries no edge');
    }
    if (snapshot.operation === 'init') {
      if (snapshot.treeNodeIds.length || snapshot.selectedEdgeIds.length || snapshot.skippedEdgeIds.length) {
        add(['treeNodeIds'], 'init has no tree or edges');
      }
      if (snapshot.totalWeight !== 0) add(['totalWeight'], 'init has zero weight');
      if (snapshot.frontierItems.length || snapshot.frontierAdded || snapshot.frontierRemoved) add(['frontierItems'], 'init has an empty frontier');
    }
    if (snapshot.operation === 'done') {
      if (snapshot.frontierItems.length) add(['frontierItems'], 'done requires an empty frontier');
      if (snapshot.currentEdgeId || snapshot.selectedEdge) add(['currentEdgeId'], 'done carries no current edge');
      if (snapshot.treeNodeIds.length !== n) add(['treeNodeIds'], 'done must cover every node');
      if (snapshot.selectedEdgeIds.length !== n - components) add(['selectedEdgeIds'], 'done needs V - components edges');
    }
  });
export type PrimMstSnapshot = z.infer<typeof primMstSnapshotSchema>;

export const kruskalMstSnapshotSchema = z
  .object({
    kind: z.literal('kruskal-mst'),
    algorithm: z.literal('kruskal'),
    operation: z.enum(KRUSKAL_OPERATIONS),
    nodes: z.array(graphNodeSchema).max(GRAPH_LIMITS.MAX_NODES),
    edges: z.array(signedWeightEdgeSchema).max(GRAPH_LIMITS.MAX_EDGES),
    directed: z.literal(false),
    sortedEdgeIds: z.array(z.string().min(1).max(LIMITS.MAX_NAME_CHARS)).max(GRAPH_LIMITS.MAX_EDGES),
    currentIndex: z.number().int().nonnegative().max(GRAPH_LIMITS.MAX_EDGES),
    currentEdgeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    selectedEdgeIds: z.array(z.string().min(1).max(LIMITS.MAX_NAME_CHARS)).max(GRAPH_LIMITS.MAX_EDGES),
    rejectedEdgeIds: z.array(z.string().min(1).max(LIMITS.MAX_NAME_CHARS)).max(GRAPH_LIMITS.MAX_EDGES),
    parent: z.array(unionFindRowSchema).max(GRAPH_LIMITS.MAX_NODES),
    componentCount: z.number().int().nonnegative().max(GRAPH_LIMITS.MAX_NODES),
    formsCycle: z.boolean(),
    union: kruskalUnionSchema.nullable(),
    totalWeight: z.number().finite(),
    connected: z.boolean(),
    forest: z.boolean(),
  })
  .superRefine((snapshot, ctx) => {
    const add = (path: Array<string | number>, message: string) => {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
    };
    const ids = validateSignedGraph(snapshot, add);
    const edgeById = new Map(snapshot.edges.map((edge) => [edge.id, edge]));
    const n = snapshot.nodes.length;
    const edgeOperations: KruskalOperation[] = ['inspect-edge', 'reject-edge', 'union'];

    if (n === 0) {
      if (snapshot.operation !== 'init' && snapshot.operation !== 'sort' && snapshot.operation !== 'done') {
        add(['operation'], 'an empty graph may only emit init, sort or done');
      }
      if (snapshot.sortedEdgeIds.length || snapshot.selectedEdgeIds.length || snapshot.rejectedEdgeIds.length) {
        add(['sortedEdgeIds'], 'an empty graph has no edges');
      }
      if (snapshot.parent.length || snapshot.componentCount !== 0) add(['parent'], 'an empty graph has no union-find rows');
      if (snapshot.currentEdgeId || snapshot.union || snapshot.currentIndex !== 0) add(['currentEdgeId'], 'an empty graph has no current edge');
      if (snapshot.formsCycle) add(['formsCycle'], 'an empty graph cannot form a cycle');
      if (snapshot.totalWeight !== 0) add(['totalWeight'], 'an empty graph has zero weight');
      return;
    }

    const rowById = new Map<string, z.infer<typeof unionFindRowSchema>>();
    snapshot.parent.forEach((row, index) => {
      if (!ids.has(row.nodeId)) add(['parent', index, 'nodeId'], 'union-find row names an unknown node');
      if (!ids.has(row.parentId)) add(['parent', index, 'parentId'], 'parentId names an unknown node');
      if (rowById.has(row.nodeId)) add(['parent', index], 'duplicate union-find row');
      rowById.set(row.nodeId, row);
    });
    if (rowById.size !== n) add(['parent'], 'union-find table must cover every node');

    const rootOf = (nodeId: string): string | null => {
      const chain = new Set<string>();
      let cursor = nodeId;
      for (let guard = 0; guard <= n; guard += 1) {
        const row = rowById.get(cursor);
        if (!row) return null;
        if (row.parentId === cursor) return cursor;
        if (chain.has(cursor)) return null;
        chain.add(cursor);
        cursor = row.parentId;
      }
      return null;
    };
    snapshot.parent.forEach((row, index) => {
      const root = rootOf(row.nodeId);
      if (!root) {
        add(['parent', index], 'parent pointers must form an acyclic forest rooted at self');
      } else if (row.rootId !== root) {
        add(['parent', index, 'rootId'], 'rootId must be the real find() result');
      }
    });
    const rootIds = new Set<string>();
    snapshot.nodes.forEach((node) => {
      const root = rootOf(node.id);
      if (root) rootIds.add(root);
    });
    const roots = rootIds.size;
    if (snapshot.componentCount !== roots) add(['componentCount'], 'componentCount must equal the number of real roots');
    if (snapshot.connected !== (roots === 1)) add(['connected'], 'connected must be true only when one root remains');
    if (snapshot.forest !== (roots > 1)) add(['forest'], 'forest must be true when several roots remain');

    const sorted = new Set<string>();
    snapshot.sortedEdgeIds.forEach((id, index) => {
      if (!edgeById.has(id)) add(['sortedEdgeIds', index], 'sorted edge is unknown');
      if (sorted.has(id)) add(['sortedEdgeIds', index], 'sorted edge is duplicated');
      sorted.add(id);
    });
    if (snapshot.operation === 'init') {
      if (snapshot.sortedEdgeIds.length) add(['sortedEdgeIds'], 'init runs before sorting');
    } else if (snapshot.sortedEdgeIds.length !== snapshot.edges.length) {
      add(['sortedEdgeIds'], 'after sorting, every edge must appear exactly once');
    }
    if ((snapshot.operation === 'init' || snapshot.operation === 'sort') && snapshot.currentIndex !== 0) {
      add(['currentIndex'], `${snapshot.operation} starts at index 0`);
    }
    if (snapshot.operation !== 'done' && snapshot.currentIndex >= Math.max(1, snapshot.edges.length)) {
      add(['currentIndex'], 'currentIndex exceeds the sorted edge list');
    }

    const selected = new Set<string>();
    snapshot.selectedEdgeIds.forEach((id, index) => {
      if (!edgeById.has(id)) add(['selectedEdgeIds', index], 'selected edge is unknown');
      if (selected.has(id)) add(['selectedEdgeIds', index], 'selected edge is duplicated');
      selected.add(id);
    });
    const rejected = new Set<string>();
    snapshot.rejectedEdgeIds.forEach((id, index) => {
      if (!edgeById.has(id)) add(['rejectedEdgeIds', index], 'rejected edge is unknown');
      if (rejected.has(id)) add(['rejectedEdgeIds', index], 'rejected edge is duplicated');
      if (selected.has(id)) add(['rejectedEdgeIds', index], 'an edge cannot be both accepted and rejected');
      rejected.add(id);
    });
    if (snapshot.selectedEdgeIds.length !== n - roots) {
      add(['selectedEdgeIds'], 'a union-find forest with c components needs V - c accepted edges');
    }
    const selectedWeight = snapshot.selectedEdgeIds.reduce((sum, id) => sum + (edgeById.get(id)?.weight ?? 0), 0);
    if (Math.abs(snapshot.totalWeight - selectedWeight) > 1e-9 * Math.max(1, Math.abs(selectedWeight))) {
      add(['totalWeight'], 'totalWeight must equal the sum of accepted edge weights');
    }

    const edge = snapshot.currentEdgeId ? edgeById.get(snapshot.currentEdgeId) : undefined;
    if (edgeOperations.includes(snapshot.operation)) {
      if (!edge) add(['currentEdgeId'], `${snapshot.operation} must name a real edge`);
      if (edge && snapshot.sortedEdgeIds[snapshot.currentIndex] !== edge.id) {
        add(['currentIndex'], 'currentIndex must point at currentEdgeId in sortedEdgeIds');
      }
    } else if (snapshot.currentEdgeId) {
      add(['currentEdgeId'], `${snapshot.operation} must not carry a current edge`);
    }
    if (edge) {
      const rowA = rowById.get(edge.fromId);
      const rowB = rowById.get(edge.toId);
      const same = rowA && rowB ? rowA.rootId === rowB.rootId : false;
      // `union` records the parent table *after* the merge, so both endpoints
      // deliberately share a root there; only inspect/reject see the pre-union roots.
      if (snapshot.operation !== 'union' && snapshot.formsCycle !== same) {
        add(['formsCycle'], 'formsCycle must be the real pre-union root comparison');
      }
      if (snapshot.operation === 'reject-edge' && !snapshot.formsCycle) add(['formsCycle'], 'reject-edge needs a real cycle');
      if (snapshot.operation === 'union' && snapshot.formsCycle) add(['formsCycle'], 'a union must connect different roots');
    } else if (snapshot.formsCycle) {
      add(['formsCycle'], 'only an edge frame can form a cycle');
    }

    if (snapshot.operation === 'inspect-edge') {
      if (edge && (selected.has(edge.id) || rejected.has(edge.id))) add(['currentEdgeId'], 'inspect-edge sees a fresh edge');
      if (snapshot.union) add(['union'], 'inspect-edge does not union yet');
    }
    if (snapshot.operation === 'reject-edge') {
      if (edge && !rejected.has(edge.id)) add(['rejectedEdgeIds'], 'reject-edge must record the rejected edge');
      if (snapshot.union) add(['union'], 'a rejected edge does not union');
    }
    if (snapshot.operation === 'union') {
      if (!edge || !selected.has(edge.id)) add(['selectedEdgeIds'], 'a union frame must accept the current edge');
      if (!snapshot.union) add(['union'], 'a union frame must report the real parent change');
      if (snapshot.union) {
        const detail = snapshot.union;
        if (detail.edgeId !== edge?.id) add(['union', 'edgeId'], 'union detail must name the current edge');
        if (detail.rootA === detail.rootB) add(['union', 'rootA'], 'a union needs two different roots');
        if (detail.mergedRoot !== detail.rootA && detail.mergedRoot !== detail.rootB) {
          add(['union', 'mergedRoot'], 'mergedRoot must be one of the two roots');
        }
        if (detail.attachedRoot === detail.mergedRoot) add(['union', 'attachedRoot'], 'merged root cannot attach to itself');
        if (detail.attachedRoot !== detail.rootA && detail.attachedRoot !== detail.rootB) {
          add(['union', 'attachedRoot'], 'attachedRoot must be one of the two roots');
        }
        if (detail.parentOfAttachedBefore !== detail.attachedRoot) add(['union', 'parentOfAttachedBefore'], 'attached root was its own parent');
        if (detail.parentOfAttachedAfter !== detail.mergedRoot) add(['union', 'parentOfAttachedAfter'], 'attached root must point at the merged root');
        const attachedRow = rowById.get(detail.attachedRoot);
        if (attachedRow && attachedRow.parentId !== detail.mergedRoot) add(['union', 'attachedRoot'], 'post-union parent must match');
        const mergedRow = rowById.get(detail.mergedRoot);
        if (mergedRow && mergedRow.rank !== detail.rankAfter) add(['union', 'rankAfter'], 'rankAfter must match the real merged root rank');
        if (detail.componentCountAfter !== detail.componentCountBefore - 1) {
          add(['union', 'componentCountAfter'], 'a union removes exactly one component');
        }
        if (detail.componentCountAfter !== snapshot.componentCount) add(['union', 'componentCountAfter'], 'union detail must match snapshot componentCount');
      }
    } else if (snapshot.union) {
      add(['union'], 'only union frames carry union detail');
    }

    if (snapshot.operation === 'init' || snapshot.operation === 'sort') {
      if (snapshot.currentEdgeId || snapshot.selectedEdgeIds.length || snapshot.rejectedEdgeIds.length) {
        add(['selectedEdgeIds'], `${snapshot.operation} has not inspected an edge`);
      }
      if (snapshot.union) add(['union'], `${snapshot.operation} has not unioned anything`);
      if (snapshot.totalWeight !== 0) add(['totalWeight'], `${snapshot.operation} has zero weight`);
    }
    if (snapshot.operation === 'done') {
      if (snapshot.currentEdgeId) add(['currentEdgeId'], 'done carries no current edge');
      if (snapshot.union) add(['union'], 'done carries no union change');
      if (snapshot.currentIndex !== snapshot.edges.length) add(['currentIndex'], 'done points past the last sorted edge');
    }
  });
export type KruskalMstSnapshot = z.infer<typeof kruskalMstSnapshotSchema>;

/* ------------------------------------------------------------------ *
 * G3: Kahn topological sort and AOE critical path
 * ------------------------------------------------------------------ */

export const TOPOLOGICAL_OPERATIONS = [
  'init', 'enqueue', 'dequeue', 'inspect-edge', 'decrement', 'enqueue-node', 'cycle', 'done',
] as const;
export type TopologicalOperation = (typeof TOPOLOGICAL_OPERATIONS)[number];

export const CRITICAL_PATH_OPERATIONS = [
  'init', 'topo-order', 've', 'vl', 'activity', 'cycle', 'done',
] as const;
export type CriticalPathOperation = (typeof CRITICAL_PATH_OPERATIONS)[number];

const queueItemSchema = z.object({
  id: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  nodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
});

const indegreeRowSchema = z.object({
  nodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  indegree: z.number().int().nonnegative().max(GRAPH_LIMITS.MAX_EDGES),
});

const indegreeChangeSchema = z.object({
  nodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  before: z.number().int().nonnegative().max(GRAPH_LIMITS.MAX_EDGES),
  after: z.number().int().nonnegative().max(GRAPH_LIMITS.MAX_EDGES),
});

function validateDirectedDagEdges(
  snapshot: {
    nodes: Array<{ id: string }>;
    edges: Array<{ id: string; fromId: string; toId: string }>;
    directed: boolean;
  },
  add: (path: Array<string | number>, message: string) => void,
): {
  ids: Set<string>;
  edgeById: Map<string, { id: string; fromId: string; toId: string }>;
  indegree: Map<string, number>;
  outdegree: Map<string, number>;
} {
  const ids = new Set<string>();
  snapshot.nodes.forEach((node, index) => {
    if (ids.has(node.id)) add(['nodes', index, 'id'], `duplicate graph node id "${node.id}"`);
    ids.add(node.id);
  });
  const edgeIds = new Set<string>();
  const edgePairs = new Set<string>();
  const edgeById = new Map<string, { id: string; fromId: string; toId: string }>();
  const indegree = new Map<string, number>();
  const outdegree = new Map<string, number>();
  for (const node of snapshot.nodes) {
    indegree.set(node.id, 0);
    outdegree.set(node.id, 0);
  }
  snapshot.edges.forEach((edge, index) => {
    if (edgeIds.has(edge.id)) add(['edges', index, 'id'], `duplicate graph edge id "${edge.id}"`);
    edgeIds.add(edge.id);
    if (!ids.has(edge.fromId)) add(['edges', index, 'fromId'], `edge "${edge.id}" starts at unknown node "${edge.fromId}"`);
    if (!ids.has(edge.toId)) add(['edges', index, 'toId'], `edge "${edge.id}" ends at unknown node "${edge.toId}"`);
    if (edge.fromId === edge.toId) add(['edges', index], 'self-loops are not supported in this teaching DAG');
    if (ids.has(edge.fromId) && ids.has(edge.toId) && edge.fromId !== edge.toId) {
      const pair = `${edge.fromId}\u0000${edge.toId}`;
      if (edgePairs.has(pair)) add(['edges', index], `duplicate directed edge "${edge.fromId}"→"${edge.toId}"`);
      edgePairs.add(pair);
      indegree.set(edge.toId, (indegree.get(edge.toId) ?? 0) + 1);
      outdegree.set(edge.fromId, (outdegree.get(edge.fromId) ?? 0) + 1);
    }
    edgeById.set(edge.id, edge);
  });
  if (!snapshot.directed) add(['directed'], 'this G3 structure is always a directed DAG');
  return { ids, edgeById, indegree, outdegree };
}

export const topologicalSortSnapshotSchema = z
  .object({
    kind: z.literal('topological-sort'),
    algorithm: z.literal('kahn'),
    operation: z.enum(TOPOLOGICAL_OPERATIONS),
    nodes: z.array(graphNodeSchema).max(GRAPH_LIMITS.MAX_NODES),
    edges: z.array(graphEdgeSchema).max(GRAPH_LIMITS.MAX_EDGES),
    directed: z.literal(true),
    indegree: z.array(indegreeRowSchema).max(GRAPH_LIMITS.MAX_NODES),
    queue: z.array(queueItemSchema).max(GRAPH_LIMITS.MAX_NODES),
    queueAdded: queueItemSchema.nullable(),
    queueRemoved: queueItemSchema.nullable(),
    currentNodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    currentEdgeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    neighborNodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    indegreeChange: indegreeChangeSchema.nullable(),
    removedEdgeIds: z.array(z.string().min(1).max(LIMITS.MAX_NAME_CHARS)).max(GRAPH_LIMITS.MAX_EDGES),
    topologicalOrder: z.array(z.string().min(1).max(LIMITS.MAX_NAME_CHARS)).max(GRAPH_LIMITS.MAX_NODES),
    hasCycle: z.boolean(),
    cycleNodeIds: z.array(z.string().min(1).max(LIMITS.MAX_NAME_CHARS)).max(GRAPH_LIMITS.MAX_NODES),
  })
  .superRefine((snapshot, ctx) => {
    const add = (path: Array<string | number>, message: string) => {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
    };
    const { ids, edgeById, indegree } = validateDirectedDagEdges(snapshot, add);
    const n = snapshot.nodes.length;
    const edgeOps: TopologicalOperation[] = ['inspect-edge', 'decrement'];
    const queueOps: TopologicalOperation[] = ['enqueue', 'enqueue-node'];

    const rows = new Map<string, number>();
    snapshot.indegree.forEach((row, index) => {
      if (!ids.has(row.nodeId)) add(['indegree', index, 'nodeId'], 'indegree row names an unknown node');
      if (rows.has(row.nodeId)) add(['indegree', index, 'nodeId'], `indegree repeats node "${row.nodeId}"`);
      rows.set(row.nodeId, row.indegree);
    });
    if (rows.size !== n) add(['indegree'], 'indegree must contain exactly one row per node');
    if (snapshot.operation === 'init') {
      for (const node of snapshot.nodes) {
        if (rows.get(node.id) !== (indegree.get(node.id) ?? 0)) {
          add(['indegree', 'nodeId'], 'init indegree must be the real incoming edge count');
        }
      }
    }

    const queueNodeIds = new Set<string>();
    const queueIds = new Set<string>();
    snapshot.queue.forEach((item, index) => {
      if (!ids.has(item.nodeId)) add(['queue', index, 'nodeId'], 'queue entry names an unknown node');
      if (queueNodeIds.has(item.nodeId)) add(['queue', index, 'nodeId'], 'queue repeats a node');
      if (queueIds.has(item.id)) add(['queue', index, 'id'], 'queue entry id is duplicated');
      queueNodeIds.add(item.nodeId);
      queueIds.add(item.id);
    });

    const removed = new Set<string>();
    snapshot.removedEdgeIds.forEach((id, index) => {
      if (!edgeById.has(id)) add(['removedEdgeIds', index], 'removed edge is unknown');
      if (removed.has(id)) add(['removedEdgeIds', index], 'removed edge is duplicated');
      removed.add(id);
    });
    const order = new Set<string>();
    snapshot.topologicalOrder.forEach((id, index) => {
      if (!ids.has(id)) add(['topologicalOrder', index], 'topological order names an unknown node');
      if (order.has(id)) add(['topologicalOrder', index], 'topological order repeats a node');
      order.add(id);
    });

    if (snapshot.currentNodeId !== null && !ids.has(snapshot.currentNodeId)) {
      add(['currentNodeId'], 'currentNodeId must name a real node');
    }
    const currentEdge = snapshot.currentEdgeId ? edgeById.get(snapshot.currentEdgeId) : undefined;
    if (edgeOps.includes(snapshot.operation)) {
      if (!currentEdge) add(['currentEdgeId'], `${snapshot.operation} must name a real edge`);
    } else if (snapshot.currentEdgeId) {
      add(['currentEdgeId'], `${snapshot.operation} must not carry a current edge`);
    }
    if (snapshot.neighborNodeId !== null) {
      if (!ids.has(snapshot.neighborNodeId)) add(['neighborNodeId'], 'neighborNodeId must name a real node');
      if (currentEdge && currentEdge.toId !== snapshot.neighborNodeId) {
        add(['neighborNodeId'], 'neighbor must be the destination of the current edge');
      }
    }
    if (edgeOps.includes(snapshot.operation) && snapshot.neighborNodeId === null) {
      add(['neighborNodeId'], `${snapshot.operation} must report the edge destination`);
    }
    if (snapshot.operation === 'inspect-edge' && snapshot.indegreeChange) {
      add(['indegreeChange'], 'inspect-edge has not changed an indegree yet');
    }
    if (snapshot.operation === 'decrement') {
      if (!snapshot.indegreeChange) add(['indegreeChange'], 'decrement must report the before/after indegree');
      if (!currentEdge) add(['currentEdgeId'], 'decrement must name the removed dependency');
      if (snapshot.indegreeChange && currentEdge) {
        if (snapshot.indegreeChange.nodeId !== currentEdge.toId) add(['indegreeChange', 'nodeId'], 'indegree change must target the edge destination');
        if (snapshot.indegreeChange.before !== snapshot.indegreeChange.after + 1) add(['indegreeChange', 'before'], 'decrement changes the indegree by exactly one');
        if (rows.get(snapshot.indegreeChange.nodeId) !== snapshot.indegreeChange.after) {
          add(['indegreeChange', 'after'], 'after must match the published indegree row');
        }
        if (snapshot.currentNodeId !== currentEdge.fromId) add(['currentNodeId'], 'the current node must be the edge source');
      }
    }
    if (snapshot.operation !== 'decrement' && snapshot.indegreeChange) {
      add(['indegreeChange'], 'only decrement frames carry an indegree change');
    }

    if (snapshot.queueAdded) {
      if (!queueOps.includes(snapshot.operation)) add(['queueAdded'], 'only enqueue frames add a queue entry');
      if (!queueIds.has(snapshot.queueAdded.id) || !queueNodeIds.has(snapshot.queueAdded.nodeId)) {
        add(['queueAdded'], 'the added entry must be present in the queue');
      }
    }
    if (queueOps.includes(snapshot.operation) && !snapshot.queueAdded) {
      add(['queueAdded'], `${snapshot.operation} must report the added queue entry`);
    }
    if (snapshot.queueRemoved) {
      if (snapshot.operation !== 'dequeue') add(['queueRemoved'], 'only dequeue frames remove a queue entry');
      if (queueIds.has(snapshot.queueRemoved.id) || queueNodeIds.has(snapshot.queueRemoved.nodeId)) {
        add(['queueRemoved'], 'a dequeued entry cannot remain in the queue');
      }
    }
    if (snapshot.operation === 'dequeue') {
      if (!snapshot.queueRemoved) add(['queueRemoved'], 'dequeue must report the removed queue entry');
      if (snapshot.queueRemoved && snapshot.currentNodeId !== snapshot.queueRemoved.nodeId) {
        add(['currentNodeId'], 'dequeue current node must be the removed queue node');
      }
      if (snapshot.queueRemoved && snapshot.topologicalOrder[snapshot.topologicalOrder.length - 1] !== snapshot.queueRemoved.nodeId) {
        add(['topologicalOrder'], 'dequeue must append exactly the removed node');
      }
    }

    if (snapshot.operation === 'init') {
      if (snapshot.queue.length || snapshot.topologicalOrder.length || snapshot.removedEdgeIds.length) {
        add(['queue'], 'init has an empty queue and order');
      }
      if (snapshot.currentNodeId || snapshot.currentEdgeId || snapshot.neighborNodeId || snapshot.queueAdded || snapshot.queueRemoved) {
        add(['currentNodeId'], 'init has no current item');
      }
      if (snapshot.hasCycle || snapshot.cycleNodeIds.length) add(['hasCycle'], 'init has no cycle result');
    }
    if (snapshot.operation === 'cycle') {
      if (!snapshot.hasCycle) add(['hasCycle'], 'cycle frames must set hasCycle');
      if (snapshot.queue.length) add(['queue'], 'a cycle stops with an empty Kahn queue');
      if (snapshot.topologicalOrder.length === n) add(['topologicalOrder'], 'a cyclic graph cannot have a complete topological order');
    }
    if (snapshot.operation === 'done') {
      if (snapshot.queue.length || snapshot.queueAdded || snapshot.queueRemoved) add(['queue'], 'done requires an empty queue');
      if (snapshot.currentNodeId || snapshot.currentEdgeId || snapshot.neighborNodeId || snapshot.indegreeChange) {
        add(['currentNodeId'], 'done carries no current item');
      }
      if (!snapshot.hasCycle) {
        if (snapshot.topologicalOrder.length !== n) add(['topologicalOrder'], 'a successful Kahn run must cover every node');
        if (snapshot.cycleNodeIds.length) add(['cycleNodeIds'], 'a successful run has no cycle nodes');
        if (snapshot.removedEdgeIds.length !== snapshot.edges.length) add(['removedEdgeIds'], 'a successful run removes every edge exactly once');
      } else {
        if (snapshot.topologicalOrder.length >= n) add(['topologicalOrder'], 'a cyclic run leaves at least one node unresolved');
        const unresolved = new Set(snapshot.nodes.map((node) => node.id).filter((id) => !order.has(id)));
        if (snapshot.cycleNodeIds.length !== unresolved.size || snapshot.cycleNodeIds.some((id) => !unresolved.has(id))) {
          add(['cycleNodeIds'], 'cycleNodeIds must be exactly the nodes Kahn could not resolve');
        }
      }
    }
    if (snapshot.hasCycle && snapshot.operation !== 'cycle' && snapshot.operation !== 'done') {
      add(['hasCycle'], 'only cycle and done may publish a cycle result');
    }
  });
export type TopologicalSortSnapshot = z.infer<typeof topologicalSortSnapshotSchema>;

const activityRowSchema = z.object({
  edgeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  fromId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  toId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  duration: z.number().finite().nonnegative(),
  e: z.number().finite().nonnegative().nullable(),
  l: z.number().finite().nonnegative().nullable(),
  slack: z.number().finite().nonnegative().nullable(),
  critical: z.boolean(),
});

const eventTimeRowSchema = z.object({
  nodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  time: z.number().finite().nonnegative().nullable(),
});

const timeChangeSchema = z.object({
  nodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  previousTime: z.number().finite().nonnegative().nullable(),
  candidateTime: z.number().finite().nonnegative(),
  newTime: z.number().finite().nonnegative(),
});

const activityChangeSchema = z.object({
  edgeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  e: z.number().finite().nonnegative(),
  l: z.number().finite().nonnegative(),
  slack: z.number().finite().nonnegative(),
  critical: z.boolean(),
});

export const criticalPathSnapshotSchema = z
  .object({
    kind: z.literal('critical-path'),
    algorithm: z.literal('aoe'),
    operation: z.enum(CRITICAL_PATH_OPERATIONS),
    phase: z.enum(['init', 'topo', 've', 'vl', 'activity', 'cycle', 'done']),
    nodes: z.array(graphNodeSchema).max(GRAPH_LIMITS.MAX_NODES),
    edges: z.array(graphEdgeSchema.extend({ duration: z.number().finite().nonnegative() })).max(GRAPH_LIMITS.MAX_EDGES),
    directed: z.literal(true),
    sourceNodeIds: z.array(z.string().min(1).max(LIMITS.MAX_NAME_CHARS)).max(GRAPH_LIMITS.MAX_NODES),
    sinkNodeIds: z.array(z.string().min(1).max(LIMITS.MAX_NAME_CHARS)).max(GRAPH_LIMITS.MAX_NODES),
    topologicalOrder: z.array(z.string().min(1).max(LIMITS.MAX_NAME_CHARS)).max(GRAPH_LIMITS.MAX_NODES),
    veRows: z.array(eventTimeRowSchema).max(GRAPH_LIMITS.MAX_NODES),
    vlRows: z.array(eventTimeRowSchema).max(GRAPH_LIMITS.MAX_NODES),
    activities: z.array(activityRowSchema).max(GRAPH_LIMITS.MAX_EDGES),
    currentNodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    currentEdgeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    timeChange: timeChangeSchema.nullable(),
    activityChange: activityChangeSchema.nullable(),
    criticalEdgeIds: z.array(z.string().min(1).max(LIMITS.MAX_NAME_CHARS)).max(GRAPH_LIMITS.MAX_EDGES),
    criticalPaths: z.array(z.array(z.string().min(1).max(LIMITS.MAX_NAME_CHARS)).max(GRAPH_LIMITS.MAX_NODES)).max(12),
    projectDuration: z.number().finite().nonnegative().nullable(),
    hasCycle: z.boolean(),
    cycleNodeIds: z.array(z.string().min(1).max(LIMITS.MAX_NAME_CHARS)).max(GRAPH_LIMITS.MAX_NODES),
  })
  .superRefine((snapshot, ctx) => {
    const add = (path: Array<string | number>, message: string) => {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
    };
    const { ids, edgeById, indegree, outdegree } = validateDirectedDagEdges(snapshot, add);
    const durationById = new Map(snapshot.edges.map((edge) => [edge.id, edge.duration]));
    const n = snapshot.nodes.length;
    const activityById = new Map(snapshot.activities.map((row) => [row.edgeId, row]));

    const phaseByOperation: Record<CriticalPathOperation, string> = {
      init: 'init', 'topo-order': 'topo', ve: 've', vl: 'vl', activity: 'activity', cycle: 'cycle', done: 'done',
    };
    if (snapshot.phase !== phaseByOperation[snapshot.operation]) {
      add(['phase'], 'phase must agree with the published operation');
    }

    const sources = new Set<string>();
    snapshot.sourceNodeIds.forEach((id, index) => {
      if (!ids.has(id)) add(['sourceNodeIds', index], 'source names an unknown node');
      if (sources.has(id)) add(['sourceNodeIds', index], 'source is duplicated');
      sources.add(id);
      if ((indegree.get(id) ?? 0) !== 0) add(['sourceNodeIds', index], 'a source must have indegree 0');
    });
    const sinks = new Set<string>();
    snapshot.sinkNodeIds.forEach((id, index) => {
      if (!ids.has(id)) add(['sinkNodeIds', index], 'sink names an unknown node');
      if (sinks.has(id)) add(['sinkNodeIds', index], 'sink is duplicated');
      sinks.add(id);
      if ((outdegree.get(id) ?? 0) !== 0) add(['sinkNodeIds', index], 'a sink must have outdegree 0');
    });
    for (const node of snapshot.nodes) {
      if ((indegree.get(node.id) ?? 0) === 0 && !sources.has(node.id)) add(['sourceNodeIds'], 'sourceNodeIds must list every indegree-0 node');
      if ((outdegree.get(node.id) ?? 0) === 0 && !sinks.has(node.id)) add(['sinkNodeIds'], 'sinkNodeIds must list every outdegree-0 node');
    }

    const order = new Set<string>();
    snapshot.topologicalOrder.forEach((id, index) => {
      if (!ids.has(id)) add(['topologicalOrder', index], 'topological order names an unknown node');
      if (order.has(id)) add(['topologicalOrder', index], 'topological order repeats a node');
      order.add(id);
    });
    if (snapshot.operation === 'init' || snapshot.hasCycle) {
      if (snapshot.topologicalOrder.length) add(['topologicalOrder'], 'a cycle/init frame has no claimed topological order');
    } else if (snapshot.topologicalOrder.length !== n) {
      add(['topologicalOrder'], 'every acyclic frame must carry the complete topological order');
    }

    const veRows = new Map<string, number | null>();
    snapshot.veRows.forEach((row, index) => {
      if (!ids.has(row.nodeId)) add(['veRows', index, 'nodeId'], 've row names an unknown node');
      if (veRows.has(row.nodeId)) add(['veRows', index, 'nodeId'], 've repeats a node');
      veRows.set(row.nodeId, row.time);
    });
    if (veRows.size !== n) add(['veRows'], 'veRows must contain exactly one row per node');
    const vlRows = new Map<string, number | null>();
    snapshot.vlRows.forEach((row, index) => {
      if (!ids.has(row.nodeId)) add(['vlRows', index, 'nodeId'], 'vl row names an unknown node');
      if (vlRows.has(row.nodeId)) add(['vlRows', index, 'nodeId'], 'vl repeats a node');
      vlRows.set(row.nodeId, row.time);
    });
    if (vlRows.size !== n) add(['vlRows'], 'vlRows must contain exactly one row per node');

    if (snapshot.activities.length !== snapshot.edges.length) {
      add(['activities'], 'activities must have exactly one row per activity edge');
    }
    snapshot.activities.forEach((row, index) => {
      const edge = edgeById.get(row.edgeId);
      if (!edge) {
        add(['activities', index, 'edgeId'], 'activity row names an unknown edge');
        return;
      }
      if (row.fromId !== edge.fromId || row.toId !== edge.toId) add(['activities', index], 'activity endpoints must copy the real edge');
      if (row.duration !== durationById.get(row.edgeId)) add(['activities', index, 'duration'], 'activity duration must copy the real edge');
      if (row.e !== null && row.l !== null && row.slack !== null) {
        if (Math.abs((row.l - row.e) - row.slack) > 1e-9) add(['activities', index, 'slack'], 'slack must equal l - e');
        if (row.critical !== (Math.abs(row.slack) <= 1e-9)) add(['activities', index, 'critical'], 'critical must mean slack 0');
      }
      if (row.critical && (row.e === null || row.l === null || row.slack === null)) {
        add(['activities', index, 'critical'], 'an uncomputed activity cannot be critical');
      }
    });
    if (activityById.size !== snapshot.activities.length) add(['activities'], 'activity edge ids must be unique');

    if (snapshot.currentNodeId !== null && !ids.has(snapshot.currentNodeId)) add(['currentNodeId'], 'currentNodeId must name a real node');
    if (snapshot.currentEdgeId !== null && !edgeById.has(snapshot.currentEdgeId)) add(['currentEdgeId'], 'currentEdgeId must name a real activity');
    if (snapshot.timeChange) {
      if (snapshot.operation !== 've' && snapshot.operation !== 'vl') add(['timeChange'], 'only ve/vl frames carry a time change');
      if (!ids.has(snapshot.timeChange.nodeId)) add(['timeChange', 'nodeId'], 'time change names an unknown node');
      if (snapshot.currentNodeId !== snapshot.timeChange.nodeId) add(['currentNodeId'], 'current node must match the time change');
      const published = snapshot.operation === 've' ? veRows.get(snapshot.timeChange.nodeId) : vlRows.get(snapshot.timeChange.nodeId);
      if (published !== snapshot.timeChange.newTime) add(['timeChange', 'newTime'], 'new time must match the published row');
      if (snapshot.timeChange.previousTime !== null && snapshot.timeChange.previousTime === snapshot.timeChange.newTime) {
        add(['timeChange', 'previousTime'], 'a recorded update must change the value');
      }
    } else if (snapshot.operation === 've' || snapshot.operation === 'vl') {
      add(['timeChange'], `${snapshot.operation} must report the event time change`);
    }
    if (snapshot.activityChange) {
      if (snapshot.operation !== 'activity') add(['activityChange'], 'only activity frames carry an activity change');
      const row = activityById.get(snapshot.activityChange.edgeId);
      if (!row) add(['activityChange', 'edgeId'], 'activity change names an unknown edge');
      if (snapshot.currentEdgeId !== snapshot.activityChange.edgeId) add(['currentEdgeId'], 'current edge must match the activity change');
      if (row) {
        if (row.e !== snapshot.activityChange.e || row.l !== snapshot.activityChange.l || row.slack !== snapshot.activityChange.slack) {
          add(['activityChange'], 'activity change must match the published row');
        }
        if (row.critical !== snapshot.activityChange.critical) add(['activityChange', 'critical'], 'critical flag must match the row');
      }
    } else if (snapshot.operation === 'activity') {
      add(['activityChange'], 'activity frames must report e, l and slack');
    }

    const criticalIds = new Set<string>();
    snapshot.criticalEdgeIds.forEach((id, index) => {
      if (!edgeById.has(id)) add(['criticalEdgeIds', index], 'critical edge is unknown');
      if (criticalIds.has(id)) add(['criticalEdgeIds', index], 'critical edge is duplicated');
      criticalIds.add(id);
      const row = activityById.get(id);
      if (row && (row.slack === null || Math.abs(row.slack) > 1e-9 || !row.critical)) {
        add(['criticalEdgeIds', index], 'critical edges must have zero slack');
      }
    });

    if (snapshot.operation === 'init') {
      if (snapshot.topologicalOrder.length || snapshot.criticalEdgeIds.length || snapshot.criticalPaths.length) {
        add(['topologicalOrder'], 'init has no order or critical result');
      }
      if (snapshot.projectDuration !== null) add(['projectDuration'], 'init has no project duration');
      if (snapshot.veRows.some((row) => row.time !== null) || snapshot.vlRows.some((row) => row.time !== null)) {
        add(['veRows'], 'init has empty event-time tables');
      }
      if (snapshot.activities.some((row) => row.e !== null || row.l !== null || row.slack !== null)) {
        add(['activities'], 'init has no activity times');
      }
      if (snapshot.currentNodeId || snapshot.currentEdgeId || snapshot.timeChange || snapshot.activityChange) {
        add(['currentNodeId'], 'init has no current item');
      }
      if (snapshot.hasCycle || snapshot.cycleNodeIds.length) add(['hasCycle'], 'init has no cycle result');
    }
    if (snapshot.operation === 'topo-order') {
      if (snapshot.projectDuration !== null) add(['projectDuration'], 'the topological pass has not set the project duration');
      if (snapshot.activities.some((row) => row.e !== null || row.l !== null || row.slack !== null)) {
        add(['activities'], 'the topological pass has not computed activity times');
      }
      if (snapshot.currentNodeId || snapshot.currentEdgeId || snapshot.timeChange || snapshot.activityChange) {
        add(['currentNodeId'], 'the topological pass carries no current item');
      }
    }
    if (snapshot.operation === 'cycle') {
      if (!snapshot.hasCycle) add(['hasCycle'], 'cycle frames must set hasCycle');
      if (snapshot.projectDuration !== null) add(['projectDuration'], 'a cyclic AOE network has no project duration');
    } else if (snapshot.hasCycle && snapshot.operation !== 'done') {
      add(['hasCycle'], 'only cycle and done may publish a cycle result');
    }
    if (snapshot.operation === 'done') {
      if (snapshot.hasCycle) {
        if (snapshot.projectDuration !== null) add(['projectDuration'], 'a cyclic AOE network has no project duration');
        if (snapshot.criticalEdgeIds.length || snapshot.criticalPaths.length) add(['criticalEdgeIds'], 'a cyclic network has no critical path');
        if (snapshot.activities.some((row) => row.e !== null || row.l !== null || row.slack !== null)) {
          add(['activities'], 'a cyclic network has no activity times');
        }
      } else {
        if (snapshot.projectDuration === null) add(['projectDuration'], 'done must publish the project duration');
        if (snapshot.activities.some((row) => row.e === null || row.l === null || row.slack === null)) {
          add(['activities'], 'done requires complete activity times');
        }
        if (snapshot.veRows.some((row) => row.time === null) || snapshot.vlRows.some((row) => row.time === null)) {
          add(['veRows'], 'done requires complete event-time tables');
        }
        const computedVe = new Map<string, number>();
        for (const row of snapshot.veRows) if (row.time !== null) computedVe.set(row.nodeId, row.time);
        for (const node of snapshot.nodes) {
          const actual = snapshot.edges
            .filter((edge) => edge.toId === node.id)
            .reduce((best, edge) => Math.max(best, (computedVe.get(edge.fromId) ?? 0) + edge.duration), 0);
          if (Math.abs((computedVe.get(node.id) ?? 0) - actual) > 1e-9) {
            add(['veRows'], `ve[${node.id}] does not satisfy ve[v] = max(ve[u] + duration)`);
          }
        }
        const computedVl = new Map<string, number>();
        for (const row of snapshot.vlRows) if (row.time !== null) computedVl.set(row.nodeId, row.time);
        for (const node of snapshot.nodes) {
          const actual = sinks.has(node.id)
            ? (snapshot.projectDuration ?? 0)
            : snapshot.edges
                .filter((edge) => edge.fromId === node.id)
                .reduce((best, edge) => Math.min(best, (computedVl.get(edge.toId) ?? 0) - edge.duration), Number.POSITIVE_INFINITY);
          if (Math.abs((computedVl.get(node.id) ?? 0) - actual) > 1e-9) {
            add(['vlRows'], `vl[${node.id}] does not satisfy vl[v] = min(vl[w] - duration)`);
          }
        }
        const expectedDuration = snapshot.sinkNodeIds.reduce(
          (best, id) => Math.max(best, computedVe.get(id) ?? 0), 0,
        );
        if (snapshot.projectDuration !== null && Math.abs(snapshot.projectDuration - expectedDuration) > 1e-9) {
          add(['projectDuration'], 'projectDuration must be max ve over every sink');
        }
        const allCritical = snapshot.activities
          .filter((row) => row.slack !== null && Math.abs(row.slack) <= 1e-9)
          .map((row) => row.edgeId);
        if (snapshot.criticalEdgeIds.length !== allCritical.length || snapshot.criticalEdgeIds.some((id) => !allCritical.includes(id))) {
          add(['criticalEdgeIds'], 'done must list every zero-slack activity');
        }
        if (n > 0 && snapshot.criticalPaths.length === 0) add(['criticalPaths'], 'a non-empty acyclic network needs at least one critical path');
        snapshot.criticalPaths.forEach((path, index) => {
          if (!path.length) {
            add(['criticalPaths', index], 'a critical path cannot be empty');
            return;
          }
          if (!sources.has(path[0] ?? '')) add(['criticalPaths', index], 'a critical path must start at a source');
          if (!sinks.has(path[path.length - 1] ?? '')) add(['criticalPaths', index], 'a critical path must end at a sink');
          const pathNodes = new Set<string>();
          path.forEach((id) => {
            if (!ids.has(id)) add(['criticalPaths', index], 'critical path names an unknown node');
            if (pathNodes.has(id)) add(['criticalPaths', index], 'a DAG critical path cannot repeat a node');
            pathNodes.add(id);
          });
          let total = 0;
          for (let i = 0; i + 1 < path.length; i += 1) {
            const edge = snapshot.edges.find((candidate) => candidate.fromId === path[i] && candidate.toId === path[i + 1]);
            if (!edge) {
              add(['criticalPaths', index], `critical path has no activity ${path[i]}→${path[i + 1]}`);
            } else {
              if (!criticalIds.has(edge.id)) add(['criticalPaths', index], 'every activity on a critical path must be critical');
              total += edge.duration;
            }
          }
          if (snapshot.projectDuration !== null && Math.abs(total - snapshot.projectDuration) > 1e-9) {
            add(['criticalPaths', index], 'critical path duration must equal the project duration');
          }
        });
      }
    }
  });
export type CriticalPathSnapshot = z.infer<typeof criticalPathSnapshotSchema>;



/* ------------------------------------------------------------------ *
 * G4: undirected connected components and Kosaraju SCC
 * ------------------------------------------------------------------ */

export const CONNECTED_COMPONENT_OPERATIONS = [
  'init', 'start-component', 'pop', 'visit', 'inspect-edge', 'discover', 'push', 'skip', 'complete-component', 'done',
] as const;
export type ConnectedComponentOperation = (typeof CONNECTED_COMPONENT_OPERATIONS)[number];

export const KOSARAJU_OPERATIONS = [
  'init', 'start-first', 'inspect-edge', 'skip', 'push', 'finish', 'reverse', 'start-second', 'assign', 'complete-component', 'done',
] as const;
export type KosarajuOperation = (typeof KOSARAJU_OPERATIONS)[number];

const componentGroupSchema = z.object({
  id: z.number().int().positive().max(GRAPH_LIMITS.MAX_NODES),
  nodeIds: z.array(z.string().min(1).max(LIMITS.MAX_NAME_CHARS)).min(1).max(GRAPH_LIMITS.MAX_NODES),
  complete: z.boolean(),
});

type ComponentGroup = z.infer<typeof componentGroupSchema>;

function validateComponentGraph(
  snapshot: {
    nodes: Array<{ id: string }>;
    edges: Array<{ id: string; fromId: string; toId: string }>;
    directed: boolean;
  },
  add: (path: Array<string | number>, message: string) => void,
): { ids: Set<string>; edgeById: Map<string, GraphEdge> } {
  const ids = new Set<string>();
  snapshot.nodes.forEach((node, index) => {
    if (ids.has(node.id)) add(['nodes', index, 'id'], `duplicate graph node id "${node.id}"`);
    ids.add(node.id);
  });
  const edgeIds = new Set<string>();
  const pairs = new Set<string>();
  const edgeById = new Map<string, GraphEdge>();
  snapshot.edges.forEach((edge, index) => {
    if (edgeIds.has(edge.id)) add(['edges', index, 'id'], `duplicate graph edge id "${edge.id}"`);
    edgeIds.add(edge.id);
    edgeById.set(edge.id, edge as GraphEdge);
    if (!ids.has(edge.fromId)) add(['edges', index, 'fromId'], `edge "${edge.id}" starts at unknown node "${edge.fromId}"`);
    if (!ids.has(edge.toId)) add(['edges', index, 'toId'], `edge "${edge.id}" ends at unknown node "${edge.toId}"`);
    if (edge.fromId === edge.toId) add(['edges', index], 'self-loops are not supported in this teaching graph');
    if (ids.has(edge.fromId) && ids.has(edge.toId) && edge.fromId !== edge.toId) {
      const pair = snapshot.directed
        ? `${edge.fromId}\u0000${edge.toId}`
        : [edge.fromId, edge.toId].sort().join('\u0000');
      if (pairs.has(pair)) {
        add(['edges', index], snapshot.directed
          ? `duplicate directed edge "${edge.fromId}"→"${edge.toId}"`
          : `duplicate undirected edge "${edge.fromId}"–"${edge.toId}"`);
      }
      pairs.add(pair);
    }
  });
  return { ids, edgeById };
}

function validateComponentGroups(
  groups: ComponentGroup[],
  ids: Set<string>,
  nodeCount: number,
  add: (path: Array<string | number>, message: string) => void,
): { owner: Map<string, number>; groupsById: Map<number, ComponentGroup> } {
  const owner = new Map<string, number>();
  const groupsById = new Map<number, ComponentGroup>();
  groups.forEach((group, index) => {
    if (group.id !== index + 1) add(['components', index, 'id'], 'component ids must be consecutive and start at 1');
    if (groupsById.has(group.id)) add(['components', index, 'id'], `duplicate component id ${group.id}`);
    groupsById.set(group.id, group);
    group.nodeIds.forEach((nodeId) => {
      if (!ids.has(nodeId)) add(['components', index, 'nodeIds'], `component ${group.id} names unknown node "${nodeId}"`);
      if (owner.has(nodeId)) add(['components', index, 'nodeIds'], `node "${nodeId}" belongs to more than one component`);
      owner.set(nodeId, group.id);
    });
  });
  if (owner.size > nodeCount) add(['components'], 'component membership exceeds the node count');
  return { owner, groupsById };
}

export const connectedComponentsSnapshotSchema = z
  .object({
    kind: z.literal('connected-components'),
    algorithm: z.literal('components'),
    operation: z.enum(CONNECTED_COMPONENT_OPERATIONS),
    nodes: z.array(graphNodeSchema).max(GRAPH_LIMITS.MAX_NODES),
    edges: z.array(graphEdgeSchema).max(GRAPH_LIMITS.MAX_EDGES),
    directed: z.literal(false),
    startNodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    currentNodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    currentEdgeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    neighborNodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    discoveredIds: z.array(z.string().min(1).max(LIMITS.MAX_NAME_CHARS)).max(GRAPH_LIMITS.MAX_NODES),
    visitedIds: z.array(z.string().min(1).max(LIMITS.MAX_NAME_CHARS)).max(GRAPH_LIMITS.MAX_NODES),
    frontierKind: z.literal('stack'),
    frontierItems: z.array(graphFrontierItemSchema).max(GRAPH_LIMITS.MAX_NODES),
    frontierAdded: graphFrontierItemSchema.nullable(),
    frontierRemoved: graphFrontierItemSchema.nullable(),
    currentComponentId: z.number().int().positive().max(GRAPH_LIMITS.MAX_NODES).nullable(),
    componentCount: z.number().int().nonnegative().max(GRAPH_LIMITS.MAX_NODES),
    components: z.array(componentGroupSchema).max(GRAPH_LIMITS.MAX_NODES),
  })
  .superRefine((snapshot, ctx) => {
    const add = (path: Array<string | number>, message: string) => {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
    };
    const { ids, edgeById } = validateComponentGraph(snapshot, add);
    const n = snapshot.nodes.length;
    const discovered = new Set<string>();
    snapshot.discoveredIds.forEach((id, index) => {
      if (!ids.has(id)) add(['discoveredIds', index], 'discovered node is unknown');
      if (discovered.has(id)) add(['discoveredIds', index], 'discovered node is repeated');
      discovered.add(id);
    });
    const visited = new Set<string>();
    snapshot.visitedIds.forEach((id, index) => {
      if (!ids.has(id)) add(['visitedIds', index], 'visited node is unknown');
      if (visited.has(id)) add(['visitedIds', index], 'visited node is repeated');
      if (!discovered.has(id)) add(['visitedIds', index], 'a visited node must be discovered');
      visited.add(id);
    });
    const { owner, groupsById } = validateComponentGroups(snapshot.components, ids, n, add);
    if (snapshot.componentCount !== snapshot.components.length) {
      add(['componentCount'], 'componentCount must equal the number of component groups');
    }
    if (snapshot.currentComponentId !== null) {
      if (!groupsById.has(snapshot.currentComponentId)) add(['currentComponentId'], 'current component does not exist');
      if (snapshot.startNodeId === null) add(['startNodeId'], 'an active component needs a start node');
      else if (owner.get(snapshot.startNodeId) !== snapshot.currentComponentId) {
        add(['startNodeId'], 'start node must belong to the current component');
      }
    }
    if (snapshot.currentNodeId !== null && !ids.has(snapshot.currentNodeId)) {
      add(['currentNodeId'], 'currentNodeId must name a real node');
    }
    const currentEdge = snapshot.currentEdgeId ? edgeById.get(snapshot.currentEdgeId) : undefined;
    const edgeOps: ConnectedComponentOperation[] = ['inspect-edge', 'discover', 'push', 'skip'];
    if (edgeOps.includes(snapshot.operation)) {
      if (!currentEdge) add(['currentEdgeId'], `${snapshot.operation} must name a real edge`);
    } else if (snapshot.currentEdgeId) {
      add(['currentEdgeId'], `${snapshot.operation} must not carry a current edge`);
    }
    if (snapshot.neighborNodeId !== null) {
      if (!ids.has(snapshot.neighborNodeId)) add(['neighborNodeId'], 'neighborNodeId must name a real node');
      if (currentEdge && snapshot.neighborNodeId !== currentEdge.fromId && snapshot.neighborNodeId !== currentEdge.toId) {
        add(['neighborNodeId'], 'neighbor must be an endpoint of the current edge');
      }
    }
    const stackNodes = new Set<string>();
    snapshot.frontierItems.forEach((item, index) => {
      if (!ids.has(item.nodeId)) add(['frontierItems', index, 'nodeId'], 'stack entry names an unknown node');
      if (stackNodes.has(item.nodeId)) add(['frontierItems', index, 'nodeId'], 'stack repeats a node');
      stackNodes.add(item.nodeId);
    });
    if (snapshot.frontierAdded && !stackNodes.has(snapshot.frontierAdded.nodeId)) {
      add(['frontierAdded'], 'the added entry must be in the stack');
    }
    if (snapshot.frontierRemoved && stackNodes.has(snapshot.frontierRemoved.nodeId)) {
      add(['frontierRemoved'], 'the removed entry must no longer be in the stack');
    }
    if (snapshot.operation === 'start-component') {
      if (snapshot.currentComponentId === null) add(['currentComponentId'], 'start-component needs a component id');
      if (snapshot.startNodeId === null) add(['startNodeId'], 'start-component needs a root');
      if (!snapshot.frontierAdded) add(['frontierAdded'], 'start-component pushes the root');
    }
    if (snapshot.operation === 'push' && !snapshot.frontierAdded) {
      add(['frontierAdded'], 'push must report the new stack entry');
    }
    if (snapshot.operation === 'pop' && !snapshot.frontierRemoved) {
      add(['frontierRemoved'], 'pop must report the removed stack entry');
    }
    if (snapshot.operation === 'complete-component') {
      if (snapshot.currentComponentId === null) add(['currentComponentId'], 'complete-component needs a component');
      const group = snapshot.currentComponentId ? groupsById.get(snapshot.currentComponentId) : undefined;
      if (group && !group.complete) add(['components', 'complete'], 'complete-component must mark the group complete');
    }
    if (snapshot.operation === 'init' || snapshot.operation === 'done') {
      if (snapshot.currentComponentId !== null) add(['currentComponentId'], `${snapshot.operation} has no active component`);
      if (snapshot.startNodeId !== null) add(['startNodeId'], `${snapshot.operation} has no current root`);
      if (snapshot.currentNodeId !== null) add(['currentNodeId'], `${snapshot.operation} has no current node`);
      if (snapshot.currentEdgeId !== null) add(['currentEdgeId'], `${snapshot.operation} has no current edge`);
      if (snapshot.frontierItems.length) add(['frontierItems'], `${snapshot.operation} must have an empty stack`);
    }
    if (snapshot.operation === 'init') {
      if (snapshot.discoveredIds.length || snapshot.visitedIds.length || snapshot.components.length) {
        add(['operation'], 'init must start with no discovered nodes or components');
      }
    }
    if (snapshot.operation === 'done') {
      if (snapshot.visitedIds.length !== n) add(['visitedIds'], 'done must have visited every node');
      if (owner.size !== n) add(['components'], 'done must assign every node to a component');
      if (snapshot.components.some((group) => !group.complete)) add(['components'], 'done groups must all be complete');
    }
    if (n === 0 && snapshot.operation !== 'init' && snapshot.operation !== 'done') {
      add(['operation'], 'an empty graph may only emit init or done');
    }
  });
export type ConnectedComponentsSnapshot = z.infer<typeof connectedComponentsSnapshotSchema>;

export const kosarajuSnapshotSchema = z
  .object({
    kind: z.literal('kosaraju'),
    algorithm: z.literal('kosaraju'),
    operation: z.enum(KOSARAJU_OPERATIONS),
    nodes: z.array(graphNodeSchema).max(GRAPH_LIMITS.MAX_NODES),
    edges: z.array(graphEdgeSchema).max(GRAPH_LIMITS.MAX_EDGES),
    directed: z.literal(true),
    startNodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    currentNodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    currentEdgeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    neighborNodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
    discoveredIds: z.array(z.string().min(1).max(LIMITS.MAX_NAME_CHARS)).max(GRAPH_LIMITS.MAX_NODES),
    visitedIds: z.array(z.string().min(1).max(LIMITS.MAX_NAME_CHARS)).max(GRAPH_LIMITS.MAX_NODES),
    frontierKind: z.literal('stack'),
    frontierItems: z.array(graphFrontierItemSchema).max(GRAPH_LIMITS.MAX_NODES),
    frontierAdded: graphFrontierItemSchema.nullable(),
    frontierRemoved: graphFrontierItemSchema.nullable(),
    phase: z.enum(['first-pass', 'reverse', 'second-pass', 'done']),
    reversed: z.boolean(),
    finishOrder: z.array(z.string().min(1).max(LIMITS.MAX_NAME_CHARS)).max(GRAPH_LIMITS.MAX_NODES),
    secondPassOrder: z.array(z.string().min(1).max(LIMITS.MAX_NAME_CHARS)).max(GRAPH_LIMITS.MAX_NODES),
    secondPassIndex: z.number().int().nonnegative().max(GRAPH_LIMITS.MAX_NODES - 1).nullable(),
    currentComponentId: z.number().int().positive().max(GRAPH_LIMITS.MAX_NODES).nullable(),
    componentCount: z.number().int().nonnegative().max(GRAPH_LIMITS.MAX_NODES),
    components: z.array(componentGroupSchema).max(GRAPH_LIMITS.MAX_NODES),
  })
  .superRefine((snapshot, ctx) => {
    const add = (path: Array<string | number>, message: string) => {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
    };
    const { ids, edgeById } = validateComponentGraph(snapshot, add);
    const n = snapshot.nodes.length;
    const discovered = new Set<string>();
    snapshot.discoveredIds.forEach((id, index) => {
      if (!ids.has(id)) add(['discoveredIds', index], 'discovered node is unknown');
      if (discovered.has(id)) add(['discoveredIds', index], 'discovered node is repeated');
      discovered.add(id);
    });
    const visited = new Set<string>();
    snapshot.visitedIds.forEach((id, index) => {
      if (!ids.has(id)) add(['visitedIds', index], 'visited node is unknown');
      if (visited.has(id)) add(['visitedIds', index], 'visited node is repeated');
      if (!discovered.has(id)) add(['visitedIds', index], 'a visited node must be discovered');
      visited.add(id);
    });
    const { owner, groupsById } = validateComponentGroups(snapshot.components, ids, n, add);
    if (snapshot.componentCount !== snapshot.components.length) {
      add(['componentCount'], 'componentCount must equal the number of component groups');
    }
    const finish = new Set<string>();
    snapshot.finishOrder.forEach((id, index) => {
      if (!ids.has(id)) add(['finishOrder', index], 'finish order names an unknown node');
      if (finish.has(id)) add(['finishOrder', index], 'finish order repeats a node');
      finish.add(id);
    });
    if (snapshot.secondPassOrder.length) {
      if (snapshot.finishOrder.length !== n) add(['finishOrder'], 'a reverse pass needs every node finished');
      const expected = [...snapshot.finishOrder].reverse();
      if (snapshot.secondPassOrder.some((id, index) => expected[index] !== id)) {
        add(['secondPassOrder'], 'second pass order must be the reverse of the finish order');
      }
    }
    const stackNodes = new Set<string>();
    snapshot.frontierItems.forEach((item, index) => {
      if (!ids.has(item.nodeId)) add(['frontierItems', index, 'nodeId'], 'stack entry names an unknown node');
      if (stackNodes.has(item.nodeId)) add(['frontierItems', index, 'nodeId'], 'stack repeats a node');
      stackNodes.add(item.nodeId);
    });
    if (snapshot.frontierAdded && !stackNodes.has(snapshot.frontierAdded.nodeId)) {
      add(['frontierAdded'], 'the added entry must be in the stack');
    }
    if (snapshot.frontierRemoved && stackNodes.has(snapshot.frontierRemoved.nodeId)) {
      add(['frontierRemoved'], 'the removed entry must no longer be in the stack');
    }
    if (snapshot.currentNodeId !== null && !ids.has(snapshot.currentNodeId)) {
      add(['currentNodeId'], 'currentNodeId must name a real node');
    }
    const currentEdge = snapshot.currentEdgeId ? edgeById.get(snapshot.currentEdgeId) : undefined;
    const edgeOps: KosarajuOperation[] = ['inspect-edge', 'skip', 'push'];
    if (edgeOps.includes(snapshot.operation)) {
      if (!currentEdge) add(['currentEdgeId'], `${snapshot.operation} must name a real edge`);
    } else if (snapshot.currentEdgeId) {
      add(['currentEdgeId'], `${snapshot.operation} must not carry a current edge`);
    }
    if (snapshot.neighborNodeId !== null && !ids.has(snapshot.neighborNodeId)) {
      add(['neighborNodeId'], 'neighborNodeId must name a real node');
    }
    if (snapshot.startNodeId !== null && !ids.has(snapshot.startNodeId)) {
      add(['startNodeId'], 'startNodeId must name a real node');
    }
    if (snapshot.currentComponentId !== null && !groupsById.has(snapshot.currentComponentId)) {
      add(['currentComponentId'], 'current component does not exist');
    }
    if (snapshot.secondPassIndex !== null && snapshot.secondPassIndex >= snapshot.secondPassOrder.length) {
      add(['secondPassIndex'], 'secondPassIndex is outside the second pass order');
    }
    const firstOps: KosarajuOperation[] = ['init', 'start-first', 'inspect-edge', 'skip', 'push', 'finish'];
    if (firstOps.includes(snapshot.operation) && snapshot.phase === 'first-pass') {
      if (snapshot.phase !== 'first-pass') add(['phase'], `${snapshot.operation} belongs to the first pass`);
      if (snapshot.reversed) add(['reversed'], 'the graph is not reversed during the first pass');
      if (snapshot.secondPassOrder.length) add(['secondPassOrder'], 'second pass order must be empty during the first pass');
      if (snapshot.components.length) add(['components'], 'no component exists during the first pass');
      if (snapshot.currentComponentId !== null) add(['currentComponentId'], 'first pass has no SCC id');
      if (snapshot.secondPassIndex !== null) add(['secondPassIndex'], 'first pass has no second pass index');
    }
    if (snapshot.operation === 'reverse') {
      if (snapshot.phase !== 'reverse' || !snapshot.reversed) add(['phase'], 'reverse frame must set phase=reverse and reversed=true');
      if (snapshot.finishOrder.length !== n) add(['finishOrder'], 'reverse needs every node finished');
      if (snapshot.discoveredIds.length || snapshot.visitedIds.length) add(['reversed'], 'reverse resets the second-pass sets');
      if (snapshot.frontierItems.length) add(['frontierItems'], 'reverse has an empty stack');
      if (snapshot.components.length) add(['components'], 'reverse has no SCCs yet');
      if (snapshot.currentComponentId !== null) add(['currentComponentId'], 'reverse has no current SCC');
    }
    if (snapshot.phase === 'second-pass' || snapshot.operation === 'start-second' || snapshot.operation === 'assign' || snapshot.operation === 'complete-component') {
      if (snapshot.phase !== 'second-pass') add(['phase'], 'second pass operations need phase=second-pass');
      if (!snapshot.reversed) add(['reversed'], 'second pass must use the reversed graph');
      if (snapshot.secondPassOrder.length !== n) add(['secondPassOrder'], 'second pass needs the full reversed order');
    }
    if (snapshot.operation === 'start-first') {
      if (snapshot.phase !== 'first-pass' || snapshot.startNodeId === null) add(['startNodeId'], 'start-first needs a real root');
      if (!snapshot.frontierAdded) add(['frontierAdded'], 'start-first pushes the root');
    }
    if (snapshot.operation === 'start-second') {
      if (snapshot.startNodeId === null) add(['startNodeId'], 'start-second needs a real root');
      if (snapshot.currentComponentId === null) add(['currentComponentId'], 'start-second creates an SCC');
      if (!snapshot.frontierAdded) add(['frontierAdded'], 'start-second pushes the root');
      if (snapshot.secondPassIndex === null) add(['secondPassIndex'], 'start-second needs its index in the reversed order');
    }
    if (snapshot.operation === 'push' && !snapshot.frontierAdded) {
      add(['frontierAdded'], 'push must report the new stack entry');
    }
    if ((snapshot.operation === 'finish' || snapshot.operation === 'assign') && !snapshot.frontierRemoved) {
      add(['frontierRemoved'], `${snapshot.operation} must report the removed stack entry`);
    }
    if (snapshot.operation === 'complete-component') {
      if (snapshot.currentComponentId === null) add(['currentComponentId'], 'complete-component needs an SCC');
      const group = snapshot.currentComponentId ? groupsById.get(snapshot.currentComponentId) : undefined;
      if (group && !group.complete) add(['components', 'complete'], 'complete-component must mark the SCC complete');
    }
    if (snapshot.operation === 'init') {
      if (snapshot.phase !== 'first-pass' || snapshot.reversed) add(['phase'], 'init belongs to the unreversed first pass');
      if (snapshot.discoveredIds.length || snapshot.visitedIds.length || snapshot.finishOrder.length || snapshot.secondPassOrder.length || snapshot.components.length) {
        add(['operation'], 'init must start with empty state');
      }
      if (snapshot.currentComponentId !== null || snapshot.startNodeId !== null) {
        add(['operation'], 'init has no current SCC or root');
      }
    }
    if (snapshot.operation === 'done') {
      if (snapshot.phase !== 'done') add(['phase'], 'done requires phase=done');
      if (snapshot.startNodeId !== null || snapshot.currentNodeId !== null || snapshot.currentEdgeId !== null) {
        add(['operation'], 'done has no current node or edge');
      }
      if (snapshot.frontierItems.length) add(['frontierItems'], 'done has an empty stack');
      if (snapshot.finishOrder.length !== n || snapshot.secondPassOrder.length !== n) {
        add(['finishOrder'], 'done needs both complete node orders');
      }
      if (owner.size !== n) add(['components'], 'done must assign every node to an SCC');
      if (snapshot.components.some((group) => !group.complete)) add(['components'], 'done SCCs must all be complete');
      if (snapshot.currentComponentId !== null) add(['currentComponentId'], 'done has no current SCC');
      if (snapshot.secondPassIndex !== null) add(['secondPassIndex'], 'done has no second pass index');
    }
    if (n === 0 && snapshot.operation !== 'init' && snapshot.operation !== 'done') {
      add(['operation'], 'an empty graph may only emit init or done');
    }
  });
export type KosarajuSnapshot = z.infer<typeof kosarajuSnapshotSchema>;

/**
 * T3: max-heap snapshots.
 *
 * The tree is *never* the owner of element identity. Every element carries a
 * stable id, and its `slot` is its current index in the real Python array.
 * A swap moves the id and value to another slot; it does not reshape the
 * complete binary tree. The array suffix at `sortedFrom` is already sorted and
 * is excluded from the active heap `[0, heapSize)`.
 */
export const MAX_HEAP_LIMITS = {
  MAX_ELEMENTS: 24,
} as const;

export const MAX_HEAP_COMMANDS = ['build', 'push', 'extract', 'sort'] as const;
export type MaxHeapCommand = (typeof MAX_HEAP_COMMANDS)[number];

export const MAX_HEAP_OPERATIONS = [
  'init',
  'build-start',
  'heapify-node',
  'compare-parent-child',
  'compare-children',
  'swap',
  'build-done',
  'push-append',
  'extract-select',
  'replace-root',
  'sort-select',
  'swap-to-end',
  'done',
] as const;
export type MaxHeapOperation = (typeof MAX_HEAP_OPERATIONS)[number];

export const MAX_HEAP_RESULTS = ['built', 'pushed', 'extracted', 'sorted', 'empty'] as const;
export type MaxHeapResult = (typeof MAX_HEAP_RESULTS)[number];

const MAX_HEAP_ID = z.string().min(1).max(LIMITS.MAX_NAME_CHARS);

export const maxHeapElementSchema = z.object({
  id: MAX_HEAP_ID,
  value: z.number().finite(),
  /** Current array index. Elements are stored in slot order. */
  slot: z.number().int().nonnegative().max(MAX_HEAP_LIMITS.MAX_ELEMENTS - 1),
});
export type MaxHeapElement = z.infer<typeof maxHeapElementSchema>;

export const maxHeapParentCompareSchema = z.object({
  parentId: MAX_HEAP_ID,
  childId: MAX_HEAP_ID,
});
export type MaxHeapParentCompare = z.infer<typeof maxHeapParentCompareSchema>;

export const maxHeapChildCompareSchema = z.object({
  leftId: MAX_HEAP_ID,
  rightId: MAX_HEAP_ID,
});
export type MaxHeapChildCompare = z.infer<typeof maxHeapChildCompareSchema>;

export const maxHeapSwapSchema = z.object({
  firstId: MAX_HEAP_ID,
  secondId: MAX_HEAP_ID,
});
export type MaxHeapSwap = z.infer<typeof maxHeapSwapSchema>;

export const maxHeapReplacementSchema = z.object({
  id: MAX_HEAP_ID,
  /** The old tail index before it was popped and written into slot 0. */
  fromSlot: z.number().int().nonnegative().max(MAX_HEAP_LIMITS.MAX_ELEMENTS),
  toSlot: z.number().int().nonnegative().max(MAX_HEAP_LIMITS.MAX_ELEMENTS - 1),
});
export type MaxHeapReplacement = z.infer<typeof maxHeapReplacementSchema>;

const MAX_HEAP_OPERATIONS_BY_COMMAND: Record<MaxHeapCommand, readonly MaxHeapOperation[]> = {
  build: [
    'init',
    'build-start',
    'heapify-node',
    'compare-parent-child',
    'compare-children',
    'swap',
    'done',
  ],
  push: ['init', 'push-append', 'compare-parent-child', 'swap', 'done'],
  extract: [
    'init',
    'extract-select',
    'replace-root',
    'compare-parent-child',
    'compare-children',
    'swap',
    'done',
  ],
  sort: [
    'init',
    'build-start',
    'heapify-node',
    'compare-parent-child',
    'compare-children',
    'swap',
    'build-done',
    'sort-select',
    'swap-to-end',
    'done',
  ],
};

export const maxHeapSnapshotSchema = z
  .object({
    kind: z.literal('max-heap'),
    preset: z.string().max(LIMITS.MAX_NAME_CHARS).nullable(),
    command: z.enum(MAX_HEAP_COMMANDS),
    operation: z.enum(MAX_HEAP_OPERATIONS),
    totalSize: z.number().int().nonnegative().max(MAX_HEAP_LIMITS.MAX_ELEMENTS),
    heapSize: z.number().int().nonnegative().max(MAX_HEAP_LIMITS.MAX_ELEMENTS),
    elements: z.array(maxHeapElementSchema).max(MAX_HEAP_LIMITS.MAX_ELEMENTS),
    rootId: MAX_HEAP_ID.nullable(),
    activeId: MAX_HEAP_ID.nullable(),
    pathIds: z.array(MAX_HEAP_ID).max(MAX_HEAP_LIMITS.MAX_ELEMENTS),
    compareParent: maxHeapParentCompareSchema.nullable(),
    compareChildren: maxHeapChildCompareSchema.nullable(),
    swap: maxHeapSwapSchema.nullable(),
    addedId: MAX_HEAP_ID.nullable(),
    removed: maxHeapElementSchema.nullable(),
    replacement: maxHeapReplacementSchema.nullable(),
    /** First index of the finished sorted suffix; always null or equal to heapSize. */
    sortedFrom: z.number().int().nonnegative().max(MAX_HEAP_LIMITS.MAX_ELEMENTS).nullable(),
    result: z.enum(MAX_HEAP_RESULTS).nullable(),
  })
  .superRefine((snapshot, ctx) => {
    const add = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
    const byId = new Map<string, MaxHeapElement>();
    snapshot.elements.forEach((element, index) => {
      if (element.slot !== index) {
        add(['elements', index, 'slot'], 'elements must be stored in contiguous slot order');
      }
      if (byId.has(element.id)) {
        add(['elements', index, 'id'], `duplicate max-heap element id "${element.id}"`);
      }
      byId.set(element.id, element);
    });

    if (snapshot.totalSize !== snapshot.elements.length) {
      add(['totalSize'], 'totalSize must equal the number of array elements');
    }
    if (snapshot.heapSize > snapshot.totalSize) {
      add(['heapSize'], 'heapSize cannot exceed totalSize');
    }
    if (!MAX_HEAP_OPERATIONS_BY_COMMAND[snapshot.command].includes(snapshot.operation)) {
      add(['operation'], `operation "${snapshot.operation}" is not valid for command "${snapshot.command}"`);
    }
    if (snapshot.sortedFrom !== null && snapshot.sortedFrom !== snapshot.heapSize) {
      add(['sortedFrom'], 'the sorted suffix must start exactly where the active heap ends');
    }

    const expectedRoot = snapshot.heapSize > 0 ? snapshot.elements[0]?.id ?? null : null;
    if (snapshot.rootId !== expectedRoot) {
      add(['rootId'], 'rootId must be the element in slot 0 when the heap is non-empty');
    }

    if (snapshot.activeId !== null) {
      const active = byId.get(snapshot.activeId);
      if (!active) add(['activeId'], 'activeId must refer to an array element');
      else if (active.slot >= snapshot.heapSize) add(['activeId'], 'activeId must lie inside the active heap');
    }

    const path = snapshot.pathIds.map((id) => byId.get(id));
    if (path.some((element) => element === undefined)) {
      add(['pathIds'], 'pathIds must refer to real array elements');
    }
    if (snapshot.activeId === null) {
      if (snapshot.pathIds.length > 0) add(['pathIds'], 'a frame without activeId must have an empty path');
    } else if (path.length > 0) {
      if (snapshot.pathIds.at(-1) !== snapshot.activeId) add(['pathIds'], 'pathIds must end at activeId');
      if (snapshot.pathIds[0] !== snapshot.rootId) add(['pathIds'], 'pathIds must start at the heap root');
      for (let index = 1; index < path.length; index += 1) {
        const parent = path[index - 1]!;
        const child = path[index]!;
        if (child.slot > 0 && Math.floor((child.slot - 1) / 2) !== parent.slot) {
          add(['pathIds', index], 'pathIds must follow real parent-child slots');
        }
      }
    } else if (snapshot.activeId !== null && snapshot.heapSize > 0) {
      add(['pathIds'], 'an active element in a non-empty heap needs a root-to-active path');
    }

    if (snapshot.compareParent !== null) {
      const parent = byId.get(snapshot.compareParent.parentId);
      const child = byId.get(snapshot.compareParent.childId);
      if (!parent || !child) add(['compareParent'], 'both compared elements must exist');
      else if (parent.slot >= snapshot.heapSize || child.slot >= snapshot.heapSize) {
        add(['compareParent'], 'parent/child comparison must stay inside the active heap');
      } else if (child.slot === 0 || Math.floor((child.slot - 1) / 2) !== parent.slot) {
        add(['compareParent'], 'compareParent must record a real parent-child pair');
      }
    }
    if (snapshot.compareChildren !== null) {
      const left = byId.get(snapshot.compareChildren.leftId);
      const right = byId.get(snapshot.compareChildren.rightId);
      if (!left || !right) add(['compareChildren'], 'both compared children must exist');
      else if (left.slot >= snapshot.heapSize || right.slot >= snapshot.heapSize) {
        add(['compareChildren'], 'sibling comparison must stay inside the active heap');
      } else if (right.slot !== left.slot + 1 || left.slot % 2 !== 1) {
        add(['compareChildren'], 'compareChildren must record a real left/right pair');
      }
    }
    if (snapshot.swap !== null) {
      const first = byId.get(snapshot.swap.firstId);
      const second = byId.get(snapshot.swap.secondId);
      if (!first || !second || first.id === second.id) add(['swap'], 'swap must name two distinct real elements');
      if (snapshot.operation === 'swap') {
        if (first && second && (first.slot >= snapshot.heapSize || second.slot >= snapshot.heapSize)) {
          add(['swap'], 'a normal heap swap must stay inside the active heap');
        }
      } else if (snapshot.operation === 'swap-to-end') {
        if (first?.slot !== 0 || second?.slot !== snapshot.heapSize) {
          add(['swap'], 'swap-to-end must move the root into the first sorted slot');
        }
      } else {
        add(['swap'], 'swap metadata is only valid on swap / swap-to-end frames');
      }
    }

    if (snapshot.operation === 'compare-parent-child') {
      if (snapshot.compareParent === null) add(['compareParent'], 'comparison frame needs parent/child metadata');
      if (snapshot.compareChildren !== null) add(['compareChildren'], 'a parent/child frame cannot also compare siblings');
      if (snapshot.swap !== null) add(['swap'], 'a comparison frame cannot record a completed swap');
    } else if (snapshot.compareParent !== null) {
      add(['compareParent'], 'parent/child metadata is only valid on compare-parent-child');
    }
    if (snapshot.operation === 'compare-children') {
      if (snapshot.compareChildren === null) add(['compareChildren'], 'sibling frame needs child metadata');
      if (snapshot.compareParent !== null) add(['compareParent'], 'a sibling frame cannot also compare a parent');
      if (snapshot.swap !== null) add(['swap'], 'a comparison frame cannot record a completed swap');
    } else if (snapshot.compareChildren !== null) {
      add(['compareChildren'], 'child metadata is only valid on compare-children');
    }
    if (snapshot.operation === 'swap' || snapshot.operation === 'swap-to-end') {
      if (snapshot.swap === null) add(['swap'], 'swap frame needs the two swapped element ids');
    } else if (snapshot.swap !== null) {
      add(['swap'], 'swap metadata is only valid on swap frames');
    }

    if (snapshot.addedId !== null) {
      const added = byId.get(snapshot.addedId);
      if (!added) add(['addedId'], 'addedId must refer to an array element');
      else if (added.slot !== snapshot.totalSize - 1) add(['addedId'], 'the pushed element must occupy the last slot');
      if (snapshot.operation !== 'push-append') add(['addedId'], 'addedId is only valid on push-append');
    }

    if (snapshot.removed !== null) {
      if (byId.has(snapshot.removed.id)) add(['removed'], 'a removed element cannot still be in the array');
      if (snapshot.command !== 'extract') add(['removed'], 'only extract may remove the heap root');
      if (snapshot.operation !== 'replace-root' && snapshot.operation !== 'done') {
        add(['removed'], 'removed metadata is only valid after the root has been replaced or at done');
      }
    }

    if (snapshot.replacement !== null) {
      if (snapshot.operation !== 'replace-root') {
        add(['replacement'], 'replacement metadata is only valid on replace-root');
      }
      if (snapshot.totalSize > 0) {
        if (snapshot.replacement.id !== snapshot.rootId || snapshot.replacement.toSlot !== 0) {
          add(['replacement'], 'the tail element must become the new root at slot 0');
        }
        if (snapshot.replacement.fromSlot !== snapshot.totalSize) {
          add(['replacement'], 'fromSlot must be the old tail index immediately after the pop');
        }
      } else {
        add(['replacement'], 'an empty heap has no replacement element');
      }
    } else if (snapshot.operation === 'replace-root' && snapshot.totalSize > 0) {
      add(['replacement'], 'replace-root needs the element that moved from the tail to slot 0');
    }

    if (snapshot.result !== null && snapshot.operation !== 'done') {
      add(['result'], 'result is only reported on the terminal done frame');
    }

    if (snapshot.operation === 'init') {
      if (snapshot.heapSize !== snapshot.totalSize) add(['heapSize'], 'init shows the whole array as the active heap');
      if (snapshot.activeId !== null || snapshot.pathIds.length > 0) add(['pathIds'], 'init has no active element');
      if (
        snapshot.compareParent !== null ||
        snapshot.compareChildren !== null ||
        snapshot.swap !== null ||
        snapshot.removed !== null ||
        snapshot.replacement !== null ||
        snapshot.addedId !== null
      ) {
        add(['operation'], 'init cannot carry mutation or comparison metadata');
      }
      if (snapshot.sortedFrom !== null) add(['sortedFrom'], 'init cannot start with a sorted suffix');
      if (snapshot.result !== null) add(['result'], 'init cannot report a final result');
    }
    if (snapshot.operation === 'build-start') {
      if (snapshot.heapSize !== snapshot.totalSize) add(['heapSize'], 'build starts with the whole array');
      if (snapshot.activeId !== null || snapshot.pathIds.length > 0) add(['pathIds'], 'build-start has no active node');
      if (snapshot.sortedFrom !== null) add(['sortedFrom'], 'building cannot start with a sorted suffix');
    }
    if (snapshot.operation === 'heapify-node') {
      if (snapshot.activeId === null) add(['activeId'], 'heapify-node must select the subtree root');
      if (snapshot.heapSize !== snapshot.totalSize) add(['heapSize'], 'heapify runs over the whole array');
    }
    if (snapshot.operation === 'push-append') {
      if (snapshot.command !== 'push') add(['command'], 'push-append belongs to the push command');
      if (snapshot.addedId === null) add(['addedId'], 'append frame must identify the new element');
      if (snapshot.activeId !== snapshot.addedId) add(['activeId'], 'append focuses the new tail element');
      if (snapshot.heapSize !== snapshot.totalSize) add(['heapSize'], 'before sift-up the new element is part of the heap');
    }
    if (snapshot.operation === 'extract-select') {
      if (snapshot.command !== 'extract') add(['command'], 'extract-select belongs to extract');
      if (snapshot.removed !== null) add(['removed'], 'the root is still present on extract-select');
      if (snapshot.heapSize !== snapshot.totalSize) add(['heapSize'], 'selecting the root happens before the pop');
      if (snapshot.heapSize > 0 && snapshot.activeId !== snapshot.rootId) {
        add(['activeId'], 'extract-select focuses the root');
      }
    }
    if (snapshot.operation === 'replace-root') {
      if (snapshot.command !== 'extract') add(['command'], 'replace-root belongs to extract');
      if (snapshot.removed === null) add(['removed'], 'replace-root must report the extracted maximum');
      if (snapshot.heapSize !== snapshot.totalSize) add(['heapSize'], 'the popped tail leaves heapSize = totalSize');
      if (snapshot.heapSize > 0 && snapshot.activeId !== snapshot.rootId) {
        add(['activeId'], 'replace-root focuses the moved tail element at slot 0');
      }
    }
    if (snapshot.operation === 'sort-select') {
      if (snapshot.command !== 'sort') add(['command'], 'sort-select belongs to heap sort');
      if (snapshot.heapSize === 0) add(['heapSize'], 'sort-select needs an active heap');
      if (snapshot.activeId !== snapshot.rootId) add(['activeId'], 'sort-select focuses the maximum root');
    }
    if (snapshot.operation === 'swap-to-end') {
      if (snapshot.command !== 'sort') add(['command'], 'swap-to-end belongs to heap sort');
      if (snapshot.heapSize === 0) add(['heapSize'], 'swap-to-end must leave a non-empty heap to repair');
      if (snapshot.sortedFrom !== snapshot.heapSize) add(['sortedFrom'], 'the swapped maximum starts the sorted suffix');
      if (snapshot.activeId !== snapshot.rootId) add(['activeId'], 'the tail element is now the root');
    }
    if (snapshot.operation === 'build-done') {
      if (snapshot.command !== 'sort') add(['command'], 'build-done marks the pre-sort heap');
      if (snapshot.heapSize !== snapshot.totalSize) add(['heapSize'], 'build-done still covers the whole array');
      if (snapshot.activeId !== null || snapshot.pathIds.length > 0) add(['pathIds'], 'build-done has no active node');
      if (snapshot.sortedFrom !== null) add(['sortedFrom'], 'build-done has no sorted suffix yet');
    }

    if (snapshot.operation !== 'done') {
      if (snapshot.result !== null) add(['result'], 'only done reports a result');
    } else {
      if (snapshot.result === null) add(['result'], 'done must report a final result');
      if (snapshot.activeId !== null || snapshot.pathIds.length > 0) add(['pathIds'], 'done has no active element');
      if (snapshot.compareParent !== null || snapshot.compareChildren !== null || snapshot.swap !== null) {
        add(['operation'], 'done cannot carry a pending comparison or swap');
      }
      if (snapshot.addedId !== null) add(['addedId'], 'done has no newly added element');
      if (snapshot.replacement !== null) add(['replacement'], 'done has no root replacement');
      if (snapshot.command === 'sort') {
        if (snapshot.result !== 'sorted') add(['result'], 'heap sort ends with result = sorted');
        if (snapshot.heapSize !== 0 || snapshot.sortedFrom !== 0) {
          add(['heapSize'], 'heap sort ends with every slot in the sorted suffix');
        }
        if (snapshot.removed !== null) add(['removed'], 'heap sort does not remove elements');
      } else {
        if (snapshot.sortedFrom !== null) add(['sortedFrom'], 'this command has no sorted suffix');
        if (snapshot.heapSize !== snapshot.totalSize) {
          add(['heapSize'], 'done must account for the whole remaining array');
        }
        if (snapshot.command === 'build' && snapshot.result !== 'built') {
          add(['result'], 'build ends with result = built');
        }
        if (snapshot.command === 'push' && snapshot.result !== 'pushed') {
          add(['result'], 'push ends with result = pushed');
        }
        if (snapshot.command === 'extract') {
          if (snapshot.totalSize === 0 && snapshot.removed === null) {
            if (snapshot.result !== 'empty') {
              add(['result'], 'extracting from an empty heap reports empty and removes nothing');
            }
          } else {
            if (snapshot.result !== 'extracted') add(['result'], 'a successful extract ends with result = extracted');
            if (snapshot.removed === null) add(['removed'], 'a successful extract must report the maximum removed');
          }
        }
      }
    }

    // The sorted suffix is by construction the final ascending array suffix.
    if (snapshot.sortedFrom !== null) {
      for (let slot = snapshot.sortedFrom + 1; slot < snapshot.totalSize; slot += 1) {
        if (snapshot.elements[slot - 1]!.value > snapshot.elements[slot]!.value) {
          add(['elements', slot], 'the sorted suffix must be non-decreasing');
          break;
        }
      }
    }

    const isHeapOrdered = () => {
      for (let parent = 0; parent < snapshot.heapSize; parent += 1) {
        for (const child of [2 * parent + 1, 2 * parent + 2]) {
          if (child < snapshot.heapSize && snapshot.elements[parent]!.value < snapshot.elements[child]!.value) {
            return false;
          }
        }
      }
      return true;
    };
    if (
      snapshot.operation === 'done' ||
      snapshot.operation === 'build-done'
    ) {
      if (snapshot.command === 'sort' && snapshot.operation === 'done') {
        for (let slot = 1; slot < snapshot.totalSize; slot += 1) {
          if (snapshot.elements[slot - 1]!.value > snapshot.elements[slot]!.value) {
            add(['elements', slot], 'heap sort done must be globally ascending');
            break;
          }
        }
      } else if (!isHeapOrdered()) {
        add(['elements'], 'the final active heap must satisfy parent >= child');
      }
    }
  });
export type MaxHeapSnapshot = z.infer<typeof maxHeapSnapshotSchema>;

/* ------------------------------------------------------------------------- *
 * T4: Huffman tree + Huffman coding.
 *
 * One schema covers the complete lecture: a real `heapq` forest is merged
 * bottom-up, then the resulting binary tree is walked to produce prefix codes.
 * The snapshot stores only facts the Python program actually observed:
 *
 *   nodes      every node ever created, with stable id, symbol, weight and the
 *              real left/right child references. Internal nodes never carry a
 *              symbol, leaves always do.
 *   queueIds   the real `heapq` internal array order after the operation. It is
 *              validated as a min-heap under `(weight, order)`, never as a
 *              pre-sorted list. `order` is the unique deterministic tie-break.
 *   pickedIds  the two nodes a merge step popped, in pop order.
 *   createdId  the internal parent created from those two nodes.
 *   pathIds    the root-to-active path during the encoding walk.
 *   prefix     the real bits accumulated on that path.
 *   codes      only the leaves already reached by the encoding walk.
 *   metrics    leaf count, total weight, WPL, actual encoded bits and the
 *              fixed-length comparison; checked against the tree itself.
 *
 * Equality matters: equal weights are ordered by `order`, so the official
 * example is reproducible even though Huffman codes are not unique.
 * ------------------------------------------------------------------------- */
export const HUFFMAN_LIMITS = {
  MAX_SYMBOLS: 16,
  MAX_NODES: 33,
  MAX_WEIGHT: 1_000_000_000_000,
  MAX_CODE_BITS: 16,
} as const;

export const huffmanOperationSchema = z.enum([
  'init',
  'merge-select',
  'merge-create',
  'merge-requeue',
  'build-done',
  'encode-start',
  'encode-left',
  'encode-right',
  'encode-leaf',
  'done',
]);
export type HuffmanOperation = z.infer<typeof huffmanOperationSchema>;

export const huffmanNodeSchema = z.object({
  id: z.string().min(1).max(64),
  symbol: z.string().min(1).max(8).nullable(),
  weight: z.number().int().positive().max(HUFFMAN_LIMITS.MAX_WEIGHT),
  order: z.number().int().nonnegative().max(HUFFMAN_LIMITS.MAX_NODES - 1),
  leftId: z.string().min(1).max(64).nullable(),
  rightId: z.string().min(1).max(64).nullable(),
});
export type HuffmanNode = z.infer<typeof huffmanNodeSchema>;

export const huffmanCodeRowSchema = z.object({
  symbol: z.string().min(1).max(8),
  nodeId: z.string().min(1).max(64),
  code: z.string().regex(/^[01]+$/).max(HUFFMAN_LIMITS.MAX_CODE_BITS),
  length: z.number().int().positive().max(HUFFMAN_LIMITS.MAX_CODE_BITS),
  weight: z.number().int().positive().max(HUFFMAN_LIMITS.MAX_WEIGHT),
  contribution: z.number().int().nonnegative().max(HUFFMAN_LIMITS.MAX_WEIGHT * HUFFMAN_LIMITS.MAX_CODE_BITS),
});
export type HuffmanCodeRow = z.infer<typeof huffmanCodeRowSchema>;

export const huffmanMetricsSchema = z.object({
  leafCount: z.number().int().nonnegative().max(HUFFMAN_LIMITS.MAX_SYMBOLS),
  totalWeight: z.number().int().nonnegative().max(HUFFMAN_LIMITS.MAX_WEIGHT * HUFFMAN_LIMITS.MAX_SYMBOLS),
  wpl: z.number().int().nonnegative().max(HUFFMAN_LIMITS.MAX_WEIGHT * HUFFMAN_LIMITS.MAX_SYMBOLS * HUFFMAN_LIMITS.MAX_CODE_BITS),
  totalBits: z.number().int().nonnegative().max(HUFFMAN_LIMITS.MAX_WEIGHT * HUFFMAN_LIMITS.MAX_SYMBOLS * HUFFMAN_LIMITS.MAX_CODE_BITS),
  fixedBitsPerChar: z.number().int().nonnegative().max(HUFFMAN_LIMITS.MAX_CODE_BITS),
  fixedBits: z.number().int().nonnegative().max(HUFFMAN_LIMITS.MAX_WEIGHT * HUFFMAN_LIMITS.MAX_SYMBOLS * HUFFMAN_LIMITS.MAX_CODE_BITS),
});
export type HuffmanMetrics = z.infer<typeof huffmanMetricsSchema>;

export const huffmanSnapshotSchema = z
  .object({
    kind: z.literal('huffman'),
    /** Input preset id, recorded by the real program (not used for drawing). */
    preset: z.string().min(1).max(32),
    operation: huffmanOperationSchema,
    nodes: z.array(huffmanNodeSchema).max(HUFFMAN_LIMITS.MAX_NODES),
    /** Real heap array of ids. A min-heap under (weight, order). */
    queueIds: z.array(z.string().min(1).max(64)).max(HUFFMAN_LIMITS.MAX_SYMBOLS),
    activeNodeId: z.string().min(1).max(64).nullable(),
    pathIds: z.array(z.string().min(1).max(64)).max(HUFFMAN_LIMITS.MAX_CODE_BITS + 1),
    prefix: z.string().regex(/^[01]*$/).max(HUFFMAN_LIMITS.MAX_CODE_BITS),
    pickedIds: z.array(z.string().min(1).max(64)).length(2).nullable(),
    createdId: z.string().min(1).max(64).nullable(),
    viaSide: z.enum(['left', 'right']).nullable(),
    codes: z.array(huffmanCodeRowSchema).max(HUFFMAN_LIMITS.MAX_SYMBOLS),
    metrics: huffmanMetricsSchema.nullable(),
    result: z.enum(['encoded', 'empty']).nullable(),
  })
  .superRefine((snapshot, ctx) => {
    const add = (path: Array<string | number>, message: string) => {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
    };
    const nodes = snapshot.nodes;
    const byId = new Map<string, HuffmanNode>();
    for (const node of nodes) {
      if (byId.has(node.id)) {
        add(['nodes'], `duplicate Huffman node id "${node.id}"`);
        return;
      }
      byId.set(node.id, node);
    }

    // Orders are creation indices: contiguous 0..n-1, unique, and a later
    // internal node is always newer than both children. This makes the
    // heap tie-break reproducible instead of relying on insertion accidents.
    const orders = nodes.map((node) => node.order).sort((a, b) => a - b);
    for (let index = 0; index < orders.length; index += 1) {
      if (orders[index] !== index) {
        add(['nodes'], 'node orders must be contiguous creation indices 0..n-1');
        break;
      }
    }

    const parentOf = new Map<string, string>();
    const leaves: HuffmanNode[] = [];
    let badChild = false;
    for (const node of nodes) {
      const hasLeft = node.leftId !== null;
      const hasRight = node.rightId !== null;
      if (hasLeft !== hasRight) {
        add(['nodes'], `node "${node.id}" must have either both children or neither`);
        badChild = true;
      }
      if (!hasLeft) {
        leaves.push(node);
        if (node.symbol === null) add(['nodes'], `leaf "${node.id}" must carry a symbol`);
      } else {
        if (node.symbol !== null) add(['nodes'], `internal node "${node.id}" must not carry a symbol`);
        const left = node.leftId ? byId.get(node.leftId) : undefined;
        const right = node.rightId ? byId.get(node.rightId) : undefined;
        if (!left || !right) {
          add(['nodes'], `node "${node.id}" points at a missing child`);
          badChild = true;
        } else {
          if (left.weight + right.weight !== node.weight) {
            add(['nodes'], `node "${node.id}" weight must equal its two children's sum`);
          }
          for (const child of [left, right]) {
            if (parentOf.has(child.id)) {
              add(['nodes'], `node "${child.id}" has more than one parent`);
            } else {
              parentOf.set(child.id, node.id);
            }
          }
        }
      }
    }
    if (badChild) return;

    const symbols = new Set<string>();
    for (const leaf of leaves) {
      if (leaf.symbol !== null) {
        if (symbols.has(leaf.symbol)) {
          add(['nodes'], `duplicate leaf symbol "${leaf.symbol}"`);
        }
        symbols.add(leaf.symbol);
      }
    }
    if (leaves.length > HUFFMAN_LIMITS.MAX_SYMBOLS) {
      add(['nodes'], 'too many leaves for the Huffman teaching demo');
    }

    const roots = nodes.filter((node) => !parentOf.has(node.id));
    // A forest is parentless roots; visit them to prove there are no cycles or
    // unreachable nodes and that every root is a real binary tree.
    const seen = new Set<string>();
    const visiting = new Set<string>();
    let cycle = false;
    const visit = (id: string) => {
      if (visiting.has(id)) {
        cycle = true;
        return;
      }
      if (seen.has(id)) return;
      const node = byId.get(id);
      if (!node) return;
      seen.add(id);
      visiting.add(id);
      if (node.leftId) visit(node.leftId);
      if (node.rightId) visit(node.rightId);
      visiting.delete(id);
    };
    roots.forEach((root) => visit(root.id));
    if (cycle) add(['nodes'], 'Huffman tree must not contain a cycle');
    if (seen.size !== nodes.length) add(['nodes'], 'every Huffman node must be reachable from a parentless root');

    const priority = (id: string): [number, number] => {
      const node = byId.get(id);
      return node ? [node.weight, node.order] : [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
    };
    const less = (a: string, b: string): boolean => {
      const pa = priority(a);
      const pb = priority(b);
      return pa[0] < pb[0] || (pa[0] === pb[0] && pa[1] < pb[1]);
    };
    const queue = snapshot.queueIds;
    if (new Set(queue).size !== queue.length) add(['queueIds'], 'queue ids must be unique');
    for (const id of queue) {
      if (!byId.has(id)) add(['queueIds'], `queue references missing node "${id}"`);
      if (parentOf.has(id)) add(['queueIds'], `queue node "${id}" must be a current forest root`);
    }
    // The queue is the real heapq array, so check heap order instead of
    // pretending it is a sorted list.
    for (let index = 1; index < queue.length; index += 1) {
      const parent = queue[Math.floor((index - 1) / 2)]!;
      if (!less(parent, queue[index]!)) {
        add(['queueIds'], 'queueIds must satisfy the min-heap order on (weight, order)');
        break;
      }
    }

    const picked = snapshot.pickedIds;
    if (picked) {
      if (picked[0] === picked[1]) add(['pickedIds'], 'the two picked nodes must be different');
      for (const id of picked) if (!byId.has(id)) add(['pickedIds'], `picked node "${id}" does not exist`);
    }
    const created = snapshot.createdId ? byId.get(snapshot.createdId) : undefined;
    if (snapshot.createdId && !created) add(['createdId'], `created node "${snapshot.createdId}" does not exist`);

    const expectedRoots = (operation: HuffmanOperation): string[] => {
      if (operation === 'init') return roots.map((node) => node.id);
      if (operation === 'merge-select') {
        return roots.filter((node) => !picked?.includes(node.id)).map((node) => node.id);
      }
      if (operation === 'merge-create') {
        return roots.filter((node) => node.id !== snapshot.createdId).map((node) => node.id);
      }
      if (operation === 'merge-requeue') return roots.map((node) => node.id);
      if (nodes.length === 0) return [];
      return roots.length === 1 ? [roots[0]!.id] : [];
    };
    const expected = expectedRoots(snapshot.operation);
    if (queue.length !== expected.length || queue.some((id) => !expected.includes(id))) {
      add(['queueIds'], `queueIds does not match the real forest state for operation "${snapshot.operation}"`);
    }

    const sortedRoots = [...roots].sort((a, b) => {
      return a.weight - b.weight || a.order - b.order;
    });

    if (snapshot.operation === 'merge-select') {
      if (!picked) add(['pickedIds'], 'merge-select must record the two popped nodes');
      else {
        if (sortedRoots[0]?.id !== picked[0]) add(['pickedIds'], 'the first popped node must be a minimum root');
        if (sortedRoots[1]?.id !== picked[1]) add(['pickedIds'], 'the second popped node must be the next minimum root');
      }
    }

    if (snapshot.operation === 'merge-create') {
      if (!picked) add(['pickedIds'], 'merge-create must remember the two popped nodes');
      if (!created) add(['createdId'], 'merge-create must create an internal parent');
      else {
        if (created.leftId !== picked?.[0] || created.rightId !== picked?.[1]) {
          add(['createdId'], 'the new parent must point at the two popped nodes as left/right');
        }
        if (created.symbol !== null) add(['createdId'], 'the new parent must be an internal node');
        if (created.order !== Math.max(...nodes.map((node) => node.order))) {
          add(['createdId'], 'the new parent must be the newest node');
        }
      }
      if (snapshot.viaSide !== null) add(['viaSide'], 'merge-create is not an encoding step');
      if (snapshot.codes.length > 0 || snapshot.metrics !== null) {
        add(['codes'], 'merge-create must not contain codes or metrics yet');
      }
    }

    if (snapshot.operation === 'merge-requeue') {
      if (!created) add(['createdId'], 'merge-requeue must keep the newly created parent');
      else {
        if (created.leftId === null || created.rightId === null) {
          add(['createdId'], 'a requeued parent must be a real internal node');
        }
        if (!queue.includes(created.id)) add(['queueIds'], 'the requeued parent must be present in the real heap');
      }
      if (picked) add(['pickedIds'], 'merge-requeue has no current pop pair');
    }

    if (snapshot.operation === 'init') {
      if (nodes.some((node) => node.leftId !== null)) add(['nodes'], 'init must only contain independent leaves');
      if (picked || created || snapshot.metrics || snapshot.codes.length) {
        add(['operation'], 'init must not contain merge, code or metric state');
      }
      if (snapshot.activeNodeId !== null || snapshot.pathIds.length > 0 || snapshot.prefix !== '') {
        add(['operation'], 'init is not an encoding step');
      }
      if (snapshot.result !== null) add(['result'], 'init has no final result');
    }

    if (snapshot.operation === 'build-done') {
      if (roots.length !== 1) add(['nodes'], 'build-done requires exactly one final root');
      if (queue.length !== 1) add(['queueIds'], 'build-done leaves exactly the final root in the heap');
      if (!snapshot.metrics) add(['metrics'], 'build-done must report WPL and bit metrics');
      if (snapshot.codes.length > 0) add(['codes'], 'build-done happens before encoding');
      if (picked || created) add(['operation'], 'build-done has no merge pair');
      if (snapshot.activeNodeId !== null || snapshot.pathIds.length > 0 || snapshot.prefix !== '') {
        add(['operation'], 'build-done is not an encoding step');
      }
      if (snapshot.result !== null) add(['result'], 'build-done is not the final result');
    }

    const encoding = snapshot.operation.startsWith('encode-');
    if (encoding) {
      if (roots.length !== 1) add(['nodes'], 'encoding needs exactly one root');
      if (queue.length !== 1 || queue[0] !== roots[0]?.id) {
        add(['queueIds'], 'during encoding the heap holds only the final root');
      }
      if (!snapshot.metrics) add(['metrics'], 'encoding frames must report WPL and bit metrics');
      if (picked || created) add(['operation'], 'encoding frames have no merge pair');
      if (snapshot.result !== null) add(['result'], 'encoding frames are not final');
      if (snapshot.activeNodeId === null) add(['activeNodeId'], 'encoding frames need an active node');
      if (!snapshot.pathIds.length) add(['pathIds'], 'encoding frames need a real root-to-active path');
      const activeId = snapshot.activeNodeId as string;

      if (snapshot.operation === 'encode-start') {
        if (snapshot.activeNodeId !== roots[0]?.id) add(['activeNodeId'], 'encoding starts at the root');
        if (snapshot.pathIds.length !== 1 || snapshot.pathIds[0] !== roots[0]?.id) {
          add(['pathIds'], 'encoding-start path must be exactly the root');
        }
        if (snapshot.prefix !== '') add(['prefix'], 'encoding starts with an empty prefix');
        if (snapshot.viaSide !== null) add(['viaSide'], 'the root has no incoming side');
        if (snapshot.codes.length > 0) add(['codes'], 'encoding starts with an empty table');
      }

      if (snapshot.operation === 'encode-left' || snapshot.operation === 'encode-right') {
        const expectedSide = snapshot.operation === 'encode-left' ? 'left' : 'right';
        if (snapshot.viaSide !== expectedSide) add(['viaSide'], `${snapshot.operation} requires viaSide=${expectedSide}`);
        const active = byId.get(activeId);
        if (!active) add(['activeNodeId'], 'active node is missing');
        else if (active.leftId === null) add(['activeNodeId'], 'a leaf arrival must use encode-leaf');
        const parentId = parentOf.get(activeId);
        if (!parentId) add(['activeNodeId'], 'an encoded child must have a parent');
        else if (snapshot.pathIds[snapshot.pathIds.length - 2] !== parentId) {
          add(['pathIds'], 'encoding path must contain the active node’s parent');
        }
      }

      if (snapshot.operation === 'encode-leaf') {
        const active = byId.get(activeId);
        if (!active) add(['activeNodeId'], 'active leaf is missing');
        else if (active.leftId !== null) add(['activeNodeId'], 'encode-leaf must point at a real leaf');
        const parentId = parentOf.get(activeId);
        if (parentId === undefined) {
          if (snapshot.viaSide !== null) add(['viaSide'], 'a root leaf has no incoming side');
          if (snapshot.pathIds.length !== 1 || snapshot.pathIds[0] !== snapshot.activeNodeId) {
            add(['pathIds'], 'a single root leaf must be the whole path');
          }
        } else {
          if (snapshot.viaSide === null) add(['viaSide'], 'a non-root leaf needs the incoming side');
          if (snapshot.pathIds[snapshot.pathIds.length - 2] !== parentId) {
            add(['pathIds'], 'encoding path must contain the active leaf’s parent');
          }
        }
        if (!snapshot.codes.some((row) => row.nodeId === snapshot.activeNodeId)) {
          add(['codes'], 'encode-leaf must append the active leaf’s code');
        }
      }
    }

    if (snapshot.operation === 'done') {
      if (picked || created) add(['operation'], 'done has no merge pair');
      if (snapshot.activeNodeId !== null || snapshot.pathIds.length > 0 || snapshot.prefix !== '') {
        add(['operation'], 'done ends the encoding path');
      }
      if (roots.length === 0) {
        if (snapshot.result !== 'empty') add(['result'], 'an empty input must finish with result=empty');
        if (snapshot.codes.length > 0) add(['codes'], 'an empty input has no codes');
        if (queue.length > 0) add(['queueIds'], 'an empty input has an empty queue');
      } else {
        if (roots.length !== 1) add(['nodes'], 'done with input requires exactly one final root');
        if (snapshot.result !== 'encoded') add(['result'], 'a non-empty Huffman run finishes as encoded');
        if (snapshot.codes.length !== leaves.length) add(['codes'], 'done must contain one code per leaf');
      }
    }

    if (
      snapshot.operation !== 'encode-left' &&
      snapshot.operation !== 'encode-right' &&
      snapshot.operation !== 'encode-leaf' &&
      snapshot.viaSide !== null
    ) {
      add(['viaSide'], 'viaSide only belongs to encoding arrival frames');
    }
    if (snapshot.operation !== 'merge-select' && snapshot.operation !== 'merge-create' && picked) {
      add(['pickedIds'], 'pickedIds only belongs to merge frames');
    }
    if (
      snapshot.operation !== 'merge-create' &&
      snapshot.operation !== 'merge-requeue' &&
      created
    ) {
      add(['createdId'], 'createdId only belongs to the parent creation frames');
    }
    if (!encoding && snapshot.operation !== 'done') {
      if (snapshot.activeNodeId !== null || snapshot.pathIds.length > 0 || snapshot.prefix !== '') {
        add(['activeNodeId'], 'only encoding frames carry an active path');
      }
    }

    if (!snapshot.metrics) {
      if (snapshot.operation === 'done' && roots.length === 0) {
        // Empty input still reports explicit zero metrics.
        add(['metrics'], 'empty done must report zero metrics');
      }
      if (snapshot.codes.length > 0) add(['codes'], 'codes require final metrics');
      return;
    }
    const metric = snapshot.metrics;

    // Check every reported metric against the actual tree. This is the point
    // that catches a pretty picture baked from a precomputed answer.
    // Empty input finishes with explicit zero metrics; there is no tree to walk.
    if (roots.length === 0) {
      if (
        metric.leafCount !== 0 ||
        metric.totalWeight !== 0 ||
        metric.wpl !== 0 ||
        metric.totalBits !== 0 ||
        metric.fixedBitsPerChar !== 0 ||
        metric.fixedBits !== 0
      ) {
        add(['metrics'], 'empty metrics must all be zero');
      }
      return;
    }
    if (roots.length !== 1) {
      add(['metrics'], 'metrics require exactly one final root');
      return;
    }
    const leafDepths = new Map<string, number>();
    const leafBits = new Map<string, string>();
    const walk = (id: string, depth: number, bits: string) => {
      const node = byId.get(id);
      if (!node) return;
      if (node.leftId === null || node.rightId === null) {
        leafDepths.set(id, depth);
        leafBits.set(id, bits);
        return;
      }
      walk(node.leftId, depth + 1, `${bits}0`);
      walk(node.rightId, depth + 1, `${bits}1`);
    };
    walk(roots[0]!.id, 0, '');
    const computedLeafCount = leaves.length;
    const totalWeight = leaves.reduce((sum, leaf) => sum + leaf.weight, 0);
    const wpl = leaves.reduce((sum, leaf) => sum + leaf.weight * (leafDepths.get(leaf.id) ?? 0), 0);
    const single = computedLeafCount === 1;
    const totalBits = single ? totalWeight : wpl;
    const fixedBitsPerChar = computedLeafCount <= 1 ? (computedLeafCount === 1 ? 1 : 0) : Math.ceil(Math.log2(computedLeafCount));
    const fixedBits = totalWeight * fixedBitsPerChar;

    if (metric.leafCount !== computedLeafCount) add(['metrics', 'leafCount'], 'leafCount must match the actual leaves');
    if (metric.totalWeight !== totalWeight) add(['metrics', 'totalWeight'], 'totalWeight must match the leaf frequencies');
    if (metric.wpl !== wpl) add(['metrics', 'wpl'], 'WPL must equal Σ(weight × depth) over all leaves');
    if (metric.totalBits !== totalBits) {
      add(['metrics', 'totalBits'], single
        ? 'a single-symbol code uses one actual bit per character'
        : 'totalBits must equal the real weighted path length');
    }
    if (metric.fixedBitsPerChar !== fixedBitsPerChar) {
      add(['metrics', 'fixedBitsPerChar'], 'fixedBitsPerChar must be ceil(log2(leafCount)), or 1 for one symbol');
    }
    if (metric.fixedBits !== fixedBits) add(['metrics', 'fixedBits'], 'fixedBits must equal totalWeight × fixedBitsPerChar');

    if (snapshot.operation === 'merge-create' || snapshot.operation === 'merge-requeue' || snapshot.operation === 'merge-select') {
      add(['metrics'], 'merge frames happen before final metrics exist');
    }

    const codeByNode = new Map<string, HuffmanCodeRow>();
    for (const row of snapshot.codes) {
      if (codeByNode.has(row.nodeId)) add(['codes'], `duplicate code row for node "${row.nodeId}"`);
      codeByNode.set(row.nodeId, row);
      const node = byId.get(row.nodeId);
      if (!node || node.leftId !== null) {
        add(['codes'], `code row "${row.symbol}" must point at a leaf`);
        continue;
      }
      if (node.symbol !== row.symbol) add(['codes'], `code row symbol must match leaf "${node.id}"`);
      if (node.weight !== row.weight) add(['codes'], `code row weight must match leaf "${node.id}"`);
      if (row.length !== row.code.length) add(['codes'], `code row "${row.symbol}" length must match its code`);
      if (row.contribution !== row.weight * row.length) {
        add(['codes'], `code row "${row.symbol}" contribution must be weight × length`);
      }
      if (single) {
        if (row.code !== '0') add(['codes'], 'a single-symbol tree uses the actual code 0');
      } else {
        const expectedBits = leafBits.get(node.id);
        if (expectedBits === undefined || row.code !== expectedBits) {
          add(['codes'], `code row "${row.symbol}" must follow the real root-to-leaf bits`);
        }
      }
    }

    // `prefix` and `pathIds` are the encoding walk, so both must agree with
    // the actual parent chain and the actual 0/1 edges.
    if (encoding) {
      const path = snapshot.pathIds;
      if (path[0] !== roots[0]?.id) add(['pathIds'], 'encoding path must start at the root');
      for (let index = 1; index < path.length; index += 1) {
        const parent = byId.get(path[index - 1]!);
        const child = byId.get(path[index]!);
        if (!parent || !child || (parent.leftId !== child.id && parent.rightId !== child.id)) {
          add(['pathIds'], 'each encoding path step must follow a real child reference');
          break;
        }
      }
      if (path[path.length - 1] !== snapshot.activeNodeId) {
        add(['pathIds'], 'encoding path must end at the active node');
      }
      if (new Set(path).size !== path.length) add(['pathIds'], 'encoding path must not contain a cycle');
      let pathBits = '';
      for (let index = 1; index < path.length; index += 1) {
        const parent = byId.get(path[index - 1]!);
        if (parent?.leftId === path[index]) pathBits += '0';
        else if (parent?.rightId === path[index]) pathBits += '1';
        else pathBits += '?';
      }
      if (snapshot.operation !== 'encode-start' && snapshot.prefix !== pathBits) {
        add(['prefix'], 'prefix must equal the real bits from the root to the active node');
      }
      if (path.length > HUFFMAN_LIMITS.MAX_CODE_BITS + 1) add(['pathIds'], 'encoding path is too deep');
    }

    if (snapshot.operation === 'done' && roots.length > 0) {
      for (const leaf of leaves) {
        const row = codeByNode.get(leaf.id);
        if (!row) add(['codes'], `done is missing the code for leaf "${leaf.symbol ?? leaf.id}"`);
        else if (row.length !== (single ? 1 : leafDepths.get(leaf.id))) {
          add(['codes'], `leaf "${leaf.symbol ?? leaf.id}" code length must equal its real depth`);
        }
      }
    }
  });
export type HuffmanSnapshot = z.infer<typeof huffmanSnapshotSchema>;

/* ------------------------------------------------------------------------- *
 * S1: selection sort, direct insertion sort and Shell sort.
 *
 * One typed snapshot serves all three array algorithms, so the renderer, the
 * playback and the course rail never need three independent state machines.
 * Every field below is recorded by the real Python program:
 *
 *   elements     the actual array after the operation, one id per slot `p0..`.
 *   operation    init / selection round / insertion shift / Shell gap event.
 *   round        1-based pass for selection and insertion, 1-based gap pass for
 *                Shell. `init` and `done` use 0.
 *   sortedFrom   number of leading slots already final (0 for Shell gaps > 1).
 *   candidate    selection's current minimum index.
 *   compare      the index currently compared (left index for insertion/Shell).
 *   key          insertion / Shell key lifted out of the array: value + origin.
 *   gap, lane    Shell's current gap and current congruence class.
 *   gapSequence  deterministic halving sequence, last item 1 when n >= 2.
 *   shifted      source -> target of a right shift by one or by `gap`.
 *   swapped      the two real slots exchanged by selection.
 *   insertedAt   slot where the key was finally written.
 *
 * The array is allowed to contain the real intermediate duplicate produced by
 * `a[j + 1] = a[j]`; pretending the hole is already filled would fabricate a
 * state Python never had.
 * ------------------------------------------------------------------------- */
export const SORTING_ALGORITHMS = ['selection', 'insertion', 'shell', 'quick', 'merge'] as const;
export type SortingAlgorithm = (typeof SORTING_ALGORITHMS)[number];

export const SORTING_OPERATIONS = [
  'init',
  'select-start',
  'select-compare',
  'select-candidate',
  'select-swap',
  'select-done',
  'insert-key',
  'insert-compare',
  'insert-shift',
  'insert-place',
  'gap-change',
  'shell-compare',
  'shell-shift',
  'shell-place',
  'gap-done',
  'quick-range',
  'quick-compare',
  'quick-swap',
  'quick-place',
  'quick-return',
  'merge-range',
  'merge-split',
  'merge-return',
  'merge-start',
  'merge-compare',
  'merge-write',
  'merge-copy',
  'merge-writeback',
  'merge-range-done',
  'done',
] as const;
export type SortingOperation = (typeof SORTING_OPERATIONS)[number];

const SORTING_OPS_BY_ALGORITHM: Record<SortingAlgorithm, readonly SortingOperation[]> = {
  selection: ['init', 'select-start', 'select-compare', 'select-candidate', 'select-swap', 'select-done', 'done'],
  insertion: ['init', 'insert-key', 'insert-compare', 'insert-shift', 'insert-place', 'done'],
  shell: ['init', 'gap-change', 'shell-compare', 'shell-shift', 'shell-place', 'gap-done', 'done'],
  quick: ['init', 'quick-range', 'quick-compare', 'quick-swap', 'quick-place', 'quick-return', 'done'],
  merge: [
    'init',
    'merge-range',
    'merge-split',
    'merge-return',
    'merge-start',
    'merge-compare',
    'merge-write',
    'merge-copy',
    'merge-writeback',
    'merge-range-done',
    'done',
  ],
};

export const SORTING_LIMITS = {
  MAX_VALUES: 20,
  MAX_ROUNDS: 64,
  MAX_ABS_VALUE: 1_000_000_000_000,
} as const;

export const sortingElementSchema = z.object({
  id: z.string().regex(/^p\d+$/, 'slot ids must be p0, p1, ...'),
  value: z.number().finite().min(-SORTING_LIMITS.MAX_ABS_VALUE).max(SORTING_LIMITS.MAX_ABS_VALUE),
});
export type SortingElement = z.infer<typeof sortingElementSchema>;

export const sortingKeySchema = z.object({
  value: z.number().finite().min(-SORTING_LIMITS.MAX_ABS_VALUE).max(SORTING_LIMITS.MAX_ABS_VALUE),
  origin: z.number().int().nonnegative().max(SORTING_LIMITS.MAX_VALUES - 1),
});
export type SortingKey = z.infer<typeof sortingKeySchema>;

export const sortingShiftSchema = z.object({
  from: z.number().int().nonnegative().max(SORTING_LIMITS.MAX_VALUES - 1),
  to: z.number().int().nonnegative().max(SORTING_LIMITS.MAX_VALUES - 1),
});
export type SortingShift = z.infer<typeof sortingShiftSchema>;

/** Inclusive recursive interval. An empty quick child may have low = high + 1. */
export const sortingRangeSchema = z.object({
  low: z.number().int().nonnegative().max(SORTING_LIMITS.MAX_VALUES),
  high: z.number().int().min(-1).max(SORTING_LIMITS.MAX_VALUES - 1),
});
export type SortingRange = z.infer<typeof sortingRangeSchema>;

/** One real merge-buffer append. `index` is the slot that just received the value. */
export const sortingBufferWriteSchema = z.object({
  index: z.number().int().nonnegative().max(SORTING_LIMITS.MAX_VALUES - 1),
  value: z.number().finite().min(-SORTING_LIMITS.MAX_ABS_VALUE).max(SORTING_LIMITS.MAX_ABS_VALUE),
  source: z.number().int().nonnegative().max(SORTING_LIMITS.MAX_VALUES - 1),
});
export type SortingBufferWrite = z.infer<typeof sortingBufferWriteSchema>;

export const sortingSnapshotSchema = z
  .object({
    kind: z.literal('sorting'),
    algorithm: z.enum(SORTING_ALGORITHMS),
    operation: z.enum(SORTING_OPERATIONS),
    elements: z.array(sortingElementSchema).max(SORTING_LIMITS.MAX_VALUES),
    round: z.number().int().nonnegative().max(SORTING_LIMITS.MAX_ROUNDS),
    sortedFrom: z.number().int().nonnegative().max(SORTING_LIMITS.MAX_VALUES),
    candidate: z.number().int().nonnegative().max(SORTING_LIMITS.MAX_VALUES - 1).nullable(),
    compare: z.number().int().nonnegative().max(SORTING_LIMITS.MAX_VALUES - 1).nullable(),
    key: sortingKeySchema.nullable(),
    gap: z.number().int().positive().max(SORTING_LIMITS.MAX_VALUES).nullable(),
    gapSequence: z.array(z.number().int().positive().max(SORTING_LIMITS.MAX_VALUES)).max(8),
    lane: z.number().int().nonnegative().max(SORTING_LIMITS.MAX_VALUES - 1).nullable(),
    shifted: sortingShiftSchema.nullable(),
    swapped: z.tuple([z.number().int().nonnegative(), z.number().int().nonnegative()]).nullable(),
    insertedAt: z.number().int().nonnegative().max(SORTING_LIMITS.MAX_VALUES - 1).nullable(),
    result: z.enum(['sorted', 'empty']).nullable(),
    range: sortingRangeSchema.nullable().default(null),
    pivot: z.number().int().nonnegative().max(SORTING_LIMITS.MAX_VALUES - 1).nullable().default(null),
    boundary: z.number().int().nonnegative().max(SORTING_LIMITS.MAX_VALUES - 1).nullable().default(null),
    split: z.number().int().nonnegative().max(SORTING_LIMITS.MAX_VALUES - 1).nullable().default(null),
    left: z.number().int().nonnegative().max(SORTING_LIMITS.MAX_VALUES - 1).nullable().default(null),
    right: z.number().int().nonnegative().max(SORTING_LIMITS.MAX_VALUES - 1).nullable().default(null),
    buffer: z
      .array(z.number().finite().min(-SORTING_LIMITS.MAX_ABS_VALUE).max(SORTING_LIMITS.MAX_ABS_VALUE))
      .max(SORTING_LIMITS.MAX_VALUES)
      .default([]),
    bufferWrite: sortingBufferWriteSchema.nullable().default(null),
    writeAt: z.number().int().nonnegative().max(SORTING_LIMITS.MAX_VALUES - 1).nullable().default(null),
    finalized: z.array(z.number().int().nonnegative().max(SORTING_LIMITS.MAX_VALUES - 1)).max(SORTING_LIMITS.MAX_VALUES).default([]),
    mergedRanges: z.array(sortingRangeSchema).max(SORTING_LIMITS.MAX_VALUES).default([]),
  })
  .superRefine((snapshot, ctx) => {
    const add = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
    const n = snapshot.elements.length;
    const values = snapshot.elements.map((element) => element.value);

    if (!SORTING_OPS_BY_ALGORITHM[snapshot.algorithm].includes(snapshot.operation)) {
      add(['operation'], `operation "${snapshot.operation}" is not valid for ${snapshot.algorithm}`);
    }
    snapshot.elements.forEach((element, index) => {
      if (element.id !== `p${index}`) add(['elements', index, 'id'], 'slot ids must be p0..p(n-1) in order');
    });
    if (snapshot.sortedFrom > n) add(['sortedFrom'], 'sortedFrom exceeds the array length');
    if (snapshot.gap !== null && snapshot.gap > n) add(['gap'], 'gap exceeds the array length');
    if (snapshot.lane !== null && snapshot.gap !== null && snapshot.lane >= snapshot.gap) {
      add(['lane'], 'lane must be inside [0, gap)');
    }
    if (snapshot.round > SORTING_LIMITS.MAX_ROUNDS) add(['round'], 'round is too large');

    const expectedGaps = (() => {
      if (snapshot.algorithm !== 'shell') return [] as number[];
      const gaps: number[] = [];
      let gap = Math.floor(n / 2);
      while (gap > 0) {
        gaps.push(gap);
        gap = Math.floor(gap / 2);
      }
      return gaps;
    })();
    if (
      snapshot.gapSequence.length !== expectedGaps.length ||
      snapshot.gapSequence.some((gap, index) => gap !== expectedGaps[index])
    ) {
      add(['gapSequence'], 'gapSequence must be the deterministic halving sequence for this length');
    }

    const prefixSorted = (length: number) => {
      for (let index = 1; index < length; index += 1) {
        if (values[index - 1]! > values[index]!) return false;
      }
      return true;
    };
    const ascending = () => prefixSorted(n);
    const keyMatchesSlot = (origin: number, value: number) =>
      origin >= 0 && origin < n && values[origin] === value;
    const rangeWithinBounds = (range: SortingRange) =>
      range.low >= 0 && range.low <= n && range.high >= -1 && range.high < n;
    const rangeHasSlots = (range: SortingRange) => range.low <= range.high;
    const rangeOf = (low: number, high: number) => ({ low, high });
    const rangeEquals = (a: SortingRange | null, low: number, high: number) =>
      a !== null && a.low === low && a.high === high;
    const finalizedValid = snapshot.finalized.every(
      (index) => index >= 0 && index < n,
    );
    if (!finalizedValid) add(['finalized'], 'finalized slots must be real array indices');
    if (new Set(snapshot.finalized).size !== snapshot.finalized.length) {
      add(['finalized'], 'finalized slots must be unique');
    }
    if (snapshot.range !== null && !rangeWithinBounds(snapshot.range)) {
      add(['range'], 'recursive range is outside the array');
    }
    for (const [index, range] of snapshot.mergedRanges.entries()) {
      if (!rangeWithinBounds(range) || !rangeHasSlots(range)) {
        add(['mergedRanges', index], 'merged ranges must be non-empty and inside the array');
      }
    }

    if (snapshot.operation === 'init') {
      if (snapshot.round !== 0 || snapshot.sortedFrom !== 0) add(['round'], 'init starts at round 0 with no sorted prefix');
      if (
        snapshot.candidate !== null ||
        snapshot.compare !== null ||
        snapshot.key !== null ||
        snapshot.gap !== null ||
        snapshot.lane !== null ||
        snapshot.shifted !== null ||
        snapshot.swapped !== null ||
        snapshot.insertedAt !== null ||
        snapshot.result !== null ||
        snapshot.range !== null ||
        snapshot.pivot !== null ||
        snapshot.boundary !== null ||
        snapshot.split !== null ||
        snapshot.left !== null ||
        snapshot.right !== null ||
        snapshot.buffer.length !== 0 ||
        snapshot.bufferWrite !== null ||
        snapshot.writeAt !== null ||
        snapshot.finalized.length !== 0 ||
        snapshot.mergedRanges.length !== 0
      ) {
        add(['operation'], 'init cannot carry active sort metadata');
      }
      return;
    }

    if (snapshot.operation === 'done') {
      if (snapshot.result === null) add(['result'], 'done must report a sorted or empty result');
      if (snapshot.result === 'empty' && n !== 0) add(['result'], 'only an empty array may report result = empty');
      if (snapshot.result === 'sorted' && n > 0 && !ascending()) add(['elements'], 'done must be globally ascending');
      if (snapshot.result === 'sorted' && n === 0) add(['result'], 'an empty array must report result = empty');
      if (snapshot.sortedFrom !== n) add(['sortedFrom'], 'done marks every slot as final');
      if (
        snapshot.candidate !== null ||
        snapshot.compare !== null ||
        snapshot.key !== null ||
        snapshot.gap !== null ||
        snapshot.lane !== null ||
        snapshot.shifted !== null ||
        snapshot.swapped !== null ||
        snapshot.insertedAt !== null ||
        snapshot.range !== null ||
        snapshot.pivot !== null ||
        snapshot.boundary !== null ||
        snapshot.split !== null ||
        snapshot.left !== null ||
        snapshot.right !== null ||
        snapshot.buffer.length !== 0 ||
        snapshot.bufferWrite !== null ||
        snapshot.writeAt !== null
      ) {
        add(['operation'], 'done cannot carry active sort metadata');
      }
      if (snapshot.algorithm === 'quick' || snapshot.algorithm === 'merge') {
        if (new Set(snapshot.finalized).size !== n || snapshot.finalized.length !== n) {
          add(['finalized'], 'done must mark every slot as final');
        }
      }
      if (snapshot.algorithm === 'merge' && n > 0 && !snapshot.mergedRanges.some((range) => range.low === 0 && range.high === n - 1)) {
        add(['mergedRanges'], 'done must report the whole array as one sorted range');
      }
      return;
    }

    if (snapshot.result !== null) add(['result'], 'only done reports a result');
    if (!prefixSorted(snapshot.sortedFrom)) {
      add(['sortedFrom'], 'the claimed sorted prefix must be non-decreasing');
    }

    if (snapshot.algorithm === 'selection') {
      const index = snapshot.round - 1;
      if (snapshot.round < 1 || index >= n) add(['round'], 'selection round must address a real slot');
      if (snapshot.gap !== null || snapshot.lane !== null || snapshot.key !== null || snapshot.shifted !== null || snapshot.insertedAt !== null) {
        add(['operation'], 'selection cannot carry gap/key metadata');
      }

      if (snapshot.operation === 'select-start') {
        if (snapshot.sortedFrom !== index) add(['sortedFrom'], 'select-start begins with round index sorted slots');
        if (snapshot.candidate !== index) add(['candidate'], 'select-start sets the candidate to the round start');
        if (snapshot.compare !== null || snapshot.swapped !== null) add(['compare'], 'select-start has not compared or swapped yet');
      }
      if (snapshot.operation === 'select-compare') {
        if (snapshot.sortedFrom !== index) add(['sortedFrom'], 'compare keeps the current round boundary');
        if (snapshot.candidate === null) add(['candidate'], 'select-compare needs a current minimum');
        if (snapshot.compare === null) add(['compare'], 'select-compare needs a scanned slot');
        if (snapshot.compare !== null && snapshot.compare <= index) add(['compare'], 'selection scans only the unsorted suffix');
        if (snapshot.candidate !== null && snapshot.compare !== null && snapshot.candidate >= snapshot.compare) {
          add(['candidate'], 'before a comparison the candidate must be left of the scanned slot');
        }
        if (snapshot.swapped !== null) add(['swapped'], 'compare does not swap');
      }
      if (snapshot.operation === 'select-candidate') {
        if (snapshot.sortedFrom !== index) add(['sortedFrom'], 'candidate update stays in the current round');
        if (snapshot.candidate === null || snapshot.compare === null || snapshot.candidate !== snapshot.compare) {
          add(['candidate'], 'select-candidate moves the minimum to the scanned slot');
        }
      }
      if (snapshot.operation === 'select-swap') {
        if (snapshot.sortedFrom !== index + 1) add(['sortedFrom'], 'the real swap completes one more slot');
        if (snapshot.swapped === null) add(['swapped'], 'select-swap must record the exchanged slots');
        if (snapshot.swapped !== null) {
          if (snapshot.swapped[0] !== index) add(['swapped'], 'selection swaps the round start');
          if (snapshot.candidate !== snapshot.swapped[1]) add(['candidate'], 'the candidate is the other swapped slot');
          if (snapshot.swapped[1]! < index || snapshot.swapped[1]! >= n) add(['swapped'], 'swap target is outside the unsorted suffix');
        }
        if (snapshot.compare !== null) add(['compare'], 'select-swap has finished comparing');
      }
      if (snapshot.operation === 'select-done') {
        if (snapshot.sortedFrom !== index + 1) add(['sortedFrom'], 'select-done completes one slot');
        if (snapshot.candidate !== null || snapshot.compare !== null || snapshot.swapped !== null) {
          add(['candidate'], 'select-done has no pending candidate or swap');
        }
      }
    }

    if (snapshot.algorithm === 'insertion') {
      if (snapshot.round < 1 || snapshot.round >= n) add(['round'], 'insertion round must address a real key');
      if (snapshot.gap !== null || snapshot.lane !== null || snapshot.shifted !== null && snapshot.shifted.to !== snapshot.shifted.from + 1) {
        add(['gap'], 'insertion is gap-free and shifts by exactly one slot');
      }
      if (snapshot.swapped !== null) add(['swapped'], 'insertion never swaps');
      if (snapshot.key === null) add(['key'], 'insertion must expose the lifted key');
      else if (snapshot.key.origin !== snapshot.round) add(['key'], 'key origin must equal the insertion round');
      else if (snapshot.operation === 'insert-key' && !keyMatchesSlot(snapshot.round, snapshot.key.value)) {
        add(['key'], 'key value must be the real value at its origin');
      }
      if (snapshot.operation === 'insert-key') {
        if (snapshot.sortedFrom !== snapshot.round) add(['sortedFrom'], 'before insertion the prefix through origin-1 is sorted');
        if (snapshot.compare !== null) add(['compare'], 'insert-key has not compared left yet');
        if (snapshot.shifted !== null || snapshot.insertedAt !== null) add(['shifted'], 'insert-key has not shifted or placed the key');
      }
      if (snapshot.operation === 'insert-compare') {
        if (snapshot.sortedFrom !== snapshot.round) add(['sortedFrom'], 'comparison keeps the prefix boundary');
        if (snapshot.compare === null || snapshot.compare >= snapshot.round) add(['compare'], 'compare walks left of the key');
        if (snapshot.shifted !== null || snapshot.insertedAt !== null) add(['shifted'], 'compare does not shift yet');
      }
      if (snapshot.operation === 'insert-shift') {
        if (snapshot.sortedFrom !== snapshot.round) add(['sortedFrom'], 'shifting keeps the prefix boundary');
        if (snapshot.compare === null) add(['compare'], 'insert-shift must identify the shifted source');
        if (snapshot.shifted === null) add(['shifted'], 'insert-shift must record the move');
        if (snapshot.shifted !== null) {
          if (snapshot.shifted.to !== snapshot.shifted.from + 1) add(['shifted'], 'insertion shifts one slot right');
          if (snapshot.shifted.from >= n || snapshot.shifted.to >= n) add(['shifted'], 'shift target is out of range');
          if (values[snapshot.shifted.to] !== values[snapshot.shifted.from]) {
            add(['elements'], 'the real intermediate duplicate must be preserved');
          }
        }
        if (snapshot.insertedAt !== null) add(['insertedAt'], 'the key is not placed before the shifting ends');
      }
      if (snapshot.operation === 'insert-place') {
        if (snapshot.sortedFrom !== snapshot.round + 1) add(['sortedFrom'], 'placing the key extends the sorted prefix');
        if (snapshot.insertedAt === null) add(['insertedAt'], 'insert-place must record the final slot');
        if (snapshot.insertedAt !== null) {
          if (snapshot.insertedAt > snapshot.round) add(['insertedAt'], 'the key cannot move right of its origin');
          if (snapshot.key !== null && values[snapshot.insertedAt] !== snapshot.key.value) {
            add(['elements'], 'the final slot must hold the key value');
          }
        }
        if (snapshot.compare !== null && snapshot.insertedAt !== snapshot.compare + 1) {
          add(['insertedAt'], 'the key is placed immediately right of the last compared slot');
        }
        if (snapshot.shifted !== null) add(['shifted'], 'insert-place is not a shift');
      }
    }

    if (snapshot.algorithm === 'shell') {
      const gaps = snapshot.gapSequence;
      if (snapshot.round < 1 || snapshot.round > gaps.length) add(['round'], 'Shell round must address a real gap');
      if (snapshot.gap === null) add(['gap'], 'Shell operations require the current gap');
      if (snapshot.gap !== null && gaps[snapshot.round - 1] !== snapshot.gap) add(['gap'], 'gap must match the recorded sequence');
      if (snapshot.candidate !== null || snapshot.swapped !== null) add(['candidate'], 'Shell does not use a minimum candidate or swap');
      if (snapshot.operation === 'gap-change') {
        if (snapshot.key !== null || snapshot.compare !== null || snapshot.shifted !== null || snapshot.insertedAt !== null || snapshot.lane !== null) {
          add(['key'], 'gap-change has no active key or lane');
        }
        if (snapshot.sortedFrom !== (snapshot.gap === 1 ? 1 : 0)) add(['sortedFrom'], 'a gap change starts a new pass');
      }
      if (snapshot.operation === 'gap-done') {
        if (snapshot.key !== null || snapshot.compare !== null || snapshot.shifted !== null || snapshot.insertedAt !== null || snapshot.lane !== null) {
          add(['key'], 'gap-done has no active key');
        }
        if (snapshot.sortedFrom !== (snapshot.gap === 1 ? n : 0)) add(['sortedFrom'], 'the last gap leaves the whole array final');
      }
      if (snapshot.operation === 'shell-compare') {
        if (snapshot.key === null) add(['key'], 'shell-compare needs the lifted key');
        if (snapshot.compare === null) add(['compare'], 'shell-compare needs the compared slot');
        if (snapshot.lane === null) add(['lane'], 'shell-compare must identify the gap lane');
        if (snapshot.shifted !== null || snapshot.insertedAt !== null) add(['shifted'], 'compare does not shift');
      }
      if (snapshot.operation === 'shell-shift') {
        if (snapshot.key === null || snapshot.compare === null || snapshot.lane === null) add(['shifted'], 'shell-shift needs key, source and lane');
        if (snapshot.shifted === null) add(['shifted'], 'shell-shift must record the move');
        if (snapshot.shifted !== null && snapshot.gap !== null) {
          if (snapshot.shifted.to !== snapshot.shifted.from + snapshot.gap) add(['shifted'], 'Shell shifts by exactly one gap');
          if (snapshot.shifted.to >= n) add(['shifted'], 'Shell shift is out of range');
          if (values[snapshot.shifted.to] !== values[snapshot.shifted.from]) {
            add(['elements'], 'the real intermediate duplicate must be preserved');
          }
        }
        if (snapshot.insertedAt !== null) add(['insertedAt'], 'the key is not placed before shifting ends');
      }
      if (snapshot.operation === 'shell-place') {
        if (snapshot.key === null || snapshot.lane === null) add(['key'], 'shell-place needs the key and lane');
        if (snapshot.insertedAt === null) add(['insertedAt'], 'shell-place must record the final slot');
        if (snapshot.insertedAt !== null && snapshot.key !== null) {
          if (values[snapshot.insertedAt] !== snapshot.key.value) add(['elements'], 'the final slot must hold the key value');
          if (snapshot.gap === null) {
            add(['gap'], 'shell-place needs an active gap');
          } else {
            if (snapshot.insertedAt % snapshot.gap !== snapshot.lane) add(['insertedAt'], 'the key must stay in its gap lane');
            if (snapshot.compare !== null && snapshot.insertedAt !== snapshot.compare + snapshot.gap) {
              add(['insertedAt'], 'the key is placed one gap right of the last compared slot');
            }
            if (snapshot.compare === null && snapshot.insertedAt !== snapshot.lane) {
              add(['insertedAt'], 'a key shifted past the lane start returns to the lane slot');
            }
          }
        }
        if (snapshot.shifted !== null) add(['shifted'], 'place is not a shift');
      }
      if (snapshot.operation === 'shell-compare' || snapshot.operation === 'shell-shift' || snapshot.operation === 'shell-place') {
        if (snapshot.key && snapshot.gap) {
          if (snapshot.lane !== snapshot.key.origin % snapshot.gap) add(['lane'], 'lane must be the key origin residue');
          if (snapshot.key.origin >= n) add(['key'], 'key origin is outside the array');
          if (snapshot.compare !== null) {
            if (snapshot.compare >= snapshot.key.origin) add(['compare'], 'Shell compares only left of the key');
            if (snapshot.compare % snapshot.gap !== snapshot.lane) add(['compare'], 'comparison must stay in the same gap lane');
          }
          const expectedFrom = snapshot.gap === 1 ? snapshot.key.origin : 0;
          if (snapshot.operation !== 'shell-place' && snapshot.sortedFrom !== expectedFrom) {
            add(['sortedFrom'], 'gap=1 grows a sorted prefix; larger gaps do not');
          }
          if (snapshot.operation === 'shell-place' && snapshot.sortedFrom !== (snapshot.gap === 1 ? snapshot.key.origin + 1 : 0)) {
            add(['sortedFrom'], 'placing a gap=1 key extends the sorted prefix');
          }
        }
      }
    }

    if (snapshot.algorithm === 'quick') {
      if (snapshot.round < 1 && !(snapshot.operation === 'quick-return' && snapshot.round === 0)) {
        add(['round'], 'quick operations need a partition number');
      }
      if (
        snapshot.candidate !== null ||
        snapshot.key !== null ||
        snapshot.gap !== null ||
        snapshot.lane !== null ||
        snapshot.shifted !== null ||
        snapshot.buffer.length !== 0 ||
        snapshot.bufferWrite !== null ||
        snapshot.writeAt !== null ||
        snapshot.left !== null ||
        snapshot.right !== null ||
        snapshot.mergedRanges.length !== 0
      ) {
        add(['operation'], 'quick cannot carry merge, key or gap metadata');
      }
      if (snapshot.range === null) add(['range'], 'quick operations need the current recursive range');
      if (snapshot.range !== null && snapshot.operation !== 'quick-return' && !rangeHasSlots(snapshot.range)) {
        add(['range'], 'only a returning quick call may have an empty range');
      }
      if (snapshot.operation === 'quick-range') {
        if (snapshot.range === null || !rangeHasSlots(snapshot.range)) add(['range'], 'quick-range needs a non-empty interval');
        if (snapshot.range !== null && snapshot.pivot !== snapshot.range.high) add(['pivot'], 'Lomuto pivot must be the last slot');
        if (snapshot.range !== null && snapshot.boundary !== snapshot.range.low) add(['boundary'], 'the partition boundary starts at low');
        if (snapshot.compare !== null || snapshot.swapped !== null || snapshot.insertedAt !== null) {
          add(['operation'], 'quick-range has not compared or placed anything yet');
        }
      }
      if (snapshot.operation === 'quick-compare') {
        if (snapshot.range === null || !rangeHasSlots(snapshot.range)) add(['range'], 'quick-compare needs a non-empty interval');
        if (snapshot.range !== null && snapshot.pivot !== snapshot.range.high) add(['pivot'], 'Lomuto pivot must be the last slot');
        if (snapshot.compare === null || snapshot.range === null || snapshot.compare < snapshot.range.low || snapshot.compare >= snapshot.range.high) {
          add(['compare'], 'quick compare scans only [low, high - 1]');
        }
        if (snapshot.boundary === null || snapshot.range === null || snapshot.boundary < snapshot.range.low) {
          add(['boundary'], 'quick boundary must stay inside the partition');
        }
        if (snapshot.boundary !== null && snapshot.compare !== null && snapshot.boundary > snapshot.compare) {
          add(['boundary'], 'the boundary can never be right of the scan pointer');
        }
        if (snapshot.swapped !== null || snapshot.insertedAt !== null) add(['swapped'], 'comparison does not swap or place');
      }
      if (snapshot.operation === 'quick-swap') {
        if (snapshot.range === null || !rangeHasSlots(snapshot.range)) add(['range'], 'quick-swap needs the partition interval');
        if (snapshot.pivot !== snapshot.range?.high) add(['pivot'], 'the pivot stays at high during the scan');
        if (snapshot.swapped === null) add(['swapped'], 'quick-swap must record the real exchanged slots');
        if (snapshot.swapped !== null) {
          const [left, right] = snapshot.swapped;
          if (right !== snapshot.compare) add(['swapped'], 'the scan slot is the right exchange slot');
          if (snapshot.range !== null && (left < snapshot.range.low || right >= snapshot.range.high || left > right)) {
            add(['swapped'], 'quick exchanges stay inside [low, high)');
          }
          if (snapshot.boundary !== left + 1) add(['boundary'], 'the boundary advances after every <= pivot element');
        }
        if (snapshot.insertedAt !== null) add(['insertedAt'], 'the pivot is placed only in quick-place');
      }
      if (snapshot.operation === 'quick-place') {
        if (snapshot.range === null || !rangeHasSlots(snapshot.range)) add(['range'], 'quick-place needs the partition interval');
        if (snapshot.insertedAt === null) add(['insertedAt'], 'quick-place must record the pivot home');
        if (snapshot.insertedAt !== null && snapshot.range !== null && (snapshot.insertedAt < snapshot.range.low || snapshot.insertedAt > snapshot.range.high)) {
          add(['insertedAt'], 'the pivot home must stay inside the partition');
        }
        if (snapshot.insertedAt !== snapshot.boundary || snapshot.insertedAt !== snapshot.pivot) {
          add(['boundary'], 'the pivot home is both the boundary and the pivot slot after placement');
        }
        if (snapshot.finalized.includes(snapshot.insertedAt ?? -1) === false) {
          add(['finalized'], 'a placed pivot is final');
        }
        if (snapshot.swapped === null || snapshot.swapped[0] !== snapshot.insertedAt || snapshot.swapped[1] !== snapshot.range?.high) {
          add(['swapped'], 'quick-place swaps the pivot home with the original high slot');
        }
        if (snapshot.compare !== null) add(['compare'], 'quick-place has finished scanning');
      }
      if (snapshot.operation === 'quick-return') {
        if (snapshot.range === null) add(['range'], 'quick-return must name the returning interval');
        if (snapshot.range !== null && snapshot.range.low === snapshot.range.high) {
          if (snapshot.insertedAt !== snapshot.range.low) add(['insertedAt'], 'a singleton is already in its final slot');
          if (!snapshot.finalized.includes(snapshot.range.low)) add(['finalized'], 'a singleton returning from recursion is final');
        }
        if (snapshot.range !== null && snapshot.range.low > snapshot.range.high && snapshot.insertedAt !== null) {
          add(['insertedAt'], 'an empty interval has no pivot home');
        }
        if (snapshot.pivot !== null || snapshot.boundary !== null || snapshot.compare !== null || snapshot.swapped !== null) {
          add(['operation'], 'quick-return has no active scan metadata');
        }
      }
    }

    if (snapshot.algorithm === 'merge') {
      if (snapshot.round < 1) add(['round'], 'merge operations need a recursive call number');
      if (
        snapshot.candidate !== null ||
        snapshot.compare !== null ||
        snapshot.key !== null ||
        snapshot.gap !== null ||
        snapshot.lane !== null ||
        snapshot.shifted !== null ||
        snapshot.swapped !== null ||
        snapshot.insertedAt !== null ||
        snapshot.pivot !== null ||
        snapshot.boundary !== null
      ) {
        add(['operation'], 'merge cannot carry quick, key or gap metadata');
      }
      if (snapshot.finalized.length !== 0) add(['finalized'], 'merge marks whole ranges, not final slots, before done');
      if (snapshot.range === null) add(['range'], 'merge operations need the current recursive range');
      if (snapshot.range !== null && !rangeHasSlots(snapshot.range)) add(['range'], 'merge only recurses into non-empty ranges');
      if (snapshot.buffer.length > (snapshot.range === null ? 0 : snapshot.range.high - snapshot.range.low + 1)) {
        add(['buffer'], 'the merge buffer cannot exceed the current range');
      }
      if (snapshot.split !== null && snapshot.range !== null && (snapshot.split < snapshot.range.low || snapshot.split >= snapshot.range.high)) {
        add(['split'], 'the split must leave a non-empty right half');
      }
      if (snapshot.operation === 'merge-range') {
        if (snapshot.split !== null || snapshot.left !== null || snapshot.right !== null) add(['split'], 'merge-range has not split yet');
        if (snapshot.buffer.length !== 0 || snapshot.bufferWrite !== null || snapshot.writeAt !== null || snapshot.mergedRanges.length !== 0) {
          add(['buffer'], 'merge-range has no buffer or merged range yet');
        }
      }
      if (snapshot.operation === 'merge-split') {
        if (snapshot.range === null || snapshot.range.low >= snapshot.range.high) add(['split'], 'only a range of length >= 2 can split');
        if (snapshot.range !== null && snapshot.split !== Math.floor((snapshot.range.low + snapshot.range.high) / 2)) {
          add(['split'], 'the split must be the real midpoint');
        }
        if (snapshot.left !== null || snapshot.right !== null) add(['left'], 'split does not start comparing');
        if (snapshot.buffer.length !== 0 || snapshot.bufferWrite !== null || snapshot.writeAt !== null || snapshot.mergedRanges.length !== 0) {
          add(['buffer'], 'split has no buffer or merged range yet');
        }
      }
      if (snapshot.operation === 'merge-return') {
        if (snapshot.split !== null || snapshot.left !== null || snapshot.right !== null) add(['split'], 'a returning merge has no split or cursors');
        if (snapshot.range !== null && snapshot.range.low === snapshot.range.high) {
          if (!snapshot.mergedRanges.some((range) => rangeEquals(range, snapshot.range!.low, snapshot.range!.high))) {
            add(['mergedRanges'], 'a singleton return is one sorted range');
          }
        }
        if (snapshot.buffer.length !== 0 || snapshot.bufferWrite !== null || snapshot.writeAt !== null) {
          add(['buffer'], 'a returning merge has no active buffer');
        }
      }
      if (
        snapshot.operation === 'merge-start' ||
        snapshot.operation === 'merge-compare' ||
        snapshot.operation === 'merge-write' ||
        snapshot.operation === 'merge-copy' ||
        snapshot.operation === 'merge-writeback'
      ) {
        if (snapshot.range === null || snapshot.split === null) add(['split'], 'merging needs the split midpoint');
        if (snapshot.range !== null && snapshot.split !== null) {
          const halves = [
            rangeOf(snapshot.range.low, snapshot.split),
            rangeOf(snapshot.split + 1, snapshot.range.high),
          ];
          if (
            snapshot.mergedRanges.length !== 2 ||
            !rangeEquals(snapshot.mergedRanges[0] ?? null, halves[0].low, halves[0].high) ||
            !rangeEquals(snapshot.mergedRanges[1] ?? null, halves[1].low, halves[1].high)
          ) {
            add(['mergedRanges'], 'the two sorted halves must be visible during merge');
          }
        }
      }
      if (snapshot.operation === 'merge-start') {
        if (snapshot.range === null || snapshot.left !== snapshot.range.low || snapshot.right !== (snapshot.split ?? -1) + 1) {
          add(['left'], 'merge cursors start at the first slots of both halves');
        }
        if (snapshot.buffer.length !== 0 || snapshot.bufferWrite !== null || snapshot.writeAt !== null) {
          add(['buffer'], 'merge-start has an empty buffer');
        }
      }
      if (snapshot.operation === 'merge-compare') {
        if (snapshot.range === null || snapshot.split === null) add(['split'], 'merge-compare needs a split');
        if (snapshot.left === null || snapshot.left < snapshot.range!.low || snapshot.left > snapshot.split!) {
          add(['left'], 'left cursor must stay inside its half');
        }
        if (snapshot.right === null || snapshot.right < snapshot.split! + 1 || snapshot.right > snapshot.range!.high) {
          add(['right'], 'right cursor must stay inside its half');
        }
        if (snapshot.bufferWrite !== null || snapshot.writeAt !== null) add(['buffer'], 'comparison does not write');
      }
      if (snapshot.operation === 'merge-write' || snapshot.operation === 'merge-copy') {
        if (snapshot.bufferWrite === null) add(['bufferWrite'], 'a real buffer append must be recorded');
        if (snapshot.bufferWrite !== null) {
          const write = snapshot.bufferWrite;
          if (write.index !== snapshot.buffer.length - 1) add(['bufferWrite'], 'buffer index must be the slot just appended');
          if (snapshot.buffer[write.index] !== write.value) add(['buffer'], 'buffer content must equal the appended value');
          if (snapshot.range !== null && (write.source < snapshot.range.low || write.source > snapshot.range.high)) {
            add(['bufferWrite'], 'buffer source must be inside the current range');
          }
        }
        if (snapshot.writeAt !== null) add(['writeAt'], 'buffer append is not a write-back');
      }
      if (snapshot.operation === 'merge-writeback') {
        if (snapshot.range === null || snapshot.split === null) add(['split'], 'write-back needs the merge range');
        if (snapshot.range !== null && snapshot.buffer.length !== snapshot.range.high - snapshot.range.low + 1) {
          add(['buffer'], 'write-back needs the full merged buffer');
        }
        if (snapshot.writeAt === null) add(['writeAt'], 'write-back must name the real array slot');
        if (snapshot.writeAt !== null && snapshot.range !== null) {
          if (snapshot.writeAt < snapshot.range.low || snapshot.writeAt > snapshot.range.high) {
            add(['writeAt'], 'write-back stays inside the merge range');
          } else if (values[snapshot.writeAt] !== snapshot.buffer[snapshot.writeAt - snapshot.range.low]) {
            add(['elements'], 'the written slot must equal the buffer value');
          }
        }
        if (snapshot.left !== null || snapshot.right !== null || snapshot.bufferWrite !== null) {
          add(['left'], 'write-back has finished reading both halves');
        }
      }
      if (snapshot.operation === 'merge-range-done') {
        if (snapshot.range === null) add(['range'], 'merge-range-done needs the finished range');
        if (snapshot.range !== null && snapshot.buffer.length !== snapshot.range.high - snapshot.range.low + 1) {
          add(['buffer'], 'the finished merge must retain its real buffer');
        }
        if (snapshot.left !== null || snapshot.right !== null || snapshot.bufferWrite !== null || snapshot.writeAt !== null) {
          add(['operation'], 'merge-range-done has no active cursor or write');
        }
        if (snapshot.range !== null && !snapshot.mergedRanges.some((range) => rangeEquals(range, snapshot.range!.low, snapshot.range!.high))) {
          add(['mergedRanges'], 'the finished range must be marked as merged');
        }
      }
    }
  });
export type SortingSnapshot = z.infer<typeof sortingSnapshotSchema>;

/* -------------------------------------------------------------------------
 * F1: sequential and binary search.
 *
 * A search frame is not a sorting frame with extra highlights. It records the
 * target, the current/indexed position, the live inclusive search range and the
 * comparison that really happened. Binary search boundaries come from Python;
 * the renderer derives excluded cells only from `left`/`right`, never from a
 * frame counter.
 * ------------------------------------------------------------------------- */
/** F2 hash tables: chaining stores real linked nodes, probing stores tri-state slots. */
export const HASH_ALGORITHMS = ['chaining', 'probing'] as const;
export type HashAlgorithm = (typeof HASH_ALGORITHMS)[number];

export const HASH_OPERATIONS = [
  'init', 'hash', 'bucket', 'chain-compare', 'insert', 'duplicate', 'found', 'not-found',
  'delete-head', 'delete-middle', 'delete-tail', 'delete-missing',
  'probe-check', 'probe-next', 'delete', 'table-full', 'done',
] as const;
export type HashOperation = (typeof HASH_OPERATIONS)[number];

const HASH_OPS_BY_ALGORITHM: Record<HashAlgorithm, readonly HashOperation[]> = {
  chaining: [
    'init', 'hash', 'bucket', 'chain-compare', 'insert', 'duplicate', 'found', 'not-found',
    'delete-head', 'delete-middle', 'delete-tail', 'delete-missing', 'done',
  ],
  probing: [
    'init', 'hash', 'probe-check', 'probe-next', 'insert', 'duplicate', 'found', 'not-found',
    'delete', 'delete-missing', 'table-full', 'done',
  ],
};

export const HASH_PHASES = ['init', 'hash', 'locate', 'compare', 'relink', 'insert', 'result', 'failed', 'full'] as const;
export type HashPhase = (typeof HASH_PHASES)[number];

const HASH_PHASE_BY_OPERATION: Record<HashOperation, HashPhase> = {
  init: 'init',
  hash: 'hash',
  bucket: 'locate',
  'chain-compare': 'compare',
  insert: 'insert',
  duplicate: 'compare',
  found: 'result',
  'not-found': 'failed',
  'delete-head': 'relink',
  'delete-middle': 'relink',
  'delete-tail': 'relink',
  'delete-missing': 'failed',
  'probe-check': 'compare',
  'probe-next': 'locate',
  delete: 'relink',
  'table-full': 'full',
  done: 'result',
};

export const HASH_RESULTS = ['inserted', 'found', 'not-found', 'deleted', 'missing', 'duplicate', 'full'] as const;
export type HashResult = (typeof HASH_RESULTS)[number];

export const HASH_COMPARISONS = ['equal', 'different'] as const;
export type HashComparison = (typeof HASH_COMPARISONS)[number];

export const HASH_SLOT_STATES = ['empty', 'occupied', 'deleted'] as const;
export type HashSlotState = (typeof HASH_SLOT_STATES)[number];

export const HASH_LIMITS = {
  MIN_TABLE_SIZE: 2,
  MAX_TABLE_SIZE: 17,
  MAX_ENTRIES: 32,
  MAX_ABS_KEY: 1_000_000_000_000,
} as const;

export const hashBucketSchema = z.object({
  index: z.number().int().nonnegative().max(HASH_LIMITS.MAX_TABLE_SIZE - 1),
  headId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
});
export type HashBucket = z.infer<typeof hashBucketSchema>;

export const hashNodeSchema = z.object({
  id: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  key: z.number().int().min(-HASH_LIMITS.MAX_ABS_KEY).max(HASH_LIMITS.MAX_ABS_KEY),
  bucket: z.number().int().nonnegative().max(HASH_LIMITS.MAX_TABLE_SIZE - 1),
  nextId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
});
export type HashNode = z.infer<typeof hashNodeSchema>;

export const hashSlotSchema = z.object({
  index: z.number().int().nonnegative().max(HASH_LIMITS.MAX_TABLE_SIZE - 1),
  state: z.enum(HASH_SLOT_STATES),
  key: z.number().int().min(-HASH_LIMITS.MAX_ABS_KEY).max(HASH_LIMITS.MAX_ABS_KEY).nullable(),
  id: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
});
export type HashSlot = z.infer<typeof hashSlotSchema>;

export const hashRemovedNodeSchema = z.object({
  kind: z.literal('node'),
  id: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  key: z.number().int().min(-HASH_LIMITS.MAX_ABS_KEY).max(HASH_LIMITS.MAX_ABS_KEY),
  nextId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable(),
  position: z.enum(['head', 'middle', 'tail']),
});
export const hashRemovedSlotSchema = z.object({
  kind: z.literal('slot'),
  index: z.number().int().nonnegative().max(HASH_LIMITS.MAX_TABLE_SIZE - 1),
  key: z.number().int().min(-HASH_LIMITS.MAX_ABS_KEY).max(HASH_LIMITS.MAX_ABS_KEY),
  id: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
});
export const hashRemovedSchema = z.union([hashRemovedNodeSchema, hashRemovedSlotSchema]);
export type HashRemoved = z.infer<typeof hashRemovedSchema>;

export const hashSnapshotSchema = z
  .object({
    kind: z.literal('hash'),
    algorithm: z.enum(HASH_ALGORITHMS),
    operation: z.enum(HASH_OPERATIONS),
    phase: z.enum(HASH_PHASES),
    tableSize: z.number().int().min(HASH_LIMITS.MIN_TABLE_SIZE).max(HASH_LIMITS.MAX_TABLE_SIZE),
    key: z.number().int().min(-HASH_LIMITS.MAX_ABS_KEY).max(HASH_LIMITS.MAX_ABS_KEY).nullable().default(null),
    hashIndex: z.number().int().nonnegative().max(HASH_LIMITS.MAX_TABLE_SIZE - 1).nullable().default(null),
    bucketIndex: z.number().int().nonnegative().max(HASH_LIMITS.MAX_TABLE_SIZE - 1).nullable().default(null),
    currentNodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable().default(null),
    previousNodeId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).nullable().default(null),
    comparison: z.enum(HASH_COMPARISONS).nullable().default(null),
    buckets: z.array(hashBucketSchema).max(HASH_LIMITS.MAX_TABLE_SIZE).default([]),
    nodes: z.array(hashNodeSchema).max(HASH_LIMITS.MAX_ENTRIES).default([]),
    slots: z.array(hashSlotSchema).max(HASH_LIMITS.MAX_TABLE_SIZE).default([]),
    probePath: z
      .array(z.number().int().nonnegative().max(HASH_LIMITS.MAX_TABLE_SIZE - 1))
      .max(HASH_LIMITS.MAX_TABLE_SIZE)
      .default([]),
    currentIndex: z.number().int().nonnegative().max(HASH_LIMITS.MAX_TABLE_SIZE - 1).nullable().default(null),
    reusedDeleted: z.boolean().default(false),
    conflict: z.boolean().nullable().default(null),
    removed: hashRemovedSchema.nullable().default(null),
    result: z.enum(HASH_RESULTS).nullable().default(null),
    found: z.boolean().nullable().default(null),
    elementCount: z.number().int().nonnegative().max(HASH_LIMITS.MAX_ENTRIES),
    loadFactor: z.number().min(0),
    reason: z.enum(['full']).nullable().default(null),
  })
  .superRefine((snapshot, ctx) => {
    const add = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
    const m = snapshot.tableSize;

    if (!HASH_OPS_BY_ALGORITHM[snapshot.algorithm].includes(snapshot.operation)) {
      add(['operation'], `operation "${snapshot.operation}" is not valid for ${snapshot.algorithm}`);
    }
    if (snapshot.phase !== HASH_PHASE_BY_OPERATION[snapshot.operation]) {
      add(['phase'], `phase "${snapshot.phase}" does not match operation "${snapshot.operation}"`);
    }
    if (snapshot.algorithm === 'probing' && snapshot.loadFactor > 1) {
      add(['loadFactor'], 'probing load factor cannot exceed 1 because each slot holds at most one entry');
    }
    if (Math.abs(snapshot.loadFactor - snapshot.elementCount / m) > 1e-9) {
      add(['loadFactor'], 'loadFactor must equal elementCount / tableSize');
    }
    if (snapshot.key === null) {
      if (snapshot.hashIndex !== null) add(['hashIndex'], 'hashIndex requires a key');
      if (snapshot.operation !== 'init' && snapshot.operation !== 'done') {
        add(['key'], `${snapshot.operation} requires a key`);
      }
    } else {
      if (snapshot.hashIndex === null) add(['hashIndex'], 'a key requires its real hash index');
      if (snapshot.hashIndex !== null && snapshot.hashIndex !== ((snapshot.key % m) + m) % m) {
        add(['hashIndex'], 'hashIndex must equal key % tableSize');
      }
    }

    if (snapshot.algorithm === 'chaining') {
      if (snapshot.slots.length > 0 || snapshot.probePath.length > 0 || snapshot.currentIndex !== null || snapshot.reusedDeleted) {
        add(['algorithm'], 'chaining has no probing slots or probe path');
      }
      if (snapshot.operation !== 'done' && snapshot.operation !== 'init' && snapshot.bucketIndex === null) {
        add(['bucketIndex'], 'chaining operations locate a bucket');
      }
      if (snapshot.buckets.length !== m) add(['buckets'], `chaining needs exactly ${m} buckets`);
      snapshot.buckets.forEach((bucket, index) => {
        if (bucket.index !== index) add(['buckets', index], 'bucket indices must be 0..m-1 in order');
      });
      const nodeById = new Map(snapshot.nodes.map((node) => [node.id, node]));
      if (nodeById.size !== snapshot.nodes.length) add(['nodes'], 'node ids must be unique');
      snapshot.nodes.forEach((node, index) => {
        if (node.bucket < 0 || node.bucket >= m) add(['nodes', index, 'bucket'], 'node bucket is out of range');
        if (node.nextId !== null && !nodeById.has(node.nextId)) {
          add(['nodes', index, 'nextId'], 'node nextId must reference a real node');
        }
        if (node.nextId !== null) {
          const next = nodeById.get(node.nextId);
          if (next && next.bucket !== node.bucket) add(['nodes', index, 'nextId'], 'next node must stay in the same bucket');
        }
      });
      const reached = new Set<string>();
      snapshot.buckets.forEach((bucket, bucketIndex) => {
        const local = new Set<string>();
        let id = bucket.headId;
        while (id !== null) {
          if (local.has(id)) {
            add(['buckets', bucketIndex], 'bucket chain must not contain a cycle');
            break;
          }
          const node = nodeById.get(id);
          if (!node) {
            add(['buckets', bucketIndex, 'headId'], 'bucket head must reference a real node');
            break;
          }
          if (node.bucket !== bucketIndex) add(['buckets', bucketIndex], 'bucket chain crosses into another bucket');
          local.add(id);
          reached.add(id);
          id = node.nextId;
        }
      });
      if (reached.size !== snapshot.nodes.length) add(['nodes'], 'every node must be reachable from exactly one bucket');
      if (snapshot.elementCount !== snapshot.nodes.length) add(['elementCount'], 'elementCount must equal the node count');
      const current = snapshot.currentNodeId === null ? null : nodeById.get(snapshot.currentNodeId) ?? null;
      if (snapshot.currentNodeId !== null && current === null) {
        add(['currentNodeId'], 'currentNodeId must reference a real node');
      }
      if (snapshot.previousNodeId !== null && !nodeById.has(snapshot.previousNodeId)) {
        add(['previousNodeId'], 'previousNodeId must reference a real node');
      }
      if (snapshot.operation === 'init') {
        if (snapshot.key !== null || snapshot.bucketIndex !== null || current !== null) {
          add(['operation'], 'init has no key, bucket or current node');
        }
        if (snapshot.nodes.length !== 0) add(['nodes'], 'init starts empty');
      }
      if (snapshot.operation === 'hash' || snapshot.operation === 'bucket') {
        if (current !== null || snapshot.result !== null || snapshot.found !== null) {
          add(['operation'], `${snapshot.operation} does not select or return a node`);
        }
      }
      if (snapshot.operation === 'chain-compare') {
        if (current === null || snapshot.bucketIndex === null || current.bucket !== snapshot.bucketIndex) {
          add(['currentNodeId'], 'chain-compare must point at a node in the located bucket');
        }
        if (current && snapshot.key !== null) {
          const expected = current.key === snapshot.key ? 'equal' : 'different';
          if (snapshot.comparison !== expected) add(['comparison'], 'comparison must match the real node key');
        }
        if (snapshot.result !== null || snapshot.found !== null) add(['operation'], 'chain-compare is not terminal');
      }
      if (snapshot.operation === 'insert') {
        if (snapshot.bucketIndex === null || current === null || current.bucket !== snapshot.bucketIndex) {
          add(['currentNodeId'], 'insert must point at the new node in its bucket');
        }
        const head = snapshot.buckets[snapshot.bucketIndex ?? 0]?.headId ?? null;
        if (current && head !== current.id) add(['currentNodeId'], 'a new chaining node becomes the bucket head');
        if (snapshot.result !== 'inserted' || snapshot.found !== null) add(['result'], 'insert reports inserted');
      }
      if (snapshot.operation === 'duplicate') {
        if (current === null || snapshot.result !== 'duplicate') add(['result'], 'duplicate points at the existing key');
      }
      if (snapshot.operation === 'found') {
        if (current === null || snapshot.result !== 'found' || snapshot.found !== true) {
          add(['result'], 'found needs a real matching node');
        }
        if (current && snapshot.key !== null && current.key !== snapshot.key) add(['currentNodeId'], 'found node key mismatch');
      }
      if (snapshot.operation === 'not-found') {
        if (current !== null || snapshot.result !== 'not-found' || snapshot.found !== false) {
          add(['result'], 'not-found returns no current node and found=false');
        }
      }
      if (snapshot.operation === 'delete-head' || snapshot.operation === 'delete-middle' || snapshot.operation === 'delete-tail') {
        if (snapshot.removed === null || snapshot.removed.kind !== 'node') {
          add(['removed'], 'delete needs the removed node snapshot');
        } else {
          const removed = snapshot.removed;
          if (snapshot.key !== removed.key) add(['key'], 'delete key must equal the removed node key');
          if (snapshot.result !== 'deleted' || snapshot.found !== null) add(['result'], 'delete reports deleted');
          if (nodeById.has(removed.id)) add(['removed'], 'the removed node must no longer be in the live chain');
          if (snapshot.operation === 'delete-head') {
            if (removed.position !== 'head') add(['removed'], 'delete-head removed node must be the head');
            if (snapshot.bucketIndex === null || snapshot.buckets[snapshot.bucketIndex]?.headId !== removed.nextId) {
              add(['buckets'], 'delete-head must replace the head with removed.nextId');
            }
          }
          if (snapshot.operation === 'delete-middle') {
            if (removed.position !== 'middle' || snapshot.previousNodeId === null) {
              add(['previousNodeId'], 'delete-middle needs a previous node');
            }
            const prev = snapshot.previousNodeId === null ? null : nodeById.get(snapshot.previousNodeId) ?? null;
            if (prev === null || prev.nextId !== removed.nextId) {
              add(['previousNodeId'], 'delete-middle must relink previous.nextId to removed.nextId');
            }
          }
          if (snapshot.operation === 'delete-tail') {
            if (removed.position !== 'tail' || removed.nextId !== null) add(['removed'], 'delete-tail removes a node with next=null');
            const prev = snapshot.previousNodeId === null ? null : nodeById.get(snapshot.previousNodeId) ?? null;
            if (snapshot.previousNodeId !== null && (prev === null || prev.nextId !== null)) {
              add(['previousNodeId'], 'delete-tail must set previous.nextId to null');
            }
          }
        }
      }
      if (snapshot.operation === 'delete-missing') {
        if (snapshot.removed !== null || snapshot.result !== 'missing' || snapshot.found !== false) {
          add(['result'], 'delete-missing removes nothing and returns missing');
        }
      }
      if (snapshot.operation === 'done') {
        if (snapshot.key !== null || snapshot.bucketIndex !== null || current !== null || snapshot.result !== null) {
          add(['operation'], 'done only reports the final table');
        }
      }
    } else {
      // Probing.
      if (snapshot.buckets.length > 0 || snapshot.nodes.length > 0 || snapshot.currentNodeId !== null || snapshot.previousNodeId !== null) {
        add(['algorithm'], 'probing has no bucket chains');
      }
      if (snapshot.slots.length !== m) add(['slots'], `probing needs exactly ${m} slots`);
      snapshot.slots.forEach((slot, index) => {
        if (slot.index !== index) add(['slots', index], 'slot indices must be 0..m-1 in order');
        if (slot.state === 'empty' && (slot.key !== null || slot.id !== null)) add(['slots', index], 'empty slot carries no key');
        if (slot.state === 'deleted' && (slot.key !== null || slot.id !== null)) add(['slots', index], 'deleted slot carries no key');
        if (slot.state === 'occupied' && (slot.key === null || slot.id === null)) add(['slots', index], 'occupied slot needs key and id');
      });
      const occupied = snapshot.slots.filter((slot) => slot.state === 'occupied');
      if (new Set(occupied.map((slot) => slot.id)).size !== occupied.length) add(['slots'], 'occupied entry ids must be unique');
      if (new Set(occupied.map((slot) => slot.key)).size !== occupied.length) add(['slots'], 'occupied keys must stay unique');
      if (snapshot.elementCount !== occupied.length) add(['elementCount'], 'elementCount must equal occupied slots');
      const path = snapshot.probePath;
      if (path.length > 0) {
        if (snapshot.hashIndex === null || path[0] !== snapshot.hashIndex) add(['probePath'], 'probe path must start at the hash index');
        for (let i = 0; i < path.length; i += 1) {
          if (i > 0 && path[i] !== (path[i - 1]! + 1) % m) add(['probePath'], 'probe path must move one slot with wraparound');
        }
        if (new Set(path).size !== path.length) add(['probePath'], 'probe path visits each slot at most once');
      }
      if (snapshot.currentIndex !== null && !path.includes(snapshot.currentIndex)) {
        add(['currentIndex'], 'currentIndex must be on the real probe path');
      }
      if (snapshot.operation === 'init') {
        if (snapshot.key !== null || snapshot.hashIndex !== null || path.length > 0 || snapshot.currentIndex !== null) {
          add(['operation'], 'init has no key or probe path');
        }
        if (occupied.length !== 0 || snapshot.slots.some((slot) => slot.state !== 'empty')) add(['slots'], 'init starts empty');
      }
      if (snapshot.operation === 'hash') {
        if (path.length > 0 || snapshot.currentIndex !== null || snapshot.result !== null || snapshot.conflict !== null) {
          add(['operation'], 'hash only computes the initial slot');
        }
      }
      if (snapshot.operation === 'probe-check') {
        if (path.length === 0 || snapshot.currentIndex !== path[path.length - 1]) {
          add(['currentIndex'], 'probe-check points at the last probed slot');
        }
        if (snapshot.currentIndex !== null) {
          const slot = snapshot.slots[snapshot.currentIndex];
          if (slot) {
            if (slot.state === 'occupied' && snapshot.key !== null) {
              const expected = slot.key === snapshot.key ? 'equal' : 'different';
              if (snapshot.comparison !== expected) add(['comparison'], 'comparison must match the occupied slot key');
              if (snapshot.conflict !== (expected === 'different')) add(['conflict'], 'conflict means an occupied slot holds another key');
            } else if (snapshot.comparison !== null || snapshot.conflict !== false) {
              add(['comparison'], 'empty or deleted slots have no key comparison and no collision');
            }
          }
        }
        if (snapshot.result !== null || snapshot.found !== null) add(['operation'], 'probe-check is not terminal');
      }
      if (snapshot.operation === 'probe-next') {
        if (path.length < 2 || snapshot.currentIndex !== path[path.length - 1]) {
          add(['currentIndex'], 'probe-next advances to the last path slot');
        }
        if (snapshot.result !== null || snapshot.found !== null || snapshot.comparison !== null) {
          add(['operation'], 'probe-next only moves the probe pointer');
        }
      }
      if (snapshot.operation === 'insert') {
        if (snapshot.currentIndex === null || snapshot.result !== 'inserted' || snapshot.found !== null) {
          add(['result'], 'insert writes into the current slot');
        }
        const slot = snapshot.currentIndex === null ? null : snapshot.slots[snapshot.currentIndex];
        if (slot === undefined || slot === null || slot.state !== 'occupied' || slot.key !== snapshot.key) {
          add(['slots'], 'insert must leave the key in the current occupied slot');
        }
        if (!snapshot.reusedDeleted && snapshot.probePath.length === 0) add(['probePath'], 'insert needs a real probe path');
      }
      if (snapshot.operation === 'duplicate') {
        if (snapshot.currentIndex === null || snapshot.result !== 'duplicate') add(['result'], 'duplicate points at the existing slot');
        const slot = snapshot.currentIndex === null ? null : snapshot.slots[snapshot.currentIndex];
        if (slot === null || slot.state !== 'occupied' || slot.key !== snapshot.key) add(['slots'], 'duplicate slot must hold the key');
      }
      if (snapshot.operation === 'found') {
        if (snapshot.currentIndex === null || snapshot.result !== 'found' || snapshot.found !== true) {
          add(['result'], 'found needs a matching occupied slot');
        }
        const slot = snapshot.currentIndex === null ? null : snapshot.slots[snapshot.currentIndex];
        if (slot === null || slot.state !== 'occupied' || slot.key !== snapshot.key) add(['slots'], 'found slot must hold the key');
        if (snapshot.comparison !== 'equal') add(['comparison'], 'found records equality');
      }
      if (snapshot.operation === 'not-found') {
        if (snapshot.result !== 'not-found' || snapshot.found !== false) add(['result'], 'not-found returns found=false');
      }
      if (snapshot.operation === 'delete') {
        if (snapshot.removed === null || snapshot.removed.kind !== 'slot') {
          add(['removed'], 'delete needs the removed slot snapshot');
        } else {
          const removed = snapshot.removed;
          if (removed.key !== snapshot.key) add(['key'], 'delete key must equal the removed slot key');
          if (snapshot.currentIndex !== removed.index) add(['currentIndex'], 'delete points at the removed slot');
          if (snapshot.slots[removed.index]?.state !== 'deleted') add(['slots'], 'delete leaves a DELETED tombstone');
          if (snapshot.result !== 'deleted' || snapshot.found !== null) add(['result'], 'delete reports deleted');
          if (snapshot.slots.some((slot) => slot.state === 'occupied' && slot.id === removed.id)) {
            add(['removed'], 'the removed entry id must no longer be occupied');
          }
        }
      }
      if (snapshot.operation === 'delete-missing') {
        if (snapshot.removed !== null || snapshot.result !== 'missing' || snapshot.found !== false) {
          add(['result'], 'delete-missing removes nothing and returns missing');
        }
      }
      if (snapshot.operation === 'table-full') {
        if (snapshot.result !== 'full' || snapshot.reason !== 'full') add(['result'], 'table-full reports full');
        if (snapshot.elementCount !== m) add(['elementCount'], 'table-full requires every slot occupied');
        if (path.length !== m) add(['probePath'], 'table-full probes every slot');
      }
      if (snapshot.operation !== 'table-full' && snapshot.reason !== null) {
        add(['reason'], 'reason=full is reserved for table-full');
      }
      if (snapshot.operation === 'done') {
        if (snapshot.key !== null || snapshot.currentIndex !== null || snapshot.result !== null) {
          add(['operation'], 'done only reports the final table');
        }
      }
    }
  });
export type HashSnapshot = z.infer<typeof hashSnapshotSchema>;

export const SEARCH_ALGORITHMS = ['linear', 'binary'] as const;
export type SearchAlgorithm = (typeof SEARCH_ALGORITHMS)[number];

export const SEARCH_OPERATIONS = [
  'init',
  'scan-start',
  'scan-compare',
  'scan-next',
  'found',
  'not-found',
  'binary-init',
  'binary-mid',
  'binary-compare',
  'binary-exclude-right',
  'binary-exclude-left',
  'binary-found',
  'binary-not-found',
  'invalid',
] as const;
export type SearchOperation = (typeof SEARCH_OPERATIONS)[number];

export const SEARCH_PHASES = ['init', 'scan', 'compare', 'narrow', 'found', 'failed', 'invalid'] as const;
export type SearchPhase = (typeof SEARCH_PHASES)[number];

const SEARCH_OPS_BY_ALGORITHM: Record<SearchAlgorithm, readonly SearchOperation[]> = {
  linear: ['init', 'scan-start', 'scan-compare', 'scan-next', 'found', 'not-found'],
  binary: [
    'init',
    'binary-init',
    'binary-mid',
    'binary-compare',
    'binary-exclude-right',
    'binary-exclude-left',
    'binary-found',
    'binary-not-found',
    'invalid',
  ],
};

const SEARCH_PHASE_BY_OPERATION: Record<SearchOperation, SearchPhase> = {
  init: 'init',
  'scan-start': 'scan',
  'scan-compare': 'compare',
  'scan-next': 'scan',
  found: 'found',
  'not-found': 'failed',
  'binary-init': 'init',
  'binary-mid': 'scan',
  'binary-compare': 'compare',
  'binary-exclude-right': 'narrow',
  'binary-exclude-left': 'narrow',
  'binary-found': 'found',
  'binary-not-found': 'failed',
  invalid: 'invalid',
};

export const SEARCH_LIMITS = {
  MAX_VALUES: 32,
  MAX_ABS_VALUE: 1_000_000_000_000,
} as const;

export const searchElementSchema = z.object({
  id: z.string().regex(/^p\d+$/, 'search ids must be p0, p1, ...'),
  value: z.number().finite().min(-SEARCH_LIMITS.MAX_ABS_VALUE).max(SEARCH_LIMITS.MAX_ABS_VALUE),
});
export type SearchElement = z.infer<typeof searchElementSchema>;

export const searchRangeSchema = z.object({
  low: z.number().int().nonnegative().max(SEARCH_LIMITS.MAX_VALUES - 1),
  high: z.number().int().min(-1).max(SEARCH_LIMITS.MAX_VALUES - 1),
});
export type SearchRange = z.infer<typeof searchRangeSchema>;

export const searchComparisonSchema = z.enum(['equal', 'less', 'greater']);
export type SearchComparison = z.infer<typeof searchComparisonSchema>;

export const searchSnapshotSchema = z
  .object({
    kind: z.literal('search'),
    algorithm: z.enum(SEARCH_ALGORITHMS),
    operation: z.enum(SEARCH_OPERATIONS),
    elements: z.array(searchElementSchema).max(SEARCH_LIMITS.MAX_VALUES),
    target: z.number().finite().min(-SEARCH_LIMITS.MAX_ABS_VALUE).max(SEARCH_LIMITS.MAX_ABS_VALUE),
    phase: z.enum(SEARCH_PHASES),
    index: z.number().int().nonnegative().max(SEARCH_LIMITS.MAX_VALUES - 1).nullable().default(null),
    left: z.number().int().nonnegative().max(SEARCH_LIMITS.MAX_VALUES).nullable().default(null),
    right: z.number().int().min(-1).max(SEARCH_LIMITS.MAX_VALUES - 1).nullable().default(null),
    mid: z.number().int().nonnegative().max(SEARCH_LIMITS.MAX_VALUES - 1).nullable().default(null),
    checked: z
      .array(z.number().int().nonnegative().max(SEARCH_LIMITS.MAX_VALUES - 1))
      .max(SEARCH_LIMITS.MAX_VALUES)
      .default([]),
    range: searchRangeSchema.nullable().default(null),
    comparison: searchComparisonSchema.nullable().default(null),
    matched: z.boolean().nullable().default(null),
    result: z.number().int().min(-1).max(SEARCH_LIMITS.MAX_VALUES - 1).nullable().default(null),
    found: z.boolean().nullable().default(null),
    reason: z.enum(['unsorted']).nullable().default(null),
  })
  .superRefine((snapshot, ctx) => {
    const add = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
    const n = snapshot.elements.length;
    const values = snapshot.elements.map((element) => element.value);

    if (!SEARCH_OPS_BY_ALGORITHM[snapshot.algorithm].includes(snapshot.operation)) {
      add(['operation'], `operation "${snapshot.operation}" is not valid for ${snapshot.algorithm}`);
    }
    if (snapshot.phase !== SEARCH_PHASE_BY_OPERATION[snapshot.operation]) {
      add(['phase'], `phase "${snapshot.phase}" does not match operation "${snapshot.operation}"`);
    }
    snapshot.elements.forEach((element, index) => {
      if (element.id !== `p${index}`) add(['elements', index, 'id'], 'search ids must be p0..p(n-1) in order');
    });

    const validIndex = (value: number | null) => value === null || (value >= 0 && value < n);
    if (!validIndex(snapshot.index)) add(['index'], 'index must be a real array index or null');
    if (snapshot.result !== null && (snapshot.result < -1 || snapshot.result >= n)) {
      add(['result'], 'result must be -1, null or a real array index');
    }
    const checkedOk =
      snapshot.checked.every((value) => value >= 0 && value < n) &&
      new Set(snapshot.checked).size === snapshot.checked.length &&
      snapshot.checked.every((value, index) => index === 0 || value > snapshot.checked[index - 1]!);
    if (!checkedOk) add(['checked'], 'checked must be unique, increasing real indices');
    const rangeOk =
      snapshot.range === null ||
      (snapshot.range.low <= snapshot.range.high &&
        snapshot.range.low >= 0 &&
        snapshot.range.high >= 0 &&
        snapshot.range.high < n);
    if (!rangeOk) add(['range'], 'range must be a non-empty inclusive range or null');

    const checkedPrefix = (length: number) =>
      snapshot.checked.length === length && snapshot.checked.every((value, index) => value === index);
    const rangeEquals = (low: number, high: number) =>
      snapshot.range !== null && snapshot.range.low === low && snapshot.range.high === high;
    const isAscending = values.every((value, index) => index === 0 || values[index - 1]! <= value);

    if (snapshot.algorithm === 'linear') {
      if (snapshot.left !== null || snapshot.right !== null || snapshot.mid !== null) {
        add(['left'], 'linear search has no binary boundaries');
      }
      if (snapshot.range !== null) add(['range'], 'linear search has no binary range');
      if (snapshot.reason !== null) add(['reason'], 'linear search has no invalid reason');
      if (snapshot.comparison !== null) add(['comparison'], 'linear search reports equality only');
      switch (snapshot.operation) {
        case 'init':
          if (snapshot.index !== null || snapshot.result !== null || snapshot.found !== null || snapshot.matched !== null) {
            add(['operation'], 'init carries no index, result or match');
          }
          if (!checkedPrefix(0)) add(['checked'], 'init has checked nothing');
          break;
        case 'scan-start':
          if (n === 0 || snapshot.index !== 0) add(['index'], 'scan-start begins at index 0 of a non-empty array');
          if (!checkedPrefix(0)) add(['checked'], 'scan-start has checked nothing');
          if (snapshot.result !== null || snapshot.found !== null || snapshot.matched !== null) {
            add(['operation'], 'scan-start is not terminal');
          }
          break;
        case 'scan-compare':
          if (n === 0 || snapshot.index === null) add(['index'], 'scan-compare needs a current index');
          if (snapshot.index !== null && !checkedPrefix(snapshot.index)) {
            add(['checked'], 'scan-compare has checked exactly the slots before the current index');
          }
          if (snapshot.index !== null) {
            const equal = values[snapshot.index] === snapshot.target;
            if (snapshot.matched !== equal) add(['matched'], 'matched must equal the real comparison');
          }
          if (snapshot.result !== null || snapshot.found !== null) add(['operation'], 'scan-compare is not terminal');
          break;
        case 'scan-next':
          if (snapshot.index === null || snapshot.index <= 0 || snapshot.index >= n) {
            add(['index'], 'scan-next advances to a real next index');
          }
          if (snapshot.index !== null && !checkedPrefix(snapshot.index)) {
            add(['checked'], 'scan-next marks every slot before the next index checked');
          }
          if (snapshot.result !== null || snapshot.found !== null || snapshot.matched !== null) {
            add(['operation'], 'scan-next is not terminal');
          }
          break;
        case 'found':
          if (snapshot.index === null || values[snapshot.index] !== snapshot.target) {
            add(['index'], 'found must point at a real matching slot');
          }
          if (snapshot.result !== snapshot.index || snapshot.found !== true || snapshot.matched !== true) {
            add(['result'], 'found must report the matching index and a true match');
          }
          if (snapshot.index !== null && !checkedPrefix(snapshot.index)) {
            add(['checked'], 'found has checked exactly the slots before the match');
          }
          break;
        case 'not-found':
          if (snapshot.index !== null || snapshot.result !== -1 || snapshot.found !== false) {
            add(['result'], 'not-found needs no index, result -1 and found false');
          }
          if (!checkedPrefix(n)) add(['checked'], 'not-found has checked every slot');
          break;
        default:
          break;
      }
      return;
    }

    // Binary search: every non-invalid frame must have a sorted array.
    if (n > 0 && !isAscending) {
      if (snapshot.operation !== 'invalid') add(['elements'], 'binary search requires a nondecreasing array');
    }
    if (snapshot.checked.length > 0) add(['checked'], 'binary search does not report a checked prefix');

    if (snapshot.operation === 'invalid') {
      if (snapshot.reason !== 'unsorted') add(['reason'], 'invalid binary search must state why');
      if (isAscending) add(['reason'], 'invalid is only emitted for an unsorted array');
      if (
        snapshot.left !== null ||
        snapshot.right !== null ||
        snapshot.mid !== null ||
        snapshot.range !== null ||
        snapshot.index !== null ||
        snapshot.result !== null ||
        snapshot.found !== null ||
        snapshot.matched !== null ||
        snapshot.comparison !== null
      ) {
        add(['operation'], 'invalid carries no search progress');
      }
      return;
    }
    if (snapshot.reason !== null) add(['reason'], 'reason is reserved for invalid input');
    if (snapshot.left === null || snapshot.right === null) {
      add(['left'], 'binary search needs both boundaries');
      return;
    }
    const left = snapshot.left;
    const right = snapshot.right;
    const empty = left > right;

    if (snapshot.operation === 'binary-init') {
      if (left !== 0 || right !== n - 1) add(['right'], 'binary-init starts with the full [0, n-1] range');
      if (n > 0 ? !rangeEquals(0, n - 1) : snapshot.range !== null) add(['range'], 'binary-init range must be the full array');
      if (snapshot.mid !== null || snapshot.index !== null || snapshot.result !== null || snapshot.found !== null) {
        add(['operation'], 'binary-init carries no midpoint or result');
      }
      if (snapshot.comparison !== null || snapshot.matched !== null) add(['comparison'], 'binary-init has not compared');
    }

    if (snapshot.operation === 'binary-not-found') {
      if (left !== right + 1) add(['right'], 'binary-not-found ends with left == right + 1');
      if (snapshot.range !== null) add(['range'], 'binary-not-found has no live range');
      if (snapshot.mid !== null || snapshot.index !== null || snapshot.result !== -1 || snapshot.found !== false) {
        add(['result'], 'binary-not-found reports an empty interval and result -1');
      }
      if (snapshot.comparison !== null || snapshot.matched !== null) add(['comparison'], 'binary-not-found has no comparison');
    }

    if (snapshot.operation === 'binary-mid' || snapshot.operation === 'binary-compare' || snapshot.operation === 'binary-found') {
      if (empty) add(['right'], `${snapshot.operation} cannot run on an empty interval`);
      if (!rangeEquals(left, right)) add(['range'], 'live binary range must equal [left, right]');
      if (snapshot.mid === null || snapshot.mid < left || snapshot.mid > right) {
        add(['mid'], 'mid must be inside the live interval');
      } else if (snapshot.mid !== Math.floor((left + right) / 2)) {
        add(['mid'], 'mid must be the real floor((left + right) / 2)');
      }
    }

    if (snapshot.operation === 'binary-mid') {
      if (snapshot.index !== null || snapshot.result !== null || snapshot.found !== null) {
        add(['operation'], 'binary-mid carries no result');
      }
      if (snapshot.comparison !== null || snapshot.matched !== null) add(['comparison'], 'binary-mid has not compared');
    }

    if (snapshot.operation === 'binary-compare') {
      if (snapshot.mid === null) return;
      const value = values[snapshot.mid]!;
      const expected = value === snapshot.target ? 'equal' : value < snapshot.target ? 'less' : 'greater';
      if (snapshot.comparison !== expected) add(['comparison'], 'comparison must equal the real arr[mid] vs target relation');
      if (snapshot.matched !== (expected === 'equal')) add(['matched'], 'matched must equal the real comparison');
      if (snapshot.index !== null || snapshot.result !== null || snapshot.found !== null) {
        add(['operation'], 'binary-compare is not terminal');
      }
    }

    if (snapshot.operation === 'binary-exclude-right') {
      if (snapshot.mid === null || snapshot.mid < left || snapshot.mid > right + 1) {
        add(['mid'], 'exclude-right keeps the real inspected midpoint');
      } else {
        if (values[snapshot.mid]! <= snapshot.target) add(['mid'], 'exclude-right only removes a midpoint greater than target');
        if (right !== snapshot.mid - 1) add(['right'], 'exclude-right must set right = mid - 1');
        if (left > snapshot.mid) add(['left'], 'exclude-right leaves left at or before the inspected midpoint');
      }
      if (left <= right ? !rangeEquals(left, right) : snapshot.range !== null) {
        add(['range'], 'exclude-right range must be the new live interval or null');
      }
      if (snapshot.index !== null || snapshot.result !== null || snapshot.found !== null) add(['operation'], 'exclude-right is not terminal');
      if (snapshot.comparison !== 'greater' || snapshot.matched !== false) {
        add(['comparison'], 'exclude-right records arr[mid] > target');
      }
    }

    if (snapshot.operation === 'binary-exclude-left') {
      if (snapshot.mid === null || left !== snapshot.mid + 1 || right < snapshot.mid) {
        add(['left'], 'exclude-left must set left = mid + 1 with the inspected mid inside the old range');
      } else {
        if (values[snapshot.mid]! >= snapshot.target) add(['mid'], 'exclude-left only removes a midpoint smaller than target');
      }
      if (left <= right ? !rangeEquals(left, right) : snapshot.range !== null) {
        add(['range'], 'exclude-left range must be the new live interval or null');
      }
      if (snapshot.index !== null || snapshot.result !== null || snapshot.found !== null) add(['operation'], 'exclude-left is not terminal');
      if (snapshot.comparison !== 'less' || snapshot.matched !== false) {
        add(['comparison'], 'exclude-left records arr[mid] < target');
      }
    }

    if (snapshot.operation === 'binary-found') {
      if (snapshot.mid === null || values[snapshot.mid] !== snapshot.target) {
        add(['mid'], 'binary-found points at a real matching midpoint');
      }
      if (snapshot.index !== snapshot.mid || snapshot.result !== snapshot.mid || snapshot.found !== true) {
        add(['result'], 'binary-found reports the matching midpoint');
      }
      if (snapshot.comparison !== 'equal' || snapshot.matched !== true) {
        add(['comparison'], 'binary-found records equality');
      }
    }
  });
export type SearchSnapshot = z.infer<typeof searchSnapshotSchema>;

/** Stage 7B stack/queue + Stage 7C linked-list + L1A doubly/circular linked lists + L1B sequential list + Stage 7D binary-tree + T1 BST + T2 AVL + T3 max-heap + T4 Huffman + S1/S2 sorting + F1 search + F2 hash + Stage 7E/7F/G1/G2/G3/G4 graphs. */
export const structureSchema = z.union([
  kmpSnapshotSchema,
  sparseTransposeSnapshotSchema,
  sortingSnapshotSchema,
  searchSnapshotSchema,
  hashSnapshotSchema,
  sequentialListSnapshotSchema,
  huffmanSnapshotSchema,
  maxHeapSnapshotSchema,
  structureSnapshotSchema,
  linkedListSnapshotSchema,
  doublyLinkedListSnapshotSchema,
  circularLinkedListSnapshotSchema,
  binaryTreeSnapshotSchema,
  bstSnapshotSchema,
  avlSnapshotSchema,
  btreeSnapshotSchema,
  graphSnapshotSchema,
  weightedGraphSnapshotSchema,
  floydWarshallSnapshotSchema,
  bellmanFordSnapshotSchema,
  primMstSnapshotSchema,
  kruskalMstSnapshotSchema,
  topologicalSortSnapshotSchema,
  criticalPathSnapshotSchema,
  connectedComponentsSnapshotSchema,
  kosarajuSnapshotSchema,
]);
export type AnyStructureSnapshot = z.infer<typeof structureSchema>;

/** One variable snapshot captured at a step. `type` is a free-form label. */
export const variableSnapshotSchema = z.object({
  name: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  type: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  value: jsonValueSchema.refine(
    (value) => JSON.stringify(value).length <= LIMITS.MAX_VARIABLE_VALUE_JSON_BYTES,
    'variable value too large',
  ),
  scope: z.string().max(LIMITS.MAX_NAME_CHARS).optional(),
});
export type VariableSnapshot = z.infer<typeof variableSnapshotSchema>;

/** Source position. `line` is 1-based and required; `column` is optional. */
export const sourceLocationSchema = z.object({
  line: z.number().int().positive(),
  column: z.number().int().positive().optional(),
});
export type SourceLocation = z.infer<typeof sourceLocationSchema>;

/**
 * Lifecycle status of a call frame. A frame is `running` from entry until its
 * function is about to return; the runner flips it to `returning` for the
 * return event (so the panel can show the real return value) and then removes
 * it from the stack. `returned` is reserved for future async/awaited frames.
 */
export const CALL_FRAME_STATUS = ['running', 'returning', 'returned'] as const;
export type CallFrameStatus = (typeof CALL_FRAME_STATUS)[number];

/**
 * A call-stack frame. Stage 1 only carried `name` / `line`; Stage 3 extends it
 * backwards-compatibly with the fields a real recursion trace needs. Every new
 * field is optional, so legacy `{name, line}` frames and events without a
 * callStack keep validating unchanged.
 *
 * Invariants the runner must uphold (enforced at capture, not by Zod alone):
 *  - distinct frames get distinct `frameId`s, even for the same function name
 *  - `locals`/`arguments` are deep JSON snapshots (never live object refs)
 *  - `returnValue` is set only for `returning`/`returned` frames
 */
export const callFrameSchema = z.object({
  /** Function name. Required for every frame (kept for Stage-1 compatibility). */
  name: z.string().min(1).max(LIMITS.MAX_NAME_CHARS),
  /** Stable unique id for THIS invocation (same function recursing → new id). */
  frameId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).optional(),
  /** 1-based source line the frame currently executes (legacy field). */
  line: z.number().int().positive().optional(),
  /** Recursion depth (0 = outermost call). */
  depth: z.number().int().nonnegative().optional(),
  /** Call-argument snapshot. */
  arguments: z.array(variableSnapshotSchema).max(LIMITS.MAX_VARIABLES).optional(),
  /** This frame's local-variable snapshot (independent per depth). */
  locals: z.array(variableSnapshotSchema).max(LIMITS.MAX_VARIABLES).optional(),
  /** Real return value once the frame starts returning. */
  returnValue: jsonValueSchema
    .refine(
      (value) => JSON.stringify(value).length <= LIMITS.MAX_VARIABLE_VALUE_JSON_BYTES,
      'return value too large',
    )
    .optional(),
  status: z.enum(CALL_FRAME_STATUS).optional(),
});
export type CallFrame = z.infer<typeof callFrameSchema>;

export const traceEventSchema = z.object({
  schemaVersion: z.literal(TRACE_SCHEMA_VERSION),
  /** 0-based position within the trace. */
  step: z.number().int().nonnegative(),
  eventType: z.enum(EVENT_TYPES),
  visualType: z.enum(VISUAL_TYPES),
  /** Visual state payload; the renderer reads `state.type` as the source of truth. */
  state: z.record(jsonValueSchema).refine(
    (state) => JSON.stringify(state).length <= LIMITS.MAX_STATE_JSON_BYTES,
    'state too large',
  ),
  message: z.string().max(LIMITS.MAX_MESSAGE_CHARS),
  sourceLocation: sourceLocationSchema.optional(),
  variables: z.array(variableSnapshotSchema).max(LIMITS.MAX_VARIABLES).optional(),
  callStack: z.array(callFrameSchema).max(LIMITS.MAX_CALL_STACK).optional(),
  /**
   * Stage 3B: teaching stage this frame belongs to, as recorded by the runner
   * (Python `trace(..., lesson_step="compare")`). Never inferred from message
   * text. Optional and additive, so every Stage-1/2/3 event still validates.
   */
  lessonStepId: z.string().min(1).max(LIMITS.MAX_NAME_CHARS).optional(),
  /**
   * Stage 7B: optional, validated stack/queue semantics recorded by the runner.
   * Absent on all legacy traces; absence means "render the legacy node view".
   */
  structure: structureSchema.optional(),
});
export type TraceEvent = z.infer<typeof traceEventSchema>;

export const traceDocumentSchema = z.object({
  schemaVersion: z.literal(TRACE_SCHEMA_VERSION),
  /** Source-code snapshot that produced these events (for source-consistency). */
  source: z.string().max(LIMITS.MAX_SOURCE_CHARS).optional(),
  events: z.array(traceEventSchema).min(1).max(LIMITS.MAX_EVENTS),
});
export type TraceDocument = z.infer<typeof traceDocumentSchema>;

export type ValidationResult =
  | { ok: true; document: TraceDocument }
  | { ok: false; errors: string[] };

/** Flatten a Zod issue into a human-readable message. */
function describeIssues(issues: z.ZodIssue[]): string[] {
  return issues.map((issue) => {
    const path = issue.path.length ? issue.path.join('.') : '(root)';
    return `${path}: ${issue.message}`;
  });
}

/**
 * Validate a raw trace document. Returns structured errors instead of throwing,
 * so an invalid (or malicious) trace can never take down the page.
 */
export function parseTraceDocument(value: unknown): ValidationResult {
  const parsed = traceDocumentSchema.safeParse(value);
  if (!parsed.success) {
    return { ok: false, errors: describeIssues(parsed.error.issues) };
  }
  if (JSON.stringify(parsed.data).length > LIMITS.MAX_TOTAL_JSON_BYTES) {
    return { ok: false, errors: ['(root): total trace payload exceeds size limit'] };
  }
  return { ok: true, document: parsed.data };
}
