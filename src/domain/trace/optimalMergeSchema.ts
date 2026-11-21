/**
 * TEXTBOOK-11: optimal k-way merge tree snapshots.
 *
 * Weights are initial-run record counts. The forest keeps every current subtree
 * root; each combine takes the k lightest roots and creates one internal node
 * whose weight is their sum. Dummy zero-weight leaves are added only when the
 * real leaf count cannot form a full k-ary tree, and they are marked virtual.
 */
import { z } from 'zod';

const NODE_ID = z.string().regex(/^[SVT][0-9]{1,2}$/);
export const OPTIMAL_MAX_SEGMENTS = 12;
export const OPTIMAL_MIN_K = 2;
export const OPTIMAL_MAX_K = 4;
export const OPTIMAL_MAX_NODES = 36;

export const OPTIMAL_OPERATIONS = ['init', 'combine', 'done'] as const;
export type OptimalOperation = (typeof OPTIMAL_OPERATIONS)[number];
export const OPTIMAL_RESULTS = ['built'] as const;

export const optimalNodeSchema = z.object({
  id: NODE_ID,
  weight: z.number().int().min(0).max(99_999),
  virtual: z.boolean(),
  leaf: z.boolean(),
  sourceIndex: z.number().int().min(0).max(OPTIMAL_MAX_SEGMENTS - 1).nullable(),
  children: z.array(NODE_ID).max(OPTIMAL_MAX_K),
});

export const optimalSnapshotSchema = z
  .object({
    kind: z.literal('merge-tree'),
    preset: z.string().max(200).nullable(),
    operation: z.enum(OPTIMAL_OPERATIONS),
    k: z.number().int().min(OPTIMAL_MIN_K).max(OPTIMAL_MAX_K),
    segmentWeights: z.array(z.number().int().min(1).max(999)).min(1).max(OPTIMAL_MAX_SEGMENTS),
    nodes: z.array(optimalNodeSchema).min(1).max(OPTIMAL_MAX_NODES),
    forestIds: z.array(NODE_ID).min(1).max(OPTIMAL_MAX_NODES),
    selectedIds: z.array(NODE_ID).max(OPTIMAL_MAX_K),
    newNodeId: NODE_ID.nullable(),
    costAdded: z.number().int().min(0).max(99_999),
    totalCost: z.number().int().min(0).max(99_999),
    combines: z.number().int().min(0).max(OPTIMAL_MAX_NODES),
    result: z.enum(OPTIMAL_RESULTS).nullable(),
  })
  .superRefine((snapshot, ctx) => {
    const add = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
    const nodes = new Map<string, z.infer<typeof optimalNodeSchema>>();
    snapshot.nodes.forEach((node, index) => {
      if (nodes.has(node.id)) add(['nodes', index, 'id'], `duplicate node id "${node.id}"`);
      nodes.set(node.id, node);
    });
    if (nodes.size !== snapshot.nodes.length) add(['nodes'], 'node ids must be unique');

    const realSegments = snapshot.segmentWeights.length;
    const dummyCount = ((snapshot.k - 1) - ((realSegments - 1) % (snapshot.k - 1))) %
      (snapshot.k - 1);
    const leaves = snapshot.nodes.filter((node) => node.leaf);
    if (leaves.length !== realSegments + dummyCount) {
      add(['nodes'], `a full ${snapshot.k}-ary tree needs ${dummyCount} dummy leaves`);
    }
    if (realSegments === 1 && snapshot.nodes.length !== 1) {
      add(['nodes'], 'a single segment needs no internal node');
    }

    for (let sourceIndex = 0; sourceIndex < realSegments; sourceIndex += 1) {
      const node = nodes.get(`S${sourceIndex}`);
      if (!node) {
        add(['nodes'], `missing real leaf S${sourceIndex}`);
        continue;
      }
      if (!node.leaf || node.virtual || node.sourceIndex !== sourceIndex) {
        add(['nodes', node.id], 'real leaf metadata is inconsistent');
      }
      if (node.weight !== snapshot.segmentWeights[sourceIndex]) {
        add(['nodes', node.id, 'weight'], 'real leaf weight must equal its segment length');
      }
    }
    for (let index = 0; index < dummyCount; index += 1) {
      const node = nodes.get(`V${index}`);
      if (!node) {
        add(['nodes'], `missing virtual leaf V${index}`);
        continue;
      }
      if (!node.leaf || !node.virtual || node.sourceIndex !== null || node.weight !== 0) {
        add(['nodes', node.id], 'dummy leaves are zero-weight virtual leaves');
      }
    }

    const referenced = new Map<string, string>();
    let internalCount = 0;
    for (const node of snapshot.nodes) {
      if (node.leaf) {
        if (node.children.length !== 0) add(['nodes', node.id], 'a leaf has no children');
        if (node.virtual && node.weight !== 0) add(['nodes', node.id], 'virtual leaves have weight 0');
        continue;
      }
      internalCount += 1;
      if (node.virtual) add(['nodes', node.id], 'only leaves may be virtual');
      if (node.sourceIndex !== null) add(['nodes', node.id], 'internal nodes have no source index');
      if (node.children.length !== snapshot.k) {
        add(['nodes', node.id], `an internal node must have ${snapshot.k} children`);
      }
      let sum = 0;
      for (const childId of node.children) {
        const child = nodes.get(childId);
        if (!child) {
          add(['nodes', node.id], `unknown child "${childId}"`);
          continue;
        }
        if (referenced.has(childId)) add(['nodes', node.id], `node "${childId}" already has a parent`);
        referenced.set(childId, node.id);
        sum += child.weight;
      }
      if (node.weight !== sum) add(['nodes', node.id, 'weight'], 'parent weight must equal the child sum');
    }
    if (internalCount === 0 && snapshot.operation === 'done' && realSegments > 1) {
      add(['nodes'], 'more than one segment needs an internal root');
    }
    if (snapshot.nodes.length > OPTIMAL_MAX_NODES) add(['nodes'], 'too many nodes');

    const roots = snapshot.nodes.filter((node) => !referenced.has(node.id)).map((node) => node.id);
    if (roots.length !== snapshot.forestIds.length ||
      roots.join(',') !== snapshot.forestIds.join(',')) {
      add(['forestIds'], 'forestIds must list every parentless root');
    }

    const realInternalCost = snapshot.nodes
      .filter((node) => !node.leaf)
      .reduce((sum, node) => sum + node.weight, 0);
    if (snapshot.totalCost !== realInternalCost) {
      add(['totalCost'], 'totalCost must equal the sum of all internal weights');
    }
    if (snapshot.combines !== internalCount) add(['combines'], 'combine count must equal internal nodes');

    if (snapshot.operation === 'init') {
      if (snapshot.selectedIds.length !== 0 || snapshot.newNodeId !== null) {
        add(['operation'], 'init has no selected group');
      }
      if (snapshot.totalCost !== 0 || snapshot.combines !== 0) add(['totalCost'], 'init starts at zero');
      if (snapshot.forestIds.length !== leaves.length) add(['forestIds'], 'init starts with every leaf');
      if (snapshot.nodes.some((node) => !node.leaf)) add(['nodes'], 'init contains leaves only');
    }
    if (snapshot.operation === 'combine') {
      if (snapshot.selectedIds.length !== snapshot.k) {
        add(['selectedIds'], `combine needs exactly ${snapshot.k} roots`);
      }
      if (snapshot.newNodeId === null) add(['newNodeId'], 'combine needs a new parent');
      const parent = snapshot.newNodeId ? nodes.get(snapshot.newNodeId) : undefined;
      if (!parent || parent.leaf) add(['newNodeId'], 'new node must be an internal node');
      if (parent && parent.children.join(',') !== snapshot.selectedIds.join(',')) {
        add(['newNodeId'], 'new node children must be the selected roots');
      }
      if (parent && snapshot.costAdded !== parent.weight) {
        add(['costAdded'], 'costAdded must be the parent weight');
      }
      if (parent && !snapshot.forestIds.includes(parent.id)) add(['forestIds'], 'new parent must enter the forest');
    }
    if (snapshot.operation !== 'combine' && snapshot.costAdded !== 0) {
      add(['costAdded'], 'costAdded is only non-zero on a combine frame');
    }

    const done = snapshot.operation === 'done';
    if (done) {
      if (snapshot.result !== 'built') add(['result'], 'done requires a built tree');
      if (snapshot.forestIds.length !== 1) add(['forestIds'], 'done leaves exactly one root');
      if (snapshot.selectedIds.length !== 0) add(['selectedIds'], 'done has no active selection');
      if (snapshot.newNodeId !== null) add(['newNodeId'], 'done has no new node');
      if (snapshot.costAdded !== 0) add(['costAdded'], 'done has no newly added cost');
    } else if (snapshot.result !== null) {
      add(['result'], 'only done may declare a result');
    }
  });

export type OptimalSnapshot = z.infer<typeof optimalSnapshotSchema>;
