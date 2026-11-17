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
  'init', 'enter', 'visit', 'left', 'right', 'return', 'done',
] as const;
export type BinaryTreeOperation = (typeof BINARY_TREE_OPERATIONS)[number];

export const BINARY_TREE_TRAVERSALS = ['preorder', 'inorder', 'postorder'] as const;
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
  });
export type BinaryTreeSnapshot = z.infer<typeof binaryTreeSnapshotSchema>;

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

/** Stage 7B stack/queue + Stage 7C linked-list + Stage 7D binary-tree + Stage 7E graph. */
export const structureSchema = z.union([
  structureSnapshotSchema,
  linkedListSnapshotSchema,
  binaryTreeSnapshotSchema,
  graphSnapshotSchema,
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
