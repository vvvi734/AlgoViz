import { z } from 'zod';

/**
 * TEXTBOOK-06: in-order threaded binary tree.
 *
 * The snapshot records the real node objects after each executed statement:
 *  - `leftId` / `rightId` are real child links (never thread links);
 *  - `ltag` / `rtag` record whether that pointer is a thread (1) or a child (0);
 *  - `leftThreadId` / `rightThreadId` record the predecessor/successor target.
 *
 * Threading is observed in `thread`; traversal over the finished threads is
 * observed in `traverse`. Nothing is inferred from messages or node positions.
 */

export const THREADED_TREE_OPERATIONS = [
  'init',
  'enter',
  'thread-left',
  'thread-right',
  'thread-last',
  'return',
  'thread-complete',
  'start',
  'visit',
  'follow-thread',
  'descend-left',
  'done',
] as const;
export type ThreadedTreeOperation = (typeof THREADED_TREE_OPERATIONS)[number];

export const THREADED_TREE_PHASES = ['thread', 'traverse', 'done'] as const;
export type ThreadedTreePhase = (typeof THREADED_TREE_PHASES)[number];

const ID = z.string().min(1).max(64);

export const threadedTreeNodeSchema = z.object({
  id: ID,
  value: z.union([z.string().max(64), z.number(), z.boolean(), z.null()]),
  leftId: ID.nullable(),
  rightId: ID.nullable(),
  ltag: z.union([z.literal(0), z.literal(1)]),
  rtag: z.union([z.literal(0), z.literal(1)]),
  leftThreadId: ID.nullable(),
  rightThreadId: ID.nullable(),
});
export type ThreadedTreeNode = z.infer<typeof threadedTreeNodeSchema>;

export const threadedTreeSnapshotSchema = z
  .object({
    kind: z.literal('threaded-tree'),
    phase: z.enum(THREADED_TREE_PHASES),
    operation: z.enum(THREADED_TREE_OPERATIONS),
    rootId: ID.nullable(),
    nodes: z.array(threadedTreeNodeSchema).min(1).max(31),
    currentNodeId: ID.nullable(),
    prevId: ID.nullable(),
    visitedIds: z.array(ID).max(31),
    threadedCount: z.number().int().nonnegative(),
  })
  .superRefine((snapshot, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });

    const ids = new Set<string>();
    const byId = new Map<string, ThreadedTreeNode>();
    snapshot.nodes.forEach((node, index) => {
      if (ids.has(node.id)) issue(['nodes', index, 'id'], `duplicate node id "${node.id}"`);
      ids.add(node.id);
      byId.set(node.id, node);
    });

    if (snapshot.rootId === null || !ids.has(snapshot.rootId)) {
      issue(['rootId'], 'rootId must refer to a real node');
    }

    const parents = new Map<string, number>();
    snapshot.nodes.forEach((node, index) => {
      for (const key of ['leftId', 'rightId'] as const) {
        const child = node[key];
        if (child !== null) {
          if (!ids.has(child)) issue(['nodes', index, key], `${key} "${child}" does not refer to a node`);
          parents.set(child, (parents.get(child) ?? 0) + 1);
        }
        const tag = key === 'leftId' ? node.ltag : node.rtag;
        if (child !== null && tag !== 0) issue(['nodes', index], `${key} must have tag 0 while it points to a child`);
      }
      for (const key of ['leftThreadId', 'rightThreadId'] as const) {
        const target = node[key];
        if (target !== null && !ids.has(target)) {
          issue(['nodes', index, key], `${key} "${target}" does not refer to a node`);
        }
      }
    });

    // Every real node has at most one parent, and the root has none.
    for (const [id, count] of parents) {
      if (count > 1) issue(['nodes'], `node "${id}" has multiple parents`);
    }
    if (snapshot.rootId !== null && (parents.get(snapshot.rootId) ?? 0) > 0) {
      issue(['rootId'], 'the root must not have a parent');
    }

    // Real child links must form exactly one acyclic tree reachable from root.
    const seen = new Set<string>();
    const stack = [snapshot.rootId as string];
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
    if (cycle) issue(['nodes'], 'cyclic real-child reference detected');
    if (seen.size !== snapshot.nodes.length) issue(['nodes'], 'every node must be reachable from the root');

    if (snapshot.currentNodeId !== null && !ids.has(snapshot.currentNodeId)) {
      issue(['currentNodeId'], 'currentNodeId must refer to a node');
    }
    if (snapshot.prevId !== null && !ids.has(snapshot.prevId)) {
      issue(['prevId'], 'prevId must refer to a node');
    }

    const visited = new Set<string>();
    snapshot.visitedIds.forEach((id, index) => {
      if (!ids.has(id)) issue(['visitedIds', index], `visited id "${id}" does not refer to a node`);
      if (visited.has(id)) issue(['visitedIds', index], `visitedIds contains duplicate "${id}"`);
      visited.add(id);
    });

    const nullPointers = snapshot.nodes.reduce(
      (count, node) => count + (node.leftId === null ? 1 : 0) + (node.rightId === null ? 1 : 0),
      0,
    );
    if (snapshot.threadedCount > nullPointers) {
      issue(['threadedCount'], 'threadedCount cannot exceed the number of null child pointers');
    }

    const threadedPointers = snapshot.nodes.reduce(
      (count, node) => count + node.ltag + node.rtag,
      0,
    );
    if (snapshot.threadedCount !== threadedPointers) {
      issue(['threadedCount'], 'threadedCount must equal the real tagged pointer count');
    }

    if (snapshot.phase === 'traverse' || snapshot.phase === 'done') {
      for (const [index, node] of snapshot.nodes.entries()) {
        if (node.leftId === null && node.ltag !== 1) {
          issue(['nodes', index, 'ltag'], 'a finished tree must tag every null left pointer');
        }
        if (node.rightId === null && node.rtag !== 1) {
          issue(['nodes', index, 'rtag'], 'a finished tree must tag every null right pointer');
        }
      }
      if (snapshot.threadedCount !== nullPointers) {
        issue(['threadedCount'], 'a finished tree must thread every null child pointer');
      }
    }

    const threadOperations: ReadonlySet<ThreadedTreeOperation> = new Set([
      'init', 'enter', 'thread-left', 'thread-right', 'thread-last', 'return', 'thread-complete',
    ]);
    const traverseOperations: ReadonlySet<ThreadedTreeOperation> = new Set([
      'thread-complete', 'start', 'visit', 'follow-thread', 'descend-left', 'done',
    ]);
    if (snapshot.phase === 'thread' && !threadOperations.has(snapshot.operation)) {
      issue(['operation'], `${snapshot.operation} is not a threading operation`);
    }
    if (snapshot.phase === 'traverse' && !traverseOperations.has(snapshot.operation)) {
      issue(['operation'], `${snapshot.operation} is not a traversal operation`);
    }

    if (snapshot.operation === 'init') {
      if (snapshot.phase !== 'thread') issue(['phase'], 'init belongs to the threading phase');
      if (snapshot.currentNodeId !== null || snapshot.prevId !== null || snapshot.visitedIds.length > 0) {
        issue(['currentNodeId'], 'init must not carry a cursor or visits');
      }
      if (snapshot.threadedCount !== 0) issue(['threadedCount'], 'init must start with no threads');
    }
    if (snapshot.operation === 'enter' || snapshot.operation === 'return') {
      if (snapshot.currentNodeId === null) issue(['currentNodeId'], `${snapshot.operation} must name the current node`);
    }
    if (snapshot.operation === 'thread-left') {
      const current = snapshot.currentNodeId ? byId.get(snapshot.currentNodeId) : undefined;
      if (!current) issue(['currentNodeId'], 'thread-left must name the current node');
      else {
        if (current.leftId !== null) issue(['operation'], 'thread-left requires a null real left child');
        if (current.ltag !== 1) issue(['operation'], 'thread-left requires the left tag to be 1');
      }
    }
    if (snapshot.operation === 'thread-right') {
      const prev = snapshot.prevId ? byId.get(snapshot.prevId) : undefined;
      if (!prev) issue(['prevId'], 'thread-right must record the predecessor');
      else {
        if (prev.rightId !== null) issue(['operation'], 'thread-right requires a null real right child');
        if (prev.rtag !== 1) issue(['operation'], 'thread-right requires the right tag to be 1');
        if (prev.rightThreadId !== snapshot.currentNodeId) {
          issue(['operation'], 'thread-right must point the predecessor at the current node');
        }
      }
    }
    if (snapshot.operation === 'thread-last') {
      const current = snapshot.currentNodeId ? byId.get(snapshot.currentNodeId) : undefined;
      if (!current) issue(['currentNodeId'], 'thread-last must name the last in-order node');
      else {
        if (current.rightId !== null) issue(['operation'], 'thread-last requires a null real right child');
        if (current.rtag !== 1 || current.rightThreadId !== null) {
          issue(['operation'], 'thread-last must tag the null successor');
        }
      }
    }
    if (snapshot.operation === 'thread-complete') {
      if (snapshot.phase !== 'traverse') issue(['phase'], 'thread-complete opens the traversal phase');
      if (snapshot.currentNodeId !== null || snapshot.visitedIds.length > 0) {
        issue(['currentNodeId'], 'thread-complete must not carry a traversal cursor');
      }
    }
    if (snapshot.operation === 'start') {
      if (snapshot.phase !== 'traverse') issue(['phase'], 'start belongs to traversal');
      if (snapshot.currentNodeId === null) issue(['currentNodeId'], 'start must name the first in-order node');
      if (snapshot.visitedIds.length > 0) issue(['visitedIds'], 'start must not have visited a node yet');
    }
    if (snapshot.operation === 'visit') {
      if (snapshot.currentNodeId === null) issue(['currentNodeId'], 'visit must name the current node');
      if (
        snapshot.currentNodeId !== null &&
        snapshot.visitedIds[snapshot.visitedIds.length - 1] !== snapshot.currentNodeId
      ) {
        issue(['visitedIds'], 'visit must append the current node as the latest visit');
      }
    }
    if (snapshot.operation === 'follow-thread' || snapshot.operation === 'descend-left') {
      if (snapshot.currentNodeId === null) issue(['currentNodeId'], `${snapshot.operation} must name the next node`);
    }
    if (snapshot.operation === 'done') {
      if (snapshot.phase !== 'done') issue(['phase'], 'done must use the done phase');
      if (snapshot.currentNodeId !== null) issue(['currentNodeId'], 'done must clear the cursor');
      if (snapshot.visitedIds.length !== snapshot.nodes.length) {
        issue(['visitedIds'], 'done must visit every node exactly once');
      }
    }
  });

export type ThreadedTreeSnapshot = z.infer<typeof threadedTreeSnapshotSchema>;
