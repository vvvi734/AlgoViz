/**
 * TEXTBOOK-09: validated B+ tree snapshots.
 *
 * This is deliberately NOT a renamed B-tree schema. Internal nodes only hold
 * separators: key i must equal the minimum record of child i+1. Records exist
 * only in leaves, every leaf is linked by `next`, and every leaf sits at one
 * depth. Split metadata distinguishes leaf splits from index splits.
 */
import { z } from 'zod';

export const BPLUS_ORDER = 4 as const;
export const BPLUS_MAX_KEYS = BPLUS_ORDER - 1;
export const BPLUS_MAX_NODES = 72;

const ID = z.string().min(1).max(80);

export const BPLUS_COMMANDS = ['find', 'insert', 'range'] as const;
export type BplusTreeCommand = (typeof BPLUS_COMMANDS)[number];

export const BPLUS_OPERATIONS = [
  'init',
  'inspect-internal',
  'descend',
  'inspect-leaf',
  'found',
  'not-found',
  'duplicate',
  'insert-leaf',
  'split-leaf',
  'split-internal',
  'new-root',
  'range-start',
  'range-scan',
  'range-end',
  'done',
] as const;
export type BplusTreeOperation = (typeof BPLUS_OPERATIONS)[number];

export const BPLUS_RESULTS = ['found', 'not-found', 'inserted', 'duplicate', 'range'] as const;
export type BplusTreeResult = (typeof BPLUS_RESULTS)[number];

export const bplusNodeSchema = z.object({
  id: ID,
  keys: z.array(z.number().finite()).max(BPLUS_MAX_KEYS),
  children: z.array(ID).max(BPLUS_ORDER),
  leaf: z.boolean(),
  next: ID.nullable(),
});
export type BplusNode = z.infer<typeof bplusNodeSchema>;

export const bplusSplitSchema = z.object({
  nodeId: ID,
  phase: z.literal('after'),
  leftId: ID,
  rightId: ID,
  promotedKey: z.number().finite(),
  parentId: ID,
  rootChanged: z.boolean(),
});
export type BplusSplit = z.infer<typeof bplusSplitSchema>;

export const bplusSnapshotSchema = z
  .object({
    kind: z.literal('bplus-tree'),
    order: z.literal(BPLUS_ORDER),
    preset: z.string().max(200).nullable(),
    command: z.enum(BPLUS_COMMANDS),
    operation: z.enum(BPLUS_OPERATIONS),
    targetValue: z.number().finite(),
    rangeEnd: z.number().finite(),
    rootId: ID.nullable(),
    nodes: z.array(bplusNodeSchema).max(BPLUS_MAX_NODES),
    leafOrder: z.array(ID).max(BPLUS_MAX_NODES),
    currentNodeId: ID.nullable(),
    pathIds: z.array(ID).max(24),
    compareIndex: z.number().int().min(0).max(BPLUS_MAX_KEYS - 1).nullable(),
    compareKey: z.number().finite().nullable(),
    childSlot: z.number().int().min(0).max(BPLUS_ORDER - 1).nullable(),
    childId: ID.nullable(),
    split: bplusSplitSchema.nullable(),
    insertedKey: z.number().finite().nullable(),
    rangeKeys: z.array(z.number().finite()).max(BPLUS_MAX_NODES * BPLUS_MAX_KEYS),
    rangeLeafIds: z.array(ID).max(BPLUS_MAX_NODES),
    result: z.enum(BPLUS_RESULTS).nullable(),
  })
  .superRefine((snapshot, ctx) => {
    const add = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
    const byId = new Map<string, BplusNode>();
    snapshot.nodes.forEach((node, index) => {
      if (byId.has(node.id)) add(['nodes', index, 'id'], `duplicate B+ node id "${node.id}"`);
      byId.set(node.id, node);
      if (node.leaf) {
        if (node.keys.length < 1) add(['nodes', index, 'keys'], 'a B+ leaf must contain at least one record');
        if (node.children.length !== 0) add(['nodes', index, 'children'], 'a B+ leaf cannot own children');
      } else {
        if (node.keys.length < 1) add(['nodes', index, 'keys'], 'an internal B+ node needs at least one separator');
        if (node.children.length !== node.keys.length + 1) {
          add(['nodes', index, 'children'], 'an internal B+ node needs exactly keys.length + 1 children');
        }
        if (node.next !== null) add(['nodes', index, 'next'], 'only leaves use the next link');
      }
    });
    snapshot.nodes.forEach((node, index) => {
      if (node.next !== null && !byId.has(node.next)) {
        add(['nodes', index, 'next'], `next "${node.next}" is not a node`);
      }
    });

    if (snapshot.nodes.length === 0) {
      if (snapshot.rootId !== null) add(['rootId'], 'an empty B+ tree has rootId = null');
      if (snapshot.leafOrder.length !== 0) add(['leafOrder'], 'an empty B+ tree has no leaf chain');
    } else if (snapshot.rootId === null || !byId.has(snapshot.rootId)) {
      add(['rootId'], 'rootId must refer to a real node');
    }

    const parentCount = new Map<string, number>();
    snapshot.nodes.forEach((node, index) => {
      for (const ref of node.children) {
        if (!byId.has(ref)) add(['nodes', index, 'children'], `child "${ref}" is not attached`);
        parentCount.set(ref, (parentCount.get(ref) ?? 0) + 1);
      }
    });
    for (const [id, count] of parentCount) {
      if (count > 1) add(['nodes'], `node "${id}" has multiple parents`);
    }
    if (snapshot.rootId !== null && (parentCount.get(snapshot.rootId) ?? 0) > 0) {
      add(['rootId'], 'the root must have no parent');
    }

    const leaves: BplusNode[] = [];
    const depths = new Set<number>();
    const records = new Set<number>();
    const walk = (id: string, lower: number, upper: number, depth: number): number[] => {
      const node = byId.get(id);
      if (!node) return [];
      if (node.leaf) {
        depths.add(depth);
        leaves.push(node);
        const result: number[] = [];
        node.keys.forEach((key, index) => {
          if (index > 0 && node.keys[index - 1] >= key) {
            add(['nodes', id, 'keys', index], 'leaf records must strictly increase');
          }
          if (key < lower || key >= upper) {
            add(['nodes', id, 'keys', index], 'record is outside the interval owned by this leaf');
          }
          if (records.has(key)) add(['nodes', id, 'keys', index], 'duplicate record in the B+ tree');
          records.add(key);
          result.push(key);
        });
        return result;
      }
      node.keys.forEach((key, index) => {
        if (index > 0 && node.keys[index - 1] >= key) {
          add(['nodes', id, 'keys', index], 'separators must strictly increase');
        }
      });
      if (node.children.length !== node.keys.length + 1) return [];
      const all: number[] = [];
      for (let slot = 0; slot < node.children.length; slot += 1) {
        const childLower = slot === 0 ? lower : node.keys[slot - 1];
        const childUpper = slot === node.keys.length ? upper : node.keys[slot];
        const childRecords = walk(node.children[slot], childLower, childUpper, depth + 1);
        all.push(...childRecords);
        if (slot > 0 && childRecords.length > 0 && childRecords[0] !== node.keys[slot - 1]) {
          add(['nodes', id, 'keys', slot - 1], 'separator must equal the minimum record of its right child');
        }
      }
      return all;
    };
    const root = snapshot.rootId === null ? undefined : byId.get(snapshot.rootId);
    if (root) {
      if (!root.leaf && root.children.length < 2) {
        add(['rootId'], 'a non-leaf root needs at least two children');
      }
      walk(snapshot.rootId as string, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, 0);
    }
    if (depths.size > 1) add(['nodes'], 'all B+ leaves must be at the same depth');
    const leafSet = new Set(leaves.map((leaf) => leaf.id));
    if (snapshot.nodes.length > 0 && leaves.length === 0) add(['nodes'], 'a non-empty B+ tree needs leaves');

    // The leaf chain must be exactly the in-order leaf order.
    const expectedLeaves: string[] = [];
    let node = root;
    while (node && !node.leaf) node = byId.get(node.children[0]);
    while (node) {
      expectedLeaves.push(node.id);
      node = node.next === null ? undefined : byId.get(node.next);
      if (expectedLeaves.length > leaves.length) break;
    }
    if (expectedLeaves.length !== leaves.length) {
      add(['leafOrder'], 'next links must form one chain through every leaf');
    }
    if (JSON.stringify(snapshot.leafOrder) !== JSON.stringify(expectedLeaves)) {
      add(['leafOrder'], 'leafOrder must list the real next chain');
    }
    snapshot.leafOrder.forEach((id, index) => {
      if (!leafSet.has(id)) add(['leafOrder', index], `leafOrder entry "${id}" is not a leaf`);
    });
    for (const leaf of leaves) {
      if (!snapshot.leafOrder.includes(leaf.id)) add(['nodes', leaf.id], 'leaf is missing from leafOrder');
    }
    for (let index = 1; index < snapshot.leafOrder.length; index += 1) {
      const previous = byId.get(snapshot.leafOrder[index - 1]);
      const current = byId.get(snapshot.leafOrder[index]);
      if (previous && current && previous.keys[previous.keys.length - 1] >= current.keys[0]) {
        add(['leafOrder', index], 'leaf chain records must be strictly increasing across the link');
      }
    }

    if (snapshot.currentNodeId === null) {
      if (snapshot.pathIds.length > 0) add(['pathIds'], 'a frame without a current node needs an empty path');
    } else {
      if (!byId.has(snapshot.currentNodeId)) add(['currentNodeId'], 'current node is not attached');
      if (snapshot.pathIds[snapshot.pathIds.length - 1] !== snapshot.currentNodeId) {
        add(['pathIds'], 'path must end at the current node');
      }
    }
    snapshot.pathIds.forEach((id, index) => {
      if (!byId.has(id)) add(['pathIds', index], `path node "${id}" is not attached`);
      if (index === 0 && id !== snapshot.rootId) add(['pathIds', 0], 'path must start at the root');
      if (index > 0) {
        const parent = byId.get(snapshot.pathIds[index - 1]);
        if (!parent || !parent.children.includes(id)) add(['pathIds', index], 'path must follow real children');
      }
    });

    if (snapshot.compareIndex !== null || snapshot.compareKey !== null) {
      if (snapshot.compareIndex === null || snapshot.compareKey === null) {
        add(['compareIndex'], 'compareIndex and compareKey appear together');
      } else if (snapshot.currentNodeId !== null) {
        const current = byId.get(snapshot.currentNodeId);
        if (!current || current.keys[snapshot.compareIndex] !== snapshot.compareKey) {
          add(['compareKey'], 'compareKey must be the current node key at compareIndex');
        }
      }
    }
    if (snapshot.childSlot !== null || snapshot.childId !== null) {
      if (snapshot.childSlot === null || snapshot.childId === null) {
        add(['childSlot'], 'childSlot and childId appear together');
      } else if (snapshot.currentNodeId !== null) {
        const current = byId.get(snapshot.currentNodeId);
        if (!current || current.children[snapshot.childSlot] !== snapshot.childId) {
          add(['childId'], 'childId must be the real child at childSlot');
        }
      }
    }

    const allowed: Record<BplusTreeCommand, BplusTreeOperation[]> = {
      find: ['init', 'inspect-internal', 'descend', 'inspect-leaf', 'found', 'not-found', 'done'],
      insert: ['init', 'inspect-internal', 'descend', 'duplicate', 'insert-leaf', 'split-leaf', 'split-internal', 'new-root', 'done'],
      range: ['init', 'inspect-internal', 'descend', 'range-start', 'range-scan', 'range-end', 'done'],
    };
    if (!allowed[snapshot.command].includes(snapshot.operation)) {
      add(['operation'], `${snapshot.operation} is not a ${snapshot.command} operation`);
    }

    if (snapshot.operation === 'init') {
      if (snapshot.result !== null) add(['result'], 'init has no result');
      if (snapshot.split !== null || snapshot.insertedKey !== null) add(['split'], 'init changes nothing');
      if (snapshot.rangeKeys.length > 0) add(['rangeKeys'], 'init has no range result');
    }
    if (snapshot.operation === 'inspect-internal' || snapshot.operation === 'inspect-leaf') {
      if (snapshot.currentNodeId === null) add(['currentNodeId'], 'an inspection needs a current node');
      if (snapshot.compareIndex === null || snapshot.compareKey === null) {
        add(['compareIndex'], 'an inspection must record the compared key');
      }
      if (snapshot.result !== null) add(['result'], 'an inspection has no final result');
      if (snapshot.split !== null || snapshot.insertedKey !== null) add(['split'], 'an inspection changes nothing');
    }
    if (snapshot.operation === 'inspect-internal') {
      if (snapshot.currentNodeId !== null && byId.get(snapshot.currentNodeId)?.leaf) {
        add(['currentNodeId'], 'inspect-internal must name an internal node');
      }
    }
    if (snapshot.operation === 'inspect-leaf') {
      if (snapshot.currentNodeId !== null && !byId.get(snapshot.currentNodeId)?.leaf) {
        add(['currentNodeId'], 'inspect-leaf must name a leaf');
      }
    }
    if (snapshot.operation === 'descend') {
      if (snapshot.currentNodeId === null) add(['currentNodeId'], 'descend needs an internal node');
      if (snapshot.childSlot === null || snapshot.childId === null) add(['childSlot'], 'descend needs a selected child');
      if (snapshot.compareIndex !== null || snapshot.compareKey !== null) {
        add(['compareIndex'], 'descend has no key comparison');
      }
      if (snapshot.result !== null) add(['result'], 'descend is not terminal');
    }
    if (snapshot.operation === 'found') {
      if (snapshot.currentNodeId === null) add(['currentNodeId'], 'found needs a leaf');
      else if (!byId.get(snapshot.currentNodeId)?.leaf) add(['currentNodeId'], 'a B+ hit must be in a leaf');
      if (snapshot.compareKey !== snapshot.targetValue) add(['compareKey'], 'found must compare the target');
      if (snapshot.result !== 'found') add(['result'], 'found records success');
    }
    if (snapshot.operation === 'not-found') {
      if (snapshot.result !== 'not-found') add(['result'], 'not-found records failure');
      if (snapshot.split !== null || snapshot.insertedKey !== null) add(['split'], 'not-found changes nothing');
    }
    if (snapshot.operation === 'duplicate') {
      if (snapshot.currentNodeId === null) add(['currentNodeId'], 'duplicate needs the leaf that owns the key');
      const current = snapshot.currentNodeId === null ? undefined : byId.get(snapshot.currentNodeId);
      if (!current || !current.keys.includes(snapshot.targetValue)) add(['targetValue'], 'duplicate key must exist in the leaf');
      if (snapshot.result !== 'duplicate') add(['result'], 'duplicate records rejection');
      if (snapshot.split !== null || snapshot.insertedKey !== null) add(['split'], 'duplicate changes nothing');
    }
    if (snapshot.operation === 'insert-leaf') {
      if (snapshot.currentNodeId === null) add(['currentNodeId'], 'insert-leaf needs the destination leaf');
      else if (!byId.get(snapshot.currentNodeId)?.leaf) add(['currentNodeId'], 'insert-leaf must end at a leaf');
      const current = snapshot.currentNodeId === null ? undefined : byId.get(snapshot.currentNodeId);
      if (!current || !current.keys.includes(snapshot.targetValue)) add(['targetValue'], 'target must exist after insertion');
      if (snapshot.insertedKey !== snapshot.targetValue) add(['insertedKey'], 'insertedKey equals targetValue');
      if (snapshot.result !== 'inserted') add(['result'], 'insert-leaf records insertion');
      if (snapshot.split !== null) add(['split'], 'insert-leaf itself is not a split frame');
    }
    if (snapshot.operation === 'split-leaf' || snapshot.operation === 'split-internal' || snapshot.operation === 'new-root') {
      if (snapshot.split === null) add(['split'], 'a split frame needs split details');
      if (snapshot.result !== null) add(['result'], 'a split frame is not terminal');
      if (snapshot.insertedKey !== null) add(['insertedKey'], 'a split frame does not report insertion yet');
      if (snapshot.childSlot !== null || snapshot.childId !== null) add(['childSlot'], 'a split frame has no selected child');
    }
    if (snapshot.operation === 'range-start') {
      if (snapshot.currentNodeId === null) add(['currentNodeId'], 'range-start needs the first leaf');
      else if (!byId.get(snapshot.currentNodeId)?.leaf) add(['currentNodeId'], 'range-start must name a leaf');
      if (snapshot.result !== null) add(['result'], 'range-start is not terminal');
      if (snapshot.rangeLeafIds.length !== 1 || snapshot.rangeLeafIds[0] !== snapshot.currentNodeId) {
        add(['rangeLeafIds'], 'range-start lists exactly the starting leaf');
      }
      if (snapshot.rangeKeys.length !== 0) add(['rangeKeys'], 'range-start has not collected records');
    }
    if (snapshot.operation === 'range-scan') {
      if (snapshot.currentNodeId === null) add(['currentNodeId'], 'range-scan needs a leaf');
      if (snapshot.compareKey === null) add(['compareKey'], 'range-scan must name the collected key');
      const key = snapshot.compareKey;
      if (key !== null && (key < snapshot.targetValue || key > snapshot.rangeEnd)) {
        add(['compareKey'], 'range-scan key must lie inside [low, high]');
      }
      if (key !== null && !snapshot.rangeKeys.includes(key)) add(['rangeKeys'], 'range-scan key must be collected');
      if (snapshot.result !== null) add(['result'], 'range-scan is not terminal');
      if (snapshot.split !== null || snapshot.insertedKey !== null) add(['split'], 'range-scan changes nothing');
    }
    if (snapshot.operation === 'range-end' || snapshot.operation === 'done') {
      if (snapshot.result === null) add(['result'], 'a terminal frame needs a result');
      if (snapshot.operation === 'range-end' && snapshot.result !== 'range') {
        add(['result'], 'range-end reports a range result');
      }
      if (snapshot.split !== null || snapshot.insertedKey !== null) add(['split'], 'terminal frames change nothing');
    }
    if (snapshot.operation === 'done') {
      if (snapshot.command === 'find' && !['found', 'not-found'].includes(snapshot.result ?? '')) {
        add(['result'], 'find must finish found or not-found');
      }
      if (snapshot.command === 'insert' && !['inserted', 'duplicate'].includes(snapshot.result ?? '')) {
        add(['result'], 'insert must finish inserted or duplicate');
      }
      if (snapshot.command === 'range' && snapshot.result !== 'range') {
        add(['result'], 'range must finish with a range result');
      }
      if (snapshot.currentNodeId !== null || snapshot.pathIds.length > 0) {
        add(['currentNodeId'], 'done releases the path');
      }
    }

    // Range collections must be a real in-order slice of the leaf records.
    const ordered = snapshot.leafOrder.flatMap((id) => byId.get(id)?.keys ?? []);
    const start = ordered.findIndex((key) => key === snapshot.rangeKeys[0]);
    if (snapshot.rangeKeys.length > 0) {
      if (start < 0) add(['rangeKeys'], 'rangeKeys must start at a real record');
      else if (JSON.stringify(ordered.slice(start, start + snapshot.rangeKeys.length)) !== JSON.stringify(snapshot.rangeKeys)) {
        add(['rangeKeys'], 'rangeKeys must be an ordered slice of leaf records');
      }
      for (const id of snapshot.rangeLeafIds) {
        if (!leafSet.has(id)) add(['rangeLeafIds'], `range leaf "${id}" is not a leaf`);
      }
      if (snapshot.rangeLeafIds.length > 0) {
        const first = snapshot.leafOrder.indexOf(snapshot.rangeLeafIds[0]);
        const slice = snapshot.leafOrder.slice(first, first + snapshot.rangeLeafIds.length);
        if (JSON.stringify(slice) !== JSON.stringify(snapshot.rangeLeafIds)) {
          add(['rangeLeafIds'], 'range leaves must be consecutive in the leaf chain');
        }
      }
    }

    const split = snapshot.split;
    if (split !== null) {
      const expectedOperation =
        split.rootChanged ? 'new-root' : byId.get(split.leftId)?.leaf ? 'split-leaf' : 'split-internal';
      if (snapshot.operation !== expectedOperation) {
        add(['operation'], `${expectedOperation} must carry this split`);
      }
      if (!byId.has(split.leftId) || !byId.has(split.rightId) || !byId.has(split.parentId)) {
        add(['split'], 'split results and parent must be attached');
      } else {
        if (split.nodeId !== split.leftId) add(['split', 'nodeId'], 'the original id survives as the left node');
        const left = byId.get(split.leftId);
        const right = byId.get(split.rightId);
        const parent = byId.get(split.parentId);
        if (left && right && left.leaf !== right.leaf) add(['split', 'rightId'], 'both split results must have the same leaf flag');
        if (left && left.leaf) {
          if (left.keys.length !== 2 || right?.keys.length !== 2) {
            add(['split'], 'a leaf split leaves two records on each side');
          }
          if (left.next !== right?.id) add(['split', 'leftId'], 'the left leaf must point to the new right leaf');
        } else if (left && right) {
          if (left.keys.length !== 2 || right.keys.length !== 1) {
            add(['split'], 'an order-4 internal split leaves two and one separator');
          }
          if (left.children.length !== 3 || right.children.length !== 2) {
            add(['split'], 'an internal split leaves three and two children');
          }
        }
        if (parent) {
          const index = parent.keys.indexOf(split.promotedKey);
          if (index < 0) add(['split', 'promotedKey'], 'the promoted separator must be in the parent');
          else if (parent.children[index] !== split.leftId || parent.children[index + 1] !== split.rightId) {
            add(['split'], 'parent slots must place the split results around the separator');
          }
        }
        if (split.rootChanged) {
          if (split.parentId !== snapshot.rootId) add(['split', 'rootChanged'], 'root split creates the new root');
          if (snapshot.rootId !== null && snapshot.nodes.filter((node) => node.id === snapshot.rootId)[0]?.keys.length !== 1) {
            add(['split', 'rootChanged'], 'a new root after a split has one separator');
          }
        }
      }
    }
  });

export type BplusTreeSnapshot = z.infer<typeof bplusSnapshotSchema>;
