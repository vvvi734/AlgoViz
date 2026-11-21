/**
 * TEXTBOOK-10: tournament (tree-selection) sort snapshots.
 *
 * Records are placed on complete-tree leaves (padded to a power of two), and
 * every internal node stores the winning record of its subtree. Comparison is
 * by `(value, originalIndex)`, so equal keys keep their original order. After
 * one winner is emitted, only the leaf-to-root path is recomputed. The schema
 * enforces the power-of-two shape, real child links, the winner invariant and a
 * sorted-prefix output at every frame.
 */
import { z } from 'zod';

const NODE_ID = z.string().min(1).max(24);
const RECORD_ID = z.string().regex(/^[A-P]$/);
export const TOURNAMENT_MAX_RECORDS = 12;
export const TOURNAMENT_MAX_LEAVES = 16;
export const TOURNAMENT_MAX_NODES = 31;

export const TOURNAMENT_OPERATIONS = [
  'init', 'build', 'select', 'output', 'update', 'done',
] as const;
export type TournamentOperation = (typeof TOURNAMENT_OPERATIONS)[number];

export const TOURNAMENT_RESULTS = ['sorted'] as const;
export type TournamentResult = (typeof TOURNAMENT_RESULTS)[number];

export const tournamentRecordSchema = z.object({
  id: RECORD_ID,
  value: z.number().int().min(-1_000_000).max(1_000_000),
  originalIndex: z.number().int().min(0).max(TOURNAMENT_MAX_RECORDS - 1),
  leafId: NODE_ID,
  active: z.boolean(),
});
export type TournamentRecord = z.infer<typeof tournamentRecordSchema>;

export const tournamentNodeSchema = z.object({
  id: NODE_ID,
  level: z.number().int().min(0).max(4),
  slot: z.number().int().min(0).max(TOURNAMENT_MAX_LEAVES - 1),
  leaf: z.boolean(),
  filled: z.boolean(),
  recordId: RECORD_ID.nullable(),
  leftId: NODE_ID.nullable(),
  rightId: NODE_ID.nullable(),
});
export type TournamentNode = z.infer<typeof tournamentNodeSchema>;

export const tournamentSnapshotSchema = z
  .object({
    kind: z.literal('tournament'),
    preset: z.string().max(200).nullable(),
    operation: z.enum(TOURNAMENT_OPERATIONS),
    records: z.array(tournamentRecordSchema).min(1).max(TOURNAMENT_MAX_RECORDS),
    nodes: z.array(tournamentNodeSchema).min(1).max(TOURNAMENT_MAX_NODES),
    rootId: NODE_ID,
    output: z.array(RECORD_ID).max(TOURNAMENT_MAX_RECORDS),
    activeCount: z.number().int().min(0).max(TOURNAMENT_MAX_RECORDS),
    currentNodeId: NODE_ID.nullable(),
    compareIds: z.array(RECORD_ID).max(2),
    winnerId: RECORD_ID.nullable(),
    affectedNodeIds: z.array(NODE_ID).max(5),
    result: z.enum(TOURNAMENT_RESULTS).nullable(),
  })
  .superRefine((snapshot, ctx) => {
    const add = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });

    const recordsById = new Map<string, TournamentRecord>();
    snapshot.records.forEach((record, index) => {
      if (recordsById.has(record.id)) add(['records', index, 'id'], `duplicate record id "${record.id}"`);
      recordsById.set(record.id, record);
      if (record.originalIndex !== index) {
        add(['records', index, 'originalIndex'], 'records must stay in original identity order');
      }
    });
    if (new Set(snapshot.records.map((record) => record.leafId)).size !== snapshot.records.length) {
      add(['records'], 'each record needs its own leaf');
    }

    const nodesById = new Map<string, TournamentNode>();
    snapshot.nodes.forEach((node, index) => {
      if (nodesById.has(node.id)) add(['nodes', index, 'id'], `duplicate node id "${node.id}"`);
      nodesById.set(node.id, node);
      const expectedId = node.leaf ? `L${node.slot}` : `N${node.level}-${node.slot}`;
      if (node.id !== expectedId) add(['nodes', index, 'id'], `node id must be ${expectedId}`);
    });

    const leaves = snapshot.nodes.filter((node) => node.leaf);
    if (leaves.length === 0 || (leaves.length & (leaves.length - 1)) !== 0) {
      add(['nodes'], 'leaf count must be a non-empty power of two');
    }
    const leafCount = leaves.length;
    const height = Math.log2(leafCount);
    if (!Number.isInteger(height)) add(['nodes'], 'leaf count must be a power of two');
    if (leaves.length !== leafCount || new Set(leaves.map((leaf) => leaf.slot)).size !== leafCount) {
      add(['nodes'], 'leaves need contiguous slots');
    }
    for (let slot = 0; slot < leafCount; slot += 1) {
      if (!leaves.some((leaf) => leaf.slot === slot)) add(['nodes'], `missing leaf slot ${slot}`);
    }

    const expectedRootId = leafCount === 1 ? 'L0' : `N${height}-0`;
    if (snapshot.rootId !== expectedRootId) {
      add(['rootId'], `root must be ${leafCount === 1 ? 'the single leaf' : 'the unique top node'}`);
    }
    const root = nodesById.get(snapshot.rootId);
    const expectedNodeCount = leafCount * 2 - 1;
    if (snapshot.nodes.length !== expectedNodeCount) {
      add(['nodes'], `a complete tournament tree needs ${expectedNodeCount} nodes`);
    }
    if (!root) {
      add(['rootId'], 'rootId must name a real node');
      return;
    }
    if (leafCount === 1) {
      if (!root.leaf || root.level !== 0) add(['rootId'], 'a one-leaf tree has its root at leaf L0');
    } else if (root.leaf || root.level !== height) {
      add(['rootId'], 'root must sit above every leaf');
    }

    for (const node of snapshot.nodes) {
      if (node.leaf) {
        if (node.level !== 0) add(['nodes', node.id, 'level'], 'leaves live at level 0');
        if (node.leftId !== null || node.rightId !== null) add(['nodes', node.id], 'leaves have no children');
        if (node.recordId !== null && node.filled === false) {
          add(['nodes', node.id], 'a leaf with a record must be filled');
        }
      } else {
        if (node.level < 1 || node.level > height) add(['nodes', node.id, 'level'], 'internal level out of range');
        const leftId = `L${node.slot * 2}`;
        const rightId = `L${node.slot * 2 + 1}`;
        const expectedLeft = node.level === 1 ? leftId : `N${node.level - 1}-${node.slot * 2}`;
        const expectedRight = node.level === 1 ? rightId : `N${node.level - 1}-${node.slot * 2 + 1}`;
        if (node.leftId !== expectedLeft || node.rightId !== expectedRight) {
          add(['nodes', node.id], 'internal children must be the two real lower nodes');
        }
        for (const childId of [node.leftId, node.rightId]) {
          if (childId !== null && !nodesById.has(childId)) {
            add(['nodes', node.id], `missing child "${childId}"`);
          }
        }
      }
      if (!node.filled && node.recordId !== null) {
        add(['nodes', node.id], 'an unfilled node cannot name a winner');
      }
      if (node.filled && node.recordId === null) {
        add(['nodes', node.id], 'a filled node needs a winner');
      }
      if (node.level === 0) {
        const record = node.recordId === null ? undefined : recordsById.get(node.recordId);
        if (record && record.leafId !== node.id) add(['nodes', node.id], 'leaf record is attached elsewhere');
      }
    }

    // A leaf keeps its original record for provenance even after removal, so
    // the parent comparison must ignore inactive leaves. The affected path is
    // recomputed atomically, which keeps every filled node equal to the best
    // still-active candidate in its subtree.
    const better = (leftId: string | null, rightId: string | null): string | null => {
      const candidates = [leftId, rightId]
        .filter((id): id is string => id !== null)
        .filter((id) => recordsById.get(id)?.active === true);
      if (candidates.length === 0) return null;
      return candidates.sort((a, b) => {
        const left = recordsById.get(a)!;
        const right = recordsById.get(b)!;
        return left.value - right.value || left.originalIndex - right.originalIndex;
      })[0]!;
    };
    for (const node of snapshot.nodes) {
      if (node.leaf || !node.filled) continue;
      const left = nodesById.get(node.leftId!)!;
      const right = nodesById.get(node.rightId!)!;
      const expected = better(left.recordId, right.recordId);
      if (expected === null) add(['nodes', node.id], 'a filled node needs at least one real candidate');
      if (node.recordId !== expected) {
        add(['nodes', node.id], `winner must be ${expected ?? 'none'}, got ${node.recordId ?? 'none'}`);
      }
    }

    const outputRecords = snapshot.output.map((id) => recordsById.get(id));
    if (outputRecords.some((record) => !record)) add(['output'], 'output ids must be real records');
    if (new Set(snapshot.output).size !== snapshot.output.length) add(['output'], 'output cannot repeat');
    const expectedOrder = [...snapshot.records]
      .sort((a, b) => a.value - b.value || a.originalIndex - b.originalIndex)
      .map((record) => record.id);
    if (snapshot.output.some((id, index) => expectedOrder[index] !== id)) {
      add(['output'], 'output must be a prefix of the stable sorted order');
    }
    const active = snapshot.records.filter((record) => record.active);
    if (snapshot.activeCount !== active.length) add(['activeCount'], 'activeCount must match active records');
    for (const record of snapshot.records) {
      if (!record.active && !snapshot.output.includes(record.id)) {
        add(['records'], `inactive record "${record.id}" must already be in output`);
      }
    }
    const lastOutput = snapshot.output[snapshot.output.length - 1];
    for (const id of snapshot.output.slice(0, -1)) {
      if (recordsById.get(id)!.active) add(['output'], 'only the newest output may still be active');
    }
    if (lastOutput && snapshot.operation !== 'output' && recordsById.get(lastOutput)!.active) {
      add(['output'], 'an earlier output must already be inactive');
    }

    if (snapshot.compareIds.some((id) => !recordsById.has(id))) {
      add(['compareIds'], 'comparison ids must be real records');
    }
    if (new Set(snapshot.compareIds).size !== snapshot.compareIds.length) {
      add(['compareIds'], 'comparison ids must be unique');
    }
    if (snapshot.winnerId !== null && !recordsById.has(snapshot.winnerId)) {
      add(['winnerId'], 'winner must be a real record');
    }
    if (snapshot.currentNodeId !== null && !nodesById.has(snapshot.currentNodeId)) {
      add(['currentNodeId'], 'current node is not attached');
    }
    if (snapshot.affectedNodeIds.some((id) => !nodesById.has(id))) {
      add(['affectedNodeIds'], 'affected path nodes must be attached');
    }

    if (snapshot.operation === 'init') {
      if (snapshot.output.length !== 0) add(['output'], 'init has no output');
      if (active.length !== snapshot.records.length) add(['activeCount'], 'init keeps every record active');
      if (snapshot.currentNodeId !== null || snapshot.compareIds.length !== 0 || snapshot.winnerId !== null) {
        add(['currentNodeId'], 'init has no current comparison');
      }
      if (snapshot.affectedNodeIds.length !== 0) add(['affectedNodeIds'], 'init has no affected path');
      if (snapshot.result !== null) add(['result'], 'init has no result');
      if (root.filled && leafCount > 1) add(['rootId'], 'init happens before the tree is built');
    }

    if (snapshot.operation === 'build') {
      const node = snapshot.currentNodeId === null ? undefined : nodesById.get(snapshot.currentNodeId);
      if (!node || node.leaf || !node.filled) add(['currentNodeId'], 'build needs a filled internal node');
      if (node) {
        const expectedCompare = [node.leftId, node.rightId]
          .map((id) => (id ? nodesById.get(id)?.recordId : null))
          .filter((id): id is string => Boolean(id));
        if (JSON.stringify(snapshot.compareIds) !== JSON.stringify(expectedCompare)) {
          add(['compareIds'], 'build compares the two real child winners');
        }
        if (snapshot.winnerId !== node.recordId) add(['winnerId'], 'build winner is the node winner');
      }
      if (snapshot.output.length !== 0) add(['output'], 'build happens before the first output');
      if (snapshot.affectedNodeIds.length !== 0) add(['affectedNodeIds'], 'build has no update path');
      if (snapshot.result !== null) add(['result'], 'build has no result');
    }

    if (snapshot.operation === 'select') {
      if (snapshot.currentNodeId !== snapshot.rootId) add(['currentNodeId'], 'select reads the root');
      if (snapshot.winnerId === null || snapshot.winnerId !== root.recordId) {
        add(['winnerId'], 'select names the root winner');
      }
      if (snapshot.compareIds.length !== 0) add(['compareIds'], 'select only reads the root winner');
      if (snapshot.result !== null) add(['result'], 'select has no result');
    }

    if (snapshot.operation === 'output') {
      if (lastOutput === undefined) add(['output'], 'output appends the selected winner');
      if (snapshot.winnerId !== lastOutput) add(['winnerId'], 'output and winner must agree');
      if (lastOutput && root.recordId !== lastOutput) add(['winnerId'], 'the emitted winner must still be at the root');
      if (snapshot.compareIds.length !== 0) add(['compareIds'], 'output does not compare');
      if (snapshot.result !== null) add(['result'], 'output has no result');
    }

    if (snapshot.operation === 'update') {
      if (snapshot.winnerId !== root.recordId) add(['winnerId'], 'update reports the new root winner');
      if (snapshot.currentNodeId !== snapshot.rootId) add(['currentNodeId'], 'update ends at the root');
      if (snapshot.compareIds.length !== 0) add(['compareIds'], 'update marks a path rather than one pair');
      if (snapshot.affectedNodeIds.length === 0) add(['affectedNodeIds'], 'update needs the recomputed path');
      if (snapshot.affectedNodeIds[snapshot.affectedNodeIds.length - 1] !== snapshot.rootId) {
        add(['affectedNodeIds'], 'the affected path must end at the root');
      }
      if (lastOutput === undefined || recordsById.get(lastOutput)?.active !== false) {
        add(['output'], 'update deactivates the newest output record');
      }
      const leaf = recordsById.get(lastOutput)?.leafId;
      if (!leaf) add(['affectedNodeIds'], 'the removed record needs a leaf');
      if (leaf && snapshot.affectedNodeIds[0] !== leaf) {
        add(['affectedNodeIds'], 'the affected path starts at the removed leaf');
      }
      if (snapshot.affectedNodeIds.length > 1) {
        for (let index = 1; index < snapshot.affectedNodeIds.length; index += 1) {
          const parent = nodesById.get(snapshot.affectedNodeIds[index])!;
          const child = snapshot.affectedNodeIds[index - 1];
          if (parent.leftId !== child && parent.rightId !== child) {
            add(['affectedNodeIds', index], 'path must follow parent links');
          }
        }
      }
      if (snapshot.result !== null) add(['result'], 'update has no result');
    }

    if (snapshot.operation === 'done') {
      if (snapshot.result !== 'sorted') add(['result'], 'done reports sorted');
      if (snapshot.output.length !== snapshot.records.length) add(['output'], 'done emits every record');
      if (active.length !== 0) add(['activeCount'], 'done has no active records');
      if (root.filled || root.recordId !== null) add(['rootId'], 'done leaves an empty root');
      if (snapshot.currentNodeId !== null || snapshot.compareIds.length !== 0 || snapshot.winnerId !== null) {
        add(['currentNodeId'], 'done has no current comparison');
      }
      if (snapshot.affectedNodeIds.length !== 0) add(['affectedNodeIds'], 'done has no update path');
    }
  });

export type TournamentSnapshot = z.infer<typeof tournamentSnapshotSchema>;
